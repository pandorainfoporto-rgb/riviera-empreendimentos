import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, Upload, FileText, FileInput } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ComprasList from "../components/compras/ComprasList";
import ImportarXmlDialog from "../components/compras/ImportarXmlDialog";
import CompraManualForm from "../components/compras/CompraManualForm";
import ImportarOrcamentoDialog from "../components/compras/ImportarOrcamentoDialog";

export default function Compras() {
  const [showImportXml, setShowImportXml] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showImportOrcamento, setShowImportOrcamento] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fornecedorFilter, setFornecedorFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const queryClient = useQueryClient();

  const { data: compras = [], isLoading } = useQuery({
    queryKey: ['compras'],
    queryFn: () => base44.entities.CompraNotaFiscal.list('-data_emissao'),
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => base44.entities.Produto.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CompraNotaFiscal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
    },
  });

  const filteredItems = compras.filter(item => {
    const fornecedor = fornecedores.find(f => f.id === item.fornecedor_id);
    
    const matchesSearch = 
      item.numero_nota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.chave_acesso?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fornecedor?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFornecedor = fornecedorFilter === "todos" || item.fornecedor_id === fornecedorFilter;
    const matchesStatus = statusFilter === "todos" || item.status === statusFilter;
    
    return matchesSearch && matchesFornecedor && matchesStatus;
  });

  const totalCompras = compras.reduce((sum, c) => sum + (c.valor_total || 0), 0);
  const comprasPendentes = compras.filter(c => c.status === 'pendente').length;
  const comprasProcessadas = compras.filter(c => c.status === 'processada').length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Compras e Notas Fiscais</h1>
          <p className="text-gray-600 mt-1">Gerencie compras de materiais e produtos</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => setShowImportOrcamento(true)}
            variant="outline"
            className="hover:bg-purple-50 hover:border-purple-400"
          >
            <FileInput className="w-4 h-4 mr-2" />
            Importar Orçamento
          </Button>
          <Button
            onClick={() => setShowManualForm(true)}
            variant="outline"
            className="hover:bg-[var(--wine-100)] hover:border-[var(--wine-400)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Compra Manual
          </Button>
          <Button
            onClick={() => setShowImportXml(true)}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar XML
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total em Compras</p>
              <p className="text-2xl font-bold text-blue-600">
                R$ {totalCompras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <FileText className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{comprasPendentes}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Processadas</p>
              <p className="text-2xl font-bold text-green-600">{comprasProcessadas}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por número, chave de acesso ou fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={fornecedorFilter} onValueChange={setFornecedorFilter}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Filtrar por fornecedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Fornecedores</SelectItem>
            {fornecedores.map(forn => (
              <SelectItem key={forn.id} value={forn.id}>
                {forn.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pendente">Pendentes</TabsTrigger>
            <TabsTrigger value="processada">Processadas</TabsTrigger>
            <TabsTrigger value="cancelada">Canceladas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ComprasList
        items={filteredItems}
        fornecedores={fornecedores}
        unidades={unidades}
        isLoading={isLoading}
        onDelete={(id) => {
          if (window.confirm('Deseja realmente excluir esta compra?')) {
            deleteMutation.mutate(id);
          }
        }}
      />

      {showImportXml && (
        <ImportarXmlDialog
          fornecedores={fornecedores}
          unidades={unidades}
          produtos={produtos}
          onClose={() => setShowImportXml(false)}
          onSuccess={() => {
            setShowImportXml(false);
            queryClient.invalidateQueries({ queryKey: ['compras'] });
            queryClient.invalidateQueries({ queryKey: ['produtos'] });
            queryClient.invalidateQueries({ queryKey: ['pagamentosFornecedores'] });
          }}
        />
      )}

      {showManualForm && (
        <CompraManualForm
          fornecedores={fornecedores}
          unidades={unidades}
          produtos={produtos}
          onClose={() => setShowManualForm(false)}
          onSuccess={() => {
            setShowManualForm(false);
            queryClient.invalidateQueries({ queryKey: ['compras'] });
            queryClient.invalidateQueries({ queryKey: ['produtos'] });
            queryClient.invalidateQueries({ queryKey: ['pagamentosFornecedores'] });
          }}
        />
      )}

      {showImportOrcamento && (
        <ImportarOrcamentoDialog
          fornecedores={fornecedores}
          unidades={unidades}
          produtos={produtos}
          onClose={() => setShowImportOrcamento(false)}
          onSuccess={() => {
            setShowImportOrcamento(false);
            queryClient.invalidateQueries({ queryKey: ['compras'] });
            queryClient.invalidateQueries({ queryKey: ['produtos'] });
            queryClient.invalidateQueries({ queryKey: ['pagamentosFornecedores'] });
          }}
        />
      )}
    </div>
  );
}