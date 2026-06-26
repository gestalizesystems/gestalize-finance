// Camada de pagamento (gateway) — Asaas.
// Funciona em modo "mock" (sem conta/chave) e, quando você colocar a
// ASAAS_API_KEY + ASAAS_MODE=sandbox|live, passa a falar com a API real.
//
// Doc Asaas: https://docs.asaas.com/

type CreateChargeInput = {
  customerName: string;
  customerEmail?: string | null;
  customerDocument?: string | null;
  description: string;
  amount: number;
  dueDate: Date;
  externalReference?: string; // id da nossa invoice
};

export type ChargeResult = {
  externalId: string; // id da cobrança no gateway
  paymentLink: string; // link de checkout
  mocked: boolean;
};

const MODE = process.env.ASAAS_MODE ?? "mock";
const API_KEY = process.env.ASAAS_API_KEY ?? "";
const BASE_URL = process.env.ASAAS_BASE_URL ?? "https://sandbox.asaas.com/api/v3";

function isLive() {
  return (MODE === "sandbox" || MODE === "live") && API_KEY.length > 0;
}

// --------- MOCK ---------
function mockCharge(input: CreateChargeInput): ChargeResult {
  const id = "mock_" + Math.random().toString(36).slice(2, 11);
  return {
    externalId: id,
    paymentLink: `https://sandbox.asaas.com/c/${id}`,
    mocked: true,
  };
}

// --------- REAL (Asaas) ---------
async function asaasFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: API_KEY,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Asaas ${res.status}: ${body}`);
  }
  return res.json();
}

async function ensureCustomer(input: CreateChargeInput): Promise<string> {
  const customer = await asaasFetch("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.customerName,
      email: input.customerEmail ?? undefined,
      cpfCnpj: input.customerDocument ?? undefined,
    }),
  });
  return customer.id;
}

export async function createCharge(
  input: CreateChargeInput,
): Promise<ChargeResult> {
  if (!isLive()) return mockCharge(input);

  const customerId = await ensureCustomer(input);
  const charge = await asaasFetch("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "PIX", // Pix por padrão; pode virar UNDEFINED p/ deixar o cliente escolher
      value: input.amount,
      dueDate: input.dueDate.toISOString().slice(0, 10),
      description: input.description,
      externalReference: input.externalReference,
    }),
  });

  return {
    externalId: charge.id,
    paymentLink: charge.invoiceUrl ?? charge.bankSlipUrl ?? "",
    mocked: false,
  };
}

export function gatewayMode() {
  return isLive() ? MODE : "mock";
}
