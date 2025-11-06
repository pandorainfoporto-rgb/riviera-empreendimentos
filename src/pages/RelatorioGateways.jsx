import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreditCard, TrendingUp, TrendingDown, DollarSign,
  PieChart as PieChartIcon, Download, CheckCircle2, AlertCircle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function RelatorioGateways() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const { data: gateways = [] } = useQuery({
    queryKey: ['configuracoes_gateway'],
    queryFn: () => base44.entities.ConfiguracaoGateway.list(),
  });

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
  });

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ['movimentacoes_caixa'],
    queryFn: () => base44.entities.MovimentacaoCaixa.list(),
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentosClientes'],
    queryFn: () => base44.entities.PagamentoCliente.list(),
  });

  // Filtrar por data
  const movimentacoesFiltradas = movimentacoes.filter(mov => {
    let matchesData = true;
    if (dataInicio) {
      matchesData = matchesData && (mov.data_movimentacao >= dataInicio);
    }
    if (dataFim) {
      matchesData = matchesData && (mov.data_movimentacao <= dataFim);
    }
    return matchesData;
  });

  // Análise por gateway
  const analiseGateways = gateways.map(gateway => {
    const caixasGateway = caixas.filter(c => c.gateway_id === gateway.id);
    
    // Total recebido via gateway
    const totalRecebido = movimentacoesFiltradas
      .filter(m => 
        m.tipo === 'entrada' && 
        m.categoria === 'recebimento_cliente' &&
        caixasGateway.some(c => c.id === m.caixa_id)
      )
      .reduce((sum, m) => sum + (m.valor || 0), 0);

    // Total de taxas cobradas
    const totalTaxas = movimentacoesFiltradas
      .filter(m => 
        m.eh_taxa_gateway && 
        m.gateway_id === gateway.id
      )
      .reduce((sum, m) => sum + (m.valor || 0), 0);

    // Quantidade de transações
    const quantidadeTransacoes = movimentacoesFiltradas
      .filter(m => 
        m.tipo === 'entrada' && 
        m.categoria === 'recebimento_cliente' &&
        caixasGateway.some(c => c.id === m.caixa_id)
      ).length;

    // Ticket médio
    const ticketMedio = quantidadeTransacoes > 0 ? totalRecebido / quantidadeTransacoes : 0;

    // Taxa média percentual
    const taxaMediaPercentual = totalRecebido > 0 ? (totalTaxas / (totalRecebido + totalTaxas)) * 100 : 0;

    // Métodos de pagamento
    const metodosPagamento = {};
    movimentacoesFiltradas
      .filter(m => 
        m.tipo === 'entrada' && 
        m.categoria === 'recebimento_cliente' &&
        caixasGateway.some(c => c.id === m.caixa_id) &&
        m.metodo_pagamento
      )
      .forEach(m => {
        const metodo = m.metodo_pagamento;
        if (!metodosPagamento[metodo]) {
          metodosPagamento[metodo] = { quantidade: 0, valor: 0 };
        }
        metodosPagamento[metodo].quantidade++;
        metodosPagamento[metodo].valor += m.valor || 0;
      });

    return {
      gateway,
      totalRecebido,
      totalTaxas,
      quantidadeTransacoes,
      ticketMedio,
      taxaMediaPercentual,
      metodosPagamento,
      saldoCaixas: caixasGateway.reduce((sum, c) => sum + (c.saldo_atual || 0), 0)
    };
  }).filter(analise => analise.gateway.ativo);

  // Dados para gráfico de comparação
  const dadosComparacao = analiseGateways.map(a => ({
    nome: a.gateway.nome_exibicao,
    recebido: a.totalRecebido,
    taxas: a.totalTaxas,
    transacoes: a.quantidadeTransacoes
  }));

  // Dados para gráfico de pizza - Distribuição de recebimentos
  const dadosDistribuicao = analiseGateways.map(a => ({
    name: a.gateway.nome_exibicao,
    value: a.totalRecebido
  })).filter(item => item.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  const totalGeralRecebido = analiseGateways.reduce((sum, a) => sum + a.totalRecebido, 0);
  const totalGeralTaxas = analiseGateways.reduce((sum, a) => sum + a.totalTaxas, 0);
  const totalGeralTransacoes = analiseGateways.reduce((sum, a) => sum + a.quantidadeTransacoes, 0);

  const exportarCSV = () => {
    const headers = ['Gateway', 'Total Recebido', 'Total Taxas', 'Transações', 'Ticket Médio', 'Taxa Média %'];
    const rows = analiseGateways.map(a => [
      a.gateway.nome_exibicao,
      a.totalRecebido,
      a.totalTaxas,
      a.quantidadeTransacoes,
      a.ticketMedio,
      a.taxaMediaPercentual.toFixed(2)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_gateways_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Análise de Gateways</h1>
          <p className="text-gray-600 mt-1">Performance e custos dos gateways de pagamento</p>
        </div>
        <Button onClick={exportarCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Período de Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
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

      {/* Resumo Geral */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Recebido</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalGeralRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Taxas</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalGeralTaxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Transações</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalGeralTransacoes}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Comparativo de Gateways</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosComparacao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Legend />
                <Bar dataKey="recebido" fill="#10b981" name="Recebido" />
                <Bar dataKey="taxas" fill="#ef4444" name="Taxas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Recebimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosDistribuicao}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / totalGeralRecebido) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosDistribuicao.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cards Detalhados por Gateway */}
      <div className="grid md:grid-cols-2 gap-6">
        {analiseGateways.map((analise) => (
          <Card key={analise.gateway.id} className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {analise.gateway.nome_exibicao}
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Ativo
                  </Badge>
                  <Badge variant="outline">
                    {analise.gateway.ambiente === 'producao' ? '🚀 Produção' : '🧪 Sandbox'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 mb-1">Total Recebido</p>
                  <p className="text-lg font-bold text-green-700">
                    R$ {analise.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600 mb-1">Total de Taxas</p>
                  <p className="text-lg font-bold text-red-700">
                    R$ {analise.totalTaxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">Transações</p>
                  <p className="text-lg font-bold text-blue-700">
                    {analise.quantidadeTransacoes}
                  </p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 mb-1">Ticket Médio</p>
                  <p className="text-lg font-bold text-purple-700">
                    R$ {analise.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Taxa Média */}
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-orange-900">Taxa Média</span>
                  <span className="text-lg font-bold text-orange-700">
                    {analise.taxaMediaPercentual.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Métodos de Pagamento */}
              {Object.keys(analise.metodosPagamento).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Métodos de Pagamento</h4>
                  <div className="space-y-2">
                    {Object.entries(analise.metodosPagamento).map(([metodo, dados]) => (
                      <div key={metodo} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="text-sm font-medium capitalize">{metodo}</span>
                          <span className="text-xs text-gray-500 ml-2">({dados.quantidade} transações)</span>
                        </div>
                        <span className="text-sm font-bold">
                          R$ {dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saldo nos Caixas */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-900">Saldo nos Caixas</span>
                  <span className="text-lg font-bold text-blue-700">
                    R$ {analise.saldoCaixas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {analiseGateways.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum gateway ativo encontrado</p>
            <p className="text-sm text-gray-500 mt-2">Configure gateways em Configurações → Gateways de Pagamento</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}