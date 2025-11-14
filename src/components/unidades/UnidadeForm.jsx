
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, MapPin, Ruler, DollarSign, Calendar, Info,
  Upload, FileText, Loader2, CheckCircle2,
  Plus, X, Home, Bath, Map, Download, Package, Search
} from "lucide-react";
import { toast } from "sonner";
import MapaLote from "./MapaLote";
import ImageUploader from "../imagens/ImageUploader";
import ImageGallery from "../imagens/ImageGallery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SearchLoteamentoDialog from "../shared/SearchLoteamentoDialog";
import SearchClienteDialog from "../shared/SearchClienteDialog";
import { InputCurrency } from "@/components/ui/input-currency"; // New import

const estruturaPadrao = {
  pavimento_terreo: {
    quartos: [],
    salas: [],
    cozinha: {},
    banheiros_sociais: 0,
    lavabo: false,
    area_gourmet: {},
    adega: {},
    escritorio: {},
    despensa: {},
    area_servico: {},
    quarto_servico: {}
  },
  pavimento_superior: {
    possui: false,
    quartos: [],
    salas: [],
    banheiros_sociais: 0,
    biblioteca: {},
    escritorio: {},
    varanda: {}
  },
  pavimento_subsolo: {
    possui: false,
    garagem_quantidade_vagas: 0,
    adega: false,
    deposito: false,
    sala_jogos: false,
    home_theater: false,
    area_m2: 0
  },
  areas_externas: {
    piscina: {},
    jardim: {},
    quintal: {},
    deck: {}
  }
};

