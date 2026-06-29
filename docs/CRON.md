# Cron Jobs

O sistema tem **um** cron job: o **motor de cobrança diário**. Ele não roda
dentro do app (Next.js não tem agendador embutido) — é disparado por um
agendador externo que chama um endpoint HTTP.

---

## Motor de cobrança (billing)

| Campo | Valor |
|---|---|
| **Nome** | Motor de cobrança diário |
| **Objetivo** | Gerar faturas das assinaturas no vencimento e marcar atrasos |
| **Frequência** | Diária |
| **Horário sugerido** | 09:00 (America/Sao_Paulo) |
| **Expressão Cron** | `0 9 * * *` |
| **Endpoint** | `GET /api/cron/billing` |
| **Arquivo (endpoint)** | `src/app/api/cron/billing/route.ts` |
| **Arquivo (lógica)** | `src/lib/billing.ts` |
| **Proteção** | Header `Authorization: Bearer <CRON_SECRET>` |
| **Agendador** | Externo (ex.: [cron-job.org](https://cron-job.org)) |

### Fluxo completo de execução
1. O agendador externo faz `GET /api/cron/billing` com o header
   `Authorization: Bearer <CRON_SECRET>`.
2. O endpoint valida o token (401 se inválido — só se `CRON_SECRET` estiver definido).
3. **`generateDueInvoices(3)`** — para cada assinatura `ACTIVE` cujo
   `nextDueDate` cai nos próximos **3 dias**:
   - cria a `Invoice` (tipo `SUBSCRIPTION`, status `PENDING`);
   - gera a cobrança no gateway (`asaas.createCharge`) e salva `externalId` + `paymentLink`;
   - envia **e-mail** (Resend) e **WhatsApp** (Evolution), se o cliente tiver contato;
   - avança o `nextDueDate` conforme o ciclo (mensal/anual).
   - É **idempotente**: não duplica fatura para o mesmo vencimento.
4. **`markOverdueInvoices()`** — marca como `OVERDUE` as faturas `PENDING`
   vencidas e coloca os clientes correspondentes como `DELINQUENT`.
5. Responde JSON:
   ```json
   { "ok": true, "invoicesCreated": 2, "invoicesMarkedOverdue": 1, "ranAt": "..." }
   ```

### Serviços e dependências envolvidos
- **Banco** (Prisma) — leitura/escrita de assinaturas, faturas, clientes.
- **Asaas** — geração do link de pagamento.
- **Resend** — e-mail de cobrança.
- **Evolution API** — WhatsApp de cobrança.

### Logs e tratamento de erros
- Cada integração roda em `try/catch`: falha de gateway/e-mail/WhatsApp é
  registrada com `console.error` **sem interromper** o restante do processamento.
- Em produção, os logs aparecem nos **Logs** do serviço no Railway.
- O agendador (cron-job.org) registra o status HTTP de cada execução.

### Como executar manualmente
- **Pela interface:** botão **"Rodar motor de cobrança"** em `/cobrancas`.
- **Por HTTP:**
  ```bash
  curl -i https://finance.gestalizesystems.com.br/api/cron/billing \
    -H "Authorization: Bearer SEU_CRON_SECRET"
  ```
- **Local:**
  ```bash
  curl -i http://localhost:3010/api/cron/billing \
    -H "Authorization: Bearer SEU_CRON_SECRET"
  ```

### Como testar
1. Crie uma assinatura com `nextDueDate` dentro dos próximos 3 dias.
2. Chame o endpoint (manual ou pelo botão).
3. Confirme em `/cobrancas` que a fatura foi criada com link de pagamento, e que
   o JSON retornou `invoicesCreated >= 1`.

---

## Configurar o cron em produção (cron-job.org)

1. Crie uma conta em <https://cron-job.org>.
2. **Create cronjob:**
   - **URL:** `https://finance.gestalizesystems.com.br/api/cron/billing`
   - **Schedule:** diário às 09:00 (expressão `0 9 * * *`).
   - **Advanced → Headers:** `Authorization: Bearer SEU_CRON_SECRET`
     (o mesmo valor definido em `CRON_SECRET` nas Variables do Railway).
3. Salve e use **"Run now"** para validar (deve retornar HTTP 200 + JSON `ok:true`).
4. Acompanhe o histórico de execuções no painel do cron-job.org.

> Alternativas ao cron-job.org: GitHub Actions agendado, cron de servidor, ou
> qualquer serviço que faça uma requisição HTTP agendada com o header de Bearer.

---

## Como adicionar um novo Cron Job

1. Crie a lógica em `src/lib/` (uma função pura, testável).
2. Crie o endpoint `src/app/api/cron/<nome>/route.ts` exportando `GET`, validando
   `CRON_SECRET` igual ao billing.
3. Cadastre uma nova tarefa no agendador externo apontando para o endpoint.
4. Documente aqui (nome, objetivo, frequência, expressão, arquivo).

### Boas práticas
- **Proteja** todo endpoint de cron com `CRON_SECRET`.
- Mantenha a lógica **idempotente** (rodar duas vezes não duplica dados).
- Capture erros por item (`try/catch`) para uma falha não abortar o lote.
- Retorne um **resumo em JSON** (quantidades) para facilitar o monitoramento.
- Use `console.error` para falhas — elas aparecem nos Logs do Railway.
