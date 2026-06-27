# Deploy no Railway — Gestalize Finance

Guia para publicar o sistema (app + banco PostgreSQL) no Railway, com domínio
privado `financeiro.gestalizebots.com.br` e login.

O repositório já está pronto: `railway.json` define o build (Nixpacks) e o
start (`prisma migrate deploy` + `next start`), e o `postinstall` gera o Prisma
Client automaticamente.

---

## 1. Criar o projeto e o banco

1. Acesse **railway.app** → **New Project**.
2. Clique em **Provision PostgreSQL** (ou New → Database → PostgreSQL).
   - Isso cria o banco e a variável `DATABASE_URL` automaticamente.

## 2. Adicionar o app (a partir do GitHub)

1. No mesmo projeto: **New → GitHub Repo** → escolha
   `nathashaloppes/Gestalize-Finance`.
2. O Railway detecta o Next.js (Nixpacks) e começa o build.

## 3. Variáveis de ambiente do serviço do app

No serviço do app → aba **Variables**, adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referencia o banco do projeto) |
| `AUTH_SECRET` | uma string aleatória longa (ex: `openssl rand -hex 32`) |
| `AUTH_EMAIL` | `gestalizesystems@outlook.com` |
| `AUTH_PASSWORD` | sua senha de login |
| `NEXT_PUBLIC_SITE_URL` | `https://financeiro.gestalizebots.com.br` |
| `ASAAS_MODE` | `mock` (troque p/ `sandbox`/`live` quando ativar pagamentos) |
| `COMPANY_NAME` | `Gestalize Systems` |
| `NODE_ENV` | `production` |

> A `DATABASE_URL` com `${{Postgres.DATABASE_URL}}` faz o Railway injetar a
> string do banco do próprio projeto. Confira o nome do serviço Postgres.

## 4. Migração do banco

Não precisa rodar nada à mão: o `startCommand` do `railway.json` roda
`prisma migrate deploy` antes de subir o app, criando as tabelas na primeira
publicação. O banco começa **vazio** (sem dados de demonstração).

## 5. Domínio privado

1. No serviço do app → **Settings → Networking → Custom Domain**.
2. Digite `financeiro.gestalizebots.com.br`.
3. O Railway mostra um destino **CNAME** (algo como `xxxx.up.railway.app`).
4. No painel DNS do seu domínio (onde gerencia o `gestalizebots.com.br`),
   crie um registro:
   - **Tipo:** CNAME
   - **Nome/Host:** `financeiro`
   - **Valor/Destino:** o CNAME que o Railway mostrou
5. Aguarde a propagação (minutos a algumas horas). O Railway emite o HTTPS
   sozinho.

## 6. Pronto

Acesse `https://financeiro.gestalizebots.com.br` → cai na tela de login.
Entre com `AUTH_EMAIL` / `AUTH_PASSWORD`. Só você tem acesso. ✅

---

## 7. Cron diário (motor de cobrança automático)

Gera as mensalidades e marca atrasos todo dia, sem clique.

1. Nas **Variables** do app, adicione `CRON_SECRET` (uma string aleatória).
2. No projeto Railway: **New → Cron Job** (ou um serviço com schedule).
   - **Schedule:** `0 9 * * *` (todo dia às 9h, por exemplo).
   - **Comando:**
     ```
     curl -sf -H "Authorization: Bearer $CRON_SECRET" https://finance.gestalizesystems.com.br/api/cron/billing
     ```
   - Use a mesma `CRON_SECRET` do app.

O endpoint só executa se o header `Authorization: Bearer <CRON_SECRET>` bater.

## 8. Webhook do Asaas (confirmação automática de pagamento)

Quando o cliente paga, a fatura dá baixa sozinha.

1. (Opcional) Adicione `ASAAS_WEBHOOK_TOKEN` nas Variables (um token seu).
2. No painel do **Asaas** → Integrações → Webhooks:
   - **URL:** `https://finance.gestalizesystems.com.br/api/webhooks/asaas`
   - **Token de autenticação:** o mesmo de `ASAAS_WEBHOOK_TOKEN` (se usou).
   - Eventos: pagamento **recebido/confirmado**.

---

### Observações
- **Custo:** plano Hobby do Railway (~US$ 5/mês, inclui uso) cobre um app
  pequeno + Postgres pequeno.
- **Atualizações:** todo `git push` na branch `main` redeploya automaticamente.
- **Pagamentos reais (Asaas):** depois, troque `ASAAS_MODE=sandbox` + adicione
  `ASAAS_API_KEY` nas Variables.
