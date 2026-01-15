import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, MapPin, CheckCircle2, Loader2, ZoomIn, ZoomOut, Maximize2, Filter, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { InputCurrency } from "../../ui/input-currency";

const STATUS_COLORS = {
  disponivel: { fill: 'rgba(34, 197, 94, 0.3)', stroke: '#22C55E', label: 'Disponível' },
  reservado: { fill: 'rgba(251, 191, 36, 0.3)', stroke: '#FBBF24', label: 'Reservado' },
  em_negociacao: { fill: 'rgba(59, 130, 246, 0.3)', stroke: '#3B82F6', label: 'Em Negociação' },
  vendido: { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#EF4444', label: 'Vendido' }
};

export default function SelecionarLoteMapaStep({ loteamentoId, loteIdSelecionado, onChange, onNext, onBack }) {
  const [loteSelecionado, setLoteSelecionado] = useState(null);
  const [hoveredLote, setHoveredLote] = useState(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  
  // Filtros
  const [filtros, setFiltros] = useState({
    status: "todos",
    precoMin: "",
    precoMax: "",
    areaMin: "",
    areaMax: "",
    busca: ""
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

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
    if (loteIdSelecionado && lotes.length > 0) {
      const lote = lotes.find(l => l.id === loteIdSelecionado);
      if (lote) {
        setLoteSelecionado(lote);
      }
    }
  }, [loteIdSelecionado, lotes]);

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
  }, [lotes, loteSelecionado, hoveredLote, imgDimensions]);

  // Filtrar lotes
  const lotesFiltrados = lotes.filter((lote) => {
    // Filtro de status
    if (filtros.status !== "todos" && lote.status !== filtros.status) return false;
    
    // Filtro de preço
    if (filtros.precoMin && lote.valor_total < parseFloat(filtros.precoMin)) return false;
    if (filtros.precoMax && lote.valor_total > parseFloat(filtros.precoMax)) return false;
    
    // Filtro de área
    if (filtros.areaMin && lote.area < parseFloat(filtros.areaMin)) return false;
    if (filtros.areaMax && lote.area > parseFloat(filtros.areaMax)) return false;
    
    // Filtro de busca (número ou quadra)
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      const matchNumero = lote.numero?.toLowerCase().includes(busca);
      const matchQuadra = lote.quadra?.toLowerCase().includes(busca);
      if (!matchNumero && !matchQuadra) return false;
    }
    
    return true;
  });

  const limparFiltros = () => {
    setFiltros({
      status: "todos",
      precoMin: "",
      precoMax: "",
      areaMin: "",
      areaMax: "",
      busca: ""
    });
  };

  const filtrosAtivos = filtros.status !== "todos" || filtros.precoMin || filtros.precoMax || 
                        filtros.areaMin || filtros.areaMax || filtros.busca;

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgDimensions.width || lotesFiltrados.length === 0) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    lotesFiltrados.forEach((lote) => {
      if (!lote.coordenadas_mapa || lote.coordenadas_mapa.length === 0) return;

      const isSelected = loteSelecionado?.id === lote.id;
      const isHovered = hoveredLote === lote.id;
      const statusColor = STATUS_COLORS[lote.status] || STATUS_COLORS.disponivel;

      ctx.beginPath();
      ctx.moveTo(lote.coordenadas_mapa[0][0], lote.coordenadas_mapa[0][1]);
      
      for (let i = 1; i < lote.coordenadas_mapa.length; i++) {
        ctx.lineTo(lote.coordenadas_mapa[i][0], lote.coordenadas_mapa[i][1]);
      }
      
      ctx.closePath();

      // Preenchimento
      ctx.fillStyle = isSelected 
        ? 'rgba(147, 51, 234, 0.5)' 
        : isHovered 
          ? 'rgba(100, 100, 100, 0.3)' 
          : statusColor.fill;
      ctx.fill();

      // Borda
      ctx.strokeStyle = isSelected ? '#7C3AED' : statusColor.stroke;
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.stroke();

      // Número do lote com fundo
      const centroX = lote.coordenadas_mapa.reduce((sum, p) => sum + p[0], 0) / lote.coordenadas_mapa.length;
      const centroY = lote.coordenadas_mapa.reduce((sum, p) => sum + p[1], 0) / lote.coordenadas_mapa.length;
      
      const fontSize = isSelected ? 16 : 13;
      ctx.font = `bold ${fontSize}px Arial`;
      const textMetrics = ctx.measureText(lote.numero);
      const textWidth = textMetrics.width;
      const padding = 4;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(centroX - textWidth/2 - padding, centroY - fontSize/2 - padding, textWidth + padding*2, fontSize + padding*2);
      
      ctx.fillStyle = isSelected ? '#7C3AED' : '#1F2937';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lote.numero, centroX, centroY);
    });
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (imgDimensions.width / rect.width);
    const y = (e.clientY - rect.top) * (imgDimensions.height / rect.height);

    for (const lote of lotesFiltrados) {
      if (!lote.coordenadas_mapa) continue;
      
      if (isPointInPolygon([x, y], lote.coordenadas_mapa)) {
        setLoteSelecionado(lote);
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
    for (const lote of lotesFiltrados) {
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

  const handleSelecionarLote = () => {
    if (!loteSelecionado) {
      toast.error("Selecione um lote no mapa");
      return;
    }

    onChange({ 
      lote_id: loteSelecionado.id,
      orcamento_minimo: loteSelecionado.valor_total || 0,
      orcamento_maximo: loteSelecionado.valor_total || 0
    });
    onNext();
  };

  if (loadingLoteamento || loadingLotes) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[var(--wine-600)]" />
        <p className="text-gray-600">Carregando mapa do loteamento...</p>
      </div>
    );
  }

  if (!loteamento?.arquivo_planta_url) {
    return (
      <div className="p-8">
        <Alert className="bg-orange-50 border-orange-200">
          <AlertDescription className="text-orange-800">
            Este loteamento não possui um mapa configurado. Configure o mapa na seção de Loteamentos primeiro.
          </AlertDescription>
        </Alert>
        <div className="flex justify-between pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Alert className="bg-blue-50 border-blue-200 flex-1 mr-4">
          <AlertDescription className="text-blue-800">
            <strong>📍 Selecione o lote desejado</strong> - Clique sobre um lote no mapa abaixo para selecioná-lo.
          </AlertDescription>
        </Alert>
        <Button 
          type="button" 
          variant={mostrarFiltros ? "default" : "outline"}
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {filtrosAtivos && (
            <Badge className="ml-1 bg-red-500 text-white h-5 px-1.5">
              {[filtros.status !== "todos", filtros.precoMin, filtros.precoMax, filtros.areaMin, filtros.areaMax, filtros.busca].filter(Boolean).length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Painel de Filtros */}
      {mostrarFiltros && (
        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros Avançados
              </span>
              {filtrosAtivos && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={limparFiltros}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar Filtros
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status */}
              <div>
                <Label className="text-xs">Status</Label>
                <Select 
                  value={filtros.status} 
                  onValueChange={(value) => setFiltros({...filtros, status: value})}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="reservado">Reservado</SelectItem>
                    <SelectItem value="em_negociacao">Em Negociação</SelectItem>
                    <SelectItem value="vendido">Vendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Busca */}
              <div>
                <Label className="text-xs">Número/Quadra</Label>
                <Input
                  placeholder="Ex: 15 ou Quadra A"
                  value={filtros.busca}
                  onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                  className="h-9"
                />
              </div>

              <div></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Preço */}
              <div>
                <Label className="text-xs">Preço Mínimo</Label>
                <InputCurrency
                  value={filtros.precoMin}
                  onChange={(e) => setFiltros({...filtros, precoMin: e.target.value})}
                  placeholder="R$ 0,00"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Preço Máximo</Label>
                <InputCurrency
                  value={filtros.precoMax}
                  onChange={(e) => setFiltros({...filtros, precoMax: e.target.value})}
                  placeholder="R$ 0,00"
                  className="h-9"
                />
              </div>

              {/* Área */}
              <div>
                <Label className="text-xs">Área Mínima (m²)</Label>
                <Input
                  type="number"
                  value={filtros.areaMin}
                  onChange={(e) => setFiltros({...filtros, areaMin: e.target.value})}
                  placeholder="0"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Área Máxima (m²)</Label>
                <Input
                  type="number"
                  value={filtros.areaMax}
                  onChange={(e) => setFiltros({...filtros, areaMax: e.target.value})}
                  placeholder="0"
                  className="h-9"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-xs text-gray-600">
                <strong>{lotesFiltrados.length}</strong> de <strong>{lotes.length}</strong> lotes encontrados
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Mapa */}
        <div className="lg:col-span-2 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Mapa de Lotes
                </span>
                <div className="flex gap-2">
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
              {/* Controles de zoom */}
              <div className="flex items-center gap-2 mb-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <div className="px-3 py-1 bg-gray-100 rounded border min-w-[70px] text-center">
                  <span className="text-sm font-bold">{(zoom * 100).toFixed(0)}%</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(1)}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>

              <div 
                ref={containerRef}
                className="relative border-2 border-gray-300 rounded-lg overflow-auto bg-gray-100"
                style={{ height: '500px' }}
              >
                <div
                  style={{ 
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    transition: 'transform 0.2s ease'
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
                    onClick={handleCanvasClick}
                    onMouseMove={handleCanvasHover}
                    className="absolute top-0 left-0 cursor-pointer"
                    style={{ 
                      width: `${imgDimensions.width}px`,
                      height: `${imgDimensions.height}px`
                    }}
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(
                  lotesFiltrados.reduce((acc, lote) => {
                    acc[lote.status] = (acc[lote.status] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([status, count]) => (
                  <div key={status} className="text-center p-2 bg-gray-50 rounded border">
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-xs text-gray-600">{STATUS_COLORS[status]?.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes do Lote Selecionado */}
        <div>
          <Card className={loteSelecionado ? "border-2 border-purple-400 shadow-lg" : ""}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {loteSelecionado ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    Lote Selecionado
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Selecione um Lote
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!loteSelecionado ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Clique em um lote no mapa</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-200">
                    <h3 className="font-bold text-lg text-purple-700 mb-3">
                      Lote {loteSelecionado.numero}
                    </h3>
                    
                    {loteSelecionado.quadra && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-600">Quadra</p>
                        <p className="font-semibold text-purple-700">{loteSelecionado.quadra}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-gray-600">Área</p>
                        <p className="font-bold text-gray-900">{loteSelecionado.area?.toFixed(2)} m²</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Valor</p>
                        <p className="font-bold text-green-600">
                          R$ {(loteSelecionado.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-gray-600">Status</p>
                      <Badge className={`mt-1 ${
                        loteSelecionado.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                        loteSelecionado.status === 'reservado' ? 'bg-yellow-100 text-yellow-800' :
                        loteSelecionado.status === 'vendido' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {STATUS_COLORS[loteSelecionado.status]?.label || loteSelecionado.status}
                      </Badge>
                    </div>

                    {loteSelecionado.observacoes && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-600">Observações</p>
                        <p className="text-sm text-gray-700 mt-1">{loteSelecionado.observacoes}</p>
                      </div>
                    )}
                  </div>

                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800 text-sm">
                      ✅ O valor do lote (R$ {(loteSelecionado.valor_total || 0).toLocaleString('pt-BR')}) será usado como orçamento inicial.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button 
          type="button" 
          onClick={handleSelecionarLote}
          disabled={!loteSelecionado}
          className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}