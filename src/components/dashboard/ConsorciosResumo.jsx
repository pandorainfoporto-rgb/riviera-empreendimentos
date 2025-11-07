import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign, TrendingUp } from "lucide-react";

export default function ConsorciosResumo({ consorcios = [], unidades = [] }) {
  // Garantir que são arrays
  const consorciosArray = Array.isArray(consorcios) ? consorcios : [];
  const unidadesArray = Array.isArray(unidades) ? unidades : [];

  const contemplados = consorciosArray.filter(c => c?.contemplado === true);
  const investimento = consorciosArray.filter(c => c?.eh_investimento_caixa === true);
  const valorTotal = consorciosArray.reduce((sum, c) => sum + (c?.valor_carta || 0), 0);

  return (
    <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--wine-700)] text-base sm:text-lg">
          <CircleDollarSign className="w-5 h-5" />
          Consórcios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total de Cotas</p>
              <p className="text-2xl font-bold text-gray-900">{consorciosArray.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Contempladas</p>
              <p className="text-2xl font-bold text-green-600">{contemplados.length}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-600 mb-1">Investimento</p>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-700">
                <TrendingUp className="w-3 h-3 mr-1" />
                {investimento.length} cotas
              </Badge>
            </div>
          </div>

          <div className="pt-3 border-t">
            <p className="text-xs text-gray-600 mb-1">Valor Total</p>
            <p className="text-xl font-bold text-[var(--wine-700)]">
              R$ {(valorTotal / 1000).toFixed(0)}k
            </p>
          </div>

          {consorciosArray.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Nenhum consórcio cadastrado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}