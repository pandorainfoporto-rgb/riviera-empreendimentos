import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Filter, MapPin, TrendingUp, DollarSign, Ruler, 
  FileBarChart, Download, Search, X
} from "lucide-react";
import { InputCurrency } from "../components/ui/input-currency";
import ExportarRelatorio from "../components/relatorios/ExportarRelatorio";

export default function RelatorioFiltrosLotes() {
  const [filtros, setFiltros] = useState({
    loteamentoId: "todos",
    status: "todos",
    precoMin: "",
    precoMax: "",
    areaMin: "",
    areaMax: "",
    busca: ""
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: todosLotes = [] } = useQuery({
    queryKey: ['lotes_relatorio'],
    queryFn: () => base44.entities.Lote.list(),
  });

  const lotesFiltrados = todosLotes.filter((lote) => {
    if (filtros.loteamentoId !== "todos" && lote.loteamento_id !== filtros.loteamentoId) return false;
    if (filtros.status !== "todos" && lote.status !== filtros.status) return false;
    if (filtros.precoMin && lote.valor_total < parseFloat(filtros.precoMin)) return false;
    if (filtros.precoMax && lote.valor_total > parseFloat(filtros.precoMax)) return false;
    if (filtros.areaMin && lote.area < parseFloat(filtros.areaMin)) return false;
    if (filtros.areaMax && lote.area > parseFloat(filtros.areaMax)) return false;
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      const matchNumero = lote.numero?.toLowerCase().includes(busca);
      const matchQuadra = lote.quadra?.toLowerCase().includes(busca);
      if (!matchNumero && !matchQuadra) return false;
    }
    return true;
  });

  const limparFiltros = () => {
    setFiltros({
      loteamentoId: "todos",
      status: "todos",
      precoMin: "",
      precoMax: "",
      areaMin: "",
      areaMax: "",
      busca: ""
    });
  };

  const estatisticas = {
    total: lotesFiltrados.length,
    disponiveis: lotesFiltrados.filter(l => l.status === 'disponivel').length,
    reservados: lotesFiltrados.filter(l => l.status === 'reservado').length,
    vendidos: lotesFiltrados.filter(l => l.status === 'vendido').length,
    valorTotal: lotesFiltrados.reduce((sum, l) => sum + (l.valor_total || 0), 0),
    areaTotal: lotesFiltrados.reduce((sum, l) => sum + (l.area || 0), 0),
    precoMedioM2: lotesFiltrados.length > 0 
      ? lotesFiltrados.reduce((sum, l) => sum + (l.valor_m2 || 0), 0) / lotesFiltrados.length 
      : 0,
  };

  const dadosExportacao = lotesFiltrados.map(lote => {
    const loteamento = loteamentos.find(lot => lot.id === lote.loteamento_id);
    return {
      'Loteamento': loteamento?.nome || '',
      'Número': lote.numero || '',
      'Quadra': lote.quadra || '',
      'Área (m²)': lote.area || 0,
      'Valor/m²': lote.valor_m2 || 0,
      'Valor Total': lote.valor_total || 0,
      'Status': lote.status || '',
      'Cliente': lote.cliente_id ? 'Sim' : 'Não',
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Lotes com Filtros</h1>
          <p className="text-gray-600 mt-1">Análise detalhada com filtros avançados</p>
        </div>
        <ExportarRelatorio 
          dados={dadosExportacao} 
          nomeArquivo="relatorio_lotes_filtrado"
        />
      </div>

      {/* Filtros */}
      <Card className="border-2 border-[var(--wine-300)]">
        <CardHeader className="bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)]">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros Avançados
            </span>
            {(filtros.loteamentoId !== "todos" || filtros.status !== "todos" || 
              filtros.precoMin || filtros.precoMax || filtros.areaMin || 
              filtros.areaMax || filtros.busca) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limparFiltros}
                className="text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Loteamento</Label>
              <Select value={filtros.loteamentoId} onValueChange={(v) => setFiltros({...filtros, loteamentoId: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {loteamentos.map(lot => (
                    <SelectItem key={lot.id} value={lot.id}>{lot.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={filtros.status} onValueChange={(v) => setFiltros({...filtros, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="em_negociacao">Em Negociação</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Buscar Número/Quadra</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Ex: 15 ou Quadra A"
                  value={filtros.busca}
                  onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Preço Mínimo</Label>
              <InputCurrency
                value={filtros.precoMin}
                onChange={(e) => setFiltros({...filtros, precoMin: e.target.value})}
                placeholder="R$ 0,00"
              />
            </div>
            <div>
              <Label>Preço Máximo</Label>
              <InputCurrency
                value={filtros.precoMax}
                onChange={(e) => setFiltros({...filtros, precoMax: e.target.value})}
                placeholder="R$ 0,00"
              />
            </div>
            <div>
              <Label>Área Mínima (m²)</Label>
              <Input
                type="number"
                value={filtros.areaMin}
                onChange={(e) => setFiltros({...filtros, areaMin: e.target.value})}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Área Máxima (m²)</Label>
              <Input
                type="number"
                value={filtros.areaMax}
                onChange={(e) => setFiltros({...filtros, areaMax: e.target.value})}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <p className="text-sm text-gray-600">
              <strong className="text-[var(--wine-700)]">{lotesFiltrados.length}</strong> de{" "}
              <strong>{todosLotes.length}</strong> lotes encontrados
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <p className="text-xs text-gray-600">Total</p>
            </div>
            <p className="text-2xl font-bold">{estatisticas.total}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <p className="text-xs text-gray-600">Disponíveis</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{estatisticas.disponiveis}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-yellow-600" />
              <p className="text-xs text-gray-600">Reservados</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{estatisticas.reservados}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-red-600" />
              <p className="text-xs text-gray-600">Vendidos</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{estatisticas.vendidos}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-gray-600">Valor Total</p>
            </div>
            <p className="text-sm font-bold text-purple-600">
              R$ {(estatisticas.valorTotal / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-gray-600">Área Total</p>
            </div>
            <p className="text-sm font-bold text-blue-600">
              {estatisticas.areaTotal.toFixed(0)} m²
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5" />
            Resultados da Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lotesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Nenhum lote encontrado com os filtros aplicados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 text-left text-sm font-semibold">Loteamento</th>
                    <th className="p-3 text-left text-sm font-semibold">Número</th>
                    <th className="p-3 text-left text-sm font-semibold">Quadra</th>
                    <th className="p-3 text-right text-sm font-semibold">Área (m²)</th>
                    <th className="p-3 text-right text-sm font-semibold">Valor/m²</th>
                    <th className="p-3 text-right text-sm font-semibold">Valor Total</th>
                    <th className="p-3 text-center text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lotesFiltrados.map((lote) => {
                    const loteamento = loteamentos.find(l => l.id === lote.loteamento_id);
                    const statusColors = {
                      disponivel: 'bg-green-100 text-green-800',
                      reservado: 'bg-yellow-100 text-yellow-800',
                      em_negociacao: 'bg-blue-100 text-blue-800',
                      vendido: 'bg-red-100 text-red-800',
                    };

                    return (
                      <tr key={lote.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">{loteamento?.nome || '-'}</td>
                        <td className="p-3 text-sm font-semibold">{lote.numero}</td>
                        <td className="p-3 text-sm">{lote.quadra || '-'}</td>
                        <td className="p-3 text-sm text-right">{lote.area?.toFixed(2) || 0}</td>
                        <td className="p-3 text-sm text-right">
                          R$ {(lote.valor_m2 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-sm text-right font-semibold text-green-700">
                          R$ {(lote.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={statusColors[lote.status]}>
                            {lote.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}