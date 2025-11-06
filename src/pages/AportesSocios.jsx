
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AportesList from "../components/aportes/AportesList";
import AporteForm from "../components/aportes/AporteForm";
import GerarAportesDialog from "../components/aportes/GerarAportesDialog";

export default function AportesSocios() {
  const [showForm, setShowForm] = useState(false);
  const [showGerarDialog, setShowGerarDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [empFilter, setEmpFilter] = useState("todos");
  const queryClient = useQueryClient();

  const { data: aportes = [], isLoading } = useQuery({
    queryKey: ['aportesSocios'],
    queryFn: () => base44.entities.AporteSocio.list('-data_vencimento'),
  });

  const { data: socios = [] } = useQuery({
    queryKey: ['socios'],
    queryFn: () => base44.entities.Socio.list(),
  });

  const { data: empreendimentos = [] } = useQuery({
    queryKey: ['empreendimentos'],
    queryFn: () => base44.entities.Empreendimento.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AporteSocio.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aportesSocios'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AporteSocio.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aportesSocios'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AporteSocio.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aportesSocios'] });
    },
  });

  const filteredItems = aportes.filter(item => {
    const socio = socios.find(s => s.id === item.socio_id);
    const emp = empreendimentos.find(e => e.id === item.empreendimento_id);
    
    const matchesSearch = 
      socio?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mes_referencia?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "todos" || item.status === statusFilter;
    const matchesEmp = empFilter === "todos" || item.empreendimento_id === empFilter;
    
    return matchesSearch && matchesStatus && matchesEmp;
  });

  const totalPendente = aportes
    .filter(m => m.status === 'pendente')
    .reduce((sum, m) => sum + (m.valor || 0), 0);

  const totalPago = aportes
    .filter(m => m.status === 'pago')
    .reduce((sum, m) => sum + (m.valor || 0), 0);

  const totalAtrasado = aportes
    .filter(m => m.status === 'atrasado')
    .reduce((sum, m) => sum + (m.valor || 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Aportes dos Sócios</h1>
          <p className="text-gray-600 mt-1">Controle de aportes de capital dos sócios</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowGerarDialog(true)}
            variant="outline"
            className="hover:bg-[var(--wine-100)] hover:border-[var(--wine-400)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Gerar Aportes
          </Button>
          <Button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Aporte
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-t-4 border-yellow-500">
          <p className="text-sm text-gray-600 mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-gray-900">
            R$ {(totalPendente || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-t-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Pagos</p>
          <p className="text-2xl font-bold text-gray-900">
            R$ {(totalPago || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-t-4 border-red-500">
          <p className="text-sm text-gray-600 mb-1">Atrasados</p>
          <p className="text-2xl font-bold text-gray-900">
            R$ {(totalAtrasado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-t-4 border-[var(--wine-600)]">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{(aportes.length || 0)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por sócio, empreendimento ou mês..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pendente">Pendentes</TabsTrigger>
            <TabsTrigger value="pago">Pagos</TabsTrigger>
            <TabsTrigger value="atrasado">Atrasados</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={empFilter} onValueChange={setEmpFilter}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Filtrar por empreendimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Empreendimentos</SelectItem>
            {empreendimentos.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showForm && (
        <AporteForm
          item={editingItem}
          socios={socios}
          empreendimentos={empreendimentos}
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

      {showGerarDialog && (
        <GerarAportesDialog
          socios={socios}
          empreendimentos={empreendimentos}
          onClose={() => setShowGerarDialog(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['aportesSocios'] });
            setShowGerarDialog(false);
          }}
        />
      )}

      <AportesList
        items={filteredItems}
        socios={socios}
        empreendimentos={empreendimentos}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
        onUpdateStatus={(id, status, data_pagamento) => {
          updateMutation.mutate({ 
            id, 
            data: { status, data_pagamento } 
          });
        }}
      />
    </div>
  );
}
