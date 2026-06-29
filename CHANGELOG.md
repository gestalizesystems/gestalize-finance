# Changelog

Todas as mudanças relevantes do **Gestalize Finance**. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versão atual: **0.1.0**.

> Datas no fuso America/Sao_Paulo. Cada `git push` na branch `main` publica
> automaticamente em <https://finance.gestalizesystems.com.br> (Railway).

---

## [0.1.0] — 2026-06-28

Primeira versão completa, **em produção** e com o ciclo de cobrança ponta a ponta.

### Adicionado
- **Documentação completa**: README reescrito + `docs/` (Arquitetura, Variáveis,
  Integrações, Cron, API, Manutenção) + guia de deploy revisado.
- **2FA (TOTP)** opcional no login (RFC 6238, Web Crypto, sem dependências).
- **Logo da empresa** no cabeçalho do PDF de relatório.
- Cobrança **"Implantação + Mensalidade"** (combo): um pagamento, duas receitas.
- **Relatórios** com filtro de período + geração de **PDF**.
- **Mensagens**: templates editáveis de e-mail e WhatsApp (variáveis dinâmicas).
- **Configurações** da empresa + status das integrações.
- **Automação**: visão da régua de cobrança.
- Excluir cobrança/despesa.
- Filtro de meses baseado no histórico real (dashboard, receitas, pagamentos).
- **Responsividade mobile**: sidebar vira drawer + ajustes de layout.

### Alterado
- Ícone do app na tela inicial (iOS/Android) agora com **fundo branco**
  (favicon da aba permanece transparente).
- "Fluxo de Cobrança" do dashboard alinhado.
- Confirmação visual ao salvar configurações; dedupe de integrações.

### Corrigido
- **Asaas**: URL de produção é `/v3` (sem `/api`) — corrige 404.
- **Asaas**: vencimento não pode ser no passado (`invalid_dueDate`) — formulário força mín. = hoje.
- Webhook do Asaas: trata também **vencimento**, **cancelamento** e **estorno**.

### Removido
- Código e assets mortos (fontes órfãs, componente/funções sem uso) e a
  dependência `zod` (auditoria, sem mudança de comportamento).
- Dados de teste do banco de produção (mantendo produtos e configurações reais).

---

## [Marco] — 2026-06-27

Integrações externas e publicação em produção.

### Adicionado
- **Webhook do Asaas** (`/api/webhooks/asaas`): baixa automática ao confirmar pagamento.
- **Integração de e-mail (Resend)** para cobranças.
- **Integração de WhatsApp** para cobranças.
- **Login privado** (sessão por cookie assinado) + preparo para deploy.
- Favicon com o robô da marca.

### Alterado
- **WhatsApp: Z-API → Evolution API** (self-hosted, sem mensalidade da Z-API).

### Corrigido
- **Logout em produção**: redirect relativo para `/login` (evitava cair em `localhost`).
- **Build no Railway**: normalização do `NEXT_PUBLIC_SITE_URL` (prefixa `https://`).

---

## [Início] — 2026-06-26

MVP e identidade visual.

### Adicionado
- **MVP**: dashboard, **motor de cobrança** (billing engine) e CRUD
  (clientes, produtos, assinaturas, cobranças, despesas).
- Identidade visual, paginação e **resumo financeiro por cliente** (lucro por cliente).

---

## Como manter este arquivo

A cada conjunto de mudanças relevante, adicione um item na seção apropriada
(**Adicionado**, **Alterado**, **Corrigido**, **Removido**) sob a versão atual.
Ao publicar uma versão estável, renomeie a seção de trabalho para a nova versão
com a data e abra uma nova seção no topo.
