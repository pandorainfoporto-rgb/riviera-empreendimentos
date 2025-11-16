import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, Building2, Users, Package, DollarSign, Briefcase, ChevronRight, FileSignature, ShoppingCart } from "lucide-react";
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
        { id: "movimentacoes", nome: "Movimentações de Caixas", url: createPageUrl("RelatorioMovimentacoesCaixa") },
        { id: "saldos", nome: "Saldos de Caixas", url: createPageUrl("RelatorioSaldosCaixas") },
        { id: "gateways", nome: "Taxas de Gateways", url: createPageUrl("RelatorioGateways") },
      ]
    },
    {
      id: "vendas",
      nome: "Vendas e Negociações",
      icon: FileSignature,
      color: "blue",
      relatorios: [
        { id: "vendas", nome: "Relatório de Vendas", url: createPageUrl("RelatorioVendas") },
        { id: "negociacoes", nome: "Negociações em Andamento", url: createPageUrl("RelatorioNegociacoes") },
        { id: "contratos", nome: "Contratos Gerados", url: createPageUrl("RelatorioContratos") },
        { id: "comissoes", nome: "Comissões Pagas", url: createPageUrl("RelatorioComissoes") },
      ]
    },
    {
      id: "unidades",
      nome: "Unidades e Loteamentos",
      icon: Building2,
      color: "cyan",
      relatorios: [
        { id: "unidades_status", nome: "Status das Unidades", url: createPageUrl("RelatorioUnidades") },
        { id: "disponibilidade", nome: "Disponibilidade por Loteamento", url: createPageUrl("RelatorioDisponibilidade") },
      ]
    },
    {
      id: "obras",
      nome: "Obras e Custos",
      icon: Briefcase,
      color: "orange",
      relatorios: [
        { id: "cronograma", nome: "Cronograma de Obras", url: createPageUrl("RelatorioCronograma") },
        { id: "execucao", nome: "Execução de Obras", url: createPageUrl("RelatorioExecucao") },
        { id: "custos_obra", nome: "Custos de Obra", url: createPageUrl("RelatorioCustosObra") },
        { id: "orcamentos_compra", nome: "Orçamentos de Compra", url: createPageUrl("RelatorioOrcamentosCompra") },
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
      nome: "Estoque e Compras",
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
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--wine-700)]">Central de Relatórios</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Análises e relatórios gerenciais completos</p>
      </div>

      <div className="grid gap-4 md:gap-6">
        {categorias.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card key={cat.id} className="shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
                  <div className={`p-3 sm:p-4 rounded-xl bg-${cat.color}-100`}>
                    <Icon className={`w-6 h-6 sm:w-8 sm:h-8 text-${cat.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg sm:text-xl text-gray-900">{cat.nome}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{cat.relatorios?.length || 0} relatórios disponíveis</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {(cat.relatorios || []).map((rel) => (
                    <Link key={rel.id} to={rel.url}>
                      <Button
                        variant="outline"
                        className="w-full justify-between hover:bg-gray-50 text-xs sm:text-sm"
                        size="sm"
                      >
                        <span className="truncate">{rel.nome}</span>
                        <ChevronRight className="w-4 h-4 flex-shrink-0 ml-2" />
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