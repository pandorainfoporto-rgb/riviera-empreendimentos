import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Ruler, DollarSign } from "lucide-react";

const STATUS_COLORS = {
  disponivel: { bg: '#10b981', text: 'text-green-700', border: 'border-green-500' },
  reservado: { bg: '#f59e0b', text: 'text-yellow-700', border: 'border-yellow-500' },
  em_negociacao: { bg: '#3b82f6', text: 'text-blue-700', border: 'border-blue-500' },
  vendido: { bg: '#6b7280', text: 'text-gray-700', border: 'border-gray-500' },
  indisponivel: { bg: '#ef4444', text: 'text-red-700', border: 'border-red-500' },
};

const STATUS_LABELS = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  em_negociacao: 'Em Negociação',
  vendido: 'Vendido',
  indisponivel: 'Indisponível',
};

export default function LoteTooltip({ lote, position }) {
  if (!lote) return null;

  const statusInfo = STATUS_COLORS[lote.status] || STATUS_COLORS.disponivel;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x + 15}px`,
        top: `${position.y + 15}px`,
      }}
    >
      <Card className="shadow-2xl border-2 w-64 animate-in fade-in zoom-in duration-200">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900">Lote {lote.numero}</h4>
              <Badge 
                className={`${statusInfo.border} border-2 ${statusInfo.text}`}
                style={{ backgroundColor: statusInfo.bg + '20' }}
              >
                {STATUS_LABELS[lote.status]}
              </Badge>
            </div>

            {lote.quadra && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <MapPin className="w-3 h-3" />
                <span>Quadra {lote.quadra}</span>
              </div>
            )}

            {lote.area && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Ruler className="w-3 h-3" />
                <span>{lote.area.toFixed(0)} m²</span>
              </div>
            )}

            {lote.valor_total && (
              <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
                <DollarSign className="w-3 h-3" />
                <span>R$ {lote.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <p className="text-xs text-gray-500 italic mt-2 pt-2 border-t">
              Clique para ver detalhes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}