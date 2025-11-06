import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import TipoAtivosList from "../components/tipoAtivos/TipoAtivosList";
import TipoAtivoForm from "../components/tipoAtivos/TipoAtivoForm";

export default function TipoAtivos() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("todos");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['tipoAtivos'],
    queryFn: () => base44.entities.TipoAtivo.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TipoAtivo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipoAtivos'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TipoAtivo.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipoAtivos'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TipoAtivo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipoAtivos'] });
    },
  });

  const filteredItems = items.filter(item => {
    const matchesSearch = item.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = categoriaFilter === "todos" || item.categoria === categoriaFilter;
    return matchesSearch && matchesCategoria;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Tipos de Ativos</h1>
          <p className="text-gray-600 mt-1">Gerencie os tipos de ativos financeiros</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Tipo de Ativo
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar tipos de ativos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={categoriaFilter} onValueChange={setCategoriaFilter}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="renda_fixa">Renda Fixa</TabsTrigger>
            <TabsTrigger value="renda_variavel">Renda Variável</TabsTrigger>
            <TabsTrigger value="fundos">Fundos</TabsTrigger>
            <TabsTrigger value="imoveis">Imóveis</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {showForm && (
        <TipoAtivoForm
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

      <TipoAtivosList
        items={filteredItems}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}