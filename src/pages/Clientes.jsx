import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ClientesList from "../components/clientes/ClientesList";
import ClienteForm from "../components/clientes/ClienteForm";
import DialogCriarNegociacao from "../components/clientes/DialogCriarNegociacao";

export default function Clientes() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCriarNegociacao, setShowCriarNegociacao] = useState(false);
  const [clienteParaNegociacao, setClienteParaNegociacao] = useState(null);
  
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
    mutationFn: (data) => base44.entities.Cliente.create(data),
    onSuccess: (novoCliente) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Cliente cadastrado com sucesso!");
      
      // Perguntar se deseja criar negociação
      setClienteParaNegociacao(novoCliente);
      setShowCriarNegociacao(true);
    },
    onError: (error) => {
      toast.error("Erro ao criar cliente: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cliente.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Cliente atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Verificar se existem negociações vinculadas
      const negociacoes = await base44.entities.Negociacao.filter({ cliente_id: id });
      
      if (negociacoes && negociacoes.length > 0) {
        throw new Error(`Não é possível excluir este cliente pois existem ${negociacoes.length} negociação(ões) vinculada(s). Exclua as negociações primeiro.`);
      }

      // Verificar se existem pagamentos vinculados
      const pagamentos = await base44.entities.PagamentoCliente.filter({ cliente_id: id });
      
      if (pagamentos && pagamentos.length > 0) {
        throw new Error(`Não é possível excluir este cliente pois existem ${pagamentos.length} pagamento(s) vinculado(s). Exclua os pagamentos primeiro.`);
      }

      // Verificar se existem mensagens vinculadas
      const mensagens = await base44.entities.Mensagem.filter({ cliente_id: id });
      
      if (mensagens && mensagens.length > 0) {
        throw new Error(`Não é possível excluir este cliente pois existem ${mensagens.length} mensagem(ns) vinculada(s).`);
      }

      // Se não houver vínculos, pode excluir
      await base44.entities.Cliente.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success("Cliente removido!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredItems = items.filter(item => {
    if (searchTerm === "") return true;
    
    const unidade = unidades.find(u => u.id === item.unidade_id);
    
    return (
      item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cpf_cnpj?.includes(searchTerm) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade?.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCriarNegociacao = (unidadeId) => {
    navigate(createPageUrl('Negociacoes') + `?cliente_id=${clienteParaNegociacao.id}&unidade_id=${unidadeId}&novo=true`);
    setShowCriarNegociacao(false);
    setClienteParaNegociacao(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Clientes</h1>
          <p className="text-gray-600 mt-1">Gerencie os clientes e proprietários</p>
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
          placeholder="Buscar por nome, CPF/CNPJ, email ou unidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {showForm && (
        <ClienteForm
          item={editingItem}
          unidades={unidades || []}
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

      <ClientesList
        items={filteredItems}
        unidades={unidades || []}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => {
          if (confirm('Tem certeza que deseja remover este cliente?')) {
            deleteMutation.mutate(id);
          }
        }}
      />

      <DialogCriarNegociacao
        open={showCriarNegociacao}
        cliente={clienteParaNegociacao}
        unidades={unidades}
        onClose={() => {
          setShowCriarNegociacao(false);
          setClienteParaNegociacao(null);
        }}
        onCriarNegociacao={handleCriarNegociacao}
      />
    </div>
  );
}