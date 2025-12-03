import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  User, Home, Palette, Settings, DollarSign, FileText, Calendar,
  CheckCircle2, XCircle, Clock, AlertCircle, Download, Eye
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: FileText },
  aguardando_projeto: { label: "Aguardando Projeto", color: "bg-blue-100 text-blue-800", icon: Clock },
  aguardando_reuniao: { label: "Aguardando Reunião", color: "bg-purple-100 text-purple-800", icon: Calendar },
  alteracao_projeto: { label: "Alteração de Projeto", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
  aprovado: { label: "Aprovado", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: XCircle },
};

const padraoLabels = {
  economico: "Econômico",
  medio_baixo: "Médio Baixo",
  medio: "Médio",
  medio_alto: "Médio Alto",
  alto: "Alto Padrão",
  luxo: "Luxo",
};

const comodosLabels = {
  sala_estar: "Sala de Estar",
  sala_jantar: "Sala de Jantar",
  sala_tv: "Sala de TV",
  cozinha: "Cozinha",
  cozinha_americana: "Cozinha Americana",
  copa: "Copa",
  area_servico: "Área de Serviço",
  lavanderia: "Lavanderia",
  despensa: "Despensa",
  escritorio: "Escritório",
  home_office: "Home Office",
  area_gourmet: "Área Gourmet",
  churrasqueira: "Churrasqueira",
  piscina: "Piscina",
  varanda: "Varanda",
  varanda_gourmet: "Varanda Gourmet",
  jardim_inverno: "Jardim de Inverno",
  closet_master: "Closet Master",
  banheira: "Banheira",
  edicola: "Edícula",
  quarto_empregada: "Quarto de Empregada",
};

const adicionaisLabels = {
  ar_condicionado: "Ar Condicionado",
  aquecimento_solar: "Aquecimento Solar",
  energia_solar: "Energia Solar",
  automacao_residencial: "Automação Residencial",
  sistema_seguranca: "Sistema de Segurança",
  cerca_eletrica: "Cerca Elétrica",
  cameras: "Câmeras",
  alarme: "Alarme",
  portao_automatico: "Portão Automático",
  interfone: "Interfone",
  wifi_estruturado: "WiFi Estruturado",
  home_theater: "Home Theater",
  jardim_paisagismo: "Jardim/Paisagismo",
  iluminacao_jardim: "Iluminação de Jardim",
  mobilia_planejada: "Mobília Planejada",
  moveis_cozinha: "Móveis de Cozinha",
  moveis_banheiro: "Móveis de Banheiro",
};

