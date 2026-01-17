import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Ruler, DollarSign, X, ZoomIn, ZoomOut, Maximize2, Filter } from "lucide-react";
import LoteTooltip from "./LoteTooltip";
import LoteDetalhesDialog from "./LoteDetalhesDialog";

export default function VisualizarMapaLotes({ loteamento, open, onClose }) {
  const [selectedLote, setSelectedLote] = useState(null);
  const [hoveredLote, setHoveredLote] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showDetalhesDialog, setShowDetalhesDialog] = useState(false);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  
  // Filtros
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroAreaMin, setFiltroAreaMin] = useState("");
  const [filtroAreaMax, setFiltroAreaMax] = useState("");
  const [filtroValorMin, setFiltroValorMin] = useState("");
  const [filtroValorMax, setFiltroValorMax] = useState("");

  const { data: todosLotes = [] } = useQuery({
    queryKey: ['lotes_loteamento', loteamento?.id],
    queryFn: () => base44.entities.Lote.filter({ loteamento_id: loteamento.id }),
    enabled: !!loteamento?.id,
  });

  // Aplicar filtros
  const lotes = todosLotes.filter(lote => {
    if (filtroStatus !== "todos" && lote.status !== filtroStatus) return false;
    if (filtroAreaMin && lote.area < parseFloat(filtroAreaMin)) return false;
    if (filtroAreaMax && lote.area > parseFloat(filtroAreaMax)) return false;
    if (filtroValorMin && lote.valor_total < parseFloat(filtroValorMin)) return false;
    if (filtroValorMax && lote.valor_total > parseFloat(filtroValorMax)) return false;
    return true;
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
    if (!imagemUrl) return;

    const img = new Image();
    img.onload = () => {
      setImgDimensions({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      console.error("Erro ao carregar imagem do loteamento");
    };
    img.src = imagemUrl;
  }, [imagemUrl]);

  useEffect(() => {
    redrawCanvas();
  }, [lotes, selectedLote, hoveredLote, imgDimensions, zoom]);

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
    
    for (const lote of todosLotes) {
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
    
    if (loteClicado) {
      setSelectedLote(loteClicado);
      setShowDetalhesDialog(true);
    }
  };

  const handleCanvasHover = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = imgDimensions.width / rect.width;
    const scaleY = imgDimensions.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setTooltipPosition({ x: e.clientX, y: e.clientY });

    const ctx = canvas.getContext('2d');
    let loteHover = null;
    
    for (const lote of todosLotes) {
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

  const limparFiltros = () => {
    setFiltroStatus("todos");
    setFiltroAreaMin("");
    setFiltroAreaMax("");
    setFiltroValorMin("");
    setFiltroValorMax("");
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
          {/* Filtros Avançados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros Avançados
                </CardTitle>
                <Button variant="outline" size="sm" onClick={limparFiltros}>
                  Limpar Filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="reservado">Reservado</SelectItem>
                      <SelectItem value="em_negociacao">Em Negociação</SelectItem>
                      <SelectItem value="vendido">Vendido</SelectItem>
                      <SelectItem value="indisponivel">Indisponível</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Área Mín (m²)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filtroAreaMin}
                      onChange={(e) => setFiltroAreaMin(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Área Máx (m²)</Label>
                    <Input
                      type="number"
                      placeholder="999999"
                      value={filtroAreaMax}
                      onChange={(e) => setFiltroAreaMax(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Valor Mín (R$)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filtroValorMin}
                      onChange={(e) => setFiltroValorMin(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Valor Máx (R$)</Label>
                    <Input
                      type="number"
                      placeholder="999999"
                      value={filtroValorMax}
                      onChange={(e) => setFiltroValorMax(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 text-sm text-gray-600">
                <Badge variant="outline">
                  {lotes.length} de {todosLotes.length} lotes
                </Badge>
              </div>
            </CardContent>
          </Card>

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
                {imgDimensions.width > 0 && (
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
                )}
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

        </div>

        {/* Tooltip ao passar o mouse */}
        <LoteTooltip lote={hoveredLote} position={tooltipPosition} />

        {/* Dialog de Detalhes Completos */}
        <LoteDetalhesDialog
          lote={selectedLote}
          open={showDetalhesDialog}
          onClose={() => {
            setShowDetalhesDialog(false);
            setSelectedLote(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}