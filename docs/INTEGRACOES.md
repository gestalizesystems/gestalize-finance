# Integrações Externas

Todas as integrações são feitas por **REST (`fetch`)**, sem SDKs, e cada uma
**degrada com elegância**: se não estiver configurada, é ignorada sem quebrar o
fluxo. Os módulos ficam em `src/lib/`.

---

## 1. ASAAS — Gateway de pagamento

**Módulo:** `src/lib/asaas.ts` · **Webhook:** `src/app/api/webhooks/asaas/route.ts`

### Finalidade
Gerar cobranças reais (Pix, boleto, cartão) com link de pagamento e confirmar o
pagamento automaticamente (baixa via webhook).

### Variáveis
| Variável | Uso |
|---|---|
| `ASAAS_MODE` | `mock` (default) \| `sandbox` \| `live` |
| `ASAAS_API_KEY` | Chave da API (sandbox ou produção) |
| `ASAAS_BASE_URL` | Endpoint da API |
| `ASAAS_WEBHOOK_TOKEN` | Token do webhook (header `asaas-access-token`) |

### Ambientes
| Ambiente | `ASAAS_MODE` | `ASAAS_BASE_URL` |
|---|---|---|
| Mock (sem conta) | `mock` | — (gera links fake) |
| Sandbox (teste) | `sandbox` | `https://sandbox.asaas.com/api/v3` |
| Produção (real) | `live` | `https://api.asaas.com/v3` |

> ⚠️ **Pegadinha:** o sandbox usa `/api/v3`, mas a **produção** usa `/v3`
> (**sem** o `/api`). URL errada retorna 404.

### Fluxo de integração
1. Ao gerar uma cobrança, `createCharge()` faz `POST /payments` no Asaas com
   cliente, valor, vencimento e `externalReference = invoice.id`.
2. O Asaas devolve `id` (→ `Invoice.externalId`) e o link de pagamento
   (→ `Invoice.paymentLink`).
3. Quando o cliente paga, o Asaas chama o **webhook** `POST /api/webhooks/asaas`.

### Webhook — eventos tratados
| Evento | Ação |
|---|---|
| `PAYMENT_RECEIVED` / `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED_IN_CASH` | Cria `Payment` + marca fatura `PAID` |
| `PAYMENT_OVERDUE` | Marca fatura `OVERDUE` + cliente inadimplente |
| `PAYMENT_DELETED` | Marca fatura `CANCELED` |
| `PAYMENT_REFUNDED` / `..._UNDONE` | Remove pagamentos + cancela a fatura |

- Localiza a fatura por `externalReference` (id) **ou** `externalId` (id do pagamento).
- **Combo:** um pagamento pode estar ligado a mais de uma fatura (Implantação +
  Mensalidade) — o webhook usa `findMany` e baixa todas.
- **Idempotente:** não duplica `Payment` se a fatura já está `PAID`.

### Configuração (produção)
1. No painel do Asaas, gere a **API key de produção** e defina as variáveis acima
   (`ASAAS_MODE=live`, `ASAAS_BASE_URL=https://api.asaas.com/v3`).
2. Cadastre o webhook **na conta de produção** (o do sandbox não vale):
   - URL: `https://finance.gestalizesystems.com.br/api/webhooks/asaas`
   - `authToken` = mesmo valor de `ASAAS_WEBHOOK_TOKEN`
   - Eventos de pagamento (RECEIVED, CONFIRMED, OVERDUE, etc.)
   - Pode ser feito via `POST /v3/webhooks` ou pelo painel.

### Validação
- Crie uma cobrança e confirme que o `paymentLink` foi gerado.
- Pague (Pix) e confirme que a fatura vira **PAID** sozinha (webhook).
- Sem baixa automática? Verifique se o webhook está cadastrado **na conta certa**.

