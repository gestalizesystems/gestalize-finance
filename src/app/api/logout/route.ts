import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

// Redirect RELATIVO ("/login") — o navegador resolve no domínio público.
// Não usar req.url: atrás do proxy do Railway ele aponta p/ o host interno
// (https://localhost:8080), o que quebra a volta pro login.
function clearAndRedirect() {
  const res = new NextResponse(null, {
    status: 303,
    headers: { Location: "/login" },
  });
  res.cookies.set(SESSION_COOKIE, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

export async function POST() {
  return clearAndRedirect();
}

export async function GET() {
  return clearAndRedirect();
}
