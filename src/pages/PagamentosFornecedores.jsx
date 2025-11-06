
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isBefore, parseISO } from "date-fns";

import PagamentosFornecedoresList from "../components/pagamentosFornecedores/PagamentosFornecedoresList";
import PagarDialog from "../components/pagamentosFornecedores/PagarDialog";

export default function PagamentosFornecedores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [unidadeFilter, setUnidadeFilter] = useState("todos");
  const [showPagarDialog, setShowPagarDialog] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState(null);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pagamentos = [], isLoading } = useQuery({
    queryKey: ['pagamentosFornecedores'],
    queryFn: () => base44.entities.PagamentoFornecedor.list('-data_vencimento'),
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PagamentoFornecedor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentosFornecedores'] });
      setShowPagarDialog(false);
      setSelectedPagamento(null);
    },
  });

  // Atualizar status de pagamentos atrasados
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
          await base44.entities.PagamentoFornecedor.update(pag.id, {
            ...pag,
            status: 'atrasado'
          });
        } catch (error) {
          console.error('Erro ao atualizar status:', error);
        }
      }

      if (pagamentosParaAtualizar.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['pagamentosFornecedores'] });
      }
    };

    if (pagamentos.length > 0) {
      atualizarStatusAtrasados();
    }
  }, [pagamentos, queryClient]);

  const filteredItems = pagamentos.filter(item => {
    if (!fornecedores || !unidades) return false;

    const fornecedor = fornecedores.find(f => f.id === item.fornecedor_id);
    const unidade = unidades.find(u => u.id === item.unidade_id);
    
    const matchesSearch = 
      fornecedor?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade?.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || item.status === statusFilter;
    const matchesUnidade = unidadeFilter === "todos" || item.unidade_id === unidadeFilter;
    
    return matchesSearch && matchesStatus && matchesUnidade;
  });

  const totalPendente = filteredItems
    .filter(p => p.status === 'pendente' || p.status === 'atrasado')
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const totalPago = filteredItems
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + (p.valor_total_pago || p.valor || 0), 0);

  const handlePagar = (pagamento) => {
    setSelectedPagamento(pagamento);
    setShowPagarDialog(true);
  };

  const handleCancelar = (pagamento) => {
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

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Pagamentos de Fornecedores</h1>
          <p className="text-gray-600 mt-1">Gerencie os pagamentos aos fornecedores</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600 mb-1">A Pagar</p>
          <p className="text-2xl font-bold text-yellow-600">
            R$ {(totalPendente || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Pago</p>
          <p className="text-2xl font-bold text-green-600">
            R$ {(totalPago || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar pagamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pendente">Pendentes</TabsTrigger>
            <TabsTrigger value="atrasado">Atrasados</TabsTrigger>
            <TabsTrigger value="pago">Pagos</TabsTrigger>
          </TabsList>
        </Tabs>

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

      <PagamentosFornecedoresList
        items={filteredItems}
        fornecedores={fornecedores}
        unidades={unidades}
        isLoading={isLoading}
        userRole={user?.role}
        onPagar={handlePagar}
        onCancelar={handleCancelar}
      />

      {showPagarDialog && selectedPagamento && (
        <PagarDialog
          pagamento={selectedPagamento}
          fornecedor={fornecedores.find(f => f.id === selectedPagamento.fornecedor_id)}
          unidade={unidades.find(u => u.id === selectedPagamento.unidade_id)}
          onClose={() => {
            setShowPagarDialog(false);
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
    </div>
  );
}
