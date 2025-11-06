import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, TrendingUp, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Edit, Trash2 } from "lucide-react";

export default function CentrosCusto() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: centros = [], isLoading } = useQuery({
    queryKey: ['centrosCusto'],
    queryFn: () => base44.entities.CentroCusto.list('ordem_exibicao_dre'),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CentroCusto.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centrosCusto'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CentroCusto.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centrosCusto'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CentroCusto.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centrosCusto'] });
    },
  });

  const filteredItems = centros.filter(c =>
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const centrosReceita = filteredItems.filter(c => c.eh_receita);
  const centrosDespesa = filteredItems.filter(c => !c.eh_receita);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Centros de Custo</h1>
          <p className="text-gray-600 mt-1">Gestão contábil e classificação para DRE</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Centro de Custo
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total de Centros</p>
            <p className="text-2xl font-bold">{centros.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Centros de Receita</p>
            <p className="text-2xl font-bold text-green-700">{centrosReceita.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Centros de Despesa</p>
            <p className="text-2xl font-bold text-red-700">{centrosDespesa.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar centros de custo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Receitas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <TrendingUp className="w-5 h-5" />
              Centros de Receita
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {centrosReceita.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Nenhum centro de receita</p>
            ) : (
              centrosReceita.map(centro => (
                <CentroCustoCard
                  key={centro.id}
                  centro={centro}
                  loteamentos={loteamentos}
                  unidades={unidades}
                  onEdit={() => {
                    setEditingItem(centro);
                    setShowForm(true);
                  }}
                  onDelete={() => {
                    if (confirm('Deseja excluir este centro de custo?')) {
                      deleteMutation.mutate(centro.id);
                    }
                  }}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <TrendingDown className="w-5 h-5" />
              Centros de Despesa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {centrosDespesa.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Nenhum centro de despesa</p>
            ) : (
              centrosDespesa.map(centro => (
                <CentroCustoCard
                  key={centro.id}
                  centro={centro}
                  loteamentos={loteamentos}
                  unidades={unidades}
                  onEdit={() => {
                    setEditingItem(centro);
                    setShowForm(true);
                  }}
                  onDelete={() => {
                    if (confirm('Deseja excluir este centro de custo?')) {
                      deleteMutation.mutate(centro.id);
                    }
                  }}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <CentroCustoForm
          item={editingItem}
          loteamentos={loteamentos}
          unidades={unidades}
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

function CentroCustoCard({ centro, loteamentos, unidades, onEdit, onDelete }) {
  const loteamento = loteamentos.find(l => l.id === centro.loteamento_id);
  const unidade = unidades.find(u => u.id === centro.unidade_id);

  return (
    <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-xs">
              {centro.codigo}
            </Badge>
            <Badge className={centro.eh_receita ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {centro.nivel_dre?.replace(/_/g, ' ')}
            </Badge>
            {!centro.ativo && (
              <Badge variant="secondary">Inativo</Badge>
            )}
          </div>
          <p className="font-semibold text-gray-900">{centro.nome}</p>
          {centro.descricao && (
            <p className="text-sm text-gray-600 mt-1">{centro.descricao}</p>
          )}
          <div className="flex gap-3 mt-2 text-xs text-gray-500">
            {loteamento && <span>🏘️ {loteamento.nome}</span>}
            {unidade && <span>🏠 {unidade.codigo}</span>}
            {centro.responsavel && <span>👤 {centro.responsavel}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onDelete} className="text-red-600">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CentroCustoForm({ item, loteamentos, unidades, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    codigo: "",
    nome: "",
    descricao: "",
    tipo: "operacional",
    nivel_dre: "despesa_operacional",
    eh_receita: false,
    loteamento_id: "",
    unidade_id: "",
    responsavel: "",
    email_responsavel: "",
    orcamento_mensal: 0,
    ativo: true,
    ordem_exibicao_dre: 100,
    consolidar_dre: true,
    observacoes: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Editar" : "Novo"} Centro de Custo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Código *</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ex: CC-001"
                  required
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Custos de Obra - Loteamento A"
                required
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nível na DRE *</Label>
                <Select
                  value={formData.nivel_dre}
                  onValueChange={(value) => setFormData({ ...formData, nivel_dre: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita_operacional">Receita Operacional</SelectItem>
                    <SelectItem value="custo_mercadoria_vendida">Custo Mercadoria Vendida (CMV)</SelectItem>
                    <SelectItem value="despesa_operacional">Despesa Operacional</SelectItem>
                    <SelectItem value="despesa_administrativa">Despesa Administrativa</SelectItem>
                    <SelectItem value="despesa_comercial">Despesa Comercial</SelectItem>
                    <SelectItem value="despesa_financeira">Despesa Financeira</SelectItem>
                    <SelectItem value="outras_receitas">Outras Receitas</SelectItem>
                    <SelectItem value="outras_despesas">Outras Despesas</SelectItem>
                    <SelectItem value="impostos_taxas">Impostos e Taxas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ordem de Exibição DRE</Label>
                <Input
                  type="number"
                  value={formData.ordem_exibicao_dre}
                  onChange={(e) => setFormData({ ...formData, ordem_exibicao_dre: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Loteamento (opcional)</Label>
                <Select
                  value={formData.loteamento_id}
                  onValueChange={(value) => setFormData({ ...formData, loteamento_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum</SelectItem>
                    {loteamentos.map(lot => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Unidade (opcional)</Label>
                <Select
                  value={formData.unidade_id}
                  onValueChange={(value) => setFormData({ ...formData, unidade_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhuma</SelectItem>
                    {unidades.map(uni => (
                      <SelectItem key={uni.id} value={uni.id}>
                        {uni.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Responsável</Label>
                <Input
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                />
              </div>
              <div>
                <Label>Email do Responsável</Label>
                <Input
                  type="email"
                  value={formData.email_responsavel}
                  onChange={(e) => setFormData({ ...formData, email_responsavel: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Orçamento Mensal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.orcamento_mensal}
                onChange={(e) => setFormData({ ...formData, orcamento_mensal: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="eh_receita"
                  checked={formData.eh_receita}
                  onCheckedChange={(checked) => setFormData({ ...formData, eh_receita: checked })}
                />
                <Label htmlFor="eh_receita" className="cursor-pointer">
                  É Centro de Receita
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="consolidar_dre"
                  checked={formData.consolidar_dre}
                  onCheckedChange={(checked) => setFormData({ ...formData, consolidar_dre: checked })}
                />
                <Label htmlFor="consolidar_dre" className="cursor-pointer">
                  Consolidar na DRE
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo" className="cursor-pointer">
                  Ativo
                </Label>
              </div>
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
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}