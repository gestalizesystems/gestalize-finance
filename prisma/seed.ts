import { PrismaClient } from "@prisma/client";
import { subMonths, startOfMonth, addDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("Limpando dados...");
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.cost.deleteMany();
  await prisma.product.deleteMany();
  await prisma.client.deleteMany();

  console.log("Criando produtos/serviços...");
  const crm = await prisma.product.create({
    data: { name: "CRM Empresarial", defaultPrice: 159.9, implementationPrice: 800, type: "RECURRING", description: "Sistema de CRM completo com gestão de leads, funil de vendas e relatórios." },
  });
  const bot = await prisma.product.create({
    data: { name: "Bot WhatsApp Inteligente", defaultPrice: 199.9, implementationPrice: 1200, type: "RECURRING", description: "Atendimento automatizado no WhatsApp com fluxos personalizados e IA." },
  });
  const site = await prisma.product.create({
    data: { name: "Site Institucional", defaultPrice: 149.9, implementationPrice: 1500, type: "RECURRING", description: "Site institucional responsivo + hospedagem e domínio." },
  });
  const agenda = await prisma.product.create({
    data: { name: "Sistema de Agendamento", defaultPrice: 179.9, implementationPrice: 600, type: "RECURRING", description: "Agenda online com confirmação automática e lembretes." },
  });
  const pdv = await prisma.product.create({
    data: { name: "Sistema PDV", defaultPrice: 249.9, implementationPrice: 900, type: "RECURRING", description: "Ponto de venda completo com controle de estoque e caixa." },
  });

  console.log("Criando clientes...");
  const joao = await prisma.client.create({
    data: { name: "João da Silva LTDA", email: "joao@empresa.com", phone: "+5511999990001", document: "12.345.678/0001-90" },
  });
  const maria = await prisma.client.create({
    data: { name: "Maria Comércio ME", email: "maria@comercio.com", phone: "+5511999990002", document: "98.765.432/0001-10" },
  });
  const pedro = await prisma.client.create({
    data: { name: "Pedro Santos", email: "pedro@gmail.com", phone: "+5511999990003" },
  });
  const clinica = await prisma.client.create({
    data: { name: "Clínica Saúde+", email: "contato@saudemais.com", phone: "+5511999990004", document: "11.222.333/0001-44" },
  });
  const exemplo = await prisma.client.create({
    data: { name: "Empresa Exemplo LTDA", email: "financeiro@exemplo.com", phone: "+5511999990005", document: "55.666.777/0001-88" },
  });

  console.log("Criando assinaturas...");
  const now = new Date();
  const nextDue = (day: number) => {
    const d = new Date(now.getFullYear(), now.getMonth(), day);
    if (d < now) d.setMonth(d.getMonth() + 1);
    return d;
  };

  await prisma.subscription.create({ data: { clientId: joao.id, productId: crm.id, amount: 159.9, dueDay: 5, startDate: subMonths(now, 6), nextDueDate: nextDue(5) } });
  await prisma.subscription.create({ data: { clientId: maria.id, productId: bot.id, amount: 199.9, dueDay: 6, startDate: subMonths(now, 4), nextDueDate: nextDue(6) } });
  await prisma.subscription.create({ data: { clientId: pedro.id, productId: site.id, amount: 149.9, dueDay: 28, startDate: subMonths(now, 5), nextDueDate: nextDue(28) } });
  await prisma.subscription.create({ data: { clientId: clinica.id, productId: agenda.id, amount: 179.9, dueDay: 20, startDate: subMonths(now, 3), nextDueDate: nextDue(20) } });
  await prisma.subscription.create({ data: { clientId: exemplo.id, productId: pdv.id, amount: 249.9, dueDay: 7, startDate: subMonths(now, 2), nextDueDate: nextDue(7) } });

  console.log("Criando histórico de faturas + pagamentos (6 meses)...");
  // Gera pagamentos passados para alimentar os gráficos.
  const subsData = [
    { client: joao, product: crm, amount: 159.9 },
    { client: maria, product: bot, amount: 199.9 },
    { client: pedro, product: site, amount: 149.9 },
    { client: clinica, product: agenda, amount: 179.9 },
    { client: exemplo, product: pdv, amount: 249.9 },
  ];

  for (let m = 5; m >= 1; m--) {
    const monthRef = startOfMonth(subMonths(now, m));
    for (const s of subsData) {
      const due = addDays(monthRef, 4);
      const inv = await prisma.invoice.create({
        data: {
          clientId: s.client.id,
          productId: s.product.id,
          description: `Mensalidade ${s.product.name}`,
          type: "SUBSCRIPTION",
          amount: s.amount,
          dueDate: due,
          status: "PAID",
          paidAt: addDays(due, 1),
          createdAt: monthRef,
        },
      });
      await prisma.payment.create({
        data: { invoiceId: inv.id, amount: s.amount, method: "PIX", paidAt: addDays(due, 1) },
      });
    }
    // Implementação avulsa em alguns meses (entrada única).
    if (m % 2 === 0) {
      const inv = await prisma.invoice.create({
        data: {
          clientId: exemplo.id,
          productId: pdv.id,
          description: "Taxa de implementação Sistema PDV",
          type: "IMPLEMENTATION",
          amount: 800,
          dueDate: addDays(monthRef, 10),
          status: "PAID",
          paidAt: addDays(monthRef, 11),
          createdAt: monthRef,
        },
      });
      await prisma.payment.create({ data: { invoiceId: inv.id, amount: 800, method: "PIX", paidAt: addDays(monthRef, 11) } });
    }
  }

  console.log("Criando faturas do mês atual (em aberto)...");
  // Pendentes / atrasada para o dashboard atual.
  await prisma.invoice.create({
    data: { clientId: joao.id, productId: crm.id, description: "Mensalidade CRM Empresarial", type: "SUBSCRIPTION", amount: 159.9, dueDate: new Date(now.getFullYear(), now.getMonth(), 5), status: "PENDING" },
  });
  await prisma.invoice.create({
    data: { clientId: maria.id, productId: bot.id, description: "Mensalidade Bot WhatsApp Inteligente", type: "SUBSCRIPTION", amount: 199.9, dueDate: new Date(now.getFullYear(), now.getMonth(), 6), status: "PENDING" },
  });
  const overdue = await prisma.invoice.create({
    data: { clientId: pedro.id, productId: site.id, description: "Mensalidade Site Institucional", type: "SUBSCRIPTION", amount: 149.9, dueDate: subMonths(new Date(now.getFullYear(), now.getMonth(), 28), 1), status: "OVERDUE" },
  });
  await prisma.client.update({ where: { id: pedro.id }, data: { status: "DELINQUENT" } });
  await prisma.invoice.create({
    data: { clientId: exemplo.id, productId: pdv.id, description: "Mensalidade Sistema PDV", type: "SUBSCRIPTION", amount: 249.9, dueDate: new Date(now.getFullYear(), now.getMonth(), 7), status: "PENDING" },
  });

  // Fatura paga recente.
  const paidInv = await prisma.invoice.create({
    data: { clientId: clinica.id, productId: agenda.id, description: "Mensalidade Sistema de Agendamento", type: "SUBSCRIPTION", amount: 179.9, dueDate: new Date(now.getFullYear(), now.getMonth(), 20), status: "PAID", paidAt: new Date() },
  });
  await prisma.payment.create({ data: { invoiceId: paidInv.id, amount: 179.9, method: "PIX", paidAt: new Date() } });

  console.log("Criando custos (saídas)...");
  for (let m = 5; m >= 0; m--) {
    const monthRef = startOfMonth(subMonths(now, m));
    await prisma.cost.create({ data: { description: "Servidor / Hospedagem (VPS)", amount: 320, category: "SERVER", recurring: true, date: monthRef } });
    await prisma.cost.create({ data: { description: "API WhatsApp (Z-API)", amount: 99, category: "API", recurring: true, date: monthRef } });
    await prisma.cost.create({ data: { description: "Ferramentas / SaaS diversos", amount: 180, category: "FIXED", recurring: true, date: monthRef } });
    await prisma.cost.create({ data: { description: "Custo direto cliente Empresa Exemplo", amount: 120, category: "PER_CLIENT", clientId: exemplo.id, productId: pdv.id, date: monthRef } });
  }

  console.log("✅ Seed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
