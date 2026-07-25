// Envio de WhatsApp via Evolution API (open-source, self-hosted) — REST, sem SDK.
// Funciona só quando EVOLUTION_BASE_URL + EVOLUTION_INSTANCE + EVOLUTION_API_KEY
// estão definidos; caso contrário, "pula" silenciosamente.

import { onlyDigits } from "./masks";
import { formatCurrency, formatDate } from "./utils";
import {
  getSettings,
  applyTemplate,
  SETTING_KEYS,
} from "./settings";

const BASE_URL = (process.env.EVOLUTION_BASE_URL || "").replace(/\/+$/, "");
const INSTANCE = process.env.EVOLUTION_INSTANCE;
const API_KEY = process.env.EVOLUTION_API_KEY;

export function whatsappEnabled() {
  return Boolean(BASE_URL && INSTANCE && API_KEY);
}

// Normaliza p/ DDI+DDD+numero, só dígitos (ex: 5511999999999).
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
  if (!whatsappEnabled()) return { ok: false, skipped: true };
  const number = normalizePhone(phone);
  if (!number) return { ok: false, skipped: true };

  const res = await fetch(`${BASE_URL}/message/sendText/${INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: API_KEY as string,
    },
    body: JSON.stringify({ number, text: message }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Evolution ${res.status}: ${body}`);
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

export async function renderInvoiceWhatsApp(d: InvoiceWaData): Promise<string> {
  const cfg = await getSettings([SETTING_KEYS.waTemplate, SETTING_KEYS.companyName]);
  return applyTemplate(cfg[SETTING_KEYS.waTemplate], {
    cliente: d.clientName,
    valor: formatCurrency(d.amount),
    vencimento: formatDate(d.dueDate),
    descricao: d.description,
    link: d.paymentLink ?? "",
    empresa: cfg[SETTING_KEYS.companyName],
  });
}
