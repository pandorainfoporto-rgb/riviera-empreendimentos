import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import CaixaForm from "../components/caixas/CaixaForm";
import CaixasList from "../components/caixas/CaixasList";

export default function Caixas() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list('-created_date'),
  });

  const { data: contas = [] } = useQuery({
    queryKey: ['contas'],
    queryFn: () => base44.entities.Conta.list(),
  });

  const { data: corretoras = [] } = useQuery({
    queryKey: ['corretoras'],
    queryFn: () => base44.entities.Corretora.list(),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: gateways = [] } = useQuery({
    queryKey: ['configuracoes_gateway'],
    queryFn: () => base44.entities.ConfiguracaoGateway.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      // Se marcar como padrão, desmarcar outros
      if (data.eh_padrao) {
        items.forEach(async (item) => {
          if (item.eh_padrao) {
            await base44.entities.Caixa.update(item.id, { ...item, eh_padrao: false });
          }
        });
      }
      // Inicializar saldo_atual com saldo_inicial
      return base44.entities.Caixa.create({
        ...data,
        saldo_atual: data.saldo_inicial || 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixas'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      // Se marcar como padrão, desmarcar outros
      if (data.eh_padrao) {
        items.forEach(async (item) => {
          if (item.id !== id && item.eh_padrao) {
            await base44.entities.Caixa.update(item.id, { ...item, eh_padrao: false });
          }
        });
      }
      return base44.entities.Caixa.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixas'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Caixa.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixas'] });
    },
  });

  const filteredItems = items.filter(item => {
    const matchesSearch = item.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === "todos" || item.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  const totalSaldo = items
    .filter(c => c.ativo)
    .reduce((sum, c) => sum + (c.saldo_atual || 0), 0);

  // Estatísticas por tipo
  const caixasGateway = items.filter(c => c.tipo === 'gateway' && c.ativo);
  const totalSaldoGateway = caixasGateway.reduce((sum, c) => sum + (c.saldo_atual || 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Caixas</h1>
          <p className="text-gray-600 mt-1">Gerencie os caixas e contas de movimentação</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Caixa
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-[var(--wine-600)]">
          <p className="text-sm text-gray-600 mb-1">Saldo Total (Caixas Ativos)</p>
          <p className="text-3xl font-bold text-[var(--wine-700)]">
            R$ {totalSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
          <p className="text-sm text-gray-600 mb-1">Saldo em Gateways</p>
          <p className="text-3xl font-bold text-orange-600">
            R$ {totalSaldoGateway.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">{caixasGateway.length} gateway(s) ativo(s)</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Total de Caixas</p>
          <p className="text-3xl font-bold text-blue-600">
            {items.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">{items.filter(c => c.ativo).length} ativos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar caixas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={tipoFilter} onValueChange={setTipoFilter}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="dinheiro">Dinheiro</TabsTrigger>
            <TabsTrigger value="conta_bancaria">Contas</TabsTrigger>
            <TabsTrigger value="corretora">Corretoras</TabsTrigger>
            <TabsTrigger value="gateway">Gateways</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {showForm && (
        <CaixaForm
          item={editingItem}
          contas={contas}
          corretoras={corretoras}
          loteamentos={loteamentos}
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

      <CaixasList
        items={filteredItems}
        contas={contas}
        corretoras={corretoras}
        loteamentos={loteamentos}
        gateways={gateways}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => {
          if (window.confirm('Tem certeza que deseja excluir este caixa?')) {
            deleteMutation.mutate(id);
          }
        }}
      />
    </div>
  );
}