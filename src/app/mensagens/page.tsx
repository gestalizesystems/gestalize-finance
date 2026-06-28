import { MessageCircle, Mail, Save } from "lucide-react";
import { renderInvoiceEmail } from "@/lib/email";
import { renderInvoiceWhatsApp } from "@/lib/whatsapp";
import { getSettings, SETTING_KEYS, TEMPLATE_VARS } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import { saveMessageTemplates } from "../actions";

export const dynamic = "force-dynamic";

const example = {
  clientName: "João da Silva",
  description: "Mensalidade CRM Empresarial",
  amount: 159.9,
  dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 10),
  paymentLink: "https://www.asaas.com/i/exemplo",
};

export default async function MensagensPage() {
  const cfg = await getSettings([
    SETTING_KEYS.waTemplate,
    SETTING_KEYS.emailSubject,
    SETTING_KEYS.emailBody,
  ]);
  const wa = await renderInvoiceWhatsApp(example);
  const { subject, html } = await renderInvoiceEmail(example);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mensagens"
        subtitle="Edite os modelos de cobrança enviados por WhatsApp e e-mail."
      />

      {/* Variáveis disponíveis */}
      <div className="card">
        <p className="mb-2 text-sm font-medium text-white">Variáveis disponíveis</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_VARS.map((v) => (
            <span key={v.tag} className="rounded-lg border border-ink-700 bg-ink-900 px-2.5 py-1 text-xs text-slate-300" title={v.desc}>
              <span className="font-mono text-brand-400">{v.tag}</span> — {v.desc}
            </span>
          ))}
        </div>
      </div>

      <form action={saveMessageTemplates} className="card space-y-5">
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-white">
            <MessageCircle className="h-4 w-4 text-positive" /> Mensagem do WhatsApp
          </label>
          <textarea name="waTemplate" rows={9} defaultValue={cfg[SETTING_KEYS.waTemplate]} className="input font-mono text-sm leading-relaxed" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-white">
              <Mail className="h-4 w-4 text-brand-400" /> Assunto do e-mail
            </label>
            <input name="emailSubject" defaultValue={cfg[SETTING_KEYS.emailSubject]} className="input" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-white">Corpo do e-mail</label>
            <textarea name="emailBody" rows={5} defaultValue={cfg[SETTING_KEYS.emailBody]} className="input text-sm leading-relaxed" />
            <p className="mt-1 text-xs text-slate-500">O valor, vencimento e o botão de pagamento são adicionados automaticamente no layout.</p>
          </div>
        </div>

        <button className="btn-primary"><Save className="h-4 w-4" /> Salvar modelos</button>
      </form>

      {/* Preview ao vivo */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-semibold text-white">Preview · WhatsApp</h3>
          <div className="rounded-2xl border border-ink-700/60 bg-ink-900 p-4">
            <div className="max-w-sm whitespace-pre-line rounded-2xl rounded-tl-sm bg-ink-800 p-3 text-sm leading-relaxed text-slate-100">
              {wa}
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="mb-2 font-semibold text-white">Preview · E-mail</h3>
          <p className="mb-2 text-xs text-slate-400">Assunto: <span className="font-medium text-slate-200">{subject}</span></p>
          <div className="overflow-hidden rounded-2xl border border-ink-700/60 bg-white">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </div>
    </div>
  );
}
