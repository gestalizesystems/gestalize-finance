import { NextResponse } from "next/server";
import {
  checkCredentials,
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(req: Request) {
  let email = "";
  let senha = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "");
    senha = String(body.senha ?? body.password ?? "");
  } catch {
    return NextResponse.json({ ok: false, erro: "Requisição inválida." }, { status: 400 });
  }

  if (!checkCredentials(email, senha)) {
    return NextResponse.json(
      { ok: false, erro: "E-mail ou senha incorretos." },
      { status: 401 },
    );
  }

  const token = await createSessionToken(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
