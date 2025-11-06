
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Mail, Loader2, CheckCircle, 
  Package, Send, Sparkles 
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { Label } from "@/components/ui/label"; // Assuming Label is imported from somewhere

const ETAPAS_LABELS = {
  terreno_preparacao: '🚜 Preparação',
  fundacao: '🏗️ Fundação',
  estrutura: '🏛️ Estrutura',
  impermeabilizacao: '💦 Impermeabilização',
  alvenaria: '🧱 Alvenaria',
  cobertura: '🏠 Cobertura',
  instalacoes_eletricas: '⚡ Elétrica',
  instalacoes_hidraulicas: '💧 Hidráulica',
  instalacoes_gas: '🔥 Gás',
  aquecimento_solar: '☀️ Aquecimento Solar',
  energia_solar: '🔆 Energia Solar',
  ar_condicionado: '❄️ Ar Condicionado',
  revestimentos: '🎨 Revestimentos',
  pintura: '🖌️ Pintura',
  esquadrias: '🚪 Esquadrias',
  pisos: '◼️ Pisos',
  forros: '⬜ Forros',
  acabamento: '✨ Acabamento',
  louca_metais: '🚿 Louças/Metais',
  mobilia: '🛋️ Mobília',
  automacao: '🤖 Automação',
  seguranca: '🔒 Segurança',
  wifi_dados: '📡 WiFi',
  paisagismo: '🌳 Paisagismo',
  limpeza_final: '🧹 Limpeza',
};

