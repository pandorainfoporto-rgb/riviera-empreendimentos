import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  User, Home, Palette, Settings, DollarSign, FileText,
  Search, Plus, Building2, MapPin, Bed, Bath, Car, Layers
} from "lucide-react";
import SearchClienteDialog from "../shared/SearchClienteDialog";
import SearchLoteamentoDialog from "../shared/SearchLoteamentoDialog";

const padraoOptions = [
  { value: "economico", label: "Econômico" },
  { value: "medio_baixo", label: "Médio Baixo" },
  { value: "medio", label: "Médio" },
  { value: "medio_alto", label: "Médio Alto" },
  { value: "alto", label: "Alto Padrão" },
  { value: "luxo", label: "Luxo" },
];

const telhadoOptions = [
  { value: "ceramica", label: "Cerâmica" },
  { value: "concreto", label: "Concreto" },
  { value: "fibrocimento", label: "Fibrocimento" },
  { value: "metalico", label: "Metálico" },
  { value: "vidro", label: "Vidro" },
  { value: "laje_impermeabilizada", label: "Laje Impermeabilizada" },
  { value: "verde", label: "Telhado Verde" },
];

const pisoInternoOptions = [
  { value: "ceramica", label: "Cerâmica" },
  { value: "porcelanato", label: "Porcelanato" },
  { value: "madeira", label: "Madeira" },
  { value: "laminado", label: "Laminado" },
  { value: "vinilico", label: "Vinílico" },
  { value: "granito", label: "Granito" },
  { value: "marmore", label: "Mármore" },
  { value: "cimento_queimado", label: "Cimento Queimado" },
];

const pisoExternoOptions = [
  { value: "ceramica", label: "Cerâmica" },
  { value: "porcelanato", label: "Porcelanato" },
  { value: "pedra", label: "Pedra Natural" },
  { value: "concreto", label: "Concreto" },
  { value: "grama", label: "Grama" },
  { value: "madeira_deck", label: "Deck de Madeira" },
];

const revestimentoOptions = [
  { value: "pintura", label: "Pintura" },
  { value: "textura", label: "Textura" },
  { value: "grafiato", label: "Grafiato" },
  { value: "ceramica", label: "Cerâmica" },
  { value: "porcelanato", label: "Porcelanato" },
  { value: "pedra", label: "Pedra" },
  { value: "tijolo_aparente", label: "Tijolo Aparente" },
  { value: "madeira", label: "Madeira" },
];

const condicaoPagamentoOptions = [
  { value: "a_vista", label: "À Vista" },
  { value: "2x", label: "2x" },
  { value: "3x", label: "3x" },
  { value: "4x", label: "4x" },
  { value: "5x", label: "5x" },
  { value: "6x", label: "6x" },
];

