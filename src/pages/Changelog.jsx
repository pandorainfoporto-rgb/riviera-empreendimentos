import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rocket, Wrench, Bug, AlertTriangle, Calendar, Package, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Changelog() {
  const [expandedVersions, setExpandedVersions] = useState({});

  const { data: versoes = [], isLoading } = useQuery({
    queryKey: ['versoes'],
    queryFn: async () => {
      const data = await base44.entities.VersaoSistema.list('-data_lancamento', 50);
      const expandedState = {};
      if (data.length > 0) {
        expandedState[data[0].id] = true;
      }
      setExpandedVersions(expandedState);
      return data;
    },
  });

  const toggleVersion = (id) => {
    setExpandedVersions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const tiposBadge = {
    major: { label: "Major", color: "bg-red-100 text-red-800 border-red-300" },
    minor: { label: "Minor", color: "bg-blue-100 text-blue-800 border-blue-300" },
    patch: { label: "Patch", color: "bg-green-100 text-green-800 border-green-300" }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--wine-700)]">Changelog</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Histórico de atualizações e melhorias do sistema
            </p>
          </div>
          {versoes.length > 0 && (
            <Badge className="bg-[var(--wine-600)] text-white text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-2 w-fit">
              Versão Atual: {versoes[0]?.versao}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {versoes.map((versao, index) => {
          const isExpanded = expandedVersions[versao.id];
          const tipoBadge = tiposBadge[versao.tipo] || tiposBadge.minor;

          return (
            <Card key={versao.id} className={`shadow-lg ${index === 0 ? 'border-[var(--wine-600)] border-2' : ''}`}>
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <CardTitle className="text-xl sm:text-2xl text-[var(--wine-700)]">
                        v{versao.versao}
                      </CardTitle>
                      <Badge variant="outline" className={tipoBadge.color}>
                        {tipoBadge.label}
                      </Badge>
                      {index === 0 && (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          Atual
                        </Badge>
                      )}
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-gray-900">{versao.titulo}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-gray-600">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>
                        {format(parseISO(versao.data_lancamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleVersion(versao.id)}
                    className="w-full sm:w-auto"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Ocultar detalhes
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Ver detalhes
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>

              <Collapsible open={isExpanded}>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {versao.descricao_geral && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm sm:text-base text-gray-700">{versao.descricao_geral}</p>
                      </div>
                    )}

                    <Tabs defaultValue="novos" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-0">
                        <TabsTrigger value="novos" className="text-xs sm:text-sm">
                          <Rocket className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Novos</span>
                          {versao.novos_recursos?.length > 0 && (
                            <Badge className="ml-1 sm:ml-2 bg-blue-600 text-white text-xs">
                              {versao.novos_recursos.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="melhorias" className="text-xs sm:text-sm">
                          <Wrench className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Melhorias</span>
                          {versao.melhorias?.length > 0 && (
                            <Badge className="ml-1 sm:ml-2 bg-green-600 text-white text-xs">
                              {versao.melhorias.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="correcoes" className="text-xs sm:text-sm">
                          <Bug className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Correções</span>
                          {versao.correcoes?.length > 0 && (
                            <Badge className="ml-1 sm:ml-2 bg-orange-600 text-white text-xs">
                              {versao.correcoes.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="breaking" className="text-xs sm:text-sm">
                          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Breaking</span>
                          {versao.breaking_changes?.length > 0 && (
                            <Badge className="ml-1 sm:ml-2 bg-red-600 text-white text-xs">
                              {versao.breaking_changes.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="novos" className="mt-4 sm:mt-6">
                        {versao.novos_recursos?.length > 0 ? (
                          <div className="space-y-3 sm:space-y-4">
                            {versao.novos_recursos.map((recurso, idx) => (
                              <div key={idx} className="flex gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                    <Rocket className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                    <h4 className="font-semibold text-sm sm:text-base text-gray-900">{recurso.titulo}</h4>
                                    <Badge variant="outline" className="text-xs w-fit">
                                      <Package className="w-3 h-3 mr-1" />
                                      {recurso.modulo}
                                    </Badge>
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-700">{recurso.descricao}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-8 text-sm sm:text-base">
                            Nenhum novo recurso nesta versão
                          </p>
                        )}
                      </TabsContent>

                      <TabsContent value="melhorias" className="mt-4 sm:mt-6">
                        {versao.melhorias?.length > 0 ? (
                          <div className="space-y-3 sm:space-y-4">
                            {versao.melhorias.map((melhoria, idx) => (
                              <div key={idx} className="flex gap-3 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-600 flex items-center justify-center">
                                    <Wrench className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                    <h4 className="font-semibold text-sm sm:text-base text-gray-900">{melhoria.titulo}</h4>
                                    <Badge variant="outline" className="text-xs w-fit">
                                      <Package className="w-3 h-3 mr-1" />
                                      {melhoria.modulo}
                                    </Badge>
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-700">{melhoria.descricao}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-8 text-sm sm:text-base">
                            Nenhuma melhoria nesta versão
                          </p>
                        )}
                      </TabsContent>

                      <TabsContent value="correcoes" className="mt-4 sm:mt-6">
                        {versao.correcoes?.length > 0 ? (
                          <div className="space-y-3 sm:space-y-4">
                            {versao.correcoes.map((correcao, idx) => (
                              <div key={idx} className="flex gap-3 p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-600 flex items-center justify-center">
                                    <Bug className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                    <h4 className="font-semibold text-sm sm:text-base text-gray-900">{correcao.titulo}</h4>
                                    <Badge variant="outline" className="text-xs w-fit">
                                      <Package className="w-3 h-3 mr-1" />
                                      {correcao.modulo}
                                    </Badge>
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-700">{correcao.descricao}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-8 text-sm sm:text-base">
                            Nenhuma correção nesta versão
                          </p>
                        )}
                      </TabsContent>

                      <TabsContent value="breaking" className="mt-4 sm:mt-6">
                        {versao.breaking_changes?.length > 0 ? (
                          <div className="space-y-3 sm:space-y-4">
                            {versao.breaking_changes.map((breaking, idx) => (
                              <div key={idx} className="flex gap-3 p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-600 flex items-center justify-center">
                                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm sm:text-base text-red-900 mb-2">{breaking.titulo}</h4>
                                  <p className="text-xs sm:text-sm text-red-800 mb-2">{breaking.descricao}</p>
                                  {breaking.impacto && (
                                    <div className="p-2 sm:p-3 bg-red-100 rounded border border-red-300 mt-2">
                                      <p className="text-xs sm:text-sm font-medium text-red-900">
                                        <strong>Impacto:</strong> {breaking.impacto}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-8 text-sm sm:text-base">
                            Nenhuma mudança que quebra compatibilidade nesta versão
                          </p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}

        {versoes.length === 0 && (
          <Card className="shadow-lg">
            <CardContent className="py-12">
              <p className="text-center text-gray-500">
                Nenhuma versão cadastrada ainda
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}