import {
  CreditCard,
  Mail,
  MessageCircle,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  Bell,
  CalendarClock,
  AlertTriangle,
  Megaphone,
  ShieldAlert,
} from "lucide-react";
import { gatewayMode } from "@/lib/asaas";
import { emailEnabled } from "@/lib/email";
import { whatsappEnabled } from "@/lib/whatsapp";
import { PageHeader } from "@/components/ui";
import { runBilling } from "../actions";

export const dynamic = "force-dynamic";

const reguaSteps = [
  { icon: Bell, title: "3 dias antes do vencimento", sub: "Lembrete amigável (e-mail + WhatsApp)" },
  { icon: CalendarClock, title: "No dia do vencimento", sub: "Cobrança com link de pagamento" },
  { icon: AlertTriangle, title: "3 dias após o vencimento", sub: "Aviso de pendência" },
  { icon: Megaphone, title: "7 dias após o vencimento", sub: "Cobrança reforçada" },
  { icon: ShieldAlert, title: "15 dias após o vencimento", sub: "Aviso de suspensão" },
];

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`badge ${ok ? "badge-paid" : "bg-slate-500/15 text-slate-400"}`}>
      {ok ? "Ativo" : "Inativo"} · {label}
    </span>
  );
}

export default function AutomacaoPage() {
  const gateway = gatewayMode();
  const gatewayOn = gateway !== "mock";
  const email = emailEnabled();
  const whats = whatsappEnabled();

  const integrations = [
    { icon: CreditCard, name: "Pagamentos (Asaas)", on: gatewayOn, detail: gateway.toUpperCase() },
    { icon: Mail, name: "E-mail (Resend)", on: email, detail: email ? "Configurado" : "Sem chave" },
    { icon: MessageCircle, name: "WhatsApp (Evolution)", on: whats, detail: whats ? "Configurado" : "Sem chave" },
    { icon: Clock, name: "Cron diário", on: true, detail: "Agendado (9h)" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automação"
        subtitle="Cobrança automática: geração de faturas, lembretes e baixa."
        action={
          <form action={runBilling}>
            <button className="btn-primary">
              <Play className="h-4 w-4" /> Rodar motor de cobrança agora
            </button>
          </form>
        }
      />

      {/* Status das integrações */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {integrations.map((i) => {
          const Icon = i.icon;
          return (
            <div key={i.name} className="card flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${i.on ? "bg-positive/15 text-positive" : "bg-slate-500/15 text-slate-400"}`}>
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

      {/* Régua de cobrança */}
      <div className="card">
        <h3 className="mb-1 font-semibold text-white">Régua de cobrança</h3>
        <p className="mb-5 text-sm text-slate-400">
          Sequência de avisos enviados automaticamente conforme o vencimento.
        </p>
        <div className="space-y-3">
          {reguaSteps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="flex items-center gap-3 rounded-xl border border-ink-700/60 bg-ink-900 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand-400">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{s.title}</p>
                  <p className="text-xs text-slate-500">{s.sub}</p>
                </div>
                <StatusPill ok={email || whats} label={email && whats ? "e-mail + WhatsApp" : email ? "e-mail" : whats ? "WhatsApp" : "sem canal"} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Como funciona */}
      <div className="card">
        <h3 className="mb-3 font-semibold text-white">Como o ciclo funciona</h3>
        <ol className="space-y-2 text-sm text-slate-300">
          <li><span className="font-semibold text-brand-400">1.</span> Todo dia (9h) o cron gera as cobranças das assinaturas que vencem.</li>
          <li><span className="font-semibold text-brand-400">2.</span> O Asaas gera o Pix/boleto real e o sistema dispara e-mail + WhatsApp com o link.</li>
          <li><span className="font-semibold text-brand-400">3.</span> Quando o cliente paga, o Asaas avisa por webhook e a fatura recebe baixa sozinha.</li>
          <li><span className="font-semibold text-brand-400">4.</span> Atrasos viram &quot;inadimplente&quot; automaticamente; estorno/cancelamento desfazem a baixa.</li>
        </ol>
      </div>
    </div>
  );
}
