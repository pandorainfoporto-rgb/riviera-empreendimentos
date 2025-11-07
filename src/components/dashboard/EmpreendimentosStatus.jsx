import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function EmpreendimentosStatus({ empreendimentos = [] }) {
  // Garantir que é array
  const empreendimentosArray = Array.isArray(empreendimentos) ? empreendimentos : [];

  const emAndamento = empreendimentosArray.filter(e => e?.status === 'em_execucao').length;
  const concluidos = empreendimentosArray.filter(e => e?.status === 'concluido').length;
  const planejamento = empreendimentosArray.filter(e => e?.status === 'planejamento').length;

  const percentualConclusao = empreendimentosArray.length > 0 
    ? Math.round((concluidos / empreendimentosArray.length) * 100)
    : 0;

  return (
    <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--wine-700)] text-lg">
          <Building2 className="w-5 h-5" />
          Status dos Empreendimentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{emAndamento}</p>
              <p className="text-xs text-gray-600 mt-1">Em Execução</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{concluidos}</p>
              <p className="text-xs text-gray-600 mt-1">Concluídos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{planejamento}</p>
              <p className="text-xs text-gray-600 mt-1">Planejamento</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Taxa de Conclusão</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-lg font-bold text-green-600">{percentualConclusao}%</span>
              </div>
            </div>
            <Progress value={percentualConclusao} className="h-3" />
          </div>

          {empreendimentosArray.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Nenhum empreendimento cadastrado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}