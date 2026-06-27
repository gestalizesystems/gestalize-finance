import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");

  // Já logado tentando ver o login → manda pro dashboard.
  if (isLoginPage) {
    if (session) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  // Não logado em rota protegida → manda pro login.
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

// Roda em tudo, exceto: /api, assets do Next e arquivos estáticos (com ponto).
export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
