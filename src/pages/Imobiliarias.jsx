
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import ImobiliariaForm from "../components/imobiliarias/ImobiliariaForm";
import ImobiliariasList from "../components/imobiliarias/ImobiliariasList";

export default function Imobiliarias() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list('-created_date'),
  });

  const { data: corretores = [] } = useQuery({
    queryKey: ['corretores'],
    queryFn: () => base44.entities.Corretor.list(),
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => base44.entities.User.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const imobiliaria = await base44.entities.Imobiliaria.create(data);
      
      // Se houver user_id, atualizar o usuário para vincular a imobiliária
      if (data.user_id) {
        await base44.entities.User.update(data.user_id, {
          imobiliaria_id: imobiliaria.id,
          tipo_acesso: 'imobiliaria'
        });
      }
      
      return imobiliaria;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imobiliarias'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Imobiliária cadastrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar imobiliária: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const oldImobiliaria = items.find(i => i.id === id);
      
      // Se mudou o user_id, atualizar o usuário antigo e o novo
      if (oldImobiliaria?.user_id && oldImobiliaria.user_id !== data.user_id) {
        await base44.entities.User.update(oldImobiliaria.user_id, {
          imobiliaria_id: null,
          tipo_acesso: 'usuario'
        });
      }
      
      if (data.user_id) {
        await base44.entities.User.update(data.user_id, {
          imobiliaria_id: id,
          tipo_acesso: 'imobiliaria'
        });
      }
      
      return await base44.entities.Imobiliaria.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imobiliarias'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Imobiliária atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar imobiliária: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Imobiliaria.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imobiliarias'] });
      toast.success("Imobiliária excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir imobiliária: " + error.message);
    },
  });

  const filteredItems = items.filter(item => 
    item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.creci?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Imobiliárias</h1>
          <p className="text-gray-600 mt-1">Gerencie as imobiliárias parceiras</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Imobiliária
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar imobiliárias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {showForm && (
        <ImobiliariaForm
          item={editingItem}
          corretores={corretores}
          usuarios={usuarios}
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

      <ImobiliariasList
        items={filteredItems}
        corretores={corretores}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => {
          if (confirm("Deseja realmente excluir esta imobiliária?")) {
            deleteMutation.mutate(id);
          }
        }}
      />
    </div>
  );
}
