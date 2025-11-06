import React from "react";
import RelatorioFinanceiro from "../components/relatorios/RelatorioFinanceiro";

export default function RelatorioReceitasDespesas() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório Receitas x Despesas</h1>
        <p className="text-gray-600 mt-1">Comparativo entre receitas e despesas do período</p>
      </div>

      <RelatorioFinanceiro tipo="receitas_despesas" />
    </div>
  );
}