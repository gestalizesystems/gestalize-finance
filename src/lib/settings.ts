// Configurações editáveis (dados da empresa + templates de mensagem),
// guardadas no banco (model Setting). Caem em valores padrão quando vazias.

import { prisma } from "./prisma";

export const SETTING_KEYS = {
  companyName: "company.name",
  companyCnpj: "company.cnpj",
  companyEmail: "company.email",
  companyPhone: "company.phone",
  companyPix: "company.pix",
  companyAddress: "company.address",
  waTemplate: "template.whatsapp",
  emailSubject: "template.email.subject",
  emailBody: "template.email.body",
} as const;

export const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.companyName]: process.env.COMPANY_NAME || "Gestalize Systems",
  [SETTING_KEYS.companyCnpj]: "",
  [SETTING_KEYS.companyEmail]: "",
  [SETTING_KEYS.companyPhone]: "",
  [SETTING_KEYS.companyPix]: "",
  [SETTING_KEYS.companyAddress]: "",
  [SETTING_KEYS.waTemplate]:
    "Olá, {cliente}! 👋\n\n" +
    "Você tem uma cobrança da *{empresa}*:\n\n" +
    "💰 Valor: *{valor}*\n" +
    "📅 Vencimento: {vencimento}\n" +
    "📄 {descricao}\n\n" +
    "👉 Pagar agora: {link}\n\n" +
    "Qualquer dúvida, é só responder por aqui. 🙂",
  [SETTING_KEYS.emailSubject]: "Cobrança {empresa} — {valor} (vence {vencimento})",
  [SETTING_KEYS.emailBody]:
    "Olá, {cliente}! 👋\n\n" +
    "Segue a cobrança referente a {descricao}. " +
    "Confira os detalhes abaixo e pague pelo botão.",
};

// Variáveis disponíveis nos templates (para mostrar na UI).
export const TEMPLATE_VARS = [
  { tag: "{cliente}", desc: "Nome do cliente" },
  { tag: "{valor}", desc: "Valor formatado (R$)" },
  { tag: "{vencimento}", desc: "Data de vencimento" },
  { tag: "{descricao}", desc: "Descrição da cobrança" },
  { tag: "{link}", desc: "Link de pagamento" },
  { tag: "{empresa}", desc: "Nome da sua empresa" },
];

export async function getSetting(key: string): Promise<string> {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    return s?.value ?? DEFAULTS[key] ?? "";
  } catch {
    return DEFAULTS[key] ?? "";
  }
}

export async function getSettings(
  keys: string[],
): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = map.get(k) ?? DEFAULTS[k] ?? "";
  return out;
}

export async function setSettings(entries: Record<string, string>) {
  for (const [key, value] of Object.entries(entries)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
}

// Substitui as variáveis {x} de um template.
export function applyTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}
