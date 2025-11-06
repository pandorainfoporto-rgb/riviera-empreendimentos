
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, AlertTriangle, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

import OrcamentoForm from "../components/orcamentos/OrcamentoForm";
import OrcamentosList from "../components/orcamentos/OrcamentosList";

export default function Orcamentos() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [mesFilter, setMesFilter] = useState(format(new Date(), "yyyy-MM"));
  const [loteamentoFilter, setLoteamentoFilter] = useState("todos");
  const queryClient = useQueryClient();

  const { data: orcamentos = [], isLoading } = useQuery({
    queryKey: ['orcamentos'],
    queryFn: () => base44.entities.Orcamento.list('-mes_referencia'),
    initialData: [], // Added initialData
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
    initialData: [], // Added initialData
  });

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ['movimentacoesCaixa'],
    queryFn: () => base44.entities.MovimentacaoCaixa.list(),
    initialData: [], // Added initialData
  });

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
    initialData: [], // Added initialData
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Orcamento.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Orcamento.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Orcamento.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
    },
  });

  // Filtrar orçamentos
  const orcamentosFiltrados = orcamentos.filter(orc => {
    const matchesMes = !mesFilter || orc.mes_referencia === mesFilter;
    const matchesLoteamento = loteamentoFilter === "todos" || orc.loteamento_id === loteamentoFilter;
    return matchesMes && matchesLoteamento && orc.ativo;
  });

  // Calcular gastos reais do mês
  const calcularGastoReal = (categoria, mesRef, loteamentoId) => {
    const [ano, mes] = mesRef.split('-');
    const inicioMes = startOfMonth(new Date(parseInt(ano), parseInt(mes) - 1, 1));
    const fimMes = endOfMonth(new Date(parseInt(ano), parseInt(mes) - 1, 1));

    const movsFiltradas = movimentacoes.filter(mov => {
      if (mov.tipo !== 'saida') return false;
      
      try {
        const dataMov = parseISO(mov.data_movimentacao);
        if (dataMov < inicioMes || dataMov > fimMes) return false;
      } catch {
        return false;
      }

      if (loteamentoId && loteamentoId !== "todos") {
        const caixa = caixas.find(c => c.id === mov.caixa_id);
        if (caixa?.loteamento_id !== loteamentoId) return false;
      }

      return mov.categoria === categoria;
    });

    return movsFiltradas.reduce((sum, mov) => sum + (mov.valor || 0), 0);
  };

  // Calcular estatísticas gerais
  const totalOrcado = orcamentosFiltrados.reduce((sum, orc) => sum + (orc.valor_orcado || 0), 0);
  const totalGasto = orcamentosFiltrados.reduce((sum, orc) => {
    return sum + calcularGastoReal(orc.categoria, orc.mes_referencia, orc.loteamento_id);
  }, 0);
  const saldoDisponivel = totalOrcado - totalGasto;
  const percentualGasto = totalOrcado > 0 ? (totalGasto / totalOrcado) * 100 : 0;

  // Contar alertas
  const orcamentosComAlerta = orcamentosFiltrados.filter(orc => {
    const gastoReal = calcularGastoReal(orc.categoria, orc.mes_referencia, orc.loteamento_id);
    const percentual = (gastoReal / orc.valor_orcado) * 100;
    return percentual >= orc.limite_alerta_percentual;
  }).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Orçamentos</h1>
          <p className="text-gray-600 mt-1">Gerencie orçamentos mensais por categoria</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Total Orçado</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {totalOrcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-red-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Total Gasto</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">{percentualGasto.toFixed(1)}% do orçado</p>
              </div>
              <div className="p-3 rounded-xl bg-red-100">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-lg border-t-4 ${saldoDisponivel >= 0 ? 'border-green-500' : 'border-orange-500'}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Saldo Disponível</p>
                <p className={`text-2xl font-bold ${saldoDisponivel >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                  R$ {Math.abs(saldoDisponivel).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {saldoDisponivel >= 0 ? 'Dentro do orçamento' : 'Acima do orçamento'}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${saldoDisponivel >= 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
                <TrendingUp className={`w-6 h-6 ${saldoDisponivel >= 0 ? 'text-green-600' : 'text-orange-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-amber-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Alertas Ativos</p>
                <p className="text-2xl font-bold text-amber-600">{orcamentosComAlerta}</p>
                <p className="text-xs text-gray-500 mt-1">Categorias acima do limite</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <Select value={mesFilter} onValueChange={setMesFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = format(date, "yyyy-MM");
                const label = format(date, "MMMM yyyy", { locale: ptBR });
                return (
                  <SelectItem key={value} value={value}>
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <Select value={loteamentoFilter} onValueChange={setLoteamentoFilter}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Filtrar por loteamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Loteamentos</SelectItem>
            {loteamentos.map(lot => (
              <SelectItem key={lot.id} value={lot.id}>
                {lot.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showForm && (
        <OrcamentoForm
          item={editingItem}
          loteamentos={loteamentos}
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

      <OrcamentosList
        items={orcamentosFiltrados}
        loteamentos={loteamentos}
        calcularGastoReal={calcularGastoReal}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => {
          if (window.confirm('Deseja realmente excluir este orçamento?')) {
            deleteMutation.mutate(id);
          }
        }}
      />
    </div>
  );
}
