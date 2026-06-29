# Arquitetura

## Visão geral

O Gestalize Finance é um **monólito Next.js 14 (App Router)**. Não há backend
separado: as telas são **Server Components** que leem o banco direto via Prisma,
e as mutações usam **Server Actions** e alguns **Route Handlers** (API) para
integrações externas (login, webhook, cron).

```
Navegador ──► Next.js (App Router)
                ├─ Server Components ── Prisma ──► PostgreSQL
                ├─ Server Actions ───── Prisma + libs de integração
                └─ Route Handlers (/api) ── login | logout | cron | webhook
                                              │
                       Asaas · Resend · Evolution API (REST via fetch)
```

## Estrutura de pastas

```
src/
  app/
    layout.tsx            # Layout raiz (metadados, AppShell)
    page.tsx              # Dashboard
    actions.ts            # Server Actions (criar/editar/baixar/billing/configs)
    globals.css           # Estilos globais + tema Tailwind
    manifest.ts           # PWA manifest
    icon.png / apple-icon.png / opengraph-image.png ...  # ícones (convenção Next)

    login/                # Tela de login (client component + login.css)
    clientes/             # Lista + busca; clientes/[id] = detalhe/resumo
    produtos/             # Catálogo de produtos/serviços
    assinaturas/          # Planos recorrentes
    cobrancas/            # Faturas, gerar cobrança, dar baixa, rodar motor
    pagamentos/           # Histórico de pagamentos
    receitas/             # Receitas por mês
    despesas/             # Custos (saídas)
    relatorios/           # Relatório por período
    relatorios/documento/ # Versão "PDF" (impressão) do relatório
    automacao/            # Régua de cobrança (visão)
    mensagens/            # Templates de e-mail/WhatsApp
    configuracoes/        # Dados da empresa + status das integrações

    api/
      login/route.ts            # POST – autentica (e-mail/senha + TOTP)
      logout/route.ts           # GET  – encerra a sessão
      cron/billing/route.ts     # GET  – motor de cobrança diário
      webhooks/asaas/route.ts   # POST – baixa automática via Asaas

  components/             # UI: Sidebar, AppShell, charts, forms, modais, etc.

  lib/                    # Regras de negócio e integrações
    prisma.ts             # Cliente Prisma (singleton)
    auth.ts               # Sessão por cookie assinado (HMAC-SHA256)
    totp.ts               # 2FA (TOTP, RFC 6238)
    asaas.ts              # Gateway de pagamento (mock | sandbox | live)
    billing.ts            # Motor de cobrança (gera faturas, atrasos, baixa)
    email.ts              # Envio + template de e-mail (Resend)
    whatsapp.ts           # Envio + template de WhatsApp (Evolution)
    settings.ts           # Configurações key-value + templates
    metrics.ts            # Agregações (receita, MRR/ARR, relatórios)
    masks.ts              # Máscaras (telefone, CPF/CNPJ, data)
    utils.ts              # Formatadores (R$, datas, variação)

  middleware.ts           # Protege todas as rotas (exige sessão)

prisma/
  schema.prisma           # Modelo de dados
  migrations/             # Histórico de migrações
  seed.ts                 # Dados de exemplo
```

## Fluxo da aplicação

1. O usuário acessa uma rota. O `middleware.ts` exige um cookie de sessão válido;
   sem ele, redireciona para `/login`.
2. A página (Server Component) lê o banco via Prisma e renderiza no servidor.
3. Ações do usuário (criar cobrança, dar baixa, salvar config) chamam **Server
   Actions** em `app/actions.ts`, que escrevem no banco e disparam integrações.
4. Eventos externos (pagamento confirmado, cron diário) chegam pelos **Route
   Handlers** em `app/api/*`.

## Fluxo de autenticação

Implementado **sem bibliotecas externas**, usando Web Crypto:

1. `POST /api/login` recebe `email`, `senha` e (se 2FA ligado) `totp`.
2. `checkCredentials()` compara com `AUTH_EMAIL` / `AUTH_PASSWORD`.
3. Se `AUTH_TOTP_SECRET` existe, `verifyTotp()` valida o código de 6 dígitos
   (TOTP, janela ±1 para tolerar relógio).
4. `createSessionToken()` gera um token `payload.assinatura` (HMAC-SHA256 com
   `AUTH_SECRET`) e grava no cookie **httpOnly** `gf_session` (validade 7 dias).
