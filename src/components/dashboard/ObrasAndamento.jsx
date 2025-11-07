import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HardHat, AlertCircle } from "lucide-react";

export default function ObrasAndamento({ cronogramasObra = [], unidades = [] }) {
  // Garantir que são arrays
  const cronogramasArray = Array.isArray(cronogramasObra) ? cronogramasObra : [];
  const unidadesArray = Array.isArray(unidades) ? unidades : [];

  const obrasEmAndamento = cronogramasArray.filter(c => c?.status === 'em_andamento');
  const obrasAtrasadas = cronogramasArray.filter(c => c?.status === 'atrasada');

  const statusColors = {
    nao_iniciada: "bg-gray-100 text-gray-700",
    em_andamento: "bg-blue-100 text-blue-700",
    concluida: "bg-green-100 text-green-700",
    atrasada: "bg-red-100 text-red-700",
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
        {obrasAtrasadas.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">
              <strong>{obrasAtrasadas.length}</strong> obra{obrasAtrasadas.length > 1 ? 's' : ''} atrasada{obrasAtrasadas.length > 1 ? 's' : ''}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {obrasEmAndamento.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Nenhuma obra em andamento</p>
            </div>
          ) : (
            obrasEmAndamento.slice(0, 5).map((obra) => {
              if (!obra) return null;
              const unidade = unidadesArray.find(u => u?.id === obra.unidade_id);

              return (
                <div key={obra.id} className="p-3 border rounded-lg hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">
                        {obra.etapa || 'N/A'}
                      </h4>
                      <p className="text-xs text-gray-600 truncate">
                        {unidade?.codigo || 'Unidade N/A'}
                      </p>
                    </div>
                    <Badge className={statusColors[obra.status] || statusColors.em_andamento}>
                      {obra.status === 'em_andamento' ? 'Em Andamento' : 
                       obra.status === 'atrasada' ? 'Atrasada' : 
                       obra.status || 'N/A'}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progresso</span>
                      <span className="font-semibold">{obra.percentual_conclusao || 0}%</span>
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