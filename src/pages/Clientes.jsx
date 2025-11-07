
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ClientesList from "../components/clientes/ClientesList";
import ClienteForm from "../components/clientes/ClienteForm";
import DialogCriarNegociacao from "../components/clientes/DialogCriarNegociacao";

export default function Clientes() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteCriado, setClienteCriado] = useState(null);
  const [showDialogNegociacao, setShowDialogNegociacao] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list('-created_date'),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const novoCliente = await base44.entities.Cliente.create(data);
      return novoCliente;
    },
    onSuccess: (novoCliente) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowForm(false);
      setEditingItem(null);
      
      // Aguardar um pouco antes de abrir o diálogo
      setTimeout(() => {
        setClienteCriado(novoCliente);
        setShowDialogNegociacao(true);
      }, 100);
    },
    onError: (error) => {
      console.error('Erro ao criar cliente:', error);
      alert(`Erro ao criar cliente: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.Cliente.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowForm(false);
      setEditingItem(null);
    },
    onError: (error) => {
      console.error('Erro ao atualizar cliente:', error);
      alert(`Erro ao atualizar cliente: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cliente.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });

  const handleCriarNegociacao = () => {
    navigate(`${createPageUrl('Negociacoes')}?cliente_id=${clienteCriado.id}&unidade_id=${clienteCriado.unidade_id || ''}&novo=true`);
  };

  const filteredItems = items.filter(item => {
    const unidade = unidades.find(u => u.id === item.unidade_id);
    
    return (
      item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cpf_cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade?.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Clientes</h1>
          <p className="text-gray-600 mt-1">Gerencie os clientes das unidades</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <ClienteForm
        open={showForm}
        cliente={editingItem}
        unidades={unidades}
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        onSave={(data) => {
          if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isProcessing={createMutation.isPending || updateMutation.isPending}
      />

      <ClientesList
        items={filteredItems}
        unidades={unidades}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      {showDialogNegociacao && clienteCriado && (
        <DialogCriarNegociacao
          cliente={clienteCriado}
          unidades={unidades}
          onConfirm={handleCriarNegociacao}
          onCancel={() => {
            setShowDialogNegociacao(false);
            setClienteCriado(null);
          }}
        />
      )}
    </div>
  );
}
