import { NextResponse } from "next/server";
import {
  checkCredentials,
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { totpEnabled, verifyTotp } from "@/lib/totp";

export async function POST(req: Request) {
  let email = "";
  let senha = "";
  let totp = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "");
    senha = String(body.senha ?? body.password ?? "");
    totp = String(body.totp ?? body.code ?? "");
  } catch {
    return NextResponse.json({ ok: false, erro: "Requisição inválida." }, { status: 400 });
  }

  if (!checkCredentials(email, senha)) {
    return NextResponse.json(
      { ok: false, erro: "E-mail ou senha incorretos." },
      { status: 401 },
    );
  }

  // Segundo fator (se ativado).
  if (totpEnabled() && !(await verifyTotp(totp))) {
    return NextResponse.json(
      { ok: false, erro: "Código de verificação inválido.", needsTotp: true },
      { status: 401 },
    );
  }

  const token = await createSessionToken(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
