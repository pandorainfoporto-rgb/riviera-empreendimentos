import React from "react";
import RelatorioClientesFornecedores from "../components/relatorios/RelatorioClientesFornecedores";

export default function RelatorioFornecedores() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Fornecedores</h1>
        <p className="text-gray-600 mt-1">Listagem completa de fornecedores cadastrados</p>
      </div>

      <RelatorioClientesFornecedores tipo="fornecedores" />
    </div>
  );
}