import React from "react";
import RelatorioClientesFornecedores from "../components/relatorios/RelatorioClientesFornecedores";

export default function RelatorioSocios() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Sócios</h1>
        <p className="text-gray-600 mt-1">Listagem completa de sócios cadastrados</p>
      </div>

      <RelatorioClientesFornecedores tipo="socios" />
    </div>
  );
}