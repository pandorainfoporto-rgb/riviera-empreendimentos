import React from "react";
import RelatorioUnidadesComponent from "../components/relatorios/RelatorioUnidades";

export default function RelatorioUnidades() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Unidades</h1>
        <p className="text-gray-600 mt-1">Status e distribuição das unidades por loteamento</p>
      </div>

      <RelatorioUnidadesComponent tipo="unidades_status" />
    </div>
  );
}