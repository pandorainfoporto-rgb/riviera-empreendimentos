import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

export default function EmpreendimentosAtivos({ empreendimentos }) {
  const ativos = empreendimentos.filter(e => 
    e.status === 'em_execucao' || e.status === 'planejamento'
  );

  const statusColors = {
    planejamento: "bg-blue-100 text-blue-800",
    em_execucao: "bg-green-100 text-green-800",
  };

  const statusLabels = {
    planejamento: "Planejamento",
    em_execucao: "Em Execução",
  };

  return (
    <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--wine-700)] text-base sm:text-lg">
          <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          Empreendimentos Ativos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ativos.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum empreendimento ativo</p>
          ) : (
            ativos.map((emp) => (
              <div key={emp.id} className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-medium text-sm sm:text-base text-gray-900 truncate">{emp.nome}</span>
                  <Badge className={`${statusColors[emp.status]} text-xs w-fit`}>
                    {statusLabels[emp.status]}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                    <span>Progresso</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                {emp.valor_total && (
                  <p className="text-xs sm:text-sm text-gray-600">
                    Valor: <span className="font-semibold">R$ {emp.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}