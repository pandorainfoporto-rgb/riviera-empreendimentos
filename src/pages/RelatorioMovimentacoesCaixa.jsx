import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, TrendingDown, Wallet, Calendar, Download, 
  Filter, ArrowUpCircle, ArrowDownCircle, DollarSign 
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function RelatorioMovimentacoesCaixa() {
  const [caixaSelecionado, setCaixaSelecionado] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [categoriaFilter, setCategoriaFilter] = useState("todos");

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
  });

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ['movimentacoes_caixa'],
    queryFn: () => base44.entities.MovimentacaoCaixa.list('-data_movimentacao'),
  });

  const { data: gateways = [] } = useQuery({
    queryKey: ['configuracoes_gateway'],
    queryFn: () => base44.entities.ConfiguracaoGateway.list(),
  });

  // Filtrar movimentações
  const movimentacoesFiltradas = movimentacoes.filter(mov => {
    const matchesCaixa = caixaSelecionado === "todos" || mov.caixa_id === caixaSelecionado;
    const matchesTipo = tipoFilter === "todos" || mov.tipo === tipoFilter;
    const matchesCategoria = categoriaFilter === "todos" || mov.categoria === categoriaFilter;

    let matchesData = true;
    if (dataInicio) {
      matchesData = matchesData && (mov.data_movimentacao >= dataInicio);
    }
    if (dataFim) {
      matchesData = matchesData && (mov.data_movimentacao <= dataFim);
    }

    return matchesCaixa && matchesTipo && matchesCategoria && matchesData;
  });

  // Estatísticas
  const totalEntradas = movimentacoesFiltradas
    .filter(m => m.tipo === 'entrada')
    .reduce((sum, m) => sum + (m.valor || 0), 0);

  const totalSaidas = movimentacoesFiltradas
    .filter(m => m.tipo === 'saida')
    .reduce((sum, m) => sum + (m.valor || 0), 0);

  const saldoLiquido = totalEntradas - totalSaidas;

  // Dados por categoria
  const dadosPorCategoria = {};
  movimentacoesFiltradas.forEach(mov => {
    if (!dadosPorCategoria[mov.categoria]) {
      dadosPorCategoria[mov.categoria] = { entradas: 0, saidas: 0 };
    }
    if (mov.tipo === 'entrada') {
      dadosPorCategoria[mov.categoria].entradas += mov.valor || 0;
    } else {
      dadosPorCategoria[mov.categoria].saidas += mov.valor || 0;
    }
  });

  const dadosGraficoCategoria = Object.keys(dadosPorCategoria).map(categoria => ({
    categoria: categoria.replace(/_/g, ' '),
    entradas: dadosPorCategoria[categoria].entradas,
    saidas: dadosPorCategoria[categoria].saidas,
  }));

  // Dados para gráfico de pizza
  const entradasPorCategoria = Object.keys(dadosPorCategoria).map(categoria => ({
    name: categoria.replace(/_/g, ' '),
    value: dadosPorCategoria[categoria].entradas,
  })).filter(item => item.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

  const exportarCSV = () => {
    const headers = ['Data', 'Caixa', 'Tipo', 'Categoria', 'Valor', 'Descrição'];
    const rows = movimentacoesFiltradas.map(mov => {
      const caixa = caixas.find(c => c.id === mov.caixa_id);
      return [
        mov.data_movimentacao,
        caixa?.nome || 'N/A',
        mov.tipo,
        mov.categoria,
        mov.valor,
        mov.descricao || ''
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movimentacoes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Movimentações por Caixa</h1>
          <p className="text-gray-600 mt-1">Análise detalhada das movimentações de cada caixa</p>
        </div>
        <Button onClick={exportarCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Caixa</Label>
              <Select value={caixaSelecionado} onValueChange={setCaixaSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Caixas</SelectItem>
                  {caixas.map(caixa => (
                    <SelectItem key={caixa.id} value={caixa.id}>
                      {caixa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="recebimento_cliente">Recebimento Cliente</SelectItem>
                  <SelectItem value="pagamento_fornecedor">Pagamento Fornecedor</SelectItem>
                  <SelectItem value="aporte_socio">Aporte Sócio</SelectItem>
                  <SelectItem value="taxa_gateway">Taxa Gateway</SelectItem>
                  <SelectItem value="custo_operacao">Custo Operação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Entradas</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ArrowUpCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Saídas</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ArrowDownCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${saldoLiquido >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Saldo Líquido</p>
                <p className={`text-2xl font-bold ${saldoLiquido >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  R$ {saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${saldoLiquido >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                <DollarSign className={`w-8 h-8 ${saldoLiquido >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Movimentações por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGraficoCategoria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Legend />
                <Bar dataKey="entradas" fill="#10b981" name="Entradas" />
                <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={entradasPorCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: R$ ${entry.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {entradasPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Caixa</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Categoria</th>
                  <th className="text-right p-3">Valor</th>
                  <th className="text-left p-3">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoesFiltradas.slice(0, 50).map((mov) => {
                  const caixa = caixas.find(c => c.id === mov.caixa_id);
                  return (
                    <tr key={mov.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {format(parseISO(mov.data_movimentacao), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="p-3">{caixa?.nome || 'N/A'}</td>
                      <td className="p-3">
                        <Badge className={mov.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {mov.tipo === 'entrada' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {mov.tipo}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{mov.categoria?.replace(/_/g, ' ')}</span>
                        {mov.eh_taxa_gateway && (
                          <Badge variant="outline" className="ml-2 text-xs">Taxa</Badge>
                        )}
                      </td>
                      <td className={`p-3 text-right font-semibold ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {(mov.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-sm text-gray-600">{mov.descricao}</td>
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