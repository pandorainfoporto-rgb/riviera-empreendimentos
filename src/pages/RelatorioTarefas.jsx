import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Clock, AlertTriangle, Pause, XCircle,
  Calendar, User, Building, FileText, Download, Filter,
  TrendingUp, TrendingDown, Target, BarChart3, PieChart, AlertCircle
} from "lucide-react";
import { format, parseISO, differenceInDays, isBefore, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line
} from "recharts";

const statusConfig = {
  nao_iniciada: { label: "Não Iniciada", color: "#9ca3af" },
  em_andamento: { label: "Em Andamento", color: "#3b82f6" },
  concluida: { label: "Concluída", color: "#22c55e" },
  atrasada: { label: "Atrasada", color: "#ef4444" },
  pausada: { label: "Pausada", color: "#eab308" },
  cancelada: { label: "Cancelada", color: "#6b7280" },
};

const prioridadeConfig = {
  baixa: { label: "Baixa", color: "#9ca3af" },
  media: { label: "Média", color: "#3b82f6" },
  alta: { label: "Alta", color: "#f97316" },
  critica: { label: "Crítica", color: "#ef4444" },
};

export default function RelatorioTarefas() {
  const [filtroUnidade, setFiltroUnidade] = useState("todas");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");

  const { data: tarefas = [], isLoading } = useQuery({
    queryKey: ['cronogramas_obra'],
    queryFn: () => base44.entities.CronogramaObra.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const hoje = new Date();

  // Filtrar tarefas
  const tarefasFiltradas = tarefas.filter(t => {
    if (filtroUnidade !== "todas" && t.unidade_id !== filtroUnidade) return false;
    
    if (filtroPeriodo !== "todos") {
      const dataFim = t.data_fim_prevista ? parseISO(t.data_fim_prevista) : null;
      if (!dataFim) return false;
      
      const inicio = filtroPeriodo === "mes_atual" 
        ? startOfMonth(hoje) 
        : startOfMonth(subMonths(hoje, parseInt(filtroPeriodo)));
      const fim = filtroPeriodo === "mes_atual" 
        ? endOfMonth(hoje) 
        : endOfMonth(hoje);
      
      if (dataFim < inicio || dataFim > fim) return false;
    }
    
    return true;
  });

  // Estatísticas gerais
  const stats = {
    total: tarefasFiltradas.length,
    naoIniciadas: tarefasFiltradas.filter(t => t.status === 'nao_iniciada').length,
    emAndamento: tarefasFiltradas.filter(t => t.status === 'em_andamento').length,
    concluidas: tarefasFiltradas.filter(t => t.status === 'concluida').length,
    atrasadas: tarefasFiltradas.filter(t => t.status === 'atrasada').length,
    pausadas: tarefasFiltradas.filter(t => t.status === 'pausada').length,
    canceladas: tarefasFiltradas.filter(t => t.status === 'cancelada').length,
  };

  // Taxa de conclusão
  const taxaConclusao = stats.total > 0 ? ((stats.concluidas / stats.total) * 100).toFixed(1) : 0;
  const taxaAtraso = stats.total > 0 ? ((stats.atrasadas / stats.total) * 100).toFixed(1) : 0;

  // Progresso médio
  const progressoMedio = tarefasFiltradas.length > 0
    ? (tarefasFiltradas.reduce((sum, t) => sum + (t.percentual_conclusao || 0), 0) / tarefasFiltradas.length).toFixed(1)
    : 0;

  // Dados para gráfico de pizza (status)
  const dadosPizzaStatus = Object.entries(statusConfig)
    .map(([key, config]) => ({
      name: config.label,
      value: tarefasFiltradas.filter(t => t.status === key).length,
      color: config.color,
    }))
    .filter(d => d.value > 0);

  // Dados para gráfico de pizza (prioridade)
  const dadosPizzaPrioridade = Object.entries(prioridadeConfig)
    .map(([key, config]) => ({
      name: config.label,
      value: tarefasFiltradas.filter(t => t.prioridade === key).length,
      color: config.color,
    }))
    .filter(d => d.value > 0);

  // Dados por responsável
  const responsaveis = {};
  tarefasFiltradas.forEach(t => {
    const resp = t.responsavel || 'Sem responsável';
    if (!responsaveis[resp]) {
      responsaveis[resp] = { total: 0, concluidas: 0, atrasadas: 0 };
    }
    responsaveis[resp].total++;
    if (t.status === 'concluida') responsaveis[resp].concluidas++;
    if (t.status === 'atrasada') responsaveis[resp].atrasadas++;
  });

  const dadosResponsaveis = Object.entries(responsaveis)
    .map(([nome, dados]) => ({
      nome: nome.length > 15 ? nome.substring(0, 15) + '...' : nome,
      ...dados,
      taxaConclusao: dados.total > 0 ? ((dados.concluidas / dados.total) * 100).toFixed(0) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Dados por unidade
  const dadosUnidades = unidades.map(uni => {
    const tarefasUni = tarefasFiltradas.filter(t => t.unidade_id === uni.id);
    return {
      codigo: uni.codigo,
      total: tarefasUni.length,
      concluidas: tarefasUni.filter(t => t.status === 'concluida').length,
      atrasadas: tarefasUni.filter(t => t.status === 'atrasada').length,
      progresso: tarefasUni.length > 0
        ? (tarefasUni.reduce((sum, t) => sum + (t.percentual_conclusao || 0), 0) / tarefasUni.length).toFixed(0)
        : 0,
    };
  }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);

  // Tarefas críticas
  const tarefasCriticas = tarefasFiltradas
    .filter(t => t.prioridade === 'critica' && t.status !== 'concluida')
    .slice(0, 5);

  // Tarefas atrasadas
  const tarefasAtrasadas = tarefasFiltradas
    .filter(t => t.status === 'atrasada')
    .map(t => {
      const dataFim = t.data_fim_prevista ? parseISO(t.data_fim_prevista) : hoje;
      return {
        ...t,
        diasAtraso: differenceInDays(hoje, dataFim),
      };
    })
    .sort((a, b) => b.diasAtraso - a.diasAtraso)
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--wine-700)]">Relatório de Tarefas</h1>
          <p className="text-gray-600 mt-1">Análise consolidada de todas as tarefas do sistema</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={filtroUnidade} onValueChange={setFiltroUnidade}>
            <SelectTrigger className="w-[180px]">
              <Building className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas Unidades</SelectItem>
              {unidades.map(uni => (
                <SelectItem key={uni.id} value={uni.id}>{uni.codigo}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo Período</SelectItem>
              <SelectItem value="mes_atual">Mês Atual</SelectItem>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="border-t-4 border-gray-400">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-green-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Concluídas</p>
            <p className="text-2xl font-bold text-green-600">{stats.concluidas}</p>
            <p className="text-xs text-gray-500">{taxaConclusao}%</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-blue-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Em Andamento</p>
            <p className="text-2xl font-bold text-blue-600">{stats.emAndamento}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-red-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Atrasadas</p>
            <p className="text-2xl font-bold text-red-600">{stats.atrasadas}</p>
            <p className="text-xs text-gray-500">{taxaAtraso}%</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-yellow-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Pausadas</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pausadas}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-purple-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Progresso Médio</p>
            <p className="text-2xl font-bold text-purple-600">{progressoMedio}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Pizza */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosPizzaStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={dadosPizzaStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosPizzaStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-12 text-gray-500">Nenhuma tarefa encontrada</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Distribuição por Prioridade
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosPizzaPrioridade.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={dadosPizzaPrioridade}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosPizzaPrioridade.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-12 text-gray-500">Nenhuma tarefa encontrada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance por Responsável */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Performance por Responsável
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dadosResponsaveis.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosResponsaveis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="concluidas" stackId="a" fill="#22c55e" name="Concluídas" />
                <Bar dataKey="atrasadas" stackId="a" fill="#ef4444" name="Atrasadas" />
                <Bar dataKey="total" fill="#3b82f6" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-12 text-gray-500">Nenhum responsável encontrado</p>
          )}
        </CardContent>
      </Card>

      {/* Performance por Unidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Performance por Unidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dadosUnidades.slice(0, 10).map((uni, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{uni.codigo}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline">{uni.total} tarefas</Badge>
                    <Badge className="bg-green-100 text-green-700">{uni.concluidas} concluídas</Badge>
                    {uni.atrasadas > 0 && (
                      <Badge className="bg-red-100 text-red-700">{uni.atrasadas} atrasadas</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={parseInt(uni.progresso)} className="flex-1" />
                  <span className="text-sm font-medium">{uni.progresso}%</span>
                </div>
              </div>
            ))}
            {dadosUnidades.length === 0 && (
              <p className="text-center py-8 text-gray-500">Nenhuma unidade com tarefas</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tarefas Críticas */}
        <Card className="border-l-4 border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Tarefas Críticas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tarefasCriticas.length > 0 ? (
              <div className="space-y-3">
                {tarefasCriticas.map((t, idx) => {
                  const unidade = unidades.find(u => u.id === t.unidade_id);
                  return (
                    <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="font-medium text-red-900">{t.etapa}</p>
                      <div className="flex items-center gap-2 text-sm text-red-700 mt-1">
                        <Building className="w-3 h-3" />
                        <span>{unidade?.codigo}</span>
                        <span>•</span>
                        <User className="w-3 h-3" />
                        <span>{t.responsavel || 'Sem responsável'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-green-600">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                Nenhuma tarefa crítica pendente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tarefas Mais Atrasadas */}
        <Card className="border-l-4 border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              Tarefas Mais Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tarefasAtrasadas.length > 0 ? (
              <div className="space-y-3">
                {tarefasAtrasadas.map((t, idx) => {
                  const unidade = unidades.find(u => u.id === t.unidade_id);
                  return (
                    <div key={idx} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-orange-900">{t.etapa}</p>
                        <Badge className="bg-red-600 text-white">{t.diasAtraso}d atraso</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-orange-700 mt-1">
                        <Building className="w-3 h-3" />
                        <span>{unidade?.codigo}</span>
                        <span>•</span>
                        <User className="w-3 h-3" />
                        <span>{t.responsavel || 'Sem responsável'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-green-600">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                Nenhuma tarefa atrasada
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}