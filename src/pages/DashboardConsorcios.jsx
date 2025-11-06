
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDollarSign, Award, TrendingUp, Clock, DollarSign, Users, PiggyBank } from "lucide-react"; // Added PiggyBank
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

import AssembleiasProximas from "../components/consorcios/AssembleiasProximas";
import TabelaContemplacao from "../components/consorcios/TabelaContemplacao";

export default function DashboardConsorcios() {
  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: () => base44.entities.Consorcio.list('-created_date'),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: empreendimentos = [] } = useQuery({
    queryKey: ['empreendimentos'],
    queryFn: () => base44.entities.Empreendimento.list(),
  });

  // Estatísticas gerais
  const totalConsorcios = consorcios.length;
  const consorciosContemplados = consorcios.filter(c => c.contemplado).length;
  const consorciosAtivos = consorcios.filter(c => !c.contemplado).length;
  
  // Cotas de investimento (caixa)
  const cotasInvestimento = consorcios.filter(c => c.eh_investimento_caixa);
  const totalCotasInvestimento = cotasInvestimento.length;
  const valorTotalCotasInvestimento = cotasInvestimento.reduce((sum, c) => sum + (c.valor_carta || 0), 0);
  const valorPagoCotasInvestimento = cotasInvestimento.reduce((sum, c) => {
    const parcelasPagas = c.parcelas_pagas || 0;
    const valorParcela = c.valor_parcela || 0;
    return sum + (parcelasPagas * valorParcela);
  }, 0);
  const cotasInvestimentoContempladas = cotasInvestimento.filter(c => c.contemplado).length;
  
  const totalParcelasPagas = consorcios.reduce((sum, c) => sum + (c.parcelas_pagas || 0), 0);
  const totalParcelasTotal = consorcios.reduce((sum, c) => sum + (c.parcelas_total || 0), 0);
  const percentualPago = totalParcelasTotal > 0 ? (totalParcelasPagas / totalParcelasTotal) * 100 : 0;

  const valorTotalCartas = consorcios.reduce((sum, c) => sum + (c.valor_carta || 0), 0);
  const valorTotalPago = consorcios.reduce((sum, c) => {
    const parcelasPagas = c.parcelas_pagas || 0;
    const valorParcela = c.valor_parcela || 0;
    return sum + (parcelasPagas * valorParcela);
  }, 0);

  // Contemplações por tipo
  const contemplacoesPorTipo = [
    { name: 'Lance', value: consorcios.filter(c => c.tipo_contemplacao === 'lance').length },
    { name: 'Sorteio', value: consorcios.filter(c => c.tipo_contemplacao === 'sorteio').length },
    { name: 'Não Contemplado', value: consorcios.filter(c => c.tipo_contemplacao === 'nao_contemplado').length },
  ];

  // Consórcios por empreendimento
  const consorciosPorEmp = empreendimentos.map(emp => ({
    nome: emp.nome,
    quantidade: consorcios.filter(c => c.empreendimento_id === emp.id).length,
  })).filter(item => item.quantidade > 0);

  const COLORS = ['#10b981', '#3b82f6', '#94a3b8'];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Dashboard de Consórcios</h1>
        <p className="text-gray-600 mt-1">Visão geral dos consórcios</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Total de Consórcios</p>
                <p className="text-3xl font-bold text-gray-900">{totalConsorcios}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] shadow-lg">
                <CircleDollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Contemplados</p>
                <p className="text-3xl font-bold text-gray-900">{consorciosContemplados}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500 shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Ativos</p>
                <p className="text-3xl font-bold text-gray-900">{consorciosAtivos}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500 shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Valor Total Cartas</p>
                <p className="text-xl font-bold text-gray-900">
                  R$ {(valorTotalCartas / 1000).toFixed(0)}k
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500 shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card de Cotas de Investimento (Caixa) */}
      {totalCotasInvestimento > 0 && (
        <Card className="shadow-lg border-t-4 border-blue-600 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <PiggyBank className="w-6 h-6" />
              Cotas de Investimento (Caixa)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total de Cotas</p>
                <p className="text-3xl font-bold text-blue-900">{totalCotasInvestimento}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Valor Total Cartas</p>
                <p className="text-2xl font-bold text-blue-900">
                  R$ {(valorTotalCotasInvestimento / 1000).toFixed(0)}k
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Valor Pago</p>
                <p className="text-2xl font-bold text-green-700">
                  R$ {(valorPagoCotasInvestimento / 1000).toFixed(0)}k
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Contempladas</p>
                <p className="text-3xl font-bold text-green-700">{cotasInvestimentoContempladas}</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Progresso de Pagamento:</span>
                <span className="font-semibold text-blue-900">
                  {valorTotalCotasInvestimento > 0 
                    ? ((valorPagoCotasInvestimento / valorTotalCotasInvestimento) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
              <Progress 
                value={valorTotalCotasInvestimento > 0 ? (valorPagoCotasInvestimento / valorTotalCotasInvestimento) * 100 : 0} 
                className="h-3" 
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              {cotasInvestimento.slice(0, 3).map(cota => (
                <div key={cota.id} className="p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">Grupo {cota.grupo} - Cota {cota.cota}</p>
                  <p className="font-semibold text-blue-900">
                    R$ {cota.valor_carta?.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {cota.parcelas_pagas}/{cota.parcelas_total} parcelas
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progresso Geral de Pagamentos */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-[var(--wine-700)]">Progresso Geral de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Parcelas Pagas / Total</span>
              <span className="font-semibold">
                {totalParcelasPagas} / {totalParcelasTotal} ({percentualPago.toFixed(1)}%)
              </span>
            </div>
            <Progress value={percentualPago} className="h-3" />
            <div className="flex justify-between text-sm pt-2">
              <div>
                <span className="text-gray-600">Valor Pago: </span>
                <span className="font-semibold text-green-600">
                  R$ {valorTotalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Valor Total: </span>
                <span className="font-semibold">
                  R$ {valorTotalCartas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assembleias Próximas e Tabela de Contemplações */}
      <div className="grid lg:grid-cols-2 gap-6">
        <AssembleiasProximas 
          consorcios={consorcios}
          clientes={clientes}
          empreendimentos={empreendimentos}
        />
        <TabelaContemplacao 
          consorcios={consorcios}
          empreendimentos={empreendimentos}
        />
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-[var(--wine-700)]">Contemplações por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contemplacoesPorTipo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {contemplacoesPorTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-[var(--wine-700)]">Consórcios por Empreendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consorciosPorEmp}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="nome" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="quantidade" fill="var(--wine-600)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Consórcios Próximos da Contemplação */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-[var(--wine-700)]">Consórcios com Maior Progresso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {consorcios
              .filter(c => !c.contemplado && c.parcelas_total > 0 && !c.eh_investimento_caixa) // Filter out investment quotas
              .sort((a, b) => (b.parcelas_pagas / b.parcelas_total) - (a.parcelas_pagas / a.parcelas_total))
              .slice(0, 5)
              .map(consorcio => {
                const cliente = clientes.find(c => c.id === consorcio.cliente_id);
                const emp = empreendimentos.find(e => e.id === consorcio.empreendimento_id);
                const percentual = (consorcio.parcelas_pagas / consorcio.parcelas_total) * 100;

                return (
                  <div key={consorcio.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Grupo {consorcio.grupo} - Cota {consorcio.cota}
                        </p>
                        <p className="text-sm text-gray-600">{cliente?.nome} - {emp?.nome}</p>
                      </div>
                      <Badge className="bg-[var(--wine-100)] text-[var(--wine-700)]">
                        {percentual.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={percentual} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {consorcio.parcelas_pagas} / {consorcio.parcelas_total} parcelas pagas
                    </p>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
