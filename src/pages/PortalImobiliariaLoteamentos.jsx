import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MapPin, Building2, Ruler, Home, Eye, Search, ChevronRight, Map
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import LayoutImobiliaria from "../components/LayoutImobiliaria";

export default function PortalImobiliariaLoteamentos() {
  const [busca, setBusca] = useState('');
  const [loteamentoSelecionado, setLoteamentoSelecionado] = useState(null);

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos_portal'],
    queryFn: () => base44.entities.Loteamento.list(),
    initialData: [],
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades_portal'],
    queryFn: () => base44.entities.Unidade.list(),
    initialData: [],
  });

  const loteamentosFiltrados = loteamentos.filter(l => 
    !busca || l.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    l.cidade?.toLowerCase().includes(busca.toLowerCase())
  );

  const getLotesStats = (loteamentoId) => {
    const lotes = unidades.filter(u => u.loteamento_id === loteamentoId);
    return {
      total: lotes.length,
      disponiveis: lotes.filter(l => l.status === 'disponivel').length,
      reservados: lotes.filter(l => l.status === 'reservada').length,
      vendidos: lotes.filter(l => l.status === 'vendida').length,
    };
  };

  return (
    <LayoutImobiliaria>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--wine-700)]">Loteamentos</h1>
            <p className="text-gray-600 mt-1">Explore os empreendimentos disponíveis</p>
          </div>
        </div>

        {/* Busca */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar loteamento por nome ou cidade..."
            className="pl-10"
          />
        </div>

        {/* Grid de Loteamentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loteamentosFiltrados.map((loteamento) => {
            const stats = getLotesStats(loteamento.id);
            return (
              <Card key={loteamento.id} className="hover:shadow-xl transition-all overflow-hidden group">
                {loteamento.imagem_url ? (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={loteamento.imagem_url} 
                      alt={loteamento.nome}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] flex items-center justify-center">
                    <Map className="w-20 h-20 text-white/30" />
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-xl text-gray-900">{loteamento.nome}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {loteamento.cidade || 'N/A'} - {loteamento.estado || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {loteamento.descricao && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{loteamento.descricao}</p>
                  )}

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="p-2 bg-green-50 rounded-lg text-center">
                      <p className="text-lg font-bold text-green-700">{stats.disponiveis}</p>
                      <p className="text-xs text-green-600">Disponíveis</p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded-lg text-center">
                      <p className="text-lg font-bold text-yellow-700">{stats.reservados}</p>
                      <p className="text-xs text-yellow-600">Reservados</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg text-center">
                      <p className="text-lg font-bold text-gray-700">{stats.vendidos}</p>
                      <p className="text-xs text-gray-600">Vendidos</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setLoteamentoSelecionado(loteamento)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Detalhes
                    </Button>
                    <Link to={createPageUrl(`PortalImobiliariaLotes?loteamento=${loteamento.id}`)} className="flex-1">
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                      >
                        Ver Lotes
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {loteamentosFiltrados.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum loteamento encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Detalhes */}
      <Dialog open={!!loteamentoSelecionado} onOpenChange={() => setLoteamentoSelecionado(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Map className="w-5 h-5" />
              {loteamentoSelecionado?.nome}
            </DialogTitle>
          </DialogHeader>

          {loteamentoSelecionado && (
            <div className="space-y-4">
              {loteamentoSelecionado.imagem_url && (
                <img 
                  src={loteamentoSelecionado.imagem_url} 
                  alt={loteamentoSelecionado.nome}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Localização</p>
                  <p className="font-semibold">{loteamentoSelecionado.cidade} - {loteamentoSelecionado.estado}</p>
                  {loteamentoSelecionado.endereco && (
                    <p className="text-sm text-gray-600 mt-1">{loteamentoSelecionado.endereco}</p>
                  )}
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Área Total</p>
                  <p className="font-semibold">{loteamentoSelecionado.area_total || 'N/A'} m²</p>
                </div>
              </div>

              {loteamentoSelecionado.descricao && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Descrição</p>
                  <p className="text-gray-800">{loteamentoSelecionado.descricao}</p>
                </div>
              )}

              {loteamentoSelecionado.infraestrutura && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Infraestrutura</p>
                  <p className="text-gray-800">{loteamentoSelecionado.infraestrutura}</p>
                </div>
              )}

              <Link to={createPageUrl(`PortalImobiliariaLotes?loteamento=${loteamentoSelecionado.id}`)}>
                <Button className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]">
                  Ver Lotes Disponíveis
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </LayoutImobiliaria>
  );
}