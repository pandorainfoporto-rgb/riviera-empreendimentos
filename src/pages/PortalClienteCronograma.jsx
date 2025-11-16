import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Calendar, CheckCircle2, Clock, AlertCircle, Image, 
  TrendingUp, Construction, Eye, X
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PortalClienteCronograma() {
  const [selectedFoto, setSelectedFoto] = useState(null);
  const [showGallery, setShowGallery] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: cliente } = useQuery({
    queryKey: ['meuCliente', user?.cliente_id],
    queryFn: async () => {
      const clientes = await base44.entities.Cliente.list();
      return clientes.find(c => c.id === user.cliente_id) || null;
    },
    enabled: !!user?.cliente_id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['minhasUnidades', cliente?.id],
    queryFn: () => base44.entities.Unidade.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
    staleTime: 1000 * 60 * 2,
  });

  const unidadeIds = unidades.map(u => u.id);

  const { data: cronogramas = [] } = useQuery({
    queryKey: ['cronogramasCliente', unidadeIds],
    queryFn: async () => {
      if (unidadeIds.length === 0) return [];
      return await base44.entities.CronogramaObra.filter({ 
        unidade_id: { $in: unidadeIds }
      });
    },
    enabled: unidadeIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const { data: fotos = [] } = useQuery({
    queryKey: ['fotosObraCliente', unidadeIds],
    queryFn: async () => {
      if (unidadeIds.length === 0) return [];
      return await base44.entities.DocumentoObra.filter({ 
        unidade_id: { $in: unidadeIds },
        tipo: 'foto'
      });
    },
    enabled: unidadeIds.length > 0,
    refetchInterval: 30000,
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'concluida': return 'bg-green-100 text-green-700 border-green-300';
      case 'em_andamento': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'atrasada': return 'bg-red-100 text-red-700 border-red-300';
      case 'pausada': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'concluida': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'em_andamento': return <Construction className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'atrasada': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'pausada': return <Clock className="w-5 h-5 text-yellow-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const cronogramasOrdenados = [...cronogramas].sort((a, b) => {
    const orderMap = { fundacao: 1, estrutura: 2, alvenaria: 3, instalacoes: 4, acabamento: 5, finalizacao: 6 };
    return (orderMap[a.fase] || 99) - (orderMap[b.fase] || 99);
  });

  const progressoGeral = cronogramas.length > 0 
    ? cronogramas.reduce((sum, c) => sum + (c.percentual_conclusao || 0), 0) / cronogramas.length 
    : 0;

  const etapasConcluidas = cronogramas.filter(c => c.status === 'concluida').length;
  const etapasEmAndamento = cronogramas.filter(c => c.status === 'em_andamento').length;
  const etapasAtrasadas = cronogramas.filter(c => c.status === 'atrasada').length;

  const fotosPorEtapa = cronogramas.map(etapa => ({
    ...etapa,
    fotos: fotos.filter(f => f.cronograma_obra_id === etapa.id)
  }));

  const fotosRecentes = [...fotos].sort((a, b) => 
    new Date(b.data_documento) - new Date(a.data_documento)
  ).slice(0, 12);

  if (!cliente) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[var(--wine-700)]">Progresso da Obra</h2>
              <p className="text-gray-600">Acompanhe em tempo real</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-[var(--wine-700)]">{progressoGeral.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Concluído</p>
            </div>
          </div>
          
          <Progress value={progressoGeral} className="h-4 mb-4" />
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{etapasConcluidas}</p>
              <p className="text-xs text-gray-600">Concluídas</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">{etapasEmAndamento}</p>
              <p className="text-xs text-gray-600">Em Andamento</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-700">{etapasAtrasadas}</p>
              <p className="text-xs text-gray-600">Atrasadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="cronograma" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cronograma">
            <Calendar className="w-4 h-4 mr-2" />
            Cronograma
          </TabsTrigger>
          <TabsTrigger value="fotos">
            <Image className="w-4 h-4 mr-2" />
            Fotos ({fotos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cronograma" className="space-y-4">
          {cronogramasOrdenados.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Construction className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">Cronograma em preparação</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {cronogramasOrdenados.map((etapa) => {
                const diasRestantes = etapa.data_fim_prevista 
                  ? differenceInDays(parseISO(etapa.data_fim_prevista), new Date())
                  : null;
                
                return (
                  <Card key={etapa.id} className={`hover:shadow-lg transition-all border-l-4 ${
                    etapa.status === 'concluida' ? 'border-green-500' :
                    etapa.status === 'em_andamento' ? 'border-blue-500' :
                    etapa.status === 'atrasada' ? 'border-red-500' : 'border-gray-300'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(etapa.status)}
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">{etapa.etapa}</h3>
                            <Badge className={getStatusColor(etapa.status)}>
                              {etapa.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-[var(--wine-700)]">
                            {etapa.percentual_conclusao || 0}%
                          </p>
                        </div>
                      </div>

                      {etapa.descricao && (
                        <p className="text-sm text-gray-600 mb-4">{etapa.descricao}</p>
                      )}

                      <Progress value={etapa.percentual_conclusao || 0} className="mb-4" />

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Início: {etapa.data_inicio_prevista 
                              ? format(parseISO(etapa.data_inicio_prevista), "dd/MM/yyyy", { locale: ptBR })
                              : 'A definir'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Fim: {etapa.data_fim_prevista 
                              ? format(parseISO(etapa.data_fim_prevista), "dd/MM/yyyy", { locale: ptBR })
                              : 'A definir'}
                          </span>
                        </div>
                      </div>

                      {diasRestantes !== null && etapa.status !== 'concluida' && (
                        <div className={`mt-3 p-2 rounded text-sm ${
                          diasRestantes < 0 ? 'bg-red-100 text-red-700' :
                          diasRestantes < 7 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {diasRestantes < 0 
                            ? `⚠️ Atrasada em ${Math.abs(diasRestantes)} dias`
                            : `📅 ${diasRestantes} dias restantes`
                          }
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fotos" className="space-y-6">
          {fotosRecentes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Image className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">Nenhuma foto disponível</p>
                <p className="text-sm text-gray-500 mt-2">
                  Fotos da obra serão adicionadas em breve
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Galeria de Fotos Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {fotosRecentes.map((foto) => (
                      <div 
                        key={foto.id}
                        className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:shadow-xl transition-all"
                        onClick={() => {
                          setSelectedFoto(foto);
                          setShowGallery(true);
                        }}
                      >
                        <img
                          src={foto.arquivo_url}
                          alt={foto.titulo}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 p-3 text-white w-full">
                            <p className="font-semibold text-sm truncate">{foto.titulo}</p>
                            <p className="text-xs opacity-90">
                              {format(parseISO(foto.data_documento), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFoto(foto);
                            setShowGallery(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {fotosPorEtapa.filter(e => e.fotos.length > 0).map((etapa) => (
                <Card key={etapa.id} className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {getStatusIcon(etapa.status)}
                      {etapa.etapa}
                      <Badge className={getStatusColor(etapa.status)}>
                        {etapa.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {etapa.fotos.map((foto) => (
                        <div 
                          key={foto.id}
                          className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:shadow-lg transition-all"
                          onClick={() => {
                            setSelectedFoto(foto);
                            setShowGallery(true);
                          }}
                        >
                          <img
                            src={foto.arquivo_url}
                            alt={foto.titulo}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
                            <p className="text-xs truncate">{foto.titulo}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      {showGallery && selectedFoto && (
        <Dialog open={showGallery} onOpenChange={setShowGallery}>
          <DialogContent className="max-w-5xl max-h-[95vh] p-0">
            <div className="relative h-full">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setShowGallery(false)}
              >
                <X className="w-6 h-6" />
              </Button>
              
              <div className="p-6">
                <img 
                  src={selectedFoto.arquivo_url} 
                  alt={selectedFoto.titulo}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
                <div className="mt-4">
                  <h3 className="text-xl font-bold mb-2">{selectedFoto.titulo}</h3>
                  <p className="text-gray-600 mb-2">{selectedFoto.descricao}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(parseISO(selectedFoto.data_documento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}