export default function OrcamentoCompraDialog({ custoObra, unidade, onClose }) {
  const [etapasSelecionadas, setEtapasSelecionadas] = useState([]);
  const [fornecedoresSelecionados, setFornecedoresSelecionados] = useState({});
  const [prazoValidade, setPrazoValidade] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [enviando, setEnviando] = useState(false);
  const [pesquisandoFornecedores, setPesquisandoFornecedores] = useState(false);
  const [itensCarregados, setItensCarregados] = useState([]);

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
    initialData: [],
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => base44.entities.Produto.list(),
    initialData: [],
  });

  // Carregar itens do custo de obra
  useEffect(() => {
    const loadItens = async () => {
      if (custoObra?.id) {
        try {
          const itens = await base44.entities.ItemCustoObra.filter({ custo_obra_id: custoObra.id });
          setItensCarregados(itens || []);
        } catch (error) {
          console.error('Erro ao carregar itens:', error);
          setItensCarregados([]);
        }
      }
    };
    loadItens();
  }, [custoObra]);

  // Agrupar itens por etapa
  const itensPorEtapa = (itensCarregados || []).reduce((acc, item) => {
    if (!acc[item.etapa]) {
      acc[item.etapa] = [];
    }
    acc[item.etapa].push(item);
    return acc;
  }, {});

  const etapasDisponiveis = Object.keys(itensPorEtapa);

  // Mapear fornecedores para cada item
  const mapearFornecedores = () => {
    const mapa = {};
    
    (itensCarregados || []).forEach(item => {
      const produto = (produtos || []).find(p => p.id === item.produto_id);
      
      if (produto?.fornecedores_disponiveis?.length > 0) {
        mapa[item.descricao] = produto.fornecedores_disponiveis.map(f => f.fornecedor_id);
      } else if (produto?.fornecedor_padrao_id) {
        mapa[item.descricao] = [produto.fornecedor_padrao_id];
      } else {
        mapa[item.descricao] = [];
      }
    });
    
    setFornecedoresSelecionados(mapa);
  };

  useEffect(() => {
    if ((produtos || []).length > 0 && (itensCarregados || []).length > 0) {
      mapearFornecedores();
    }
  }, [itensCarregados, produtos]);

  const pesquisarFornecedoresIA = async (produtoNome) => {
    setPesquisandoFornecedores(true);
    
    try {
      const estado = prompt('🤖 Busca Inteligente de Fornecedores\n\nDigite o ESTADO (UF) para pesquisa:\n\nExemplos: SP, RJ, MG, RS, SC\n\nA IA vai buscar fornecedores REAIS na região!', 'SP');
      if (!estado) {
        setPesquisandoFornecedores(false);
        return;
      }

      toast.info(`🤖 Buscando fornecedores de "${produtoNome}" em ${estado}...`);

      const response = await base44.functions.invoke('pesquisarFornecedoresRegionaisIA', {
        produto_nome: produtoNome,
        categoria: 'materiais',
        estado: estado.toUpperCase(),
        cidade: '',
      });

      if (response.data.success) {
        const fornecedoresEncontrados = response.data.data.fornecedores_encontrados || [];
        
        if (fornecedoresEncontrados.length > 0) {
          toast.success(`✅ ${fornecedoresEncontrados.length} fornecedores encontrados!`);
          
          // Mostrar resumo detalhado
          const resumo = fornecedoresEncontrados.map((f, i) => 
            `${i + 1}. ${f.nome}\n   📍 ${f.cidade}/${f.estado}\n   📞 ${f.telefone}\n   📧 ${f.email || 'Não informado'}\n   💰 Preço médio: R$ ${f.preco_medio_produto?.toFixed(2) || 'N/A'}`
          ).join('\n\n');
          
          const importar = confirm(`🏪 Fornecedores encontrados em ${estado}:\n\n${resumo}\n\n${response.data.data.resumo_mercado}\n\n💡 Deseja importar estes fornecedores para o sistema?`);
          
          if (importar) {
            toast.info('Importando fornecedores...');
            // Aqui você poderia criar os fornecedores automaticamente
            // Por enquanto, apenas mostramos os dados
          }
        } else {
          toast.warning('Nenhum fornecedor encontrado');
        }
      }
    } catch (error) {
      toast.error('Erro ao pesquisar fornecedores');
    } finally {
      setPesquisandoFornecedores(false);
    }
  };

  const enviarOrcamentos = async () => {
    if (etapasSelecionadas.length === 0) {
      toast.error('Selecione pelo menos uma etapa');
      return;
    }

    setEnviando(true);
    
    try {
      // Filtrar itens das etapas selecionadas
      const itensSelecionados = (itensCarregados || []).filter(item => 
        etapasSelecionadas.includes(item.etapa)
      );

      // Agrupar itens por fornecedor
      const itensPorFornecedor = {};
      
      itensSelecionados.forEach(item => {
        const fornecedoresDoItem = fornecedoresSelecionados[item.descricao] || [];
        
        fornecedoresDoItem.forEach(fornId => {
          if (!itensPorFornecedor[fornId]) {
            itensPorFornecedor[fornId] = [];
          }
          itensPorFornecedor[fornId].push(item);
        });
      });

      const fornecedoresComItens = Object.keys(itensPorFornecedor);
      
      if (fornecedoresComItens.length === 0) {
        toast.error('Nenhum fornecedor vinculado aos itens selecionados');
        setEnviando(false);
        return;
      }

      // Criar orçamento de compra
      const orcamento = await base44.entities.OrcamentoCompra.create({
        custo_obra_id: custoObra.id,
        unidade_id: custoObra.unidade_id,
        etapas_selecionadas: etapasSelecionadas,
        data_orcamento: new Date().toISOString().split('T')[0],
        prazo_validade: prazoValidade,
        status: 'enviado',
      });

      // Criar itens do orçamento
      for (const item of itensSelecionados) {
        await base44.entities.ItemOrcamentoCompra.create({
          orcamento_compra_id: orcamento.id,
          item_custo_obra_id: item.id || null,
          produto_id: item.produto_id || null,
          servico_id: item.servico_id || null,
          etapa: item.etapa,
          descricao: item.descricao,
          quantidade: item.quantidade_total,
          unidade_medida: item.unidade_medida,
          fornecedores_cotados: fornecedoresSelecionados[item.descricao] || [],
        });
      }

      // Enviar emails
      let emailsEnviados = 0;
      const fornecedoresEnviados = [];

      for (const fornecedorId of fornecedoresComItens) {
        try {
          const itensDoFornecedor = itensPorFornecedor[fornecedorId];
          
          const response = await base44.functions.invoke('enviarOrcamentoCompraEmail', {
            orcamento_id: orcamento.id,
            fornecedor_id: fornecedorId,
            itens: itensDoFornecedor,
            unidade_codigo: unidade.codigo,
            prazo_validade: format(new Date(prazoValidade), 'dd/MM/yyyy'),
          });

          if (response.data.success) {
            emailsEnviados++;
            fornecedoresEnviados.push({
              fornecedor_id: fornecedorId,
              email_enviado: true,
              data_envio: new Date().toISOString(),
            });
            
            toast.success(`✅ Enviado para ${response.data.fornecedor_nome}`);
          }
        } catch (error) {
          console.error(`Erro ao enviar para fornecedor ${fornecedorId}:`, error);
        }
      }

      // Atualizar orçamento com fornecedores enviados
      await base44.entities.OrcamentoCompra.update(orcamento.id, {
        fornecedores_enviados: fornecedoresEnviados,
      });

      toast.success(`🎉 Orçamento criado e enviado para ${emailsEnviados} fornecedor(es)!`, {
        duration: 5000,
      });
      
      onClose();
    } catch (error) {
      toast.error('Erro ao enviar orçamentos');
      console.error(error);
    } finally {
      setEnviando(false);
    }
  };

  const toggleEtapa = (etapa) => {
    if (etapasSelecionadas.includes(etapa)) {
      setEtapasSelecionadas(etapasSelecionadas.filter(e => e !== etapa));
    } else {
      setEtapasSelecionadas([...etapasSelecionadas, etapa]);
    }
  };

  const toggleFornecedor = (itemDescricao, fornecedorId) => {
    const fornecedoresAtuais = fornecedoresSelecionados[itemDescricao] || [];
    
    if (fornecedoresAtuais.includes(fornecedorId)) {
      setFornecedoresSelecionados({
        ...fornecedoresSelecionados,
        [itemDescricao]: fornecedoresAtuais.filter(f => f !== fornecedorId),
      });
    } else {
      setFornecedoresSelecionados({
        ...fornecedoresSelecionados,
        [itemDescricao]: [...fornecedoresAtuais, fornecedorId],
      });
    }
  };

  const itensSelecionados = (itensCarregados || []).filter(item => 
    etapasSelecionadas.includes(item.etapa)
  );

  const totalFornecedoresUnicos = new Set(
    Object.values(fornecedoresSelecionados || {}).flat()
  ).size;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Mail className="w-6 h-6 text-[var(--wine-600)]" />
            📧 Criar Orçamento de Compra
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Selecione as etapas e fornecedores para enviar cotações automaticamente por email
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-blue-500">
              <CardContent className="p-4">
                <p className="text-xs text-gray-600">Etapas Selecionadas</p>
                <p className="text-2xl font-bold text-blue-700">{etapasSelecionadas.length}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-purple-500">
              <CardContent className="p-4">
                <p className="text-xs text-gray-600">Itens</p>
                <p className="text-2xl font-bold text-purple-700">{itensSelecionados.length}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-green-500">
              <CardContent className="p-4">
                <p className="text-xs text-gray-600">Fornecedores</p>
                <p className="text-2xl font-bold text-green-700">{totalFornecedoresUnicos}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-orange-500">
              <CardContent className="p-4">
                <Label className="text-xs text-gray-600">Prazo Resposta</Label>
                <Input
                  type="date"
                  value={prazoValidade}
                  onChange={(e) => setPrazoValidade(e.target.value)}
                  className="mt-1 h-8 text-sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* Seleção de Etapas */}
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg">1️⃣ Selecione as Etapas</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {(etapasDisponiveis || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum item encontrado no custo de obra</p>
                  <p className="text-sm mt-2">Adicione itens ao custo de obra primeiro</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(etapasDisponiveis || []).map(etapa => {
                    const totalItens = (itensPorEtapa[etapa] || []).length;
                    const isSelecionada = etapasSelecionadas.includes(etapa);
                    
                    return (
                      <div
                        key={etapa}
                        onClick={() => toggleEtapa(etapa)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelecionada 
                            ? 'border-[var(--wine-600)] bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)] shadow-md' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={isSelecionada} />
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{ETAPAS_LABELS[etapa] || etapa}</p>
                            <Badge variant="outline" className="mt-1">
                              {totalItens} {totalItens === 1 ? 'item' : 'itens'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grid Itens x Fornecedores */}
          {etapasSelecionadas.length > 0 && (
            <Card>
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg">2️⃣ Vincule Fornecedores aos Itens</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Tabs defaultValue={etapasSelecionadas[0]}>
                  <TabsList className="flex-wrap h-auto">
                    {(etapasSelecionadas || []).map(etapa => (
                      <TabsTrigger key={etapa} value={etapa}>
                        {ETAPAS_LABELS[etapa] || etapa}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {(etapasSelecionadas || []).map(etapa => (
                    <TabsContent key={etapa} value={etapa} className="mt-4 space-y-3">
                      {(itensPorEtapa[etapa] || []).map((item, idx) => {
                        const fornecedoresDoItem = fornecedoresSelecionados[item.descricao] || [];
                        
                        return (
                          <Card key={idx} className="border-l-4 border-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{item.descricao}</h4>
                                  <p className="text-sm text-gray-600">
                                    Quantidade: {item.quantidade_total} {item.unidade_medida}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => pesquisarFornecedoresIA(item.descricao)}
                                  disabled={pesquisandoFornecedores}
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
                                >
                                  <Sparkles className="w-4 h-4 mr-1" />
                                  🤖 Buscar Fornecedores
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {(fornecedores || []).filter(f => f.ativo).map(fornecedor => {
                                  const isVinculado = fornecedoresDoItem.includes(fornecedor.id);
                                  
                                  return (
                                    <div
                                      key={fornecedor.id}
                                      onClick={() => toggleFornecedor(item.descricao, fornecedor.id)}
                                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                        isVinculado 
                                          ? 'border-green-500 bg-green-50 shadow-md' 
                                          : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                    >
                                      <div className="flex items-start gap-2">
                                        <Checkbox checked={isVinculado} className="mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium truncate">
                                            {fornecedor.nome}
                                          </p>
                                          {fornecedor.telefone && (
                                            <p className="text-xs text-gray-500 truncate">
                                              📞 {fornecedor.telefone}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {fornecedoresDoItem.length === 0 && (
                                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                  ⚠️ Nenhum fornecedor vinculado - clique em "🤖 Buscar Fornecedores" para encontrar com IA
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {etapasSelecionadas.length > 0 && totalFornecedoresUnicos > 0 && (
            <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-7 h-7 text-green-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-bold text-green-900 text-lg">✅ Pronto para enviar!</p>
                    <p className="text-sm text-green-800 mt-2">
                      📧 Serão enviados <strong>{totalFornecedoresUnicos}</strong> emails com cotações personalizadas
                    </p>
                    <p className="text-sm text-green-800">
                      📦 Total de <strong>{itensSelecionados.length}</strong> itens de <strong>{etapasSelecionadas.length}</strong> etapa(s)
                    </p>
                    <p className="text-xs text-green-700 mt-2">
                      💡 Cada fornecedor receberá apenas os itens que ele fornece
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={enviarOrcamentos}
            disabled={enviando || etapasSelecionadas.length === 0 || totalFornecedoresUnicos === 0}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] shadow-lg"
          >
            {enviando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando Emails...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                📧 Enviar Orçamentos ({totalFornecedoresUnicos})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
