// Envio de WhatsApp via API REST do Z-API (sem SDK).
// Funciona só quando ZAPI_INSTANCE_ID + ZAPI_INSTANCE_TOKEN estão definidos;
// caso contrário, "pula" silenciosamente.

import { onlyDigits } from "./masks";
import { formatCurrency, formatDate } from "./utils";

const INSTANCE = process.env.ZAPI_INSTANCE_ID;
const TOKEN = process.env.ZAPI_INSTANCE_TOKEN;
const CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN; // "Account Security Token"
const COMPANY = process.env.COMPANY_NAME || "Gestalize Systems";

export function whatsappEnabled() {
  return Boolean(INSTANCE && TOKEN);
}

// Normaliza p/ o formato do Z-API: DDI+DDD+numero, só dígitos (ex: 5511999999999).
function normalizePhone(raw?: string | null): string | null {
  let d = onlyDigits(raw ?? "");
  if (!d) return null;
  if (d.length <= 11 && !d.startsWith("55")) d = "55" + d;
  return d;
}

export async function sendWhatsApp({
  phone,
  message,
}: {
  phone?: string | null;
  message: string;
}): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!INSTANCE || !TOKEN) return { ok: false, skipped: true };
  const to = normalizePhone(phone);
  if (!to) return { ok: false, skipped: true };

  const res = await fetch(
    `https://api.z-api.io/instances/${INSTANCE}/token/${TOKEN}/send-text`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(CLIENT_TOKEN ? { "Client-Token": CLIENT_TOKEN } : {}),
      },
      body: JSON.stringify({ phone: to, message }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Z-API ${res.status}: ${body}`);
  }
  return { ok: true };
}

// ---------- Template de cobrança (texto WhatsApp) ----------

type InvoiceWaData = {
  clientName: string;
  description: string;
  amount: unknown;
  dueDate: Date | string;
  paymentLink?: string | null;
};

export function renderInvoiceWhatsApp(d: InvoiceWaData): string {
  const valor = formatCurrency(d.amount);
  const venc = formatDate(d.dueDate);
  const link = d.paymentLink ? `\n\n👉 Pagar agora: ${d.paymentLink}` : "";
  return (
    `Olá, ${d.clientName}! 👋\n\n` +
    `Você tem uma cobrança da *${COMPANY}*:\n\n` +
    `💰 Valor: *${valor}*\n` +
    `📅 Vencimento: ${venc}\n` +
    `📄 ${d.description}` +
    link +
    `\n\nQualquer dúvida, é só responder por aqui. 🙂`
  );
}
