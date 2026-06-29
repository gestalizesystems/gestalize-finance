# Manutenção e Evolução

Guia para evoluir o projeto mantendo o padrão arquitetural. Leia primeiro a
[ARQUITETURA.md](ARQUITETURA.md).

## Padrão arquitetural (resumo)

- **Telas = Server Components** que leem o banco via Prisma e renderizam no servidor.
- **Mutações = Server Actions** (`src/app/actions.ts`), nunca chamadas REST internas.
- **Integrações externas = módulos isolados** em `src/lib/*`, sempre tolerantes
  a ausência de configuração (degradam sem quebrar).
- **Regras de negócio** ficam em `src/lib/*` (não nos componentes).
- **APIs (`/api`)** só para o que precisa de HTTP: login, webhook, cron.

## Como criar uma nova funcionalidade / rota (página)

1. Crie a pasta em `src/app/<rota>/page.tsx` (Server Component por padrão).
2. Leia os dados via Prisma (importe `prisma` de `@/lib/prisma`).
3. Para formulários/ações, crie uma **Server Action** em `src/app/actions.ts`
   (`"use server"`), com `revalidatePath()`/`redirect()` ao final.
4. Adicione o item de menu em `src/components/Sidebar.tsx` (array `nav`).
5. A rota já fica **protegida** pelo `middleware.ts` (exige sessão).

## Como adicionar uma nova Server Action

```ts
// src/app/actions.ts
"use server";
export async function minhaAcao(formData: FormData) {
  // valida → prisma.* → revalidatePath("/rota") ou redirect("/rota?ok=1")
}
```
Use no form: `<form action={minhaAcao}>`.

## Como adicionar uma nova integração externa

1. Crie `src/lib/<servico>.ts` com:
   - uma função `xEnabled()` que checa as variáveis necessárias;
   - a função de envio/uso que **retorna cedo** se `!xEnabled()`;
   - chamadas via `fetch` (sem SDK), com `try/catch` e `console.error`.
2. Documente as variáveis em [VARIAVEIS.md](VARIAVEIS.md) e adicione ao `.env.example`.
3. Descreva a integração em [INTEGRACOES.md](INTEGRACOES.md).

## Como criar um novo serviço/módulo de regra

Coloque a lógica pura em `src/lib/<nome>.ts`, exportando funções testáveis.
Evite acoplar regra de negócio a componentes de UI.

## Como adicionar uma variável de ambiente

1. Adicione ao `.env.example` (com comentário e exemplo).
2. Documente na tabela de [VARIAVEIS.md](VARIAVEIS.md).
3. Defina nas **Variables** do Railway (produção).
4. Leia com `process.env.NOME` (e trate ausência com fallback seguro).

## Como adicionar um novo Cron Job

Veja o passo a passo em [CRON.md](CRON.md#como-adicionar-um-novo-cron-job).

## Como mexer no banco de dados

1. Edite `prisma/schema.prisma`.
2. `npx prisma migrate dev --name descricao` (cria a migração + atualiza o client).
3. Em produção, o deploy roda `npx prisma migrate deploy` automaticamente.
4. Nunca edite migrações já aplicadas; crie uma nova.

## Checklist antes de commitar

```bash
npm run build      # build + lint + checagem de tipos (precisa passar)
```
- O `.env` **nunca** entra no commit (já está no `.gitignore`).
- Mensagens de commit em português, objetivas.
- Push na branch `main` dispara o **deploy automático** no Railway.

## Convenções

- **TypeScript** em tudo; evite `any`.
- **Tailwind** para estilo (classes utilitárias; use o helper `cn()` de `@/lib/utils`).
- Ícones via **lucide-react**.
- Formatação de moeda/data via `src/lib/utils.ts`; máscaras via `src/lib/masks.ts`.
- Responsividade: base = mobile; use `sm:`/`lg:` para telas maiores.
