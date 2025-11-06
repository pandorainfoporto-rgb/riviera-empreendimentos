import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  TrendingDown, AlertCircle, Download, CreditCard,
  DollarSign, Percent
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function RelatorioTaxasCustos() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ['movimentacoes_caixa'],
    queryFn: () => base44.entities.MovimentacaoCaixa.list('-data_movimentacao'),
  });

  const { data: gateways = [] } = useQuery({
    queryKey: ['configuracoes_gateway'],
    queryFn: () => base44.entities.ConfiguracaoGateway.list(),
  });

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
  });

  // Filtrar movimentações de taxas
  const taxasFiltradas = movimentacoes.filter(mov => {
    let matchesData = true;
    if (dataInicio) {
      matchesData = matchesData && (mov.data_movimentacao >= dataInicio);
    }
    if (dataFim) {
      matchesData = matchesData && (mov.data_movimentacao <= dataFim);
    }
    return mov.eh_taxa_gateway && matchesData;
  });

  // Total de taxas
  const totalTaxas = taxasFiltradas.reduce((sum, m) => sum + (m.valor || 0), 0);

  // Taxas por gateway
  const taxasPorGateway = {};
  taxasFiltradas.forEach(taxa => {
    const gateway = gateways.find(g => g.id === taxa.gateway_id);
    const nomeGateway = gateway?.nome_exibicao || 'Desconhecido';
    
    if (!taxasPorGateway[nomeGateway]) {
      taxasPorGateway[nomeGateway] = {
        total: 0,
        quantidade: 0,
        porMetodo: {},
        taxaMedia: 0
      };
    }

    taxasPorGateway[nomeGateway].total += taxa.valor || 0;
    taxasPorGateway[nomeGateway].quantidade++;

    const metodo = taxa.metodo_pagamento || 'outros';
    if (!taxasPorGateway[nomeGateway].porMetodo[metodo]) {
      taxasPorGateway[nomeGateway].porMetodo[metodo] = 0;
    }
    taxasPorGateway[nomeGateway].porMetodo[metodo] += taxa.valor || 0;
  });

  // Calcular taxa média
  Object.keys(taxasPorGateway).forEach(gateway => {
    const dados = taxasPorGateway[gateway];
    dados.taxaMedia = dados.quantidade > 0 ? dados.total / dados.quantidade : 0;
  });

  // Dados para gráfico - Evolução mensal de taxas
  const taxasPorMes = {};
  taxasFiltradas.forEach(taxa => {
    const mes = taxa.data_movimentacao.substring(0, 7); // YYYY-MM
    if (!taxasPorMes[mes]) {
      taxasPorMes[mes] = 0;
    }
    taxasPorMes[mes] += taxa.valor || 0;
  });

  const dadosEvolucao = Object.keys(taxasPorMes)
    .sort()
    .map(mes => ({
      mes: format(parseISO(mes + '-01'), "MMM/yy", { locale: ptBR }),
      valor: taxasPorMes[mes]
    }));

  // Dados para gráfico - Taxas por método
  const taxasPorMetodo = {};
  taxasFiltradas.forEach(taxa => {
    const metodo = taxa.metodo_pagamento || 'outros';
    if (!taxasPorMetodo[metodo]) {
      taxasPorMetodo[metodo] = { total: 0, quantidade: 0 };
    }
    taxasPorMetodo[metodo].total += taxa.valor || 0;
    taxasPorMetodo[metodo].quantidade++;
  });

  const dadosMetodos = Object.entries(taxasPorMetodo).map(([metodo, dados]) => ({
    metodo: metodo.toUpperCase(),
    valor: dados.total,
    quantidade: dados.quantidade,
    taxaMedia: dados.total / dados.quantidade
  }));

  // Custos operacionais (outras categorias de custo)
  const custosOperacionais = movimentacoes.filter(mov => {
    let matchesData = true;
    if (dataInicio) {
      matchesData = matchesData && (mov.data_movimentacao >= dataInicio);
    }
    if (dataFim) {
      matchesData = matchesData && (mov.data_movimentacao <= dataFim);
    }
    return mov.categoria === 'custo_operacao' && matchesData;
  });

  const totalCustosOperacionais = custosOperacionais.reduce((sum, m) => sum + (m.valor || 0), 0);
  const totalGeralCustos = totalTaxas + totalCustosOperacionais;

  const exportarCSV = () => {
    const headers = ['Data', 'Gateway', 'Método', 'Valor', 'Taxa %', 'Valor Original'];
    const rows = taxasFiltradas.map(taxa => {
      const gateway = gateways.find(g => g.id === taxa.gateway_id);
      return [
        taxa.data_movimentacao,
        gateway?.nome_exibicao || 'N/A',
        taxa.metodo_pagamento || 'N/A',
        taxa.valor,
        taxa.taxa_percentual?.toFixed(2) || '0',
        taxa.valor_transacao_original || '0'
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taxas_custos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Taxas e Custos</h1>
          <p className="text-gray-600 mt-1">Análise detalhada de taxas de gateway e custos operacionais</p>
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

      {/* Cards de Resumo */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Taxas Gateway</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalTaxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">{taxasFiltradas.length} transações</p>
              </div>
              <CreditCard className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Custos Operacionais</p>
                <p className="text-2xl font-bold text-orange-600">
                  R$ {totalCustosOperacionais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">{custosOperacionais.length} lançamentos</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Geral de Custos</p>
                <p className="text-2xl font-bold text-purple-600">
                  R$ {totalGeralCustos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal de Taxas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosEvolucao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Legend />
                <Line type="monotone" dataKey="valor" stroke="#ef4444" strokeWidth={3} name="Taxas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taxas por Método de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosMetodos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metodo" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Legend />
                <Bar dataKey="valor" fill="#f59e0b" name="Total de Taxas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Gateway */}
      <Card>
        <CardHeader>
          <CardTitle>Taxas por Gateway</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(taxasPorGateway).map(([gateway, dados]) => (
              <div key={gateway} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-[var(--wine-600)]" />
                    <h3 className="font-semibold text-lg">{gateway}</h3>
                  </div>
                  <Badge className="bg-red-100 text-red-700">
                    R$ {dados.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-3 gap-3 mb-3">
                  <div className="p-3 bg-white rounded border">
                    <p className="text-xs text-gray-600 mb-1">Transações</p>
                    <p className="text-lg font-bold">{dados.quantidade}</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-xs text-gray-600 mb-1">Taxa Média</p>
                    <p className="text-lg font-bold">
                      R$ {dados.taxaMedia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-xs text-gray-600 mb-1">Total de Taxas</p>
                    <p className="text-lg font-bold text-red-600">
                      R$ {dados.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Métodos de Pagamento */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Por Método de Pagamento</h4>
                  <div className="grid md:grid-cols-3 gap-2">
                    {Object.entries(dados.porMetodo).map(([metodo, valor]) => (
                      <div key={metodo} className="flex items-center justify-between p-2 bg-white rounded border">
                        <span className="text-sm capitalize">{metodo}</span>
                        <span className="text-sm font-bold text-red-600">
                          R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Últimas Taxas */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Taxas Cobradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Gateway</th>
                  <th className="text-left p-3">Método</th>
                  <th className="text-right p-3">Taxa %</th>
                  <th className="text-right p-3">Valor Original</th>
                  <th className="text-right p-3">Taxa Cobrada</th>
                </tr>
              </thead>
              <tbody>
                {taxasFiltradas.slice(0, 50).map((taxa) => {
                  const gateway = gateways.find(g => g.id === taxa.gateway_id);
                  return (
                    <tr key={taxa.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {format(parseISO(taxa.data_movimentacao), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{gateway?.nome_exibicao || 'N/A'}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className="bg-blue-100 text-blue-700 capitalize">
                          {taxa.metodo_pagamento || 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Percent className="w-3 h-3 text-gray-400" />
                          <span className="font-semibold">{taxa.taxa_percentual?.toFixed(2) || '0'}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-right text-gray-600">
                        R$ {(taxa.valor_transacao_original || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-bold text-red-600">
                        R$ {(taxa.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {taxasFiltradas.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma taxa encontrada no período selecionado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}