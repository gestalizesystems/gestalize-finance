import { MessageCircle, Mail } from "lucide-react";
import { renderInvoiceEmail } from "@/lib/email";
import { renderInvoiceWhatsApp } from "@/lib/whatsapp";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const example = {
  clientName: "João da Silva",
  description: "Mensalidade CRM Empresarial",
  amount: 159.9,
  dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 10),
  paymentLink: "https://www.asaas.com/i/exemplo",
};

export default function MensagensPage() {
  const wa = renderInvoiceWhatsApp(example);
  const { subject, html } = renderInvoiceEmail(example);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mensagens"
        subtitle="Modelos de cobrança enviados por WhatsApp e e-mail (com dados de exemplo)."
      />

      <div className="rounded-xl border border-ink-700/60 bg-ink-850 px-4 py-3 text-sm text-slate-300">
        As mensagens são preenchidas automaticamente com os dados de cada cobrança:
        <span className="ml-1 font-medium text-brand-400">cliente, valor, vencimento e link de pagamento</span>.
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* WhatsApp */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-positive/15 text-positive">
              <MessageCircle className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-white">WhatsApp</h3>
          </div>
          <div className="rounded-2xl border border-ink-700/60 bg-ink-900 p-4">
            <div className="max-w-sm rounded-2xl rounded-tl-sm bg-ink-800 p-3 text-sm leading-relaxed text-slate-100 whitespace-pre-line">
              {wa}
            </div>
          </div>
        </div>

        {/* E-mail */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-brand-400">
              <Mail className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-white">E-mail</h3>
          </div>
          <p className="mb-2 text-xs text-slate-400">
            Assunto: <span className="font-medium text-slate-200">{subject}</span>
          </p>
          <div className="overflow-hidden rounded-2xl border border-ink-700/60 bg-white">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </div>
    </div>
  );
}
