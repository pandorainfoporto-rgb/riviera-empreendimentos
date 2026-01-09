import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Save, Trash2, Edit, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function MapeamentoLotesStep({ loteamentoId, data, onFinish, onBack, lotesSalvos, setLotesSalvos }) {
  const [selectedLote, setSelectedLote] = useState(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [editandoLote, setEditandoLote] = useState(null);
  const [salvando, setSalvando] = useState(false);
  
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (data.mapa_lotes_config?.lotes_delimitados) {
      setLotes(data.mapa_lotes_config.lotes_delimitados);
    }
  }, [data]);

  useEffect(() => {
    if (imgRef.current && data.arquivo_planta_url) {
      const img = imgRef.current;
      img.onload = () => {
        setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        redrawCanvas();
      };
    }
  }, [data.arquivo_planta_url]);

  useEffect(() => {
    redrawCanvas();
  }, [lotes, selectedLote, currentPoints, imgDimensions]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgDimensions.width) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar lotes existentes
    lotes.forEach((lote, index) => {
      if (!lote.coordenadas || lote.coordenadas.length === 0) return;

      ctx.beginPath();
      ctx.moveTo(lote.coordenadas[0][0], lote.coordenadas[0][1]);
      
      for (let i = 1; i < lote.coordenadas.length; i++) {
        ctx.lineTo(lote.coordenadas[i][0], lote.coordenadas[i][1]);
      }
      
      ctx.closePath();

      // Cor de preenchimento baseada em seleção
      if (selectedLote === index) {
        ctx.fillStyle = 'rgba(146, 43, 62, 0.3)';
      } else {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      }
      ctx.fill();

      ctx.strokeStyle = selectedLote === index ? '#922B3E' : '#3B82F6';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Desenhar número do lote no centro
      const centroX = lote.coordenadas.reduce((sum, p) => sum + p[0], 0) / lote.coordenadas.length;
      const centroY = lote.coordenadas.reduce((sum, p) => sum + p[1], 0) / lote.coordenadas.length;
      
      ctx.fillStyle = '#000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(lote.numero || `Lote ${index + 1}`, centroX, centroY);
    });

    // Desenhar pontos em progresso
    if (currentPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(currentPoints[0][0], currentPoints[0][1]);
      
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i][0], currentPoints[i][1]);
      }
      
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Desenhar círculos nos pontos
      currentPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point[0], point[1], 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#10B981';
        ctx.fill();
      });
    }
  };

  const handleCanvasClick = (e) => {
    if (!drawingMode) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentPoints([...currentPoints, [x, y]]);
  };

  const handleFinalizarDesenho = () => {
    if (currentPoints.length < 3) {
      toast.error("Desenhe pelo menos 3 pontos para criar um lote");
      return;
    }

    const novoLote = {
      numero: `Lote ${lotes.length + 1}`,
      coordenadas: currentPoints,
      area: calcularArea(currentPoints)
    };

    setLotes([...lotes, novoLote]);
    setCurrentPoints([]);
    setDrawingMode(false);
    toast.success("Lote adicionado! Preencha os dados ao lado");
    setSelectedLote(lotes.length);
    setEditandoLote(novoLote);
  };

  const calcularArea = (points) => {
    // Fórmula de Shoelace para calcular área do polígono
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i][0] * points[j][1];
      area -= points[j][0] * points[i][1];
    }
    return Math.abs(area / 2);
  };

  const handleSalvarLote = () => {
    if (!editandoLote.numero || !editandoLote.numero.trim()) {
      toast.error("Número do lote é obrigatório");
      return;
    }

    const lotesAtualizados = [...lotes];
    lotesAtualizados[selectedLote] = editandoLote;
    setLotes(lotesAtualizados);
    setEditandoLote(null);
    setSelectedLote(null);
    toast.success("Lote atualizado");
  };

  const handleExcluirLote = (index) => {
    const lotesAtualizados = lotes.filter((_, i) => i !== index);
    setLotes(lotesAtualizados);
    setSelectedLote(null);
    setEditandoLote(null);
    toast.success("Lote removido");
  };

  const handleFinalizarMapeamento = async () => {
    if (lotes.length === 0) {
      toast.error("Crie pelo menos um lote antes de finalizar");
      return;
    }

    setSalvando(true);

    try {
      // Salvar configuração do mapa no loteamento
      const mapaConfig = {
        width: imgDimensions.width,
        height: imgDimensions.height,
        lotes_delimitados: lotes
      };

      await base44.entities.Loteamento.update(loteamentoId, {
        mapa_lotes_config: mapaConfig,
        quantidade_lotes: lotes.length
      });

      // Criar registros de lotes no banco
      for (const lote of lotes) {
        const loteExistente = lotesSalvos.find(l => l.numero === lote.numero);
        
        const loteData = {
          loteamento_id: loteamentoId,
          numero: lote.numero,
          quadra: lote.quadra || "",
          area: lote.area || 0,
          valor_total: lote.valor_total || 0,
          coordenadas_mapa: lote.coordenadas,
          status: "disponivel"
        };

        if (loteExistente) {
          await base44.entities.Lote.update(loteExistente.id, loteData);
        } else {
          await base44.entities.Lote.create(loteData);
        }
      }

      toast.success(`Loteamento e ${lotes.length} lotes salvos com sucesso!`);
      onFinish({ mapa_lotes_config: mapaConfig });
    } catch (error) {
      toast.error("Erro ao salvar mapeamento");
      console.error(error);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Canvas de desenho */}
        <div className="lg:col-span-2 space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">Mapa do Loteamento</h3>
                <div className="flex gap-2">
                  {!drawingMode ? (
                    <Button
                      type="button"
                      onClick={() => setDrawingMode(true)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Lote
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        onClick={handleFinalizarDesenho}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Finalizar Polígono
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setCurrentPoints([]);
                          setDrawingMode(false);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {drawingMode && (
                <Alert className="mb-3 bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800 text-sm">
                    Clique no mapa para marcar os pontos do lote. Após marcar todos os pontos, 
                    clique em "Finalizar Polígono".
                  </AlertDescription>
                </Alert>
              )}

              <div className="relative border rounded-lg overflow-hidden bg-gray-100">
                <img
                  ref={imgRef}
                  src={data.arquivo_planta_url}
                  alt="Planta"
                  className="w-full h-auto"
                  style={{ display: 'block' }}
                />
                <canvas
                  ref={canvasRef}
                  width={imgDimensions.width}
                  height={imgDimensions.height}
                  onClick={handleCanvasClick}
                  className="absolute top-0 left-0 w-full h-auto cursor-crosshair"
                  style={{ 
                    cursor: drawingMode ? 'crosshair' : 'pointer'
                  }}
                />
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm">
                <Badge className="bg-blue-100 text-blue-800">
                  {lotes.length} lotes mapeados
                </Badge>
                {currentPoints.length > 0 && (
                  <Badge className="bg-green-100 text-green-800">
                    {currentPoints.length} pontos marcados
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel lateral de lotes */}
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold mb-3">Lotes Criados</h3>
              
              {lotes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Nenhum lote criado ainda
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {lotes.map((lote, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedLote === index 
                          ? 'border-[var(--wine-600)] bg-[var(--wine-50)]' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedLote(index);
                        setEditandoLote(lote);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{lote.numero}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExcluirLote(index);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                      {lote.quadra && (
                        <p className="text-xs text-gray-600">Quadra: {lote.quadra}</p>
                      )}
                      <p className="text-xs text-gray-600">Área: {lote.area?.toFixed(0)} px²</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edição de lote selecionado */}
          {editandoLote && (
            <Card className="border-2 border-[var(--wine-600)]">
              <CardContent className="p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar Lote
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Número *</Label>
                    <Input
                      value={editandoLote.numero}
                      onChange={(e) => setEditandoLote({ ...editandoLote, numero: e.target.value })}
                      placeholder="Ex: 01, A-15"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Quadra</Label>
                    <Input
                      value={editandoLote.quadra || ""}
                      onChange={(e) => setEditandoLote({ ...editandoLote, quadra: e.target.value })}
                      placeholder="Ex: A, 1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Área Real (m²)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editandoLote.area || ""}
                      onChange={(e) => setEditandoLote({ ...editandoLote, area: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Valor Total (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editandoLote.valor_total || ""}
                      onChange={(e) => setEditandoLote({ ...editandoLote, valor_total: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleSalvarLote}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Dados
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button 
          type="button" 
          onClick={handleFinalizarMapeamento}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          disabled={salvando || lotes.length === 0}
        >
          {salvando ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Finalizar Cadastro
            </>
          )}
        </Button>
      </div>
    </div>
  );
}