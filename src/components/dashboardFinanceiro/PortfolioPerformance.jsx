import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PiggyBank, TrendingUp, CircleDollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function PortfolioPerformance({ investimentos, consorcios }) {
  const investimentosAtivos = investimentos.filter(i => i.status === 'ativo');
  const totalInvestido = investimentosAtivos.reduce((sum, i) => sum + (i.valor_aplicado || 0), 0);

  const calcularRendimento = (inv) => {
    const taxaMensal = (inv.taxa_rendimento_mensal || 0) / 100;
    const hoje = new Date();
    const dataAplicacao = new Date(inv.data_aplicacao);
    const mesesDecorridos = Math.floor((hoje - dataAplicacao) / (1000 * 60 * 60 * 24 * 30));
    const valorFuturo = inv.valor_aplicado * Math.pow(1 + taxaMensal, mesesDecorridos);
    return valorFuturo - inv.valor_aplicado;
  };

  const totalRendimento = investimentosAtivos.reduce((sum, i) => sum + calcularRendimento(i), 0);
  const rentabilidade = totalInvestido > 0 ? ((totalRendimento / totalInvestido) * 100) : 0;

  const consorciosAtivos = consorcios.filter(c => !c.contemplado);
  const valorConsorcios = consorciosAtivos.reduce((sum, c) => {
    const valorPago = (c.parcelas_pagas || 0) * (c.valor_parcela || 0);
    return sum + valorPago;
  }, 0);

  const consorciosContemplados = consorcios.filter(c => c.contemplado).length;
  const percentualContempl = consorcios.length > 0 ? (consorciosContemplados / consorcios.length) * 100 : 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
          <PiggyBank className="w-5 h-5" />
          Performance do Portfólio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Investimentos */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-900">Investimentos</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Investido</p>
              <p className="text-lg font-bold text-gray-900">
                R$ {(totalInvestido / 1000).toFixed(0)}k
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Rendimento</p>
              <p className="text-lg font-bold text-green-600">
                +R$ {(totalRendimento / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Rentabilidade</span>
              <span className="font-semibold text-green-600">{rentabilidade.toFixed(2)}%</span>
            </div>
            <Progress value={Math.min(rentabilidade, 100)} className="h-2" />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {investimentosAtivos.length} investimento(s) ativo(s)
          </p>
        </div>

        {/* Consórcios */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <CircleDollarSign className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Consórcios</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Valor Pago</p>
              <p className="text-lg font-bold text-gray-900">
                R$ {(valorConsorcios / 1000).toFixed(0)}k
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Contemplados</p>
              <p className="text-lg font-bold text-blue-600">
                {consorciosContemplados}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Taxa de Contemplação</span>
              <span className="font-semibold text-blue-600">{percentualContempl.toFixed(1)}%</span>
            </div>
            <Progress value={percentualContempl} className="h-2" />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {consorcios.length} cota(s) total
          </p>
        </div>

        {/* Resumo */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Aplicado</span>
            <span className="text-xl font-bold text-[var(--wine-700)]">
              R$ {((totalInvestido + valorConsorcios) / 1000).toFixed(0)}k
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}