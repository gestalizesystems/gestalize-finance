import { Save, CreditCard, Mail, MessageCircle, Clock, CheckCircle2, XCircle, CheckCheck } from "lucide-react";
import { gatewayMode } from "@/lib/asaas";
import { emailEnabled } from "@/lib/email";
import { whatsappEnabled } from "@/lib/whatsapp";
import { getSettings, SETTING_KEYS } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import { MaskedInput } from "@/components/MaskedInput";
import { saveCompanySettings } from "../actions";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const cfg = await getSettings([
    SETTING_KEYS.companyName,
    SETTING_KEYS.companyCnpj,
    SETTING_KEYS.companyEmail,
    SETTING_KEYS.companyPhone,
    SETTING_KEYS.companyPix,
    SETTING_KEYS.companyAddress,
  ]);

  const gateway = gatewayMode();
  const integrations = [
    { icon: CreditCard, name: "Pagamentos (Asaas)", on: gateway !== "mock", detail: gateway.toUpperCase() },
    { icon: Mail, name: "E-mail (Resend)", on: emailEnabled(), detail: emailEnabled() ? "Configurado" : "Sem chave" },
    { icon: MessageCircle, name: "WhatsApp (Evolution)", on: whatsappEnabled(), detail: whatsappEnabled() ? "Configurado" : "Sem chave" },
    { icon: Clock, name: "Cron diário", on: true, detail: "Agendado" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" subtitle="Dados da empresa e status das integrações." />

      {searchParams.saved && (
        <div className="flex items-center gap-2 rounded-xl border border-positive/30 bg-positive/10 px-4 py-3 text-sm font-medium text-positive">
          <CheckCheck className="h-4 w-4" /> Configurações salvas com sucesso!
        </div>
      )}

      {/* Dados da empresa */}
      <form action={saveCompanySettings} className="card space-y-4">
        <h3 className="font-semibold text-white">Dados da empresa</h3>
        <p className="-mt-2 text-sm text-slate-400">
          Aparecem nas cobranças (variável <span className="font-mono text-brand-400">{"{empresa}"}</span>) e no cabeçalho dos relatórios.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Nome / Razão social</label>
            <input name="companyName" defaultValue={cfg[SETTING_KEYS.companyName]} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">CNPJ</label>
            <MaskedInput name="companyCnpj" mask="cpfcnpj" defaultValue={cfg[SETTING_KEYS.companyCnpj]} placeholder="00.000.000/0000-00" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">E-mail</label>
            <input name="companyEmail" type="email" defaultValue={cfg[SETTING_KEYS.companyEmail]} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Telefone / WhatsApp</label>
            <MaskedInput name="companyPhone" mask="phone" defaultValue={cfg[SETTING_KEYS.companyPhone]} placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Chave Pix</label>
            <input name="companyPix" defaultValue={cfg[SETTING_KEYS.companyPix]} className="input" placeholder="CNPJ, e-mail, telefone ou aleatória" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Endereço</label>
            <input name="companyAddress" defaultValue={cfg[SETTING_KEYS.companyAddress]} className="input" />
          </div>
        </div>
        <button className="btn-primary"><Save className="h-4 w-4" /> Salvar</button>
      </form>

      {/* Integrações */}
      <div className="card">
        <h3 className="mb-1 font-semibold text-white">Integrações</h3>
        <p className="mb-4 text-sm text-slate-400">
          As chaves de API ficam nas variáveis de ambiente (Railway), por segurança — aqui você acompanha o status.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {integrations.map((i) => {
            const Icon = i.icon;
            return (
              <div key={i.name} className="flex items-center gap-3 rounded-xl border border-ink-700/60 bg-ink-900 p-3.5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${i.on ? "bg-positive/15 text-positive" : "bg-slate-500/15 text-slate-400"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{i.name}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    {i.on ? <CheckCircle2 className="h-3.5 w-3.5 text-positive" /> : <XCircle className="h-3.5 w-3.5 text-slate-500" />}
                    {i.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
