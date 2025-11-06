
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const ETAPAS_NOMES = {
  terreno_preparacao: 'Preparação do Terreno',
  fundacao: 'Fundação',
  estrutura: 'Estrutura',
  impermeabilizacao: 'Impermeabilização',
  alvenaria: 'Alvenaria',
  cobertura: 'Cobertura',
  instalacoes_eletricas: 'Instalações Elétricas',
  instalacoes_hidraulicas: 'Instalações Hidráulicas',
  instalacoes_gas: 'Instalações de Gás',
  aquecimento_solar: 'Aquecimento Solar',
  energia_solar: 'Energia Solar',
  ar_condicionado: 'Ar Condicionado',
  revestimentos: 'Revestimentos',
  pintura: 'Pintura',
  esquadrias: 'Esquadrias',
  pisos: 'Pisos',
  forros: 'Forros',
  acabamento: 'Acabamento',
  louca_metais: 'Louças e Metais',
  mobilia: 'Mobília',
  automacao: 'Automação',
  seguranca: 'Segurança',
  wifi_dados: 'WiFi e Rede',
  paisagismo: 'Paisagismo',
  limpeza_final: 'Limpeza Final',
};

export default function SugestoesIADialog({ 
  padrao, 
  etapa, 
  estado, 
  area, 
  detalhamento_projeto,
  open, 
  onClose, 
  onAplicarSugestoes 
}) {
  const [carregando, setCarregando] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [itensSelecionados, setItensSelecionados] = useState([]);
  const [erro, setErro] = useState(null);

  const buscarSugestoes = async () => {
    setCarregando(true);
    setErro(null);
    setSugestoes([]);

    try {
      console.log('🔍 Iniciando busca de sugestões...', {
        etapa,
        padrao,
        estado,
        area,
        detalhamento_projeto
      });

      toast.info('🤖 IA analisando projeto e buscando materiais reais...', { duration: 3000 });

      const response = await base44.functions.invoke('sugerirMateriaisIA', {
        etapa,
        padrao,
        estado,
        area,
        detalhamento_projeto: detalhamento_projeto || {}
      });

      console.log('📦 Resposta completa da função:', response);
      console.log('📊 response.data:', response.data);

      // Verificar diferentes formatos de resposta
      let materiaisSugeridos = [];
      let mensagemErro = null;

      if (response?.data?.success === true && response?.data?.data?.materiais) {
        materiaisSugeridos = response.data.data.materiais;
      } else if (response?.data?.materiais) {
        materiaisSugeridos = response.data.materiais;
      } else if (response?.data?.success === false) {
        mensagemErro = response.data.message || response.data.error || 'Erro desconhecido';
      }

      console.log('📋 Materiais sugeridos:', materiaisSugeridos);

      if (mensagemErro) {
        setErro(mensagemErro);
        toast.warning(mensagemErro);
      } else if (!materiaisSugeridos || materiaisSugeridos.length === 0) {
        const msgPadrao = `Nenhum material encontrado para "${ETAPAS_NOMES[etapa]}". A IA pode não ter dados suficientes para esta etapa específica. Tente adicionar itens manualmente.`;
        setErro(msgPadrao);
        toast.warning(msgPadrao);
      } else {
        setSugestoes(materiaisSugeridos);
        setItensSelecionados(materiaisSugeridos.map((_, i) => i));
        toast.success(`✅ ${materiaisSugeridos.length} materiais encontrados!`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar sugestões:', error);
      const msgErro = `Erro: ${error.message || 'Falha ao conectar com a IA'}`;
      setErro(msgErro);
      toast.error(msgErro);
    } finally {
      setCarregando(false);
    }
  };

  React.useEffect(() => {
    if (open && sugestoes.length === 0 && !carregando && !erro) {
      console.log('🚀 Dialog aberto - iniciando busca automática');
      buscarSugestoes();
    }
  }, [open, carregando, erro, sugestoes.length]); // Added dependencies to useEffect

  const toggleItem = (index) => {
    if (itensSelecionados.includes(index)) {
      setItensSelecionados(itensSelecionados.filter(i => i !== index));
    } else {
      setItensSelecionados([...itensSelecionados, index]);
    }
  };

  const aplicarSelecionados = () => {
    const itensFiltrados = sugestoes.filter((_, index) => itensSelecionados.includes(index));
    if (itensFiltrados.length === 0) {
      toast.warning('Selecione pelo menos 1 item');
      return;
    }
    onAplicarSugestoes(itensFiltrados);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Sugestões Inteligentes da IA
          </DialogTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className="bg-purple-100 text-purple-800">
              Etapa: {ETAPAS_NOMES[etapa] || etapa}
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              Padrão: {padrao}
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              {area}m² • {estado}
            </Badge>
          </div>
        </DialogHeader>

        <div className="mt-6">
          {carregando && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-700 font-medium">🤖 IA analisando projeto...</p>
              <p className="text-sm text-gray-500 mt-2">
                Buscando materiais para {ETAPAS_NOMES[etapa]}
              </p>
              <div className="mt-4 text-xs text-gray-400">
                Consultando lojas e fornecedores em {estado}...
              </div>
            </div>
          )}

          {erro && (
            <div className="p-6 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 mb-2">⚠️ Nenhum resultado encontrado</p>
                  <p className="text-sm text-red-700 mb-4">{erro}</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={buscarSugestoes}
                      className="bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      🔄 Tentar Novamente
                    </Button>
                    <Button
                      onClick={onClose}
                      variant="outline"
                      size="sm"
                    >
                      Fechar
                    </Button>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    💡 <strong>Dica:</strong> Algumas etapas podem não ter sugestões automáticas. 
                    Use o botão "Adicionar Item Manual" ou "🌐 Buscar na Web" para encontrar produtos específicos.
                  </div>
                </div>
              </div>
            </div>
          )}

          {!carregando && !erro && sugestoes.length > 0 && (
            <>
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-purple-900">
                      ✅ {sugestoes.length} materiais encontrados
                    </p>
                    <p className="text-sm text-purple-700 mt-1">
                      {itensSelecionados.length} selecionados
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setItensSelecionados(sugestoes.map((_, i) => i))}
                    >
                      Selecionar Todos
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setItensSelecionados([])}
                    >
                      Desmarcar Todos
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {sugestoes.map((material, index) => (
                  <div
                    key={index}
                    className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                      itensSelecionados.includes(index)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => toggleItem(index)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={itensSelecionados.includes(index)}
                        onCheckedChange={() => toggleItem(index)}
                        className="mt-1"
                      />

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{material.nome}</h4>
                            <p className="text-sm text-gray-600 mt-1">{material.especificacao}</p>
                          </div>
                          <Badge className="bg-green-600 text-white whitespace-nowrap">
                            R$ {(material.valor_unitario_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-3 gap-3 text-sm mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Categoria:</span>
                            <Badge variant="outline" className="capitalize">
                              {material.categoria?.replace('_', ' ')}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Quantidade:</span>
                            <span className="font-semibold text-gray-900">
                              {material.quantidade_total?.toLocaleString('pt-BR')} {material.unidade_medida}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-bold text-green-700">
                              R$ {((material.quantidade_total || 0) * (material.valor_unitario_atual || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {material.marca_sugerida && (
                          <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                            <span className="font-semibold text-blue-900">Marca: </span>
                            <span className="text-blue-700">{material.marca_sugerida}</span>
                            {material.fornecedor_sugerido && (
                              <span className="ml-3">
                                <span className="font-semibold text-blue-900">Fornecedor: </span>
                                <span className="text-blue-700">{material.fornecedor_sugerido}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {material.rendimento && (
                          <div className="mt-2 text-xs text-gray-600">
                            📊 Rendimento: {material.rendimento}
                          </div>
                        )}

                        {material.justificativa && (
                          <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-800">
                            💡 {material.justificativa}
                          </div>
                        )}

                        {material.norma_tecnica && (
                          <div className="mt-2 text-xs text-gray-500">
                            📋 {material.norma_tecnica}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {itensSelecionados.length}
                  </span> itens selecionados • Valor total: 
                  <span className="font-bold text-green-700 ml-2">
                    R$ {sugestoes
                      .filter((_, i) => itensSelecionados.includes(i))
                      .reduce((sum, mat) => sum + ((mat.quantidade_total || 0) * (mat.valor_unitario_atual || 0)), 0)
                      .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={aplicarSelecionados}
                    disabled={itensSelecionados.length === 0}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar {itensSelecionados.length} Itens
                  </Button>
                </div>
              </div>
            </>
          )}

          {!carregando && !erro && sugestoes.length === 0 && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
              <p className="text-gray-600">Iniciando busca de sugestões...</p>
              <p className="text-xs text-gray-500 mt-2">A IA está analisando o projeto</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
