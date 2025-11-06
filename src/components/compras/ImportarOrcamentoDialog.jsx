import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FileInput, CheckCircle2, Loader2, Package, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function ImportarOrcamentoDialog({ fornecedores, unidades, produtos, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Selecionar Orçamento, 2: Selecionar Fornecedor, 3: Revisar Itens
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState(null);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
  const [itensParaImportar, setItensParaImportar] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: orcamentos = [] } = useQuery({
    queryKey: ['orcamentos_compra'],
    queryFn: () => base44.entities.OrcamentoCompra.list('-data_orcamento'),
    initialData: [],
  });

  const { data: itensOrcamento = [] } = useQuery({
    queryKey: ['itens_orcamento', orcamentoSelecionado?.id],
    queryFn: async () => {
      if (!orcamentoSelecionado?.id) return [];
      return await base44.entities.ItemOrcamentoCompra.filter({ 
        orcamento_compra_id: orcamentoSelecionado.id 
      });
    },
    enabled: !!orcamentoSelecionado,
    initialData: [],
  });

  const handleSelecionarOrcamento = (orcamentoId) => {
    const orc = orcamentos.find(o => o.id === orcamentoId);
    setOrcamentoSelecionado(orc);
    setStep(2);
  };

  const handleSelecionarFornecedor = (fornecedorId) => {
    setFornecedorSelecionado(fornecedorId);
    
    // Preparar itens para importação
    const itens = itensOrcamento
      .filter(item => item.fornecedores_cotados?.includes(fornecedorId))
      .map(item => ({
        ...item,
        selecionado: true,
        quantidade_importar: item.quantidade,
        valor_unitario_importar: 0,
      }));
    
    setItensParaImportar(itens);
    setStep(3);
  };

  const toggleItem = (index) => {
    const novosItens = [...itensParaImportar];
    novosItens[index].selecionado = !novosItens[index].selecionado;
    setItensParaImportar(novosItens);
  };

  const atualizarQuantidade = (index, valor) => {
    const novosItens = [...itensParaImportar];
    novosItens[index].quantidade_importar = parseFloat(valor) || 0;
    setItensParaImportar(novosItens);
  };

  const atualizarValorUnitario = (index, valor) => {
    const novosItens = [...itensParaImportar];
    novosItens[index].valor_unitario_importar = parseFloat(valor) || 0;
    setItensParaImportar(novosItens);
  };

  const finalizarImportacao = async () => {
    const itensSelecionados = itensParaImportar.filter(i => i.selecionado);
    
    if (itensSelecionados.length === 0) {
      toast.error('Selecione pelo menos um item');
      return;
    }

    const algumSemValor = itensSelecionados.some(i => i.valor_unitario_importar <= 0);
    if (algumSemValor) {
      toast.error('Todos os itens selecionados devem ter valor unitário preenchido');
      return;
    }

    setIsProcessing(true);

    try {
      const unidade = unidades.find(u => u.id === orcamentoSelecionado.unidade_id);
      const fornecedor = fornecedores.find(f => f.id === fornecedorSelecionado);

      // Calcular valores
      const valorProdutos = itensSelecionados.reduce((sum, item) => 
        sum + (item.quantidade_importar * item.valor_unitario_importar), 0
      );

      // Criar compra
      const compra = await base44.entities.CompraNotaFiscal.create({
        numero_nota: `ORÇ-${orcamentoSelecionado.id.substring(0, 8).toUpperCase()}`,
        fornecedor_id: fornecedorSelecionado,
        unidade_id: orcamentoSelecionado.unidade_id,
        data_emissao: new Date().toISOString().split('T')[0],
        data_entrada: new Date().toISOString().split('T')[0],
        valor_produtos: valorProdutos,
        valor_total: valorProdutos,
        forma_pagamento: 'prazo',
        gerar_contas_pagar: true,
        atualizar_estoque: true,
        observacoes: `Importado do orçamento ${orcamentoSelecionado.id.substring(0, 8).toUpperCase()}`,
        status: 'processada',
      });

      // Criar itens
      for (const item of itensSelecionados) {
        await base44.entities.ItemCompra.create({
          compra_id: compra.id,
          produto_id: item.produto_id,
          descricao: item.descricao,
          unidade_medida: item.unidade_medida,
          quantidade: item.quantidade_importar,
          valor_unitario: item.valor_unitario_importar,
          valor_total: item.quantidade_importar * item.valor_unitario_importar,
        });

        // Atualizar estoque
        if (item.produto_id) {
          const produto = produtos.find(p => p.id === item.produto_id);
          if (produto) {
            await base44.entities.Produto.update(item.produto_id, {
              ...produto,
              estoque_atual: (produto.estoque_atual || 0) + item.quantidade_importar,
            });
          }
        }
      }

      // Gerar conta a pagar
      await base44.entities.PagamentoFornecedor.create({
        fornecedor_id: fornecedorSelecionado,
        unidade_id: orcamentoSelecionado.unidade_id,
        tipo: 'produto',
        valor: valorProdutos,
        data_vencimento: new Date().toISOString().split('T')[0],
        forma_pagamento: 'prazo',
        status: 'pendente',
        descricao: `Compra do orçamento ${orcamentoSelecionado.id.substring(0, 8).toUpperCase()} - ${fornecedor.nome}`,
      });

      // Atualizar status do fornecedor no orçamento
      const fornecedoresEnviados = orcamentoSelecionado.fornecedores_enviados || [];
      const indexForn = fornecedoresEnviados.findIndex(f => f.fornecedor_id === fornecedorSelecionado);
      
      if (indexForn >= 0) {
        fornecedoresEnviados[indexForn] = {
          ...fornecedoresEnviados[indexForn],
          respondido: true,
          data_resposta: new Date().toISOString(),
          valor_total_cotado: valorProdutos,
        };

        await base44.entities.OrcamentoCompra.update(orcamentoSelecionado.id, {
          fornecedores_enviados: fornecedoresEnviados,
          status: 'aprovado',
        });
      }

      toast.success(`Compra importada com sucesso! ${itensSelecionados.length} itens processados.`);
      onSuccess();
    } catch (error) {
      toast.error('Erro ao importar orçamento: ' + error.message);
      setIsProcessing(false);
    }
  };

  const orcamentosDisponiveis = orcamentos.filter(o => 
    o.status === 'enviado' || o.status === 'em_analise'
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileInput className="w-6 h-6 text-purple-600" />
            Importar Orçamento de Compra - Passo {step} de 3
          </DialogTitle>
        </DialogHeader>

        {/* PASSO 1: Selecionar Orçamento */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-gray-600">Selecione o orçamento que deseja importar:</p>
            
            {orcamentosDisponiveis.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <FileInput className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Nenhum orçamento disponível para importação</p>
                  <p className="text-sm mt-2">Os orçamentos devem estar com status "Enviado" ou "Em Análise"</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {orcamentosDisponiveis.map((orc) => {
                  const unidade = unidades.find(u => u.id === orc.unidade_id);
                  const totalFornecedores = orc.fornecedores_enviados?.length || 0;
                  
                  return (
                    <Card 
                      key={orc.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-400"
                      onClick={() => handleSelecionarOrcamento(orc.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">
                              #{orc.id.substring(0, 8).toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Unidade: {unidade?.codigo || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {totalFornecedores} fornecedor(es) • {orc.etapas_selecionadas?.length || 0} etapa(s)
                            </p>
                          </div>
                          <Badge className="bg-purple-100 text-purple-800">
                            {orc.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PASSO 2: Selecionar Fornecedor */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Selecione o fornecedor que respondeu o orçamento:
            </p>
            
            <div className="grid gap-3">
              {(orcamentoSelecionado?.fornecedores_enviados || []).map((fornEnv) => {
                const fornecedor = fornecedores.find(f => f.id === fornEnv.fornecedor_id);
                
                return (
                  <Card 
                    key={fornEnv.fornecedor_id}
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-400"
                    onClick={() => handleSelecionarFornecedor(fornEnv.fornecedor_id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{fornecedor?.nome || 'N/A'}</p>
                          <p className="text-sm text-gray-600">{fornecedor?.email}</p>
                        </div>
                        {fornEnv.respondido && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Respondido
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* PASSO 3: Revisar Itens */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Revise os itens e informe os valores cotados pelo fornecedor:
            </p>

            <div className="space-y-3">
              {itensParaImportar.map((item, index) => (
                <Card key={index} className={item.selecionado ? 'border-2 border-green-500' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={item.selecionado}
                        onCheckedChange={() => toggleItem(index)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 grid md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <Label className="text-xs text-gray-500">Item</Label>
                          <p className="font-semibold text-sm">{item.descricao}</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-500">Quantidade</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.quantidade_importar}
                            onChange={(e) => atualizarQuantidade(index, e.target.value)}
                            disabled={!item.selecionado}
                            className="h-8"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-500">Valor Unit. (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.valor_unitario_importar}
                            onChange={(e) => atualizarValorUnitario(index, e.target.value)}
                            disabled={!item.selecionado}
                            className="h-8"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Label className="text-xs text-gray-500">Total</Label>
                        <p className="font-bold text-green-700">
                          R$ {(item.quantidade_importar * item.valor_unitario_importar).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <p className="font-bold text-green-900">VALOR TOTAL DA COMPRA</p>
                  </div>
                  <p className="text-3xl font-bold text-green-700">
                    R$ {itensParaImportar
                      .filter(i => i.selecionado)
                      .reduce((sum, i) => sum + (i.quantidade_importar * i.valor_unitario_importar), 0)
                      .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setStep(step - 1)}
              disabled={isProcessing}
            >
              Voltar
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          {step === 3 && (
            <Button 
              onClick={finalizarImportacao}
              disabled={isProcessing}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Importar Compra
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}