
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  DollarSign, Package, Settings, ArrowUpRight, ArrowDownRight 
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CORES_ETAPAS = [
  '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', 
  '#6366f1', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

export default function DashboardFinanceiroCusto({ custoObraId }) {
  const { data: custo } = useQuery({
    queryKey: ['custo_obra', custoObraId],
    queryFn: async () => {
      const custos = await base44.entities.CustoObra.filter({ id: custoObraId });
      return custos[0];
    },
    enabled: !!custoObraId,
  });

  const { data: despesas = [] } = useQuery({
    queryKey: ['despesas_obra', custoObraId],
    queryFn: () => base44.entities.DespesaObra.filter({ custo_obra_id: custoObraId }),
    enabled: !!custoObraId,
    initialData: [],
  });

  const { data: itensCusto = [] } = useQuery({
    queryKey: ['itens_custo', custoObraId],
    queryFn: () => base44.entities.ItemCustoObra.filter({ custo_obra_id: custoObraId }),
    enabled: !!custoObraId,
    initialData: [],
  });

  if (!custo) {
    return <div className="p-8 text-center text-gray-500">Carregando...</div>;
  }

  const valorOrcado = custo.valor_total_estimado || 0;
  const valorRealizado = (despesas || []).reduce((sum, d) => sum + (d.valor_total || 0), 0);
  const desvioReais = valorRealizado - valorOrcado;
  const desvioPercentual = valorOrcado > 0 ? (desvioReais / valorOrcado) * 100 : 0;
  const percentualGasto = valorOrcado > 0 ? (valorRealizado / valorOrcado) * 100 : 0;

  // Análise por etapa
  const analiseEtapas = (itensCusto || []).reduce((acc, item) => {
    if (!acc[item.etapa]) {
      acc[item.etapa] = {
        etapa: item.etapa,
        orcado: 0,
        realizado: 0,
      };
    }
    acc[item.etapa].orcado += item.valor_total || 0;
    return acc;
  }, {});

  (despesas || []).forEach(desp => {
    if (analiseEtapas[desp.etapa]) {
      analiseEtapas[desp.etapa].realizado += desp.valor_total || 0;
    }
  });

  const dadosGrafico = Object.values(analiseEtapas).map(et => ({
    ...et,
    desvio: et.realizado - et.orcado,
    etapaNome: et.etapa.replace('_', ' ').substring(0, 15),
  }));

  // Distribuição por categoria
  const distribuicaoCategoria = (despesas || []).reduce((acc, desp) => {
    if (!acc[desp.categoria]) {
      acc[desp.categoria] = 0;
    }
    acc[desp.categoria] += desp.valor_total || 0;
    return acc;
  }, {});

  const dadosPizza = Object.entries(distribuicaoCategoria).map(([cat, val]) => ({
    name: cat,
    value: val,
  }));

  // Maiores desvios
  const maioresDesvios = dadosGrafico
    .map(d => ({ ...d, desvioPerc: d.orcado > 0 ? (d.desvio / d.orcado) * 100 : 0 }))
    .filter(d => Math.abs(d.desvioPerc) > 5)
    .sort((a, b) => Math.abs(b.desvioPerc) - Math.abs(a.desvioPerc))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Cards Resumo */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-t-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Valor Orçado</p>
                <p className="text-xl font-bold text-blue-700">
                  R$ {(valorOrcado / 1000).toFixed(1)}k
                </p>
              </div>
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Valor Realizado</p>
                <p className="text-xl font-bold text-purple-700">
                  R$ {(valorRealizado / 1000).toFixed(1)}k
                </p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-t-4 ${desvioReais > 0 ? 'border-red-500' : 'border-green-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Desvio Orçamento</p>
                <p className={`text-xl font-bold ${desvioReais > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {desvioReais > 0 ? '+' : ''}R$ {(desvioReais / 1000).toFixed(1)}k
                </p>
                <Badge className={`mt-1 ${desvioReais > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {desvioPercentual > 0 ? '+' : ''}{desvioPercentual.toFixed(1)}%
                </Badge>
              </div>
              {desvioReais > 0 ? 
                <ArrowUpRight className="w-8 h-8 text-red-600" /> :
                <ArrowDownRight className="w-8 h-8 text-green-600" />
              }
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-orange-500">
          <CardContent className="p-4">
            <div>
              <p className="text-xs text-gray-600 mb-2">Execução do Orçamento</p>
              <Progress value={percentualGasto} className="h-2" />
              <p className="text-sm font-semibold text-gray-700 mt-1">
                {percentualGasto.toFixed(1)}% executado
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Desvio */}
      {maioresDesvios.length > 0 && (
        <Card className="border-l-4 border-amber-500 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Desvio Orçamentário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {maioresDesvios.map((desvio, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className={desvio.desvio > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {desvio.desvio > 0 ? '⬆' : '⬇'} {Math.abs(desvio.desvioPerc).toFixed(1)}%
                  </Badge>
                  <span className="font-semibold text-gray-800">{desvio.etapa.replace('_', ' ')}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Orçado: R$ {(desvio.orcado / 1000).toFixed(1)}k
                  </p>
                  <p className={`text-sm font-bold ${desvio.desvio > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    Real: R$ {(desvio.realizado / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-800">Orçado vs Realizado por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="etapaNome" angle={-45} textAnchor="end" height={100} style={{ fontSize: '10px' }} />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`} />
                <Legend />
                <Bar dataKey="orcado" fill="#3b82f6" name="Orçado" />
                <Bar dataKey="realizado" fill="#8b5cf6" name="Realizado" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-800">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosPizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_ETAPAS[index % CORES_ETAPAS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Saúde Financeira */}
      <Card>
        <CardHeader>
          <CardTitle>Indicadores de Saúde Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              {desvioPercentual <= 5 ? (
                <>
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="font-bold text-green-700">Dentro do Orçamento</p>
                  <p className="text-sm text-gray-600">Desvio aceitável</p>
                </>
              ) : desvioPercentual <= 15 ? (
                <>
                  <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-2" />
                  <p className="font-bold text-amber-700">Atenção</p>
                  <p className="text-sm text-gray-600">Desvio moderado</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-2" />
                  <p className="font-bold text-red-700">Crítico</p>
                  <p className="text-sm text-gray-600">Desvio alto</p>
                </>
              )}
            </div>

            <div className="text-center">
              <DollarSign className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <p className="font-bold text-blue-700">R$ {((valorOrcado - valorRealizado) / 1000).toFixed(1)}k</p>
              <p className="text-sm text-gray-600">Saldo Restante</p>
            </div>

            <div className="text-center">
              <Package className="w-12 h-12 text-purple-600 mx-auto mb-2" />
              <p className="font-bold text-purple-700">{despesas.length} despesas</p>
              <p className="text-sm text-gray-600">Total registradas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
