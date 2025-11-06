import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Edit, Trash2 } from "lucide-react";

export default function TiposDespesa() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: tipos = [], isLoading } = useQuery({
    queryKey: ['tiposDespesa'],
    queryFn: () => base44.entities.TipoDespesa.list('codigo'),
  });

  const { data: centrosCusto = [] } = useQuery({
    queryKey: ['centrosCusto'],
    queryFn: () => base44.entities.CentroCusto.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TipoDespesa.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposDespesa'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TipoDespesa.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposDespesa'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TipoDespesa.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposDespesa'] });
    },
  });

  const filteredItems = tipos.filter(t =>
    t.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Tipos de Despesa</h1>
          <p className="text-gray-600 mt-1">Classificação contábil vinculada aos centros de custo</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Tipo de Despesa
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar tipos de despesa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(tipo => {
          const centroCusto = centrosCusto.find(c => c.id === tipo.centro_custo_id);
          
          return (
            <Card key={tipo.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        {tipo.codigo}
                      </Badge>
                      {!tipo.ativo && <Badge variant="secondary">Inativo</Badge>}
                    </div>
                    <h3 className="font-bold text-gray-900">{tipo.nome}</h3>
                  </div>
                </div>

                {centroCusto && (
                  <Badge className="mb-2">
                    {centroCusto.codigo} - {centroCusto.nome}
                  </Badge>
                )}

                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <p>
                    <span className="font-medium">Categoria:</span> {tipo.categoria_contabil?.replace(/_/g, ' ')}
                  </p>
                  {tipo.eh_rateavel && (
                    <p className="text-blue-600">
                      ✓ Rateável ({tipo.criterio_rateio?.replace(/_/g, ' ')})
                    </p>
                  )}
                  {tipo.gera_obrigacao_tributaria && (
                    <p className="text-orange-600">
                      ⚠️ Gera obrigação tributária
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingItem(tipo);
                      setShowForm(true);
                    }}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Deseja excluir este tipo?')) {
                        deleteMutation.mutate(tipo.id);
                      }
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showForm && (
        <TipoDespesaForm
          item={editingItem}
          centrosCusto={centrosCusto}
          onSubmit={(data) => {
            if (editingItem) {
              updateMutation.mutate({ id: editingItem.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          isProcessing={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

function TipoDespesaForm({ item, centrosCusto, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    codigo: "",
    nome: "",
    descricao: "",
    centro_custo_id: "",
    categoria_contabil: "despesa_fixa",
    eh_rateavel: false,
    criterio_rateio: "proporcional_area",
    conta_contabil: "",
    permite_parcelamento: true,
    gera_obrigacao_tributaria: false,
    ativo: true,
    observacoes: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Editar" : "Novo"} Tipo de Despesa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Código *</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ex: TD-001"
                  required
                />
              </div>
              <div>
                <Label>Centro de Custo *</Label>
                <Select
                  value={formData.centro_custo_id}
                  onValueChange={(value) => setFormData({ ...formData, centro_custo_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {centrosCusto.map(cc => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.codigo} - {cc.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Categoria Contábil *</Label>
              <Select
                value={formData.categoria_contabil}
                onValueChange={(value) => setFormData({ ...formData, categoria_contabil: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custo_direto">Custo Direto</SelectItem>
                  <SelectItem value="custo_indireto">Custo Indireto</SelectItem>
                  <SelectItem value="despesa_fixa">Despesa Fixa</SelectItem>
                  <SelectItem value="despesa_variavel">Despesa Variável</SelectItem>
                  <SelectItem value="investimento">Investimento</SelectItem>
                  <SelectItem value="imposto">Imposto</SelectItem>
                  <SelectItem value="taxa">Taxa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Conta Contábil</Label>
                <Input
                  value={formData.conta_contabil}
                  onChange={(e) => setFormData({ ...formData, conta_contabil: e.target.value })}
                  placeholder="Ex: 3.1.1.01"
                />
              </div>

              {formData.eh_rateavel && (
                <div>
                  <Label>Critério de Rateio</Label>
                  <Select
                    value={formData.criterio_rateio}
                    onValueChange={(value) => setFormData({ ...formData, criterio_rateio: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proporcional_area">Proporcional à Área</SelectItem>
                      <SelectItem value="proporcional_valor">Proporcional ao Valor</SelectItem>
                      <SelectItem value="proporcional_unidades">Proporcional às Unidades</SelectItem>
                      <SelectItem value="igualitario">Igualitário</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="eh_rateavel"
                  checked={formData.eh_rateavel}
                  onCheckedChange={(checked) => setFormData({ ...formData, eh_rateavel: checked })}
                />
                <Label htmlFor="eh_rateavel" className="cursor-pointer">
                  Rateável entre Unidades
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="permite_parcelamento"
                  checked={formData.permite_parcelamento}
                  onCheckedChange={(checked) => setFormData({ ...formData, permite_parcelamento: checked })}
                />
                <Label htmlFor="permite_parcelamento" className="cursor-pointer">
                  Permite Parcelamento
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gera_obrigacao_tributaria"
                  checked={formData.gera_obrigacao_tributaria}
                  onCheckedChange={(checked) => setFormData({ ...formData, gera_obrigacao_tributaria: checked })}
                />
                <Label htmlFor="gera_obrigacao_tributaria" className="cursor-pointer">
                  Gera Obrigação Tributária
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isProcessing}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}