import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, AlertCircle, Clock, CheckCircle, XCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import ContratoForm from "../components/contratos/ContratoForm";
import ContratosList from "../components/contratos/ContratosList";
import BuscaAvancadaContratos from "../components/contratos/BuscaAvancadaContratos";

export default function Contratos() {
  const [showForm, setShowForm] = useState(false);
  const [editingContrato, setEditingContrato] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBuscaAvancada, setShowBuscaAvancada] = useState(false);
  const [statusFilter, setStatusFilter] = useState("todos");

  const queryClient = useQueryClient();

  const { data: contratos = [], isLoading } = useQuery({
    queryKey: ['contratos'],
    queryFn: () => base44.entities.Contrato.list('-data_inicio_vigencia'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contrato.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      setShowForm(false);
      setEditingContrato(null);
      toast.success("Contrato criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar contrato: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contrato.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      setShowForm(false);
      setEditingContrato(null);
      toast.success("Contrato atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contrato.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast.success("Contrato removido!");
    },
  });

  const handleSubmit = (data) => {
    if (editingContrato) {
      updateMutation.mutate({ id: editingContrato.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (contrato) => {
    setEditingContrato(contrato);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Deseja realmente remover este contrato?")) {
      deleteMutation.mutate(id);
    }
  };

  // Calcular estatísticas
  const hoje = new Date().toISOString().split('T')[0];
  const contratosAtivos = contratos.filter(c => c.status === 'ativo').length;
  const contratosVencendo = contratos.filter(c => {
    if (c.status !== 'ativo' || !c.data_fim_vigencia) return false;
    const diasParaVencer = Math.floor((new Date(c.data_fim_vigencia) - new Date()) / (1000 * 60 * 60 * 24));
    return diasParaVencer > 0 && diasParaVencer <= 30;
  }).length;
  const contratosVencidos = contratos.filter(c => c.status === 'vencido').length;
  const valorTotal = contratos
    .filter(c => c.status === 'ativo')
    .reduce((sum, c) => sum + (c.valor_total || 0), 0);

  // Filtrar contratos
  const filteredContratos = contratos.filter(c => {
    const matchesSearch = 
      c.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.numero_contrato?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (showForm) {
    return (
      <div className="p-4 md:p-8">
        <ContratoForm
          contrato={editingContrato}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingContrato(null);
          }}
          isProcessing={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  if (showBuscaAvancada) {
    return (
      <div className="p-4 md:p-8">
        <BuscaAvancadaContratos
          contratos={contratos}
          onVoltar={() => setShowBuscaAvancada(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Contratos</h1>
          <p className="text-gray-600 mt-1">Gestão completa de contratos</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBuscaAvancada(true)}
          >
            <Search className="w-4 h-4 mr-2" />
            Busca Avançada
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Contrato
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Contratos Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{contratosAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Vencendo (30 dias)</p>
                <p className="text-2xl font-bold text-gray-900">{contratosVencendo}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-100">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Vencidos</p>
                <p className="text-2xl font-bold text-gray-900">{contratosVencidos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Total Ativo</p>
                <p className="text-lg font-bold text-gray-900">
                  R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Buscar por título ou número do contrato..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          {['todos', 'ativo', 'vencido', 'rascunho', 'rescindido'].map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
              size="sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <ContratosList
        contratos={filteredContratos}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}