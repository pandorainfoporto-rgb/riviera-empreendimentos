import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from "lucide-react";

export default function UnidadesStatus({ unidades = [] }) {
  // Garantir que é array
  const unidadesArray = Array.isArray(unidades) ? unidades : [];

  const disponiveis = unidadesArray.filter(u => u?.status === 'disponivel').length;
  const vendidas = unidadesArray.filter(u => u?.status === 'vendida').length;
  const reservadas = unidadesArray.filter(u => u?.status === 'reservada').length;
  const emConstrucao = unidadesArray.filter(u => u?.status === 'em_construcao').length;

  const percentualVendido = unidadesArray.length > 0 
    ? Math.round((vendidas / unidadesArray.length) * 100) 
    : 0;

  return (
    <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--wine-700)] text-base sm:text-lg">
          <Building className="w-5 h-5" />
          Status das Unidades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total de Unidades</span>
            <span className="text-xl font-bold text-gray-900">{unidadesArray.length}</span>
          </div>

          <div className="pt-3 border-t space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-700">Vendidas</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{vendidas}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-700">Disponíveis</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{disponiveis}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-700">Reservadas</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{reservadas}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-700">Em Construção</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{emConstrucao}</span>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Taxa de Vendas</span>
              <span className="text-lg font-bold text-[var(--wine-700)]">{percentualVendido}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] h-3 rounded-full transition-all duration-500"
                style={{ width: `${percentualVendido}%` }}
              ></div>
            </div>
          </div>

          {unidadesArray.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Nenhuma unidade cadastrada</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}