### Erros comuns
| Sintoma | Causa |
|---|---|
| 404 ao gerar cobrança | `ASAAS_BASE_URL` com `/api/v3` em produção (use `/v3`) |
| `invalid_dueDate` | Vencimento no passado (o formulário força mín. = hoje) |
| Pago no Asaas, Pendente no sistema | Webhook não cadastrado na conta de produção |

---

## 2. RESEND — E-mail

**Módulo:** `src/lib/email.ts`

### Finalidade
Enviar e-mails de cobrança (e lembretes da régua) com layout HTML, valor,
vencimento e botão de pagamento.

### Variáveis
| Variável | Uso |
|---|---|
| `RESEND_API_KEY` | Chave da API. Vazio = e-mail desligado. |
| `RESEND_FROM` | Remetente — **domínio verificado** no Resend. |

### Processo de envio
1. `renderInvoiceEmail()` monta o assunto + HTML a partir do template editável
   (Configurações → Mensagens), substituindo variáveis (`{cliente}`, `{valor}`,
   `{vencimento}`, `{link}`, etc.).
2. `sendEmail()` faz `POST https://api.resend.com/emails` com `from`, `to`,
   `subject`, `html`.
3. `emailEnabled()` retorna `false` se faltar `RESEND_API_KEY`/`RESEND_FROM` —
   nesse caso o envio é **ignorado** (sem erro).

### Configuração
1. Crie a conta no Resend e **verifique seu domínio** (registros DNS).
2. Defina `RESEND_API_KEY` e `RESEND_FROM` (ex.:
   `Gestalize Finance <cobranca@gestalizesystems.com.br>`).

### Como testar
Gere uma cobrança para um cliente com e-mail e use o botão de envio em
`/cobrancas`, ou rode o motor de cobrança ([CRON.md](CRON.md)).

### Tratamento de erros
Falhas de envio são capturadas e logadas (`console.error`) sem interromper a
geração da fatura. Em produção, veja os **Logs** do Railway.

---

## 3. EVOLUTION API — WhatsApp

**Módulo:** `src/lib/whatsapp.ts`

### Finalidade
Enviar mensagens de cobrança por WhatsApp a partir de uma instância
**self-hosted** da Evolution API.

### Variáveis
| Variável | Uso |
|---|---|
| `EVOLUTION_BASE_URL` | URL pública da sua Evolution. |
| `EVOLUTION_INSTANCE` | Nome da instância conectada. |
| `EVOLUTION_API_KEY` | `AUTHENTICATION_API_KEY` da Evolution. |

### Fluxo de conexão (conectar uma nova instância)
1. Suba a Evolution API (ex.: serviço próprio no Railway, com Postgres/Redis).
2. Crie uma instância: `POST {BASE_URL}/instance/create` (header `apikey`).
3. Conecte o número escaneando o **QR Code** (`GET {BASE_URL}/instance/connect/{instance}`)
   no WhatsApp do celular (Aparelhos conectados).
4. Defina `EVOLUTION_BASE_URL`, `EVOLUTION_INSTANCE`, `EVOLUTION_API_KEY` no app.

### Processo de envio
1. `renderInvoiceWhatsApp()` monta a mensagem a partir do template editável.
2. `normalizePhone()` normaliza o número (acrescenta DDI `55` se faltar).
3. `sendWhatsApp()` faz `POST {BASE_URL}/message/sendText/{instance}`.
4. `whatsappEnabled()` retorna `false` sem as três variáveis → envio ignorado.

### Como validar
Status da instância: `GET {BASE_URL}/instance/connectionState/{instance}`
(deve estar `open`). Envie uma cobrança de teste para um número conectado.

### Erros comuns
| Sintoma | Causa |
|---|---|
| Mensagem não chega | Instância desconectada (refazer o QR Code) |
| 401 | `EVOLUTION_API_KEY` incorreta |
| Número inválido | Faltou DDI/DDD — `normalizePhone` cobre o `55`, confira o DDD |

> A instância precisa ficar **online 24/7** (servidor self-hosted) para enviar.
