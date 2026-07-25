import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo retangular da Gestalize Finance (robô + wordmark).
 * Responsivo: o robô e o texto reduzem em telas menores.
 * Use `showWordmark={false}` para exibir só o robô (ex: sidebar recolhida).
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/gestalize-bot.png"
        alt="Gestalize Finance"
        width={44}
        height={50}
        priority
        className="h-9 w-auto shrink-0 sm:h-11"
      />
      {showWordmark && (
        <div className="leading-tight">
          <p className="text-base font-bold text-white sm:text-lg">Gestalize</p>
          <p className="-mt-1 text-xs font-semibold text-brand-400 sm:text-sm">
            Finance
          </p>
        </div>
      )}
    </div>
  );
}
