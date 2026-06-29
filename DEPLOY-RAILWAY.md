# Deploy no Railway — Gestalize Finance

Guia para publicar o sistema (app + banco PostgreSQL) no Railway, com domínio
privado `finance.gestalizesystems.com.br` e login.

> Lista completa de variáveis em [docs/VARIAVEIS.md](docs/VARIAVEIS.md).

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

**Obrigatórias:**

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referencia o banco do projeto) |
| `AUTH_SECRET` | string aleatória longa (`openssl rand -hex 32`) |
| `AUTH_EMAIL` | seu e-mail de login |
| `AUTH_PASSWORD` | sua senha de login |
| `NODE_ENV` | `production` |

**Recomendadas / por integração** (ver [docs/VARIAVEIS.md](docs/VARIAVEIS.md)):

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://finance.gestalizesystems.com.br` |
| `COMPANY_NAME` | `Gestalize Systems` |
| `CRON_SECRET` | string aleatória (protege o cron) |
| `AUTH_TOTP_SECRET` | segredo base32 (liga o 2FA) — opcional |
| `ASAAS_MODE` / `ASAAS_API_KEY` / `ASAAS_BASE_URL` / `ASAAS_WEBHOOK_TOKEN` | pagamentos reais |
| `RESEND_API_KEY` / `RESEND_FROM` | e-mail |
| `EVOLUTION_BASE_URL` / `EVOLUTION_INSTANCE` / `EVOLUTION_API_KEY` | WhatsApp |

> A `DATABASE_URL` com `${{Postgres.DATABASE_URL}}` faz o Railway injetar a
> string do banco do próprio projeto. Confira o nome do serviço Postgres.
> ⚠️ Em produção, o Asaas usa `ASAAS_BASE_URL=https://api.asaas.com/v3` (sem `/api`).

## 4. Migração do banco

Não precisa rodar nada à mão: o `startCommand` do `railway.json` roda
`prisma migrate deploy` antes de subir o app, criando as tabelas na primeira
publicação. O banco começa **vazio** (sem dados de demonstração).

## 5. Domínio privado

1. No serviço do app → **Settings → Networking → Custom Domain**.
2. Digite `finance.gestalizesystems.com.br`.
3. O Railway mostra um destino **CNAME** (algo como `xxxx.up.railway.app`).
4. No painel DNS do seu domínio (onde gerencia o `gestalizesystems.com.br`),
   crie um registro:
   - **Tipo:** CNAME
   - **Nome/Host:** `finance`
   - **Valor/Destino:** o CNAME que o Railway mostrou
5. Aguarde a propagação (minutos a algumas horas). O Railway emite o HTTPS
   sozinho.

## 6. Pronto

Acesse `https://finance.gestalizesystems.com.br` → cai na tela de login.
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

## 9. Backup do banco

Os backups embutidos do Railway (PITR/Volume) exigem o **plano Pro**. No plano
Hobby, faça backup manual via `pg_dump` (o Postgres do Railway é **v18**):

```bash
# Pegue a DATABASE_PUBLIC_URL nas Variables do serviço Postgres
docker run --rm postgres:18-alpine pg_dump "<DATABASE_PUBLIC_URL>" --no-owner --no-acl \
  > ~/Desktop/gestalize_backup_$(date +%F).sql
```

Restaurar: `docker run --rm -i postgres:18-alpine psql "<DATABASE_PUBLIC_URL>" < arquivo.sql`.
Rode antes de mudanças grandes e periodicamente (~1x/semana).

---

## Checklist pós-deploy

- [ ] App acessível em `https://finance.gestalizesystems.com.br` (cai no login).
- [ ] Login funciona com `AUTH_EMAIL` / `AUTH_PASSWORD`.
- [ ] Migrações aplicadas (tabelas existem — `prisma migrate deploy` no start).
- [ ] `CRON_SECRET` definido e cron diário cadastrado e testado ("Run now" → 200).
- [ ] Webhook do Asaas cadastrado **na conta de produção** (URL + token).
- [ ] `ASAAS_BASE_URL` = `https://api.asaas.com/v3` (sem `/api`) se `ASAAS_MODE=live`.
- [ ] Resend com domínio verificado (se usar e-mail).
- [ ] Evolution conectada (QR Code) e online (se usar WhatsApp).
- [ ] Backup inicial do banco feito.

---

### Observações
- **Custo:** plano Hobby do Railway (~US$ 5/mês, inclui uso) cobre um app
  pequeno + Postgres pequeno.
- **Atualizações:** todo `git push` na branch `main` redeploya automaticamente.
- **Pagamentos reais (Asaas):** troque `ASAAS_MODE=live` + `ASAAS_API_KEY` +
  `ASAAS_BASE_URL=https://api.asaas.com/v3` nas Variables.
