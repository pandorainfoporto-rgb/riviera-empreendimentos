import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Eye, Plus, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MapaLoteamento from "../components/loteamentos/MapaLoteamento";
import LayoutImobiliaria from "../components/LayoutImobiliaria";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PortalImobiliariaDashboard() {
  const [loteamentoSelecionado, setLoteamentoSelecionado] = useState("");
  const [loteSelecionado, setLoteSelecionado] = useState(null);
  const navigate = useNavigate();

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos_mapas_imob'],
    queryFn: () => base44.entities.Loteamento.filter({ 
      arquivo_planta_url: { $ne: null } 
    }),
    initialData: [],
  });

  const { data: lotes = [] } = useQuery({
    queryKey: ['lotes_mapa', loteamentoSelecionado],
    queryFn: () => base44.entities.Lote.filter({ loteamento_id: loteamentoSelecionado }),
    enabled: !!loteamentoSelecionado,
    initialData: [],
  });

  const loteamentoData = loteamentos.find(l => l.id === loteamentoSelecionado);

  const estatisticas = {
    total: lotes.length,
    disponiveis: lotes.filter(l => l.status === 'disponivel').length,
    reservados: lotes.filter(l => l.status === 'reservado').length,
    vendidos: lotes.filter(l => l.status === 'vendido').length,
  };

  const handleLoteClick = (lote) => {
    setLoteSelecionado(lote);
  };

  const handleCriarIntencao = () => {
    if (!loteSelecionado) return;
    
    // Redirecionar para página de intenções com lote pré-selecionado
    navigate(createPageUrl('PortalImobiliariaIntencoes') + `?lote_id=${loteSelecionado.id}&loteamento_id=${loteamentoSelecionado}`);
  };

  return (
    <LayoutImobiliaria>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-[var(--wine-700)]">Mapa de Loteamentos</h1>
            <p className="text-gray-600 mt-1">Visualize lotes disponíveis e crie intenções de compra</p>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Como usar:</strong> Selecione um loteamento, clique em um lote disponível (verde) no mapa 
            para ver detalhes e criar uma pré-intenção de compra para seu cliente.
          </AlertDescription>
        </Alert>

        <div>
          <Label className="mb-2 block">Selecione o Loteamento</Label>
          <Select value={loteamentoSelecionado} onValueChange={setLoteamentoSelecionado}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Escolha um loteamento..." />
            </SelectTrigger>
            <SelectContent>
              {loteamentos.length === 0 && (
                <SelectItem value="_empty" disabled>
                  Nenhum loteamento com mapa disponível
                </SelectItem>
              )}
              {loteamentos.map(lot => (
                <SelectItem key={lot.id} value={lot.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {lot.nome} - {lot.cidade}/{lot.estado}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loteamentoSelecionado && (
          <>
            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-3xl font-bold">{estatisticas.total}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-green-500">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Disponíveis</p>
                  <p className="text-3xl font-bold text-green-600">{estatisticas.disponiveis}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-yellow-500">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Reservados</p>
                  <p className="text-3xl font-bold text-yellow-600">{estatisticas.reservados}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-red-500">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Vendidos</p>
                  <p className="text-3xl font-bold text-red-600">{estatisticas.vendidos}</p>
                </CardContent>
              </Card>
            </div>

            {/* Mapa */}
            <MapaLoteamento
              loteamentoId={loteamentoSelecionado}
              onLoteClick={handleLoteClick}
              highlightLoteId={loteSelecionado?.id}
            />

            {/* Detalhes do Lote Selecionado */}
            {loteSelecionado && (
              <Card className="border-2 border-[var(--wine-600)] shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)]">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Lote Selecionado: {loteSelecionado.numero}
                    </span>
                    <Badge 
                      className="text-white"
                      style={{ 
                        backgroundColor: loteSelecionado.status === 'disponivel' ? '#22C55E' : 
                                        loteSelecionado.status === 'reservado' ? '#FBBF24' : 
                                        loteSelecionado.status === 'em_negociacao' ? '#3B82F6' : '#EF4444' 
                      }}
                    >
                      {loteSelecionado.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Número</p>
                      <p className="text-xl font-bold">{loteSelecionado.numero}</p>
                    </div>
                    {loteSelecionado.quadra && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Quadra</p>
                        <p className="text-xl font-bold">{loteSelecionado.quadra}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Área</p>
                      <p className="text-xl font-bold">{loteSelecionado.area?.toFixed(2) || 0} m²</p>
                    </div>
                    {loteSelecionado.valor_total > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Valor</p>
                        <p className="text-xl font-bold text-green-600">
                          R$ {loteSelecionado.valor_total.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>

                  {loteSelecionado.status === 'disponivel' ? (
                    <Button
                      onClick={handleCriarIntencao}
                      className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] h-12"
                      size="lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Criar Pré-Intenção para Este Lote
                    </Button>
                  ) : (
                    <Alert className="bg-orange-50 border-orange-200">
                      <AlertDescription className="text-orange-800">
                        Este lote não está disponível. Status: <strong>{loteSelecionado.status}</strong>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </LayoutImobiliaria>
  );
}