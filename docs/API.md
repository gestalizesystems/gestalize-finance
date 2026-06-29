# API (Route Handlers)

O sistema é majoritariamente Server Components + Server Actions. Existem apenas
**4 endpoints HTTP**, todos em `src/app/api/`. As telas internas **não** usam API
REST — elas leem o banco direto e mutam via Server Actions.

| Endpoint | Método | Auth | Arquivo |
|---|---|---|---|
| `/api/login` | POST | credenciais + TOTP | `api/login/route.ts` |
| `/api/logout` | GET | cookie de sessão | `api/logout/route.ts` |
| `/api/cron/billing` | GET | `Bearer CRON_SECRET` | `api/cron/billing/route.ts` |
| `/api/webhooks/asaas` | POST | header `asaas-access-token` | `api/webhooks/asaas/route.ts` |

---

## POST /api/login

Autentica e cria a sessão (cookie `gf_session`, httpOnly, 7 dias).

**Request (JSON):**
```json
{ "email": "admin@empresa.com", "senha": "...", "totp": "123456" }
```
`totp` só é exigido se o 2FA estiver ligado (`AUTH_TOTP_SECRET` definido).

**Respostas:**
| Código | Corpo | Significado |
|---|---|---|
| 200 | `{ "ok": true }` | Autenticado (Set-Cookie `gf_session`) |
| 400 | `{ "ok": false, "erro": "Requisição inválida." }` | JSON malformado |
| 401 | `{ "ok": false, "erro": "E-mail ou senha incorretos." }` | Credenciais inválidas |
| 401 | `{ "ok": false, "erro": "Código de verificação inválido.", "needsTotp": true }` | 2FA exigido/incorreto |

**Exemplo:**
```bash
curl -i -X POST http://localhost:3010/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","senha":"senha"}'
```

---

## GET /api/logout

Encerra a sessão (apaga o cookie) e redireciona para `/login`.

```bash
curl -i http://localhost:3010/api/logout
```
**Resposta:** 307 → `/login` (com `Set-Cookie` expirando `gf_session`).

---

## GET /api/cron/billing

Motor de cobrança diário. Detalhes completos em [CRON.md](CRON.md).

**Auth:** header `Authorization: Bearer <CRON_SECRET>` (se `CRON_SECRET` definido).

**Respostas:**
| Código | Corpo |
|---|---|
| 200 | `{ "ok": true, "invoicesCreated": 2, "invoicesMarkedOverdue": 1, "ranAt": "..." }` |
| 401 | `{ "error": "unauthorized" }` |

```bash
curl -i http://localhost:3010/api/cron/billing -H "Authorization: Bearer SECRET"
```

---

## POST /api/webhooks/asaas

Recebe eventos de pagamento do Asaas e dá baixa automática. Detalhes em
[INTEGRACOES.md](INTEGRACOES.md).

**Auth:** header `asaas-access-token` deve bater com `ASAAS_WEBHOOK_TOKEN`
(se a variável estiver definida).

**Request (JSON, enviado pelo Asaas):**
```json
{ "event": "PAYMENT_RECEIVED", "payment": { "id": "pay_...", "externalReference": "<invoiceId>", "billingType": "PIX" } }
```

**Respostas:**
| Código | Corpo | Caso |
|---|---|---|
| 200 | `{ "ok": true, "invoices": 1, "event": "PAYMENT_RECEIVED" }` | Processado |
| 200 | `{ "ok": true, "ignored": "<event>" }` | Evento não tratado |
| 200 | `{ "ok": true, "warning": "invoice não encontrada" }` | Sem fatura correspondente |
| 400 | `{ "ok": false, "error": "invalid body" }` | JSON malformado |
| 401 | `{ "ok": false, "error": "unauthorized" }` | Token inválido |

> Sempre responde 200 nos casos "ignorado"/"não encontrada" para o Asaas não
> reenviar indefinidamente.
