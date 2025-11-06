import React from "react";
import RelatorioFluxoCaixaDetalhado from "../components/relatorios/RelatorioFluxoCaixaDetalhado";

export default function RelatorioFluxoCaixa() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Fluxo de Caixa Detalhado</h1>
        <p className="text-gray-600 mt-1">Análise completa de entradas e saídas</p>
      </div>

      <RelatorioFluxoCaixaDetalhado />
    </div>
  );
}