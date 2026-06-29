# Gestalize Finance

Sistema financeiro e de cobranças da **Gestalize Systems**. Controla receitas
(implantação, mensalidades, avulsos) e despesas, gerencia **assinaturas
recorrentes** e roda um **motor de cobrança** que gera o link de pagamento
(Pix/boleto/cartão via Asaas), avisa o cliente por **e-mail (Resend)** e
**WhatsApp (Evolution API)** e dá **baixa automática** quando o pagamento é
confirmado (webhook do Asaas).

> **Em produção:** <https://finance.gestalizesystems.com.br> (Railway).

---

## 📚 Documentação

| Documento | Conteúdo |
|---|---|
| **Este README** | Visão geral, requisitos, instalação, execução, build |
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Estrutura de pastas, fluxos, módulos, autenticação, banco de dados |
| [docs/VARIAVEIS.md](docs/VARIAVEIS.md) | Todas as variáveis de ambiente (obrigatórias/opcionais) |
| [docs/INTEGRACOES.md](docs/INTEGRACOES.md) | Asaas, Resend e Evolution API (configuração, fluxo, erros) |
| [docs/CRON.md](docs/CRON.md) | Motor de cobrança diário (cron job) |
| [docs/API.md](docs/API.md) | Endpoints HTTP (login, logout, cron, webhook) |
| [docs/MANUTENCAO.md](docs/MANUTENCAO.md) | Guia para evoluir o projeto (rotas, serviços, integrações) |
| [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md) | Passo a passo de deploy em produção |
| [CHANGELOG.md](CHANGELOG.md) | Histórico de versões e mudanças |

---

## ✨ Funcionalidades

- **Dashboard** com métricas (receita, MRR/ARR, inadimplência, ticket médio) e gráficos.
- **Clientes** — cadastro com CPF/CNPJ, busca, resumo financeiro por cliente (lucro por cliente).
- **Produtos/Serviços** — catálogo com preço de mensalidade e de implantação.
- **Assinaturas** — planos recorrentes (mensal/anual) com dia de vencimento.
- **Cobranças** — faturas (implantação, mensalidade, avulso e **combo "Implantação + Mensalidade"**), geração de link de pagamento e baixa manual.
- **Pagamentos / Receitas / Despesas** — históricos com filtro por mês.
- **Relatórios** — período personalizável + geração de **PDF** com logo da empresa.
- **Automação** — régua de cobrança (lembrete antes do vencimento, aviso de atraso).
- **Mensagens** — templates editáveis de e-mail e WhatsApp (variáveis dinâmicas).
- **Configurações** — dados da empresa e status das integrações.
- **Login privado** com sessão por cookie assinado e **2FA (TOTP)** opcional.
- Interface **100% responsiva** (drawer no mobile, sidebar no desktop).

---

## 🧰 Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 14.2** (App Router, Server Components, Server Actions, TypeScript) |
| Estilo | **Tailwind CSS** |
| Banco | **PostgreSQL** + **Prisma ORM** |
| Gráficos / Ícones | **Recharts** · **lucide-react** |
| Utilitários | **date-fns** · **clsx** · **tailwind-merge** |
| Pagamento | **Asaas** (REST, sem SDK) |
| E-mail | **Resend** (REST) |
| WhatsApp | **Evolution API** self-hosted (REST) |
| Autenticação | Sessão HMAC-SHA256 (Web Crypto) + TOTP (RFC 6238) |

Não há dependências de SDK das integrações nem de bibliotecas de auth — tudo é
feito com `fetch` e Web Crypto nativos.

---

## ✅ Requisitos

- **Node.js ≥ 18.18** (recomendado 18.20.x). Na máquina do dev: `nvm use 18.20.8`.
- **npm** (vem com o Node).
- **Docker** (para subir o PostgreSQL local) — ou um PostgreSQL já instalado.
- Contas externas **opcionais** (o sistema funciona sem elas, em modo "mock"/desligado):
  - **Asaas** — gateway de pagamento.
  - **Resend** — envio de e-mail.
  - **Evolution API** — envio de WhatsApp (instância self-hosted).

---

## 🚀 Instalação e execução (local)

```bash
# 1. Clonar
git clone https://github.com/nathashaloppes/Gestalize-Finance.git
cd Gestalize-Finance

# 2. Garantir o Node correto
nvm use 18.20.8            # ou qualquer Node >= 18.18

# 3. Instalar dependências (o postinstall roda `prisma generate`)
npm install

# 4. Configurar o ambiente
cp .env.example .env
#   edite o .env conforme docs/VARIAVEIS.md (o mínimo já vem pronto p/ local)

# 5. Subir o banco (PostgreSQL via Docker, exposto na porta 5433)
docker compose up -d

# 6. Aplicar o schema e popular com dados de exemplo
npx prisma migrate dev
npm run seed              # opcional: dados de demonstração

# 7. Rodar em desenvolvimento (porta 3010)
npm run dev
# abra http://localhost:3010
```

> O login local usa `AUTH_EMAIL` / `AUTH_PASSWORD` definidos no `.env`.

### Build e produção (local)

```bash
npm run build             # compila (lint + types + build)
npm run start             # sobe o servidor de produção
```

Em produção real (Railway), o deploy roda automaticamente
`npx prisma migrate deploy && npm run start` — ver [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md).

---

## 📜 Scripts npm

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento na porta **3010** |
| `npm run build` | Build de produção (inclui lint e checagem de tipos) |
| `npm run start` | Servidor de produção (`next start`) |
| `npm run lint` | ESLint (`next lint`) |
| `npm run seed` | Popula o banco com dados de exemplo (`prisma/seed.ts`) |
| `npm run db:studio` | Abre o **Prisma Studio** (visualizar/editar dados) |
| `npm run db:migrate:deploy` | Aplica migrações pendentes (usado no deploy) |
| `postinstall` | `prisma generate` (roda sozinho após `npm install`) |

---

## 🗂️ Estrutura resumida

```
src/
  app/                  # Rotas (App Router): páginas + endpoints de API
    actions.ts          # Server Actions (criar/baixar/billing/configs)
    api/                # login, logout, cron/billing, webhooks/asaas
  components/           # Componentes de UI (Sidebar, AppShell, charts, forms…)
  lib/                  # Regras e integrações (prisma, asaas, billing, email,
                        #   whatsapp, auth, totp, settings, metrics, masks…)
prisma/
  schema.prisma         # Modelo de dados (7 tabelas)
  migrations/           # Histórico de migrações
  seed.ts               # Dados de exemplo
docs/                   # Documentação detalhada
```

Detalhes completos em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

---

## ⚙️ Notas do ambiente local

- O `docker-compose.yml` expõe o PostgreSQL na porta **5433** (para não conflitar
  com um Postgres nativo na 5432). O `.env` local deve apontar para `localhost:5433`.
- O `npm run dev` usa a porta **3010**.
- As integrações (Asaas/Resend/Evolution) são **opcionais**: sem chaves, o Asaas
  roda em `mock` (links fake) e e-mail/WhatsApp são apenas ignorados (sem erro).
