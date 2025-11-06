import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

import SociosList from "../components/socios/SociosList";
import SocioForm from "../components/socios/SocioForm";

export default function Socios() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['socios'],
    queryFn: () => base44.entities.Socio.list('-created_date'),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const socio = await base44.entities.Socio.create(data);
      
      if (data.eh_fornecedor && data.unidades && data.unidades.length > 0) {
        const fornecedoresPromises = data.unidades.map(uni => {
          const unidade = unidades.find(u => u.id === uni.unidade_id);
          return base44.entities.Fornecedor.create({
            nome: data.nome,
            cnpj: data.cpf_cnpj,
            telefone: data.telefone || "",
            email: data.email || "",
            endereco: data.endereco || "",
            tipo_servico: data.tipo_servico_fornecedor || "outros",
            loteamento_id: unidade?.loteamento_id || null,
          });
        });
        
        await Promise.all(fornecedoresPromises);
      }
      
      return socio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socios'] });
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const socio = await base44.entities.Socio.update(id, data);
      
      if (data.eh_fornecedor && data.unidades && data.unidades.length > 0) {
        const fornecedores = await base44.entities.Fornecedor.list();
        const fornecedoresDoSocio = fornecedores.filter(f => f.cnpj === data.cpf_cnpj);
        
        for (const uni of data.unidades) {
          const unidade = unidades.find(u => u.id === uni.unidade_id);
          const fornecedorExiste = fornecedoresDoSocio.find(f => f.loteamento_id === unidade?.loteamento_id);
          
          if (!fornecedorExiste && unidade) {
            await base44.entities.Fornecedor.create({
              nome: data.nome,
              cnpj: data.cpf_cnpj,
              telefone: data.telefone || "",
              email: data.email || "",
              endereco: data.endereco || "",
              tipo_servico: data.tipo_servico_fornecedor || "outros",
              loteamento_id: unidade.loteamento_id,
            });
          } else if (fornecedorExiste) {
            await base44.entities.Fornecedor.update(fornecedorExiste.id, {
              nome: data.nome,
              telefone: data.telefone || "",
              email: data.email || "",
              endereco: data.endereco || "",
              tipo_servico: data.tipo_servico_fornecedor || "outros",
            });
          }
        }
      }
      
      return socio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socios'] });
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Socio.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socios'] });
    },
  });

  const filteredItems = items.filter(item =>
    item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cpf_cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Sócios</h1>
          <p className="text-gray-600 mt-1">Gerencie os sócios das unidades</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Sócio
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar sócios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {showForm && (
        <SocioForm
          item={editingItem}
          unidades={unidades}
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

      <SociosList
        items={filteredItems}
        unidades={unidades}
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