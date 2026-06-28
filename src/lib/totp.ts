// 2FA por TOTP (RFC 6238) usando Web Crypto nativo — sem dependências.
// Ativado quando AUTH_TOTP_SECRET (base32) está definido no .env.

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function totpEnabled() {
  return Boolean((process.env.AUTH_TOTP_SECRET ?? "").trim());
}

// Decodifica base32 (RFC 4648) para bytes.
function base32Decode(input: string): Uint8Array {
  const clean = input.replace(/=+$/g, "").replace(/\s/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

async function hotp(keyBytes: Uint8Array, counter: number): Promise<string> {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter >>> 0);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf));
  const offset = sig[sig.length - 1] & 0x0f;
  const code =
    ((sig[offset] & 0x7f) << 24) |
    (sig[offset + 1] << 16) |
    (sig[offset + 2] << 8) |
    sig[offset + 3];
  return String(code % 1_000_000).padStart(6, "0");
}

// Valida o código contra a janela atual ±1 (tolera relógio dessincronizado).
export async function verifyTotp(token: string): Promise<boolean> {
  const secret = (process.env.AUTH_TOTP_SECRET ?? "").trim();
  if (!secret) return true; // 2FA desativado
  const code = (token ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return false;

  const keyBytes = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let w = -1; w <= 1; w++) {
    if ((await hotp(keyBytes, counter + w)) === code) return true;
  }
  return false;
}

// Gera um segredo base32 aleatório (para configurar o app autenticador).
export function generateTotpSecret(bytes = 20): string {
  const rnd = crypto.getRandomValues(new Uint8Array(bytes));
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < rnd.length; i++) {
    value = (value << 8) | rnd[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += B32[(value >>> bits) & 31];
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
