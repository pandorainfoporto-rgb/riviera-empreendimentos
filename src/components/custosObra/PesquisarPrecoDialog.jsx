
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, TrendingUp, TrendingDown, Loader2, DollarSign, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function PesquisarPrecoDialog({ item, onClose, onSelectPrice }) {
  const [estado, setEstado] = useState('SP');
  const [cidade, setCidade] = useState('');
  const [pesquisando, setPesquisando] = useState(false);
  const [resultados, setResultados] = useState(null);

  const handlePesquisar = async () => {
    setPesquisando(true);
    
    try {
      const response = await base44.functions.invoke('pesquisarPrecoRegional', {
        produto_nome: item.descricao,
        unidade_medida: item.unidade_medida,
        estado: estado,
        cidade: cidade,
      });

      if (response.data.success) {
        setResultados(response.data.data);
        toast.success('Pesquisa concluída!');
      } else {
        toast.error('Erro na pesquisa');
      }
    } catch (error) {
      toast.error('Erro ao pesquisar preços');
      console.error(error);
    } finally {
      setPesquisando(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            🤖 Pesquisa Inteligente de Preços: {item.descricao}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            A IA irá buscar preços REAIS em lojas e fornecedores da região selecionada
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário de Pesquisa */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardContent className="p-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Estado *</Label>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BRASIL.map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cidade (opcional)</Label>
                  <Input
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Ex: São Paulo"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handlePesquisar}
                    disabled={pesquisando}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg"
                  >
                    {pesquisando ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Pesquisando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        🤖 Pesquisar com IA
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="mt-3 p-3 bg-white rounded-lg border border-blue-300">
                <p className="text-sm text-blue-900 flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>🤖 Inteligência Artificial:</strong> A IA irá pesquisar automaticamente na internet em lojas de materiais, 
                    fornecedores regionais e e-commerce, retornando os preços REAIS e ATUALIZADOS com base na sua região!
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          {resultados && (
            <div className="space-y-4">
              {/* Resumo */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-t-4 border-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Preço Mínimo</p>
                        <p className="text-xl font-bold text-green-700">
                          R$ {resultados.preco_minimo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <TrendingDown className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-t-4 border-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Preço Médio</p>
                        <p className="text-xl font-bold text-blue-700">
                          R$ {resultados.preco_medio?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-t-4 border-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Preço Máximo</p>
                        <p className="text-xl font-bold text-red-700">
                          R$ {resultados.preco_maximo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Observações da IA */}
              {resultados.observacoes && (
                <Card className="border-l-4 border-purple-500 bg-purple-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-purple-900">
                      <strong>🤖 Análise da IA:</strong> {resultados.observacoes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Grid de Preços */}
              <Card>
                <CardHeader className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">
                      Preços Encontrados ({resultados.precos_encontrados?.length || 0})
                    </h3>
                    <Button
                      onClick={() => onSelectPrice(resultados.preco_medio)}
                      className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Usar Preço Médio
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Fornecedor</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Especificação</th>
                          <th className="text-center p-3 text-sm font-semibold text-gray-700">Preço</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Fonte</th>
                          <th className="text-center p-3 text-sm font-semibold text-gray-700">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {resultados.precos_encontrados?.map((preco, index) => {
                          const diferenca = ((preco.preco - resultados.preco_medio) / resultados.preco_medio) * 100;
                          
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">{preco.fornecedor}</span>
                                </div>
                              </td>
                              <td className="p-3 text-sm text-gray-600">
                                {preco.especificacao || '-'}
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col items-center">
                                  <span className="font-bold text-lg text-gray-900">
                                    R$ {preco.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                  <Badge 
                                    className={`mt-1 ${
                                      diferenca < -10 ? 'bg-green-100 text-green-800' :
                                      diferenca > 10 ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {diferenca > 0 ? '+' : ''}{diferenca.toFixed(1)}%
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-3 text-sm text-gray-600">
                                {preco.fonte}
                              </td>
                              <td className="p-3 text-center">
                                <Button
                                  onClick={() => onSelectPrice(preco.preco)}
                                  size="sm"
                                  variant="outline"
                                  className="hover:bg-green-50 hover:text-green-700"
                                >
                                  Usar este preço
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {pesquisando && (
            <Card className="border-2 border-blue-300">
              <CardContent className="p-12 text-center">
                <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-700 font-semibold text-lg">🤖 IA pesquisando preços na internet...</p>
                <p className="text-sm text-gray-600 mt-2">
                  Analisando fornecedores e lojas em {cidade || estado}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="animate-pulse">🏪 Lojas físicas</div>
                  <div>•</div>
                  <div className="animate-pulse">🌐 E-commerce</div>
                  <div>•</div>
                  <div className="animate-pulse">🏭 Fornecedores</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
