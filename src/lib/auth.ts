// Sessão por cookie assinado (HMAC-SHA256) usando Web Crypto nativo.
// Sem dependências externas — funciona no Node e no Edge (middleware).

export const SESSION_COOKIE = "gf_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias
const enc = new TextEncoder();

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não definido no .env");
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(email: string): Promise<string> {
  const payload = {
    email,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const data = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign(
    "HMAC",
    await getKey(),
    enc.encode(data) as BufferSource,
  );
  return `${data}.${b64urlEncode(new Uint8Array(sig))}`;
}

export async function verifySessionToken(
  token?: string,
): Promise<{ email: string } | null> {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      b64urlDecode(sig) as BufferSource,
      enc.encode(data) as BufferSource,
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(data)));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { email: String(payload.email ?? "") };
  } catch {
    return null;
  }
}

// Confere e-mail e senha contra as credenciais do .env.
export function checkCredentials(email: string, password: string): boolean {
  const authEmail = (process.env.AUTH_EMAIL ?? "").trim().toLowerCase();
  const authPassword = process.env.AUTH_PASSWORD ?? "";
  if (!authEmail || !authPassword) return false;
  return email.trim().toLowerCase() === authEmail && password === authPassword;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
