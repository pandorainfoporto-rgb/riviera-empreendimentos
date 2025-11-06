import React from "react";
import RelatorioAportesSocios from "../components/relatorios/RelatorioAportesSocios";

export default function RelatorioAportes() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Aportes de Sócios</h1>
        <p className="text-gray-600 mt-1">Acompanhamento detalhado dos aportes realizados</p>
      </div>

      <RelatorioAportesSocios />
    </div>
  );
}