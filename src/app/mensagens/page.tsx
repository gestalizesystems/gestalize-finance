import { ComingSoon } from "@/components/ComingSoon";

export default function MensagensPage() {
  return (
    <ComingSoon
      title="Mensagens"
      subtitle="Modelos de cobrança e histórico de envios."
      items={[
        "Templates de e-mail e WhatsApp editáveis",
        "Variáveis: {cliente}, {valor}, {vencimento}, {link}",
        "Histórico de mensagens enviadas",
        "Preview antes do envio",
      ]}
    />
  );
}
