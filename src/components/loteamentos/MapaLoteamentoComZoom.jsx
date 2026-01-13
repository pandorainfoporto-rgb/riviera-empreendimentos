import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const STATUS_COLORS = {
  disponivel: { fill: 'rgba(34, 197, 94, 0.3)', stroke: '#22C55E', label: 'Disponível' },
  reservado: { fill: 'rgba(251, 191, 36, 0.3)', stroke: '#FBBF24', label: 'Reservado' },
  em_negociacao: { fill: 'rgba(59, 130, 246, 0.3)', stroke: '#3B82F6', label: 'Em Negociação' },
  vendido: { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#EF4444', label: 'Vendido' }
};

const HIGHLIGHT_COLOR = { 
  fill: 'rgba(147, 51, 234, 0.5)', // Roxo vibrante
  stroke: '#9333EA', // Roxo forte
  strokeWidth: 4
};

export default function MapaLoteamentoComZoom({ loteamentoId, highlightLoteId }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });

  const { data: loteamento, isLoading: loadingLoteamento } = useQuery({
    queryKey: ['loteamento', loteamentoId],
    queryFn: () => base44.entities.Loteamento.get(loteamentoId),
    enabled: !!loteamentoId
  });

  const { data: lotes = [], isLoading: loadingLotes } = useQuery({
    queryKey: ['lotes', loteamentoId],
    queryFn: () => base44.entities.Lote.filter({ loteamento_id: loteamentoId }),
    enabled: !!loteamentoId
  });

  useEffect(() => {
    if (imgRef.current && loteamento?.arquivo_planta_url) {
      const img = imgRef.current;
      img.onload = () => {
        setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        aplicarZoomNoLote();
      };
    }
  }, [loteamento?.arquivo_planta_url]);

  useEffect(() => {
    if (highlightLoteId && lotes.length > 0 && imgDimensions.width > 0) {
      aplicarZoomNoLote();
    }
  }, [highlightLoteId, lotes, imgDimensions]);

  const aplicarZoomNoLote = () => {
    if (!highlightLoteId || lotes.length === 0) return;

    const loteDestacado = lotes.find(l => l.id === highlightLoteId);
    if (!loteDestacado?.coordenadas_mapa || loteDestacado.coordenadas_mapa.length === 0) {
      redrawCanvas();
      return;
    }

    // Calcular centro do lote
    const centroX = loteDestacado.coordenadas_mapa.reduce((sum, p) => sum + p[0], 0) / loteDestacado.coordenadas_mapa.length;
    const centroY = loteDestacado.coordenadas_mapa.reduce((sum, p) => sum + p[1], 0) / loteDestacado.coordenadas_mapa.length;

    // Aplicar zoom de 5x (500%)
    const scale = 5;
    
    // Calcular offset para centralizar o lote
    const container = containerRef.current;
    if (!container) {
      redrawCanvas();
      return;
    }

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const offsetX = (containerWidth / 2) - (centroX * scale);
    const offsetY = (containerHeight / 2) - (centroY * scale);

    setTransform({ scale, offsetX, offsetY });
    
    setTimeout(() => redrawCanvas(), 100);
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgDimensions.width) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar lotes
    lotes.forEach((lote) => {
      if (!lote.coordenadas_mapa || lote.coordenadas_mapa.length === 0) return;

      const isHighlighted = highlightLoteId === lote.id;
      const statusColor = STATUS_COLORS[lote.status] || STATUS_COLORS.disponivel;

      ctx.beginPath();
      ctx.moveTo(lote.coordenadas_mapa[0][0], lote.coordenadas_mapa[0][1]);
      
      for (let i = 1; i < lote.coordenadas_mapa.length; i++) {
        ctx.lineTo(lote.coordenadas_mapa[i][0], lote.coordenadas_mapa[i][1]);
      }
      
      ctx.closePath();

      // Preenchimento - roxo vibrante para o destacado
      ctx.fillStyle = isHighlighted ? HIGHLIGHT_COLOR.fill : statusColor.fill;
      ctx.fill();

      // Borda - roxo forte e mais grossa para o destacado
      ctx.strokeStyle = isHighlighted ? HIGHLIGHT_COLOR.stroke : statusColor.stroke;
      ctx.lineWidth = isHighlighted ? HIGHLIGHT_COLOR.strokeWidth : 2;
      ctx.stroke();

      // Número do lote
      const centroX = lote.coordenadas_mapa.reduce((sum, p) => sum + p[0], 0) / lote.coordenadas_mapa.length;
      const centroY = lote.coordenadas_mapa.reduce((sum, p) => sum + p[1], 0) / lote.coordenadas_mapa.length;
      
      ctx.fillStyle = isHighlighted ? '#9333EA' : '#000';
      ctx.font = isHighlighted ? 'bold 18px Arial' : 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(lote.numero, centroX, centroY);
      
      if (isHighlighted) {
        ctx.font = '14px Arial';
        ctx.fillText(`${lote.area?.toFixed(0) || 0} m²`, centroX, centroY + 20);
      }
    });
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
    <div 
      ref={containerRef}
      className="relative border-2 border-purple-300 rounded-lg overflow-auto bg-gray-100 shadow-xl"
      style={{ height: '600px' }}
    >
      <div 
        className="relative inline-block"
        style={{ 
          transform: `scale(${transform.scale}) translate(${transform.offsetX / transform.scale}px, ${transform.offsetY / transform.scale}px)`,
          transformOrigin: 'top left',
          transition: 'transform 0.5s ease-in-out'
        }}
      >
        <img
          ref={imgRef}
          src={loteamento.arquivo_planta_url}
          alt="Planta do loteamento"
          className="block"
          style={{ 
            width: `${imgDimensions.width}px`,
            height: `${imgDimensions.height}px`,
            maxWidth: 'none'
          }}
        />
        <canvas
          ref={canvasRef}
          width={imgDimensions.width}
          height={imgDimensions.height}
          className="absolute top-0 left-0"
          style={{ 
            width: `${imgDimensions.width}px`,
            height: `${imgDimensions.height}px`
          }}
        />
      </div>
    </div>
  );
}