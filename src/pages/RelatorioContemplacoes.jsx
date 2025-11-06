import React from "react";
import RelatorioConsorciosComponent from "../components/relatorios/RelatorioConsorcios";

export default function RelatorioContemplacoes() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Contemplações</h1>
        <p className="text-gray-600 mt-1">Histórico de contemplações de consórcios</p>
      </div>

      <RelatorioConsorciosComponent tipo="contemplacoes" />
    </div>
  );
}