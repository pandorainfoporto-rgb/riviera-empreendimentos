import React from "react";
import RelatorioEstoqueComponent from "../components/relatorios/RelatorioEstoque";

export default function RelatorioCompras() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Compras</h1>
        <p className="text-gray-600 mt-1">Histórico de compras e aquisições</p>
      </div>

      <RelatorioEstoqueComponent tipo="compras" />
    </div>
  );
}