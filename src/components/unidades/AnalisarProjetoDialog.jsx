import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Sparkles, Loader2, FileText, Ruler, Home, 
  Maximize2, Layers, CheckCircle2, AlertTriangle,
  Download, Copy
} from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function AnalisarProjetoDialog({ open, onClose, unidade, arquivoUrl }) {
  const [analisando, setAnalisando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  React.useEffect(() => {
    if (open && arquivoUrl && !resultado && !analisando && !erro) {
      analisarProjeto();
    }
  }, [open, arquivoUrl]);

  const analisarProjeto = async () => {
    setAnalisando(true);
    setErro(null);
    setResultado(null);

    try {
      toast.info('🤖 IA analisando projeto arquitetônico...', { duration: 3000 });

      const prompt = `Analise este projeto arquitetônico detalhadamente e extraia TODAS as informações quantitativas e técnicas possíveis para orçamentação de obra.

INFORMAÇÕES DO PROJETO:
- Tipo: ${unidade.tipo || 'não especificado'}
- Área Total: ${unidade.area_total || 0}m²
- Área Construída: ${unidade.area_construida || 0}m²
- Padrão: ${unidade.padrao_obra || 'médio'}
- Pavimentos: ${unidade.quantidade_pavimentos || 1}
- Pé-direito: ${unidade.pe_direito || 2.8}m

EXTRAIA AS SEGUINTES INFORMAÇÕES:

1. DIMENSÕES DO LOTE:
   - Frente, fundos, laterais (em metros)
   - Área total do terreno
   - Formato do lote (retangular, irregular, etc.)

2. ZONEAMENTO E LEGISLAÇÃO:
   - Recuos frontais, laterais e de fundos
   - Taxa de ocupação calculada e máxima permitida
   - Taxa de permeabilidade calculada e mínima exigida
   - Coeficiente de aproveitamento

3. ÁREAS CONSTRUÍDAS POR PAVIMENTO:
   - Detalhar cada pavimento
   - Áreas de cada ambiente (sala, quartos, cozinha, etc.)

4. ABERTURAS:
   - Quantidade de portas por tipo e dimensões médias
   - Quantidade de janelas por tipo e dimensões médias
   - Área total envidraçada

5. ESTRUTURA:
   - Tipo de fundação identificada
   - Tipo de estrutura (alvenaria, concreto, etc.)
   - Lajes (tipo e área total)

6. COBERTURA:
   - Tipo de telhado
   - Área de cobertura
   - Inclinação
   - Material sugerido

7. PAREDES:
   - Metragem linear de paredes internas
   - Metragem linear de paredes externas
   - Altura média das paredes

8. PISOS E REVESTIMENTOS:
   - Área de pisos por tipo de ambiente
   - Área de revestimento de paredes (banheiros, cozinha)

9. INSTALAÇÕES:
   - Pontos elétricos estimados
   - Pontos hidráulicos estimados
   - Pontos de esgoto

10. QUANTITATIVOS DE MATERIAIS:
    - Volume de concreto necessário
    - Quantidade estimada de tijolos/blocos
    - Metragem de tubulações
    - Área de pintura
    - Outros materiais principais

Retorne TODOS os dados em formato estruturado e detalhado.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [arquivoUrl],
        response_json_schema: {
          type: "object",
          properties: {
            dimensoes_lote: {
              type: "object",
              properties: {
                frente: { type: "number" },
                fundos: { type: "number" },
                lateral_esquerda: { type: "number" },
                lateral_direita: { type: "number" },
                area_total_terreno: { type: "number" },
                formato: { type: "string" }
              }
            },
            zoneamento: {
              type: "object",
              properties: {
                recuo_frontal: { type: "number" },
                recuo_lateral_esquerdo: { type: "number" },
                recuo_lateral_direito: { type: "number" },
                recuo_fundos: { type: "number" },
                taxa_ocupacao_calculada: { type: "number" },
                taxa_ocupacao_maxima: { type: "number" },
                taxa_permeabilidade_calculada: { type: "number" },
                taxa_permeabilidade_minima: { type: "number" },
                coeficiente_aproveitamento: { type: "number" }
              }
            },
            areas_pavimentos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pavimento: { type: "string" },
                  area_total: { type: "number" },
                  ambientes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nome: { type: "string" },
                        area: { type: "number" }
                      }
                    }
                  }
                }
              }
            },
            aberturas: {
              type: "object",
              properties: {
                portas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      tipo: { type: "string" },
                      quantidade: { type: "number" },
                      dimensoes: { type: "string" }
                    }
                  }
                },
                janelas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      tipo: { type: "string" },
                      quantidade: { type: "number" },
                      dimensoes: { type: "string" }
                    }
                  }
                },
                area_total_envidracada: { type: "number" }
              }
            },
            estrutura: {
              type: "object",
              properties: {
                tipo_fundacao: { type: "string" },
                tipo_estrutura: { type: "string" },
                lajes: {
                  type: "object",
                  properties: {
                    tipo: { type: "string" },
                    area_total: { type: "number" }
                  }
                }
              }
            },
            cobertura: {
              type: "object",
              properties: {
                tipo_telhado: { type: "string" },
                area_cobertura: { type: "number" },
                inclinacao: { type: "string" },
                material_sugerido: { type: "string" }
              }
            },
            paredes: {
              type: "object",
              properties: {
                metragem_linear_internas: { type: "number" },
                metragem_linear_externas: { type: "number" },
                altura_media: { type: "number" }
              }
            },
            pisos_revestimentos: {
              type: "object",
              properties: {
                area_pisos_internos: { type: "number" },
                area_pisos_externos: { type: "number" },
                area_revestimento_paredes: { type: "number" }
              }
            },
            instalacoes: {
              type: "object",
              properties: {
                pontos_eletricos: { type: "number" },
                pontos_hidraulicos: { type: "number" },
                pontos_esgoto: { type: "number" }
              }
            },
            quantitativos_materiais: {
              type: "object",
              properties: {
                volume_concreto_m3: { type: "number" },
                quantidade_tijolos: { type: "number" },
                metragem_tubulacoes: { type: "number" },
                area_pintura: { type: "number" },
                outros: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      material: { type: "string" },
                      quantidade: { type: "number" },
                      unidade: { type: "string" }
                    }
                  }
                }
              }
            },
            observacoes_tecnicas: {
              type: "array",
              items: { type: "string" }
            },
            nivel_confianca: { type: "string" }
          }
        }
      });

      setResultado(response);
      toast.success('✅ Análise concluída!');
    } catch (error) {
      console.error('Erro ao analisar projeto:', error);
      setErro(error.message || 'Erro ao analisar projeto');
      toast.error('Erro na análise do projeto');
    } finally {
      setAnalisando(false);
    }
  };

  const aplicarDadosNaUnidade = async () => {
    if (!resultado || !unidade?.id) return;

    try {
      await base44.entities.Unidade.update(unidade.id, {
        analise_projeto_ia: resultado,
        medidas_lote: resultado.dimensoes_lote,
      });

      toast.success('✅ Dados aplicados na unidade!');
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar dados na unidade');
    }
  };

  const copiarJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(resultado, null, 2));
    toast.success('JSON copiado para área de transferência!');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Análise de Projeto com IA
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {analisando && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-16 h-16 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-700 font-medium text-lg">🤖 IA analisando projeto...</p>
              <p className="text-sm text-gray-500 mt-2">
                Extraindo dimensões, quantitativos e dados técnicos
              </p>
              <div className="mt-4 space-y-1 text-xs text-gray-400 text-center">
                <p>• Identificando elementos construtivos</p>
                <p>• Calculando áreas e volumes</p>
                <p>• Analisando conformidade urbanística</p>
                <p>• Gerando quantitativos de materiais</p>
              </div>
            </div>
          )}

          {erro && (
            <div className="p-6 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-red-900 mb-2">Erro na Análise</p>
                  <p className="text-sm text-red-700">{erro}</p>
                  <Button
                    onClick={analisarProjeto}
                    className="mt-4 bg-red-600 hover:bg-red-700"
                    size="sm"
                  >
                    🔄 Tentar Novamente
                  </Button>
                </div>
              </div>
            </div>
          )}

          {resultado && !analisando && !erro && (
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="lote">Lote</TabsTrigger>
                <TabsTrigger value="quantitativos">Quantitativos</TabsTrigger>
                <TabsTrigger value="materiais">Materiais</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="space-y-4 mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-4 border-l-4 border-blue-500">
                    <div className="flex items-center gap-3 mb-3">
                      <Home className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Estrutura</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fundação:</span>
                        <span className="font-semibold">{resultado.estrutura?.tipo_fundacao || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estrutura:</span>
                        <span className="font-semibold">{resultado.estrutura?.tipo_estrutura || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Laje:</span>
                        <span className="font-semibold">{resultado.estrutura?.lajes?.tipo || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Área de Laje:</span>
                        <span className="font-semibold">{resultado.estrutura?.lajes?.area_total || 0}m²</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 border-l-4 border-green-500">
                    <div className="flex items-center gap-3 mb-3">
                      <Layers className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Cobertura</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tipo:</span>
                        <span className="font-semibold">{resultado.cobertura?.tipo_telhado || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Área:</span>
                        <span className="font-semibold">{resultado.cobertura?.area_cobertura || 0}m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Inclinação:</span>
                        <span className="font-semibold">{resultado.cobertura?.inclinacao || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Material:</span>
                        <span className="font-semibold">{resultado.cobertura?.material_sugerido || '-'}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-4 border-l-4 border-purple-500">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Aberturas</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Portas</p>
                      {resultado.aberturas?.portas?.map((porta, idx) => (
                        <div key={idx} className="text-sm flex justify-between mb-1">
                          <span className="text-gray-600">{porta.tipo}:</span>
                          <span className="font-semibold">
                            {porta.quantidade}x ({porta.dimensoes})
                          </span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Janelas</p>
                      {resultado.aberturas?.janelas?.map((janela, idx) => (
                        <div key={idx} className="text-sm flex justify-between mb-1">
                          <span className="text-gray-600">{janela.tipo}:</span>
                          <span className="font-semibold">
                            {janela.quantidade}x ({janela.dimensoes})
                          </span>
                        </div>
                      ))}
                      <div className="mt-3 pt-2 border-t text-sm flex justify-between">
                        <span className="text-gray-600">Área envidraçada:</span>
                        <span className="font-semibold">{resultado.aberturas?.area_total_envidracada || 0}m²</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {resultado.observacoes_tecnicas && resultado.observacoes_tecnicas.length > 0 && (
                  <Card className="p-4 bg-amber-50 border-amber-300">
                    <h3 className="font-semibold text-amber-900 mb-2">📋 Observações Técnicas</h3>
                    <ul className="space-y-1 text-sm text-amber-800">
                      {resultado.observacoes_tecnicas.map((obs, idx) => (
                        <li key={idx}>• {obs}</li>
                      ))}
                    </ul>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="lote" className="space-y-4 mt-4">
                <Card className="p-4 border-l-4 border-orange-500">
                  <div className="flex items-center gap-3 mb-3">
                    <Maximize2 className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-gray-900">Dimensões do Lote</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frente:</span>
                      <span className="font-semibold">{resultado.dimensoes_lote?.frente || 0}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fundos:</span>
                      <span className="font-semibold">{resultado.dimensoes_lote?.fundos || 0}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lateral Esquerda:</span>
                      <span className="font-semibold">{resultado.dimensoes_lote?.lateral_esquerda || 0}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lateral Direita:</span>
                      <span className="font-semibold">{resultado.dimensoes_lote?.lateral_direita || 0}m</span>
                    </div>
                    <div className="flex justify-between col-span-2 pt-2 border-t">
                      <span className="text-gray-600">Área Total:</span>
                      <span className="font-bold text-lg">{resultado.dimensoes_lote?.area_total_terreno || 0}m²</span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-gray-600">Formato:</span>
                      <Badge variant="outline">{resultado.dimensoes_lote?.formato || '-'}</Badge>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-indigo-500">
                  <div className="flex items-center gap-3 mb-3">
                    <Ruler className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">Zoneamento e Recuos</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recuo Frontal:</span>
                      <span className="font-semibold">{resultado.zoneamento?.recuo_frontal || 0}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recuo Fundos:</span>
                      <span className="font-semibold">{resultado.zoneamento?.recuo_fundos || 0}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recuo Lateral Esq.:</span>
                      <span className="font-semibold">{resultado.zoneamento?.recuo_lateral_esquerdo || 0}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recuo Lateral Dir.:</span>
                      <span className="font-semibold">{resultado.zoneamento?.recuo_lateral_direito || 0}m</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxa Ocupação:</span>
                      <span className="font-semibold">
                        {resultado.zoneamento?.taxa_ocupacao_calculada || 0}% 
                        <span className="text-gray-500 ml-2">(máx: {resultado.zoneamento?.taxa_ocupacao_maxima || 0}%)</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxa Permeabilidade:</span>
                      <span className="font-semibold">
                        {resultado.zoneamento?.taxa_permeabilidade_calculada || 0}% 
                        <span className="text-gray-500 ml-2">(mín: {resultado.zoneamento?.taxa_permeabilidade_minima || 0}%)</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Coef. Aproveitamento:</span>
                      <span className="font-semibold">{resultado.zoneamento?.coeficiente_aproveitamento || 0}</span>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="quantitativos" className="space-y-4 mt-4">
                <Card className="p-4 border-l-4 border-cyan-500">
                  <h3 className="font-semibold text-gray-900 mb-3">📐 Paredes e Pisos</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-2">Paredes</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Internas:</span>
                          <span className="font-semibold">{resultado.paredes?.metragem_linear_internas || 0}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Externas:</span>
                          <span className="font-semibold">{resultado.paredes?.metragem_linear_externas || 0}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Altura Média:</span>
                          <span className="font-semibold">{resultado.paredes?.altura_media || 0}m</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-2">Pisos e Revestimentos</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Pisos Internos:</span>
                          <span className="font-semibold">{resultado.pisos_revestimentos?.area_pisos_internos || 0}m²</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pisos Externos:</span>
                          <span className="font-semibold">{resultado.pisos_revestimentos?.area_pisos_externos || 0}m²</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Revestimento:</span>
                          <span className="font-semibold">{resultado.pisos_revestimentos?.area_revestimento_paredes || 0}m²</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-yellow-500">
                  <h3 className="font-semibold text-gray-900 mb-3">⚡ Instalações</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-gray-600 text-xs mb-1">Pontos Elétricos</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {resultado.instalacoes?.pontos_eletricos || 0}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-gray-600 text-xs mb-1">Pontos Hidráulicos</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {resultado.instalacoes?.pontos_hidraulicos || 0}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-gray-600 text-xs mb-1">Pontos Esgoto</p>
                      <p className="text-2xl font-bold text-green-700">
                        {resultado.instalacoes?.pontos_esgoto || 0}
                      </p>
                    </div>
                  </div>
                </Card>

                {resultado.areas_pavimentos && resultado.areas_pavimentos.length > 0 && (
                  <Card className="p-4 border-l-4 border-pink-500">
                    <h3 className="font-semibold text-gray-900 mb-3">🏢 Áreas por Pavimento</h3>
                    <div className="space-y-3">
                      {resultado.areas_pavimentos.map((pav, idx) => (
                        <div key={idx} className="p-3 bg-pink-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-pink-900">{pav.pavimento}</span>
                            <Badge className="bg-pink-600">{pav.area_total}m²</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {pav.ambientes?.map((amb, ambIdx) => (
                              <div key={ambIdx} className="flex justify-between">
                                <span className="text-gray-600">{amb.nome}:</span>
                                <span className="font-semibold">{amb.area}m²</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="materiais" className="space-y-4 mt-4">
                <Card className="p-4 border-l-4 border-red-500">
                  <h3 className="font-semibold text-gray-900 mb-3">🧱 Quantitativos de Materiais</h3>
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-gray-50 rounded-lg flex justify-between">
                        <span className="text-gray-600">Concreto:</span>
                        <span className="font-bold">{resultado.quantitativos_materiais?.volume_concreto_m3 || 0}m³</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg flex justify-between">
                        <span className="text-gray-600">Tijolos/Blocos:</span>
                        <span className="font-bold">{resultado.quantitativos_materiais?.quantidade_tijolos || 0} un</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg flex justify-between">
                        <span className="text-gray-600">Tubulações:</span>
                        <span className="font-bold">{resultado.quantitativos_materiais?.metragem_tubulacoes || 0}m</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg flex justify-between">
                        <span className="text-gray-600">Área Pintura:</span>
                        <span className="font-bold">{resultado.quantitativos_materiais?.area_pintura || 0}m²</span>
                      </div>
                    </div>

                    {resultado.quantitativos_materiais?.outros && resultado.quantitativos_materiais.outros.length > 0 && (
                      <div className="mt-4">
                        <p className="font-semibold text-gray-700 mb-2">Outros Materiais</p>
                        <div className="space-y-2">
                          {resultado.quantitativos_materiais.outros.map((mat, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                              <span className="text-gray-700">{mat.material}</span>
                              <Badge variant="outline">
                                {mat.quantidade} {mat.unidade}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="json" className="mt-4">
                <div className="relative">
                  <Button
                    onClick={copiarJSON}
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 z-10"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar JSON
                  </Button>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-[500px] text-xs">
                    {JSON.stringify(resultado, null, 2)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                {resultado.nivel_confianca && (
                  <Badge className="bg-blue-600">
                    Confiança: {resultado.nivel_confianca}
                  </Badge>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
                <Button
                  onClick={aplicarDadosNaUnidade}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Salvar na Unidade
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}