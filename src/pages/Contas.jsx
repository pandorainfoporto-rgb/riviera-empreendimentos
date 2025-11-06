import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import ContasList from "../components/contas/ContasList";
import ContaForm from "../components/contas/ContaForm";

export default function Contas() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [bancoFilter, setBancoFilter] = useState("todos");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['contas'],
    queryFn: () => base44.entities.Conta.list('-created_date'),
  });

  const { data: bancos = [] } = useQuery({
    queryKey: ['bancos'],
    queryFn: () => base44.entities.Banco.list(),
  });

  const { data: empreendimentos = [] } = useQuery({
    queryKey: ['empreendimentos'],
    queryFn: () => base44.entities.Empreendimento.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Conta.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Conta.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Conta.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas'] });
    },
  });

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.numero_conta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.titular?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBanco = bancoFilter === "todos" || item.banco_id === bancoFilter;
    
    return matchesSearch && matchesBanco;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Contas Bancárias</h1>
          <p className="text-gray-600 mt-1">Gerencie as contas dos empreendimentos</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar contas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={bancoFilter} onValueChange={setBancoFilter}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Filtrar por banco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Bancos</SelectItem>
            {bancos.map(banco => (
              <SelectItem key={banco.id} value={banco.id}>
                {banco.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showForm && (
        <ContaForm
          item={editingItem}
          bancos={bancos}
          empreendimentos={empreendimentos}
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

      <ContasList
        items={filteredItems}
        bancos={bancos}
        empreendimentos={empreendimentos}
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