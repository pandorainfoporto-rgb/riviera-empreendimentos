import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Search, Building, TrendingUp, TrendingDown, 
  DollarSign, Package, AlertTriangle, CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RelatorioCustosObra() {
  const [busca, setBusca] = useState("");
  const [unidadeFilter, setUnidadeFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todos");

  const { data: custosObra = [] } = useQuery({
    queryKey: ['custos_obra'],
    queryFn: () => base44.entities.CustoObra.list('-created_date'),
    initialData: [],
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
    initialData: [],
  });

  const custosFiltrados = custosObra.filter(custo => {
    const unidade = unidades.find(u => u.id === custo.unidade_id);
    const matchBusca = !busca || 
      custo.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      unidade?.codigo?.toLowerCase().includes(busca.toLowerCase());
    const matchUnidade = unidadeFilter === "todas" || custo.unidade_id === unidadeFilter;
    const matchStatus = statusFilter === "todos" || custo.status === statusFilter;
    return matchBusca && matchUnidade && matchStatus;
  });

  const totalEstimado = custosObra.reduce((sum, c) => sum + (c.valor_total_estimado || 0), 0);
  const totalRealizado = custosObra.reduce((sum, c) => sum + (c.valor_total_realizado || 0), 0);
  const economia = totalEstimado - totalRealizado;
  const percentualEconomia = totalEstimado > 0 ? ((economia / totalEstimado) * 100) : 0;

  const emExecucao = custosObra.filter(c => c.status === 'em_execucao').length;
  const concluidos = custosObra.filter(c => c.status === 'concluido').length;
  const acimaBudget = custosObra.filter(c => 
    (c.valor_total_realizado || 0) > (c.valor_total_estimado || 0)
  ).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Custos de Obra</h1>
          <p className="text-gray-600 mt-1">Análise detalhada de orçamento vs realizado</p>
        </div>
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-t-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Estimado</p>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">
              R$ {(totalEstimado / 1000000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Realizado</p>
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900">
              R$ {(totalRealizado / 1000000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Economia</p>
              {economia >= 0 ? (
                <TrendingDown className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingUp className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className={`text-2xl font-bold ${economia >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              R$ {Math.abs(economia / 1000000).toFixed(2)}M
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {percentualEconomia >= 0 ? '+' : ''}{percentualEconomia.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Em Execução</p>
              <Building className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-900">{emExecucao}</p>
            <p className="text-xs text-gray-500 mt-1">{concluidos} concluídos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={unidadeFilter} onValueChange={setUnidadeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Unidades</SelectItem>
                {unidades.map(uni => (
                  <SelectItem key={uni.id} value={uni.id}>
                    {uni.codigo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="planejamento">Planejamento</SelectItem>
                <SelectItem value="em_execucao">Em Execução</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Custos */}
      <div className="space-y-4">
        {custosFiltrados.map(custo => {
          const unidade = unidades.find(u => u.id === custo.unidade_id);
          const economiaUnit = (custo.valor_total_estimado || 0) - (custo.valor_total_realizado || 0);
          const percentualUnit = custo.valor_total_estimado > 0 
            ? ((economiaUnit / custo.valor_total_estimado) * 100) 
            : 0;
          const acimaBudgetUnit = economiaUnit < 0;

          return (
            <Card key={custo.id} className={`hover:shadow-lg transition-shadow ${acimaBudgetUnit ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{custo.nome}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {unidade?.codigo || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {acimaBudgetUnit ? (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Acima do Orçado
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Dentro do Orçado
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700 mb-1">Estimado</p>
                    <p className="text-lg font-bold text-blue-900">
                      R$ {(custo.valor_total_estimado || 0).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-700 mb-1">Realizado</p>
                    <p className="text-lg font-bold text-purple-900">
                      R$ {(custo.valor_total_realizado || 0).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${acimaBudgetUnit ? 'bg-red-50' : 'bg-green-50'}`}>
                    <p className={`text-xs mb-1 ${acimaBudgetUnit ? 'text-red-700' : 'text-green-700'}`}>
                      {acimaBudgetUnit ? 'Estouro' : 'Economia'}
                    </p>
                    <p className={`text-lg font-bold ${acimaBudgetUnit ? 'text-red-900' : 'text-green-900'}`}>
                      R$ {Math.abs(economiaUnit).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {percentualUnit >= 0 ? '+' : ''}{percentualUnit.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-700 mb-1">Executado</p>
                    <p className="text-lg font-bold text-gray-900">
                      {custo.percentual_execucao || 0}%
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${custo.percentual_execucao || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {custo.observacoes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">{custo.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}