export default function IntencaoCompraDetalhes({
  open,
  onClose,
  intencao,
  cliente,
  loteamento,
}) {
  if (!intencao) return null;

  const status = statusConfig[intencao.status] || statusConfig.rascunho;
  const StatusIcon = status.icon;

  const formatCurrency = (value) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const comodosAtivos = Object.entries(intencao.comodos || {})
    .filter(([_, value]) => value)
    .map(([key]) => comodosLabels[key]);

  const adicionaisAtivos = Object.entries(intencao.adicionais || {})
    .filter(([_, value]) => value)
    .map(([key]) => adicionaisLabels[key]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Intenção de Compra
            </span>
            <Badge className={status.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 h-[600px] pr-4">
          <div className="space-y-4">
            {/* Cliente e Localização */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Cliente e Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="font-semibold">{cliente?.nome || "Não encontrado"}</p>
                  <p className="text-sm text-gray-600">{cliente?.email}</p>
                  <p className="text-sm text-gray-600">{cliente?.telefone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Loteamento de Preferência</p>
                  <p className="font-semibold">{loteamento?.nome || "Não definido"}</p>
                  {loteamento && (
                    <p className="text-sm text-gray-600">{loteamento.cidade} - {loteamento.estado}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Orçamento</p>
                  <p className="font-semibold">
                    {formatCurrency(intencao.orcamento_minimo)} - {formatCurrency(intencao.orcamento_maximo)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Padrão do Imóvel</p>
                  <Badge variant="outline">{padraoLabels[intencao.padrao_imovel]}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Estrutura */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Estrutura do Imóvel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{intencao.area_construida_desejada || "-"}</p>
                    <p className="text-xs text-gray-500">m² Área</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{intencao.quantidade_pavimentos || 1}</p>
                    <p className="text-xs text-gray-500">Pavimentos</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{intencao.quantidade_quartos || 0}</p>
                    <p className="text-xs text-gray-500">Quartos</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{intencao.quantidade_suites || 0}</p>
                    <p className="text-xs text-gray-500">Suítes</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-3">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{intencao.quantidade_banheiros || 0}</p>
                    <p className="text-xs text-gray-500">Banheiros</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{intencao.quantidade_lavabos || 0}</p>
                    <p className="text-xs text-gray-500">Lavabos</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{intencao.vagas_garagem || 0}</p>
                    <p className="text-xs text-gray-500">Vagas</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold">{intencao.garagem_coberta ? "Sim" : "Não"}</p>
                    <p className="text-xs text-gray-500">Gar. Coberta</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cômodos */}
            {comodosAtivos.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Cômodos Selecionados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {comodosAtivos.map((comodo, idx) => (
                      <Badge key={idx} variant="secondary">{comodo}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Acabamentos */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Acabamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {intencao.tipo_telhado && (
                  <div>
                    <p className="text-xs text-gray-500">Telhado</p>
                    <p className="font-medium capitalize">{intencao.tipo_telhado.replace("_", " ")}</p>
                  </div>
                )}
                {intencao.tipo_piso_interno && (
                  <div>
                    <p className="text-xs text-gray-500">Piso Interno</p>
                    <p className="font-medium capitalize">{intencao.tipo_piso_interno.replace("_", " ")}</p>
                  </div>
                )}
                {intencao.tipo_piso_externo && (
                  <div>
                    <p className="text-xs text-gray-500">Piso Externo</p>
                    <p className="font-medium capitalize">{intencao.tipo_piso_externo.replace("_", " ")}</p>
                  </div>
                )}
                {intencao.tipo_revestimento_parede && (
                  <div>
                    <p className="text-xs text-gray-500">Revestimento</p>
                    <p className="font-medium capitalize">{intencao.tipo_revestimento_parede.replace("_", " ")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cores */}
            {intencao.preferencias_cores && Object.values(intencao.preferencias_cores).some(v => v) && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Preferências de Cores</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-3">
                  {intencao.preferencias_cores.fachada_principal && (
                    <div>
                      <p className="text-xs text-gray-500">Fachada Principal</p>
                      <p className="font-medium">{intencao.preferencias_cores.fachada_principal}</p>
                    </div>
                  )}
                  {intencao.preferencias_cores.fachada_detalhes && (
                    <div>
                      <p className="text-xs text-gray-500">Detalhes Fachada</p>
                      <p className="font-medium">{intencao.preferencias_cores.fachada_detalhes}</p>
                    </div>
                  )}
                  {intencao.preferencias_cores.paredes_internas && (
                    <div>
                      <p className="text-xs text-gray-500">Paredes Internas</p>
                      <p className="font-medium">{intencao.preferencias_cores.paredes_internas}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Adicionais */}
            {adicionaisAtivos.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Itens Adicionais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {adicionaisAtivos.map((adicional, idx) => (
                      <Badge key={idx} variant="outline">{adicional}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detalhes Específicos */}
            {intencao.detalhes_especificos && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Detalhes Específicos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{intencao.detalhes_especificos}</p>
                </CardContent>
              </Card>
            )}

            {/* Projeto Arquitetônico */}
            {intencao.projeto_arquitetonico_url && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Projeto Arquitetônico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">Versão {intencao.projeto_arquitetonico_versao || 1}</p>
                      {intencao.data_entrega_projeto && (
                        <p className="text-xs text-gray-500">
                          Entregue em {format(new Date(intencao.data_entrega_projeto), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={intencao.projeto_arquitetonico_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="w-4 h-4 mr-1" />
                          Visualizar
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={intencao.projeto_arquitetonico_url} download>
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Custo do Projeto */}
            {intencao.gerar_custo_projeto && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Custo do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Valor</p>
                    <p className="font-semibold text-lg">{formatCurrency(intencao.valor_custo_projeto)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Condição</p>
                    <p className="font-medium">{intencao.condicao_pagamento_projeto?.replace("_", " ") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vencimento</p>
                    <p className="font-medium">
                      {intencao.data_vencimento_projeto
                        ? format(new Date(intencao.data_vencimento_projeto), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}