import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import ItemEstoqueForm from "../components/estoque/ItemEstoqueForm";

export default function Estoque() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const queryClient = useQueryClient();

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ['itensEstoque'],
    queryFn: () => base44.entities.ItemEstoque.list(),
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ItemEstoque.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itensEstoque'] });
      setShowForm(false);
      toast.success("Item cadastrado!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ItemEstoque.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itensEstoque'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Item atualizado!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ItemEstoque.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itensEstoque'] });
      toast.success("Item removido!");
    },
  });

  const handleSubmit = (data) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Deseja excluir este item?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const filteredItens = itens.filter((item) => {
    const matchesSearch =
      item.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === "todos" || item.tipo_item === filterTipo;
    return matchesSearch && matchesTipo;
  });

  if (showForm) {
    return (
      <div className="p-4 md:p-8">
        <ItemEstoqueForm
          item={editingItem}
          fornecedores={fornecedores}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          isProcessing={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Estoque</h1>
          <p className="text-gray-600 mt-1">Gestão de produtos e serviços</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Item
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por descrição ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterTipo === "todos" ? "default" : "outline"}
                onClick={() => setFilterTipo("todos")}
              >
                Todos
              </Button>
              <Button
                variant={filterTipo === "produto" ? "default" : "outline"}
                onClick={() => setFilterTipo("produto")}
              >
                Produtos
              </Button>
              <Button
                variant={filterTipo === "servico" ? "default" : "outline"}
                onClick={() => setFilterTipo("servico")}
              >
                Serviços
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">Carregando...</div>
      ) : filteredItens.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Nenhum item encontrado
            </h3>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredItens.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg text-gray-900">{item.descricao}</h3>
                      {item.codigo && (
                        <Badge variant="outline">{item.codigo}</Badge>
                      )}
                      <Badge className={item.tipo_item === "produto" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}>
                        {item.tipo_item === "produto" ? "Produto" : "Serviço"}
                      </Badge>
                      {!item.ativo && (
                        <Badge variant="outline" className="bg-gray-100 text-gray-600">
                          Inativo
                        </Badge>
                      )}
                      {item.controla_estoque && item.estoque_atual <= item.estoque_minimo && (
                        <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Estoque Baixo
                        </Badge>
                      )}
                    </div>

                    {item.descricao_alternativa && (
                      <p className="text-sm text-gray-600">{item.descricao_alternativa}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Tipo:</span> {item.tipo_produto}
                      </div>
                      <div>
                        <span className="font-medium">Unidade:</span> {item.unidade_padrao}
                      </div>
                      {item.preco_base > 0 && (
                        <div>
                          <span className="font-medium">Preço:</span> R$ {item.preco_base.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                      {item.controla_estoque && (
                        <div>
                          <span className="font-medium">Estoque:</span> {item.estoque_atual || 0}
                        </div>
                      )}
                    </div>

                    {item.subgrupo && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Subgrupo:</span> {item.subgrupo}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(item)}
                      variant="ghost"
                      size="icon"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(item.id)}
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}