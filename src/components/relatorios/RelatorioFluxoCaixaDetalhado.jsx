import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

export default function RelatorioFluxoCaixaDetalhado() {
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: pagamentosClientes = [] } = useQuery({
    queryKey: ['pagamentosClientes'],
    queryFn: () => base44.entities.PagamentoCliente.list(),
  });

  const { data: pagamentosFornecedores = [] } = useQuery({
    queryKey: ['pagamentosFornecedores'],
    queryFn: () => base44.entities.PagamentoFornecedor.list(),
  });

  const { data: aportesSocios = [] } = useQuery({
    queryKey: ['aportesSocios'],
    queryFn: () => base44.entities.AporteSocio.list(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
  });

  const { data: socios = [] } = useQuery({
    queryKey: ['socios'],
    queryFn: () => base44.entities.Socio.list(),
  });

  const filtrarPorPeriodo = (items, campoData) => {
    return items.filter(item => {
      if (!item[campoData]) return false;
      const data = parseISO(item[campoData]);
      return data >= parseISO(dataInicio) && data <= parseISO(dataFim);
    });
  };

  // Entradas
  const receitasRecebidas = filtrarPorPeriodo(
    pagamentosClientes.filter(p => p.status === 'pago'),
    'data_pagamento'
  );

  const aportesRecebidos = filtrarPorPeriodo(
    aportesSocios.filter(a => a.status === 'pago'),
    'data_pagamento'
  );

  // Saídas
  const despesasPagas = filtrarPorPeriodo(
    pagamentosFornecedores.filter(p => p.status === 'pago'),
    'data_pagamento'
  );

  // Totais
  const totalReceitas = receitasRecebidas.reduce((sum, r) => sum + (r.valor || 0), 0);
  const totalAportes = aportesRecebidos.reduce((sum, a) => sum + (a.valor || 0), 0);
  const totalEntradas = totalReceitas + totalAportes;
  
  const totalDespesas = despesasPagas.reduce((sum, d) => sum + (d.valor || 0), 0);
  
  const saldoPeriodo = totalEntradas - totalDespesas;

  // Dados para gráfico diário
  const diasPeriodo = eachDayOfInterval({
    start: parseISO(dataInicio),
    end: parseISO(dataFim)
  });

  const dadosDiarios = diasPeriodo.map(dia => {
    const diaStr = format(dia, 'yyyy-MM-dd');
    
    const receitasDia = receitasRecebidas
      .filter(r => r.data_pagamento === diaStr)
      .reduce((sum, r) => sum + (r.valor || 0), 0);
    
    const aportesDia = aportesRecebidos
      .filter(a => a.data_pagamento === diaStr)
      .reduce((sum, a) => sum + (a.valor || 0), 0);
    
    const despesasDia = despesasPagas
      .filter(d => d.data_pagamento === diaStr)
      .reduce((sum, d) => sum + (d.valor || 0), 0);
    
    const entradasDia = receitasDia + aportesDia;
    const saldoDia = entradasDia - despesasDia;

    return {
      dia: format(dia, 'dd/MM', { locale: ptBR }),
      entradas: entradasDia,
      saidas: despesasDia,
      saldo: saldoDia,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <Label>Data Início</Label>
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Data Fim</Label>
          <Input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards Resumo */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="shadow-lg border-t-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Total de Entradas</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Receitas: R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<br/>
                  Aportes: R$ {totalAportes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-red-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Total de Saídas</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {despesasPagas.length} pagamento(s) realizado(s)
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-100">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-lg border-t-4 ${saldoPeriodo >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Saldo do Período</p>
                <p className={`text-2xl font-bold ${saldoPeriodo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  R$ {saldoPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${saldoPeriodo >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                <Wallet className={`w-6 h-6 ${saldoPeriodo >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Fluxo Diário */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-[var(--wine-700)] mb-4">Fluxo de Caixa Diário</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosDiarios}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="dia" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="entradas" fill="#10b981" name="Entradas" radius={[8, 8, 0, 0]} />
              <Bar dataKey="saidas" fill="#ef4444" name="Saídas" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Saldo Acumulado */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-[var(--wine-700)] mb-4">Saldo Acumulado</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dadosDiarios.map((d, i, arr) => ({
              ...d,
              saldoAcumulado: arr.slice(0, i + 1).reduce((sum, day) => sum + day.saldo, 0)
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="dia" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="saldoAcumulado" 
                stroke="var(--wine-600)" 
                strokeWidth={3}
                name="Saldo Acumulado"
                dot={{ fill: 'var(--wine-600)', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detalhamento de Movimentações */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Receitas Detalhadas */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Receitas Recebidas ({receitasRecebidas.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {receitasRecebidas.map((rec) => {
                const cliente = clientes.find(c => c.id === rec.cliente_id);
                return (
                  <div key={rec.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-medium text-sm">{cliente?.nome}</p>
                      <p className="text-xs text-gray-600">
                        {format(parseISO(rec.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <p className="font-bold text-green-700">
                      R$ {rec.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                );
              })}
              {receitasRecebidas.length === 0 && (
                <p className="text-gray-500 text-center py-4">Nenhuma receita no período</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Despesas Detalhadas */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Despesas Pagas ({despesasPagas.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {despesasPagas.map((desp) => {
                const fornecedor = fornecedores.find(f => f.id === desp.fornecedor_id);
                return (
                  <div key={desp.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium text-sm">{fornecedor?.nome}</p>
                      <p className="text-xs text-gray-600">
                        {format(parseISO(desp.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <p className="font-bold text-red-700">
                      R$ {desp.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                );
              })}
              {despesasPagas.length === 0 && (
                <p className="text-gray-500 text-center py-4">Nenhuma despesa no período</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}