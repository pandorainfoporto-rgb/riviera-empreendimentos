
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { isBefore, parseISO } from "date-fns";

import PagamentosClientesList from "../components/pagamentosClientes/PagamentosClientesList";
import ReceberPagamentoDialog from "../components/pagamentosClientes/ReceberPagamentoDialog";
import EditarPagamentoDialog from "../components/pagamentosClientes/EditarPagamentoDialog";
import PagarOnlineDialog from "../components/pagamentosClientes/PagarOnlineDialog";

export default function PagamentosClientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteFilter, setClienteFilter] = useState("todos");
  const [unidadeFilter, setUnidadeFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [showReceberDialog, setShowReceberDialog] = useState(false);
  const [showEditarDialog, setShowEditarDialog] = useState(false);
  const [showPagarOnlineDialog, setShowPagarOnlineDialog] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState(null);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pagamentos = [], isLoading } = useQuery({
    queryKey: ['pagamentosClientes'],
    queryFn: () => base44.entities.PagamentoCliente.list('-data_vencimento'),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: empreendimentos = [] } = useQuery({
    queryKey: ['empreendimentos'],
    queryFn: () => base44.entities.Empreendimento.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PagamentoCliente.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentosClientes'] });
      setShowReceberDialog(false);
      setShowEditarDialog(false);
      setSelectedPagamento(null);
    },
  });

  // Atualizar automaticamente status de parcelas atrasadas
  useEffect(() => {
    const atualizarStatusAtrasados = async () => {
      const hoje = new Date();
      const pagamentosParaAtualizar = pagamentos.filter(p => {
        if (p.status !== 'pendente') return false;
        try {
          const dataVenc = parseISO(p.data_vencimento);
          return isBefore(dataVenc, hoje);
        } catch {
          return false;
        }
      });

      for (const pag of pagamentosParaAtualizar) {
        try {
          await base44.entities.PagamentoCliente.update(pag.id, {
            ...pag,
            status: 'atrasado'
          });
        } catch (error) {
          console.error('Erro ao atualizar status:', error);
        }
      }

      if (pagamentosParaAtualizar.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['pagamentosClientes'] });
      }
    };

    if (pagamentos.length > 0) {
      atualizarStatusAtrasados();
    }
  }, [pagamentos, queryClient]);

  // Filtrar itens
  const filteredItems = pagamentos.filter(item => {
    if (clienteFilter === "todos" && unidadeFilter === "todos") {
      return false;
    }

    if (!clientes || !unidades) return false;

    const cliente = clientes.find(c => c.id === item.cliente_id);
    const unidade = unidades.find(u => u.id === item.unidade_id);
    
    const matchesSearch = 
      cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade?.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCliente = clienteFilter === "todos" || item.cliente_id === clienteFilter;
    const matchesStatus = statusFilter === "todos" || item.status === statusFilter;
    const matchesUnidade = unidadeFilter === "todos" || item.unidade_id === unidadeFilter;
    
    // Filtro por data
    let matchesData = true;
    if (dataInicio) {
      try {
        const dataVenc = parseISO(item.data_vencimento);
        const dataInicioDate = parseISO(dataInicio);
        matchesData = matchesData && (dataVenc >= dataInicioDate);
      } catch {
        matchesData = false;
      }
    }
    if (dataFim) {
      try {
        const dataVenc = parseISO(item.data_vencimento);
        const dataFimDate = parseISO(dataFim);
        matchesData = matchesData && (dataVenc <= dataFimDate);
      } catch {
        matchesData = false;
      }
    }
    
    return matchesSearch && matchesCliente && matchesStatus && matchesUnidade && matchesData;
  });

  const totalPendente = filteredItems
    .filter(p => p.status === 'pendente')
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const totalRecebido = filteredItems
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const totalAtrasado = filteredItems
    .filter(p => p.status === 'atrasado')
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const handleReceber = (pagamento) => {
    setSelectedPagamento(pagamento);
    setShowReceberDialog(true);
  };

  const handleEditar = (pagamento) => {
    setSelectedPagamento(pagamento);
    setShowEditarDialog(true);
  };

  const handlePagarOnline = (pagamento) => {
    setSelectedPagamento(pagamento);
    setShowPagarOnlineDialog(true);
  };

  const handleCancelar = async (pagamento) => {
    if (user?.role !== 'admin') {
      alert('Apenas administradores podem cancelar pagamentos');
      return;
    }

    if (window.confirm('Tem certeza que deseja cancelar este pagamento?')) {
      updateMutation.mutate({
        id: pagamento.id,
        data: { ...pagamento, status: 'cancelado' }
      });
    }
  };

  const mostrarMensagemInicial = clienteFilter === "todos" && unidadeFilter === "todos";

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Recebimentos de Clientes</h1>
          <p className="text-gray-600 mt-1">Gerencie os recebimentos dos clientes</p>
        </div>
      </div>

      {!mostrarMensagemInicial && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 mb-1">Pendente</p>
            <p className="text-2xl font-bold text-yellow-600">
              R$ {(totalPendente || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Recebido</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {(totalRecebido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <p className="text-sm text-gray-600 mb-1">Atrasado</p>
            <p className="text-2xl font-bold text-red-600">
              R$ {(totalAtrasado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={clienteFilter} onValueChange={setClienteFilter}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Selecione um cliente *" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Clientes</SelectItem>
              {clientes.map(cliente => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={unidadeFilter} onValueChange={setUnidadeFilter}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filtrar por unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as Unidades</SelectItem>
              {unidades.map(uni => (
                <SelectItem key={uni.id} value={uni.id}>
                  {uni.codigo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!mostrarMensagemInicial && (
          <>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por cliente ou unidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                  <TabsTrigger value="pendente">Pendentes</TabsTrigger>
                  <TabsTrigger value="pago">Recebidos</TabsTrigger>
                  <TabsTrigger value="atrasado">Atrasados</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio" className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Data de Vencimento - De
                </Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFim" className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Data de Vencimento - Até
                </Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {mostrarMensagemInicial ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <Search className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Selecione um Cliente ou Unidade
          </h3>
          <p className="text-blue-700">
            Para visualizar os recebimentos, selecione um cliente ou unidade nos filtros acima.
          </p>
        </div>
      ) : (
        <PagamentosClientesList
          items={filteredItems}
          clientes={clientes}
          empreendimentos={empreendimentos}
          unidades={unidades}
          isLoading={isLoading}
          userRole={user?.role}
          onReceber={handleReceber}
          onEditar={handleEditar}
          onCancelar={handleCancelar}
          onPagarOnline={handlePagarOnline}
        />
      )}

      {showReceberDialog && selectedPagamento && (
        <ReceberPagamentoDialog
          pagamento={selectedPagamento}
          cliente={clientes.find(c => c.id === selectedPagamento.cliente_id)}
          empreendimento={empreendimentos.find(e => e.id === selectedPagamento.empreendimento_id)}
          onClose={() => {
            setShowReceberDialog(false);
            setSelectedPagamento(null);
          }}
          onConfirm={(data) => {
            updateMutation.mutate({
              id: selectedPagamento.id,
              data: { ...selectedPagamento, ...data, status: 'pago' }
            });
          }}
          isProcessing={updateMutation.isPending}
        />
      )}

      {showEditarDialog && selectedPagamento && (
        <EditarPagamentoDialog
          pagamento={selectedPagamento}
          clientes={clientes}
          empreendimentos={empreendimentos}
          onClose={() => {
            setShowEditarDialog(false);
            setSelectedPagamento(null);
          }}
          onSave={(data) => {
            updateMutation.mutate({
              id: selectedPagamento.id,
              data
            });
          }}
          isProcessing={updateMutation.isPending}
        />
      )}

      {showPagarOnlineDialog && selectedPagamento && (
        <PagarOnlineDialog
          pagamento={selectedPagamento}
          cliente={clientes.find(c => c.id === selectedPagamento.cliente_id)}
          unidade={unidades.find(u => u.id === selectedPagamento.unidade_id)}
          onClose={() => {
            setShowPagarOnlineDialog(false);
            setSelectedPagamento(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['pagamentosClientes'] });
            setShowPagarOnlineDialog(false);
            setSelectedPagamento(null);
          }}
        />
      )}
    </div>
  );
}