export default function UnidadeForm({ item, onSubmit, onCancel, isProcessing }) { // Changed 'unidade' to 'item'
  const inicializarFormData = (data) => {
    return {
      codigo: "",
      loteamento_id: "",
      tipo: "apartamento",
      area_total: 0,
      area_construida: 0,
      medidas_lote: {},
      orientacao_solar: {},
      localizacao: {},
      quartos: 0,
      banheiros: 0,
      vagas_garagem: 0,
      andar: "",
      bloco: "",
      padrao_obra: "medio",
      quantidade_pavimentos: 1,
      tem_laje: false,
      tipo_laje: "nenhuma",
      pe_direito: 2.8,
      tipo_fundacao: "radier",
      tipo_estrutura: "concreto_armado",
      detalhamento_pavimentos: estruturaPadrao,
      incluir_mobilia: false,
      incluir_automacao: false,
      incluir_wifi_dados: false,
      incluir_aquecimento_solar: false,
      incluir_ar_condicionado: false,
      incluir_energia_solar: false,
      incluir_sistema_seguranca: false,
      incluir_paisagismo: false,
      valor_venda: 0,
      valor_custo: 0,
      valor_lote: 0,
      matricula: "",
      endereco: "",
      status: "disponivel",
      cliente_id: "",
      data_venda: "",
      data_inicio_obra: "",
      data_prevista_conclusao: "",
      observacoes: "",
      projetos_arquitetonicos: [],
      disponivel_locacao: false, // New field
      valor_aluguel: 0, // New field
      valor_condominio: 0, // New field
      valor_iptu_mensal: 0, // New field
      ...data
    };
  };

  const [formData, setFormData] = useState(inicializarFormData(item)); // Changed 'unidade' to 'item'
  const [uploadingProjeto, setUploadingProjeto] = useState(false);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [mostrarSelecionarLote, setMostrarSelecionarLote] = useState(false);
  const [showLoteamentoSearch, setShowLoteamentoSearch] = useState(false);

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: lotes = [] } = useQuery({
    queryKey: ['lotes', formData.loteamento_id],
    queryFn: async () => {
      if (!formData.loteamento_id) return [];
      const unidades = await base44.entities.Unidade.list();
      return unidades.filter(u => u.tipo === 'lote' && u.loteamento_id === formData.loteamento_id);
    },
    enabled: !!formData.loteamento_id,
  });

  const handleImportarDadosLote = (lote) => {
    if (!lote) return;

    setFormData({
      ...formData,
      area_total: lote.area_total || formData.area_total,
      medidas_lote: lote.medidas_lote || formData.medidas_lote,
      orientacao_solar: lote.orientacao_solar || formData.orientacao_solar,
      localizacao: lote.localizacao || formData.localizacao,
      endereco: lote.endereco || formData.endereco,
      valor_lote: lote.valor_venda || formData.valor_lote,
    });

    setMostrarSelecionarLote(false);
    toast.success("Dados do lote importados com sucesso!");
  };

  const handleUploadProjeto = async (file, tipoProjeto) => {
    try {
      setUploadingProjeto(true);

      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const novosProjetos = [...(formData.projetos_arquitetonicos || [])];
      novosProjetos.push({
        tipo: tipoProjeto,
        nome: file.name,
        arquivo_url: file_url,
        data_upload: new Date().toISOString(),
      });

      setFormData({ ...formData, projetos_arquitetonicos: novosProjetos });

      // Se a unidade já existe, criar registro na tabela Imagem automaticamente
      if (item?.id) { // Changed 'unidade?.id' to 'item?.id'
        try {
          await base44.entities.Imagem.create({
            entidade_tipo: "Unidade",
            entidade_id: item.id, // Changed 'unidade.id' to 'item.id'
            arquivo_url: file_url,
            titulo: `Projeto: ${file.name}`,
            tipo: "planta",
            tamanho_bytes: file.size,
          });
          toast.success("Projeto salvo em imagens!");
        } catch (imgError) {
          console.error("Erro ao salvar em imagens:", imgError);
          toast.success("Projeto anexado!");
        }
      } else {
        toast.success("Projeto anexado! Salve a unidade primeiro.");
      }

    } catch (error) {
      toast.error("Erro ao fazer upload: " + error.message);
    } finally {
      setUploadingProjeto(false);
    }
  };

  const handleRemoverProjeto = (index) => {
    const novosProjetos = formData.projetos_arquitetonicos.filter((_, i) => i !== index);
    setFormData({ ...formData, projetos_arquitetonicos: novosProjetos });
  };

  const handleSelecionarNoMapa = (coordenadas) => {
    setFormData({
      ...formData,
      localizacao: {
        latitude: coordenadas.lat,
        longitude: coordenadas.lng,
        altitude: formData.localizacao?.altitude || 0
      }
    });
    setMostrarMapa(false);
    toast.success("Coordenadas importadas do mapa!");
  };

  const tiposProjetoLabels = {
    planta_baixa: "Planta Baixa",
    projeto_eletrico: "Projeto Elétrico",
    projeto_hidraulico: "Projeto Hidráulico",
    projeto_estrutural: "Projeto Estrutural",
    projeto_gas: "Projeto de Gás",
    projeto_incendio: "Projeto de Incêndio",
    projeto_ar_condicionado: "Projeto de Ar Condicionado",
    memorial_descritivo: "Memorial Descritivo",
    outros: "Outros"
  };

  // Funções para manipular quartos e salas
  const addQuarto = (pavimento) => {
    const novoQuarto = {
      nome: "",
      area_m2: 0,
      eh_suite: false,
      tem_closet: false,
      tem_sacada: false,
      area_closet_m2: 0
    };

    const path = pavimento === 'terreo' ? 'pavimento_terreo' : 'pavimento_superior';
    const quartosAtuais = formData.detalhamento_pavimentos[path]?.quartos || [];

    setFormData({
      ...formData,
      detalhamento_pavimentos: {
        ...formData.detalhamento_pavimentos,
        [path]: {
          ...formData.detalhamento_pavimentos[path],
          quartos: [...quartosAtuais, novoQuarto]
        }
      }
    });
  };

  const removeQuarto = (pavimento, index) => {
    const path = pavimento === 'terreo' ? 'pavimento_terreo' : 'pavimento_superior';
    const quartosAtuais = [...formData.detalhamento_pavimentos[path].quartos];
    quartosAtuais.splice(index, 1);

    setFormData({
      ...formData,
      detalhamento_pavimentos: {
        ...formData.detalhamento_pavimentos,
        [path]: {
          ...formData.detalhamento_pavimentos[path],
          quartos: quartosAtuais
        }
      }
    });
  };

  const updateQuarto = (pavimento, index, field, value) => {
    const path = pavimento === 'terreo' ? 'pavimento_terreo' : 'pavimento_superior';
    const quartosAtuais = [...formData.detalhamento_pavimentos[path].quartos];
    quartosAtuais[index] = { ...quartosAtuais[index], [field]: value };

    setFormData({
      ...formData,
      detalhamento_pavimentos: {
        ...formData.detalhamento_pavimentos,
        [path]: {
          ...formData.detalhamento_pavimentos[path],
          quartos: quartosAtuais
        }
      }
    });
  };

  const addSala = (pavimento) => {
    const novaSala = { tipo: "estar", area_m2: 0, tem_lareira: false };
    const path = pavimento === 'terreo' ? 'pavimento_terreo' : 'pavimento_superior';
    const salasAtuais = formData.detalhamento_pavimentos[path]?.salas || [];

    setFormData({
      ...formData,
      detalhamento_pavimentos: {
        ...formData.detalhamento_pavimentos,
        [path]: {
          ...formData.detalhamento_pavimentos[path],
          salas: [...salasAtuais, novaSala]
        }
      }
    });
  };

  const removeSala = (pavimento, index) => {
    const path = pavimento === 'terreo' ? 'pavimento_terreo' : 'pavimento_superior';
    const salasAtuais = [...formData.detalhamento_pavimentos[path].salas];
    salasAtuais.splice(index, 1);

    setFormData({
      ...formData,
      detalhamento_pavimentos: {
        ...formData.detalhamento_pavimentos,
        [path]: {
          ...formData.detalhamento_pavimentos[path],
          salas: salasAtuais
        }
      }
    });
  };

  const updateSala = (pavimento, index, field, value) => {
    const path = pavimento === 'terreo' ? 'pavimento_terreo' : 'pavimento_superior';
    const salasAtuais = [...formData.detalhamento_pavimentos[path].salas];
    salasAtuais[index] = { ...salasAtuais[index], [field]: value };

    setFormData({
      ...formData,
      detalhamento_pavimentos: {
        ...formData.detalhamento_pavimentos,
        [path]: {
          ...formData.detalhamento_pavimentos[path],
          salas: salasAtuais
        }
      }
    });
  };

  const handleSubmit = (e, fecharAposSalvar = true) => {
    e.preventDefault();
    onSubmit(formData, fecharAposSalvar);
  };

  return (
    <>
      <Card className="shadow-xl border-t-4 border-[var(--wine-600)]">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3 text-[var(--wine-700)]">
            <Building2 className="w-8 h-8" />
            {item ? "Editar Unidade" : "Nova Unidade"}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 gap-1 h-auto">
              <TabsTrigger value="basico" className="text-xs sm:text-sm">Básico</TabsTrigger>
              <TabsTrigger value="medidas" className="text-xs sm:text-sm">Medidas</TabsTrigger>
              <TabsTrigger value="localizacao" className="text-xs sm:text-sm">Localização</TabsTrigger>
              <TabsTrigger value="detalhes" className="text-xs sm:text-sm">Detalhes</TabsTrigger>
              <TabsTrigger value="projetos" className="text-xs sm:text-sm">Projetos</TabsTrigger>
              <TabsTrigger value="imagens" className="text-xs sm:text-sm" disabled={!item?.id}>
                🖼️ Fotos
              </TabsTrigger>
              <TabsTrigger value="precificacao" className="text-xs sm:text-sm">Precificação</TabsTrigger>
            </TabsList>

            {/* ABA BÁSICO */}
            <TabsContent value="basico" className="space-y-6 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código/Número *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: Apto 101, Lote 15"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loteamento" className="flex items-center gap-2">
                    Loteamento *
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setShowLoteamentoSearch(true)}
                    >
                      <Search className="w-3 h-3" />
                    </Button>
                  </Label>
                  <Input
                    value={loteamentos.find(l => l.id === formData.loteamento_id)?.nome || ""}
                    disabled
                    className="bg-gray-100"
                    placeholder="Clique na lupa para selecionar..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartamento">Apartamento</SelectItem>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="lote">Lote</SelectItem>
                      <SelectItem value="sala_comercial">Sala Comercial</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="reservada">Reservada</SelectItem>
                      <SelectItem value="vendida">Vendida</SelectItem>
                      <SelectItem value="escriturada">Escriturada</SelectItem>
                      <SelectItem value="em_construcao">Em Construção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area_total">Área Total (m²) *</Label>
                  <Input
                    id="area_total"
                    type="number"
                    step="0.01"
                    value={formData.area_total}
                    onChange={(e) => setFormData({ ...formData, area_total: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area_construida">Área Construída (m²)</Label>
                  <Input
                    id="area_construida"
                    type="number"
                    step="0.01"
                    value={formData.area_construida}
                    onChange={(e) => setFormData({ ...formData, area_construida: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço Completo</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ABA MEDIDAS */}
            <TabsContent value="medidas" className="space-y-6 mt-4">
              <div className="flex justify-end mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMostrarSelecionarLote(true)}
                  disabled={!formData.loteamento_id}
                  className="border-[var(--wine-600)] text-[var(--wine-600)] hover:bg-[var(--wine-50)]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Importar Dados de um Lote
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">📐 Medidas do Lote/Terreno</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frente (metros)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.medidas_lote?.frente || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          medidas_lote: { ...formData.medidas_lote, frente: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fundo (metros)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.medidas_lote?.fundo || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          medidas_lote: { ...formData.medidas_lote, fundo: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lateral Direita (metros)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.medidas_lote?.lateral_direita || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          medidas_lote: { ...formData.medidas_lote, lateral_direita: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lateral Esquerda (metros)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.medidas_lote?.lateral_esquerda || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          medidas_lote: { ...formData.medidas_lote, lateral_esquerda: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">☀️ Orientação Solar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Graus em relação ao Norte (0-360°)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="360"
                        value={formData.orientacao_solar?.graus_norte || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          orientacao_solar: { ...formData.orientacao_solar, graus_norte: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Face Principal</Label>
                      <Select
                        value={formData.orientacao_solar?.face_principal || "norte"}
                        onValueChange={(val) => setFormData({
                          ...formData,
                          orientacao_solar: { ...formData.orientacao_solar, face_principal: val }
                        })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="norte">Norte</SelectItem>
                          <SelectItem value="sul">Sul</SelectItem>
                          <SelectItem value="leste">Leste</SelectItem>
                          <SelectItem value="oeste">Oeste</SelectItem>
                          <SelectItem value="nordeste">Nordeste</SelectItem>
                          <SelectItem value="noroeste">Noroeste</SelectItem>
                          <SelectItem value="sudeste">Sudeste</SelectItem>
                          <SelectItem value="sudoeste">Sudoeste</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA LOCALIZAÇÃO */}
            <TabsContent value="localizacao" className="space-y-6 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Coordenadas Geográficas
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMostrarMapa(!mostrarMapa)}
                      className="flex items-center gap-2"
                    >
                      <Map className="w-4 h-4" />
                      {mostrarMapa ? 'Fechar Mapa' : 'Selecionar no Mapa'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mostrarMapa && (
                    <div className="mb-4 border-2 border-blue-300 rounded-lg overflow-hidden">
                      <MapaLote
                        coordenadas={formData.localizacao?.latitude && formData.localizacao?.longitude ? {
                          lat: formData.localizacao.latitude,
                          lng: formData.localizacao.longitude
                        } : null}
                        onSelecionarCoordenadas={handleSelecionarNoMapa}
                        altura="400px"
                      />
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Latitude</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={formData.localizacao?.latitude || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          localizacao: { ...formData.localizacao, latitude: parseFloat(e.target.value) || 0 }
                        })}
                        placeholder="-25.4284"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Longitude</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={formData.localizacao?.longitude || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          localizacao: { ...formData.localizacao, longitude: parseFloat(e.target.value) || 0 }
                        })}
                        placeholder="-49.2733"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Altitude (metros)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.localizacao?.altitude || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          localizacao: { ...formData.localizacao, altitude: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                  </div>

                  {formData.localizacao?.latitude && formData.localizacao?.longitude && !mostrarMapa && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Coordenadas definidas: {formData.localizacao.latitude.toFixed(6)}, {formData.localizacao.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA DETALHES DOS PAVIMENTOS */}
            <TabsContent value="detalhes" className="space-y-6 mt-4">
              <Tabs defaultValue="terreo" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="terreo">Térreo</TabsTrigger>
                  <TabsTrigger value="superior">Superior</TabsTrigger>
                  <TabsTrigger value="subsolo">Subsolo</TabsTrigger>
                  <TabsTrigger value="externas">Externas</TabsTrigger>
                </TabsList>

                {/* PAVIMENTO TÉRREO */}
                <TabsContent value="terreo" className="space-y-6 mt-4">
                  <Card className="border-blue-200">
                    <CardHeader className="bg-blue-50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          Quartos no Térreo
                        </CardTitle>
                        <Button type="button" size="sm" onClick={() => addQuarto('terreo')}>
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {formData.detalhamento_pavimentos?.pavimento_terreo?.quartos?.map((quarto, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg border relative">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 text-red-500 hover:bg-red-100"
                            onClick={() => removeQuarto('terreo', idx)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <div className="grid md:grid-cols-2 gap-4 mb-3">
                            <div className="space-y-2">
                              <Label>Nome do Quarto</Label>
                              <Input
                                value={quarto.nome || ""}
                                onChange={(e) => updateQuarto('terreo', idx, 'nome', e.target.value)}
                                placeholder="Ex: Suíte Master"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Área (m²)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={quarto.area_m2 || 0}
                                onChange={(e) => updateQuarto('terreo', idx, 'area_m2', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={quarto.eh_suite || false}
                                onCheckedChange={(checked) => updateQuarto('terreo', idx, 'eh_suite', checked)}
                              />
                              <span className="text-sm">É Suíte</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={quarto.tem_closet || false}
                                onCheckedChange={(checked) => updateQuarto('terreo', idx, 'tem_closet', checked)}
                              />
                              <span className="text-sm">Tem Closet</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={quarto.tem_sacada || false}
                                onCheckedChange={(checked) => updateQuarto('terreo', idx, 'tem_sacada', checked)}
                              />
                              <span className="text-sm">Tem Sacada</span>
                            </label>
                            {quarto.tem_closet && (
                              <div className="space-y-2">
                                <Label className="text-xs">Área Closet (m²)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={quarto.area_closet_m2 || 0}
                                  onChange={(e) => updateQuarto('terreo', idx, 'area_closet_m2', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Salas Térreo */}
                  <Card className="border-purple-200">
                    <CardHeader className="bg-purple-50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Salas no Térreo
                        </CardTitle>
                        <Button type="button" size="sm" onClick={() => addSala('terreo')}>
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {formData.detalhamento_pavimentos?.pavimento_terreo?.salas?.map((sala, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg border relative">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 text-red-500 hover:bg-red-100"
                            onClick={() => removeSala('terreo', idx)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Tipo de Sala</Label>
                              <Select
                                value={sala.tipo || "estar"}
                                onValueChange={(val) => updateSala('terreo', idx, 'tipo', val)}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="estar">Estar</SelectItem>
                                  <SelectItem value="jantar">Jantar</SelectItem>
                                  <SelectItem value="tv">TV</SelectItem>
                                  <SelectItem value="jogos">Jogos</SelectItem>
                                  <SelectItem value="home_theater">Home Theater</SelectItem>
                                  <SelectItem value="estar_jantar_integrada">Estar/Jantar Integrada</SelectItem>
                                  <SelectItem value="outros">Outros</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Área (m²)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={sala.area_m2 || 0}
                                onChange={(e) => updateSala('terreo', idx, 'area_m2', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="flex items-end">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={sala.tem_lareira || false}
                                  onCheckedChange={(checked) => updateSala('terreo', idx, 'tem_lareira', checked)}
                                />
                                <span className="text-sm">Tem Lareira</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Cozinha */}
                  <Card className="border-green-200">
                    <CardHeader className="bg-green-50">
                      <CardTitle className="text-sm">🍳 Cozinha</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select
                            value={formData.detalhamento_pavimentos?.pavimento_terreo?.cozinha?.tipo || "americana"}
                            onValueChange={(val) => setFormData({
                              ...formData,
                              detalhamento_pavimentos: {
                                ...formData.detalhamento_pavimentos,
                                pavimento_terreo: {
                                  ...formData.detalhamento_pavimentos.pavimento_terreo,
                                  cozinha: { ...formData.detalhamento_pavimentos.pavimento_terreo.cozinha, tipo: val }
                                }
                              }
                            })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="americana">Americana</SelectItem>
                              <SelectItem value="tradicional">Tradicional</SelectItem>
                              <SelectItem value="gourmet">Gourmet</SelectItem>
                              <SelectItem value="integrada_sala">Integrada à Sala</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Área (m²)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.detalhamento_pavimentos?.pavimento_terreo?.cozinha?.area_m2 || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              detalhamento_pavimentos: {
                                ...formData.detalhamento_pavimentos,
                                pavimento_terreo: {
                                  ...formData.detalhamento_pavimentos.pavimento_terreo,
                                  cozinha: { ...formData.detalhamento_pavimentos.pavimento_terreo.cozinha, area_m2: parseFloat(e.target.value) || 0 }
                                }
                              }
                            })}
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={formData.detalhamento_pavimentos?.pavimento_terreo?.cozinha?.tem_ilha || false}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              detalhamento_pavimentos: {
                                ...formData.detalhamento_pavimentos,
                                pavimento_terreo: {
                                  ...formData.detalhamento_pavimentos.pavimento_terreo,
                                  cozinha: { ...formData.detalhamento_pavimentos.pavimento_terreo.cozinha, tem_ilha: checked }
                                }
                              }
                            })}
                          />
                          <span className="text-sm">Tem Ilha</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={formData.detalhamento_pavimentos?.pavimento_terreo?.cozinha?.tem_copa || false}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              detalhamento_pavimentos: {
                                ...formData.detalhamento_pavimentos,
                                pavimento_terreo: {
                                  ...formData.detalhamento_pavimentos.pavimento_terreo,
                                  cozinha: { ...formData.detalhamento_pavimentos.pavimento_terreo.cozinha, tem_copa: checked }
                                }
                              }
                            })}
                          />
                          <span className="text-sm">Tem Copa</span>
                        </label>
                        {formData.detalhamento_pavimentos?.pavimento_terreo?.cozinha?.tem_copa && (
                          <div className="space-y-2">
                            <Label>Área Copa (m²)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.detalhamento_pavimentos?.pavimento_terreo?.cozinha?.area_copa_m2 || 0}
                              onChange={(e) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  pavimento_terreo: {
                                    ...formData.detalhamento_pavimentos.pavimento_terreo,
                                    cozinha: { ...formData.detalhamento_pavimentos.pavimento_terreo.cozinha, area_copa_m2: parseFloat(e.target.value) || 0 }
                                  }
                                }
                              })}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Banheiros e Lavabo */}
                  <Card className="border-cyan-200">
                    <CardHeader className="bg-cyan-50">
                      <CardTitle className="text-sm">🚽 Banheiros e Lavabo</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Banheiros Sociais (não suítes)</Label>
                          <Input
                            type="number"
                            value={formData.detalhamento_pavimentos?.pavimento_terreo?.banheiros_sociais || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              detalhamento_pavimentos: {
                                ...formData.detalhamento_pavimentos,
                                pavimento_terreo: {
                                  ...formData.detalhamento_pavimentos.pavimento_terreo,
                                  banheiros_sociais: parseInt(e.target.value) || 0
                                }
                              }
                            })}
                          />
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={formData.detalhamento_pavimentos?.pavimento_terreo?.lavabo || false}
                              onCheckedChange={(checked) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  pavimento_terreo: {
                                    ...formData.detalhamento_pavimentos.pavimento_terreo,
                                    lavabo: checked
                                  }
                                }
                              })}
                            />
                            <span className="text-sm">Possui Lavabo</span>
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Outros Ambientes Térreo */}
                  <Card className="border-amber-200">
                    <CardHeader className="bg-amber-50">
                      <CardTitle className="text-sm">🏡 Outros Ambientes</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Área Gourmet */}
                      <div className="p-3 bg-white rounded-lg border">
                        <label className="flex items-center gap-2 cursor-pointer mb-3">
                          <Checkbox
                            checked={formData.detalhamento_pavimentos?.pavimento_terreo?.area_gourmet?.possui || false}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              detalhamento_pavimentos: {
                                ...formData.detalhamento_pavimentos,
                                pavimento_terreo: {
                                  ...formData.detalhamento_pavimentos.pavimento_terreo,
                                  area_gourmet: { ...formData.detalhamento_pavimentos.pavimento_terreo.area_gourmet, possui: checked }
                                }
                              }
                            })}
                          />
                          <span className="font-semibold">Área Gourmet</span>
                        </label>
                        {formData.detalhamento_pavimentos?.pavimento_terreo?.area_gourmet?.possui && (
                          <div className="grid md:grid-cols-3 gap-3 pl-6">
                            <div className="space-y-2">
                              <Label className="text-xs">Área (m²)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={formData.detalhamento_pavimentos?.pavimento_terreo?.area_gourmet?.area_m2 || 0}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  detalhamento_pavimentos: {
                                    ...formData.detalhamento_pavimentos,
                                    pavimento_terreo: {
                                      ...formData.detalhamento_pavimentos.pavimento_terreo,
                                      area_gourmet: { ...formData.detalhamento_pavimentos.pavimento_terreo.area_gourmet, area_m2: parseFloat(e.target.value) || 0 }
                                    }
                                  }
                                })}
                              />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={formData.detalhamento_pavimentos?.pavimento_terreo?.area_gourmet?.tem_churrasqueira || false}
                                onCheckedChange={(checked) => setFormData({
                                  ...formData,
                                  detalhamento_pavimentos: {
                                    ...formData.detalhamento_pavimentos,
                                    pavimento_terreo: {
                                      ...formData.detalhamento_pavimentos.pavimento_terreo,
                                      area_gourmet: { ...formData.detalhamento_pavimentos.pavimento_terreo.area_gourmet, tem_churrasqueira: checked }
                                    }
                                  }
                                })}
                              />
                              <span className="text-sm">Churrasqueira</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={formData.detalhamento_pavimentos?.pavimento_terreo?.area_gourmet?.tem_forno_pizza || false}
                                onCheckedChange={(checked) => setFormData({
                                  ...formData,
                                  detalhamento_pavimentos: {
                                    ...formData.detalhamento_pavimentos,
                                    pavimento_terreo: {
                                      ...formData.detalhamento_pavimentos.pavimento_terreo,
                                      area_gourmet: { ...formData.detalhamento_pavimentos.pavimento_terreo.area_gourmet, tem_forno_pizza: checked }
                                    }
                                  }
                                })}
                              />
                              <span className="text-sm">Forno Pizza</span>
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Escritório, Despensa, Área de Serviço */}
                      <div className="grid md:grid-cols-3 gap-3">
                        {/* Escritório */}
                        <div className="p-3 bg-white rounded-lg border">
                          <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <Checkbox
                              checked={formData.detalhamento_pavimentos?.pavimento_terreo?.escritorio?.possui || false}
                              onCheckedChange={(checked) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  pavimento_terreo: {
                                    ...formData.detalhamento_pavimentos.pavimento_terreo,
                                    escritorio: { ...formData.detalhamento_pavimentos.pavimento_terreo.escritorio, possui: checked }
                                  }
                                }
                              })}
                            />
                            <span className="text-sm font-semibold">Escritório</span>
                          </label>
                          {formData.detalhamento_pavimentos?.pavimento_terreo?.escritorio?.possui && (
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Área (m²)"
                              value={formData.detalhamento_pavimentos?.pavimento_terreo?.escritorio?.area_m2 || 0}
                              onChange={(e) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  pavimento_terreo: {
                                    ...formData.detalhamento_pavimentos.pavimento_terreo,
                                    escritorio: { ...formData.detalhamento_pavimentos.pavimento_terreo.escritorio, area_m2: parseFloat(e.target.value) || 0 }
                                  }
                                }
                              })}
                            />
                          )}
                        </div>

                        {/* Despensa */}
                        <div className="p-3 bg-white rounded-lg border">
                          <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <Checkbox
                              checked={formData.detalhamento_pavimentos?.pavimento_terreo?.despensa?.possui || false}
                              onCheckedChange={(checked) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  pavimento_terreo: {
                                    ...formData.detalhamento_pavimentos.pavimento_terreo,
                                    despensa: { ...formData.detalhamento_pavimentos.pavimento_terreo.despensa, possui: checked }
                                  }
                                }
                              })}
                            />
                            <span className="text-sm font-semibold">Despensa</span>
                          </label>
                          {formData.detalhamento_pavimentos?.pavimento_terreo?.despensa?.possui && (
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Área (m²)"
                              value={formData.detalhamento_pavimentos?.pavimento_terreo?.despensa?.area_m2 || 0}
                              onChange={(e) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  pavimento_terreo: {
                                    ...formData.detalhamento_pavimentos.pavimento_terreo,
                                    despensa: { ...formData.detalhamento_pavimentos.pavimento_terreo.despensa, area_m2: parseFloat(e.target.value) || 0 }
                                  }
                                }
                              })}
                            />
                          )}
                        </div>

                        {/* Área de Serviço */}
                        <div className="p-3 bg-white rounded-lg border">
                          <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <Checkbox
                              checked={formData.detalhamento_pavimentos?.pavimento_terreo?.area_servico?.possui || false}
                              onCheckedChange={(checked) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  pavimento_terreo: {
                                    ...formData.detalhamento_pavimentos.pavimento_terreo,
                                    area_servico: { ...formData.detalhamento_pavimentos.pavimento_terreo.area_servico, possui: checked }
                                  }
                                }
                              })}
                            />
                            <span className="text-sm font-semibold">Área Serviço</span>
                          </label>
                          {formData.detalhamento_pavimentos?.pavimento_terreo?.area_servico?.possui && (
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Área (m²)"
                              value={formData.detalhamento_pavimentos?.pavimento_terreo?.area_servico?.area_m2 || 0}
                              onChange={(e) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  pavimento_terreo: {
                                    ...formData.detalhamento_pavimentos.pavimento_terreo,
                                    area_servico: { ...formData.detalhamento_pavimentos.pavimento_terreo.area_servico, area_m2: parseFloat(e.target.value) || 0 }
                                  }
                                }
                              })}
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* PAVIMENTO SUPERIOR */}
                <TabsContent value="superior" className="space-y-6 mt-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.detalhamento_pavimentos?.pavimento_superior?.possui || false}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          detalhamento_pavimentos: {
                            ...formData.detalhamento_pavimentos,
                            pavimento_superior: { ...formData.detalhamento_pavimentos.pavimento_superior, possui: checked }
                          }
                        })}
                      />
                      <span className="font-semibold">Possui Segundo Pavimento</span>
                    </label>
                  </div>

                  {formData.detalhamento_pavimentos?.pavimento_superior?.possui && (
                    <>
                      {/* Quartos Superior */}
                      <Card className="border-blue-200">
                        <CardHeader className="bg-blue-50">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">🛏️ Quartos no Superior</CardTitle>
                            <Button type="button" size="sm" onClick={() => addQuarto('superior')}>
                              <Plus className="w-3 h-3 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                          {formData.detalhamento_pavimentos?.pavimento_superior?.quartos?.map((quarto, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-lg border relative">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 right-2 text-red-500 hover:bg-red-100"
                                onClick={() => removeQuarto('superior', idx)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                              <div className="grid md:grid-cols-2 gap-4 mb-3">
                                <div className="space-y-2">
                                  <Label>Nome do Quarto</Label>
                                  <Input
                                    value={quarto.nome || ""}
                                    onChange={(e) => updateQuarto('superior', idx, 'nome', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Área (m²)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={quarto.area_m2 || 0}
                                    onChange={(e) => updateQuarto('superior', idx, 'area_m2', parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={quarto.eh_suite || false}
                                    onCheckedChange={(checked) => updateQuarto('superior', idx, 'eh_suite', checked)}
                                  />
                                  <span className="text-sm">É Suíte</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={quarto.tem_closet || false}
                                    onCheckedChange={(checked) => updateQuarto('superior', idx, 'tem_closet', checked)}
                                  />
                                  <span className="text-sm">Tem Closet</span>
                                &nbsp;
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={quarto.tem_sacada || false}
                                    onCheckedChange={(checked) => updateQuarto('superior', idx, 'tem_sacada', checked)}
                                  />
                                  <span className="text-sm">Tem Sacada</span>
                                </label>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Salas Superior */}
                      <Card className="border-purple-200">
                        <CardHeader className="bg-purple-50">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">🪑 Salas no Superior</CardTitle>
                            <Button type="button" size="sm" onClick={() => addSala('superior')}>
                              <Plus className="w-3 h-3 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                          {formData.detalhamento_pavimentos?.pavimento_superior?.salas?.map((sala, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-lg border relative">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 right-2 text-red-500 hover:bg-red-100"
                                onClick={() => removeSala('superior', idx)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Tipo</Label>
                                  <Select
                                    value={sala.tipo || "estar"}
                                    onValueChange={(val) => updateSala('superior', idx, 'tipo', val)}
                                  >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="estar">Estar</SelectItem>
                                      <SelectItem value="tv">TV</SelectItem>
                                      <SelectItem value="jogos">Jogos</SelectItem>
                                      <SelectItem value="home_theater">Home Theater</SelectItem>
                                      <SelectItem value="biblioteca">Biblioteca</SelectItem>
                                      <SelectItem value="sala_estudo">Sala de Estudo</SelectItem>
                                      <SelectItem value="outros">Outros</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Área (m²)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={sala.area_m2 || 0}
                                    onChange={(e) => updateSala('superior', idx, 'area_m2', parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>

                {/* SUBSOLO */}
                <TabsContent value="subsolo" className="space-y-6 mt-4">
                  <div className="p-4 bg-gray-50 rounded-lg border mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.detalhamento_pavimentos?.pavimento_subsolo?.possui || false}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          detalhamento_pavimentos: {
                            ...formData.detalhamento_pavimentos,
                            pavimento_subsolo: { ...formData.detalhamento_pavimentos.pavimento_subsolo, possui: checked }
                          }
                        })}
                      />
                      <span className="font-semibold">Possui Subsolo</span>
                    </label>
                  </div>

                  {formData.detalhamento_pavimentos?.pavimento_subsolo?.possui && (
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Vagas de Garagem no Subsolo</Label>
                            <Input
                              type="number"
                              value={formData.detalhamento_pavimentos?.pavimento_subsolo?.garagem_quantidade_vagas || 0}
                              onChange={(e) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  pavimento_subsolo: { ...formData.detalhamento_pavimentos.pavimento_subsolo, garagem_quantidade_vagas: parseInt(e.target.value) || 0 }
                                }
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Área Total Subsolo (m²)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.detalhamento_pavimentos?.pavimento_subsolo?.area_m2 || 0}
                              onChange={(e) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  pavimento_subsolo: { ...formData.detalhamento_pavimentos.pavimento_subsolo, area_m2: parseFloat(e.target.value) || 0 }
                                }
                              })}
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-4 gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={formData.detalhamento_pavimentos?.pavimento_subsolo?.adega || false}
                              onCheckedChange={(checked) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  pavimento_subsolo: { ...formData.detalhamento_pavimentos.pavimento_subsolo, adega: checked }
                                }
                              })}
                            />
                            <span className="text-sm">Adega</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={formData.detalhamento_pavimentos?.pavimento_subsolo?.deposito || false}
                              onCheckedChange={(checked) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  pavimento_subsolo: { ...formData.detalhamento_pavimentos.pavimento_subsolo, deposito: checked }
                                }
                              })}
                            />
                            <span className="text-sm">Depósito</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={formData.detalhamento_pavimentos?.pavimento_subsolo?.sala_jogos || false}
                              onCheckedChange={(checked) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  pavimento_subsolo: { ...formData.detalhamento_pavimentos.pavimento_subsolo, sala_jogos: checked }
                                }
                              })}
                            />
                            <span className="text-sm">Sala Jogos</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={formData.detalhamento_pavimentos?.pavimento_subsolo?.home_theater || false}
                              onCheckedChange={(checked) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  pavimento_subsolo: { ...formData.detalhamento_pavimentos.pavimento_subsolo, home_theater: checked }
                                }
                              })}
                            />
                            <span className="text-sm">Home Theater</span>
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* ÁREAS EXTERNAS */}
                <TabsContent value="externas" className="space-y-6 mt-4">
                  {/* Piscina */}
                  <Card className="border-blue-200">
                    <CardHeader className="bg-blue-50">
                      <CardTitle className="text-sm">🏊 Piscina</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={formData.detalhamento_pavimentos?.areas_externas?.piscina?.possui || false}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            detalhamento_pavimentos: {
                              ...formData.detalhamento_pavimentos,
                              areas_externas: {
                                ...formData.detalhamento_pavimentos.areas_externas,
                                piscina: { ...formData.detalhamento_pavimentos.areas_externas.piscina, possui: checked }
                              }
                            }
                          })}
                        />
                        <span className="font-semibold">Possui Piscina</span>
                      </label>

                      {formData.detalhamento_pavimentos?.areas_externas?.piscina?.possui && (
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                              value={formData.detalhamento_pavimentos?.areas_externas?.piscina?.tipo || "vinil"}
                              onValueChange={(val) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  areas_externas: {
                                    ...formData.detalhamento_pavimentos.areas_externas,
                                    piscina: { ...formData.detalhamento_pavimentos.areas_externas.piscina, tipo: val }
                                  }
                                }
                              })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="vinil">Vinil</SelectItem>
                                <SelectItem value="fibra">Fibra</SelectItem>
                                <SelectItem value="alvenaria">Alvenaria</SelectItem>
                                <SelectItem value="infinity">Infinity</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Tamanho (m²)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.detalhamento_pavimentos?.areas_externas?.piscina?.tamanho_m2 || 0}
                              onChange={(e) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  areas_externas: {
                                    ...formData.detalhamento_pavimentos.areas_externas,
                                    piscina: { ...formData.detalhamento_pavimentos.areas_externas.piscina, tamanho_m2: parseFloat(e.target.value) || 0 }
                                  }
                                }
                              })}
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={formData.detalhamento_pavimentos?.areas_externas?.piscina?.aquecida || false}
                                onCheckedChange={(checked) => setFormData({
                                  ...formData,
                                  detalhamento_pavimentos: {
                                    ...formData.detalhamento_pavimentos,
                                    areas_externas: {
                                      ...formData.detalhamento_pavimentos.areas_externas,
                                      piscina: { ...formData.detalhamento_pavimentos.areas_externas.piscina, aquecida: checked }
                                    }
                                  }
                                })}
                              />
                              <span className="text-sm">Aquecida</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Jardim */}
                  <Card className="border-green-200">
                    <CardHeader className="bg-green-50">
                      <CardTitle className="text-sm">🌿 Jardim</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={formData.detalhamento_pavimentos?.areas_externas?.jardim?.possui || false}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            detalhamento_pavimentos: {
                              ...formData.detalhamento_pavimentos,
                              areas_externas: {
                                ...formData.detalhamento_pavimentos.areas_externas,
                                jardim: { ...formData.detalhamento_pavimentos.areas_externas.jardim, possui: checked }
                              }
                            }
                          })}
                        />
                        <span className="font-semibold">Possui Jardim</span>
                      </label>

                      {formData.detalhamento_pavimentos?.areas_externas?.jardim?.possui && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Área (m²)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.detalhamento_pavimentos?.areas_externas?.jardim?.area_m2 || 0}
                              onChange={(e) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  areas_externas: {
                                    ...formData.detalhamento_pavimentos.areas_externas,
                                    jardim: { ...formData.detalhamento_pavimentos.areas_externas.jardim, area_m2: parseFloat(e.target.value) || 0 }
                                  }
                                }
                              })}
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={formData.detalhamento_pavimentos?.areas_externas?.jardim?.tem_irrigacao || false}
                                onCheckedChange={(checked) => setFormData({
                                  ...formData,
                                  detalhamento_pavimentos: {
                                    ...formData.detalhamento_pavimentos,
                                    areas_externas: {
                                      ...formData.detalhamento_pavimentos.areas_externas,
                                      jardim: { ...formData.detalhamento_pavimentos.areas_externas.jardim, tem_irrigacao: checked }
                                    }
                                  }
                                })}
                              />
                              <span className="text-sm">Irrigação Automática</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Deck */}
                  <Card className="border-amber-200">
                    <CardHeader className="bg-amber-50">
                      <CardTitle className="text-sm">🪵 Deck</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={formData.detalhamento_pavimentos?.areas_externas?.deck?.possui || false}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            detalhamento_pavimentos: {
                              ...formData.detalhamento_pavimentos,
                              areas_externas: {
                                ...formData.detalhamento_pavimentos.areas_externas,
                                deck: { ...formData.detalhamento_pavimentos.areas_externas.deck, possui: checked }
                              }
                            }
                          })}
                        />
                        <span className="font-semibold">Possui Deck</span>
                      </label>

                      {formData.detalhamento_pavimentos?.areas_externas?.deck?.possui && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Área (m²)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.detalhamento_pavimentos?.areas_externas?.deck?.area_m2 || 0}
                              onChange={(e) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  areas_externas: {
                                    ...formData.detalhamento_pavimentos.areas_externas,
                                    deck: { ...formData.detalhamento_pavimentos.areas_externas.deck, area_m2: parseFloat(e.target.value) || 0 }
                                  }
                                }
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Material</Label>
                            <Select
                              value={formData.detalhamento_pavimentos?.areas_externas?.deck?.material || "madeira"}
                              onValueChange={(val) => setFormData({
                                ...formData,
                                detalhamento_pavimentos: {
                                  ...formData.detalhamento_pavimentos,
                                  areas_externas: {
                                    ...formData.detalhamento_pavimentos.areas_externas,
                                    deck: { ...formData.detalhamento_pavimentos.areas_externas.deck, material: val }
                                  }
                                }
                              })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="madeira">Madeira</SelectItem>
                                <SelectItem value="composito">Compósito</SelectItem>
                                <SelectItem value="pedra">Pedra</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quintal */}
                  <Card className="border-lime-200">
                    <CardHeader className="bg-lime-50">
                      <CardTitle className="text-sm">🌱 Quintal</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={formData.detalhamento_pavimentos?.areas_externas?.quintal?.possui || false}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            detalhamento_pavimentos: {
                              ...formData.detalhamento_pavimentos,
                              areas_externas: {
                                ...formData.detalhamento_pavimentos.areas_externas,
                                quintal: { ...formData.detalhamento_pavimentos.areas_externas.quintal, possui: checked }
                              }
                            }
                          })}
                        />
                        <span className="font-semibold">Possui Quintal</span>
                      </label>

                      {formData.detalhamento_pavimentos?.areas_externas?.quintal?.possui && (
                        <div className="space-y-2">
                          <Label>Área (m²)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.detalhamento_pavimentos?.areas_externas?.quintal?.area_m2 || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              detalhamento_pavimentos: {
                                ...formData.detalhamento_pavimentos,
                                areas_externas: {
                                  ...formData.detalhamento_pavimentos.areas_externas,
                                  quintal: { ...formData.detalhamento_pavimentos.areas_externas.quintal, area_m2: parseFloat(e.target.value) || 0 }
                                }
                              }
                            })}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* ABA PROJETOS */}
            <TabsContent value="projetos" className="space-y-6 mt-4">
              <Card className="border-2 border-purple-200 bg-purple-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <FileText className="w-5 h-5" />
                    Projetos Arquitetônicos e de Engenharia
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    Faça upload dos projetos (PDF, DWG, imagens) para referência e documentação
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(tiposProjetoLabels).slice(0, 4).map(([tipo, label]) => (
                      <div key={tipo} className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-semibold">{label}</Label>
                          {formData.projetos_arquitetonicos?.find(p => p.tipo === tipo) && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                        </div>

                        <Input
                          type="file"
                          accept=".pdf,.dwg,.png,.jpg,.jpeg,.rvt,.skp"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleUploadProjeto(file, tipo);
                          }}
                          disabled={uploadingProjeto}
                          className="mb-2"
                        />

                        {formData.projetos_arquitetonicos?.filter(p => p.tipo === tipo).map((projeto, idx) => (
                          <div key={idx} className="mt-2 p-2 bg-white rounded border">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{projeto.nome}</p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoverProjeto(formData.projetos_arquitetonicos.indexOf(projeto))}
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA IMAGENS */}
            <TabsContent value="imagens" className="space-y-6 mt-4">
              {!item?.id ? (
                <div className="p-8 text-center bg-amber-50 rounded-lg border-2 border-dashed border-amber-300">
                  <Info className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                  <p className="text-amber-700 font-semibold">Salve a unidade primeiro</p>
                  <p className="text-sm text-amber-600 mt-1">
                    Para adicionar imagens, primeiro salve as informações básicas da unidade
                  </p>
                </div>
              ) : (
                <>
                  <ImageUploader
                    entidadeTipo="Unidade"
                    entidadeId={item?.id}
                    tiposPadrao={["principal", "galeria", "fachada", "planta", "documentacao", "outros"]}
                    onImageUploaded={() => { }}
                  />

                  <ImageGallery
                    entidadeTipo="Unidade"
                    entidadeId={item?.id}
                    allowDelete={true}
                  />
                </>
              )}
            </TabsContent>

            {/* NEW ABA PRECIFICAÇÃO */}
            <TabsContent value="precificacao" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_lote">Valor do Lote (R$)</Label>
                  <InputCurrency
                    id="valor_lote"
                    value={formData.valor_lote}
                    onChange={(e) => setFormData({ ...formData, valor_lote: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_custo">Custo de Construção (R$)</Label>
                  <InputCurrency
                    id="valor_custo"
                    value={formData.valor_custo}
                    onChange={(e) => setFormData({ ...formData, valor_custo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_venda">Valor de Venda (R$)</Label>
                  <InputCurrency
                    id="valor_venda"
                    value={formData.valor_venda}
                    onChange={(e) => setFormData({ ...formData, valor_venda: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border mb-4 flex items-center gap-3">
                <Checkbox
                  id="disponivel_locacao"
                  checked={formData.disponivel_locacao}
                  onCheckedChange={(checked) => setFormData({ ...formData, disponivel_locacao: checked })}
                />
                <Label htmlFor="disponivel_locacao" className="font-semibold cursor-pointer">
                  Disponível para Locação
                </Label>
              </div>

              {formData.disponivel_locacao && (
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">Valores de Locação</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valor_aluguel">Valor do Aluguel (R$)</Label>
                      <InputCurrency
                        id="valor_aluguel"
                        value={formData.valor_aluguel}
                        onChange={(e) => setFormData({ ...formData, valor_aluguel: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor_condominio">Valor do Condomínio (R$)</Label>
                      <InputCurrency
                        id="valor_condominio"
                        value={formData.valor_condominio}
                        onChange={(e) => setFormData({ ...formData, valor_condominio: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor_iptu_mensal">IPTU Mensal (R$)</Label>
                      <InputCurrency
                        id="valor_iptu_mensal"
                        value={formData.valor_iptu_mensal}
                        onChange={(e) => setFormData({ ...formData, valor_iptu_mensal: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Botões de Ação */}
          <CardFooter className="flex justify-between gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
              Cancelar
            </Button>

            <div className="flex gap-3">
              {item && (
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={isProcessing}
                  variant="outline"
                  className="border-[var(--wine-600)] text-[var(--wine-600)] hover:bg-[var(--wine-50)]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Atualizar
                    </>
                  )}
                </Button>
              )}

              <Button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isProcessing}
                className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {item ? "Concluir" : "Criar e Concluir"}
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Dialog para selecionar lote */}
      <Dialog open={mostrarSelecionarLote} onOpenChange={setMostrarSelecionarLote}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Selecionar Lote para Importar Dados</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {!formData.loteamento_id && (
              <div className="text-center py-8">
                <Info className="w-12 h-12 mx-auto text-amber-500 mb-3" />
                <p className="text-amber-700">Selecione um loteamento na aba "Básico" para ver os lotes disponíveis.</p>
              </div>
            )}
            {formData.loteamento_id && lotes.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Nenhum lote encontrado neste loteamento para importação.</p>
              </div>
            ) : (
              lotes.map((lote) => (
                <Card
                  key={lote.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-[var(--wine-600)]"
                  onClick={() => handleImportarDadosLote(lote)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{lote.codigo}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Ruler className="w-4 h-4" />
                            {lote.area_total} m²
                          </span>
                          {lote.endereco && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {lote.endereco.substring(0, 30)}...
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-[var(--wine-600)]"
                      >
                        Importar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SearchLoteamentoDialog
        open={showLoteamentoSearch}
        onClose={() => setShowLoteamentoSearch(false)}
        loteamentos={loteamentos}
        onSelect={(loteamento) => {
          setFormData({ ...formData, loteamento_id: loteamento.id });
          setShowLoteamentoSearch(false);
        }}
      />
    </>
  );
}
