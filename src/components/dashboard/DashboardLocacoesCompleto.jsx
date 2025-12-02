import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Home, DollarSign, Users, TrendingUp, 
  Calendar, AlertTriangle, CheckCircle2, Eye, Clock, Key
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DashboardLocacoesCompleto({ locacoes = [], alugueisMensais = [], unidades = [] }) {
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  // Cálculos
  const locacoesAtivas = locacoes.filter(l => l.status === 'ativo');
  const locacoesInadimplentes = locacoes.filter(l => l.status === 'inadimplente');
  
  const receitaMensalTotal = locacoesAtivas.reduce((sum, l) => sum + (l.valor_aluguel || 0), 0);

  const hoje = new Date();
  const mesAtual = format(hoje, 'yyyy-MM');
  
  const alugueisVencidosHoje = alugueisMensais.filter(a => {
    if (a.status === 'pago') return false;
    try {
      const dataVenc = parseISO(a.data_vencimento);
      return isBefore(dataVenc, hoje);
    } catch {
      return false;
    }
  });

  const alugueisRecebidosMesAtual = alugueisMensais.filter(a => 
    a.mes_referencia === mesAtual && a.status === 'pago'
  );

  const taxaAdimplencia = alugueisMensais.filter(a => a.mes_referencia === mesAtual).length > 0
    ? (alugueisRecebidosMesAtual.length / alugueisMensais.filter(a => a.mes_referencia === mesAtual).length) * 100
    : 0;

  // Gráfico de receita mensal
  const meses = eachMonthOfInterval({
    start: startOfMonth(subMonths(hoje, 5)),
    end: endOfMonth(hoje)
  });

  const receitaPorMes = meses.map(mes => {
    const mesRef = format(mes, 'yyyy-MM');
    const pagos = alugueisMensais.filter(a => 
      a.mes_referencia === mesRef && a.status === 'pago'
    );
    const recebido = pagos.reduce((sum, a) => sum + (a.valor_total_pago || a.valor_total || 0), 0);
    
    return {
      mes: format(mes, "MMM/yy", { locale: ptBR }),
      recebido,
      previsto: locacoesAtivas.length > 0 
        ? locacoesAtivas.reduce((sum, l) => sum + (l.valor_total_mensal || l.valor_aluguel || 0), 0)
        : 0,
    };
  });

  // Status das locações
  const statusData = [
    { name: 'Ativas', value: locacoesAtivas.length, color: '#10b981' },
    { name: 'Inadimplentes', value: locacoesInadimplentes.length, color: '#ef4444' },
    { name: 'Encerradas', value: locacoes.filter(l => l.status === 'encerrado').length, color: '#6b7280' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-end">
        <Link to={createPageUrl('Alugueis')}>
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Ver Todas as Locações
          </Button>
        </Link>
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Locações Ativas</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-700">{locacoesAtivas.length}</p>
                <p className="text-xs text-gray-500 mt-1">{locacoes.length} total</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-blue-100 flex-shrink-0">
                <Home className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-green-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Receita Mensal</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-700">
                  R$ {(receitaMensalTotal / 1000).toFixed(1)}k
                </p>
                <p className="text-xs text-gray-500 mt-1">{locacoesAtivas.length} contratos</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-green-100 flex-shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-red-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Vencidos</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-700">{alugueisVencidosHoje.length}</p>
                <p className="text-xs text-gray-500 mt-1">Requer atenção</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-red-100 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-purple-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Taxa Adimplência</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-700">
                  {taxaAdimplencia.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Mês atual</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-purple-100 flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Receita de Aluguéis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={receitaPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                />
                <Legend />
                <Bar dataKey="previsto" fill="#3b82f6" name="Previsto" radius={[8, 8, 0, 0]} />
                <Bar dataKey="recebido" fill="#10b981" name="Recebido" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Status das Locações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-12 text-gray-500">Nenhuma locação cadastrada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aluguéis Vencidos */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Aluguéis Vencidos ({alugueisVencidosHoje.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alugueisVencidosHoje.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">Nenhum aluguel vencido! ✅</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alugueisVencidosHoje.slice(0, 5).map((aluguel) => {
                const locacao = locacoes.find(l => l.id === aluguel.locacao_id);
                const unidade = unidades.find(u => u.id === locacao?.unidade_id);
                const cliente = clientes.find(c => c.id === locacao?.cliente_id);

                return (
                  <div key={aluguel.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-red-50 border-red-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <div>
                            <p className="font-semibold">{unidade?.codigo || 'Unidade'}</p>
                            <p className="text-sm text-gray-600">{cliente?.nome || 'Cliente'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-gray-600">
                            Vencimento: {format(parseISO(aluguel.data_vencimento), "dd/MM/yyyy", {locale: ptBR})}
                          </p>
                          <p className="font-semibold text-red-700">
                            R$ {(aluguel.valor_total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contratos Próximos do Vencimento */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Contratos Próximos do Vencimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {locacoesAtivas
              .filter(loc => {
                try {
                  if (!loc.data_fim) return false;
                  const dataFim = parseISO(loc.data_fim);
                  const hoje = new Date();
                  const diasRestantes = Math.floor((dataFim - hoje) / (1000 * 60 * 60 * 24));
                  return diasRestantes <= 60 && diasRestantes >= 0;
                } catch {
                  return false;
                }
              })
              .slice(0, 5)
              .map((locacao) => {
                const unidade = unidades.find(u => u.id === locacao.unidade_id);
                const cliente = clientes.find(c => c.id === locacao.cliente_id);
                const dataFim = parseISO(locacao.data_fim);
                const hoje = new Date();
                const diasRestantes = Math.floor((dataFim - hoje) / (1000 * 60 * 60 * 24));

                return (
                  <div key={locacao.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-yellow-50 border-yellow-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-yellow-600" />
                          <div>
                            <p className="font-semibold">{unidade?.codigo || 'Unidade'}</p>
                            <p className="text-sm text-gray-600">{cliente?.nome || 'Cliente'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-gray-600">
                            Vence em: {diasRestantes} dia(s)
                          </p>
                          <p className="text-gray-600">
                            Data: {format(dataFim, "dd/MM/yyyy", {locale: ptBR})}
                          </p>
                        </div>
                        {locacao.renovacao_automatica && (
                          <Badge className="mt-2 bg-blue-600">Renovação Automática</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            {locacoesAtivas.filter(loc => {
              try {
                if (!loc.data_fim) return false;
                const dataFim = parseISO(loc.data_fim);
                const hoje = new Date();
                const diasRestantes = Math.floor((dataFim - hoje) / (1000 * 60 * 60 * 24));
                return diasRestantes <= 60 && diasRestantes >= 0;
              } catch {
                return false;
              }
            }).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Nenhum contrato vencendo nos próximos 60 dias</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inquilinos Ativos */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Inquilinos Ativos ({locacoesAtivas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locacoesAtivas.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Nenhuma locação ativa</p>
          ) : (
            <div className="space-y-2">
              {locacoesAtivas.slice(0, 10).map((locacao) => {
                const cliente = clientes.find(c => c.id === locacao.cliente_id);
                const unidade = unidades.find(u => u.id === locacao.unidade_id);
                const parcelasPagas = alugueisMensais.filter(a => 
                  a.locacao_id === locacao.id && a.status === 'pago'
                ).length;
                const totalParcelas = alugueisMensais.filter(a => a.locacao_id === locacao.id).length;

                return (
                  <div key={locacao.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{cliente?.nome || 'Cliente'}</p>
                      <p className="text-sm text-gray-600">{unidade?.codigo || 'Unidade'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-700">
                        R$ {(locacao.valor_aluguel || 0).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {parcelasPagas}/{totalParcelas} pagas
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}