"use client";

import { useState } from "react";
import { createInvoice } from "@/app/actions";

type ClientOpt = { id: string; name: string };

export function NewInvoiceForm({ clients }: { clients: ClientOpt[] }) {
  const [type, setType] = useState("IMPLEMENTATION");
  const combo = type === "COMBO";
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local

  return (
    <form action={createInvoice} className="card space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <select name="clientId" required className="input lg:col-span-2">
          <option value="">Selecione o cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input name="description" required placeholder="Descrição (ex: Bot WhatsApp)" className="input lg:col-span-2" />

        {combo ? (
          <>
            <input name="implAmount" type="number" step="0.01" min="0" placeholder="Implantação (R$)" className="input" />
            <input name="subAmount" type="number" step="0.01" min="0" placeholder="Mensalidade (R$)" className="input" />
          </>
        ) : (
          <input name="amount" type="number" step="0.01" required placeholder="Valor (R$)" className="input" />
        )}

        <input name="dueDate" type="date" required min={today} defaultValue={today} className="input" />

        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input lg:col-span-2"
        >
          <option value="IMPLEMENTATION">Implementação</option>
          <option value="EXTRA">Avulso / Upgrade</option>
          <option value="SUBSCRIPTION">Mensalidade</option>
          <option value="COMBO">Implantação + Mensalidade</option>
        </select>
      </div>

      {combo && (
        <p className="text-xs text-slate-500">
          Gera <span className="text-slate-300">um único pagamento</span> com o total (implantação + mensalidade). Cada valor entra na receita com seu tipo correto.
        </p>
      )}

      <button className="btn-primary">+ Gerar cobrança (com link de pagamento)</button>
    </form>
  );
}
