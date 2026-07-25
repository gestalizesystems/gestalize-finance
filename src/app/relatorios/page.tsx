import { ComingSoon } from "@/components/ComingSoon";

export default function RelatoriosPage() {
  return (
    <ComingSoon
      title="Relatórios"
      subtitle="Análises de receita, MRR/ARR, inadimplência e lucro."
      items={[
        "Evolução de MRR e ARR",
        "Lucro líquido por mês (receita - custos)",
        "Inadimplência e ticket médio",
        "Exportação CSV / PDF",
      ]}
    />
  );
}
