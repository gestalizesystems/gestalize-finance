import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Gestalize Finance",
  description: "Sistema financeiro e de cobranças da Gestalize Systems",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <div className="flex h-screen overflow-hidden bg-ink-950">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1500px] px-7 py-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
