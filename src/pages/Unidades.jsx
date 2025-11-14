import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, Plus, Edit, Trash2, MapPin, Ruler, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import UnidadeForm from "../components/unidades/UnidadeForm";
import UnidadesList from "../components/unidades/UnidadesList";
import ComparacaoUnidades from "../components/unidades/ComparacaoUnidades";

export default function Unidades() {
  const [showForm, setShowForm] = useState(false);
  const [showComparacao, setShowComparacao] = useState(false);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success('Unidade criada com sucesso!');
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
      toast.success('Unidade atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Verificar se existem negociações vinculadas
      const negociacoes = await base44.entities.Negociacao.filter({ unidade_id: id });
      
      if (negociacoes && negociacoes.length > 0) {
        throw new Error(`Não é possível excluir esta unidade pois existem ${negociacoes.length} negociação(ões) vinculada(s). Exclua as negociações primeiro.`);
      }

      // Verificar se existem cronogramas de obra vinculados
      const cronogramas = await base44.entities.CronogramaObra.filter({ unidade_id: id });
      
      if (cronogramas && cronogramas.length > 0) {
        throw new Error(`Não é possível excluir esta unidade pois existem ${cronogramas.length} cronograma(s) de obra vinculado(s).`);
      }

      // Se não houver vínculos, pode excluir
      await base44.entities.Unidade.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      toast.success('Unidade removida!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (data) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja remover esta unidade?')) {
      deleteMutation.mutate(id);
    }
  };

  const unidadesFiltradas = unidades.filter(unidade => {
    const matchSearch = searchTerm === "" || 
      unidade.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade.endereco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade.matricula?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === "todos" || unidade.status === statusFilter;
    const matchLoteamento = loteamentoFilter === "todos" || unidade.loteamento_id === loteamentoFilter;

    return matchSearch && matchStatus && matchLoteamento;
  });

  const estatisticas = {
    total: unidades.length,
    disponiveis: unidades.filter(u => u.status === 'disponivel').length,
    vendidas: unidades.filter(u => u.status === 'vendida').length,
    reservadas: unidades.filter(u => u.status === 'reservada').length,
    em_construcao: unidades.filter(u => u.status === 'em_construcao').length,
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
        <div className="flex gap-2">
          <Button
            onClick={() => setShowComparacao(true)}
            variant="outline"
            disabled={unidades.length < 2}
            className="border-[var(--wine-600)] text-[var(--wine-700)] hover:bg-[var(--wine-50)]"
          >
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Comparar Unidades
          </Button>
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
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

      {/* Lista de Unidades */}
      <UnidadesList
        unidades={unidadesFiltradas}
        loteamentos={loteamentos}
        clientes={clientes}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Modal de Comparação */}
      <ComparacaoUnidades
        unidades={unidades}
        open={showComparacao}
        onClose={() => setShowComparacao(false)}
      />
    </div>
  );
}