# Changelog

Registro das mudanças relevantes do Gestalize Finance. O formato é baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versão atual: 0.1.0.

---

## [0.1.0] — 2026-06-28

Primeira versão completa, em produção, com o ciclo de cobrança de ponta a ponta.

### Adicionado
- Documentação técnica do projeto.
- Segundo fator de autenticação (TOTP) opcional no login.
- Logo da empresa no cabeçalho do relatório em PDF.
- Cobrança combinada de implantação e mensalidade em um único pagamento.
- Relatórios com filtro por período e geração de documento em PDF.
- Modelos de mensagem editáveis para os canais de comunicação.
- Tela de configurações da empresa e situação das integrações.
- Visão da régua de cobrança automatizada.
- Exclusão de cobranças e despesas.
- Filtro de meses baseado no histórico real de movimentações.
- Interface responsiva, com navegação adaptada para dispositivos móveis.

### Alterado
- Padronização do ícone da aplicação e ajustes visuais do painel.
- Confirmação visual ao salvar configurações.

### Corrigido
- Ajustes no fluxo de cobrança para garantir a geração correta do link de
  pagamento e o tratamento de vencimentos.
- Conciliação por webhook ampliada para tratar pagamento, vencimento,
  cancelamento e estorno.

### Removido
- Código e recursos sem uso, além de uma dependência não utilizada (limpeza sem
  mudança de comportamento).
- Dados de teste do ambiente de produção.

---

## [0.0.2] — 2026-06-27

Integrações externas e publicação em produção.

### Adicionado
- Conciliação automática de pagamentos por webhook.
- Integração de e-mail para envio de cobranças.
- Integração de mensageria para envio de cobranças.
- Acesso privado com sessão autenticada e preparação para produção.
- Identidade visual da marca.

### Alterado
- Substituição do provedor de mensageria por uma solução self-hosted, reduzindo
  custo operacional.

### Corrigido
- Ajustes de compatibilidade e de encerramento de sessão no ambiente de produção.

---

## [0.0.1] — 2026-06-26

Versão inicial (MVP) e identidade visual.

### Adicionado
- Painel, motor de cobrança e cadastros de clientes, produtos, assinaturas,
  cobranças e despesas.
- Paginação e apuração de resultado por cliente.

---

## Manutenção deste arquivo

A cada conjunto de mudanças relevante, registre um item na seção correspondente
(Adicionado, Alterado, Corrigido ou Removido). Ao publicar uma nova versão
estável, promova a seção de trabalho para a nova versão com a respectiva data.
