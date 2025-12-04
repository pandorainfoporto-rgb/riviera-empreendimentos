import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Home, DollarSign, Ruler, Search, Eye, FileText, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import LayoutImobiliaria from "../components/LayoutImobiliaria";

export default function PortalImobiliariaLotes() {
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('disponivel');
  const [filtroLoteamento, setFiltroLoteamento] = useState('todos');

  // Pegar filtro de loteamento da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loteamentoId = urlParams.get('loteamento');
    if (loteamentoId) {
      setFiltroLoteamento(loteamentoId);
    }
  }, []);

  const { data: lotes } = useQuery({
    queryKey: ['lotes_portal'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: loteamentos } = useQuery({
    queryKey: ['loteamentos_portal'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: documentos } = useQuery({
    queryKey: ['documentos_lotes_portal'],
    queryFn: () => base44.entities.DocumentoObra.filter({ tipo: 'foto' }),
  });

  const lotesArray = lotes || [];
  const loteamentosArray = loteamentos || [];
  const documentosArray = documentos || [];

  const lotesFiltrados = lotesArray.filter(lote => {
    const matchBusca = !busca || 
      lote.codigo?.toLowerCase().includes(busca.toLowerCase()) ||
      loteamentosArray.find(l => l.id === lote.loteamento_id)?.nome?.toLowerCase().includes(busca.toLowerCase());
    
    const matchStatus = filtroStatus === 'todos' || lote.status === filtroStatus;
    const matchLoteamento = filtroLoteamento === 'todos' || lote.loteamento_id === filtroLoteamento;
    
    return matchBusca && matchStatus && matchLoteamento;
  });

  return (
    <LayoutImobiliaria>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--wine-700)]">Lotes Disponíveis</h1>
            <p className="text-gray-600 mt-1">Explore os empreendimentos e cadastre leads</p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por código ou loteamento..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Loteamento</Label>
                <Select value={filtroLoteamento} onValueChange={setFiltroLoteamento}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Loteamentos</SelectItem>
                    {loteamentosArray.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="reservada">Reservada</SelectItem>
                    <SelectItem value="vendida">Vendida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Lotes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lotesFiltrados.map((lote) => {
            const loteamento = loteamentosArray.find(l => l.id === lote.loteamento_id);
            const fotosLote = documentosArray.filter(d => d.unidade_id === lote.id);
            const fotoDestaque = fotosLote[0]?.arquivo_url;

            const statusColors = {
              disponivel: 'bg-green-100 text-green-800 border-green-300',
              reservada: 'bg-yellow-100 text-yellow-800 border-yellow-300',
              vendida: 'bg-gray-100 text-gray-800 border-gray-300',
              em_construcao: 'bg-blue-100 text-blue-800 border-blue-300',
            };

            return (
              <Card key={lote.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                {fotoDestaque && (
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    <img 
                      src={fotoDestaque} 
                      alt={lote.codigo}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{lote.codigo}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {loteamento?.nome || 'N/A'}
                      </p>
                    </div>
                    <Badge className={statusColors[lote.status]}>
                      {lote.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    {lote.area_total && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Ruler className="w-4 h-4" />
                        <span>{lote.area_total} m²</span>
                      </div>
                    )}
                    {lote.valor_venda && (
                      <div className="flex items-center gap-2 text-gray-900 font-semibold">
                        <DollarSign className="w-4 h-4" />
                        <span>R$ {lote.valor_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {lote.quartos && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Home className="w-4 h-4" />
                        <span>{lote.quartos} quartos • {lote.banheiros} banheiros</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedLote(lote);
                        setShowDetalhes(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    {lote.status === 'disponivel' && (
                      <Link to={createPageUrl(`PortalImobiliariaIntencoes?lote=${lote.id}`)} className="flex-1">
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Pré-Intenção
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {lotesFiltrados.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum lote encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Detalhes do Lote */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Lote {selectedLote?.codigo}
            </DialogTitle>
          </DialogHeader>

          {selectedLote && (
            <div className="space-y-4">
              {documentosArray.filter(d => d.unidade_id === selectedLote.id)[0]?.arquivo_url && (
                <img 
                  src={documentosArray.filter(d => d.unidade_id === selectedLote.id)[0].arquivo_url}
                  alt={selectedLote.codigo}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Loteamento</p>
                  <p className="font-semibold">{loteamentosArray.find(l => l.id === selectedLote.loteamento_id)?.nome}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={
                    selectedLote.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                    selectedLote.status === 'reservada' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {selectedLote.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedLote.area_total && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Ruler className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-gray-600">Área Total</p>
                    </div>
                    <p className="font-bold text-xl">{selectedLote.area_total} m²</p>
                  </div>
                )}
                {selectedLote.valor_venda && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-gray-600">Valor</p>
                    </div>
                    <p className="font-bold text-xl text-green-700">
                      R$ {selectedLote.valor_venda.toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              {selectedLote.descricao && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Descrição</p>
                  <p className="text-gray-800">{selectedLote.descricao}</p>
                </div>
              )}

              {selectedLote.status === 'disponivel' && (
                <Link to={createPageUrl(`PortalImobiliariaIntencoes?lote=${selectedLote.id}`)}>
                  <Button className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]">
                    <FileText className="w-4 h-4 mr-2" />
                    Criar Pré-Intenção de Compra
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </LayoutImobiliaria>
  );
}