import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, Building2, Users, Package, DollarSign, Briefcase, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Relatorios() {
  const categorias = [
    {
      id: "financeiro",
      nome: "Financeiro",
      icon: DollarSign,
      color: "green",
      relatorios: [
        { id: "dre", nome: "DRE - Demonstração de Resultados", url: createPageUrl("RelatorioDRE") },
        { id: "fluxo_caixa", nome: "Fluxo de Caixa Detalhado", url: createPageUrl("RelatorioFluxoCaixa") },
        { id: "receitas_despesas", nome: "Receitas x Despesas", url: createPageUrl("RelatorioReceitasDespesas") },
        { id: "aportes", nome: "Aportes de Sócios", url: createPageUrl("RelatorioAportes") },
      ]
    },
    {
      id: "unidades",
      nome: "Unidades",
      icon: Building2,
      color: "blue",
      relatorios: [
        { id: "unidades_status", nome: "Status das Unidades", url: createPageUrl("RelatorioUnidades") },
        { id: "vendas", nome: "Relatório de Vendas", url: createPageUrl("RelatorioVendas") },
      ]
    },
    {
      id: "obras",
      nome: "Obras",
      icon: Briefcase,
      color: "orange",
      relatorios: [
        { id: "cronograma", nome: "Cronograma de Obras", url: createPageUrl("RelatorioCronograma") },
        { id: "execucao", nome: "Execução de Obras", url: createPageUrl("RelatorioExecucao") },
      ]
    },
    {
      id: "consorcios",
      nome: "Consórcios",
      icon: TrendingUp,
      color: "purple",
      relatorios: [
        { id: "cotas", nome: "Cotas de Consórcios", url: createPageUrl("RelatorioConsorcios") },
        { id: "contemplacoes", nome: "Contemplações", url: createPageUrl("RelatorioContemplacoes") },
      ]
    },
    {
      id: "estoque",
      nome: "Estoque",
      icon: Package,
      color: "indigo",
      relatorios: [
        { id: "produtos", nome: "Estoque de Produtos", url: createPageUrl("RelatorioEstoque") },
        { id: "compras", nome: "Histórico de Compras", url: createPageUrl("RelatorioCompras") },
      ]
    },
    {
      id: "cadastros",
      nome: "Cadastros",
      icon: Users,
      color: "gray",
      relatorios: [
        { id: "clientes", nome: "Clientes", url: createPageUrl("RelatorioClientes") },
        { id: "fornecedores", nome: "Fornecedores", url: createPageUrl("RelatorioFornecedores") },
        { id: "socios", nome: "Sócios", url: createPageUrl("RelatorioSocios") },
      ]
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Central de Relatórios</h1>
        <p className="text-gray-600 mt-1">Análises e relatórios gerenciais completos</p>
      </div>

      <div className="grid gap-6">
        {categorias.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card key={cat.id} className="shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-4 rounded-xl bg-${cat.color}-100`}>
                    <Icon className={`w-8 h-8 text-${cat.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{cat.nome}</h3>
                    <p className="text-sm text-gray-600">{cat.relatorios?.length || 0} relatórios disponíveis</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-3">
                  {(cat.relatorios || []).map((rel) => (
                    <Link key={rel.id} to={rel.url}>
                      <Button
                        variant="outline"
                        className="w-full justify-between hover:bg-gray-50"
                      >
                        <span>{rel.nome}</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}