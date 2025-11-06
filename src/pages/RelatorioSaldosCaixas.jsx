import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet, Landmark, TrendingUp, CreditCard, Download,
  CheckCircle2, XCircle, BarChart as BarChartIcon
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function RelatorioSaldosCaixas() {
  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
  });

  const { data: contas = [] } = useQuery({
    queryKey: ['contas'],
    queryFn: () => base44.entities.Conta.list(),
  });

  const { data: corretoras = [] } = useQuery({
    queryKey: ['corretoras'],
    queryFn: () => base44.entities.Corretora.list(),
  });

  const { data: gateways = [] } = useQuery({
    queryKey: ['configuracoes_gateway'],
    queryFn: () => base44.entities.ConfiguracaoGateway.list(),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  // Agrupar por tipo
  const caixasPorTipo = {
    dinheiro: caixas.filter(c => c.tipo === 'dinheiro'),
    conta_bancaria: caixas.filter(c => c.tipo === 'conta_bancaria'),
    corretora: caixas.filter(c => c.tipo === 'corretora'),
    gateway: caixas.filter(c => c.tipo === 'gateway'),
  };

  // Totais por tipo
  const totaisPorTipo = {
    dinheiro: caixasPorTipo.dinheiro.reduce((sum, c) => sum + (c.saldo_atual || 0), 0),
    conta_bancaria: caixasPorTipo.conta_bancaria.reduce((sum, c) => sum + (c.saldo_atual || 0), 0),
    corretora: caixasPorTipo.corretora.reduce((sum, c) => sum + (c.saldo_atual || 0), 0),
    gateway: caixasPorTipo.gateway.reduce((sum, c) => sum + (c.saldo_atual || 0), 0),
  };

  const totalGeral = Object.values(totaisPorTipo).reduce((sum, val) => sum + val, 0);
  const totalAtivos = caixas.filter(c => c.ativo).reduce((sum, c) => sum + (c.saldo_atual || 0), 0);
  const totalInativos = caixas.filter(c => !c.ativo).reduce((sum, c) => sum + (c.saldo_atual || 0), 0);

  // Dados para gráfico de barras
  const dadosBarras = [
    { tipo: 'Dinheiro', saldo: totaisPorTipo.dinheiro, quantidade: caixasPorTipo.dinheiro.length },
    { tipo: 'Contas', saldo: totaisPorTipo.conta_bancaria, quantidade: caixasPorTipo.conta_bancaria.length },
    { tipo: 'Corretoras', saldo: totaisPorTipo.corretora, quantidade: caixasPorTipo.corretora.length },
    { tipo: 'Gateways', saldo: totaisPorTipo.gateway, quantidade: caixasPorTipo.gateway.length },
  ];

  // Dados para gráfico de pizza
  const dadosPizza = [
    { name: 'Dinheiro', value: totaisPorTipo.dinheiro },
    { name: 'Contas Bancárias', value: totaisPorTipo.conta_bancaria },
    { name: 'Corretoras', value: totaisPorTipo.corretora },
    { name: 'Gateways', value: totaisPorTipo.gateway },
  ].filter(item => item.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

  const tiposIcones = {
    dinheiro: { icon: Wallet, label: "Dinheiro", color: "text-green-600" },
    conta_bancaria: { icon: Landmark, label: "Conta Bancária", color: "text-blue-600" },
    corretora: { icon: TrendingUp, label: "Corretora", color: "text-purple-600" },
    gateway: { icon: CreditCard, label: "Gateway", color: "text-orange-600" },
  };

  const exportarCSV = () => {
    const headers = ['Caixa', 'Tipo', 'Status', 'Saldo Inicial', 'Saldo Atual', 'Variação'];
    const rows = caixas.map(caixa => [
      caixa.nome,
      caixa.tipo,
      caixa.ativo ? 'Ativo' : 'Inativo',
      caixa.saldo_inicial || 0,
      caixa.saldo_atual || 0,
      (caixa.saldo_atual || 0) - (caixa.saldo_inicial || 0)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saldos_caixas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Comparativo de Saldos</h1>
          <p className="text-gray-600 mt-1">Visão consolidada de todos os caixas e saldos</p>
        </div>
        <Button onClick={exportarCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Resumo Geral */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-[var(--wine-600)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Saldo Total Geral</p>
                <p className="text-3xl font-bold text-[var(--wine-700)]">
                  R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">{caixas.length} caixas</p>
              </div>
              <Wallet className="w-10 h-10 text-[var(--wine-600)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Saldo Total Ativos</p>
                <p className="text-3xl font-bold text-green-600">
                  R$ {totalAtivos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">{caixas.filter(c => c.ativo).length} ativos</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-gray-400">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Saldo Total Inativos</p>
                <p className="text-3xl font-bold text-gray-600">
                  R$ {totalInativos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">{caixas.filter(c => !c.ativo).length} inativos</p>
              </div>
              <XCircle className="w-10 h-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saldos por Tipo */}
      <div className="grid md:grid-cols-4 gap-4">
        {Object.entries(tiposIcones).map(([tipo, config]) => {
          const Icon = config.icon;
          return (
            <Card key={tipo}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`w-6 h-6 ${config.color}`} />
                  <span className="font-semibold">{config.label}</span>
                </div>
                <p className={`text-2xl font-bold ${config.color}`}>
                  R$ {totaisPorTipo[tipo].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {caixasPorTipo[tipo].length} caixa(s)
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Saldos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosBarras}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Legend />
                <Bar dataKey="saldo" fill="#922B3E" name="Saldo" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Saldos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / totalGeral) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosPizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Listagem Detalhada por Tipo */}
      {Object.entries(caixasPorTipo).map(([tipo, caixasList]) => {
        if (caixasList.length === 0) return null;

        const config = tiposIcones[tipo];
        const Icon = config.icon;

        return (
          <Card key={tipo}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${config.color}`} />
                {config.label} ({caixasList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {caixasList.map((caixa) => {
                  const conta = contas.find(c => c.id === caixa.conta_id);
                  const corretora = corretoras.find(c => c.id === caixa.corretora_id);
                  const gateway = gateways.find(g => g.id === caixa.gateway_id);
                  const loteamento = loteamentos.find(l => l.id === caixa.loteamento_id);
                  const variacao = (caixa.saldo_atual || 0) - (caixa.saldo_inicial || 0);

                  return (
                    <div key={caixa.id} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{caixa.nome}</h4>
                          {caixa.ativo ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">Ativo</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 text-xs">Inativo</Badge>
                          )}
                          {caixa.eh_padrao && (
                            <Badge className="bg-[var(--wine-100)] text-[var(--wine-700)] text-xs">
                              ⭐ Padrão
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-gray-600 space-y-0.5">
                          {conta && <p>Conta: {conta.numero_conta}</p>}
                          {corretora && <p>Corretora: {corretora.nome}</p>}
                          {gateway && <p>Gateway: {gateway.nome_exibicao}</p>}
                          {loteamento && <p>Loteamento: {loteamento.nome}</p>}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          (caixa.saldo_atual || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          R$ {(caixa.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="text-xs text-gray-500 mt-1">
                          <p>Inicial: R$ {(caixa.saldo_inicial || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <p className={variacao >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {variacao >= 0 ? '+' : ''}R$ {variacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}