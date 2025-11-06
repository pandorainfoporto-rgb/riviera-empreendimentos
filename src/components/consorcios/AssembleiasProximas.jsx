import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Award, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, addMonths, parseISO, isAfter, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AssembleiasProximas({ consorcios = [], clientes = [], unidades = [] }) {
  const hoje = startOfDay(new Date());
  
  // Agrupar consórcios por grupo
  const grupos = {};
  (consorcios || []).forEach(consorcio => {
    if (consorcio.grupo && !consorcio.resgatado) {
      if (!grupos[consorcio.grupo]) {
        grupos[consorcio.grupo] = {
          grupo: consorcio.grupo,
          dia_assembleia: consorcio.dia_assembleia || 1,
          cotas: [],
        };
      }
      grupos[consorcio.grupo].cotas.push(consorcio);
    }
  });

  // Calcular próximas assembleias
  const assembleiasProximas = Object.values(grupos).map(grupo => {
    const diaAssembleia = grupo.dia_assembleia || 1;
    const mesAtual = new Date();
    
    // Tentar mes atual
    let proximaAssembleia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), diaAssembleia);
    
    // Se já passou no mês atual, pegar próximo mês
    if (isBefore(proximaAssembleia, hoje)) {
      proximaAssembleia = addMonths(proximaAssembleia, 1);
    }
    
    return {
      ...grupo,
      data_proxima_assembleia: proximaAssembleia,
      cotas_ativas: grupo.cotas.filter(c => !c.contemplado).length,
      cotas_contempladas: grupo.cotas.filter(c => c.contemplado).length,
    };
  })
  .filter(ass => isAfter(ass.data_proxima_assembleia, hoje)) // Filtrar apenas assembleias futuras
  .sort((a, b) => a.data_proxima_assembleia - b.data_proxima_assembleia)
  .slice(0, 5);

  return (
    <Card className="shadow-lg border-t-4 border-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Calendar className="w-5 h-5" />
          Próximas Assembleias
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assembleiasProximas.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhuma assembleia programada</p>
        ) : (
          <div className="space-y-3">
            {assembleiasProximas.map((assembleia, idx) => {
              const dataFormatada = format(assembleia.data_proxima_assembleia, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
              const diasRestantes = Math.ceil((assembleia.data_proxima_assembleia - hoje) / (1000 * 60 * 60 * 24));
              
              return (
                <div
                  key={idx}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-blue-900">Grupo {assembleia.grupo}</h4>
                      <p className="text-sm text-blue-700">{dataFormatada}</p>
                    </div>
                    <Badge className="bg-blue-600 text-white">
                      {diasRestantes === 0 ? 'Hoje' : diasRestantes === 1 ? 'Amanhã' : `${diasRestantes} dias`}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{assembleia.cotas_ativas} ativas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">{assembleia.cotas_contempladas} contempladas</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}