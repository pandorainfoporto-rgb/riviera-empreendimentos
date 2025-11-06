import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, DollarSign, TrendingUp, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

import ComercializacaoForm from "../components/consorcios/ComercializacaoForm.jsx";
import ComercializacaoList from "../components/consorcios/ComercializacaoList.jsx";

export default function ComercializacaoConsorcios() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['comercializacaoConsorcios'],
    queryFn: () => base44.entities.ComercializacaoConsorcio.list('-data_venda'),
  });

  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: () => base44.entities.Consorcio.list(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Criar a comercialização
      const comercializacao = await base44.entities.ComercializacaoConsorcio.create(data);
      
      // 2. Gerar conta a receber do cliente se status = vendida
      if (data.status === 'vendida' && data.valor_venda > 0) {
        const consorcio = consorcios.find(c => c.id === data.consorcio_id);
        const cliente = clientes.find(c => c.id === data.cliente_id);
        
        await base44.entities.PagamentoCliente.create({
          cliente_id: data.cliente_id,
          valor: data.valor_venda,
          data_vencimento: data.data_venda,
          status: 'pendente',
          tipo: 'outros',
          observacoes: `Pagamento da venda de cota contemplada - Grupo ${consorcio?.grupo} Cota ${consorcio?.cota} - Cliente: ${cliente?.nome}`,
        });
      }
      
      return comercializacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comercializacaoConsorcios'] });
      queryClient.invalidateQueries({ queryKey: ['pagamentosClientes'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Venda registrada com sucesso! Conta a receber gerada automaticamente.");
    },
    onError: (error) => {
      toast.error("Erro ao registrar venda: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ComercializacaoConsorcio.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comercializacaoConsorcios'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Comercialização atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ComercializacaoConsorcio.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comercializacaoConsorcios'] });
      toast.success("Comercialização excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const filteredItems = items.filter(item => {
    const consorcio = consorcios.find(c => c.id === item.consorcio_id);
    const cliente = clientes.find(c => c.id === item.cliente_id);
    
    return (
      consorcio?.grupo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consorcio?.cota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Estatísticas
  const totalVendas = items.length;
  const valorTotalVendas = items.reduce((sum, item) => sum + (item.valor_venda || 0), 0);
  const lucroTotal = items.reduce((sum, item) => sum + (item.lucro_reais || 0), 0);
  const vendasNegociacao = items.filter(i => i.status === 'negociacao').length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Comercialização de Consórcios</h1>
          <p className="text-gray-600 mt-1">Gerencie a venda de cotas contempladas</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Venda
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Total de Vendas</p>
                <p className="text-2xl font-bold text-gray-900">{totalVendas}</p>
                <p className="text-xs text-gray-500 mt-1">{vendasNegociacao} em negociação</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500 shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Valor Total</p>
                <p className="text-2xl font-bold text-green-700">
                  R$ {(valorTotalVendas / 1000).toFixed(0)}k
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500 shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Lucro Total</p>
                <p className="text-2xl font-bold text-purple-700">
                  R$ {(lucroTotal / 1000).toFixed(0)}k
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500 shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-orange-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Margem Média</p>
                <p className="text-2xl font-bold text-orange-700">
                  {totalVendas > 0 
                    ? ((lucroTotal / valorTotalVendas) * 100).toFixed(1) 
                    : '0.0'}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500 shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar por grupo, cota, cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {showForm && (
        <ComercializacaoForm
          item={editingItem}
          consorcios={consorcios}
          clientes={clientes}
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

      <ComercializacaoList
        items={filteredItems}
        consorcios={consorcios}
        clientes={clientes}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => {
          if (window.confirm("Deseja excluir esta comercialização?")) {
            deleteMutation.mutate(id);
          }
        }}
      />
    </div>
  );
}