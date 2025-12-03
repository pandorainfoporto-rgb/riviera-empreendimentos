import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Hammer, TrendingDown, DollarSign, Sparkles, RefreshCw, ChevronDown, ChevronUp, Lightbulb, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function OtimizacaoCustosObraIA({ 
  custosObra = [], 
  cronogramasObra = [],
  pagamentosFornecedores = [],
  unidades = [],
  fornecedores = []
}) {
  const [analise, setAnalise] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  const analisarMutation = useMutation({
    mutationFn: async () => {
      // Calcular métricas de custos
      const custoTotal = custosObra.reduce((sum, c) => sum + (c.valor_total || 0), 0);
      const custoRealizado = custosObra.reduce((sum, c) => sum + (c.valor_realizado || 0), 0);
      
      // Agrupar custos por categoria
      const custosPorCategoria = {};
      custosObra.forEach(c => {
        const cat = c.categoria || 'outros';
        if (!custosPorCategoria[cat]) custosPorCategoria[cat] = { previsto: 0, realizado: 0 };
        custosPorCategoria[cat].previsto += c.valor_total || 0;
        custosPorCategoria[cat].realizado += c.valor_realizado || 0;
      });

      // Análise de fornecedores
      const gastosPorFornecedor = {};
      pagamentosFornecedores.forEach(p => {
        if (!gastosPorFornecedor[p.fornecedor_id]) gastosPorFornecedor[p.fornecedor_id] = 0;
        gastosPorFornecedor[p.fornecedor_id] += p.valor || 0;
      });

      const prompt = `Analise os seguintes dados de custos de obras e forneça sugestões de otimização:

RESUMO GERAL:
- Custo total previsto: R$ ${custoTotal.toLocaleString('pt-BR')}
- Custo realizado: R$ ${custoRealizado.toLocaleString('pt-BR')}
- Variação: ${custoTotal > 0 ? (((custoRealizado - custoTotal) / custoTotal) * 100).toFixed(1) : 0}%

CUSTOS POR CATEGORIA:
${Object.entries(custosPorCategoria).map(([cat, dados]) => 
  `- ${cat}: Previsto R$ ${dados.previsto.toLocaleString('pt-BR')}, Realizado R$ ${dados.realizado.toLocaleString('pt-BR')}`
).join('\n')}

UNIDADES EM CONSTRUÇÃO: ${unidades.filter(u => u.status === 'em_construcao').length}
OBRAS EM ANDAMENTO: ${cronogramasObra.filter(c => c.status === 'em_andamento').length}
OBRAS ATRASADAS: ${cronogramasObra.filter(c => c.status === 'atrasada').length}

FORNECEDORES UTILIZADOS: ${fornecedores.length}
TOP 5 FORNECEDORES POR GASTO:
${Object.entries(gastosPorFornecedor)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([id, valor]) => {
    const forn = fornecedores.find(f => f.id === id);
    return `- ${forn?.nome || 'Fornecedor'}: R$ ${valor.toLocaleString('pt-BR')}`;
  }).join('\n')}

Forneça:
1. Oportunidades de redução de custos por categoria
2. Sugestões de negociação com fornecedores
3. Comparativo de eficiência entre obras
4. Previsão de economia potencial
5. Alertas de estouro de orçamento`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            economia_potencial_total: { type: "number" },
            percentual_economia: { type: "number" },
            oportunidades_categoria: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  categoria: { type: "string" },
                  economia_potencial: { type: "number" },
                  sugestao: { type: "string" },
                  prioridade: { type: "string" }
                }
              }
            },
            sugestoes_fornecedores: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sugestao: { type: "string" },
                  economia_estimada: { type: "number" },
                  dificuldade: { type: "string" }
                }
              }
            },
            comparativo_obras: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  obra: { type: "string" },
                  eficiencia: { type: "string" },
                  observacao: { type: "string" }
                }
              }
            },
            alertas_orcamento: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  alerta: { type: "string" },
                  gravidade: { type: "string" },
                  acao_sugerida: { type: "string" }
                }
              }
            },
            melhores_praticas: {
              type: "array",
              items: { type: "string" }
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

  return (
    <Card className="shadow-lg border-l-4 border-green-500">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              Otimização de Custos de Obra com IA
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => analisarMutation.mutate()}
                disabled={analisarMutation.isPending}
                className="bg-gradient-to-r from-green-600 to-emerald-600"
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
                <Hammer className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Clique em "Analisar" para obter sugestões de otimização de custos</p>
              </div>
            )}

            {analisarMutation.isPending && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin text-green-600" />
                <p className="text-gray-600">Analisando custos e identificando oportunidades de economia...</p>
              </div>
            )}

            {analise && (
              <div className="space-y-6">
                {/* Economia Potencial */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300 text-center">
                    <TrendingDown className="w-10 h-10 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-700 font-medium">Economia Potencial Identificada</p>
                    <p className="text-4xl font-bold text-green-800 mt-2">
                      R$ {(analise.economia_potencial_total || 0).toLocaleString('pt-BR')}
                    </p>
                    <Badge className="mt-2 bg-green-600">
                      {analise.percentual_economia || 0}% de redução possível
                    </Badge>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Resumo Executivo</h4>
                    <p className="text-sm text-green-800">{analise.resumo_executivo}</p>
                  </div>
                </div>

                {/* Oportunidades por Categoria */}
                {analise.oportunidades_categoria?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      Oportunidades por Categoria
                    </h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {analise.oportunidades_categoria.map((op, i) => (
                        <div key={i} className="p-4 bg-white rounded-lg border shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-semibold text-gray-900 capitalize">{op.categoria}</span>
                            <Badge className={`${
                              op.prioridade === 'alta' ? 'bg-red-600' :
                              op.prioridade === 'media' ? 'bg-yellow-600' : 'bg-green-600'
                            }`}>
                              {op.prioridade}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{op.sugestao}</p>
                          <p className="text-sm font-bold text-green-700">
                            Economia: R$ {(op.economia_potencial || 0).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sugestões de Fornecedores */}
                {analise.sugestoes_fornecedores?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">🤝 Sugestões para Fornecedores</h4>
                    <div className="space-y-2">
                      {analise.sugestoes_fornecedores.map((s, i) => (
                        <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{s.sugestao}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-green-700 font-medium">
                                Economia: R$ {(s.economia_estimada || 0).toLocaleString('pt-BR')}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                Dificuldade: {s.dificuldade}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alertas de Orçamento */}
                {analise.alertas_orcamento?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">⚠️ Alertas de Orçamento</h4>
                    <div className="space-y-2">
                      {analise.alertas_orcamento.map((a, i) => (
                        <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 ${
                          a.gravidade === 'alta' ? 'bg-red-50 border-red-200' :
                          a.gravidade === 'media' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-orange-50 border-orange-200'
                        }`}>
                          <Badge className={`flex-shrink-0 ${
                            a.gravidade === 'alta' ? 'bg-red-600' :
                            a.gravidade === 'media' ? 'bg-yellow-600' : 'bg-orange-600'
                          }`}>
                            {a.gravidade}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{a.alerta}</p>
                            <p className="text-xs text-gray-600 mt-1">Ação: {a.acao_sugerida}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Melhores Práticas */}
                {analise.melhores_praticas?.length > 0 && (
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Melhores Práticas Recomendadas
                    </h4>
                    <ul className="space-y-2">
                      {analise.melhores_praticas.map((p, i) => (
                        <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                          <span className="text-emerald-600 mt-1">✓</span>
                          {p}
                        </li>
                      ))}
                    </ul>
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