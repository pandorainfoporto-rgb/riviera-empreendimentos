import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign } from "lucide-react";

export default function InvestimentosResumo({ investimentos = [] }) {
  const investimentosAtivos = (investimentos || []).filter(i => i.status === 'ativo');
  
  const valorTotalAplicado = (investimentosAtivos || []).reduce((sum, inv) => sum + (inv.valor_aplicado || 0), 0);
  
  const rendimentoEstimado = (investimentosAtivos || []).reduce((sum, inv) => {
    const taxa = inv.taxa_rendimento_mensal || 0;
    const mesesDecorridos = 6;
    const rendimento = (inv.valor_aplicado || 0) * (taxa / 100) * mesesDecorridos;
    return sum + rendimento;
  }, 0);

  const totalEstimado = valorTotalAplicado + rendimentoEstimado;

  return (
    <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--wine-700)] text-base sm:text-lg">
          <TrendingUp className="w-5 h-5" />
          Investimentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(investimentosAtivos || []).length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Nenhum investimento ativo</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{(investimentosAtivos || []).length}</p>
                <p className="text-xs text-gray-600">Investimentos Ativos</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-700">
                  R$ {(valorTotalAplicado / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-gray-600">Aplicado</p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-700">Rendimento Estimado (6m)</p>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-700">
                R$ {(rendimentoEstimado / 1000).toFixed(1)}k
              </p>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Total Estimado</span>
                <span className="font-semibold">R$ {(totalEstimado / 1000).toFixed(1)}k</span>
              </div>
            </div>

            <div className="space-y-2">
              {(investimentosAtivos || []).slice(0, 3).map((inv) => (
                <div key={inv.id} className="p-2 border rounded text-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{inv.nome}</p>
                      <p className="text-xs text-gray-600">
                        R$ {(inv.valor_aplicado || 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {inv.taxa_rendimento_mensal || 0}% a.m.
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}