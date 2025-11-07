import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function InvestimentosResumo({ investimentos = [] }) {
  // Garantir que é array
  const investimentosArray = Array.isArray(investimentos) ? investimentos : [];

  const ativos = investimentosArray.filter(i => i?.status === 'ativo');
  const valorTotal = ativos.reduce((sum, i) => sum + (i?.valor_aplicado || 0), 0);
  
  return (
    <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--wine-700)] text-base sm:text-lg">
          <TrendingUp className="w-5 h-5" />
          Investimentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{ativos.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{investimentosArray.length}</p>
            </div>
          </div>

          <div className="pt-3 border-t">
            <p className="text-xs text-gray-600 mb-1">Valor Aplicado</p>
            <p className="text-xl font-bold text-[var(--wine-700)]">
              R$ {(valorTotal / 1000).toFixed(0)}k
            </p>
          </div>

          {investimentosArray.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Nenhum investimento cadastrado</p>
            </div>
          )}

          {ativos.length > 0 && (
            <div className="space-y-2 pt-3 border-t">
              <p className="text-xs text-gray-600 mb-2">Investimentos Recentes</p>
              {ativos.slice(0, 3).map((inv) => {
                if (!inv) return null;
                return (
                  <div key={inv.id} className="flex justify-between items-center text-xs">
                    <span className="text-gray-700 truncate flex-1 mr-2">{inv.nome || 'N/A'}</span>
                    <Badge variant="outline" className="text-xs">
                      R$ {((inv.valor_aplicado || 0) / 1000).toFixed(0)}k
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}