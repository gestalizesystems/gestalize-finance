# Variáveis de Ambiente

Todas as variáveis ficam no arquivo `.env` (local) ou nas **Variables** do
serviço no Railway (produção). Use o [`.env.example`](../.env.example) como base.

> ⚠️ O `.env` **nunca** vai para o Git (está no `.gitignore`). Segredos de
> produção ficam só no Railway.

## Tabela completa

| Variável | Obrigatória? | Serviço | Finalidade | Exemplo |
|---|---|---|---|---|
| `DATABASE_URL` | **Sim** | Postgres/Prisma | String de conexão do banco. | `postgresql://gestalize:gestalize@localhost:5433/gestalize_finance?schema=public` |
| `AUTH_SECRET` | **Sim** | Login | Chave para assinar o cookie de sessão (HMAC-SHA256). | gere com `openssl rand -hex 32` |
| `AUTH_EMAIL` | **Sim** | Login | E-mail aceito no login. | `admin@gestalizesystems.com.br` |
| `AUTH_PASSWORD` | **Sim** | Login | Senha aceita no login. | `uma_senha_forte` |
| `AUTH_TOTP_SECRET` | Não | Login (2FA) | Segredo **base32** do app autenticador. Vazio = 2FA desligado. | `5CCV4VQR7SKPWPHKWMBY7H2GWHOKC2GY` |
| `NEXT_PUBLIC_SITE_URL` | Não | App | Base URL pública (links de compartilhamento / Open Graph). | `https://finance.gestalizesystems.com.br` |
| `COMPANY_NAME` | Não | App | Nome do emissor (fallback; o nome oficial é editável em Configurações). | `Gestalize Systems` |
| `ASAAS_MODE` | Não | Asaas | `mock` \| `sandbox` \| `live`. Default: `mock`. | `live` |
| `ASAAS_API_KEY` | Se `sandbox`/`live` | Asaas | Chave da API do Asaas. | `$aact_...` |
| `ASAAS_BASE_URL` | Não | Asaas | Endpoint da API. **Sandbox** usa `/api/v3`; **produção** usa `/v3`. | `https://api.asaas.com/v3` |
| `ASAAS_WEBHOOK_TOKEN` | Não (recomendado) | Asaas | Token validado no header `asaas-access-token` do webhook. | gere com `openssl rand -hex 24` |
| `RESEND_API_KEY` | Não | Resend | Chave da API. Vazio = e-mail desligado (ignora sem erro). | `re_...` |
| `RESEND_FROM` | Se usar e-mail | Resend | Remetente (domínio verificado no Resend). | `Gestalize Finance <cobranca@gestalizesystems.com.br>` |
| `EVOLUTION_BASE_URL` | Não | WhatsApp | URL pública da Evolution API. | `https://evolution.up.railway.app` |
| `EVOLUTION_INSTANCE` | Se usar WhatsApp | WhatsApp | Nome da instância conectada. | `gestalize` |
| `EVOLUTION_API_KEY` | Se usar WhatsApp | WhatsApp | `AUTHENTICATION_API_KEY` da Evolution. | `B6D7...` |
| `CRON_SECRET` | Não (recomendado) | Cron | Protege `GET /api/cron/billing` (header `Authorization: Bearer <secret>`). | gere com `openssl rand -hex 24` |
| `NODE_ENV` | Automática | Sistema | `production` em deploy → cookie de sessão vira `secure` (HTTPS). | `production` |

## Comportamento quando uma integração está desligada

O sistema é **tolerante a ausência de configuração**:

- **Asaas** sem `ASAAS_MODE=live`/`sandbox` → roda em **mock** (gera links fake).
- **Resend** sem `RESEND_API_KEY`/`RESEND_FROM` → e-mail é **ignorado** (sem erro).
- **Evolution** sem as três `EVOLUTION_*` → WhatsApp é **ignorado** (sem erro).
- **2FA** sem `AUTH_TOTP_SECRET` → login pede só e-mail + senha.
- **Cron** sem `CRON_SECRET` → o endpoint fica **sem proteção** (defina em produção!).

## Geração de segredos

```bash
openssl rand -hex 32     # AUTH_SECRET
openssl rand -hex 24     # CRON_SECRET / ASAAS_WEBHOOK_TOKEN
```

Para gerar o `AUTH_TOTP_SECRET` (base32), use a função
`generateTotpSecret()` de `src/lib/totp.ts` ou um gerador base32 confiável.
