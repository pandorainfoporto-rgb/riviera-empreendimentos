import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Ruler, DollarSign, X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

export default function VisualizarMapaLotes({ loteamento, open, onClose }) {
  const [selectedLote, setSelectedLote] = useState(null);
  const [hoveredLote, setHoveredLote] = useState(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { data: lotes = [] } = useQuery({
    queryKey: ['lotes_loteamento', loteamento?.id],
    queryFn: () => base44.entities.Lote.filter({ loteamento_id: loteamento.id }),
    enabled: !!loteamento?.id,
  });

  const STATUS_COLORS = {
    disponivel: { fill: 'rgba(34, 197, 94, 0.3)', stroke: '#22C55E', bg: '#10b981' },
    reservado: { fill: 'rgba(251, 191, 36, 0.3)', stroke: '#FBBF24', bg: '#f59e0b' },
    em_negociacao: { fill: 'rgba(59, 130, 246, 0.3)', stroke: '#3B82F6', bg: '#3b82f6' },
    vendido: { fill: 'rgba(107, 114, 128, 0.3)', stroke: '#6B7280', bg: '#6b7280' },
    indisponivel: { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#EF4444', bg: '#ef4444' },
  };

  const statusLabels = {
    disponivel: 'Disponível',
    reservado: 'Reservado',
    em_negociacao: 'Em Negociação',
    vendido: 'Vendido',
    indisponivel: 'Indisponível',
  };

  const imagemUrl = loteamento?.arquivo_planta_url || loteamento?.arquivo_dwg_url || loteamento?.imagem_principal_url;

  useEffect(() => {
    if (imgRef.current && imagemUrl) {
      const img = imgRef.current;
      const handleLoad = () => {
        setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      if (img.complete) {
        handleLoad();
      } else {
        img.onload = handleLoad;
      }
    }
  }, [imagemUrl]);

  useEffect(() => {
    redrawCanvas();
  }, [lotes, selectedLote, hoveredLote, imgDimensions, zoom, offset]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgDimensions.width) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    lotes.forEach((lote) => {
      if (!lote.coordenadas_mapa || lote.coordenadas_mapa.length === 0) return;

      const isSelected = selectedLote?.id === lote.id;
      const isHovered = hoveredLote?.id === lote.id;
      const statusColor = STATUS_COLORS[lote.status] || STATUS_COLORS.disponivel;

      ctx.beginPath();
      ctx.moveTo(lote.coordenadas_mapa[0][0], lote.coordenadas_mapa[0][1]);
      
      for (let i = 1; i < lote.coordenadas_mapa.length; i++) {
        ctx.lineTo(lote.coordenadas_mapa[i][0], lote.coordenadas_mapa[i][1]);
      }
      
      ctx.closePath();

      if (isSelected || isHovered) {
        ctx.fillStyle = 'rgba(146, 43, 62, 0.4)';
        ctx.shadowColor = 'rgba(146, 43, 62, 0.8)';
        ctx.shadowBlur = 15;
      } else {
        ctx.fillStyle = statusColor.fill;
        ctx.shadowBlur = 0;
      }
      ctx.fill();

      ctx.strokeStyle = (isSelected || isHovered) ? '#922B3E' : statusColor.stroke;
      ctx.lineWidth = (isSelected || isHovered) ? 4 : 2;
      ctx.shadowBlur = 0;
      ctx.stroke();

      if (isSelected || isHovered) {
        const centroX = lote.coordenadas_mapa.reduce((sum, p) => sum + p[0], 0) / lote.coordenadas_mapa.length;
        const centroY = lote.coordenadas_mapa.reduce((sum, p) => sum + p[1], 0) / lote.coordenadas_mapa.length;
        
        const fontSize = 18;
        ctx.font = `bold ${fontSize}px Arial`;
        const text = lote.numero;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const padding = 6;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(centroX - textWidth/2 - padding, centroY - fontSize/2 - padding, textWidth + padding*2, fontSize + padding*2);
        
        ctx.fillStyle = '#922B3E';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, centroX, centroY);
      }
    });
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = imgDimensions.width / rect.width;
    const scaleY = imgDimensions.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    let loteClicado = null;
    
    for (const lote of lotes) {
      if (!lote.coordenadas_mapa || lote.coordenadas_mapa.length === 0) continue;
      
      ctx.beginPath();
      ctx.moveTo(lote.coordenadas_mapa[0][0], lote.coordenadas_mapa[0][1]);
      for (let i = 1; i < lote.coordenadas_mapa.length; i++) {
        ctx.lineTo(lote.coordenadas_mapa[i][0], lote.coordenadas_mapa[i][1]);
      }
      ctx.closePath();
      
      if (ctx.isPointInPath(x, y)) {
        loteClicado = lote;
        break;
      }
    }
    
    setSelectedLote(loteClicado);
  };

  const handleCanvasHover = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = imgDimensions.width / rect.width;
    const scaleY = imgDimensions.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    let loteHover = null;
    
    for (const lote of lotes) {
      if (!lote.coordenadas_mapa || lote.coordenadas_mapa.length === 0) continue;
      
      ctx.beginPath();
      ctx.moveTo(lote.coordenadas_mapa[0][0], lote.coordenadas_mapa[0][1]);
      for (let i = 1; i < lote.coordenadas_mapa.length; i++) {
        ctx.lineTo(lote.coordenadas_mapa[i][0], lote.coordenadas_mapa[i][1]);
      }
      ctx.closePath();
      
      if (ctx.isPointInPath(x, y)) {
        loteHover = lote;
        break;
      }
    }
    
    setHoveredLote(loteHover);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[var(--wine-600)]" />
            {loteamento?.nome} - Mapa de Lotes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Legenda */}
          <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg">
            {Object.entries(STATUS_COLORS).map(([status, colors]) => (
              <div key={status} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border-2" 
                  style={{ 
                    backgroundColor: colors.fill,
                    borderColor: colors.stroke
                  }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {statusLabels[status]}
                </span>
              </div>
            ))}
          </div>

          {/* Controles de Zoom */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium px-3">
                {(zoom * 100).toFixed(0)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(1)}
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Mapa DWG com Lotes */}
          {(loteamento?.arquivo_planta_url || loteamento?.arquivo_dwg_url || loteamento?.imagem_principal_url) ? (
            <div 
              ref={containerRef}
              className="relative border-2 border-gray-300 rounded-lg overflow-auto bg-gray-100 shadow-lg"
              style={{ maxHeight: '600px', cursor: 'pointer' }}
            >
              <div 
                style={{ 
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  transition: 'transform 0.2s ease',
                  display: 'inline-block'
                }}
              >
                <img
                  ref={imgRef}
                  src={imagemUrl}
                  alt="Planta do Loteamento"
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
                  onClick={handleCanvasClick}
                  onMouseMove={handleCanvasHover}
                  onMouseLeave={() => setHoveredLote(null)}
                  className="absolute top-0 left-0"
                  style={{ 
                    cursor: 'pointer',
                    width: `${imgDimensions.width}px`,
                    height: `${imgDimensions.height}px`
                  }}
                />
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Nenhuma planta DWG foi carregada para este loteamento
              </CardContent>
            </Card>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{lotes.length}</p>
                <p className="text-xs text-gray-600">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {lotes.filter(l => l.status === 'disponivel').length}
                </p>
                <p className="text-xs text-gray-600">Disponíveis</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {lotes.filter(l => l.status === 'reservado').length}
                </p>
                <p className="text-xs text-gray-600">Reservados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {lotes.filter(l => l.status === 'vendido').length}
                </p>
                <p className="text-xs text-gray-600">Vendidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {lotes.filter(l => l.status === 'indisponivel').length}
                </p>
                <p className="text-xs text-gray-600">Indisponíveis</p>
              </CardContent>
            </Card>
          </div>

          {/* Card de Detalhes do Lote - Flutuante ou Fixo */}
          {(selectedLote || hoveredLote) && (
            <Card className="border-2 border-[var(--wine-600)] shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Lote {(selectedLote || hoveredLote).numero}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedLote(null);
                      setHoveredLote(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge
                      style={{
                        backgroundColor: STATUS_COLORS[(selectedLote || hoveredLote).status]?.fill || STATUS_COLORS.disponivel.fill,
                        borderColor: STATUS_COLORS[(selectedLote || hoveredLote).status]?.stroke || STATUS_COLORS.disponivel.stroke,
                      }}
                      className="border-2 font-semibold"
                    >
                      {statusLabels[(selectedLote || hoveredLote).status]}
                    </Badge>
                  </div>

                  {(selectedLote || hoveredLote).quadra && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Quadra:</span>
                      </div>
                      <span className="font-semibold">{(selectedLote || hoveredLote).quadra}</span>
                    </div>
                  )}

                  {(selectedLote || hoveredLote).area && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Área:</span>
                      </div>
                      <span className="font-semibold">{(selectedLote || hoveredLote).area} m²</span>
                    </div>
                  )}

                  {(selectedLote || hoveredLote).valor_total && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Valor:</span>
                      </div>
                      <span className="font-bold text-green-700">
                        R$ {(selectedLote || hoveredLote).valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {(selectedLote || hoveredLote).observacoes && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-600 mb-1">Observações:</p>
                      <p className="text-sm text-gray-800">{(selectedLote || hoveredLote).observacoes}</p>
                    </div>
                  )}

                  {(selectedLote || hoveredLote).cliente_id && (
                    <div className="p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-blue-800 font-medium">
                        Lote com cliente vinculado
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}