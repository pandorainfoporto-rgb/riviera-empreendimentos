import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const STATUS_COLORS = {
  disponivel: { fill: 'rgba(34, 197, 94, 0.3)', stroke: '#22C55E', label: 'Disponível' },
  reservado: { fill: 'rgba(251, 191, 36, 0.3)', stroke: '#FBBF24', label: 'Reservado' },
  em_negociacao: { fill: 'rgba(59, 130, 246, 0.3)', stroke: '#3B82F6', label: 'Em Negociação' },
  vendido: { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#EF4444', label: 'Vendido' }
};

export default function MapaLoteamento({ loteamentoId, onLoteClick, highlightLoteId }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [hoveredLote, setHoveredLote] = useState(null);

  const { data: loteamento, isLoading: loadingLoteamento } = useQuery({
    queryKey: ['loteamento', loteamentoId],
    queryFn: () => base44.entities.Loteamento.get(loteamentoId),
    enabled: !!loteamentoId
  });

  const { data: lotes = [], isLoading: loadingLotes } = useQuery({
    queryKey: ['lotes', loteamentoId],
    queryFn: () => base44.entities.Lote.filter({ loteamento_id: loteamentoId }),
    enabled: !!loteamentoId,
    refetchInterval: 5000
  });

  useEffect(() => {
    if (imgRef.current && loteamento?.arquivo_planta_url) {
      const img = imgRef.current;
      img.onload = () => {
        setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        redrawCanvas();
      };
    }
  }, [loteamento?.arquivo_planta_url]);

  useEffect(() => {
    redrawCanvas();
  }, [lotes, imgDimensions, hoveredLote, highlightLoteId]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgDimensions.width || !lotes.length) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    lotes.forEach((lote) => {
      if (!lote.coordenadas_mapa || lote.coordenadas_mapa.length === 0) return;

      const isHovered = hoveredLote === lote.id;
      const isHighlighted = highlightLoteId === lote.id;
      const statusColor = STATUS_COLORS[lote.status] || STATUS_COLORS.disponivel;

      ctx.beginPath();
      ctx.moveTo(lote.coordenadas_mapa[0][0], lote.coordenadas_mapa[0][1]);
      
      for (let i = 1; i < lote.coordenadas_mapa.length; i++) {
        ctx.lineTo(lote.coordenadas_mapa[i][0], lote.coordenadas_mapa[i][1]);
      }
      
      ctx.closePath();

      // Preenchimento
      ctx.fillStyle = isHovered || isHighlighted 
        ? 'rgba(146, 43, 62, 0.4)' 
        : statusColor.fill;
      ctx.fill();

      // Borda
      ctx.strokeStyle = isHighlighted ? '#922B3E' : statusColor.stroke;
      ctx.lineWidth = isHighlighted ? 3 : 2;
      ctx.stroke();

      // Número do lote
      const centroX = lote.coordenadas_mapa.reduce((sum, p) => sum + p[0], 0) / lote.coordenadas_mapa.length;
      const centroY = lote.coordenadas_mapa.reduce((sum, p) => sum + p[1], 0) / lote.coordenadas_mapa.length;
      
      ctx.fillStyle = '#000';
      ctx.font = isHovered ? 'bold 16px Arial' : 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(lote.numero, centroX, centroY);
      
      if (isHovered) {
        ctx.font = '12px Arial';
        ctx.fillText(`${lote.area?.toFixed(0) || 0} m²`, centroX, centroY + 18);
      }
    });
  };

  const handleCanvasClick = (e) => {
    if (!onLoteClick) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (imgDimensions.width / rect.width);
    const y = (e.clientY - rect.top) * (imgDimensions.height / rect.height);

    // Verificar qual lote foi clicado
    for (const lote of lotes) {
      if (!lote.coordenadas_mapa) continue;
      
      if (isPointInPolygon([x, y], lote.coordenadas_mapa)) {
        onLoteClick(lote);
        return;
      }
    }
  };

  const handleCanvasHover = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (imgDimensions.width / rect.width);
    const y = (e.clientY - rect.top) * (imgDimensions.height / rect.height);

    let found = false;
    for (const lote of lotes) {
      if (!lote.coordenadas_mapa) continue;
      
      if (isPointInPolygon([x, y], lote.coordenadas_mapa)) {
        setHoveredLote(lote.id);
        found = true;
        return;
      }
    }
    
    if (!found) {
      setHoveredLote(null);
    }
  };

  const isPointInPolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      
      const intersect = ((yi > point[1]) !== (yj > point[1]))
        && (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  if (loadingLoteamento || loadingLotes) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[var(--wine-600)]" />
          <p className="text-gray-600">Carregando mapa...</p>
        </CardContent>
      </Card>
    );
  }

  if (!loteamento?.arquivo_planta_url) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Nenhuma planta disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mapa do Loteamento</span>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(STATUS_COLORS).map(([status, config]) => (
              <Badge
                key={status}
                style={{ 
                  backgroundColor: config.fill.replace('0.3', '0.8'),
                  borderColor: config.stroke,
                  color: '#000'
                }}
                variant="outline"
                className="text-xs"
              >
                {config.label}
              </Badge>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border rounded-lg overflow-hidden bg-gray-100">
          <img
            ref={imgRef}
            src={loteamento.arquivo_planta_url}
            alt="Planta do loteamento"
            className="w-full h-auto"
            style={{ display: 'block' }}
          />
          <canvas
            ref={canvasRef}
            width={imgDimensions.width}
            height={imgDimensions.height}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasHover}
            className="absolute top-0 left-0 w-full h-auto cursor-pointer"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(
            lotes.reduce((acc, lote) => {
              acc[lote.status] = (acc[lote.status] || 0) + 1;
              return acc;
            }, {})
          ).map(([status, count]) => (
            <div key={status} className="text-center p-2 bg-gray-50 rounded">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-gray-600">{STATUS_COLORS[status]?.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}