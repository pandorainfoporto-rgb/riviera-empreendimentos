import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import AdministradoraForm from "../components/administradoras/AdministradoraForm";
import AdministradorasList from "../components/administradoras/AdministradorasList";

export default function Administradoras() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['administradoras'],
    queryFn: () => base44.entities.AdministradoraConsorcio.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Primeiro criar o fornecedor
      const fornecedor = await base44.entities.Fornecedor.create({
        nome: data.nome,
        cnpj: data.cnpj,
        razao_social: data.razao_social,
        inscricao_estadual: data.inscricao_estadual,
        telefone: data.telefone,
        email: data.email,
        site: data.site,
        endereco: data.endereco,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        tipo_servico: "Administradora de Consórcio",
        vendedor_nome: data.responsavel_nome,
        vendedor_telefone: data.responsavel_telefone,
        vendedor_email: data.responsavel_email,
        ativo: data.ativa,
        observacoes: data.observacoes,
      });

      // Depois criar a administradora com o ID do fornecedor
      const administradora = await base44.entities.AdministradoraConsorcio.create({
        ...data,
        fornecedor_id: fornecedor.id,
      });

      return administradora;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['administradoras'] });
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Administradora cadastrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar administradora: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const administradora = items.find(a => a.id === id);
      
      // Atualizar fornecedor se existir
      if (administradora.fornecedor_id) {
        await base44.entities.Fornecedor.update(administradora.fornecedor_id, {
          nome: data.nome,
          cnpj: data.cnpj,
          razao_social: data.razao_social,
          inscricao_estadual: data.inscricao_estadual,
          telefone: data.telefone,
          email: data.email,
          site: data.site,
          endereco: data.endereco,
          cidade: data.cidade,
          estado: data.estado,
          cep: data.cep,
          vendedor_nome: data.responsavel_nome,
          vendedor_telefone: data.responsavel_telefone,
          vendedor_email: data.responsavel_email,
          ativo: data.ativa,
          observacoes: data.observacoes,
        });
      }

      // Atualizar administradora
      return base44.entities.AdministradoraConsorcio.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['administradoras'] });
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Administradora atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar administradora: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AdministradoraConsorcio.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['administradoras'] });
      toast.success("Administradora excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir administradora: " + error.message);
    },
  });

  const filteredItems = items.filter(item => 
    item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.razao_social?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Administradoras de Consórcio</h1>
          <p className="text-gray-600 mt-1">Gerencie as administradoras de consórcios</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Administradora
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar administradoras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {showForm && (
        <AdministradoraForm
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

      <AdministradorasList
        items={filteredItems}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => {
          if (confirm("Deseja realmente excluir esta administradora?")) {
            deleteMutation.mutate(id);
          }
        }}
      />
    </div>
  );
}