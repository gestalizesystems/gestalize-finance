// Envio de e-mails via API REST do Resend (sem SDK).
// Funciona só quando RESEND_API_KEY está definido; caso contrário, "pula"
// silenciosamente (útil em dev / antes de configurar).

import { formatCurrency, formatDate } from "./utils";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Em produção, use um remetente de domínio verificado no Resend
// (ex: "Gestalize Finance <cobranca@gestalizesystems.com.br>").
// Sem isso, cai no domínio de teste do Resend.
const FROM =
  process.env.RESEND_FROM || "Gestalize Finance <onboarding@resend.dev>";
const COMPANY = process.env.COMPANY_NAME || "Gestalize Systems";

export function emailEnabled() {
  return Boolean(RESEND_API_KEY);
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!RESEND_API_KEY) return { ok: false, skipped: true };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
  return { ok: true };
}

// ---------- Template de cobrança ----------

type InvoiceEmailData = {
  clientName: string;
  description: string;
  amount: unknown;
  dueDate: Date | string;
  paymentLink?: string | null;
};

export function renderInvoiceEmail(d: InvoiceEmailData): {
  subject: string;
  html: string;
} {
  const valor = formatCurrency(d.amount);
  const venc = formatDate(d.dueDate);
  const subject = `Cobrança ${COMPANY} — ${valor} (vence ${venc})`;

  const botao = d.paymentLink
    ? `<a href="${d.paymentLink}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:10px;font-size:15px">Pagar agora</a>`
    : "";

  const html = `
  <div style="background:#f4f7fc;padding:32px 0;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eef2f9">
      <div style="background:#0b1020;padding:22px 28px;color:#ffffff;font-size:18px;font-weight:700">
        ${COMPANY}
      </div>
      <div style="padding:28px">
        <p style="color:#1e293b;font-size:16px;margin:0 0 14px">Olá, ${d.clientName}! 👋</p>
        <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px">
          Segue a cobrança referente a <strong>${d.description}</strong>.
        </p>
        <div style="background:#f6f8fc;border:1px solid #eef2f9;border-radius:12px;padding:18px 20px;margin:0 0 22px">
          <p style="margin:0;color:#64748b;font-size:13px">Valor</p>
          <p style="margin:4px 0 12px;color:#0f172a;font-size:26px;font-weight:800">${valor}</p>
          <p style="margin:0;color:#64748b;font-size:13px">Vencimento</p>
          <p style="margin:4px 0 0;color:#0f172a;font-size:16px;font-weight:600">${venc}</p>
        </div>
        ${botao ? `<div style="text-align:center;margin:0 0 8px">${botao}</div>` : ""}
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:18px 0 0">
          Em caso de dúvidas, responda este e-mail.
        </p>
      </div>
      <div style="background:#f6f8fc;padding:16px;text-align:center;color:#94a3b8;font-size:12px">
        © ${new Date().getFullYear()} ${COMPANY}
      </div>
    </div>
  </div>`;

  return { subject, html };
}
