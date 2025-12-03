import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertTriangle, Shield, Users, Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function AnaliseRiscoInadimplenciaIA({ 
  pagamentosClientes = [], 
  clientes = [], 
  locacoes = [],
  alugueisMensais = []
}) {
  const [analise, setAnalise] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  const analisarMutation = useMutation({
    mutationFn: async () => {
      // Calcular métricas de inadimplência
      const pagamentosAtrasados = pagamentosClientes.filter(p => p.status === 'atrasado');
      const pagamentosPendentes = pagamentosClientes.filter(p => p.status === 'pendente');
      const pagamentosPagos = pagamentosClientes.filter(p => p.status === 'pago');
      
      const alugueisAtrasados = alugueisMensais.filter(a => a.status === 'atrasado');
      const alugueisPendentes = alugueisMensais.filter(a => a.status === 'pendente');

      // Análise por cliente
      const clientesComAtraso = {};
      pagamentosAtrasados.forEach(p => {
        if (!clientesComAtraso[p.cliente_id]) {
          clientesComAtraso[p.cliente_id] = { atrasados: 0, valor: 0 };
        }
        clientesComAtraso[p.cliente_id].atrasados++;
        clientesComAtraso[p.cliente_id].valor += p.valor || 0;
      });

      const prompt = `Analise os seguintes dados de pagamentos e forneça uma análise de risco de inadimplência:

PAGAMENTOS DE CLIENTES (Vendas):
- Total de pagamentos: ${pagamentosClientes.length}
- Pagos: ${pagamentosPagos.length}
- Pendentes: ${pagamentosPendentes.length}
- Atrasados: ${pagamentosAtrasados.length}
- Valor total atrasado: R$ ${pagamentosAtrasados.reduce((s, p) => s + (p.valor || 0), 0).toLocaleString('pt-BR')}

ALUGUÉIS (Locações):
- Total de locações ativas: ${locacoes.filter(l => l.status === 'ativo').length}
- Aluguéis pendentes: ${alugueisPendentes.length}
- Aluguéis atrasados: ${alugueisAtrasados.length}
- Valor atrasado: R$ ${alugueisAtrasados.reduce((s, a) => s + (a.valor_total || 0), 0).toLocaleString('pt-BR')}

CLIENTES COM HISTÓRICO DE ATRASO:
${Object.entries(clientesComAtraso).slice(0, 10).map(([id, data]) => 
  `- Cliente ${id}: ${data.atrasados} pagamentos atrasados, R$ ${data.valor.toLocaleString('pt-BR')}`
).join('\n')}

Total de clientes: ${clientes.length}
Clientes com algum atraso: ${Object.keys(clientesComAtraso).length}

Forneça:
1. Score de risco geral (0-100, onde 100 é maior risco)
2. Classificação de clientes por nível de risco
3. Previsão de inadimplência para os próximos 3 meses
4. Ações recomendadas para reduzir inadimplência
5. Clientes que precisam de atenção imediata`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            score_risco_geral: { type: "number" },
            nivel_risco: { type: "string" },
            distribuicao_risco: {
              type: "object",
              properties: {
                baixo: { type: "number" },
                medio: { type: "number" },
                alto: { type: "number" },
                critico: { type: "number" }
              }
            },
            previsao_inadimplencia: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  mes: { type: "string" },
                  percentual_previsto: { type: "number" },
                  valor_em_risco: { type: "number" }
                }
              }
            },
            acoes_recomendadas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  acao: { type: "string" },
                  prioridade: { type: "string" },
                  impacto_esperado: { type: "string" }
                }
              }
            },
            clientes_atencao: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  descricao: { type: "string" },
                  risco: { type: "string" },
                  valor_em_risco: { type: "number" }
                }
              }
            },
            resumo_executivo: { type: "string" }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setAnalise(data);
    }
  });

  const COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];

  const dadosPie = analise?.distribuicao_risco ? [
    { name: 'Baixo', value: analise.distribuicao_risco.baixo || 0, color: '#10b981' },
    { name: 'Médio', value: analise.distribuicao_risco.medio || 0, color: '#f59e0b' },
    { name: 'Alto', value: analise.distribuicao_risco.alto || 0, color: '#f97316' },
    { name: 'Crítico', value: analise.distribuicao_risco.critico || 0, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  const getScoreColor = (score) => {
    if (score <= 25) return 'text-green-600';
    if (score <= 50) return 'text-yellow-600';
    if (score <= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score <= 25) return 'bg-green-100';
    if (score <= 50) return 'bg-yellow-100';
    if (score <= 75) return 'bg-orange-100';
    return 'bg-red-100';
  };

  return (
    <Card className="shadow-lg border-l-4 border-orange-500">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-600" />
              Análise de Risco de Inadimplência com IA
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => analisarMutation.mutate()}
                disabled={analisarMutation.isPending}
                className="bg-gradient-to-r from-orange-600 to-red-600"
              >
                {analisarMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {analise ? 'Atualizar' : 'Analisar'}
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent>
            {!analise && !analisarMutation.isPending && (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Clique em "Analisar" para avaliar riscos de inadimplência</p>
              </div>
            )}

            {analisarMutation.isPending && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin text-orange-600" />
                <p className="text-gray-600">Analisando histórico de pagamentos e calculando riscos...</p>
              </div>
            )}

            {analise && (
              <div className="space-y-6">
                {/* Score de Risco */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className={`p-6 rounded-lg ${getScoreBgColor(analise.score_risco_geral)} text-center`}>
                    <p className="text-sm font-medium text-gray-600 mb-2">Score de Risco Geral</p>
                    <p className={`text-5xl font-bold ${getScoreColor(analise.score_risco_geral)}`}>
                      {analise.score_risco_geral}
                    </p>
                    <Badge className={`mt-2 ${
                      analise.nivel_risco === 'baixo' ? 'bg-green-600' :
                      analise.nivel_risco === 'medio' ? 'bg-yellow-600' :
                      analise.nivel_risco === 'alto' ? 'bg-orange-600' : 'bg-red-600'
                    }`}>
                      Risco {analise.nivel_risco?.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Gráfico de Distribuição */}
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-600 mb-2">Distribuição de Clientes por Risco</p>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dadosPie}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {dadosPie.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}%`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Resumo */}
                <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-800">{analise.resumo_executivo}</p>
                </div>

                {/* Previsão de Inadimplência */}
                {analise.previsao_inadimplencia?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">📊 Previsão de Inadimplência</h4>
                    <div className="grid md:grid-cols-3 gap-3">
                      {analise.previsao_inadimplencia.map((p, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg border">
                          <p className="text-sm text-gray-600">{p.mes}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={p.percentual_previsto} className="flex-1" />
                            <span className="text-sm font-bold">{p.percentual_previsto}%</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Valor em risco: R$ {(p.valor_em_risco || 0).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ações Recomendadas */}
                {analise.acoes_recomendadas?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">✅ Ações Recomendadas</h4>
                    <div className="space-y-2">
                      {analise.acoes_recomendadas.map((a, i) => (
                        <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-start gap-3">
                          <Badge className={`flex-shrink-0 ${
                            a.prioridade === 'alta' ? 'bg-red-600' :
                            a.prioridade === 'media' ? 'bg-yellow-600' : 'bg-green-600'
                          }`}>
                            {a.prioridade}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{a.acao}</p>
                            <p className="text-xs text-gray-600 mt-1">Impacto esperado: {a.impacto_esperado}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clientes que precisam atenção */}
                {analise.clientes_atencao?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Clientes que Precisam de Atenção
                    </h4>
                    <div className="space-y-2">
                      {analise.clientes_atencao.map((c, i) => (
                        <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{c.descricao}</p>
                            <p className="text-xs text-red-600">
                              Valor em risco: R$ {(c.valor_em_risco || 0).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <Badge className={`${
                            c.risco === 'critico' ? 'bg-red-600' :
                            c.risco === 'alto' ? 'bg-orange-600' : 'bg-yellow-600'
                          }`}>
                            {c.risco}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}