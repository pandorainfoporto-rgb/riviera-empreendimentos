
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, TrendingUp, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import CustoObraForm from "../components/custosObra/CustoObraForm";
import CustoObraList from "../components/custosObra/CustoObraList";
import DashboardFinanceiroCusto from "../components/custosObra/DashboardFinanceiroCusto";
import GerenciarDespesas from "../components/custosObra/GerenciarDespesas";
import OrcamentoCompraDialog from "../components/custosObra/OrcamentoCompraDialog";

export default function CustosObra() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [unidadeFilter, setUnidadeFilter] = useState("todas");
  const [showDashboard, setShowDashboard] = useState(false);
  const [showDespesas, setShowDespesas] = useState(false);
  const [showOrcamentoCompra, setShowOrcamentoCompra] = useState(false);
  const [custoSelecionado, setCustoSelecionado] = useState(null);

  const queryClient = useQueryClient();

  const { data: custos = [] } = useQuery({
    queryKey: ['custos_obra'],
    queryFn: () => base44.entities.CustoObra.list('-created_date'),
    initialData: [],
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
    initialData: [],
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustoObra.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custos_obra'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustoObra.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custos_obra'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustoObra.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custos_obra'] });
    },
  });

  const custosFiltrados = (custos || []).filter(custo => {
    const unidade = (unidades || []).find(u => u.id === custo.unidade_id);
    const matchSearch = !searchTerm || 
      custo.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade?.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchUnidade = unidadeFilter === "todas" || custo.unidade_id === unidadeFilter;
    
    return matchSearch && matchUnidade;
  });

  const totalCustos = (custos || []).length;
  const totalEstimado = (custos || []).reduce((sum, c) => sum + (c.valor_total_estimado || 0), 0);
  const totalRealizado = (custos || []).reduce((sum, c) => sum + (c.valor_total_realizado || 0), 0);
  const custosEmExecucao = (custos || []).filter(c => c.status === 'em_execucao').length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Custos de Obra</h1>
          <p className="text-gray-600 mt-1">Orçamento detalhado por unidade com materiais e serviços</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Custo de Obra
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Total de Custos</p>
          <p className="text-2xl font-bold text-gray-900">{totalCustos}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Total Estimado</p>
          <p className="text-xl font-bold text-green-600">
            R$ {(totalEstimado / 1000000).toFixed(2)}M
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 mb-1">Total Realizado</p>
          <p className="text-xl font-bold text-purple-600">
            R$ {(totalRealizado / 1000000).toFixed(2)}M
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <p className="text-sm text-gray-600 mb-1">Em Execução</p>
          <p className="text-2xl font-bold text-orange-600">{custosEmExecucao}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar custos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={unidadeFilter} onValueChange={setUnidadeFilter}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Filtrar por unidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Unidades</SelectItem>
            {(unidades || []).map(uni => (
              <SelectItem key={uni.id} value={uni.id}>
                {uni.codigo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showForm && (
        <CustoObraForm
          item={editingItem}
          unidades={unidades}
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

      <CustoObraList
        items={custosFiltrados}
        unidades={unidades}
        loteamentos={loteamentos}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => {
          if (confirm('Deseja realmente excluir este custo?')) {
            deleteMutation.mutate(id);
          }
        }}
        onVerDashboard={(item) => {
          setCustoSelecionado(item);
          setShowDashboard(true);
        }}
        onGerenciarDespesas={(item) => {
          setCustoSelecionado(item);
          setShowDespesas(true);
        }}
        onCriarOrcamentoCompra={(item) => {
          setCustoSelecionado(item);
          setShowOrcamentoCompra(true);
        }}
      />

      {/* Dashboard Financeiro */}
      {showDashboard && custoSelecionado && (
        <Dialog open onOpenChange={setShowDashboard}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Dashboard Financeiro - {custoSelecionado.nome}
              </DialogTitle>
            </DialogHeader>
            <DashboardFinanceiroCusto custoObraId={custoSelecionado.id} />
          </DialogContent>
        </Dialog>
      )}

      {/* Gerenciar Despesas */}
      {showDespesas && custoSelecionado && (
        <Dialog open onOpenChange={setShowDespesas}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Gerenciar Despesas - {custoSelecionado.nome}
              </DialogTitle>
            </DialogHeader>
            <GerenciarDespesas 
              custoObraId={custoSelecionado.id} 
              unidadeId={custoSelecionado.unidade_id}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Orçamento de Compra */}
      {showOrcamentoCompra && custoSelecionado && (
        <OrcamentoCompraDialog
          custoObra={custoSelecionado}
          itens={[]} // Itens will likely be fetched internally by OrcamentoCompraDialog or passed from CustoObraList if readily available. For now, empty array.
          unidade={unidades.find(u => u.id === custoSelecionado.unidade_id)}
          onClose={() => setShowOrcamentoCompra(false)}
        />
      )}
    </div>
  );
}
