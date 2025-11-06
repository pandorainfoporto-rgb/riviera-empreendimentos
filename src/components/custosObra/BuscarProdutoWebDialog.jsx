import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Package, DollarSign, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function BuscarProdutoWebDialog({ onClose, onProdutoCadastrado }) {
  const [termoBusca, setTermoBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [cadastrando, setCadastrando] = useState(false);

  const buscarProdutos = async () => {
    if (!termoBusca.trim()) {
      toast.error('Digite o nome do produto');
      return;
    }

    setBuscando(true);
    
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em materiais de construção no Brasil.

TAREFA: Pesquise na internet produtos relacionados a "${termoBusca}" disponíveis no mercado brasileiro.

Busque em:
- Mercado Livre
- Leroy Merlin
- C&C Casa e Construção
- Telhanorte
- Lojas de materiais

Para cada produto encontrado, retorne:
1. Nome completo do produto
2. Marca/fabricante
3. Especificações técnicas resumidas
4. Preço médio atual no mercado (2024/2025)
5. Preço mínimo encontrado
6. Preço máximo encontrado
7. Unidade de medida (m2, m3, kg, saco, unidade, etc)
8. 3 URLs de imagens reais do produto (de diferentes ângulos/contextos)
9. Categoria (material, servico, equipamento)
10. Link de exemplo onde o produto pode ser comprado

Retorne os TOP 8 produtos mais relevantes e populares.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            produtos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  marca: { type: "string" },
                  especificacoes: { type: "string" },
                  preco_medio: { type: "number" },
                  preco_minimo: { type: "number" },
                  preco_maximo: { type: "number" },
                  unidade_medida: { type: "string" },
                  imagens_urls: {
                    type: "array",
                    items: { type: "string" },
                    maxItems: 3
                  },
                  categoria: {
                    type: "string",
                    enum: ["material", "servico", "equipamento"]
                  },
                  link_compra: { type: "string" },
                  descricao_uso: { type: "string" }
                }
              }
            },
            termo_pesquisado: { type: "string" },
            total_resultados: { type: "number" }
          }
        }
      });

      setResultados(response.produtos || []);
      toast.success(`${response.produtos?.length || 0} produtos encontrados!`);
    } catch (error) {
      toast.error('Erro ao buscar produtos');
      console.error(error);
    } finally {
      setBuscando(false);
    }
  };

  const cadastrarProduto = async (produto) => {
    setCadastrando(true);
    
    try {
      // Criar MaterialPadrao com as informações
      const novoProduto = await base44.entities.MaterialPadrao.create({
        nome: produto.nome,
        etapa: 'acabamento', // Default, usuário pode editar depois
        categoria: produto.categoria || 'material',
        unidade_medida: produto.unidade_medida || 'unidade',
        quantidade_por_m2_medio_baixo: 0,
        quantidade_por_m2_medio: 0.01,
        quantidade_por_m2_alto: 0.01,
        quantidade_por_m2_luxo: 0.01,
        descricao_medio_baixo: `${produto.nome} - ${produto.marca || 'Linha Econômica'}`,
        descricao_medio: `${produto.nome} - ${produto.marca || 'Padrão'}`,
        descricao_alto: `${produto.nome} Premium - ${produto.marca || 'Alto Padrão'}`,
        descricao_luxo: `${produto.nome} Luxo - ${produto.marca || 'Importado'}`,
        valor_referencia_unitario: produto.preco_medio || 0,
        imagens: (produto.imagens_urls || []).slice(0, 3).map((url, idx) => ({
          url: url,
          descricao: `${produto.nome} - Imagem ${idx + 1}`,
          padrao: idx === 0 ? 'medio' : idx === 1 ? 'alto' : 'luxo'
        })),
        especificacoes_tecnicas: {
          marca_sugerida: produto.marca || '',
          detalhes_tecnicos: produto.especificacoes || '',
        },
        tendencia_mercado: 'em_alta',
        ativo: true,
        observacoes: `Cadastrado via busca web. ${produto.descricao_uso || ''}`,
        ultimas_pesquisas_preco: [{
          data_pesquisa: new Date().toISOString(),
          estado: 'BR',
          preco_medio: produto.preco_medio,
          preco_minimo: produto.preco_minimo,
          preco_maximo: produto.preco_maximo,
        }]
      });

      toast.success(`✅ Produto "${produto.nome}" cadastrado com sucesso!`);
      onProdutoCadastrado(novoProduto);
    } catch (error) {
      toast.error('Erro ao cadastrar produto');
      console.error(error);
    } finally {
      setCadastrando(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" />
            🌐 Buscar Produto na Internet
          </DialogTitle>
          <p className="text-sm text-gray-600">
            🤖 A IA vai pesquisar produtos reais em Mercado Livre, Leroy Merlin e lojas especializadas
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campo de Busca */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Nome do Produto</Label>
              <Input
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Ex: Porcelanato 60x60, Torneira monocomando, Cooktop..."
                onKeyPress={(e) => e.key === 'Enter' && buscarProdutos()}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={buscarProdutos}
                disabled={buscando}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg"
              >
                {buscando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    🤖 Buscar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Loading */}
          {buscando && (
            <Card className="border-2 border-blue-300">
              <CardContent className="p-8 text-center">
                <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-700 font-semibold">🤖 IA pesquisando produtos na internet...</p>
                <div className="mt-3 flex items-center justify-center gap-3 text-sm text-gray-500">
                  <div className="animate-pulse">🛒 Mercado Livre</div>
                  <div>•</div>
                  <div className="animate-pulse">🏪 Leroy Merlin</div>
                  <div>•</div>
                  <div className="animate-pulse">🏗️ C&C</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultados */}
          {resultados.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900">
                {resultados.length} Produtos Encontrados
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                {resultados.map((produto, index) => (
                  <Card key={index} className="hover:shadow-xl transition-shadow border-2 hover:border-blue-400">
                    <CardContent className="p-4">
                      {/* Galeria de Imagens */}
                      {produto.imagens_urls && produto.imagens_urls.length > 0 && (
                        <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
                          {produto.imagens_urls.slice(0, 3).map((url, imgIdx) => (
                            <img
                              key={imgIdx}
                              src={url}
                              alt={`${produto.nome} ${imgIdx + 1}`}
                              className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all cursor-pointer flex-shrink-0"
                              onClick={() => window.open(url, '_blank')}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{produto.nome}</h4>
                            {produto.marca && (
                              <Badge variant="outline" className="mt-1">
                                {produto.marca}
                              </Badge>
                            )}
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">
                            {produto.categoria}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600">
                          {produto.especificacoes}
                        </p>

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                          <div>
                            <p className="text-xs text-gray-500">Preço Médio</p>
                            <p className="font-bold text-green-700 text-lg">
                              R$ {produto.preco_medio?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Unidade</p>
                            <p className="font-semibold text-gray-900">
                              {produto.unidade_medida}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                          <span>R$ {produto.preco_minimo?.toFixed(2)} - R$ {produto.preco_maximo?.toFixed(2)}</span>
                          {produto.link_compra && (
                            <a 
                              href={produto.link_compra} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Ver loja →
                            </a>
                          )}
                        </div>

                        <Button
                          onClick={() => cadastrarProduto(produto)}
                          disabled={cadastrando}
                          className="w-full mt-3 bg-gradient-to-r from-green-600 to-emerald-600"
                        >
                          {cadastrando ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Cadastrando...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              ✅ Cadastrar e Usar
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}