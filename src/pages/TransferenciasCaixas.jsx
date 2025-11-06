import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRightLeft, Calendar, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TransferenciasCaixas() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: transferencias = [], isLoading } = useQuery({
    queryKey: ['transferenciasCaixa'],
    queryFn: () => base44.entities.TransferenciaCaixa.list('-data_transferencia'),
  });

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const transferencia = await base44.entities.TransferenciaCaixa.create(data);
      
      // Criar movimentações nos caixas
      const movOrigem = await base44.entities.MovimentacaoCaixa.create({
        caixa_id: data.caixa_origem_id,
        tipo: 'saida',
        categoria: 'transferencia',
        valor: data.valor,
        data_movimentacao: data.data_transferencia,
        descricao: `Transferência para ${caixas.find(c => c.id === data.caixa_destino_id)?.nome}`,
        observacoes: data.descricao,
      });

      const movDestino = await base44.entities.MovimentacaoCaixa.create({
        caixa_id: data.caixa_destino_id,
        tipo: 'entrada',
        categoria: 'transferencia',
        valor: data.valor,
        data_movimentacao: data.data_transferencia,
        descricao: `Transferência de ${caixas.find(c => c.id === data.caixa_origem_id)?.nome}`,
        observacoes: data.descricao,
      });

      // Atualizar saldos
      const caixaOrigem = caixas.find(c => c.id === data.caixa_origem_id);
      const caixaDestino = caixas.find(c => c.id === data.caixa_destino_id);

      await base44.entities.Caixa.update(data.caixa_origem_id, {
        saldo_atual: (caixaOrigem.saldo_atual || 0) - data.valor
      });

      await base44.entities.Caixa.update(data.caixa_destino_id, {
        saldo_atual: (caixaDestino.saldo_atual || 0) + data.valor
      });

      return transferencia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferenciasCaixa'] });
      queryClient.invalidateQueries({ queryKey: ['caixas'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes_caixa'] });
      setShowForm(false);
    },
  });

  const totalTransferido = transferencias
    .filter(t => t.status === 'concluida')
    .reduce((sum, t) => sum + (t.valor || 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Transferências entre Caixas</h1>
          <p className="text-gray-600 mt-1">Gerencie movimentações entre caixas</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Transferência
        </Button>
      </div>

      <Card className="border-l-4 border-blue-500">
        <CardContent className="p-6">
          <p className="text-sm text-gray-600 mb-1">Total Transferido no Período</p>
          <p className="text-3xl font-bold text-blue-700">
            R$ {totalTransferido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {transferencias.map(transf => {
          const caixaOrigem = caixas.find(c => c.id === transf.caixa_origem_id);
          const caixaDestino = caixas.find(c => c.id === transf.caixa_destino_id);

          return (
            <Card key={transf.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-red-100 p-3 rounded-lg">
                      <Wallet className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{caixaOrigem?.nome}</p>
                      <p className="text-sm text-gray-500">Origem</p>
                    </div>

                    <ArrowRightLeft className="w-8 h-8 text-[var(--wine-600)]" />

                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{caixaDestino?.nome}</p>
                      <p className="text-sm text-gray-500">Destino</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Wallet className="w-6 h-6 text-green-600" />
                    </div>
                  </div>

                  <div className="text-right ml-6">
                    <p className="text-2xl font-bold text-blue-700">
                      R$ {transf.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(parseISO(transf.data_transferencia), "dd/MM/yyyy")}
                    </p>
                    {transf.descricao && (
                      <p className="text-xs text-gray-600 mt-1">{transf.descricao}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showForm && (
        <TransferenciaForm
          caixas={caixas}
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          isProcessing={createMutation.isPending}
        />
      )}
    </div>
  );
}

function TransferenciaForm({ caixas, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState({
    caixa_origem_id: "",
    caixa_destino_id: "",
    valor: 0,
    data_transferencia: new Date().toISOString().split('T')[0],
    descricao: "",
    observacoes: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.caixa_origem_id === formData.caixa_destino_id) {
      alert('Caixa origem e destino devem ser diferentes');
      return;
    }
    onSubmit(formData);
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Transferência entre Caixas</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label>Caixa Origem *</Label>
              <Select
                value={formData.caixa_origem_id}
                onValueChange={(value) => setFormData({ ...formData, caixa_origem_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {caixas.filter(c => c.ativo).map(caixa => (
                    <SelectItem key={caixa.id} value={caixa.id}>
                      {caixa.nome} (R$ {(caixa.saldo_atual || 0).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Caixa Destino *</Label>
              <Select
                value={formData.caixa_destino_id}
                onValueChange={(value) => setFormData({ ...formData, caixa_destino_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {caixas.filter(c => c.ativo && c.id !== formData.caixa_origem_id).map(caixa => (
                    <SelectItem key={caixa.id} value={caixa.id}>
                      {caixa.nome} (R$ {(caixa.saldo_atual || 0).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={formData.data_transferencia}
                  onChange={(e) => setFormData({ ...formData, data_transferencia: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Motivo da transferência"
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isProcessing}>
              <Save className="w-4 h-4 mr-2" />
              Transferir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}