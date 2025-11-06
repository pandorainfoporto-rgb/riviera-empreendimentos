import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RelatorioAportesSocios() {
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: aportes = [] } = useQuery({
    queryKey: ['aportesSocios'],
    queryFn: () => base44.entities.AporteSocio.list(),
  });

  const { data: socios = [] } = useQuery({
    queryKey: ['socios'],
    queryFn: () => base44.entities.Socio.list(),
  });

  const aportesFiltered = aportes.filter(a => {
    if (a.status !== 'pago' || !a.data_pagamento) return false;
    const data = parseISO(a.data_pagamento);
    return data >= parseISO(dataInicio) && data <= parseISO(dataFim);
  });

  const aportesPorSocio = socios.map(socio => ({
    socio,
    aportes: aportesFiltered.filter(a => a.socio_id === socio.id),
    total: aportesFiltered.filter(a => a.socio_id === socio.id).reduce((sum, a) => sum + (a.valor || 0), 0),
  })).filter(item => item.total > 0);

  const totalGeral = aportesPorSocio.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <Label>Data Início</Label>
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Data Fim</Label>
          <Input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-[var(--wine-700)]">Aportes por Sócio</h3>
            <p className="text-2xl font-bold text-blue-700">
              Total: R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="space-y-4">
            {aportesPorSocio.map(item => (
              <Card key={item.socio.id} className="shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{item.socio.nome}</h4>
                      <p className="text-sm text-gray-600">{item.aportes.length} aporte(s)</p>
                    </div>
                    <p className="text-xl font-bold text-blue-700">
                      R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {item.aportes.map(aporte => (
                      <div key={aporte.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">
                          {format(parseISO(aporte.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })} - {aporte.mes_referencia}
                        </span>
                        <span className="font-semibold text-gray-900">
                          R$ {aporte.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}