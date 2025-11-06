
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import CronogramaObraList from "../components/cronograma/CronogramaObraList";
import CronogramaObraForm from "../components/cronograma/CronogramaObraForm";
import CronogramaFinanceiroList from "../components/cronograma/CronogramaFinanceiroList";
import CronogramaFinanceiroForm from "../components/cronograma/CronogramaFinanceiroForm";
import TimelineView from "../components/cronograma/TimelineView";
import GanttChartView from "../components/cronograma/GanttChartView";

export default function CronogramaObra() {
  const [showObraForm, setShowObraForm] = useState(false);
  const [showFinanceiroForm, setShowFinanceiroForm] = useState(false);
  const [editingObra, setEditingObra] = useState(null);
  const [editingFinanceiro, setEditingFinanceiro] = useState(null);
  const [selectedUnidade, setSelectedUnidade] = useState("todas");
  const queryClient = useQueryClient();

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: async () => {
      try {
        return await base44.entities.Unidade.list();
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const { data: cronogramasObra = [], isLoading: loadingObra } = useQuery({
    queryKey: ['cronogramasObra'],
    queryFn: async () => {
      try {
        return await base44.entities.CronogramaObra.list('ordem');
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const { data: cronogramasFinanceiro = [], isLoading: loadingFinanceiro } = useQuery({
    queryKey: ['cronogramasFinanceiro'],
    queryFn: async () => {
      try {
        return await base44.entities.CronogramaFinanceiro.list('ordem'); // Changed from 'data_prevista' to 'ordem'
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      try {
        return await base44.entities.Fornecedor.list();
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const createObraMutation = useMutation({
    mutationFn: async (data) => {
      let orcamentoId = null;
      if (data.orcamento) {
        if (data.orcamento.orcamento_id) {
          orcamentoId = data.orcamento.orcamento_id;
        } else {
          const novoOrcamento = await base44.entities.Orcamento.create(data.orcamento);
          orcamentoId = novoOrcamento.id;
        }
      }

      const etapa = await base44.entities.CronogramaObra.create({
        unidade_id: data.unidade_id,
        wbs: data.wbs,
        nivel_hierarquia: data.nivel_hierarquia,
        tarefa_pai_id: data.tarefa_pai_id,
        eh_marco: data.eh_marco,
        eh_tarefa_resumo: data.eh_tarefa_resumo,
        fase: data.fase,
        etapa: data.etapa,
        descricao: data.descricao,
        data_inicio_prevista: data.data_inicio_prevista,
        data_fim_prevista: data.data_fim_prevista,
        data_inicio_real: data.data_inicio_real,
        data_fim_real: data.data_fim_real,
        duracao_prevista_dias: data.duracao_prevista_dias,
        percentual_conclusao: data.percentual_conclusao,
        status: data.status,
        prioridade: data.prioridade,
        responsavel: data.responsavel,
        equipe: data.equipe,
        predecessoras: data.predecessoras,
        restricao_tipo: data.restricao_tipo,
        restricao_data: data.restricao_data,
        caminho_critico: data.caminho_critico,
        folga_total: data.folga_total,
        custo_planejado: data.custo_planejado,
        custo_real: data.custo_real,
        ordem: data.ordem,
        riscos: data.riscos,
      });

      if (orcamentoId) {
        if (!data.orcamento.orcamento_id) {
          await base44.entities.Orcamento.update(orcamentoId, {
            ...data.orcamento,
            cronograma_obra_id: etapa.id,
          });
        } else {
          const orcamentoExistente = await base44.entities.Orcamento.get(orcamentoId);
          await base44.entities.Orcamento.update(orcamentoId, {
            ...orcamentoExistente,
            cronograma_obra_id: etapa.id,
          });
        }
      }

      if (data.gerarFinanceiro && data.itensFinanceiros && data.itensFinanceiros.length > 0) {
        const promises = (data.itensFinanceiros || []).map(async item => {
          const cronFinanceiro = await base44.entities.CronogramaFinanceiro.create({
            unidade_id: data.unidade_id,
            cronograma_obra_id: etapa.id,
            categoria: item.categoria,
            descricao: item.descricao,
            valor_previsto: parseFloat(item.valor_previsto) || 0,
            valor_realizado: 0,
            data_prevista: item.data_prevista,
            status: "planejado",
            fornecedor_id: item.fornecedor_id || null,
          });

          if (item.fornecedor_id) {
            await base44.entities.PagamentoFornecedor.create({
              fornecedor_id: item.fornecedor_id,
              unidade_id: data.unidade_id,
              cronograma_obra_id: etapa.id,
              cronograma_financeiro_id: cronFinanceiro.id,
              tipo: item.tipo || "outros",
              servico_id: item.servico_id || null,
              produto_id: item.produto_id || null,
              valor: parseFloat(item.valor_previsto) || 0,
              data_vencimento: item.data_prevista,
              forma_pagamento: item.forma_pagamento || "pix",
              status: "pendente",
              descricao: item.descricao,
              juros_percentual: 0.1,
              multa_percentual: 2,
            });
          }

          return cronFinanceiro;
        });
        await Promise.all(promises);
      }

      return etapa;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronogramasObra'] });
      queryClient.invalidateQueries({ queryKey: ['cronogramasFinanceiro'] });
      queryClient.invalidateQueries({ queryKey: ['pagamentosFornecedores'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      setShowObraForm(false);
      setEditingObra(null);
    },
  });

  const updateObraMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.CronogramaObra.update(id, {
        unidade_id: data.unidade_id,
        wbs: data.wbs,
        nivel_hierarquia: data.nivel_hierarquia,
        tarefa_pai_id: data.tarefa_pai_id,
        eh_marco: data.eh_marco,
        eh_tarefa_resumo: data.eh_tarefa_resumo,
        fase: data.fase,
        etapa: data.etapa,
        descricao: data.descricao,
        data_inicio_prevista: data.data_inicio_prevista,
        data_fim_prevista: data.data_fim_prevista,
        data_inicio_real: data.data_inicio_real,
        data_fim_real: data.data_fim_real,
        duracao_prevista_dias: data.duracao_prevista_dias,
        percentual_conclusao: data.percentual_conclusao,
        status: data.status,
        prioridade: data.prioridade,
        responsavel: data.responsavel,
        equipe: data.equipe,
        predecessoras: data.predecessoras,
        restricao_tipo: data.restricao_tipo,
        restricao_data: data.restricao_data,
        caminho_critico: data.caminho_critico,
        folga_total: data.folga_total,
        custo_planejado: data.custo_planejado,
        custo_real: data.custo_real,
        ordem: data.ordem,
        riscos: data.riscos,
      });

      if (data.orcamento) {
        if (data.orcamento.orcamento_id) {
          const orcamentoExistente = await base44.entities.Orcamento.get(data.orcamento.orcamento_id);
          await base44.entities.Orcamento.update(data.orcamento.orcamento_id, {
            ...orcamentoExistente,
            cronograma_obra_id: id,
          });
        } else {
          await base44.entities.Orcamento.create({
            ...data.orcamento,
            cronograma_obra_id: id,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronogramasObra'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      setShowObraForm(false);
      setEditingObra(null);
    },
  });

  const deleteObraMutation = useMutation({
    mutationFn: (id) => base44.entities.CronogramaObra.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronogramasObra'] });
    },
  });

  const createFinanceiroMutation = useMutation({
    mutationFn: (data) => base44.entities.CronogramaFinanceiro.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronogramasFinanceiro'] });
      setShowFinanceiroForm(false);
      setEditingFinanceiro(null);
    },
  });

  const updateFinanceiroMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CronogramaFinanceiro.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronogramasFinanceiro'] });
      setShowFinanceiroForm(false);
      setEditingFinanceiro(null);
    },
  });

  const deleteFinanceiroMutation = useMutation({
    mutationFn: (id) => base44.entities.CronogramaFinanceiro.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronogramasFinanceiro'] });
    },
  });

  const filteredObra = selectedUnidade === "todas"
    ? (cronogramasObra || [])
    : (cronogramasObra || []).filter(c => c.unidade_id === selectedUnidade);

  const filteredFinanceiro = selectedUnidade === "todas"
    ? (cronogramasFinanceiro || [])
    : (cronogramasFinanceiro || []).filter(c => c.unidade_id === selectedUnidade);

  // Updated financial metrics calculations
  const totalPlanejado = (filteredFinanceiro || []).reduce((sum, item) => sum + (item.custo_planejado || 0), 0);
  const totalRealizado = (filteredFinanceiro || []).reduce((sum, item) => sum + (item.custo_real || 0), 0);
  const totalAgregado = (filteredFinanceiro || []).reduce((sum, item) => sum + (item.valor_agregado || 0), 0);
  const cpiGeral = totalRealizado > 0 ? totalAgregado / totalRealizado : 0;
  const variacao = totalRealizado - totalPlanejado; // Kept as per outline, though not used in new display

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Cronograma de Obra</h1>
          <p className="text-gray-600 mt-1">Planejamento temporal e financeiro com metodologia MS Project</p>
        </div>
        <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Selecione uma Unidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Unidades</SelectItem>
            {(unidades || []).map(uni => (
              <SelectItem key={uni.id} value={uni.id}>
                {uni.codigo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-t-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">BCWS (Planejado)</p>
          <p className="text-2xl font-bold text-gray-900">
            R$ {(totalPlanejado / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-t-4 border-purple-500">
          <p className="text-sm text-gray-600 mb-1">BCWP (Agregado)</p>
          <p className="text-2xl font-bold text-purple-700">
            R$ {(totalAgregado / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-t-4 border-orange-500">
          <p className="text-sm text-gray-600 mb-1">ACWP (Realizado)</p>
          <p className="text-2xl font-bold text-orange-700">
            R$ {(totalRealizado / 1000).toFixed(1)}k
          </p>
        </div>
        <div className={`bg-white p-4 rounded-lg shadow border-t-4 ${cpiGeral >= 1 ? 'border-green-500' : 'border-red-500'}`}>
          <p className="text-sm text-gray-600 mb-1">CPI Geral</p>
          <p className={`text-2xl font-bold ${cpiGeral >= 1 ? 'text-green-600' : 'text-red-600'}`}>
            {cpiGeral.toFixed(2)}
            <span className="text-sm ml-2">({cpiGeral >= 1 ? '✅ Eficiente' : '⚠️ Acima'})</span>
          </p>
        </div>
      </div>

      <Tabs defaultValue="gantt" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="etapas">Tarefas da Obra</TabsTrigger>
          <TabsTrigger value="financeiro">Cronograma Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="gantt" className="mt-6">
          <GanttChartView
            cronogramasObra={filteredObra || []}
            unidades={unidades || []}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <TimelineView
            cronogramasObra={filteredObra || []}
            unidades={unidades || []}
          />
        </TabsContent>

        <TabsContent value="etapas" className="mt-6 space-y-4">
          <Button
            onClick={() => {
              setEditingObra(null);
              setShowObraForm(true);
            }}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>

          {showObraForm && (
            <CronogramaObraForm
              item={editingObra}
              unidades={unidades || []}
              cronogramasObra={cronogramasObra || []}
              onSubmit={(data) => {
                if (editingObra) {
                  updateObraMutation.mutate({ id: editingObra.id, data });
                } else {
                  createObraMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setShowObraForm(false);
                setEditingObra(null);
              }}
              isProcessing={createObraMutation.isPending || updateObraMutation.isPending}
            />
          )}

          <CronogramaObraList
            items={filteredObra || []}
            unidades={unidades || []}
            isLoading={loadingObra}
            onEdit={(item) => {
              setEditingObra(item);
              setShowObraForm(true);
            }}
            onDelete={(id) => {
              if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
                deleteObraMutation.mutate(id);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="financeiro" className="mt-6 space-y-4">
          <Button
            onClick={() => {
              setEditingFinanceiro(null);
              setShowFinanceiroForm(true);
            }}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Item Financeiro
          </Button>

          {showFinanceiroForm && (
            <CronogramaFinanceiroForm
              item={editingFinanceiro}
              unidades={unidades || []}
              cronogramasObra={cronogramasObra || []} // Changed from filteredObra to cronogramasObra (all)
              itensFinanceiros={cronogramasFinanceiro || []} // Added new prop
              fornecedores={fornecedores || []}
              onSubmit={(data) => {
                if (editingFinanceiro) {
                  updateFinanceiroMutation.mutate({ id: editingFinanceiro.id, data });
                } else {
                  createFinanceiroMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setShowFinanceiroForm(false);
                setEditingFinanceiro(null);
              }}
              isProcessing={createFinanceiroMutation.isPending || updateFinanceiroMutation.isPending}
            />
          )}

          <CronogramaFinanceiroList
            items={filteredFinanceiro || []}
            unidades={unidades || []}
            cronogramasObra={cronogramasObra || []}
            fornecedores={fornecedores || []}
            isLoading={loadingFinanceiro}
            onEdit={(item) => {
              setEditingFinanceiro(item);
              setShowFinanceiroForm(true);
            }}
            onDelete={(id) => {
              if (window.confirm('Tem certeza que deseja excluir este item?')) {
                deleteFinanceiroMutation.mutate(id);
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
