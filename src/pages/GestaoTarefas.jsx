import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Clock, AlertTriangle, Pause, XCircle,
  Calendar, User, Building, Filter, Plus, Search,
  LayoutGrid, List, ArrowUpDown, AlertCircle
} from "lucide-react";
import { format, parseISO, differenceInDays, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import TarefaCard from "../components/tarefas/TarefaCard";
import TarefaForm from "../components/tarefas/TarefaForm";
import TarefaKanban from "../components/tarefas/TarefaKanban";

const statusConfig = {
  nao_iniciada: { label: "Não Iniciada", color: "bg-gray-100 text-gray-700", icon: Clock },
  em_andamento: { label: "Em Andamento", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  concluida: { label: "Concluída", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  atrasada: { label: "Atrasada", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  pausada: { label: "Pausada", color: "bg-yellow-100 text-yellow-700", icon: Pause },
  cancelada: { label: "Cancelada", color: "bg-gray-200 text-gray-500", icon: XCircle },
};

const prioridadeConfig = {
  baixa: { label: "Baixa", color: "bg-gray-100 text-gray-600" },
  media: { label: "Média", color: "bg-blue-100 text-blue-600" },
  alta: { label: "Alta", color: "bg-orange-100 text-orange-600" },
  critica: { label: "Crítica", color: "bg-red-100 text-red-600" },
};

export default function GestaoTarefas() {
  const [showForm, setShowForm] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState(null);
  const [viewMode, setViewMode] = useState("lista"); // lista, kanban, calendario
  const [filtros, setFiltros] = useState({
    busca: "",
    status: "todos",
    prioridade: "todos",
    responsavel: "todos",
    unidade: "todos",
    prazo: "todos",
  });
  const [ordenacao, setOrdenacao] = useState("data_fim_prevista");

  const queryClient = useQueryClient();

  const { data: tarefas = [], isLoading } = useQuery({
    queryKey: ['cronogramas_obra'],
    queryFn: () => base44.entities.CronogramaObra.list('-data_fim_prevista'),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ['equipes'],
    queryFn: async () => {
      try {
        return await base44.entities.Equipe.list();
      } catch {
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CronogramaObra.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronogramas_obra'] });
      setShowForm(false);
      toast.success("Tarefa criada com sucesso!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CronogramaObra.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronogramas_obra'] });
      setShowForm(false);
      setEditingTarefa(null);
      toast.success("Tarefa atualizada!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CronogramaObra.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronogramas_obra'] });
      toast.success("Tarefa excluída!");
    },
  });

  // Extrair responsáveis únicos
  const responsaveisUnicos = [...new Set(tarefas.map(t => t.responsavel).filter(Boolean))];

  // Filtrar tarefas
  const hoje = new Date();
  const tarefasFiltradas = tarefas.filter(tarefa => {
    // Busca
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      const match = 
        tarefa.etapa?.toLowerCase().includes(busca) ||
        tarefa.descricao?.toLowerCase().includes(busca) ||
        tarefa.responsavel?.toLowerCase().includes(busca);
      if (!match) return false;
    }

    // Status
    if (filtros.status !== "todos" && tarefa.status !== filtros.status) return false;

    // Prioridade
    if (filtros.prioridade !== "todos" && tarefa.prioridade !== filtros.prioridade) return false;

    // Responsável
    if (filtros.responsavel !== "todos" && tarefa.responsavel !== filtros.responsavel) return false;

    // Unidade
    if (filtros.unidade !== "todos" && tarefa.unidade_id !== filtros.unidade) return false;

    // Prazo
    if (filtros.prazo !== "todos") {
      const dataFim = tarefa.data_fim_prevista ? parseISO(tarefa.data_fim_prevista) : null;
      if (!dataFim) return false;

      switch (filtros.prazo) {
        case "vencidas":
          if (!isBefore(dataFim, hoje) || tarefa.status === 'concluida') return false;
          break;
        case "hoje":
          if (format(dataFim, 'yyyy-MM-dd') !== format(hoje, 'yyyy-MM-dd')) return false;
          break;
        case "semana":
          if (!isAfter(dataFim, hoje) || !isBefore(dataFim, addDays(hoje, 7))) return false;
          break;
        case "mes":
          if (!isAfter(dataFim, hoje) || !isBefore(dataFim, addDays(hoje, 30))) return false;
          break;
      }
    }

    return true;
  });

  // Ordenar tarefas
  const tarefasOrdenadas = [...tarefasFiltradas].sort((a, b) => {
    switch (ordenacao) {
      case "data_fim_prevista":
        return (a.data_fim_prevista || "").localeCompare(b.data_fim_prevista || "");
      case "prioridade":
        const prioridadeOrdem = { critica: 0, alta: 1, media: 2, baixa: 3 };
        return (prioridadeOrdem[a.prioridade] || 2) - (prioridadeOrdem[b.prioridade] || 2);
      case "status":
        return (a.status || "").localeCompare(b.status || "");
      case "responsavel":
        return (a.responsavel || "").localeCompare(b.responsavel || "");
      default:
        return 0;
    }
  });

  // Estatísticas
  const stats = {
    total: tarefas.length,
    naoIniciadas: tarefas.filter(t => t.status === 'nao_iniciada').length,
    emAndamento: tarefas.filter(t => t.status === 'em_andamento').length,
    concluidas: tarefas.filter(t => t.status === 'concluida').length,
    atrasadas: tarefas.filter(t => t.status === 'atrasada').length,
    criticas: tarefas.filter(t => t.prioridade === 'critica' && t.status !== 'concluida').length,
  };

  const handleEdit = (tarefa) => {
    setEditingTarefa(tarefa);
    setShowForm(true);
  };

  const handleStatusChange = (tarefa, novoStatus) => {
    updateMutation.mutate({
      id: tarefa.id,
      data: { ...tarefa, status: novoStatus }
    });
  };

  if (showForm) {
    return (
      <div className="p-4 md:p-8">
        <TarefaForm
          tarefa={editingTarefa}
          unidades={unidades}
          equipes={equipes}
          onSave={(data) => {
            if (editingTarefa) {
              updateMutation.mutate({ id: editingTarefa.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingTarefa(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Gestão de Tarefas</h1>
          <p className="text-gray-600 mt-1">Visualize e gerencie todas as tarefas dos projetos</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-t-4 border-gray-400">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-gray-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Não Iniciadas</p>
            <p className="text-2xl font-bold text-gray-600">{stats.naoIniciadas}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-blue-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Em Andamento</p>
            <p className="text-2xl font-bold text-blue-600">{stats.emAndamento}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-green-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Concluídas</p>
            <p className="text-2xl font-bold text-green-600">{stats.concluidas}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-red-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Atrasadas</p>
            <p className="text-2xl font-bold text-red-600">{stats.atrasadas}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-orange-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Críticas</p>
            <p className="text-2xl font-bold text-orange-600">{stats.criticas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar tarefas..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filtros.status} onValueChange={(val) => setFiltros({ ...filtros, status: val })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtros.prioridade} onValueChange={(val) => setFiltros({ ...filtros, prioridade: val })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Prioridades</SelectItem>
                {Object.entries(prioridadeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtros.responsavel} onValueChange={(val) => setFiltros({ ...filtros, responsavel: val })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Responsáveis</SelectItem>
                {responsaveisUnicos.map((resp) => (
                  <SelectItem key={resp} value={resp}>{resp}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtros.unidade} onValueChange={(val) => setFiltros({ ...filtros, unidade: val })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Unidades</SelectItem>
                {unidades.map((uni) => (
                  <SelectItem key={uni.id} value={uni.id}>{uni.codigo}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtros.prazo} onValueChange={(val) => setFiltros({ ...filtros, prazo: val })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prazo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Prazos</SelectItem>
                <SelectItem value="vencidas">Vencidas</SelectItem>
                <SelectItem value="hoje">Vence Hoje</SelectItem>
                <SelectItem value="semana">Próximos 7 dias</SelectItem>
                <SelectItem value="mes">Próximos 30 dias</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ordenacao} onValueChange={setOrdenacao}>
              <SelectTrigger className="w-[150px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data_fim_prevista">Por Prazo</SelectItem>
                <SelectItem value="prioridade">Por Prioridade</SelectItem>
                <SelectItem value="status">Por Status</SelectItem>
                <SelectItem value="responsavel">Por Responsável</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "lista" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("lista")}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando tarefas...</p>
          </CardContent>
        </Card>
      ) : tarefasOrdenadas.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhuma tarefa encontrada</p>
            <p className="text-sm text-gray-400 mb-4">
              {filtros.busca || filtros.status !== "todos" || filtros.prioridade !== "todos"
                ? "Tente ajustar os filtros"
                : "Comece criando uma nova tarefa"}
            </p>
            <Button onClick={() => setShowForm(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "kanban" ? (
        <TarefaKanban
          tarefas={tarefasOrdenadas}
          unidades={unidades}
          onEdit={handleEdit}
          onStatusChange={handleStatusChange}
          onDelete={(id) => {
            if (confirm("Deseja excluir esta tarefa?")) {
              deleteMutation.mutate(id);
            }
          }}
        />
      ) : (
        <div className="grid gap-4">
          {tarefasOrdenadas.map((tarefa) => (
            <TarefaCard
              key={tarefa.id}
              tarefa={tarefa}
              unidade={unidades.find(u => u.id === tarefa.unidade_id)}
              onEdit={() => handleEdit(tarefa)}
              onStatusChange={handleStatusChange}
              onDelete={() => {
                if (confirm("Deseja excluir esta tarefa?")) {
                  deleteMutation.mutate(tarefa.id);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}