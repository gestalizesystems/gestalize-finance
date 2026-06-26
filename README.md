# Gestalize Finance

Sistema financeiro e de cobranças da **Gestalize Systems** — controle de
entradas (implementação, mensalidades, avulsos), saídas (custos por sistema,
ferramentas, servidores), assinaturas recorrentes e motor de cobrança com
link de pagamento (Asaas).

## Stack

- **Next.js 14** (App Router, TypeScript) + **Tailwind CSS**
- **Prisma** + **PostgreSQL** (via Docker)
- **Recharts** (gráficos) · **lucide-react** (ícones)
- Camada de pagamento **Asaas** (modo `mock` por padrão)

## Como rodar (local)

> Requer Node 18+. Na sua máquina: `nvm use 18.20.8`.

```bash
# 1. Sobe o banco (Postgres na porta 5433 p/ não conflitar com o Postgres nativo)
docker compose up -d

# 2. Aplica o schema e popula com dados de exemplo
npx prisma migrate dev
npm run seed

# 3. Sobe o app (porta 3010 p/ não conflitar com o app Rails na 3000)
npm run dev
# abra http://localhost:3010
```

Scripts úteis:

- `npm run seed` — popula o banco com dados de demonstração
- `npm run db:studio` — abre o Prisma Studio (visualizar/editar dados)

## Estrutura

```
src/
  app/
    page.tsx              # Dashboard
    clientes/             # CRUD de clientes
    cobrancas/            # Faturas + dar baixa + gerar cobrança avulsa
    assinaturas/          # Planos recorrentes
    produtos/             # Sistemas/serviços vendidos
    despesas/             # Custos (saídas)
    pagamentos/ receitas/ # Históricos
    relatorios/ automacao/ mensagens/ configuracoes/  # Roadmap
    actions.ts            # Server actions (criar/baixar/billing)
    api/cron/billing/     # Endpoint do cron diário
  lib/
    prisma.ts             # Cliente Prisma (singleton)
    asaas.ts              # Gateway de pagamento (mock | sandbox | live)
    billing.ts            # Motor de cobrança (gera faturas, atrasos)
    metrics.ts            # Agregações do dashboard (receita, MRR, etc.)
    utils.ts              # Formatadores (R$, datas)
prisma/
  schema.prisma          # Modelo de dados
  seed.ts                # Dados de exemplo
```

## Motor de cobrança

`src/lib/billing.ts` contém a lógica central:

- `generateDueInvoices()` — gera faturas das assinaturas no vencimento
- `markOverdueInvoices()` — marca atrasos e inadimplência
- `registerPayment()` — dá baixa e reativa o cliente

Pode ser disparado:
- manualmente pelo botão **"Rodar motor de cobrança"** em `/cobrancas`
- pelo endpoint `GET /api/cron/billing` (agende um cron job diário)

## Ativando o Asaas (pagamentos reais)

Por padrão roda em **mock** (gera links fake, sem conta). Para ativar:

1. Crie conta no Asaas e gere uma API key (comece pelo **sandbox**).
2. No `.env`:
   ```
   ASAAS_MODE="sandbox"
   ASAAS_API_KEY="sua_chave"
   ASAAS_BASE_URL="https://sandbox.asaas.com/api/v3"
   ```
3. Reinicie o app. As novas cobranças passam a gerar Pix/boleto/cartão reais.

Falta plugar ainda (próximas etapas): **webhook** do Asaas para confirmar
pagamento automaticamente, e os envios de **WhatsApp** (Z-API/Twilio) e
**e-mail** (Resend) da régua de cobrança.

## Notas do ambiente local

- Há um **Postgres nativo** na porta 5432 → o Docker usa a **5433**.
- Há um **app Rails** na porta 3000 → o Next usa a **3010**.
