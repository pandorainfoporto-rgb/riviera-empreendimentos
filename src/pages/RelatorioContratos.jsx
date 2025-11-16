import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Calendar, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function RelatorioContratos() {
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [tipoFiltro, setTipoFiltro] = useState("todos");

  const { data: contratos = [] } = useQuery({
    queryKey: ['contratos'],
    queryFn: () => base44.entities.Contrato.list('-created_date'),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const contratosFiltrados = contratos.filter(contrato => {
    const cliente = clientes.find(c => c.id === contrato.cliente_id);
    
    const matchBusca = busca === "" || 
      cliente?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      contrato.numero_contrato?.toLowerCase().includes(busca.toLowerCase()) ||
      contrato.titulo?.toLowerCase().includes(busca.toLowerCase());
    
    const matchStatus = statusFiltro === "todos" || contrato.status === statusFiltro;
    const matchTipo = tipoFiltro === "todos" || contrato.tipo === tipoFiltro;

    return matchBusca && matchStatus && matchTipo;
  });

  const porStatus = {
    rascunho: contratosFiltrados.filter(c => c.status === 'rascunho').length,
    aguardando_assinatura: contratosFiltrados.filter(c => c.status === 'aguardando_assinatura').length,
    assinado: contratosFiltrados.filter(c => c.status === 'assinado').length,
    ativo: contratosFiltrados.filter(c => c.status === 'ativo').length,
    vencido: contratosFiltrados.filter(c => c.status === 'vencido').length,
  };

  const statusColors = {
    rascunho: "bg-gray-100 text-gray-700",
    aguardando_assinatura: "bg-yellow-100 text-yellow-700",
    assinado: "bg-blue-100 text-blue-700",
    ativo: "bg-green-100 text-green-700",
    vencido: "bg-red-100 text-red-700",
  };

  const statusLabels = {
    rascunho: "Rascunho",
    aguardando_assinatura: "Aguardando Assinatura",
    assinado: "Assinado",
    ativo: "Ativo",
    vencido: "Vencido",
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--wine-700)] flex items-center gap-2">
          <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
          Relatório de Contratos
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Contratos gerados e documentos</p>
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{contratosFiltrados.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Assinados</p>
              <p className="text-2xl font-bold text-blue-700">{porStatus.assinado}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Aguardando</p>
              <p className="text-2xl font-bold text-yellow-700">{porStatus.aguardando_assinatura}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Ativos</p>
              <p className="text-2xl font-bold text-green-700">{porStatus.ativo}</p>
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
                placeholder="Buscar contratos..."
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
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="aguardando_assinatura">Aguardando Assinatura</SelectItem>
                <SelectItem value="assinado">Assinado</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                <SelectItem value="venda">Venda</SelectItem>
                <SelectItem value="locacao">Locação</SelectItem>
                <SelectItem value="prestacao_servicos">Prestação de Serviços</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Contratos Gerados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 sm:p-3 font-semibold">Contrato</th>
                  <th className="text-left p-2 sm:p-3 font-semibold hidden sm:table-cell">Cliente</th>
                  <th className="text-left p-2 sm:p-3 font-semibold hidden md:table-cell">Data</th>
                  <th className="text-left p-2 sm:p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {contratosFiltrados.map(contrato => {
                  const cliente = clientes.find(c => c.id === contrato.cliente_id);
                  
                  return (
                    <tr key={contrato.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 sm:p-3">
                        <div className="font-semibold text-gray-900">{contrato.titulo}</div>
                        <div className="text-xs text-gray-500">{contrato.numero_contrato || "N/A"}</div>
                        <div className="text-xs text-gray-500 sm:hidden">{cliente?.nome || "N/A"}</div>
                      </td>
                      <td className="p-2 sm:p-3 hidden sm:table-cell">{cliente?.nome || "N/A"}</td>
                      <td className="p-2 sm:p-3 hidden md:table-cell">
                        {contrato.data_contrato ? format(parseISO(contrato.data_contrato), "dd/MM/yyyy") : "-"}
                      </td>
                      <td className="p-2 sm:p-3">
                        <Badge className={`${statusColors[contrato.status]} text-xs`}>
                          {statusLabels[contrato.status]}
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