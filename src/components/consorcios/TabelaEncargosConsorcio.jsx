import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function TabelaEncargosConsorcio({ 
  valorParcela, 
  fundoReserva, 
  fundoComum,
  taxaAdministracao, 
  parcelasTotal 
}) {
  const totalGeral = parcelasTotal > 0 ? valorParcela * parcelasTotal : 0;
  const totalFundoReservaPeriodo = parcelasTotal > 0 ? fundoReserva * parcelasTotal : 0;
  const totalFundoComumPeriodo = parcelasTotal > 0 ? fundoComum * parcelasTotal : 0;
  const totalTaxaAdminPeriodo = parcelasTotal > 0 ? taxaAdministracao * parcelasTotal : 0;

  return (
    <Card className="border-t-4 border-indigo-500">
      <CardHeader>
        <CardTitle className="text-indigo-700 text-lg">Composição da Parcela</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          O valor da parcela é composto pelos seguintes encargos:
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Componente</TableHead>
              <TableHead className="text-right">Valor por Parcela</TableHead>
              <TableHead className="text-right">% da Parcela</TableHead>
              <TableHead className="text-right">Total no Período</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-orange-50">
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                    Encargo
                  </Badge>
                  <span>Fundo de Reserva</span>
                </div>
              </TableCell>
              <TableCell className="text-right text-orange-700 font-semibold">
                R$ {fundoReserva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right text-orange-700">
                {valorParcela > 0 ? ((fundoReserva / valorParcela) * 100).toFixed(2) : 0}%
              </TableCell>
              <TableCell className="text-right text-orange-700 font-semibold">
                R$ {totalFundoReservaPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>

            <TableRow className="bg-blue-50">
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    Encargo
                  </Badge>
                  <span>Fundo Comum</span>
                </div>
              </TableCell>
              <TableCell className="text-right text-blue-700 font-semibold">
                R$ {fundoComum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right text-blue-700">
                {valorParcela > 0 ? ((fundoComum / valorParcela) * 100).toFixed(2) : 0}%
              </TableCell>
              <TableCell className="text-right text-blue-700 font-semibold">
                R$ {totalFundoComumPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>

            <TableRow className="bg-purple-50">
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                    Encargo
                  </Badge>
                  <span>Taxa de Administração</span>
                </div>
              </TableCell>
              <TableCell className="text-right text-purple-700 font-semibold">
                R$ {taxaAdministracao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right text-purple-700">
                {valorParcela > 0 ? ((taxaAdministracao / valorParcela) * 100).toFixed(2) : 0}%
              </TableCell>
              <TableCell className="text-right text-purple-700 font-semibold">
                R$ {totalTaxaAdminPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>

            <TableRow className="bg-green-50 border-t-2">
              <TableCell className="font-bold text-lg">Valor Total da Parcela</TableCell>
              <TableCell className="text-right font-bold text-green-700 text-lg">
                R$ {valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right font-semibold text-green-700">
                100%
              </TableCell>
              <TableCell className="text-right font-bold text-green-700 text-lg">
                R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {parcelasTotal > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Investimento Total ({parcelasTotal} parcelas)</p>
                <p className="text-xl font-bold text-indigo-700">
                  R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total de Encargos Inclusos</p>
                <p className="text-xl font-bold text-purple-700">
                  R$ {(totalFundoReservaPeriodo + totalFundoComumPeriodo + totalTaxaAdminPeriodo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}