import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, Plus, Edit, Trash2, MapPin, Ruler } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import UnidadeForm from "../components/unidades/UnidadeForm";
import UnidadesList from "../components/unidades/UnidadesList";

export default function Unidades() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [loteamentoFilter, setLoteamentoFilter] = useState("todos");

  const queryClient = useQueryClient();

  const { data: unidades = [], isLoading } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list('-created_date'),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Unidade.create(data),
    onSuccess: (novaUnidade) => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      toast.success('Unidade criada com sucesso!');
      // Atualizar para continuar editando. If handleSubmit decides to close, it will override this.
      setEditingItem(novaUnidade);
    },
    onError: (error) => {
      toast.error('Erro ao criar unidade: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Unidade.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Unidade atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  // The deleteMutation was removed as per outline instructions.

  const handleSubmit = (data, fecharAposSalvar = true) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
      // Form closing and editing item reset are handled by updateMutation.onSuccess.
      // So, the fecharAposSalvar logic for updates is effectively superseded.
    } else {
      createMutation.mutate(data);
      if (fecharAposSalvar) {
        setShowForm(false);
        setEditingItem(null);
      }
      // If fecharAposSalvar is false, createMutation.onSuccess will set editingItem to the newly created unit, keeping the form open for further editing.
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  // handleDelete function was removed as per outline instructions, as deleteMutation was removed.

  const handleTogglePortfolio = async (unidade) => {
    const novoStatus = !unidade.fora_portfolio;
    
    if (novoStatus) {
      const motivo = prompt("Digite o motivo para retirar esta unidade do portfólio:");
      if (!motivo) {
        toast.info("Operação cancelada. Motivo não fornecido.");
        return;
      }
      
      try {
        await updateMutation.mutateAsync({
          id: unidade.id,
          data: {
            fora_portfolio: true,
            motivo_fora_portfolio: motivo,
            data_saida_portfolio: new Date().toISOString().split('T')[0]
          }
        });
        toast.success("Unidade retirada do portfólio");
      } catch (error) {
        toast.error("Erro ao retirar unidade do portfólio: " + error.message);
      }
    } else {
      try {
        await updateMutation.mutateAsync({
          id: unidade.id,
          data: {
            fora_portfolio: false,
            motivo_fora_portfolio: null,
            data_saida_portfolio: null
          }
        });
        toast.success("Unidade reintegrada ao portfólio");
      } catch (error) {
        toast.error("Erro ao reintegrar unidade ao portfólio: " + error.message);
      }
    }
  };

  const filteredUnidades = unidades.filter(unidade => {
    const matchSearch = searchTerm === "" || 
      unidade.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade.endereco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade.matricula?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === "todos" || unidade.status === statusFilter;
    const matchLoteamento = loteamentoFilter === "todos" || unidade.loteamento_id === loteamentoFilter;
    
    // Filtrar unidades fora do portfólio por padrão
    const matchesPortfolio = !unidade.fora_portfolio;

    return matchSearch && matchStatus && matchLoteamento && matchesPortfolio;
  });

  const estatisticas = {
    total: unidades.length,
    disponiveis: unidades.filter(u => u.status === 'disponivel').length,
    vendidas: unidades.filter(u => u.status === 'vendida').length,
    reservadas: unidades.filter(u => u.status === 'reservada').length,
    em_construcao: unidades.filter(u => u.status === 'em_construcao').length,
    fora_portfolio: unidades.filter(u => u.fora_portfolio).length, // Added stat for units out of portfolio
  };

  if (showForm) {
    return (
      <div className="p-4 md:p-8">
        <UnidadeForm
          unidade={editingItem}
          loteamentos={loteamentos}
          clientes={clientes}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          isProcessing={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Unidades / Lotes</h1>
          <p className="text-gray-600 mt-1">Gerencie as unidades e lotes do empreendimento</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Unidade
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{estatisticas.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{estatisticas.disponiveis}</div>
            <div className="text-sm text-gray-600">Disponíveis</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{estatisticas.vendidas}</div>
            <div className="text-sm text-gray-600">Vendidas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{estatisticas.reservadas}</div>
            <div className="text-sm text-gray-600">Reservadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{estatisticas.em_construcao}</div>
            <div className="text-sm text-gray-600">Em Construção</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{estatisticas.fora_portfolio}</div>
            <div className="text-sm text-gray-600">Fora do Portfólio</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por código, endereço ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={loteamentoFilter} onValueChange={setLoteamentoFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Loteamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Loteamentos</SelectItem>
                {loteamentos.map(lot => (
                  <SelectItem key={lot.id} value={lot.id}>
                    {lot.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="reservada">Reservada</SelectItem>
                <SelectItem value="vendida">Vendida</SelectItem>
                <SelectItem value="escriturada">Escriturada</SelectItem>
                <SelectItem value="em_construcao">Em Construção</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <UnidadesList
        unidades={filteredUnidades}
        loteamentos={loteamentos}
        clientes={clientes}
        onEdit={handleEdit}
        onTogglePortfolio={handleTogglePortfolio}
        isLoading={isLoading}
      />
    </div>
  );
}