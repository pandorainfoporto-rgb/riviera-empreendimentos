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
import { format, parseISO, isBefore } from "date-fns";
import ReceberDialog from "../components/receber/ReceberDialog";
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

export default function Receber() {
  const [selectedConta, setSelectedConta] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const queryClient = useQueryClient();

  const { data: pagamentosClientes = [] } = useQuery({
    queryKey: ['pagamentosClientes'],
    queryFn: () => base44.entities.PagamentoCliente.list('-data_vencimento'),
  });

  const { data: aporteSocios = [] } = useQuery({
    queryKey: ['aportesSocios'],
    queryFn: () => base44.entities.AporteSocio.list('-data_prevista'),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: socios = [] } = useQuery({
    queryKey: ['socios'],
    queryFn: () => base44.entities.Socio.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
  });

  const contas = [
    ...pagamentosClientes.map(p => ({
      ...p,
      tipo_titulo: 'cliente',
      descricao: `Parcela de ${clientes.find(c => c.id === p.cliente_id)?.nome || 'Cliente'}`,
      nome_pagador: clientes.find(c => c.id === p.cliente_id)?.nome,
    })),
    ...aporteSocios.map(a => ({
      ...a,
      tipo_titulo: 'socio',
      descricao: `Aporte - ${socios.find(s => s.id === a.socio_id)?.nome || 'Sócio'}`,
      nome_pagador: socios.find(s => s.id === a.socio_id)?.nome,
      data_vencimento: a.data_prevista,
      data_pagamento: a.data_efetiva,
    })),
  ];

  const updatePagamentoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PagamentoCliente.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentosClientes'] });
      setShowDialog(false);
      setSelectedConta(null);
      toast.success("Recebimento registrado!");
    },
  });

  const updateAporteMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AporteSocio.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aportesSocios'] });
      setShowDialog(false);
      setSelectedConta(null);
      toast.success("Aporte registrado!");
    },
  });

  const filteredContas = contas.filter(conta => {
    const matchesSearch = 
      conta.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.nome_pagador?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "todos" ||
      conta.status === statusFilter;

    const matchesTipo = 
      tipoFilter === "todos" ||
      conta.tipo_titulo === tipoFilter;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  const totalPages = Math.ceil(filteredContas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContas = filteredContas.slice(startIndex, startIndex + itemsPerPage);

  const totaisPorStatus = {
    pendente: contas.filter(c => c.status === 'pendente').reduce((sum, c) => sum + (c.valor || 0), 0),
    pago: contas.filter(c => c.status === 'pago' || c.status === 'recebido').reduce((sum, c) => sum + (c.valor || 0), 0),
    atrasado: contas.filter(c => c.status === 'atrasado').reduce((sum, c) => sum + (c.valor || 0), 0),
  };

  const handleNovo = () => {
    setSelectedConta(null);
    setShowDialog(true);
  };

  const handleReceber = (conta) => {
    setSelectedConta(conta);
    setShowDialog(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold text-white">Contas a receber</h1>
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
              onClick={() => handleReceber(selectedConta)}
              disabled={!selectedConta}
            >
              Receber
            </Button>
            <Button size="sm" variant="secondary" disabled={!selectedConta}>Cancelar</Button>
            <Button size="sm" variant="secondary" disabled={!selectedConta}>Estornar cancelamento</Button>
            <Button size="sm" variant="secondary" disabled={!selectedConta}>Comprovante</Button>
            <Button size="sm" variant="secondary" disabled={!selectedConta}>Auditoria</Button>
          </div>
        </div>
      </div>

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
              <p className="text-sm text-gray-600">Recebidos</p>
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

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por descrição, cliente, sócio..."
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
              <SelectItem value="recebido">Recebido</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
              <SelectItem value="parcial">Parcial</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              <SelectItem value="cliente">Clientes</SelectItem>
              <SelectItem value="socio">Sócios</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12"></TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor aberto</TableHead>
                <TableHead>Valor baixado</TableHead>
                <TableHead>Data/hora baixa</TableHead>
                <TableHead>Pagador</TableHead>
                <TableHead>Valor total recebido</TableHead>
                <TableHead>Data recebimento</TableHead>
                <TableHead>Auditoria</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedContas.map((conta) => {
                const isSelected = selectedConta?.id === conta.id;
                const isPago = conta.status === 'pago' || conta.status === 'recebido';
                
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
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {conta.tipo_titulo === 'cliente' ? '👤 Cliente' : '🤝 Sócio'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        isPago ? 'bg-green-500' :
                        conta.status === 'atrasado' ? 'bg-red-500' :
                        conta.status === 'pendente' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }>
                        {isPago ? 'Recebido' :
                         conta.status === 'atrasado' ? 'Atrasado' :
                         conta.status === 'pendente' ? 'Pendente' :
                         conta.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{conta.created_date ? format(new Date(conta.created_date), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell>{conta.data_vencimento ? format(parseISO(conta.data_vencimento), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell className="font-semibold">
                      {isPago ? '0,00' : (conta.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {isPago ? (conta.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                    </TableCell>
                    <TableCell>
                      {conta.data_pagamento || conta.data_efetiva ? 
                        format(parseISO(conta.data_pagamento || conta.data_efetiva), 'dd/MM/yyyy HH:mm:ss') : '-'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{conta.nome_pagador || '-'}</TableCell>
                    <TableCell className="font-semibold text-green-700">
                      {isPago ? (conta.valor_total_recebido || conta.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                    </TableCell>
                    <TableCell>
                      {conta.data_pagamento || conta.data_efetiva ? 
                        format(parseISO(conta.data_pagamento || conta.data_efetiva), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">Não auditado</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

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
        <ReceberDialog
          conta={selectedConta}
          clientes={clientes}
          socios={socios}
          unidades={unidades}
          caixas={caixas}
          onClose={() => {
            setShowDialog(false);
            setSelectedConta(null);
          }}
          onSave={(data) => {
            if (selectedConta.tipo_titulo === 'cliente') {
              updatePagamentoMutation.mutate({
                id: selectedConta.id,
                data,
              });
            } else {
              updateAporteMutation.mutate({
                id: selectedConta.id,
                data,
              });
            }
          }}
        />
      )}
    </div>
  );
}