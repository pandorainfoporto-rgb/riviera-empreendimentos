import React from "react";
import RelatorioConsorciosComponent from "../components/relatorios/RelatorioConsorcios";

export default function RelatorioConsorcios() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Cotas de Consórcios</h1>
        <p className="text-gray-600 mt-1">Acompanhamento de todas as cotas de consórcios</p>
      </div>

      <RelatorioConsorciosComponent tipo="cotas" />
    </div>
  );
}