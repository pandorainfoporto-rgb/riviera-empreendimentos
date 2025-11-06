import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import CorretorForm from "../components/corretores/CorretorForm";
import CorretoresList from "../components/corretores/CorretoresList";

export default function Corretores() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [imobiliariaFilter, setImobiliariaFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['corretores'],
    queryFn: () => base44.entities.Corretor.list('-created_date'),
  });

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Corretor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretores'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Corretor cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar corretor: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Corretor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretores'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Corretor atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar corretor: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Corretor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretores'] });
      toast.success("Corretor excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir corretor: " + error.message);
    },
  });

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cpf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.creci?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesImobiliaria = imobiliariaFilter === "todos" || item.imobiliaria_id === imobiliariaFilter;
    const matchesStatus = statusFilter === "todos" || 
      (statusFilter === "ativo" && item.ativo) ||
      (statusFilter === "inativo" && !item.ativo);
    
    return matchesSearch && matchesImobiliaria && matchesStatus;
  });

  const corretoresAtivos = items.filter(c => c.ativo).length;
  const corretoresInativos = items.filter(c => !c.ativo).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Corretores</h1>
          <p className="text-gray-600 mt-1">Gerencie os corretores de imóveis</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Corretor
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Corretores Ativos</p>
          <p className="text-2xl font-bold text-green-600">{corretoresAtivos}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
          <p className="text-sm text-gray-600 mb-1">Corretores Inativos</p>
          <p className="text-2xl font-bold text-gray-600">{corretoresInativos}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar corretores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="ativo">Ativos</TabsTrigger>
            <TabsTrigger value="inativo">Inativos</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={imobiliariaFilter} onValueChange={setImobiliariaFilter}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Filtrar por imobiliária" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Imobiliárias</SelectItem>
            <SelectItem value="sem_imobiliaria">Sem Imobiliária</SelectItem>
            {imobiliarias.map(imob => (
              <SelectItem key={imob.id} value={imob.id}>
                {imob.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showForm && (
        <CorretorForm
          item={editingItem}
          imobiliarias={imobiliarias}
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

      <CorretoresList
        items={filteredItems}
        imobiliarias={imobiliarias}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => {
          if (confirm("Deseja realmente excluir este corretor?")) {
            deleteMutation.mutate(id);
          }
        }}
      />
    </div>
  );
}