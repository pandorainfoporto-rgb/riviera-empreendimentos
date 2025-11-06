import React from "react";
import RelatorioObras from "../components/relatorios/RelatorioObras";

export default function RelatorioExecucao() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Execução de Obras</h1>
        <p className="text-gray-600 mt-1">Detalhamento da execução e progresso das obras</p>
      </div>

      <RelatorioObras tipo="execucao" />
    </div>
  );
}