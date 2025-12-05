import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, Filter } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import IntencaoCompraForm from "@/components/intencaoCompra/IntencaoCompraForm";
import IntencaoCompraList from "@/components/intencaoCompra/IntencaoCompraList";
import IntencaoCompraDetalhes from "@/components/intencaoCompra/IntencaoCompraDetalhes";
import UploadProjetoDialog from "@/components/intencaoCompra/UploadProjetoDialog";

export default function IntencoesCompra() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [uploadingItem, setUploadingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Queries
  const { data: intencoes = [], isLoading } = useQuery({
    queryKey: ["intencoes_compra"],
    queryFn: () => base44.entities.IntencaoCompra.list("-created_date"),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ["loteamentos"],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const intencao = await base44.entities.IntencaoCompra.create(data);

      // Se marcou para gerar custo do projeto, cria o pagamento
      if (data.gerar_custo_projeto && data.valor_custo_projeto) {
        const parcelas = data.condicao_pagamento_projeto === "a_vista" ? 1 :
          parseInt(data.condicao_pagamento_projeto.replace("x", ""));

        const valorParcela = data.valor_custo_projeto / parcelas;
        const dataBase = new Date(data.data_vencimento_projeto);

        for (let i = 0; i < parcelas; i++) {
          const dataVenc = new Date(dataBase);
          dataVenc.setMonth(dataVenc.getMonth() + i);

          await base44.entities.PagamentoCliente.create({
            cliente_id: data.cliente_id,
            valor: valorParcela,
            data_vencimento: dataVenc.toISOString().split("T")[0],
            status: "pendente",
            tipo: "outros",
            observacoes: `Custo do Projeto Arquitetônico - Parcela ${i + 1}/${parcelas} - Intenção de Compra`,
          });
        }
      }

      return intencao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intencoes_compra"] });
      setShowForm(false);
      toast.success("Intenção de compra criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.IntencaoCompra.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intencoes_compra"] });
      setShowForm(false);
      setEditingItem(null);
      setUploadingItem(null);
      toast.success("Intenção de compra atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IntencaoCompra.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intencoes_compra"] });
      toast.success("Intenção de compra excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  // Handlers
  const handleSave = (data) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id) => {
    if (confirm("Tem certeza que deseja excluir esta intenção de compra?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAlterarStatus = (intencao, novoStatus) => {
    updateMutation.mutate({
      id: intencao.id,
      data: { status: novoStatus },
    });
  };

  const handleUploadProjeto = (data) => {
    updateMutation.mutate({
      id: uploadingItem.id,
      data,
    });
  };

  const handleGerarCustoObra = (intencao) => {
    // Navega para a página de custo de obra com os dados da intenção
    navigate(createPageUrl("CustosObra") + `?intencao_id=${intencao.id}&novo=true`);
  };

  // Filtros
  const filteredIntencoes = intencoes.filter((intencao) => {
    const cliente = clientes.find((c) => c.id === intencao.cliente_id);
    const matchesSearch =
      !searchTerm ||
      cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente?.cpf_cnpj?.includes(searchTerm);
    const matchesStatus = statusFilter === "todos" || intencao.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const clienteViewing = viewingItem ? clientes.find((c) => c.id === viewingItem.cliente_id) : null;
  const loteamentoViewing = viewingItem ? loteamentos.find((l) => l.id === viewingItem.loteamento_id) : null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Intenções de Compra
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Gerencie as intenções de compra e projetos arquitetônicos
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Intenção
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="aguardando_projeto">Aguardando Projeto</SelectItem>
            <SelectItem value="aguardando_reuniao">Aguardando Reunião</SelectItem>
            <SelectItem value="alteracao_projeto">Alteração de Projeto</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-12">Carregando...</div>
      ) : (
        <IntencaoCompraList
          intencoes={filteredIntencoes}
          clientes={clientes}
          loteamentos={loteamentos}
          onEdit={(item) => {
            setEditingItem(item);
            setShowForm(true);
          }}
          onDelete={handleDelete}
          onView={setViewingItem}
          onUploadProjeto={setUploadingItem}
          onAlterarStatus={handleAlterarStatus}
          onGerarCustoObra={handleGerarCustoObra}
        />
      )}

      {/* Form Dialog */}
      {showForm && (
        <IntencaoCompraForm
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
          intencao={editingItem}
          clientes={clientes}
          loteamentos={loteamentos}
        />
      )}

      {/* Detalhes Dialog */}
      {viewingItem && (
        <IntencaoCompraDetalhes
          open={!!viewingItem}
          onClose={() => setViewingItem(null)}
          intencao={viewingItem}
          cliente={clienteViewing}
          loteamento={loteamentoViewing}
        />
      )}

      {/* Upload Projeto Dialog */}
      {uploadingItem && (
        <UploadProjetoDialog
          open={!!uploadingItem}
          onClose={() => setUploadingItem(null)}
          intencao={uploadingItem}
          onSave={handleUploadProjeto}
        />
      )}
    </div>
  );
}