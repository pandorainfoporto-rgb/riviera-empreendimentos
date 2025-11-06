
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, Edit, Trash2, FileText, 
  CheckCircle, Package 
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function GerenciarDespesas({ custoObraId, unidadeId }) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    custo_obra_id: custoObraId,
    unidade_id: unidadeId,
    etapa: 'fundacao',
    categoria: 'material',
    fornecedor_id: '',
    produto_id: '',
    descricao: '',
    quantidade: 1,
    unidade_medida: 'unidade',
    valor_unitario: 0,
    valor_total: 0,
    data_despesa: new Date().toISOString().split('T')[0],
    status: 'orcado',
    forma_pagamento: 'pix',
  });

  const queryClient = useQueryClient();

  const { data: despesas = [] } = useQuery({
    queryKey: ['despesas_obra', custoObraId],
    queryFn: () => base44.entities.DespesaObra.filter({ custo_obra_id: custoObraId }),
    enabled: !!custoObraId,
    initialData: [],
  });

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

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DespesaObra.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas_obra'] });
      setShowForm(false);
      toast.success('Despesa registrada!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DespesaObra.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas_obra'] });
      setShowForm(false);
      toast.success('Despesa atualizada!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DespesaObra.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas_obra'] });
      toast.success('Despesa excluída!');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const dataToSave = {
      ...formData,
      valor_total: formData.quantidade * formData.valor_unitario,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const handleUploadNota = async (despesaId, file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.DespesaObra.update(despesaId, {
        arquivo_nota_url: file_url,
      });
      queryClient.invalidateQueries({ queryKey: ['despesas_obra'] });
      toast.success('Nota fiscal anexada!');
    } catch (error) {
      toast.error('Erro ao fazer upload');
    }
  };

  const statusCores = {
    orcado: 'bg-gray-100 text-gray-800',
    comprado: 'bg-blue-100 text-blue-800',
    pago: 'bg-green-100 text-green-800',
    entregue: 'bg-purple-100 text-purple-800',
    aplicado: 'bg-emerald-100 text-emerald-800',
  };

  const totalDespesas = (despesas || []).reduce((sum, d) => sum + (d.valor_total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-gray-900">Despesas Realizadas</h3>
          <p className="text-sm text-gray-600">
            Total: R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setFormData({
              custo_obra_id: custoObraId,
              unidade_id: unidadeId,
              etapa: 'fundacao',
              categoria: 'material',
              fornecedor_id: '',
              produto_id: '',
              descricao: '',
              quantidade: 1,
              unidade_medida: 'unidade',
              valor_unitario: 0,
              valor_total: 0,
              data_despesa: new Date().toISOString().split('T')[0],
              status: 'orcado',
              forma_pagamento: 'pix',
            });
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-green-600 to-emerald-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Registrar Despesa
        </Button>
      </div>

      <div className="space-y-3">
        {(despesas || []).map((despesa) => {
          const fornecedor = (fornecedores || []).find(f => f.id === despesa.fornecedor_id);
          
          return (
            <Card key={despesa.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{despesa.descricao}</h4>
                      <Badge className={statusCores[despesa.status]}>
                        {despesa.status}
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Fornecedor:</span>
                        <p className="font-medium">{fornecedor?.nome || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Quantidade:</span>
                        <p className="font-medium">{despesa.quantidade} {despesa.unidade_medida}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Valor Unit:</span>
                        <p className="font-medium">
                          R$ {despesa.valor_unitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Valor Total:</span>
                        <p className="font-bold text-green-700">
                          R$ {despesa.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {despesa.numero_nota_fiscal && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                        <FileText className="w-3 h-3" />
                        NF: {despesa.numero_nota_fiscal}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      onClick={() => {
                        setEditingItem(despesa);
                        setFormData(despesa);
                        setShowForm(true);
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm('Excluir esta despesa?')) {
                          deleteMutation.mutate(despesa.id);
                        }
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(despesas || []).length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Nenhuma despesa registrada ainda</p>
            </CardContent>
          </Card>
        )}
      </div>

      {showForm && (
        <Dialog open onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Despesa' : 'Registrar Nova Despesa'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Etapa *</Label>
                  <Select
                    value={formData.etapa}
                    onValueChange={(val) => setFormData({ ...formData, etapa: val })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fundacao">Fundação</SelectItem>
                      <SelectItem value="estrutura">Estrutura</SelectItem>
                      <SelectItem value="alvenaria">Alvenaria</SelectItem>
                      <SelectItem value="cobertura">Cobertura</SelectItem>
                      <SelectItem value="instalacoes_eletricas">Elétrica</SelectItem>
                      <SelectItem value="instalacoes_hidraulicas">Hidráulica</SelectItem>
                      <SelectItem value="revestimentos">Revestimentos</SelectItem>
                      <SelectItem value="pintura">Pintura</SelectItem>
                      <SelectItem value="acabamento">Acabamento</SelectItem>
                      <SelectItem value="mobilia">Mobília</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Categoria *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(val) => setFormData({ ...formData, categoria: val })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
                      <SelectItem value="equipamento">Equipamento</SelectItem>
                      <SelectItem value="servico">Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Fornecedor *</Label>
                  <Select
                    value={formData.fornecedor_id}
                    onValueChange={(val) => setFormData({ ...formData, fornecedor_id: val })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {(fornecedores || []).map(forn => (
                        <SelectItem key={forn.id} value={forn.id}>
                          {forn.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Descrição *</Label>
                  <Input
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Quantidade *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <Label>Unidade</Label>
                  <Select
                    value={formData.unidade_medida}
                    onValueChange={(val) => setFormData({ ...formData, unidade_medida: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m2">m²</SelectItem>
                      <SelectItem value="m3">m³</SelectItem>
                      <SelectItem value="m">metro</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="saco">saco</SelectItem>
                      <SelectItem value="unidade">unidade</SelectItem>
                      <SelectItem value="conjunto">conjunto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Valor Unitário *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_unitario}
                    onChange={(e) => setFormData({ ...formData, valor_unitario: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <Label>Valor Total</Label>
                  <div className="h-10 flex items-center px-3 bg-green-50 rounded-md font-bold text-green-700 border">
                    R$ {(formData.quantidade * formData.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div>
                  <Label>Data da Despesa *</Label>
                  <Input
                    type="date"
                    value={formData.data_despesa}
                    onChange={(e) => setFormData({ ...formData, data_despesa: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orcado">Orçado</SelectItem>
                      <SelectItem value="comprado">Comprado</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                      <SelectItem value="aplicado">Aplicado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select
                    value={formData.forma_pagamento}
                    onValueChange={(val) => setFormData({ ...formData, forma_pagamento: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="prazo">A Prazo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Número NF</Label>
                  <Input
                    value={formData.numero_nota_fiscal || ''}
                    onChange={(e) => setFormData({ ...formData, numero_nota_fiscal: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-green-600 to-emerald-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {editingItem ? 'Atualizar' : 'Salvar'} Despesa
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
