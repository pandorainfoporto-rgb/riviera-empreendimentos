import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import LoteForm from "../components/lotes/LoteForm";
import LotesList from "../components/lotes/LotesList";

export default function Lotes() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loteamentoFilter, setLoteamentoFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list('codigo'),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: empreendimentos = [] } = useQuery({
    queryKey: ['empreendimentos'],
    queryFn: () => base44.entities.Empreendimento.list(),
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Criar a unidade (lote)
      const lote = await base44.entities.Unidade.create({
        codigo: data.codigo,
        tipo: "lote",
        empreendimento_id: data.empreendimento_id,
        loteamento_id: data.loteamento_id,
        area_total: data.area_total,
        valor_venda: data.valor_venda,
        status: data.status,
        observacoes: data.observacoes,
      });

      // Criar produto correspondente se solicitado
      if (data.criar_produto) {
        await base44.entities.Produto.create({
          nome: `Lote ${data.codigo}`,
          descricao: `Lote ${data.codigo} - ${data.area_total}m²`,
          categoria: "outros",
          unidade_medida: "unidade",
          valor_unitario: data.valor_venda,
          fornecedor_padrao_id: data.fornecedor_padrao_id || null,
          codigo_referencia: data.codigo,
          ativo: true,
          observacoes: `Produto gerado automaticamente do lote ${data.codigo}`,
        });
      }

      return lote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Atualizar a unidade (lote)
      const lote = await base44.entities.Unidade.update(id, {
        codigo: data.codigo,
        tipo: "lote",
        empreendimento_id: data.empreendimento_id,
        loteamento_id: data.loteamento_id,
        area_total: data.area_total,
        valor_venda: data.valor_venda,
        status: data.status,
        observacoes: data.observacoes,
      });

      // Se tem produtos com o mesmo código de referência, atualizar
      const produtos = await base44.entities.Produto.list();
      const produtoVinculado = produtos.find(p => p.codigo_referencia === data.codigo);
      
      if (produtoVinculado) {
        await base44.entities.Produto.update(produtoVinculado.id, {
          ...produtoVinculado,
          nome: `Lote ${data.codigo}`,
          descricao: `Lote ${data.codigo} - ${data.area_total}m²`,
          valor_unitario: data.valor_venda,
          fornecedor_padrao_id: data.fornecedor_padrao_id || produtoVinculado.fornecedor_padrao_id,
        });
      }

      return lote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Unidade.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
    },
  });

  // Filtrar apenas lotes
  const lotes = items.filter(item => item.tipo === 'lote');

  const filteredItems = lotes.filter(item => {
    const matchesSearch = 
      item.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLoteamento = loteamentoFilter === "todos" || item.loteamento_id === loteamentoFilter;
    const matchesStatus = statusFilter === "todos" || item.status === statusFilter;
    
    return matchesSearch && matchesLoteamento && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--wine-700)]">Cadastro de Lotes</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Gerencie os lotes e integre com produtos</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Lote
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <Input
            placeholder="Buscar lotes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 sm:pl-10"
          />
        </div>
        
        <Select value={loteamentoFilter} onValueChange={setLoteamentoFilter}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Filtrar por loteamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Loteamentos</SelectItem>
            {loteamentos.map(lot => (
              <SelectItem key={lot.id} value={lot.id}>
                {lot.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="reservada">Reservado</SelectItem>
            <SelectItem value="vendida">Vendido</SelectItem>
            <SelectItem value="escriturada">Escriturado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showForm && (
        <LoteForm
          item={editingItem}
          loteamentos={loteamentos}
          empreendimentos={empreendimentos}
          fornecedores={fornecedores}
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

      <LotesList
        items={filteredItems}
        loteamentos={loteamentos}
        empreendimentos={empreendimentos}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}