import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS = {
  disponivel: { fill: 'rgba(34, 197, 94, 0.3)', stroke: '#22C55E', label: 'Disponível' },
  reservado: { fill: 'rgba(251, 191, 36, 0.3)', stroke: '#FBBF24', label: 'Reservado' },
  em_negociacao: { fill: 'rgba(59, 130, 246, 0.3)', stroke: '#3B82F6', label: 'Em Negociação' },
  vendido: { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#EF4444', label: 'Vendido' }
};

const HIGHLIGHT_COLOR = { 
  fill: 'rgba(147, 51, 234, 0.6)', // Roxo vibrante
  stroke: '#7C3AED', // Roxo forte
  strokeWidth: 5
};

export default function MapaLoteamentoComZoom({ loteamentoId, highlightLoteId }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredLoteId, setHoveredLoteId] = useState(null);

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
      const handleLoad = () => {
        setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        aplicarZoomNoLote();
      };
      
      if (img.complete) {
        handleLoad();
      } else {
        img.onload = handleLoad;
      }
    }
  }, [loteamento?.arquivo_planta_url, lotes]);

  useEffect(() => {
    if (highlightLoteId && lotes.length > 0 && imgDimensions.width > 0) {
      aplicarZoomNoLote();
    }
  }, [highlightLoteId, lotes, imgDimensions]);

  useEffect(() => {
    redrawCanvas();
  }, [transform, lotes, imgDimensions]);

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

    // Aplicar zoom de 2x (200%)
    const scale = 2;
    
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
  };

  const handleZoomIn = () => {
    setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 1, 10) }));
  };

  const handleZoomOut = () => {
    setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 1, 0.5) }));
  };

  const handleResetZoom = () => {
    setTransform({ scale: 1, offsetX: 0, offsetY: 0 });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.offsetX, y: e.clientY - transform.offsetY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      offsetX: e.clientX - dragStart.x,
      offsetY: e.clientY - dragStart.y
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasMouseMove = (e) => {
    if (isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - transform.offsetX) / transform.scale;
    const y = (e.clientY - rect.top - transform.offsetY) / transform.scale;

    let foundLote = null;
    for (const lote of lotes) {
      if (!lote.coordenadas_mapa || lote.coordenadas_mapa.length === 0) continue;
      
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(lote.coordenadas_mapa[0][0], lote.coordenadas_mapa[0][1]);
      for (let i = 1; i < lote.coordenadas_mapa.length; i++) {
        ctx.lineTo(lote.coordenadas_mapa[i][0], lote.coordenadas_mapa[i][1]);
      }
      ctx.closePath();
      
      if (ctx.isPointInPath(x, y)) {
        foundLote = lote.id;
        break;
      }
    }
    
    setHoveredLoteId(foundLote);
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgDimensions.width || lotes.length === 0) return;

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
      if (isHighlighted) {
        ctx.fillStyle = HIGHLIGHT_COLOR.fill;
        ctx.shadowColor = 'rgba(147, 51, 234, 0.8)';
        ctx.shadowBlur = 15;
      } else {
        ctx.fillStyle = statusColor.fill;
        ctx.shadowBlur = 0;
      }
      ctx.fill();

      // Borda - roxo forte e mais grossa para o destacado
      ctx.strokeStyle = isHighlighted ? HIGHLIGHT_COLOR.stroke : statusColor.stroke;
      ctx.lineWidth = isHighlighted ? HIGHLIGHT_COLOR.strokeWidth : 2;
      ctx.shadowBlur = 0;
      ctx.stroke();

      // Número do lote com melhor visibilidade
      const centroX = lote.coordenadas_mapa.reduce((sum, p) => sum + p[0], 0) / lote.coordenadas_mapa.length;
      const centroY = lote.coordenadas_mapa.reduce((sum, p) => sum + p[1], 0) / lote.coordenadas_mapa.length;
      
      // Fundo branco semi-transparente para texto
      const fontSize = isHighlighted ? 20 : 14;
      ctx.font = `bold ${fontSize}px Arial`;
      const textMetrics = ctx.measureText(lote.numero);
      const textWidth = textMetrics.width;
      const padding = 4;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(centroX - textWidth/2 - padding, centroY - fontSize/2 - padding, textWidth + padding*2, fontSize + padding*2);
      
      // Texto do número
      ctx.fillStyle = isHighlighted ? '#7C3AED' : '#1F2937';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lote.numero, centroX, centroY);
      
      // Área (só para destacado)
      if (isHighlighted && lote.area) {
        const areaText = `${lote.area.toFixed(0)} m²`;
        ctx.font = '14px Arial';
        const areaMetrics = ctx.measureText(areaText);
        const areaWidth = areaMetrics.width;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(centroX - areaWidth/2 - padding, centroY + fontSize/2 + 6, areaWidth + padding*2, 18);
        
        ctx.fillStyle = '#059669';
        ctx.fillText(areaText, centroX, centroY + fontSize/2 + 15);
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
    <div className="space-y-3">
      {/* Controles de Zoom */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="h-8"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="px-3 py-1 bg-white rounded border border-gray-300 min-w-[80px] text-center">
            <span className="text-sm font-bold text-purple-700">
              {(transform.scale * 100).toFixed(0)}%
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="h-8"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetZoom}
          className="h-8"
        >
          <Maximize2 className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Mapa */}
      <div 
        ref={containerRef}
        className="relative border-2 border-purple-300 rounded-lg overflow-hidden bg-gray-100 shadow-xl"
        style={{ height: '600px', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handleCanvasMouseMove(e);
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setHoveredLoteId(null);
        }}
      >
        <div 
          className="relative"
          style={{ 
            transform: `scale(${transform.scale}) translate(${transform.offsetX / transform.scale}px, ${transform.offsetY / transform.scale}px)`,
            transformOrigin: 'top left',
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            willChange: 'transform'
          }}
        >
          <img
            ref={imgRef}
            src={loteamento.arquivo_planta_url}
            alt="Planta do loteamento"
            className="block pointer-events-none"
            style={{ 
              width: `${imgDimensions.width}px`,
              height: `${imgDimensions.height}px`,
              maxWidth: 'none'
            }}
            draggable={false}
          />
          <canvas
            ref={canvasRef}
            width={imgDimensions.width}
            height={imgDimensions.height}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ 
              width: `${imgDimensions.width}px`,
              height: `${imgDimensions.height}px`
            }}
          />
        </div>
      </div>

      {/* Legenda dinâmica - mostra apenas o lote destacado ou hover */}
      {(highlightLoteId || hoveredLoteId) && (() => {
        const loteParaMostrar = lotes.find(l => l.id === (highlightLoteId || hoveredLoteId));
        if (!loteParaMostrar) return null;
        
        const statusInfo = STATUS_COLORS[loteParaMostrar.status] || STATUS_COLORS.disponivel;
        
        return (
          <div className="p-3 bg-white border-2 border-purple-200 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded border-2 flex-shrink-0"
                style={{ 
                  backgroundColor: statusInfo.fill,
                  borderColor: statusInfo.stroke
                }}
              />
              <div className="flex-1">
                <p className="font-bold text-gray-900">Lote {loteParaMostrar.numero}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="outline"
                    className="text-xs"
                    style={{ 
                      borderColor: statusInfo.stroke,
                      color: statusInfo.stroke
                    }}
                  >
                    {statusInfo.label}
                  </Badge>
                  {loteParaMostrar.area && (
                    <span className="text-xs text-gray-600">
                      {loteParaMostrar.area.toFixed(0)} m²
                    </span>
                  )}
                  {loteParaMostrar.quadra && (
                    <span className="text-xs text-gray-600">
                      Quadra {loteParaMostrar.quadra}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="text-xs text-gray-600 text-center p-2 bg-gray-50 rounded border">
        💡 <strong>Dica:</strong> Clique e arraste para mover o mapa. Passe o mouse sobre um lote para ver detalhes.
      </div>
    </div>
  );
}