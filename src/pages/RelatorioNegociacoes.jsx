import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSignature, Search, TrendingUp, DollarSign, Calendar, Building2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RelatorioNegociacoes() {
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [loteamentoFiltro, setLoteamentoFiltro] = useState("todos");

  const { data: negociacoes = [] } = useQuery({
    queryKey: ['negociacoes'],
    queryFn: () => base44.entities.Negociacao.list('-created_date'),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const negociacoesFiltradas = negociacoes.filter(neg => {
    const cliente = clientes.find(c => c.id === neg.cliente_id);
    const unidade = unidades.find(u => u.id === neg.unidade_id);
    const loteamento = unidade ? loteamentos.find(l => l.id === unidade.loteamento_id) : null;

    const matchBusca = busca === "" || 
      cliente?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      unidade?.codigo?.toLowerCase().includes(busca.toLowerCase());
    
    const matchStatus = statusFiltro === "todos" || neg.status === statusFiltro;
    const matchLoteamento = loteamentoFiltro === "todos" || unidade?.loteamento_id === loteamentoFiltro;

    return matchBusca && matchStatus && matchLoteamento;
  });

  const valorTotal = negociacoesFiltradas.reduce((acc, neg) => acc + (neg.valor_total || 0), 0);
  const valorEntrada = negociacoesFiltradas.reduce((acc, neg) => acc + (neg.valor_entrada || 0), 0);
  
  const porStatus = {
    ativa: negociacoesFiltradas.filter(n => n.status === 'ativa').length,
    aguardando_assinatura_contrato: negociacoesFiltradas.filter(n => n.status === 'aguardando_assinatura_contrato').length,
    contrato_assinado: negociacoesFiltradas.filter(n => n.status === 'contrato_assinado').length,
    finalizada: negociacoesFiltradas.filter(n => n.status === 'finalizada').length,
    cancelada: negociacoesFiltradas.filter(n => n.status === 'cancelada').length,
  };

  const statusColors = {
    ativa: "bg-green-100 text-green-700",
    aguardando_assinatura_contrato: "bg-yellow-100 text-yellow-700",
    contrato_assinado: "bg-blue-100 text-blue-700",
    finalizada: "bg-purple-100 text-purple-700",
    cancelada: "bg-red-100 text-red-700",
  };

  const statusLabels = {
    ativa: "Ativa",
    aguardando_assinatura_contrato: "Aguardando Assinatura",
    contrato_assinado: "Contrato Assinado",
    finalizada: "Finalizada",
    cancelada: "Cancelada",
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--wine-700)] flex items-center gap-2">
          <FileSignature className="w-6 h-6 sm:w-8 sm:h-8" />
          Relatório de Negociações
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Análise completa das negociações em andamento</p>
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Negociações</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{negociacoesFiltradas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Valor Total</p>
                <p className="text-lg sm:text-2xl font-bold text-green-700">
                  R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Entrada</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-700">
                  R$ {valorEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Ativas</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-700">{porStatus.ativa}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por cliente ou unidade..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="aguardando_assinatura_contrato">Aguardando Assinatura</SelectItem>
                <SelectItem value="contrato_assinado">Contrato Assinado</SelectItem>
                <SelectItem value="finalizada">Finalizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={loteamentoFiltro} onValueChange={setLoteamentoFiltro}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Filtrar por loteamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Loteamentos</SelectItem>
                {loteamentos.map(lot => (
                  <SelectItem key={lot.id} value={lot.id}>{lot.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição por Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {Object.entries(porStatus).map(([status, count]) => (
              <div key={status} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <Badge className={`${statusColors[status]} mb-2 text-xs`}>
                  {statusLabels[status]}
                </Badge>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Negociações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Negociações Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 sm:p-3 font-semibold">Cliente</th>
                  <th className="text-left p-2 sm:p-3 font-semibold hidden sm:table-cell">Unidade</th>
                  <th className="text-left p-2 sm:p-3 font-semibold">Valor</th>
                  <th className="text-left p-2 sm:p-3 font-semibold hidden md:table-cell">Data</th>
                  <th className="text-left p-2 sm:p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {negociacoesFiltradas.map(neg => {
                  const cliente = clientes.find(c => c.id === neg.cliente_id);
                  const unidade = unidades.find(u => u.id === neg.unidade_id);
                  
                  return (
                    <tr key={neg.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 sm:p-3">
                        <div className="font-semibold text-gray-900">{cliente?.nome || "N/A"}</div>
                        <div className="text-xs text-gray-500 sm:hidden">{unidade?.codigo || "N/A"}</div>
                      </td>
                      <td className="p-2 sm:p-3 hidden sm:table-cell">{unidade?.codigo || "N/A"}</td>
                      <td className="p-2 sm:p-3 font-semibold text-green-700">
                        R$ {(neg.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 sm:p-3 hidden md:table-cell">
                        {neg.data_inicio ? format(parseISO(neg.data_inicio), "dd/MM/yyyy") : "-"}
                      </td>
                      <td className="p-2 sm:p-3">
                        <Badge className={`${statusColors[neg.status]} text-xs`}>
                          {statusLabels[neg.status]}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}