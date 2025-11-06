import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { HardHat } from "lucide-react";

export default function ObrasAndamento({ cronogramasObra = [], unidades = [] }) {
  const obrasAtivas = (cronogramasObra || [])
    .filter(c => c.status === 'em_andamento' || c.status === 'atrasada')
    .sort((a, b) => (b.percentual_conclusao || 0) - (a.percentual_conclusao || 0))
    .slice(0, 5);

  const statusColors = {
    em_andamento: "bg-blue-100 text-blue-800",
    atrasada: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    em_andamento: "Em Andamento",
    atrasada: "Atrasada",
  };

  return (
    <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--wine-700)] text-base sm:text-lg">
          <HardHat className="w-5 h-5" />
          Obras em Andamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(!obrasAtivas || obrasAtivas.length === 0) ? (
            <p className="text-sm text-gray-500 text-center py-4">Nenhuma obra em andamento</p>
          ) : (
            (obrasAtivas || []).map((obra) => {
              const uni = (unidades || []).find(u => u.id === obra.unidade_id);
              return (
                <div key={obra.id} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{obra.etapa}</p>
                      <p className="text-xs text-gray-600 truncate">{uni?.codigo || 'N/A'}</p>
                    </div>
                    <Badge className={`${statusColors[obra.status] || 'bg-gray-100 text-gray-800'} text-xs w-fit`}>
                      {statusLabels[obra.status] || obra.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progresso</span>
                      <span className="font-medium">{obra.percentual_conclusao || 0}%</span>
                    </div>
                    <Progress value={obra.percentual_conclusao || 0} className="h-2" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}