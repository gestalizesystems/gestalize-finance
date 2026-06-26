import { ComingSoon } from "@/components/ComingSoon";

export default function AutomacaoPage() {
  return (
    <ComingSoon
      title="Automação"
      subtitle="Régua de cobrança automática por e-mail e WhatsApp."
      items={[
        "Régua: D-3, D0, D+3, D+7, D+15",
        "Integração WhatsApp (Z-API / Twilio)",
        "Integração e-mail (Resend)",
        "Corte automático de serviço por inadimplência",
        "Cron job diário do motor de cobrança",
      ]}
    />
  );
}
