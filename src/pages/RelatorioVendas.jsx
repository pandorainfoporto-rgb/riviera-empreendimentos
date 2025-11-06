import React from "react";
import RelatorioUnidadesComponent from "../components/relatorios/RelatorioUnidades";

export default function RelatorioVendas() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Vendas</h1>
        <p className="text-gray-600 mt-1">Análise de vendas e faturamento de unidades</p>
      </div>

      <RelatorioUnidadesComponent tipo="vendas" />
    </div>
  );
}