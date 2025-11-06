import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, AlertTriangle, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { X, Save } from "lucide-react";

const categorias = [
  { value: "cimento_areia", label: "Cimento/Areia" },
  { value: "tijolos_blocos", label: "Tijolos/Blocos" },
  { value: "ferragens", label: "Ferragens" },
  { value: "madeiras", label: "Madeiras" },
  { value: "tintas", label: "Tintas" },
  { value: "hidraulica", label: "Hidráulica" },
  { value: "eletrica", label: "Elétrica" },
  { value: "acabamento", label: "Acabamento" },
  { value: "outros", label: "Outros" },
];

const unidades = [
  { value: "kg", label: "Kg" },
  { value: "saco", label: "Saco" },
  { value: "m", label: "Metro" },
  { value: "m2", label: "m²" },
  { value: "m3", label: "m³" },
  { value: "litro", label: "Litro" },
  { value: "unidade", label: "Unidade" },
  { value: "caixa", label: "Caixa" },
  { value: "barra", label: "Barra" },
  { value: "rolo", label: "Rolo" },
];

export default function Produtos() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("todos");
  const [etapaFilter, setEtapaFilter] = useState("todas");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['materiaisPadrao'],
    queryFn: () => base44.entities.MaterialPadrao.filter({ categoria: 'material' }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MaterialPadrao.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiaisPadrao'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaterialPadrao.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiaisPadrao'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MaterialPadrao.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiaisPadrao'] });
    },
  });

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descricao_medio?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategoria = categoriaFilter === "todos" || 
      (categoriaFilter === "cimento_areia" && item.etapa === "fundacao") ||
      (categoriaFilter === "tijolos_blocos" && item.etapa === "alvenaria") ||
      (categoriaFilter === "ferragens" && item.etapa === "estrutura") ||
      (categoriaFilter === "hidraulica" && item.etapa === "instalacoes_hidraulicas") ||
      (categoriaFilter === "eletrica" && item.etapa === "instalacoes_eletricas") ||
      (categoriaFilter === "tintas" && item.etapa === "pintura") ||
      (categoriaFilter === "acabamento" && (item.etapa === "acabamento" || item.etapa === "revestimentos" || item.etapa === "pisos"));
    
    const matchesEtapa = etapaFilter === "todas" || item.etapa === etapaFilter;
    
    return matchesSearch && matchesCategoria && matchesEtapa;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Produtos Padrão</h1>
          <p className="text-gray-600 mt-1">Base de produtos para orçamentos de obra</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-blue-900">Base de Produtos para Orçamentos</p>
              <p className="text-sm text-blue-700 mt-1">
                Estes produtos são usados como referência nos custos de obra. 
                Os fornecedores serão vinculados automaticamente conforme as compras forem sendo executadas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={categoriaFilter} onValueChange={setCategoriaFilter}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="cimento_areia">Cimento/Areia</TabsTrigger>
            <TabsTrigger value="tijolos_blocos">Tijolos</TabsTrigger>
            <TabsTrigger value="ferragens">Ferragens</TabsTrigger>
            <TabsTrigger value="tintas">Tintas</TabsTrigger>
            <TabsTrigger value="hidraulica">Hidráulica</TabsTrigger>
            <TabsTrigger value="eletrica">Elétrica</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Lista de Produtos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{item.nome}</h3>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {item.etapa?.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  R$ {(item.valor_referencia_unitario || 0).toFixed(2)}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                {item.descricao_medio || item.nome}
              </p>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Unidade: {item.unidade_medida}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingItem(item);
                      setShowForm(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Deseja excluir este produto?')) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    className="text-red-600"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm && (
        <ProdutoForm
          item={editingItem}
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

function ProdutoForm({ item, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    nome: "",
    etapa: "acabamento",
    categoria: "material",
    unidade_medida: "unidade",
    valor_referencia_unitario: 0,
    quantidade_por_m2_medio_baixo: 0,
    quantidade_por_m2_medio: 0,
    quantidade_por_m2_alto: 0,
    quantidade_por_m2_luxo: 0,
    descricao_medio_baixo: "",
    descricao_medio: "",
    descricao_alto: "",
    descricao_luxo: "",
    ativo: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Produto *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Unidade de Medida *</Label>
                <Select
                  value={formData.unidade_medida}
                  onValueChange={(value) => setFormData({ ...formData, unidade_medida: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map(un => (
                      <SelectItem key={un.value} value={un.value}>
                        {un.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Valor Referência (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor_referencia_unitario}
                onChange={(e) => setFormData({ ...formData, valor_referencia_unitario: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <Label>Descrição Padrão Médio</Label>
              <Textarea
                value={formData.descricao_medio}
                onChange={(e) => setFormData({ ...formData, descricao_medio: e.target.value })}
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