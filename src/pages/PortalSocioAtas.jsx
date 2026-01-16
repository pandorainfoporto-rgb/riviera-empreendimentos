import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  FileText, Calendar, Download, Eye, Search, 
  Users, Clock, CheckCircle, Loader2, Shield
} from "lucide-react";
import { format } from "date-fns";
import moment from "moment";
import { toast } from "sonner";
import LayoutSocio from "../components/LayoutSocio";

const tipoLabels = {
  ordinaria: 'Assembleia Ordinária',
  extraordinaria: 'Assembleia Extraordinária',
  ata: 'Ata',
  documento: 'Documento'
};

const tipoColors = {
  ordinaria: 'bg-blue-100 text-blue-800',
  extraordinaria: 'bg-purple-100 text-purple-800',
  ata: 'bg-green-100 text-green-800',
  documento: 'bg-gray-100 text-gray-800'
};

export default function PortalSocioAtas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [selectedAta, setSelectedAta] = useState(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("atas");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: socio } = useQuery({
    queryKey: ['meu_socio', user?.socio_id],
    queryFn: async () => {
      if (!user?.socio_id) return null;
      return await base44.entities.Socio.get(user.socio_id);
    },
    enabled: !!user?.socio_id,
  });

  const { data: atas = [], isLoading } = useQuery({
    queryKey: ['atas_assembleias'],
    queryFn: () => base44.entities.AtaAssembleia.filter({ status: 'publicada' }, '-data_realizacao'),
  });

  const { data: documentos = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['documentos_socios_portal'],
    queryFn: async () => {
      return await base44.entities.DocumentoSocio.filter({
        apresentado_para_socios: true
      }, '-data_apresentacao');
    },
  });

  const filteredAtas = atas.filter(ata => {
    const matchesSearch = 
      ata.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ata.pauta?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === "todos" || ata.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  const handleVerDetalhes = async (ata) => {
    setSelectedAta(ata);
    setShowDetalhes(true);

    // Registrar log
    try {
      await base44.entities.LogAcessoSocio.create({
        socio_id: user?.socio_id,
        user_id: user?.id,
        nome_socio: socio?.nome,
        email: user?.email,
        acao: 'download_documento',
        descricao: `Visualizou ata: ${ata.titulo}`,
        data_hora: new Date().toISOString(),
        dados_adicionais: { ata_id: ata.id }
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  const handleDownload = async (ata) => {
    if (!ata.arquivo_url) {
      toast.error("Arquivo não disponível para download");
      return;
    }

    // Registrar log
    try {
      await base44.entities.LogAcessoSocio.create({
        socio_id: user?.socio_id,
        user_id: user?.id,
        nome_socio: socio?.nome,
        email: user?.email,
        acao: 'download_documento',
        descricao: `Baixou documento: ${ata.titulo}`,
        data_hora: new Date().toISOString(),
        dados_adicionais: { ata_id: ata.id }
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }

    window.open(ata.arquivo_url, '_blank');
  };

  const formatarTamanho = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const tiposDocumento = {
    contrato_social: "Contrato Social",
    ata_reuniao: "Ata de Reunião",
    balanco_patrimonial: "Balanço Patrimonial",
    relatorio_financeiro: "Relatório Financeiro",
    dre: "DRE - Demonstração de Resultado",
    balancete: "Balancete Financeiro",
    estatuto: "Estatuto",
    regimento_interno: "Regimento Interno",
    outros: "Outros",
  };

  const documentosAtas = documentos.filter(d => d.categoria_portal === 'atas_assembleias');
  const documentosSociedade = documentos.filter(d => d.categoria_portal === 'documentos_sociedade');

  return (
    <LayoutSocio>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Documentos</h1>
          <p className="text-gray-600 mt-1">Acesse atas, assembleias e documentos da sociedade</p>
        </div>

        {/* Tabs */}
        <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="atas">Atas e Assembleias</TabsTrigger>
            <TabsTrigger value="documentos">Documentos da Sociedade</TabsTrigger>
          </TabsList>

          {/* Aba Atas e Assembleias */}
          <TabsContent value="atas" className="space-y-4 mt-6">

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título ou pauta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Tabs value={tipoFilter} onValueChange={setTipoFilter}>
                <TabsList>
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                  <TabsTrigger value="ordinaria">Ordinárias</TabsTrigger>
                  <TabsTrigger value="extraordinaria">Extraordinárias</TabsTrigger>
                  <TabsTrigger value="ata">Atas</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Lista de Atas */}
            <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            </div>
          ) : filteredAtas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              Nenhuma ata ou assembleia encontrada
            </div>
          ) : (
            filteredAtas.map(ata => (
              <Card key={ata.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <FileText className="w-6 h-6 text-[var(--wine-600)]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{ata.titulo}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge className={tipoColors[ata.tipo]}>
                            {tipoLabels[ata.tipo]}
                          </Badge>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(ata.data_realizacao), 'dd/MM/yyyy')}
                          </span>
                          {ata.local && (
                            <span className="text-sm text-gray-500">
                              • {ata.local}
                            </span>
                          )}
                        </div>
                        {ata.pauta && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {ata.pauta}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleVerDetalhes(ata)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      {ata.arquivo_url && (
                        <Button 
                          variant="outline"
                          onClick={() => handleDownload(ata)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
            </div>

            {/* Documentos da Ata */}
            {documentosAtas.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Documentos Relacionados</h3>
                <div className="grid gap-3">
                  {documentosAtas.map(doc => (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium">{doc.titulo}</p>
                              <p className="text-xs text-gray-500">
                                {doc.arquivo_nome} • {formatarTamanho(doc.arquivo_tamanho)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => window.open(doc.arquivo_url, '_blank')}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              const a = document.createElement('a');
                              a.href = doc.arquivo_url;
                              a.download = doc.arquivo_nome;
                              a.click();
                            }}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Aba Documentos da Sociedade */}
          <TabsContent value="documentos" className="space-y-4 mt-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loadingDocs ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              </div>
            ) : documentosSociedade.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Nenhum documento disponível no momento</p>
                </CardContent>
              </Card>
            ) : (
              documentosSociedade
                .filter(d => 
                  d.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  d.tipo_documento.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(doc => (
                  <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 rounded-lg bg-blue-100">
                            <FileText className="w-8 h-8 text-blue-600" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-xl">{doc.titulo}</h3>
                              {doc.confidencial && (
                                <Badge variant="outline" className="text-red-600">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Confidencial
                                </Badge>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge className="bg-blue-600">{tiposDocumento[doc.tipo_documento]}</Badge>
                              {doc.versao && <Badge variant="outline">Versão {doc.versao}</Badge>}
                              <Badge variant="outline">
                                <Calendar className="w-3 h-3 mr-1" />
                                {moment(doc.data_documento).format('DD/MM/YYYY')}
                              </Badge>
                            </div>

                            {doc.descricao && (
                              <p className="text-gray-600 mb-3">{doc.descricao}</p>
                            )}

                            <div className="text-sm text-gray-500">
                              <p>{doc.arquivo_nome}</p>
                              <p>{formatarTamanho(doc.arquivo_tamanho)}</p>
                              <p className="mt-1">
                                Disponibilizado em {moment(doc.data_apresentacao).format('DD/MM/YYYY [às] HH:mm')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => window.open(doc.arquivo_url, '_blank')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = doc.arquivo_url;
                              a.download = doc.arquivo_nome;
                              a.click();
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog de Detalhes */}
        <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[var(--wine-700)]">
                {selectedAta?.titulo}
              </DialogTitle>
            </DialogHeader>

            {selectedAta && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Badge className={tipoColors[selectedAta.tipo]}>
                    {tipoLabels[selectedAta.tipo]}
                  </Badge>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(selectedAta.data_realizacao), 'dd/MM/yyyy')}
                  </span>
                  {selectedAta.local && (
                    <span className="text-sm text-gray-500">
                      📍 {selectedAta.local}
                    </span>
                  )}
                </div>

                {selectedAta.pauta && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Pauta</h4>
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                      {selectedAta.pauta}
                    </p>
                  </div>
                )}

                {selectedAta.conteudo && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Conteúdo</h4>
                    <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg">
                      {selectedAta.conteudo}
                    </div>
                  </div>
                )}

                {selectedAta.participantes && selectedAta.participantes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Participantes
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {selectedAta.participantes.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          {p.presente ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={p.presente ? 'text-gray-900' : 'text-gray-400'}>
                            {p.nome}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAta.deliberacoes && selectedAta.deliberacoes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Deliberações</h4>
                    <div className="space-y-3">
                      {selectedAta.deliberacoes.map((d, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                          <p className="font-medium text-gray-900">{d.assunto}</p>
                          <p className="text-sm text-gray-600 mt-1">{d.decisao}</p>
                          {(d.votos_favor || d.votos_contra) && (
                            <div className="flex gap-4 mt-2 text-xs">
                              <span className="text-green-600">✓ {d.votos_favor || 0} a favor</span>
                              <span className="text-red-600">✗ {d.votos_contra || 0} contra</span>
                              <span className="text-gray-500">○ {d.abstencoes || 0} abstenções</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAta.observacoes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Observações</h4>
                    <p className="text-gray-600">{selectedAta.observacoes}</p>
                  </div>
                )}

                {selectedAta.arquivo_url && (
                  <Button 
                    className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                    onClick={() => handleDownload(selectedAta)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Documento Completo
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </LayoutSocio>
  );
}