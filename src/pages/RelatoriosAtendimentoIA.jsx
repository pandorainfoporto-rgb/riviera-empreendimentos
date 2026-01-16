import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Brain, TrendingUp, Clock, Star, MessageSquare,
  Target, Zap, Users, Award, Loader2, Download
} from "lucide-react";
import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function RelatoriosAtendimentoIA() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('30');
  const [insights, setInsights] = useState(null);
  const [carregandoInsights, setCarregandoInsights] = useState(false);

  // Buscar dados de conversas
  const { data: conversas = [], isLoading: loadingConversas } = useQuery({
    queryKey: ['conversas_relatorio', periodoSelecionado],
    queryFn: async () => {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - parseInt(periodoSelecionado));
      
      return await base44.entities.ConversaOmnichannel.filter({
        created_date: { $gte: dataInicio.toISOString() }
      });
    },
  });

  // Buscar avaliações
  const { data: avaliacoes = [], isLoading: loadingAvaliacoes } = useQuery({
    queryKey: ['avaliacoes_relatorio', periodoSelecionado],
    queryFn: async () => {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - parseInt(periodoSelecionado));
      
      return await base44.entities.AvaliacaoAtendimento.filter({
        created_date: { $gte: dataInicio.toISOString() }
      });
    },
  });

  // Buscar respostas rápidas
  const { data: respostasRapidas = [] } = useQuery({
    queryKey: ['respostas_uso'],
    queryFn: () => base44.entities.RespostaRapidaChat.list('-uso_contador', 10),
  });

  // Buscar funções
  const { data: funcoes = [] } = useQuery({
    queryKey: ['funcoes_uso'],
    queryFn: () => base44.entities.FuncaoChat.list('-uso_contador', 10),
  });

  // Calcular métricas
  const metricas = {
    totalConversas: conversas.length,
    taxaResolucao: conversas.filter(c => c.status === 'finalizado').length / conversas.length * 100 || 0,
    mediaAvaliacaoAtendimento: avaliacoes.reduce((sum, a) => sum + a.nota_atendimento, 0) / avaliacoes.length || 0,
    mediaAvaliacaoEmpresa: avaliacoes.reduce((sum, a) => sum + a.nota_empresa, 0) / avaliacoes.length || 0,
    totalAvaliacoes: avaliacoes.length,
  };

  // Dados para gráficos
  const sentimentoData = [
    { name: 'Positivo', value: conversas.filter(c => c.analise_ia?.sentimento === 'positivo').length },
    { name: 'Neutro', value: conversas.filter(c => c.analise_ia?.sentimento === 'neutro').length },
    { name: 'Negativo', value: conversas.filter(c => c.analise_ia?.sentimento === 'negativo').length },
  ].filter(d => d.value > 0);

  const urgenciaData = [
    { name: 'Baixa', value: conversas.filter(c => c.prioridade === 'baixa').length },
    { name: 'Normal', value: conversas.filter(c => c.prioridade === 'normal').length },
    { name: 'Alta', value: conversas.filter(c => c.prioridade === 'alta').length },
    { name: 'Urgente', value: conversas.filter(c => c.prioridade === 'urgente').length },
  ];

  const distribuicaoAvaliacoes = [
    { estrelas: '5 ⭐', quantidade: avaliacoes.filter(a => a.nota_atendimento === 5).length },
    { estrelas: '4 ⭐', quantidade: avaliacoes.filter(a => a.nota_atendimento === 4).length },
    { estrelas: '3 ⭐', quantidade: avaliacoes.filter(a => a.nota_atendimento === 3).length },
    { estrelas: '2 ⭐', quantidade: avaliacoes.filter(a => a.nota_atendimento === 2).length },
    { estrelas: '1 ⭐', quantidade: avaliacoes.filter(a => a.nota_atendimento === 1).length },
  ];

  const gerarInsightsIA = async () => {
    setCarregandoInsights(true);
    
    try {
      const prompt = `Analise os seguintes dados de atendimento omnichannel dos últimos ${periodoSelecionado} dias:

Total de Conversas: ${metricas.totalConversas}
Taxa de Resolução: ${metricas.taxaResolucao.toFixed(1)}%
Média Avaliação Atendimento: ${metricas.mediaAvaliacaoAtendimento.toFixed(1)}/5
Média Avaliação Empresa: ${metricas.mediaAvaliacaoEmpresa.toFixed(1)}/5

Sentimento:
- Positivo: ${sentimentoData.find(s => s.name === 'Positivo')?.value || 0}
- Neutro: ${sentimentoData.find(s => s.name === 'Neutro')?.value || 0}
- Negativo: ${sentimentoData.find(s => s.name === 'Negativo')?.value || 0}

Respostas Rápidas Mais Usadas:
${respostasRapidas.slice(0, 5).map(r => `- ${r.titulo}: ${r.uso_contador} vezes`).join('\n')}

Forneça:
1. 3 insights principais sobre o desempenho
2. 3 recomendações práticas para melhorar
3. 1 alerta importante (se houver problemas)
4. Score geral de 0-100`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            insights: { type: "array", items: { type: "string" } },
            recomendacoes: { type: "array", items: { type: "string" } },
            alerta: { type: "string" },
            score_geral: { type: "number" }
          }
        }
      });

      setInsights(resultado);
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
    } finally {
      setCarregandoInsights(false);
    }
  };

  if (loadingConversas || loadingAvaliacoes) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-600" />
              Relatórios com IA - Atendimento
            </h1>
            <p className="text-gray-600 mt-1">Análise inteligente de métricas e insights</p>
          </div>

          <div className="flex gap-2">
            <select
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>

            <Button className="bg-purple-600 hover:bg-purple-700">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Conversas</p>
                  <p className="text-2xl font-bold">{metricas.totalConversas}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taxa Resolução</p>
                  <p className="text-2xl font-bold">{metricas.taxaResolucao.toFixed(1)}%</p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Média Atendimento</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    {metricas.mediaAvaliacaoAtendimento.toFixed(1)}
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  </p>
                </div>
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Média Empresa</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    {metricas.mediaAvaliacaoEmpresa.toFixed(1)}
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights com IA */}
        <Card className="mb-8 border-purple-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-600" />
                Insights com Inteligência Artificial
              </CardTitle>
              <Button
                onClick={gerarInsightsIA}
                disabled={carregandoInsights}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {carregandoInsights ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Gerar Insights
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {insights ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-purple-600">{insights.score_geral}</p>
                    <p className="text-sm text-gray-600">Score Geral</p>
                  </div>
                </div>

                {insights.alerta && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-900">⚠️ Alerta</p>
                    <p className="text-sm text-red-800 mt-1">{insights.alerta}</p>
                  </div>
                )}

                <div>
                  <p className="font-semibold text-gray-900 mb-2">📊 Insights Principais</p>
                  <ul className="space-y-2">
                    {insights.insights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-purple-600">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 mb-2">💡 Recomendações</p>
                  <ul className="space-y-2">
                    {insights.recomendacoes.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-green-600">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Clique em "Gerar Insights" para análise com IA</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sentimento dos Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sentimentoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sentimentoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição de Urgência</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={urgenciaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição de Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={distribuicaoAvaliacoes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="estrelas" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Respostas Rápidas Mais Usadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {respostasRapidas.slice(0, 5).map((resposta, idx) => (
                  <div key={resposta.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge>{idx + 1}</Badge>
                      <span className="text-sm font-medium">{resposta.titulo}</span>
                    </div>
                    <Badge variant="outline">{resposta.uso_contador}x</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funções Mais Usadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Funções Mais Utilizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {funcoes.slice(0, 6).map((funcao) => (
                <div key={funcao.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge>#{funcao.atalho}</Badge>
                    <Badge variant="outline">{funcao.uso_contador}x</Badge>
                  </div>
                  <p className="font-semibold text-sm">{funcao.titulo}</p>
                  <p className="text-xs text-gray-600 mt-1">{funcao.categoria}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}