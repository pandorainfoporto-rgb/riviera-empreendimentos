import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Home, Palette, Settings, Layers, Bed, Bath, Car } from "lucide-react";

const telhadoOptions = [
  { value: "ceramica", label: "Cerâmica" },
  { value: "concreto", label: "Concreto" },
  { value: "fibrocimento", label: "Fibrocimento" },
  { value: "metalico", label: "Metálico" },
  { value: "laje_impermeabilizada", label: "Laje Impermeabilizada" },
];

const pisoInternoOptions = [
  { value: "ceramica", label: "Cerâmica" },
  { value: "porcelanato", label: "Porcelanato" },
  { value: "madeira", label: "Madeira" },
  { value: "laminado", label: "Laminado" },
  { value: "vinilico", label: "Vinílico" },
];

const pisoExternoOptions = [
  { value: "ceramica", label: "Cerâmica" },
  { value: "porcelanato", label: "Porcelanato" },
  { value: "pedra", label: "Pedra Natural" },
  { value: "concreto", label: "Concreto" },
];

const revestimentoOptions = [
  { value: "pintura", label: "Pintura" },
  { value: "textura", label: "Textura" },
  { value: "ceramica", label: "Cerâmica" },
  { value: "porcelanato", label: "Porcelanato" },
];

const comodosLabels = {
  sala_estar: "Sala de Estar",
  sala_jantar: "Sala de Jantar",
  sala_tv: "Sala de TV",
  cozinha: "Cozinha",
  area_servico: "Área de Serviço",
  escritorio: "Escritório",
  area_gourmet: "Área Gourmet",
  churrasqueira: "Churrasqueira",
  piscina: "Piscina",
  varanda: "Varanda",
};

const adicionaisLabels = {
  ar_condicionado: "Ar Condicionado",
  aquecimento_solar: "Aquecimento Solar",
  energia_solar: "Energia Solar",
  automacao_residencial: "Automação",
  sistema_seguranca: "Segurança",
  portao_automatico: "Portão Automático",
  jardim_paisagismo: "Paisagismo",
};

export default function DetalhesImovelStep({ data, onChange, onNext, onBack }) {
  const handleChange = (field, value) => {
    onChange({ [field]: value });
  };

  const handleNestedChange = (parent, field, value) => {
    onChange({ [parent]: { ...data[parent], [field]: value } });
  };

  return (
    <div className="p-6 space-y-4">
      <Tabs defaultValue="estrutura">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="estrutura">
            <Home className="w-4 h-4 mr-2" />
            Estrutura
          </TabsTrigger>
          <TabsTrigger value="acabamento">
            <Palette className="w-4 h-4 mr-2" />
            Acabamento
          </TabsTrigger>
          <TabsTrigger value="extras">
            <Settings className="w-4 h-4 mr-2" />
            Extras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estrutura" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Área Construída (m²)</Label>
                  <Input
                    type="number"
                    value={data.area_construida_desejada}
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
                    value={data.quantidade_pavimentos}
                    onChange={(e) => handleChange("quantidade_pavimentos", parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Bed className="w-4 h-4" />
                    Quartos
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={data.quantidade_quartos}
                    onChange={(e) => handleChange("quantidade_quartos", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Suítes</Label>
                  <Input
                    type="number"
                    min={0}
                    value={data.quantidade_suites}
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
                    value={data.quantidade_banheiros}
                    onChange={(e) => handleChange("quantidade_banheiros", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Vagas Garagem
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={data.vagas_garagem}
                    onChange={(e) => handleChange("vagas_garagem", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={data.garagem_coberta}
                    onCheckedChange={(checked) => handleChange("garagem_coberta", checked)}
                  />
                  <Label>Garagem Coberta</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acabamento" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Telhado</Label>
                  <Select
                    value={data.tipo_telhado}
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
                    value={data.tipo_piso_interno}
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
                    value={data.tipo_piso_externo}
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
                  <Label>Revestimento</Label>
                  <Select
                    value={data.tipo_revestimento_parede}
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

              <div>
                <Label className="font-semibold mb-2 block">Preferências de Cores</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={data.preferencias_cores?.fachada_principal || ""}
                    onChange={(e) => handleNestedChange("preferencias_cores", "fachada_principal", e.target.value)}
                    placeholder="Fachada principal"
                  />
                  <Input
                    value={data.preferencias_cores?.paredes_internas || ""}
                    onChange={(e) => handleNestedChange("preferencias_cores", "paredes_internas", e.target.value)}
                    placeholder="Paredes internas"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extras" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cômodos Desejados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(comodosLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2 p-2 border rounded">
                    <Switch
                      checked={data.comodos?.[key] || false}
                      onCheckedChange={(checked) => handleNestedChange("comodos", key, checked)}
                    />
                    <Label className="text-xs cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Itens Adicionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(adicionaisLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2 p-2 border rounded">
                    <Switch
                      checked={data.adicionais?.[key] || false}
                      onCheckedChange={(checked) => handleNestedChange("adicionais", key, checked)}
                    />
                    <Label className="text-xs cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Label>Detalhes Específicos</Label>
              <Textarea
                value={data.detalhes_especificos}
                onChange={(e) => handleChange("detalhes_especificos", e.target.value)}
                placeholder="Detalhes específicos do cliente..."
                rows={3}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button 
          type="button" 
          onClick={onNext}
          className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}