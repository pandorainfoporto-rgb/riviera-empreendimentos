import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function RelatorioObras({ tipo }) {
  const { data: cronogramasObra = [] } = useQuery({
    queryKey: ['cronogramasObra'],
    queryFn: () => base44.entities.CronogramaObra.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const statusCores = {
    nao_iniciada: "bg-gray-100 text-gray-700",
    em_andamento: "bg-blue-100 text-blue-700",
    concluida: "bg-green-100 text-green-700",
    atrasada: "bg-red-100 text-red-700",
    pausada: "bg-yellow-100 text-yellow-700",
  };

  const statusLabels = {
    nao_iniciada: "Não Iniciada",
    em_andamento: "Em Andamento",
    concluida: "Concluída",
    atrasada: "Atrasada",
    pausada: "Pausada",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      <div className="space-y-4">
        {unidades.map(unidade => {
          const etapasUnidade = cronogramasObra.filter(c => c.unidade_id === unidade.id);
          if (etapasUnidade.length === 0) return null;

          const progressoMedio = etapasUnidade.reduce((sum, e) => sum + (e.percentual_conclusao || 0), 0) / etapasUnidade.length;

          return (
            <Card key={unidade.id} className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--wine-700)]">{unidade.codigo}</h3>
                    <p className="text-sm text-gray-600">{etapasUnidade.length} etapa(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[var(--wine-700)]">{progressoMedio.toFixed(0)}%</p>
                    <p className="text-xs text-gray-500">Conclusão</p>
                  </div>
                </div>

                <Progress value={progressoMedio} className="h-3 mb-4" />

                <div className="space-y-2">
                  {etapasUnidade.map(etapa => (
                    <div key={etapa.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{etapa.etapa}</p>
                        <p className="text-xs text-gray-600">{etapa.fase}</p>
                      </div>
                      <Badge className={statusCores[etapa.status]}>
                        {statusLabels[etapa.status]}
                      </Badge>
                      <p className="ml-4 font-semibold text-sm">{etapa.percentual_conclusao || 0}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}