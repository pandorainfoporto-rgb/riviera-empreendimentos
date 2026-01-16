import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Download, Eye, Search, Calendar, Loader2, Shield
} from "lucide-react";
import moment from "moment";

export default function PortalSocioDocumentos() {
  const [busca, setBusca] = useState("");

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ['documentos_socios_portal'],
    queryFn: async () => {
      return await base44.entities.DocumentoSocio.filter({
        apresentado_para_socios: true
      }, '-data_apresentacao');
    },
  });

  const documentosFiltrados = documentos.filter(d => 
    d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    d.tipo_documento.toLowerCase().includes(busca.toLowerCase())
  );

  const formatarTamanho = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const tiposDocumento = {
    contrato_social: "Contrato Social",
    ata_reuniao: "Ata de Reunião",
    balanco_patrimonial: "Balanço Patrimonial",
    relatorio_financeiro: "Relatório Financeiro",
    estatuto: "Estatuto",
    regimento_interno: "Regimento Interno",
    outros: "Outros",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Documentos da Sociedade
          </h1>
          <p className="text-gray-600 mt-1">
            Visualize e baixe documentos importantes da sociedade
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar documentos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          </div>
        ) : (
          <div className="grid gap-4">
            {documentosFiltrados.map((doc) => (
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
            ))}

            {documentosFiltrados.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    {busca ? "Nenhum documento encontrado" : "Nenhum documento disponível no momento"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}