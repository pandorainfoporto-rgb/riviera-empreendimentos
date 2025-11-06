import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function RelatorioConsorcios({ tipo }) {
  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: () => base44.entities.Consorcio.list(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const totalConsorcios = consorcios.length;
  const contemplados = consorcios.filter(c => c.contemplado).length;
  const ativos = consorcios.filter(c => !c.contemplado).length;
  const totalInvestido = consorcios.reduce((sum, c) => {
    const valorPago = (c.parcelas_pagas || 0) * (c.valor_parcela || 0);
    return sum + valorPago;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-t-4 border-purple-500">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total de Cotas</p>
            <p className="text-3xl font-bold text-gray-900">{totalConsorcios}</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-green-500">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Contempladas</p>
            <p className="text-3xl font-bold text-green-600">{contemplados}</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Ativas</p>
            <p className="text-3xl font-bold text-blue-600">{ativos}</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Investido</p>
            <p className="text-xl font-bold text-[var(--wine-700)]">
              R$ {(totalInvestido / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {consorcios.map(cons => {
          const cliente = clientes.find(c => c.id === cons.cliente_id);
          const percentual = (cons.parcelas_pagas / cons.parcelas_total) * 100;

          return (
            <Card key={cons.id} className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--wine-700)]">
                      Grupo {cons.grupo} - Cota {cons.cota}
                    </h3>
                    <p className="text-sm text-gray-600">{cliente?.nome || "Investimento Caixa"}</p>
                  </div>
                  <div className="flex gap-2">
                    {cons.contemplado && (
                      <Badge className="bg-green-100 text-green-700">Contemplada</Badge>
                    )}
                    {cons.tipo_contemplacao !== 'nao_contemplado' && (
                      <Badge variant="outline">{cons.tipo_contemplacao}</Badge>
                    )}
                  </div>
                </div>

                <Progress value={percentual} className="h-2 mb-2" />
                <p className="text-sm text-gray-600">
                  {cons.parcelas_pagas} / {cons.parcelas_total} parcelas ({percentual.toFixed(1)}%)
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}