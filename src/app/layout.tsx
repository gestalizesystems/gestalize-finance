import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

// Normaliza a URL do site: aceita valor sem esquema (ex: "exemplo.com.br")
// e nunca quebra o build se vier inválida.
function resolveSiteUrl(): URL {
  const fallback = "http://localhost:3010";
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  const candidate = raw
    ? /^https?:\/\//i.test(raw)
      ? raw
      : `https://${raw}`
    : fallback;
  try {
    return new URL(candidate);
  } catch {
    return new URL(fallback);
  }
}

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: {
    default: "Gestalize Finance",
    template: "%s · Gestalize Finance",
  },
  description:
    "Sistema financeiro e de cobranças da Gestalize Systems — controle de receitas, despesas, assinaturas recorrentes e cobrança automática.",
  applicationName: "Gestalize Finance",
  appleWebApp: {
    capable: true,
    title: "Gestalize Finance",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: "Gestalize Finance",
    title: "Gestalize Finance",
    description:
      "Gestão financeira e cobranças da Gestalize Systems: receitas, despesas, MRR e cobrança automática por Pix/boleto.",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gestalize Finance",
    description:
      "Gestão financeira e cobranças da Gestalize Systems: receitas, despesas, MRR e cobrança automática.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
