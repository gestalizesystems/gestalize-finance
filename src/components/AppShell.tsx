"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

// Esconde a sidebar em telas "cheias" (ex: login).
const FULLSCREEN_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r));

  if (isFullscreen) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1500px] px-7 py-6">{children}</div>
      </main>
    </div>
  );
}
