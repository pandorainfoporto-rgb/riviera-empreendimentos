import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Search, DollarSign, Users } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function RelatorioComissoes() {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [statusFiltro, setStatusFiltro] = useState("todos");

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentosFornecedores'],
    queryFn: async () => {
      const pags = await base44.entities.PagamentoFornecedor.filter({
        tipo: { $in: ['comissao_imobiliaria', 'comissao_corretor'] }
      });
      return pags || [];
    },
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
  });

  const { data: negociacoes = [] } = useQuery({
    queryKey: ['negociacoes'],
    queryFn: () => base44.entities.Negociacao.list(),
  });

  const pagamentosFiltrados = pagamentos.filter(pag => {
    const fornecedor = fornecedores.find(f => f.id === pag.fornecedor_id);
    
    const matchBusca = busca === "" || 
      fornecedor?.nome?.toLowerCase().includes(busca.toLowerCase());
    
    const matchTipo = tipoFiltro === "todos" || pag.tipo === tipoFiltro;
    const matchStatus = statusFiltro === "todos" || pag.status === statusFiltro;

    return matchBusca && matchTipo && matchStatus;
  });

  const valorTotal = pagamentosFiltrados.reduce((acc, pag) => acc + (pag.valor || 0), 0);
  const valorPago = pagamentosFiltrados.filter(p => p.status === 'pago').reduce((acc, pag) => acc + (pag.valor || 0), 0);
  const valorPendente = pagamentosFiltrados.filter(p => p.status === 'pendente').reduce((acc, pag) => acc + (pag.valor || 0), 0);

  const statusColors = {
    pendente: "bg-yellow-100 text-yellow-700",
    pago: "bg-green-100 text-green-700",
    atrasado: "bg-red-100 text-red-700",
    cancelado: "bg-gray-100 text-gray-700",
  };

  const statusLabels = {
    pendente: "Pendente",
    pago: "Pago",
    atrasado: "Atrasado",
    cancelado: "Cancelado",
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--wine-700)] flex items-center gap-2">
          <Award className="w-6 h-6 sm:w-8 sm:h-8" />
          Relatório de Comissões
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Comissões de imobiliárias e corretores</p>
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Comissões</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-700">
                  R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
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
                <p className="text-xs sm:text-sm text-gray-600">Pagas</p>
                <p className="text-lg sm:text-2xl font-bold text-green-700">
                  R$ {valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Pendentes</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-700">
                  R$ {valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por fornecedor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                <SelectItem value="comissao_imobiliaria">Imobiliária</SelectItem>
                <SelectItem value="comissao_corretor">Corretor</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Comissões Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 sm:p-3 font-semibold">Fornecedor</th>
                  <th className="text-left p-2 sm:p-3 font-semibold hidden sm:table-cell">Tipo</th>
                  <th className="text-left p-2 sm:p-3 font-semibold">Valor</th>
                  <th className="text-left p-2 sm:p-3 font-semibold hidden md:table-cell">Vencimento</th>
                  <th className="text-left p-2 sm:p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {pagamentosFiltrados.map(pag => {
                  const fornecedor = fornecedores.find(f => f.id === pag.fornecedor_id);
                  
                  return (
                    <tr key={pag.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 sm:p-3">
                        <div className="font-semibold text-gray-900">{fornecedor?.nome || "N/A"}</div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {pag.tipo === 'comissao_imobiliaria' ? 'Imobiliária' : 'Corretor'}
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 hidden sm:table-cell">
                        <Badge className="bg-purple-100 text-purple-700 text-xs">
                          {pag.tipo === 'comissao_imobiliaria' ? 'Imobiliária' : 'Corretor'}
                        </Badge>
                      </td>
                      <td className="p-2 sm:p-3 font-semibold text-green-700">
                        R$ {(pag.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 sm:p-3 hidden md:table-cell">
                        {pag.data_vencimento ? format(parseISO(pag.data_vencimento), "dd/MM/yyyy") : "-"}
                      </td>
                      <td className="p-2 sm:p-3">
                        <Badge className={`${statusColors[pag.status]} text-xs`}>
                          {statusLabels[pag.status]}
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