import React from "react";
import RelatorioDREComponent from "../components/relatorios/RelatorioDRE";

export default function RelatorioDRE() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">DRE - Demonstração de Resultados</h1>
        <p className="text-gray-600 mt-1">Análise completa do resultado do exercício</p>
      </div>

      <RelatorioDREComponent />
    </div>
  );
}