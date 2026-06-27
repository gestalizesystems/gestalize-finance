import {
  UserCheck,
  CalendarClock,
  Link2,
  CheckCircle2,
  Bell,
  AlertTriangle,
  ShieldAlert,
  Megaphone,
} from "lucide-react";

const flowSteps = [
  { icon: UserCheck, title: "Cliente Ativo", sub: "Plano contratado" },
  { icon: CalendarClock, title: "Geração da Cobrança", sub: "Sistema cria a cobrança" },
  { icon: Link2, title: "Link de Pagamento", sub: "Enviado para o cliente" },
  { icon: CheckCircle2, title: "Pagamento", sub: "Confirmado" },
];

export function BillingFlow() {
  return (
    <div className="card flex h-full flex-col">
      <h3 className="mb-5 font-semibold text-white">Fluxo de Cobrança</h3>
      <div className="flex flex-1 items-center justify-between gap-1">
        {flowSteps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="flex flex-1 flex-col items-center text-center">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/15 text-brand-400">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-white leading-tight">{s.title}</p>
              <p className="text-[11px] text-slate-500 leading-tight">{s.sub}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const autoSteps = [
  { icon: Bell, title: "3 dias antes do vencimento", sub: "Envio de lembrete (E-mail + WhatsApp)", status: "Enviado", done: true },
  { icon: CalendarClock, title: "No dia do vencimento", sub: "Envio de cobrança", status: "Enviado", done: true },
  { icon: AlertTriangle, title: "3 dias após vencimento", sub: "Aviso de pendência", status: "Enviado", done: true },
  { icon: Megaphone, title: "7 dias após vencimento", sub: "Cobrança adicional", status: "Pendente", done: false },
  { icon: ShieldAlert, title: "15 dias após vencimento", sub: "Aviso de suspensão", status: "Pendente", done: false },
];

export function AutomationPanel() {
  return (
    <div className="card flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-white">Automação de Cobrança</h3>
        <button className="text-xs font-medium text-brand-400 hover:underline">Ver todas</button>
      </div>

      <div className="space-y-3.5">
        {autoSteps.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  s.done ? "bg-positive/15 text-positive" : "bg-warning/15 text-warning"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white leading-tight">{s.title}</p>
                <p className="text-xs text-slate-500">{s.sub}</p>
              </div>
              <span className={`badge ${s.done ? "badge-paid" : "badge-pending"}`}>{s.status}</span>
            </div>
          );
        })}
      </div>

      {/* Mockup de mensagem de WhatsApp */}
      <div className="mt-5 rounded-2xl border border-ink-700/60 bg-ink-900 p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-positive/20 text-positive text-xs font-bold">
            GS
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-white">Gestalize Systems</p>
            <p className="text-[10px] text-positive">online</p>
          </div>
        </div>
        <div className="rounded-xl rounded-tl-sm bg-ink-800 p-3 text-xs text-slate-200">
          Olá, João! 👋
          <br />
          Sua cobrança de <span className="font-semibold">R$ 159,90</span> vence em 05/06.
          <br />
          <br />
          Evite multas e mantenha seu sistema ativo!
          <br />
          <br />
          👉 Pagar agora:{" "}
          <span className="text-brand-400 underline">gestalize.com/pagar</span>
        </div>
      </div>
    </div>
  );
}
