import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp } from "lucide-react";

export default function TabelaContemplacao({ consorcios, empreendimentos }) {
  // Agrupar por grupo e empreendimento
  const grupos = {};

  consorcios.forEach(c => {
    const key = `${c.empreendimento_id}-${c.grupo}`;
    if (!grupos[key]) {
      grupos[key] = {
        empreendimento_id: c.empreendimento_id,
        grupo: c.grupo,
        quantidade_cotas_grupo: c.quantidade_cotas_grupo || 0,
        cotas: [],
        contempladas_lance: 0,
        contempladas_sorteio: 0,
        nao_contempladas: 0,
      };
    }

    grupos[key].cotas.push(c);
    
    if (c.contemplado) {
      if (c.tipo_contemplacao === 'lance') {
        grupos[key].contempladas_lance++;
      } else if (c.tipo_contemplacao === 'sorteio') {
        grupos[key].contempladas_sorteio++;
      }
    } else {
      grupos[key].nao_contempladas++;
    }
  });

  const gruposArray = Object.values(grupos);

  if (gruposArray.length === 0) {
    return (
      <Card className="shadow-lg border-t-4 border-[var(--grape-600)]">
        <CardHeader>
          <CardTitle className="text-[var(--wine-700)]">Tabela de Contemplações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">Nenhum consórcio cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-t-4 border-[var(--grape-600)]">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)]">Tabela de Contemplações por Grupo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {gruposArray.map((grupo, index) => {
            const emp = empreendimentos.find(e => e.id === grupo.empreendimento_id);
            const totalContempladas = grupo.contempladas_lance + grupo.contempladas_sorteio;
            const totalCotas = grupo.cotas.length;
            const percentualContemplado = totalCotas > 0 ? (totalContempladas / totalCotas) * 100 : 0;
            const percentualGrupo = grupo.quantidade_cotas_grupo > 0 
              ? (totalContempladas / grupo.quantidade_cotas_grupo) * 100 
              : percentualContemplado;

            return (
              <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-lg font-bold text-[var(--wine-700)]">
                      Grupo {grupo.grupo}
                    </p>
                    <p className="text-sm text-gray-600">{emp?.nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {totalContempladas}
                      {grupo.quantidade_cotas_grupo > 0 && (
                        <span className="text-sm text-gray-500"> / {grupo.quantidade_cotas_grupo}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">Contempladas</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="text-2xl font-bold text-blue-600">{grupo.contempladas_lance}</p>
                    <p className="text-xs text-gray-600">Lance</p>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <p className="text-2xl font-bold text-purple-600">{grupo.contempladas_sorteio}</p>
                    <p className="text-xs text-gray-600">Sorteio</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-gray-600">{grupo.nao_contempladas}</p>
                    <p className="text-xs text-gray-600">Ativas</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progresso do Grupo:</span>
                    <span className="font-semibold text-[var(--wine-700)]">
                      {percentualGrupo.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={percentualGrupo} className="h-3" />
                  
                  <div className="flex gap-2 text-xs text-gray-500 mt-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {grupo.contempladas_lance} Lance
                    </Badge>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      <Award className="w-3 h-3 mr-1" />
                      {grupo.contempladas_sorteio} Sorteio
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}