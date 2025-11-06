import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO, differenceInDays } from "date-fns";
import { Plus, Trash2, Upload, DollarSign, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ReceberPagamentoDialog({ pagamento, onClose }) {
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [observacoes, setObservacoes] = useState('');
  const [usarMultiplasFormas, setUsarMultiplasFormas] = useState(false);
  
  // Pagamento único
  const [formaUnica, setFormaUnica] = useState('pix');
  const [caixaUnico, setCaixaUnico] = useState('');
  
  // Múltiplas formas
  const [formasPagamento, setFormasPagamento] = useState([
    { forma: 'pix', valor: pagamento?.valor || 0, caixa_id: '', observacoes: '' }
  ]);

  const queryClient = useQueryClient();

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.filter({ ativo: true }),
  });

  // Calcular juros e multa
  const calcularEncargos = () => {
    if (!pagamento?.data_vencimento) return { juros: 0, multa: 0 };

    const dataVenc = parseISO(pagamento.data_vencimento);
    const dataPag = parseISO(dataPagamento);
    const diasAtraso = differenceInDays(dataPag, dataVenc);

    if (diasAtraso <= 0) return { juros: 0, multa: 0 };

    const valorBase = pagamento.valor || 0;
    const jurosPercentual = pagamento.juros_percentual || 0.1;
    const multaPercentual = pagamento.multa_percentual || 2;

    const juros = (valorBase * (jurosPercentual / 100)) * diasAtraso;
    const multa = valorBase * (multaPercentual / 100);

    return { juros, multa };
  };

  const { juros, multa } = calcularEncargos();
  const valorTotal = (pagamento?.valor || 0) + juros + multa;

  // Validar total de múltiplas formas
  const totalFormas = formasPagamento.reduce((sum, f) => sum + (parseFloat(f.valor) || 0), 0);
  const diferencaTotal = Math.abs(totalFormas - valorTotal);

  const receberMutation = useMutation({
    mutationFn: async () => {
      const dataAtual = new Date().toISOString();
      
      if (usarMultiplasFormas) {
        // Validar que todas as formas têm caixa
        const formasSemCaixa = formasPagamento.filter(f => !f.caixa_id);
        if (formasSemCaixa.length > 0) {
          throw new Error('Selecione o caixa para todas as formas de pagamento');
        }

        // Validar que o total bate
        if (diferencaTotal > 0.01) {
          throw new Error(`Diferença no valor total: R$ ${diferencaTotal.toFixed(2)}. Ajuste os valores.`);
        }

        // Atualizar pagamento
        await base44.entities.PagamentoCliente.update(pagamento.id, {
          status: 'pago',
          data_pagamento: dataPagamento,
          valor_juros: juros,
          valor_multa: multa,
          valor_total_recebido: valorTotal,
          forma_pagamento: 'multiplas',
          formas_pagamento: formasPagamento.map(f => ({
            forma: f.forma,
            valor: parseFloat(f.valor),
            caixa_id: f.caixa_id,
            data_recebimento: dataPagamento,
            observacoes: f.observacoes || ''
          })),
          observacoes: observacoes,
        });

        // Criar movimentações para cada forma
        for (const forma of formasPagamento) {
          const caixa = caixas.find(c => c.id === forma.caixa_id);
          
          await base44.entities.MovimentacaoCaixa.create({
            caixa_id: forma.caixa_id,
            tipo: 'entrada',
            categoria: 'recebimento_cliente',
            valor: parseFloat(forma.valor),
            data_movimentacao: dataPagamento,
            descricao: `Recebimento - Cliente: ${pagamento.cliente_nome || 'N/A'} - ${forma.forma.toUpperCase()}`,
            pagamento_cliente_id: pagamento.id,
            metodo_pagamento: forma.forma,
            observacoes: forma.observacoes || observacoes,
          });

          // Atualizar saldo do caixa
          if (caixa) {
            const novoSaldo = (caixa.saldo_atual || 0) + parseFloat(forma.valor);
            await base44.entities.Caixa.update(forma.caixa_id, {
              saldo_atual: novoSaldo,
            });
          }
        }

        toast.success(`Pagamento recebido com ${formasPagamento.length} formas diferentes!`);
      } else {
        // Pagamento único (método original)
        if (!caixaUnico) {
          throw new Error('Selecione o caixa de destino');
        }

        await base44.entities.PagamentoCliente.update(pagamento.id, {
          status: 'pago',
          data_pagamento: dataPagamento,
          valor_juros: juros,
          valor_multa: multa,
          valor_total_recebido: valorTotal,
          forma_pagamento: formaUnica,
          formas_pagamento: [{
            forma: formaUnica,
            valor: valorTotal,
            caixa_id: caixaUnico,
            data_recebimento: dataPagamento,
            observacoes: observacoes || ''
          }],
          observacoes: observacoes,
        });

        const caixa = caixas.find(c => c.id === caixaUnico);

        await base44.entities.MovimentacaoCaixa.create({
          caixa_id: caixaUnico,
          tipo: 'entrada',
          categoria: 'recebimento_cliente',
          valor: valorTotal,
          data_movimentacao: dataPagamento,
          descricao: `Recebimento - Cliente: ${pagamento.cliente_nome || 'N/A'} - ${formaUnica.toUpperCase()}`,
          pagamento_cliente_id: pagamento.id,
          metodo_pagamento: formaUnica,
          observacoes: observacoes,
        });

        if (caixa) {
          const novoSaldo = (caixa.saldo_atual || 0) + valorTotal;
          await base44.entities.Caixa.update(caixaUnico, {
            saldo_atual: novoSaldo,
          });
        }

        toast.success('Pagamento recebido com sucesso!');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentosClientes'] });
      queryClient.invalidateQueries({ queryKey: ['caixas'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoesCaixa'] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao receber pagamento');
    },
  });

  const adicionarForma = () => {
    const valorRestante = valorTotal - totalFormas;
    setFormasPagamento([...formasPagamento, { 
      forma: 'pix', 
      valor: valorRestante > 0 ? valorRestante : 0, 
      caixa_id: '', 
      observacoes: '' 
    }]);
  };

  const removerForma = (index) => {
    if (formasPagamento.length === 1) {
      toast.error('Mantenha pelo menos uma forma de pagamento');
      return;
    }
    const novasFormas = formasPagamento.filter((_, i) => i !== index);
    setFormasPagamento(novasFormas);
  };

  const atualizarForma = (index, campo, valor) => {
    const novasFormas = [...formasPagamento];
    novasFormas[index][campo] = valor;
    setFormasPagamento(novasFormas);
  };

  const formasPagamentoOptions = [
    { value: 'pix', label: 'PIX' },
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'transferencia', label: 'Transferência' },
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'debit_card', label: 'Cartão de Débito' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'outros', label: 'Outros' },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[var(--wine-700)]">
            Receber Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Pagamento */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Cliente</p>
                <p className="font-semibold">{pagamento.cliente_nome || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Unidade</p>
                <p className="font-semibold">{pagamento.unidade_codigo || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Valor Original</p>
                <p className="font-semibold">R$ {(pagamento.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-gray-600">Vencimento</p>
                <p className="font-semibold">{pagamento.data_vencimento ? format(parseISO(pagamento.data_vencimento), 'dd/MM/yyyy') : 'N/A'}</p>
              </div>
            </div>
          </Card>

          {/* Encargos */}
          {(juros > 0 || multa > 0) && (
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Encargos por Atraso</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Juros</p>
                  <p className="font-semibold text-yellow-700">R$ {juros.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Multa</p>
                  <p className="font-semibold text-yellow-700">R$ {multa.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total a Receber</p>
                  <p className="font-bold text-yellow-900 text-lg">R$ {valorTotal.toFixed(2)}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Data de Pagamento */}
          <div>
            <Label>Data do Recebimento *</Label>
            <Input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          {/* Tipo de Recebimento */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Label className="text-base font-semibold">Tipo de Recebimento:</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!usarMultiplasFormas}
                  onChange={() => setUsarMultiplasFormas(false)}
                  className="w-4 h-4"
                />
                <span>Forma Única</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={usarMultiplasFormas}
                  onChange={() => setUsarMultiplasFormas(true)}
                  className="w-4 h-4"
                />
                <span>Múltiplas Formas</span>
              </label>
            </div>
          </div>

          {/* Pagamento Único */}
          {!usarMultiplasFormas && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Forma de Pagamento *</Label>
                  <Select value={formaUnica} onValueChange={setFormaUnica}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formasPagamentoOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Caixa Destino *</Label>
                  <Select value={caixaUnico} onValueChange={setCaixaUnico}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o caixa" />
                    </SelectTrigger>
                    <SelectContent>
                      {caixas.map(caixa => (
                        <SelectItem key={caixa.id} value={caixa.id}>
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4" />
                            {caixa.nome} - R$ {(caixa.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded text-center">
                <p className="text-sm text-gray-600">Valor a Receber</p>
                <p className="text-2xl font-bold text-green-700">
                  R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}

          {/* Múltiplas Formas */}
          {usarMultiplasFormas && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Formas de Pagamento</h3>
                <Button onClick={adicionarForma} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Forma
                </Button>
              </div>

              {formasPagamento.map((forma, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <Label>Forma de Pagamento</Label>
                        <Select 
                          value={forma.forma} 
                          onValueChange={(val) => atualizarForma(index, 'forma', val)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {formasPagamentoOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={forma.valor}
                          onChange={(e) => atualizarForma(index, 'valor', e.target.value)}
                          className="font-mono"
                        />
                      </div>

                      <div>
                        <Label>Caixa Destino</Label>
                        <Select 
                          value={forma.caixa_id} 
                          onValueChange={(val) => atualizarForma(index, 'caixa_id', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {caixas.map(caixa => (
                              <SelectItem key={caixa.id} value={caixa.id}>
                                <div className="flex items-center gap-2">
                                  <Wallet className="w-4 h-4" />
                                  {caixa.nome}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-3">
                        <Label>Observações (opcional)</Label>
                        <Input
                          value={forma.observacoes}
                          onChange={(e) => atualizarForma(index, 'observacoes', e.target.value)}
                          placeholder="Ex: Número do cheque, comprovante, etc"
                        />
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removerForma(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={formasPagamento.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}

              {/* Resumo Total */}
              <Card className={`p-4 ${diferencaTotal > 0.01 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Total a Receber</p>
                    <p className="text-xl font-bold text-gray-900">
                      R$ {valorTotal.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total das Formas</p>
                    <p className="text-xl font-bold text-blue-700">
                      R$ {totalFormas.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Diferença</p>
                    <p className={`text-xl font-bold ${diferencaTotal > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                      {diferencaTotal > 0.01 ? `R$ ${diferencaTotal.toFixed(2)}` : '✓ OK'}
                    </p>
                  </div>
                </div>
                {diferencaTotal > 0.01 && (
                  <p className="text-xs text-red-600 text-center mt-2">
                    ⚠️ Ajuste os valores para que o total bata exatamente
                  </p>
                )}
              </Card>
            </div>
          )}

          {/* Observações Gerais */}
          <div>
            <Label>Observações Gerais</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre o recebimento..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => receberMutation.mutate()}
            disabled={receberMutation.isPending || (usarMultiplasFormas && diferencaTotal > 0.01)}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            {receberMutation.isPending ? 'Processando...' : 'Confirmar Recebimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}