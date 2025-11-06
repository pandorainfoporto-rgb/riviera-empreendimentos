
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, TrendingUp, DollarSign, PiggyBank, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { differenceInMonths, differenceInDays, parseISO } from "date-fns";

import InvestimentoForm from "../components/investimentos/InvestimentoForm";
import InvestimentosList from "../components/investimentos/InvestimentosList";

export default function Investimentos() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['investimentos'],
    queryFn: () => base44.entities.Investimento.list('-data_aplicacao'),
  });

  const { data: tiposAtivos = [] } = useQuery({
    queryKey: ['tipoAtivos'],
    queryFn: () => base44.entities.TipoAtivo.list(),
  });

  const { data: corretoras = [] } = useQuery({
    queryKey: ['corretoras'],
    queryFn: () => base44.entities.Corretora.list(),
  });

  const { data: bancos = [] } = useQuery({
    queryKey: ['bancos'],
    queryFn: () => base44.entities.Banco.list(),
  });

  const { data: empreendimentos = [] } = useQuery({
    queryKey: ['empreendimentos'],
    queryFn: () => base44.entities.Empreendimento.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Investimento.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investimentos'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Investimento.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investimentos'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Investimento.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investimentos'] });
    },
  });

  // Função para calcular valor futuro do investimento
  const calcularValorFuturo = (investimento) => {
    const hoje = new Date();
    const dataAplicacao = parseISO(investimento.data_aplicacao);
    const dataVencimento = investimento.data_vencimento ? parseISO(investimento.data_vencimento) : hoje;
    
    const mesesDecorridos = differenceInMonths(dataVencimento, dataAplicacao);
    const valorAplicado = investimento.valor_aplicado || 0;
    const taxaMensal = (investimento.taxa_rendimento_mensal || 0) / 100;
    
    // Cálculo composto
    const valorFuturo = valorAplicado * Math.pow(1 + taxaMensal, mesesDecorridos);
    const rendimentoBruto = valorFuturo - valorAplicado;
    const ir = (rendimentoBruto * (investimento.taxa_ir || 15)) / 100;
    const rendimentoLiquido = rendimentoBruto - ir;
    const valorLiquido = valorAplicado + rendimentoLiquido;

    return {
      valorFuturo,
      rendimentoBruto,
      ir,
      rendimentoLiquido,
      valorLiquido,
      mesesDecorridos,
    };
  };

  // Filtrar investimentos
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calcular estatísticas
  const investimentosAtivos = items.filter(i => i.status === 'ativo');
  
  const totalInvestido = investimentosAtivos.reduce((sum, inv) => 
    sum + (inv.valor_aplicado || 0), 0
  );

  const calculos = investimentosAtivos.map(inv => calcularValorFuturo(inv));
  
  const totalRendimentoBruto = calculos.reduce((sum, calc) => 
    sum + (calc.rendimentoBruto || 0), 0
  );

  const totalIR = calculos.reduce((sum, calc) => 
    sum + (calc.ir || 0), 0
  );

  const totalRendimentoLiquido = calculos.reduce((sum, calc) => 
    sum + (calc.rendimentoLiquido || 0), 0
  );

  const totalValorAtual = totalInvestido + totalRendimentoBruto;
  const totalValorLiquido = totalInvestido + totalRendimentoLiquido;

  const rendimentoPercentual = totalInvestido > 0 
    ? (totalRendimentoLiquido / totalInvestido) * 100 
    : 0;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Investimentos</h1>
          <p className="text-gray-600 mt-1">Gerencie suas aplicações financeiras</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Investimento
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Total Investido</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {(totalInvestido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {investimentosAtivos.length} investimento(s) ativo(s)
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <PiggyBank className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Rendimento Bruto</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {(totalRendimentoBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Valor Atual: R$ {(totalValorAtual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-red-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Imposto de Renda</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {(totalIR || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Descontado dos rendimentos
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-100">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-[var(--grape-600)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Rendimento Líquido</p>
                <p className="text-2xl font-bold text-[var(--grape-700)]">
                  R$ {(totalRendimentoLiquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-green-600 font-semibold mt-1">
                  +{(rendimentoPercentual || 0).toFixed(2)}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)]">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por Tipo de Ativo */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-[var(--wine-700)]">Resumo por Tipo de Ativo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tiposAtivos.map(tipo => {
              const investsTipo = investimentosAtivos.filter(i => i.tipo_ativo_id === tipo.id);
              if (investsTipo.length === 0) return null;

              const totalTipo = investsTipo.reduce((sum, inv) => sum + (inv.valor_aplicado || 0), 0);
              const calculosTipo = investsTipo.map(inv => calcularValorFuturo(inv));
              const rendimentoTipo = calculosTipo.reduce((sum, calc) => sum + (calc.rendimentoLiquido || 0), 0);
              const percentualTipo = totalInvestido > 0 ? (totalTipo / totalInvestido) * 100 : 0;

              return (
                <div key={tipo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">{tipo.nome}</span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {investsTipo.length} investimento(s)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] h-2 rounded-full"
                        style={{ width: `${percentualTipo}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <p className="text-sm font-semibold text-gray-900">
                      R$ {(totalTipo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-green-600">
                      +R$ {(rendimentoTipo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar investimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="resgatado">Resgatados</SelectItem>
            <SelectItem value="vencido">Vencidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showForm && (
        <InvestimentoForm
          item={editingItem}
          tiposAtivos={tiposAtivos}
          corretoras={corretoras}
          bancos={bancos}
          empreendimentos={empreendimentos}
          onSubmit={(data) => {
            if (editingItem) {
              updateMutation.mutate({ id: editingItem.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          isProcessing={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <InvestimentosList
        items={filteredItems}
        tiposAtivos={tiposAtivos}
        corretoras={corretoras}
        bancos={bancos}
        empreendimentos={empreendimentos}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
        calcularValorFuturo={calcularValorFuturo}
      />
    </div>
  );
}