export default function IntencaoCompraForm({
  open,
  onClose,
  onSave,
  intencao,
  clientes = [],
  loteamentos = [],
}) {
  const [formData, setFormData] = useState(intencao || {
    cliente_id: "",
    loteamento_id: "",
    lote_id: "",
    status: "rascunho",
    orcamento_minimo: "",
    orcamento_maximo: "",
    padrao_imovel: "medio",
    area_construida_desejada: "",
    quantidade_pavimentos: 1,
    quantidade_quartos: 2,
    quantidade_suites: 1,
    quantidade_banheiros: 2,
    quantidade_lavabos: 0,
    vagas_garagem: 1,
    garagem_coberta: true,
    comodos: {
      sala_estar: true,
      sala_jantar: true,
      sala_tv: false,
      cozinha: true,
      cozinha_americana: false,
      copa: false,
      area_servico: true,
      lavanderia: false,
      despensa: false,
      escritorio: false,
      home_office: false,
      area_gourmet: false,
      churrasqueira: false,
      piscina: false,
      varanda: false,
      varanda_gourmet: false,
      jardim_inverno: false,
      closet_master: false,
      banheira: false,
      edicola: false,
      quarto_empregada: false,
    },
    adicionais: {
      ar_condicionado: false,
      aquecimento_solar: false,
      energia_solar: false,
      automacao_residencial: false,
      sistema_seguranca: false,
      cerca_eletrica: false,
      cameras: false,
      alarme: false,
      portao_automatico: false,
      interfone: false,
      wifi_estruturado: false,
      home_theater: false,
      jardim_paisagismo: false,
      iluminacao_jardim: false,
      mobilia_planejada: false,
      moveis_cozinha: false,
      moveis_banheiro: false,
    },
    preferencias_cores: {
      fachada_principal: "",
      fachada_detalhes: "",
      paredes_internas: "",
      teto: "",
      portas: "",
      janelas: "",
      observacoes_cores: "",
    },
    tipo_telhado: "",
    tipo_piso_interno: "",
    tipo_piso_externo: "",
    tipo_revestimento_parede: "",
    detalhes_especificos: "",
    gerar_custo_projeto: false,
    valor_custo_projeto: "",
    condicao_pagamento_projeto: "a_vista",
    data_vencimento_projeto: "",
    observacoes: "",
  });

  const [showClienteDialog, setShowClienteDialog] = useState(false);
  const [showLoteamentoDialog, setShowLoteamentoDialog] = useState(false);

  const clienteSelecionado = clientes.find(c => c.id === formData.cliente_id);
  const loteamentoSelecionado = loteamentos.find(l => l.id === formData.loteamento_id);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
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

  return (
    <>
      <Dialog open={open && !showClienteDialog && !showLoteamentoDialog} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {intencao ? "Editar Intenção de Compra" : "Nova Intenção de Compra"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="cliente" className="flex-1 overflow-hidden">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="cliente" className="text-xs">
                <User className="w-3 h-3 mr-1" />
                Cliente
              </TabsTrigger>
              <TabsTrigger value="estrutura" className="text-xs">
                <Home className="w-3 h-3 mr-1" />
                Estrutura
              </TabsTrigger>
              <TabsTrigger value="comodos" className="text-xs">
                <Layers className="w-3 h-3 mr-1" />
                Cômodos
              </TabsTrigger>
              <TabsTrigger value="acabamento" className="text-xs">
                <Palette className="w-3 h-3 mr-1" />
                Acabamento
              </TabsTrigger>
              <TabsTrigger value="adicionais" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Adicionais
              </TabsTrigger>
              <TabsTrigger value="financeiro" className="text-xs">
                <DollarSign className="w-3 h-3 mr-1" />
                Financeiro
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 h-[500px] mt-4">
              {/* Tab Cliente */}
              <TabsContent value="cliente" className="space-y-4 pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Dados do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Cliente *</Label>
                      <div className="flex gap-2">
                        <Input
                          value={clienteSelecionado?.nome || ""}
                          placeholder="Selecione um cliente"
                          readOnly
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" onClick={() => setShowClienteDialog(true)}>
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Loteamento de Preferência</Label>
                      <div className="flex gap-2">
                        <Input
                          value={loteamentoSelecionado?.nome || ""}
                          placeholder="Selecione um loteamento (opcional)"
                          readOnly
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" onClick={() => setShowLoteamentoDialog(true)}>
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Orçamento Mínimo</Label>
                        <Input
                          type="number"
                          value={formData.orcamento_minimo}
                          onChange={(e) => handleChange("orcamento_minimo", parseFloat(e.target.value) || "")}
                          placeholder="R$ 0,00"
                        />
                      </div>
                      <div>
                        <Label>Orçamento Máximo</Label>
                        <Input
                          type="number"
                          value={formData.orcamento_maximo}
                          onChange={(e) => handleChange("orcamento_maximo", parseFloat(e.target.value) || "")}
                          placeholder="R$ 0,00"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Padrão do Imóvel *</Label>
                      <Select
                        value={formData.padrao_imovel}
                        onValueChange={(value) => handleChange("padrao_imovel", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o padrão" />
                        </SelectTrigger>
                        <SelectContent>
                          {padraoOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Estrutura */}
              <TabsContent value="estrutura" className="space-y-4 pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Estrutura do Imóvel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Área Construída Desejada (m²)</Label>
                        <Input
                          type="number"
                          value={formData.area_construida_desejada}
                          onChange={(e) => handleChange("area_construida_desejada", parseFloat(e.target.value) || "")}
                          placeholder="Ex: 150"
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Pavimentos
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={4}
                          value={formData.quantidade_pavimentos}
                          onChange={(e) => handleChange("quantidade_pavimentos", parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Bed className="w-4 h-4" />
                          Quartos
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.quantidade_quartos}
                          onChange={(e) => handleChange("quantidade_quartos", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          <Bed className="w-4 h-4" />
                          Suítes
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.quantidade_suites}
                          onChange={(e) => handleChange("quantidade_suites", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          <Bath className="w-4 h-4" />
                          Banheiros
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.quantidade_banheiros}
                          onChange={(e) => handleChange("quantidade_banheiros", parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Lavabos</Label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.quantidade_lavabos}
                          onChange={(e) => handleChange("quantidade_lavabos", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          <Car className="w-4 h-4" />
                          Vagas Garagem
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.vagas_garagem}
                          onChange={(e) => handleChange("vagas_garagem", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <Switch
                          checked={formData.garagem_coberta}
                          onCheckedChange={(checked) => handleChange("garagem_coberta", checked)}
                        />
                        <Label>Garagem Coberta</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Cômodos */}
              <TabsContent value="comodos" className="space-y-4 pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cômodos Desejados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(comodosLabels).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2 p-2 border rounded-lg">
                          <Switch
                            checked={formData.comodos?.[key] || false}
                            onCheckedChange={(checked) => handleNestedChange("comodos", key, checked)}
                          />
                          <Label className="text-sm cursor-pointer">{label}</Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Acabamento */}
              <TabsContent value="acabamento" className="space-y-4 pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Acabamentos e Cores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo de Telhado</Label>
                        <Select
                          value={formData.tipo_telhado}
                          onValueChange={(value) => handleChange("tipo_telhado", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {telhadoOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Piso Interno</Label>
                        <Select
                          value={formData.tipo_piso_interno}
                          onValueChange={(value) => handleChange("tipo_piso_interno", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {pisoInternoOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Piso Externo</Label>
                        <Select
                          value={formData.tipo_piso_externo}
                          onValueChange={(value) => handleChange("tipo_piso_externo", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {pisoExternoOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Revestimento de Parede</Label>
                        <Select
                          value={formData.tipo_revestimento_parede}
                          onValueChange={(value) => handleChange("tipo_revestimento_parede", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {revestimentoOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Preferências de Cores</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Fachada Principal</Label>
                          <Input
                            value={formData.preferencias_cores?.fachada_principal || ""}
                            onChange={(e) => handleNestedChange("preferencias_cores", "fachada_principal", e.target.value)}
                            placeholder="Ex: Branco gelo"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Detalhes da Fachada</Label>
                          <Input
                            value={formData.preferencias_cores?.fachada_detalhes || ""}
                            onChange={(e) => handleNestedChange("preferencias_cores", "fachada_detalhes", e.target.value)}
                            placeholder="Ex: Cinza escuro"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Paredes Internas</Label>
                          <Input
                            value={formData.preferencias_cores?.paredes_internas || ""}
                            onChange={(e) => handleNestedChange("preferencias_cores", "paredes_internas", e.target.value)}
                            placeholder="Ex: Branco neve"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Teto</Label>
                          <Input
                            value={formData.preferencias_cores?.teto || ""}
                            onChange={(e) => handleNestedChange("preferencias_cores", "teto", e.target.value)}
                            placeholder="Ex: Branco"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Portas</Label>
                          <Input
                            value={formData.preferencias_cores?.portas || ""}
                            onChange={(e) => handleNestedChange("preferencias_cores", "portas", e.target.value)}
                            placeholder="Ex: Madeira natural"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Janelas</Label>
                          <Input
                            value={formData.preferencias_cores?.janelas || ""}
                            onChange={(e) => handleNestedChange("preferencias_cores", "janelas", e.target.value)}
                            placeholder="Ex: Alumínio branco"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Observações sobre Cores</Label>
                        <Textarea
                          value={formData.preferencias_cores?.observacoes_cores || ""}
                          onChange={(e) => handleNestedChange("preferencias_cores", "observacoes_cores", e.target.value)}
                          placeholder="Outras preferências de cores..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Adicionais */}
              <TabsContent value="adicionais" className="space-y-4 pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Itens Adicionais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(adicionaisLabels).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2 p-2 border rounded-lg">
                          <Switch
                            checked={formData.adicionais?.[key] || false}
                            onCheckedChange={(checked) => handleNestedChange("adicionais", key, checked)}
                          />
                          <Label className="text-sm cursor-pointer">{label}</Label>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <div>
                      <Label>Detalhes Específicos</Label>
                      <Textarea
                        value={formData.detalhes_especificos}
                        onChange={(e) => handleChange("detalhes_especificos", e.target.value)}
                        placeholder="Descreva aqui detalhes específicos que o cliente deseja no imóvel..."
                        rows={4}
                      />
                    </div>

                    <div className="mt-4">
                      <Label>Observações Gerais</Label>
                      <Textarea
                        value={formData.observacoes}
                        onChange={(e) => handleChange("observacoes", e.target.value)}
                        placeholder="Observações adicionais..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Financeiro */}
              <TabsContent value="financeiro" className="space-y-4 pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Custo do Projeto (Engenheiro)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Switch
                        checked={formData.gerar_custo_projeto}
                        onCheckedChange={(checked) => handleChange("gerar_custo_projeto", checked)}
                      />
                      <div>
                        <Label className="font-semibold">Gerar Cobrança do Custo do Projeto</Label>
                        <p className="text-xs text-gray-600">
                          Marque esta opção para gerar uma cobrança do custo do projeto caso a negociação não se concretize.
                        </p>
                      </div>
                    </div>

                    {formData.gerar_custo_projeto && (
                      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                        <div>
                          <Label>Valor do Custo do Projeto *</Label>
                          <Input
                            type="number"
                            value={formData.valor_custo_projeto}
                            onChange={(e) => handleChange("valor_custo_projeto", parseFloat(e.target.value) || "")}
                            placeholder="R$ 0,00"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Condição de Pagamento</Label>
                            <Select
                              value={formData.condicao_pagamento_projeto}
                              onValueChange={(value) => handleChange("condicao_pagamento_projeto", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {condicaoPagamentoOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Data de Vencimento</Label>
                            <Input
                              type="date"
                              value={formData.data_vencimento_projeto}
                              onChange={(e) => handleChange("data_vencimento_projeto", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.cliente_id}>
              {intencao ? "Salvar Alterações" : "Criar Intenção de Compra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showClienteDialog && (
        <SearchClienteDialog
          open={showClienteDialog}
          onClose={() => setShowClienteDialog(false)}
          clientes={clientes}
          onSelect={(cliente) => {
            handleChange("cliente_id", cliente.id);
            setShowClienteDialog(false);
          }}
        />
      )}

      {showLoteamentoDialog && (
        <SearchLoteamentoDialog
          open={showLoteamentoDialog}
          onClose={() => setShowLoteamentoDialog(false)}
          loteamentos={loteamentos}
          onSelect={(loteamento) => {
            handleChange("loteamento_id", loteamento.id);
            setShowLoteamentoDialog(false);
          }}
        />
      )}
    </>
  );
}