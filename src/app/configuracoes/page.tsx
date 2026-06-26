import { ComingSoon } from "@/components/ComingSoon";
import { gatewayMode } from "@/lib/asaas";

export default function ConfiguracoesPage() {
  return (
    <ComingSoon
      title="Configurações"
      subtitle={`Dados da empresa e integrações. Gateway atual: ${gatewayMode().toUpperCase()}.`}
      items={[
        "Chave da API Asaas (sandbox / produção)",
        "Provedor de WhatsApp e e-mail",
        "Dados do emissor (Gestalize Systems)",
        "Régua de cobrança personalizável",
      ]}
    />
  );
}
