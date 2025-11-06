import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Award, User, Building2 } from "lucide-react";

export default function GridCotasDialog({ grupo, consorcios = [], clientes = [], unidades = [], onClose }) {
  const cotasDoGrupo = useMemo(() => {
    return (consorcios || []).filter(c => c.grupo === grupo);
  }, [consorcios, grupo]);

  const clientesMap = useMemo(() => {
    return (clientes || []).reduce((acc, cliente) => {
      acc[cliente.id] = cliente;
      return acc;
    }, {});
  }, [clientes]);

  const unidadesMap = useMemo(() => {
    return (unidades || []).reduce((acc, unidade) => {
      acc[unidade.id] = unidade;
      return acc;
    }, {});
  }, [unidades]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--wine-700)]">
            Cotas do Grupo {grupo}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Total de {cotasDoGrupo.length} cota(s) cadastrada(s)
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
          {cotasDoGrupo.map((consorcio) => {
            const cliente = clientesMap[consorcio.cliente_id];
            const unidade = unidadesMap[consorcio.unidade_id];

            return (
              <Card 
                key={consorcio.id}
                className={`transition-all hover:shadow-lg ${
                  consorcio.contemplado 
                    ? 'border-2 border-green-500 bg-green-50' 
                    : consorcio.eh_investimento_caixa
                    ? 'border-2 border-purple-500 bg-purple-50'
                    : 'border border-gray-200'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {consorcio.cota}
                    </span>
                    {consorcio.contemplado && (
                      <Award className="w-5 h-5 text-green-600" />
                    )}
                  </div>

                  {consorcio.eh_investimento_caixa ? (
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      Investimento Caixa
                    </Badge>
                  ) : (
                    <>
                      {cliente && (
                        <div className="flex items-start gap-2 mt-2">
                          <User className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-700 line-clamp-2 leading-tight">
                            {cliente.nome}
                          </p>
                        </div>
                      )}

                      {unidade && (
                        <div className="flex items-center gap-2 mt-1">
                          <Building2 className="w-3 h-3 text-gray-500 flex-shrink-0" />
                          <p className="text-xs text-gray-600 font-mono">
                            {unidade.codigo}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {consorcio.contemplado && (
                    <Badge className="bg-green-100 text-green-700 text-xs mt-2">
                      {consorcio.tipo_contemplacao === 'lance' 
                        ? `Lance ${consorcio.percentual_lance}%`
                        : 'Sorteio'
                      }
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {cotasDoGrupo.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              Nenhuma cota cadastrada neste grupo
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}