import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Search, Filter, ChevronLeft, ChevronRight, 
  Check, X, Calendar, DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import PagarDialog from "../components/pagar/PagarDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Pagar() {
  const [selectedConta, setSelectedConta] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [contaContabilFilter, setContaContabilFilter] = useState("todas");
  const [tipoDespesaFilter, setTipoDespesaFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const queryClient = useQueryClient();

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ['contasPagar'],
    queryFn: () => base44.entities.ContaPagar.list('-data_vencimento'),
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
  });

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
  });

  const { data: tiposDespesa = [] } = useQuery({
    queryKey: ['tiposDespesa'],
    queryFn: () => base44.entities.TipoDespesa.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ContaPagar.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contasPagar'] });
      setShowDialog(false);
      setSelectedConta(null);
      toast.success("Conta criada!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContaPagar.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contasPagar'] });
      setShowDialog(false);
      setSelectedConta(null);
      toast.success("Pagamento registrado!");
    },
  });

  const contasContabeis = [...new Set(contas.map(c => c.conta_contabil).filter(Boolean))];

  const filteredContas = contas.filter(conta => {
    const fornecedor = fornecedores.find(f => f.id === conta.fornecedor_id);
    const matchesSearch = 
      conta.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fornecedor?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.numero_documento?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "todos" ||
      conta.status === statusFilter;
    
    const matchesContaContabil = 
      contaContabilFilter === "todas" ||
      conta.conta_contabil === contaContabilFilter;

    const matchesTipoDespesa = 
      tipoDespesaFilter === "todos" ||
      conta.tipo_despesa_id === tipoDespesaFilter;
    
    return matchesSearch && matchesStatus && matchesContaContabil && matchesTipoDespesa;
  });

  const totalPages = Math.ceil(filteredContas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContas = filteredContas.slice(startIndex, startIndex + itemsPerPage);

  const totaisPorStatus = {
    pendente: contas.filter(c => c.status === 'pendente').reduce((sum, c) => sum + (c.valor || 0), 0),
    pago: contas.filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.valor || 0), 0),
    atrasado: contas.filter(c => c.status === 'atrasado').reduce((sum, c) => sum + (c.valor || 0), 0),
  };

  const handleNovo = () => {
    setSelectedConta(null);
    setShowDialog(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header com botões de ação */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold text-white">Contas a pagar</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleNovo}>
              <Plus className="w-4 h-4 mr-1" />
              Novo
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => {
                if (selectedConta) {
                  setShowDialog(true);
                }
              }}
              disabled={!selectedConta}
            >
              Editar
            </Button>
            <Button size="sm" variant="secondary" disabled={!selectedConta}>Deletar</Button>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => {
                if (selectedConta) {
                  setShowDialog(true);
                }
              }}
              disabled={!selectedConta}
            >
              Pagar
            </Button>
            <Button size="sm" variant="secondary" disabled={!selectedConta}>Cancelar</Button>
            <Button size="sm" variant="secondary" disabled={!selectedConta}>Estornar cancelamento</Button>
            <Button size="sm" variant="secondary" disabled={!selectedConta}>Comprovante</Button>
            <Button size="sm" variant="secondary" disabled={!selectedConta}>Auditoria</Button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-700">
                R$ {totaisPorStatus.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pagos</p>
              <p className="text-2xl font-bold text-green-700">
                R$ {totaisPorStatus.pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Atrasados</p>
              <p className="text-2xl font-bold text-red-700">
                R$ {totaisPorStatus.atrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <X className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por descrição, fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
              <SelectItem value="parcial">Parcial</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tipoDespesaFilter} onValueChange={setTipoDespesaFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo Despesa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              {tiposDespesa.map(tipo => (
                <SelectItem key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={contaContabilFilter} onValueChange={setContaContabilFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Conta Contábil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Contas</SelectItem>
              {contasContabeis.map(conta => (
                <SelectItem key={conta} value={conta}>
                  {conta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Tabela */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12"></TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor aberto</TableHead>
                <TableHead>Valor baixado</TableHead>
                <TableHead>Data/hora baixa</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Valor total pago</TableHead>
                <TableHead>Data pagamento</TableHead>
                <TableHead>Auditoria</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedContas.map((conta) => {
                const fornecedor = fornecedores.find(f => f.id === conta.fornecedor_id);
                const isSelected = selectedConta?.id === conta.id;
                
                return (
                  <TableRow 
                    key={conta.id}
                    className={`cursor-pointer hover:bg-slate-50 ${isSelected ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedConta(conta)}
                    onDoubleClick={() => {
                      setSelectedConta(conta);
                      setShowDialog(true);
                    }}
                  >
                    <TableCell>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => setSelectedConta(isSelected ? null : conta)}
                        className="w-4 h-4"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{conta.id?.substring(0, 8)}</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell>
                      <Badge className={
                        conta.status === 'pago' ? 'bg-green-500' :
                        conta.status === 'atrasado' ? 'bg-red-500' :
                        conta.status === 'pendente' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }>
                        {conta.status === 'pago' ? 'Pago em dia' :
                         conta.status === 'atrasado' ? 'Atrasado' :
                         conta.status === 'pendente' ? 'Pendente' :
                         conta.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{conta.created_date ? format(new Date(conta.created_date), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell>{conta.data_vencimento ? format(new Date(conta.data_vencimento), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell className="font-semibold">
                      {conta.status === 'pago' ? '0,00' : (conta.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {conta.status === 'pago' ? (conta.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                    </TableCell>
                    <TableCell>
                      {conta.data_pagamento ? format(new Date(conta.data_pagamento), 'dd/MM/yyyy HH:mm:ss') : '-'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{fornecedor?.nome || '-'}</TableCell>
                    <TableCell className="font-semibold text-green-700">
                      {conta.status === 'pago' ? (conta.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                    </TableCell>
                    <TableCell>{conta.data_pagamento ? format(new Date(conta.data_pagamento), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell className="text-xs text-gray-500">Não auditado</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredContas.length)} de {filteredContas.length}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
            <ChevronLeft className="w-4 h-4 -ml-2" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-4 py-2 text-sm">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
            <ChevronRight className="w-4 h-4 -ml-2" />
          </Button>
        </div>
      </div>

      {showDialog && (
        <PagarDialog
          conta={selectedConta}
          fornecedores={fornecedores}
          caixas={caixas}
          tiposDespesa={tiposDespesa}
          onClose={() => {
            setShowDialog(false);
            setSelectedConta(null);
          }}
          onSave={(data) => {
            if (selectedConta) {
              updateMutation.mutate({
                id: selectedConta.id,
                data,
              });
            } else {
              createMutation.mutate(data);
            }
          }}
        />
      )}
    </div>
  );
}