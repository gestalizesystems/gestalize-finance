# Gestalize Finance

Sistema de gestão financeira e de cobranças desenvolvido para a Gestalize
Systems. A plataforma centraliza o controle de receitas e despesas, administra
assinaturas recorrentes e automatiza todo o ciclo de cobrança — da geração da
fatura à confirmação do pagamento.

## Sobre o projeto

O objetivo é substituir controles manuais (planilhas e conferências avulsas) por
um fluxo único e automatizado. A partir do cadastro de clientes, produtos e
assinaturas, o sistema gera as cobranças no vencimento, notifica o cliente,
disponibiliza um link de pagamento e concilia o recebimento de forma automática,
mantendo receitas, despesas e indicadores sempre atualizados.

## Principais funcionalidades

- Painel com indicadores financeiros (receita, receita recorrente, ticket médio,
  inadimplência) e gráficos de evolução.
- Cadastro de clientes com resumo e apuração de resultado por cliente.
- Catálogo de produtos e serviços, com valores de mensalidade e de implantação.
- Assinaturas recorrentes (mensais e anuais) com controle de vencimento.
- Geração de cobranças, incluindo o modelo combinado de implantação e
  mensalidade em um único pagamento.
- Régua de cobrança automatizada, com aviso de vencimento e de atraso.
- Conciliação automática do pagamento e baixa da fatura.
- Relatórios por período e emissão de documento em PDF.
- Modelos de mensagem editáveis para os canais de comunicação.
- Acesso privado com autenticação e segundo fator (2FA) opcional.
- Interface responsiva, adaptada para uso em computador, tablet e celular.

## Arquitetura e decisões técnicas

O sistema foi construído como uma aplicação única em Next.js (App Router). As
telas são renderizadas no servidor e as operações de escrita usam Server
Actions, dispensando uma camada de API tradicional para o uso interno. Alguns
poucos endpoints existem apenas para integrações externas e tarefas agendadas.

Decisões que orientaram a construção:

- Camada de dados com Prisma sobre PostgreSQL, com modelo de dados normalizado e
  migrações versionadas.
- Autenticação implementada com primitivas nativas de criptografia (sem
  bibliotecas de terceiros), incluindo sessão assinada e segundo fator TOTP.
- Integrações externas consumidas por REST, isoladas em módulos próprios e com
  degradação graciosa — quando um serviço não está configurado, a funcionalidade
  é simplesmente ignorada, sem afetar o restante do fluxo.
- Motor de cobrança idempotente, projetado para ser executado por um agendador e
  não duplicar faturas.
- Conciliação de pagamentos por webhook, com suporte a cenários de pagamento,
  atraso, cancelamento e estorno.
- Entrega contínua: cada atualização na branch principal é publicada
  automaticamente no ambiente de produção.

A descrição detalhada da arquitetura, dos fluxos e do modelo de dados está em
[docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Tecnologias

- Next.js 14 (App Router, Server Components e Server Actions) com TypeScript
- Tailwind CSS
- PostgreSQL com Prisma ORM
- Recharts (gráficos) e lucide-react (ícones)
- Integrações de pagamento, e-mail e mensageria via REST

## Estrutura do projeto

```
src/
  app/          Rotas: páginas, Server Actions e endpoints de integração
  components/   Componentes de interface
  lib/          Regras de negócio e integrações (dados, cobrança, notificações)
prisma/         Modelo de dados e migrações
docs/           Documentação técnica
```

## Documentação

- [docs/ARQUITETURA.md](docs/ARQUITETURA.md) — arquitetura, fluxos e modelo de dados
- [CHANGELOG.md](CHANGELOG.md) — histórico de versões

## Status

Projeto em produção, em uso pela Gestalize Systems.
