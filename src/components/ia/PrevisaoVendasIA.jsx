import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Calendar, Target, Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { format, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function PrevisaoVendasIA({ negociacoes = [], unidades = [], loteamentos = [] }) {
  const [analise, setAnalise] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  // Preparar dados históricos
  const prepararDadosHistoricos = () => {
    const hoje = new Date();
    const meses = [];
    
    for (let i = 11; i >= 0; i--) {
      const mes = subMonths(hoje, i);
      const mesKey = format(mes, 'yyyy-MM');
      const vendasMes = negociacoes.filter(n => {
        if (!n.data_inicio) return false;
        return n.data_inicio.startsWith(mesKey);
      });
      
      meses.push({
        mes: format(mes, "MMM/yy", { locale: ptBR }),
        mesKey,
        vendas: vendasMes.length,
        valor: vendasMes.reduce((sum, n) => sum + (n.valor_total || 0), 0),
      });
    }
    
    return meses;
  };

  const dadosHistoricos = prepararDadosHistoricos();

  const analisarMutation = useMutation({
    mutationFn: async () => {
      const totalUnidades = unidades.length;
      const unidadesVendidas = unidades.filter(u => u.status === 'vendida').length;
      const unidadesDisponiveis = unidades.filter(u => u.status === 'disponivel').length;
      
      const prompt = `Analise os seguintes dados de vendas imobiliárias e forneça previsões:

DADOS HISTÓRICOS DE VENDAS (últimos 12 meses):
${dadosHistoricos.map(d => `${d.mes}: ${d.vendas} vendas, R$ ${d.valor.toLocaleString('pt-BR')}`).join('\n')}

ESTOQUE ATUAL:
- Total de unidades: ${totalUnidades}
- Unidades vendidas: ${unidadesVendidas}
- Unidades disponíveis: ${unidadesDisponiveis}

LOTEAMENTOS: ${loteamentos.map(l => l.nome).join(', ')}

Com base nesses dados, forneça:
1. Previsão de vendas para os próximos 6 meses (quantidade e valor estimado por mês)
2. Tendência geral do mercado (alta, estável, baixa)
3. Meses com maior potencial de vendas
4. Recomendações estratégicas para aumentar vendas
5. Fatores de risco identificados`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            previsao_mensal: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  mes: { type: "string" },
                  vendas_previstas: { type: "number" },
                  valor_previsto: { type: "number" },
                  confianca: { type: "number" }
                }
              }
            },
            tendencia: { type: "string" },
            tendencia_percentual: { type: "number" },
            meses_potencial: { type: "array", items: { type: "string" } },
            recomendacoes: { type: "array", items: { type: "string" } },
            fatores_risco: { type: "array", items: { type: "string" } },
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

  // Combinar dados históricos com previsão
  const dadosGrafico = [
    ...dadosHistoricos,
    ...(analise?.previsao_mensal || []).map((p, i) => ({
      mes: p.mes,
      vendas: null,
      valor: null,
      vendas_previstas: p.vendas_previstas,
      valor_previsto: p.valor_previsto,
      confianca: p.confianca
    }))
  ];

  return (
    <Card className="shadow-lg border-l-4 border-blue-500">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Previsão de Vendas com IA
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => analisarMutation.mutate()}
                disabled={analisarMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
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
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Clique em "Analisar" para gerar previsões de vendas com IA</p>
              </div>
            )}

            {analisarMutation.isPending && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin text-blue-600" />
                <p className="text-gray-600">Analisando dados históricos e gerando previsões...</p>
              </div>
            )}

            {analise && (
              <div className="space-y-6">
                {/* Resumo Executivo */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Resumo Executivo
                  </h4>
                  <p className="text-sm text-blue-800">{analise.resumo_executivo}</p>
                </div>

                {/* Tendência */}
                <div className="flex items-center gap-4">
                  <Badge className={`px-4 py-2 text-sm ${
                    analise.tendencia === 'alta' ? 'bg-green-100 text-green-800' :
                    analise.tendencia === 'baixa' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    Tendência: {analise.tendencia?.toUpperCase()}
                    {analise.tendencia_percentual && ` (${analise.tendencia_percentual > 0 ? '+' : ''}${analise.tendencia_percentual}%)`}
                  </Badge>
                  {analise.meses_potencial?.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Meses com maior potencial: {analise.meses_potencial.join(', ')}
                    </div>
                  )}
                </div>

                {/* Gráfico de Previsão */}
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'vendas' || name === 'vendas_previstas') return [value, 'Vendas'];
                          return [`R$ ${value?.toLocaleString('pt-BR')}`, 'Valor'];
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="vendas" stroke="#3b82f6" fill="#93c5fd" name="Vendas Realizadas" />
                      <Area type="monotone" dataKey="vendas_previstas" stroke="#8b5cf6" fill="#c4b5fd" strokeDasharray="5 5" name="Vendas Previstas" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Previsão Detalhada */}
                {analise.previsao_mensal?.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {analise.previsao_mensal.map((p, i) => (
                      <div key={i} className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
                        <p className="text-xs text-purple-600 font-medium">{p.mes}</p>
                        <p className="text-lg font-bold text-purple-900">{p.vendas_previstas}</p>
                        <p className="text-xs text-purple-700">
                          R$ {(p.valor_previsto / 1000).toFixed(0)}k
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {p.confianca}% conf.
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recomendações e Riscos */}
                <div className="grid md:grid-cols-2 gap-4">
                  {analise.recomendacoes?.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">✅ Recomendações</h4>
                      <ul className="space-y-1">
                        {analise.recomendacoes.map((r, i) => (
                          <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analise.fatores_risco?.length > 0 && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-semibold text-red-900 mb-2">⚠️ Fatores de Risco</h4>
                      <ul className="space-y-1">
                        {analise.fatores_risco.map((r, i) => (
                          <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                            <span className="text-red-600 mt-1">•</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}