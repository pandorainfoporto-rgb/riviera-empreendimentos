import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import LoteamentosList from "../components/loteamentos/LoteamentosList";
import LoteamentoWizard from "../components/loteamentos/LoteamentoWizard";

export default function Loteamentos() {
  const [showForm, setShowForm] = useState(false);
  const [editingLoteamento, setEditingLoteamento] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Loteamento.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loteamentos'] });
      toast.success('Loteamento criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar loteamento: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Loteamento.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loteamentos'] });
      toast.success('Loteamento atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar loteamento: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Verificar se existem unidades vinculadas
      const unidades = await base44.entities.Unidade.filter({ loteamento_id: id });
      
      if (unidades && unidades.length > 0) {
        throw new Error(`Não é possível excluir este loteamento pois existem ${unidades.length} unidade(s) vinculada(s). Exclua as unidades primeiro.`);
      }

      // Se não houver vínculos, pode excluir
      await base44.entities.Loteamento.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loteamentos'] });
      toast.success('Loteamento excluído!');
    },
    onError: (error) => {
      toast.error(error.message);
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
            setEditingLoteamento(null);
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

      <LoteamentoForm
        open={showForm}
        loteamento={editingLoteamento}
        onSave={handleSave}
        onClose={() => {
          setShowForm(false);
          setEditingLoteamento(null);
        }}
      />

      <LoteamentosList
        items={filteredItems}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingLoteamento(item);
          setShowForm(true);
        }}
        onDelete={(id) => {
          if (confirm('Tem certeza que deseja excluir este loteamento?')) {
            deleteMutation.mutate(id);
          }
        }}
      />
    </div>
  );
}