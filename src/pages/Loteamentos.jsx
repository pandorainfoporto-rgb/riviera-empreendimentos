
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast is used for notifications

import LoteamentosList from "../components/loteamentos/LoteamentosList";
import LoteamentoForm from "../components/loteamentos/LoteamentoForm";

export default function Loteamentos() {
  const [showForm, setShowForm] = useState(false);
  const [editingLoteamento, setEditingLoteamento] = useState(null); // Renamed editingItem to editingLoteamento
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      console.log('Criando loteamento:', data);
      return base44.entities.Loteamento.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loteamentos'] });
      toast.success('Loteamento criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar loteamento:', error);
      toast.error('Erro ao criar loteamento: ' + (error.message || 'Erro desconhecido'));
      throw error;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      console.log('Atualizando loteamento:', id, data);
      return base44.entities.Loteamento.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loteamentos'] });
      toast.success('Loteamento atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar loteamento:', error);
      toast.error('Erro ao atualizar loteamento: ' + (error.message || 'Erro desconhecido'));
      throw error;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Loteamento.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loteamentos'] });
      toast.success('Loteamento excluído!');
    },
    onError: (error) => {
      console.error('Erro ao excluir loteamento:', error);
      toast.error('Erro ao excluir: ' + (error.message || 'Erro desconhecido'));
    },
  });

  const filteredItems = items.filter(item =>
    item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.estado?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (data) => {
    try {
      if (editingLoteamento) {
        await updateMutation.mutateAsync({ id: editingLoteamento.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setShowForm(false);
      setEditingLoteamento(null);
    } catch (error) {
      // Erro já foi tratado nas mutations e exibido com toast.
      // Re-lançar o erro aqui pode ser útil se o formulário precisar
      // de lógica adicional para tratar falhas (ex: não fechar o formulário)
      throw error;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Loteamentos</h1>
          <p className="text-gray-600 mt-1">Gerencie os loteamentos</p>
        </div>
        <Button
          onClick={() => {
            setEditingLoteamento(null); // Changed from setEditingItem
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Loteamento
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar loteamentos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {showForm && (
        <LoteamentoForm
          item={editingLoteamento} // Changed from editingItem
          onSubmit={handleSave} // Updated to use the new handleSave function
          onCancel={() => {
            setShowForm(false);
            setEditingLoteamento(null); // Changed from setEditingItem
          }}
          isProcessing={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <LoteamentosList
        items={filteredItems}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingLoteamento(item); // Changed from setEditingItem
          setShowForm(true);
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}
