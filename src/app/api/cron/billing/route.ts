import { NextResponse } from "next/server";
import { generateDueInvoices, markOverdueInvoices } from "@/lib/billing";

// Endpoint para o cron job diário.
// Em produção, proteja com um header secreto (CRON_SECRET) e agende via
// Vercel Cron, GitHub Actions ou cron do servidor.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const created = await generateDueInvoices(3);
  const overdue = await markOverdueInvoices();

  return NextResponse.json({
    ok: true,
    invoicesCreated: created.length,
    invoicesMarkedOverdue: overdue,
    ranAt: new Date().toISOString(),
  });
}
