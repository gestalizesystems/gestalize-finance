import { PageHeader } from "@/components/ui";
import { Sparkles } from "lucide-react";

export function ComingSoon({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: string[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="card flex flex-col items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand-400">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold text-white">Próxima etapa do roadmap</p>
          <p className="text-sm text-slate-400">
            Esta seção já está prevista. O que entra aqui:
          </p>
        </div>
        <ul className="space-y-1.5 text-sm text-slate-300">
          {items.map((i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              {i}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