5. O `middleware.ts` chama `verifySessionToken()` em cada requisição de página.
6. `GET /api/logout` apaga o cookie e volta para `/login`.

Detalhes do 2FA em [INTEGRACOES.md](INTEGRACOES.md) não se aplicam — veja
`src/lib/totp.ts` e a tabela de `AUTH_TOTP_SECRET` em [VARIAVEIS.md](VARIAVEIS.md).

## Fluxo das integrações

- **Cobrança gerada** (manual ou pelo cron) → `asaas.createCharge()` cria a
  cobrança no gateway e retorna `externalId` + `paymentLink`, salvos na fatura.
- **Notificação** → `renderInvoiceEmail()`/`renderInvoiceWhatsApp()` montam a
  mensagem a partir dos templates (Settings) e `sendEmail()`/`sendWhatsApp()`
  enviam via Resend/Evolution.
- **Pagamento confirmado** → o Asaas chama `POST /api/webhooks/asaas`, que dá
  **baixa automática** (cria `Payment`, marca `Invoice` como `PAID`).

Cada integração é isolada em seu módulo `lib/*` e **degrada com elegância**
(se não configurada, é ignorada sem quebrar o fluxo).

## Banco de dados (visão geral)

PostgreSQL via Prisma. **7 tabelas** e 8 enums.

| Tabela | Função | Relacionamentos |
|---|---|---|
| `Client` | Clientes (nome, documento, contato, status) | 1—N `Subscription`, `Invoice`, `Cost` |
| `Product` | Produtos/serviços (preço mensal + implantação, tipo, ativo) | 1—N `Subscription`, `Invoice`, `Cost` |
| `Subscription` | Assinatura recorrente (valor, ciclo, próximo vencimento, status) | N—1 `Client`/`Product`; 1—N `Invoice` |
| `Invoice` | Fatura (tipo, valor, vencimento, status, `externalId`, `paymentLink`) | N—1 `Client`/`Product`/`Subscription`; 1—N `Payment` |
| `Payment` | Pagamento de uma fatura (valor, método, data) | N—1 `Invoice` |
| `Cost` | Despesa/custo (categoria, valor, data) | N—1 `Client`/`Product` (opcional) |
| `Setting` | Configuração key-value (dados da empresa + templates) | — |

### Enums

`ClientStatus` (ACTIVE, DELINQUENT, INACTIVE) ·
`ProductType` · `BillingCycle` (MONTHLY, YEARLY) ·
`SubscriptionStatus` (ACTIVE, …) ·
`InvoiceType` (IMPLEMENTATION, SUBSCRIPTION, EXTRA) ·
`InvoiceStatus` (PENDING, PAID, OVERDUE, CANCELED) ·
`PaymentMethod` (PIX, BOLETO, CARD, MANUAL) ·
`CostCategory`.

### Regras de integridade importantes

- Apagar um `Client` faz **cascade** nas `Invoice` (e estas nos `Payment`).
- `Cost.clientId`/`productId` usam **SetNull** (apagar produto/cliente não apaga a despesa).
- A baixa por webhook é **idempotente** (não duplica `Payment` se a fatura já está `PAID`).

### Migrações

Histórico em `prisma/migrations/`:

| Migração | O que introduziu |
|---|---|
| `..._init` | Schema inicial (todas as tabelas principais) |
| `..._product_implementation_price` | Campo de preço de implantação no `Product` |
| `..._settings` | Tabela `Setting` (configurações + templates) |

Aplicar em produção: `npx prisma migrate deploy` (roda automático no deploy do Railway).
Criar nova migração em dev: `npx prisma migrate dev --name descricao`.

## Organização das APIs

Apenas 4 Route Handlers (o resto é Server Component/Action). Veja [API.md](API.md).

| Rota | Método | Protege com |
|---|---|---|
| `/api/login` | POST | (público) credenciais + TOTP |
| `/api/logout` | GET | cookie de sessão |
| `/api/cron/billing` | GET | `CRON_SECRET` (Bearer) |
| `/api/webhooks/asaas` | POST | `ASAAS_WEBHOOK_TOKEN` (header) |

> O `middleware.ts` ignora `/api/*`, `/login`, `_next` e arquivos estáticos; a
> proteção desses endpoints é feita por token próprio (cron/webhook) ou pelas
> próprias credenciais (login).
