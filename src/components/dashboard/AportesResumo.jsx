import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AportesResumo({ aportes = [] }) {
  // Garantir que é array
  const aportesArray = Array.isArray(aportes) ? aportes : [];

  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);

  const aportesMes = aportesArray.filter(a => {
    if (!a?.data_pagamento) return false;
    try {
      const dataPag = parseISO(a.data_pagamento);
      return dataPag >= inicioMes && dataPag <= fimMes && a.status === 'pago';
    } catch {
      return false;
    }
  });

  const valorMes = aportesMes.reduce((sum, a) => sum + (a?.valor || 0), 0);
  const pendentes = aportesArray.filter(a => a?.status === 'pendente' || a?.status === 'atrasado');
  const valorPendente = pendentes.reduce((sum, a) => sum + (a?.valor || 0), 0);

  return (
    <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--wine-700)] text-base sm:text-lg">
          <Coins className="w-5 h-5" />
          Aportes de Sócios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Aportes do Mês</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {(valorMes / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {aportesMes.length} aporte{aportesMes.length !== 1 ? 's' : ''} realizado{aportesMes.length !== 1 ? 's' : ''}
            </p>
          </div>

          {pendentes.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-600 mb-1">Pendentes</p>
              <p className="text-xl font-bold text-orange-600">
                R$ {(valorPendente / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pendentes.length} aporte{pendentes.length !== 1 ? 's' : ''} pendente{pendentes.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {aportesArray.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Nenhum aporte cadastrado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}