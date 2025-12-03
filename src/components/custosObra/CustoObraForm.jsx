import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Save, X, Sparkles, Calculator, Plus, Trash2,
  Search, TrendingUp, Package, Edit, DollarSign, Loader2, Home, Building2, Waves,
  FileText, User, Check, Eye
} from "lucide-react";
import { toast } from "sonner";

import PesquisarPrecoDialog from "./PesquisarPrecoDialog";
import SugestoesIADialog from "./SugestoesIADialog";
import BuscarProdutoWebDialog from "./BuscarProdutoWebDialog";

const ETAPAS = [
  { id: 'terreno_preparacao', nome: 'Preparação do Terreno', icon: '🚜' },
  { id: 'fundacao', nome: 'Fundação', icon: '🏗️' },
  { id: 'estrutura', nome: 'Estrutura', icon: '🏛️' },
  { id: 'impermeabilizacao', nome: 'Impermeabilização', icon: '💦' },
  { id: 'alvenaria', nome: 'Alvenaria', icon: '🧱' },
  { id: 'cobertura', nome: 'Cobertura', icon: '🏠' },
  { id: 'instalacoes_eletricas', nome: 'Instalações Elétricas', icon: '⚡' },
  { id: 'instalacoes_hidraulicas', nome: 'Instalações Hidráulicas', icon: '💧' },
  { id: 'instalacoes_gas', nome: 'Instalações de Gás', icon: '🔥' },
  { id: 'aquecimento_solar', nome: 'Aquecimento Solar', icon: '☀️' },
  { id: 'energia_solar', nome: 'Energia Solar', icon: '🔆' },
  { id: 'ar_condicionado', nome: 'Ar Condicionado', icon: '❄️' },
  { id: 'revestimentos', nome: 'Revestimentos', icon: '🎨' },
  { id: 'pintura', nome: 'Pintura', icon: '🖌️' },
  { id: 'esquadrias', nome: 'Esquadrias', icon: '🚪' },
  { id: 'pisos', nome: 'Pisos', icon: '◼️' },
  { id: 'forros', nome: 'Forros', icon: '⬜' },
  { id: 'acabamento', nome: 'Acabamento Geral', icon: '✨' },
  { id: 'louca_metais', nome: 'Louças e Metais', icon: '🚿' },
  { id: 'mobilia', nome: 'Mobília', icon: '🛋️' },
  { id: 'automacao', nome: 'Automação', icon: '🤖' },
  { id: 'seguranca', nome: 'Segurança', icon: '🔒' },
  { id: 'wifi_dados', nome: 'WiFi e Rede', icon: '📡' },
  { id: 'paisagismo', nome: 'Paisagismo', icon: '🌳' },
  { id: 'limpeza_final', nome: 'Limpeza Final', icon: '🧹' },
];

const PADROES = {
  economico: { nome: 'Econômico', descricao: 'Materiais básicos', cor: '#6b7280', multiplicador: 0.5 },
  medio_baixo: { nome: 'Médio/Baixo', descricao: 'Materiais econômicos e funcionais', cor: '#10b981', multiplicador: 0.7 },
  medio: { nome: 'Médio', descricao: 'Materiais de boa qualidade', cor: '#3b82f6', multiplicador: 1.0 },
  medio_alto: { nome: 'Médio/Alto', descricao: 'Materiais de qualidade superior', cor: '#f59e0b', multiplicador: 1.3 },
  alto: { nome: 'Alto', descricao: 'Materiais premium', cor: '#ef4444', multiplicador: 1.5 },
  luxo: { nome: 'Luxo', descricao: 'Materiais de altíssima qualidade', cor: '#8b5cf6', multiplicador: 2.5 },
};

const deveSerInteiro = (unidadeMedida) => {
  const unidadesInteiras = ['unidade', 'conjunto', 'saco', 'balde', 'lata', 'galao', 'rolo', 'barra', 'caixa', 'm2', 'm3', 'm', 'kg', 'diaria', 'hora', 'servico', 'ponto'];
  return unidadesInteiras.includes(unidadeMedida);
};

export default function CustoObraForm({ item, intencaoCompra: intencaoPreCarregada, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState({
    intencao_compra_id: '',
    nome: '',
    padrao_obra: 'medio',
    area_total: 0,
    quantidade_pavimentos: 1,
    tem_laje: false,
    tipo_laje: 'nenhuma',
    pe_direito: 2.8,
    tipo_fundacao: 'radier',
    tipo_estrutura: 'concreto_armado',
    incluir_mobilia: false,
    incluir_automacao: false,
    incluir_wifi_dados: false,
    incluir_aquecimento_solar: false,
    incluir_ar_condicionado: false,
    incluir_energia_solar: false,
    incluir_sistema_seguranca: false,
    incluir_paisagismo: false,
    observacoes: '',
    detalhamento_projeto: {
      quartos: 0,
      suites: 0,
      banheiros: 0,
      lavabos: 0,
      salas_estar: 0,
      salas_jantar: 0,
      salas_tv: 0,
      cozinha_tipo: 'americana',
      area_gourmet: false,
      churrasqueira: false,
      escritorio: false,
      despensa: false,
      area_servico: false,
      lavanderia: false,
      quarto_empregada: false,
      varanda: false,
      varanda_gourmet: false,
      jardim_inverno: false,
      closet_master: false,
      banheira: false,
      edicola: false,
      garagem_vagas: 0,
      garagem_coberta: true,
      piscina: false,
      piscina_tipo: 'vinil',
      piscina_tamanho_m2: 0,
      jardim: false,
      jardim_area_m2: 0,
      deck: false,
      deck_area_m2: 0,
      // Cores e acabamentos
      tipo_telhado: '',
      tipo_piso_interno: '',
      tipo_piso_externo: '',
      tipo_revestimento_parede: '',
      preferencias_cores: {},
    }
  });

  const [intencaoSelecionada, setIntencaoSelecionada] = useState(null);
  const [showSearchIntencao, setShowSearchIntencao] = useState(false);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPesquisaPreco, setShowPesquisaPreco] = useState(false);
  const [itemPesquisa, setItemPesquisa] = useState(null);
  const [showAdicionarManual, setShowAdicionarManual] = useState(false);
  const [showSugestoesIA, setShowSugestoesIA] = useState(false);
  const [etapaSugestaoIA, setEtapaSugestaoIA] = useState('');
  const [showBuscarProdutoWeb, setShowBuscarProdutoWeb] = useState(false);
  const [novoItemManual, setNovoItemManual] = useState({
    etapa: 'fundacao',
    categoria: 'material',
    descricao: '',
    unidade_medida: 'unidade',
    quantidade_total: 1,
    valor_unitario: 0,
    fornecedor_id: '',
  });
  const [pesquisandoPrecos, setPesquisandoPrecos] = useState(false);
  const [estadoPesquisa, setEstadoPesquisa] = useState('SP');
  const [valorTotalPrevia, setValorTotalPrevia] = useState(0);

  const queryClient = useQueryClient();

  // Buscar intenções de compra
  const { data: intencoesCompra = [] } = useQuery({
    queryKey: ['intencoes_compra_aprovadas'],
    queryFn: async () => {
      try {
        // Buscar intenções aprovadas ou aguardando custo
        return await base44.entities.IntencaoCompra.filter({
          status: { $in: ['aprovado', 'aguardando_reuniao'] }
        });
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
    initialData: [],
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
    initialData: [],
  });

  const { data: materiaisPadrao = [] } = useQuery({
    queryKey: ['materiais_padrao'],
    queryFn: async () => {
      try {
        return await base44.entities.MaterialPadrao.filter({ ativo: true });
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      try {
        return await base44.entities.Fornecedor.list();
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  // Carregar item existente
  useEffect(() => {
    if (item?.id) {
      setFormData(item);
      const loadItens = async () => {
        try {
          const itensCarregados = await base44.entities.ItemCustoObra.filter({ custo_obra_id: item.id });
          setItens(itensCarregados || []);
          setValorTotalPrevia((itensCarregados || []).reduce((sum, i) => sum + (i.valor_total || 0), 0));
        } catch (error) {
          console.error('Erro ao carregar itens:', error);
        }
      };
      loadItens();

      // Carregar intenção vinculada
      if (item.intencao_compra_id) {
        base44.entities.IntencaoCompra.get(item.intencao_compra_id).then(setIntencaoSelecionada).catch(console.error);
      }
    }
  }, [item]);

  // Pré-carregar intenção de compra passada como prop
  useEffect(() => {
    if (intencaoPreCarregada && !item) {
      carregarDadosIntencao(intencaoPreCarregada);
    }
  }, [intencaoPreCarregada, item]);

  // Função para carregar dados da intenção de compra no formulário
  const carregarDadosIntencao = (intencao) => {
    setIntencaoSelecionada(intencao);
    const cliente = clientes.find(c => c.id === intencao.cliente_id);
    const loteamento = loteamentos.find(l => l.id === intencao.loteamento_id);

    setFormData(prev => ({
      ...prev,
      intencao_compra_id: intencao.id,
      nome: `Custo de Obra - ${cliente?.nome || 'Cliente'} - ${loteamento?.nome || 'Loteamento'}`,
      padrao_obra: intencao.padrao_imovel || 'medio',
      area_total: intencao.area_construida_desejada || 0,
      quantidade_pavimentos: intencao.quantidade_pavimentos || 1,
      // Opcionais da intenção
      incluir_mobilia: intencao.adicionais?.mobilia_planejada || intencao.adicionais?.moveis_cozinha || intencao.adicionais?.moveis_banheiro || false,
      incluir_automacao: intencao.adicionais?.automacao_residencial || false,
      incluir_wifi_dados: intencao.adicionais?.wifi_estruturado || false,
      incluir_aquecimento_solar: intencao.adicionais?.aquecimento_solar || false,
      incluir_ar_condicionado: intencao.adicionais?.ar_condicionado || false,
      incluir_energia_solar: intencao.adicionais?.energia_solar || false,
      incluir_sistema_seguranca: intencao.adicionais?.sistema_seguranca || intencao.adicionais?.cameras || intencao.adicionais?.alarme || intencao.adicionais?.cerca_eletrica || false,
      incluir_paisagismo: intencao.adicionais?.jardim_paisagismo || intencao.adicionais?.iluminacao_jardim || false,
      // Detalhamento do projeto vindo da intenção
      detalhamento_projeto: {
        quartos: intencao.quantidade_quartos || 0,
        suites: intencao.quantidade_suites || 0,
        banheiros: intencao.quantidade_banheiros || 0,
        lavabos: intencao.quantidade_lavabos || 0,
        salas_estar: intencao.comodos?.sala_estar ? 1 : 0,
        salas_jantar: intencao.comodos?.sala_jantar ? 1 : 0,
        salas_tv: intencao.comodos?.sala_tv ? 1 : 0,
        cozinha_tipo: intencao.comodos?.cozinha_americana ? 'americana' : 'tradicional',
        area_gourmet: intencao.comodos?.area_gourmet || false,
        churrasqueira: intencao.comodos?.churrasqueira || false,
        escritorio: intencao.comodos?.escritorio || intencao.comodos?.home_office || false,
        despensa: intencao.comodos?.despensa || false,
        area_servico: intencao.comodos?.area_servico || false,
        lavanderia: intencao.comodos?.lavanderia || false,
        quarto_empregada: intencao.comodos?.quarto_empregada || false,
        varanda: intencao.comodos?.varanda || false,
        varanda_gourmet: intencao.comodos?.varanda_gourmet || false,
        jardim_inverno: intencao.comodos?.jardim_inverno || false,
        closet_master: intencao.comodos?.closet_master || false,
        banheira: intencao.comodos?.banheira || false,
        edicola: intencao.comodos?.edicola || false,
        garagem_vagas: intencao.vagas_garagem || 0,
        garagem_coberta: intencao.garagem_coberta !== false,
        piscina: intencao.comodos?.piscina || false,
        jardim: intencao.adicionais?.jardim_paisagismo || false,
        // Acabamentos
        tipo_telhado: intencao.tipo_telhado || '',
        tipo_piso_interno: intencao.tipo_piso_interno || '',
        tipo_piso_externo: intencao.tipo_piso_externo || '',
        tipo_revestimento_parede: intencao.tipo_revestimento_parede || '',
        preferencias_cores: intencao.preferencias_cores || {},
      },
      observacoes: `Importado da Intenção de Compra\n\nDetalhes específicos do cliente: ${intencao.detalhes_especificos || 'Nenhum'}\n\nOrçamento: R$ ${(intencao.orcamento_minimo || 0).toLocaleString('pt-BR')} a R$ ${(intencao.orcamento_maximo || 0).toLocaleString('pt-BR')}`,
    }));

    toast.success('Dados da Intenção de Compra importados!');
  };

  const gerarItensPadrao = async () => {
    if (!formData.area_total || formData.area_total <= 0) {
      toast.error('Informe a área total primeiro');
      return;
    }

    setLoading(true);

    try {
      const det = formData.detalhamento_projeto;
      const totalQuartos = (det.quartos || 0) + (det.suites || 0);
      const totalBanheiros = (det.banheiros || 0) + (det.suites || 0) + (det.lavabos || 0);

      toast.info('🤖 IA calculando quantidades conforme projeto...', { duration: 3000 });

      // Construir prompt detalhado com todos os dados da intenção
      const promptDetalhado = `Você é um engenheiro civil especialista em orçamento de obras brasileiras.

REGRAS BRASIL:
- TODAS as quantidades devem ser INTEIRAS (m², m³, sacos, diárias, horas)
- No Brasil NÃO vendemos 2.5m², nem 1.7m³, nem 3.4 diárias
- Arredondar SEMPRE para cima (teto)

DADOS DA OBRA:
- Área Total: ${formData.area_total}m²
- Pavimentos: ${formData.quantidade_pavimentos}
- Padrão: ${PADROES[formData.padrao_obra]?.nome || formData.padrao_obra}
- Tem Laje: ${formData.tem_laje ? 'SIM' : 'NÃO'}
- Tipo Laje: ${formData.tem_laje ? formData.tipo_laje : 'não aplicável'}
- Pé Direito: ${formData.pe_direito}m
- Fundação: ${formData.tipo_fundacao}
- Estrutura: ${formData.tipo_estrutura}

CÔMODOS DETALHADOS (da Intenção de Compra):
- Quartos: ${det.quartos || 0}
- Suítes: ${det.suites || 0}
- Banheiros: ${det.banheiros || 0}
- Lavabos: ${det.lavabos || 0}
- Salas de Estar: ${det.salas_estar || 0}
- Salas de Jantar: ${det.salas_jantar || 0}
- Salas de TV: ${det.salas_tv || 0}
- Cozinha: ${det.cozinha_tipo}
- Área Gourmet: ${det.area_gourmet ? 'SIM' : 'NÃO'}
- Churrasqueira: ${det.churrasqueira ? 'SIM' : 'NÃO'}
- Escritório: ${det.escritorio ? 'SIM' : 'NÃO'}
- Despensa: ${det.despensa ? 'SIM' : 'NÃO'}
- Área de Serviço: ${det.area_servico ? 'SIM' : 'NÃO'}
- Lavanderia: ${det.lavanderia ? 'SIM' : 'NÃO'}
- Quarto de Empregada: ${det.quarto_empregada ? 'SIM' : 'NÃO'}
- Varanda: ${det.varanda ? 'SIM' : 'NÃO'}
- Varanda Gourmet: ${det.varanda_gourmet ? 'SIM' : 'NÃO'}
- Jardim de Inverno: ${det.jardim_inverno ? 'SIM' : 'NÃO'}
- Closet Master: ${det.closet_master ? 'SIM' : 'NÃO'}
- Banheira: ${det.banheira ? 'SIM' : 'NÃO'}
- Edícula: ${det.edicola ? 'SIM' : 'NÃO'}
- Garagem: ${det.garagem_vagas || 0} vagas ${det.garagem_coberta ? '(coberta)' : '(descoberta)'}
- Piscina: ${det.piscina ? 'SIM' : 'NÃO'}
- Jardim/Paisagismo: ${det.jardim ? 'SIM' : 'NÃO'}

ACABAMENTOS ESPECIFICADOS:
- Tipo de Telhado: ${det.tipo_telhado || 'A definir'}
- Piso Interno: ${det.tipo_piso_interno || 'A definir'}
- Piso Externo: ${det.tipo_piso_externo || 'A definir'}
- Revestimento Parede: ${det.tipo_revestimento_parede || 'A definir'}

OPCIONAIS INCLUÍDOS:
- Mobília: ${formData.incluir_mobilia ? 'SIM' : 'NÃO'}
- Automação: ${formData.incluir_automacao ? 'SIM' : 'NÃO'}
- WiFi/Dados: ${formData.incluir_wifi_dados ? 'SIM' : 'NÃO'}
- Aquecimento Solar: ${formData.incluir_aquecimento_solar ? 'SIM' : 'NÃO'}
- Ar Condicionado: ${formData.incluir_ar_condicionado ? 'SIM' : 'NÃO'}
- Energia Solar: ${formData.incluir_energia_solar ? 'SIM' : 'NÃO'}
- Sistema Segurança: ${formData.incluir_sistema_seguranca ? 'SIM' : 'NÃO'}
- Paisagismo: ${formData.incluir_paisagismo ? 'SIM' : 'NÃO'}

Calcule os multiplicadores e quantidades para esta obra:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: promptDetalhado,
        response_json_schema: {
          type: "object",
          properties: {
            fundacao_multiplicador: { type: "number" },
            estrutura_multiplicador: { type: "number" },
            laje_concreto_kg_m2: { type: "number" },
            laje_aco_kg_m2: { type: "number" },
            instalacoes_eletricas_total_pontos: { type: "number" },
            instalacoes_hidraulicas_total_pontos: { type: "number" },
            revestimentos_area_paredes_m2: { type: "number" },
            pintura_area_total_m2: { type: "number" },
            cobertura_multiplicador: { type: "number" },
            portas_internas_quantidade: { type: "number" },
            janelas_quantidade: { type: "number" },
            boxes_banheiro_quantidade: { type: "number" },
            observacoes: { type: "string" }
          }
        }
      });

      const ajustesIA = response;
      const padraoSelecionado = formData.padrao_obra;
      const novosItens = [];
      let valorTotalEstimado = 0;

      let materiaisFiltrados = (materiaisPadrao || []).filter(mat => {
        if (mat.etapa === 'mobilia' && !formData.incluir_mobilia) return false;
        if (mat.etapa === 'automacao' && !formData.incluir_automacao) return false;
        if (mat.etapa === 'wifi_dados' && !formData.incluir_wifi_dados) return false;
        if (mat.etapa === 'aquecimento_solar' && !formData.incluir_aquecimento_solar) return false;
        if (mat.etapa === 'ar_condicionado' && !formData.incluir_ar_condicionado) return false;
        if (mat.etapa === 'energia_solar' && !formData.incluir_energia_solar) return false;
        if (mat.etapa === 'seguranca' && !formData.incluir_sistema_seguranca) return false;
        if (mat.etapa === 'paisagismo' && !formData.incluir_paisagismo) return false;
        return true;
      });

      (materiaisFiltrados || []).forEach(material => {
        let quantidadePorM2 = material[`quantidade_por_m2_${padraoSelecionado}`] || material.quantidade_por_m2_medio || 0;

        if (material.etapa === 'fundacao') {
          quantidadePorM2 *= (ajustesIA.fundacao_multiplicador || 1);
        } else if (material.etapa === 'estrutura' && !formData.tem_laje) {
          quantidadePorM2 *= (ajustesIA.estrutura_multiplicador || 0.6);
        } else if (material.etapa === 'instalacoes_eletricas') {
          if (ajustesIA.instalacoes_eletricas_total_pontos) {
            quantidadePorM2 = material.unidade_medida === 'unidade' || material.unidade_medida === 'ponto'
              ? ajustesIA.instalacoes_eletricas_total_pontos / formData.area_total
              : quantidadePorM2 * 0.3;
          }
        } else if (material.etapa === 'instalacoes_hidraulicas') {
          if (ajustesIA.instalacoes_hidraulicas_total_pontos) {
            quantidadePorM2 = material.unidade_medida === 'unidade' || material.unidade_medida === 'ponto'
              ? ajustesIA.instalacoes_hidraulicas_total_pontos / formData.area_total
              : quantidadePorM2 * 0.4;
          }
        } else if (material.etapa === 'revestimentos' && ajustesIA.revestimentos_area_paredes_m2) {
          quantidadePorM2 = (ajustesIA.revestimentos_area_paredes_m2 / formData.area_total) * (material.quantidade_por_m2_medio || 1);
        } else if (material.etapa === 'pintura' && ajustesIA.pintura_area_total_m2) {
          quantidadePorM2 = (ajustesIA.pintura_area_total_m2 / formData.area_total) * (material.quantidade_por_m2_medio || 1);
        } else if (material.etapa === 'cobertura') {
          quantidadePorM2 *= (ajustesIA.cobertura_multiplicador || 1.3);
        }

        const descricao = material[`descricao_${padraoSelecionado}`] || material.nome;
        let quantidadeTotal = Math.ceil(quantidadePorM2 * formData.area_total);

        if (quantidadeTotal > 0) {
          const valorItem = quantidadeTotal * (material.valor_referencia_unitario || 0);
          valorTotalEstimado += valorItem;

          novosItens.push({
            etapa: material.etapa,
            categoria: material.etapa === 'mobilia' ? 'moveis' :
                       ['ar_condicionado', 'seguranca', 'wifi_dados', 'automacao'].includes(material.etapa) ? 'eletrodomesticos' :
                       material.categoria,
            descricao: descricao,
            unidade_medida: material.unidade_medida,
            quantidade_m2: quantidadePorM2,
            quantidade_total: quantidadeTotal,
            valor_unitario: material.valor_referencia_unitario || 0,
            valor_total: valorItem,
            eh_item_padrao: true,
          });
        }
      });

      // Se tem laje, adicionar materiais específicos
      if (formData.tem_laje && ajustesIA.laje_concreto_kg_m2 > 0) {
        const kgConcreto = Math.ceil(ajustesIA.laje_concreto_kg_m2 * formData.area_total);
        const valorConcreto = kgConcreto * 0.42;
        novosItens.push({
          etapa: 'estrutura',
          categoria: 'material',
          descricao: `Concreto para Laje ${formData.tipo_laje.replace('_', ' ')} - FCK 25MPa`,
          unidade_medida: 'kg',
          quantidade_m2: ajustesIA.laje_concreto_kg_m2,
          quantidade_total: kgConcreto,
          valor_unitario: 0.42,
          valor_total: valorConcreto,
          eh_item_padrao: true,
        });
        valorTotalEstimado += valorConcreto;

        const kgAco = Math.ceil(ajustesIA.laje_aco_kg_m2 * formData.area_total);
        const valorAco = kgAco * 6.8;
        novosItens.push({
          etapa: 'estrutura',
          categoria: 'material',
          descricao: `Aço CA-50 para Laje ${formData.tipo_laje.replace('_', ' ')}`,
          unidade_medida: 'kg',
          quantidade_m2: ajustesIA.laje_aco_kg_m2,
          quantidade_total: kgAco,
          valor_unitario: 6.8,
          valor_total: valorAco,
          eh_item_padrao: true,
        });
        valorTotalEstimado += valorAco;
      }

      setItens(novosItens);
      setValorTotalPrevia(valorTotalEstimado);
      setLoading(false);

      toast.success(`✅ ${novosItens.length} itens gerados!\n💰 Prévia: R$ ${valorTotalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, {
        duration: 5000,
      });

      const estado = prompt(`🤖 ${novosItens.length} itens gerados!\n\n💰 PRÉVIA: R$ ${valorTotalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nDigite o estado (SP, RJ, MG, etc) para buscar preços REAIS:`, 'SP');

      if (estado && estado.trim()) {
        setEstadoPesquisa(estado.toUpperCase().trim());
        await atualizarPrecosComIA(novosItens, estado.toUpperCase().trim());
      }
    } catch (error) {
      toast.error('Erro ao gerar itens padrão');
      console.error(error);
      setLoading(false);
    }
  };

  const atualizarPrecosComIA = async (itensParaAtualizar, estadoParam) => {
    setPesquisandoPrecos(true);
    const estado = estadoParam || estadoPesquisa;

    try {
      toast.info(`🤖 Pesquisando ${itensParaAtualizar.length} itens em ${estado}...`, { duration: 3000 });

      let itensAtualizados = 0;
      const novosItensComPrecos = [];

      for (let i = 0; i < itensParaAtualizar.length; i++) {
        const itemAtual = itensParaAtualizar[i];

        try {
          const response = await base44.functions.invoke('pesquisarPrecoRegional', {
            produto_nome: itemAtual.descricao,
            unidade_medida: itemAtual.unidade_medida,
            estado: estado,
            cidade: '',
          });

          if (response.data.success && response.data.data.preco_medio) {
            const precoMedio = response.data.data.preco_medio;
            novosItensComPrecos.push({
              ...itemAtual,
              valor_unitario: precoMedio,
              valor_total: itemAtual.quantidade_total * precoMedio,
            });
            itensAtualizados++;
          } else {
            novosItensComPrecos.push(itemAtual);
          }

          await new Promise(resolve => setTimeout(resolve, 500));
        } catch {
          novosItensComPrecos.push(itemAtual);
        }
      }

      setItens(novosItensComPrecos);
      const valorFinal = novosItensComPrecos.reduce((sum, i) => sum + (i.valor_total || 0), 0);

      toast.success(`✅ ${itensAtualizados} preços atualizados!\n💰 Total: R$ ${valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, {
        duration: 5000,
      });
    } catch (error) {
      toast.error('Erro ao atualizar preços');
    } finally {
      setPesquisandoPrecos(false);
    }
  };

  const atualizarItem = (index, field, value) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [field]: value };

    if (field === 'quantidade_total' || field === 'valor_unitario') {
      let qtdTotal = field === 'quantidade_total' ? parseFloat(value) : novosItens[index].quantidade_total;
      if (deveSerInteiro(novosItens[index].unidade_medida)) {
        qtdTotal = Math.ceil(qtdTotal);
        novosItens[index].quantidade_total = qtdTotal;
      }
      novosItens[index].valor_total = qtdTotal * (novosItens[index].valor_unitario || 0);
    }

    setItens(novosItens);
  };

  const removerItem = (index) => {
    setItens((itens || []).filter((_, i) => i !== index));
  };

  const adicionarItemManual = () => {
    let qtdTotal = Math.ceil(parseFloat(novoItemManual.quantidade_total) || 0);
    const novoItem = {
      ...novoItemManual,
      quantidade_total: qtdTotal,
      valor_total: qtdTotal * (parseFloat(novoItemManual.valor_unitario) || 0),
      eh_item_padrao: false,
    };

    setItens([...(itens || []), novoItem]);
    setShowAdicionarManual(false);
    setNovoItemManual({
      etapa: 'fundacao',
      categoria: 'material',
      descricao: '',
      unidade_medida: 'unidade',
      quantidade_total: 1,
      valor_unitario: 0,
      fornecedor_id: '',
    });
    toast.success('Item adicionado!');
  };

  const aplicarSugestoesIA = (sugestoes) => {
    const novosItens = (sugestoes || []).map(sug => {
      let qtdTotal = Math.ceil(sug.quantidade_total || ((sug.quantidade_por_m2 || 0) * formData.area_total));
      return {
        etapa: etapaSugestaoIA,
        categoria: sug.categoria,
        descricao: `${sug.nome} - ${sug.especificacao}`,
        unidade_medida: sug.unidade_medida,
        quantidade_total: qtdTotal,
        quantidade_m2: sug.quantidade_por_m2 || 0,
        valor_unitario: sug.valor_unitario_atual || 0,
        valor_total: qtdTotal * (sug.valor_unitario_atual || 0),
        eh_item_padrao: false,
      };
    });

    setItens([...(itens || []), ...novosItens]);
    setShowSugestoesIA(false);
    toast.success(`✅ ${novosItens.length} itens adicionados!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.intencao_compra_id) {
      toast.error('Selecione uma Intenção de Compra');
      return;
    }

    const valorTotal = (itens || []).reduce((sum, item) => sum + (item.valor_total || 0), 0);
    const valorM2 = formData.area_total > 0 ? valorTotal / formData.area_total : 0;

    const custoData = {
      ...formData,
      valor_total_estimado: valorTotal,
      valor_m2: valorM2,
      status: 'orcamento',
    };

    let custoId;
    if (item?.id) {
      await base44.entities.CustoObra.update(item.id, custoData);
      custoId = item.id;

      const itensAntigos = await base44.entities.ItemCustoObra.filter({ custo_obra_id: item.id });
      for (const itemAntigo of (itensAntigos || [])) {
        await base44.entities.ItemCustoObra.delete(itemAntigo.id);
      }
    } else {
      const novoCusto = await base44.entities.CustoObra.create(custoData);
      custoId = novoCusto.id;
    }

    for (const itemData of (itens || [])) {
      await base44.entities.ItemCustoObra.create({
        ...itemData,
        custo_obra_id: custoId,
      });
    }

    queryClient.invalidateQueries({ queryKey: ['custos_obra'] });
    queryClient.invalidateQueries({ queryKey: ['itens_custo_obra'] });

    onSubmit({ ...custoData, id: custoId });
  };

  const itensPorEtapa = ETAPAS.map(etapa => ({
    ...etapa,
    itens: (itens || []).filter(item => item.etapa === etapa.id),
    total: (itens || []).filter(item => item.etapa === etapa.id).reduce((sum, item) => sum + (item.valor_total || 0), 0),
  })).filter(e => e.itens.length > 0);

  const valorTotalGeral = (itens || []).reduce((sum, item) => sum + (item.valor_total || 0), 0);
  const valorPorM2 = formData.area_total > 0 ? valorTotalGeral / formData.area_total : 0;
  const det = formData.detalhamento_projeto || {};

  return (
    <>
      <Card className="shadow-2xl border-t-4 border-[var(--wine-600)]">
        <CardHeader>
          <CardTitle className="text-[var(--wine-700)] text-2xl">
            {item ? 'Editar Custo de Obra' : 'Novo Custo de Obra'}
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <Tabs defaultValue="intencao" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger value="intencao">📋 Intenção</TabsTrigger>
                <TabsTrigger value="detalhes">🏠 Detalhes</TabsTrigger>
                <TabsTrigger value="opcionais">✨ Opcionais</TabsTrigger>
                <TabsTrigger value="orcamento">💰 Orçamento</TabsTrigger>
              </TabsList>

              {/* ABA INTENÇÃO DE COMPRA */}
              <TabsContent value="intencao" className="space-y-4 mt-4">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border-2 border-purple-300">
                  <h3 className="font-bold text-lg mb-4 text-purple-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Selecionar Intenção de Compra
                  </h3>
                  <p className="text-sm text-purple-700 mb-4">
                    O Custo de Obra será calculado com base nos dados preenchidos na Intenção de Compra do cliente.
                  </p>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        value={
                          intencaoSelecionada
                            ? `${clientes.find(c => c.id === intencaoSelecionada.cliente_id)?.nome || 'Cliente'} - ${PADROES[intencaoSelecionada.padrao_imovel]?.nome || intencaoSelecionada.padrao_imovel} - ${intencaoSelecionada.area_construida_desejada || 0}m²`
                            : ''
                        }
                        placeholder="Clique para selecionar uma Intenção de Compra..."
                        readOnly
                        className="cursor-pointer bg-white"
                        onClick={() => setShowSearchIntencao(true)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSearchIntencao(true)}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>

                  {intencaoSelecionada && (
                    <div className="mt-4 p-4 bg-white rounded-lg border">
                      <h4 className="font-semibold text-gray-900 mb-3">Resumo da Intenção de Compra</h4>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Cliente</p>
                          <p className="font-medium">{clientes.find(c => c.id === intencaoSelecionada.cliente_id)?.nome || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Loteamento</p>
                          <p className="font-medium">{loteamentos.find(l => l.id === intencaoSelecionada.loteamento_id)?.nome || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Padrão</p>
                          <Badge style={{ backgroundColor: PADROES[intencaoSelecionada.padrao_imovel]?.cor }}>
                            {PADROES[intencaoSelecionada.padrao_imovel]?.nome || intencaoSelecionada.padrao_imovel}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-gray-500">Área Desejada</p>
                          <p className="font-medium">{intencaoSelecionada.area_construida_desejada || 0} m²</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Quartos/Suítes</p>
                          <p className="font-medium">{intencaoSelecionada.quantidade_quartos || 0} quartos / {intencaoSelecionada.quantidade_suites || 0} suítes</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Orçamento</p>
                          <p className="font-medium text-green-700">
                            R$ {(intencaoSelecionada.orcamento_minimo || 0).toLocaleString('pt-BR')} a R$ {(intencaoSelecionada.orcamento_maximo || 0).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {/* Cômodos selecionados */}
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-gray-500 mb-2">Cômodos Selecionados</p>
                        <div className="flex flex-wrap gap-2">
                          {intencaoSelecionada.comodos?.sala_estar && <Badge variant="outline">Sala de Estar</Badge>}
                          {intencaoSelecionada.comodos?.sala_jantar && <Badge variant="outline">Sala de Jantar</Badge>}
                          {intencaoSelecionada.comodos?.cozinha_americana && <Badge variant="outline">Cozinha Americana</Badge>}
                          {intencaoSelecionada.comodos?.area_gourmet && <Badge variant="outline">Área Gourmet</Badge>}
                          {intencaoSelecionada.comodos?.churrasqueira && <Badge variant="outline">Churrasqueira</Badge>}
                          {intencaoSelecionada.comodos?.piscina && <Badge variant="outline">Piscina</Badge>}
                          {intencaoSelecionada.comodos?.varanda && <Badge variant="outline">Varanda</Badge>}
                          {intencaoSelecionada.comodos?.escritorio && <Badge variant="outline">Escritório</Badge>}
                        </div>
                      </div>

                      {/* Adicionais selecionados */}
                      {intencaoSelecionada.adicionais && Object.values(intencaoSelecionada.adicionais).some(v => v) && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-gray-500 mb-2">Adicionais</p>
                          <div className="flex flex-wrap gap-2">
                            {intencaoSelecionada.adicionais?.ar_condicionado && <Badge className="bg-blue-100 text-blue-800">Ar Condicionado</Badge>}
                            {intencaoSelecionada.adicionais?.energia_solar && <Badge className="bg-yellow-100 text-yellow-800">Energia Solar</Badge>}
                            {intencaoSelecionada.adicionais?.automacao_residencial && <Badge className="bg-purple-100 text-purple-800">Automação</Badge>}
                            {intencaoSelecionada.adicionais?.sistema_seguranca && <Badge className="bg-red-100 text-red-800">Segurança</Badge>}
                            {intencaoSelecionada.adicionais?.jardim_paisagismo && <Badge className="bg-green-100 text-green-800">Paisagismo</Badge>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Nome do Custo */}
                <div>
                  <Label>Nome do Custo de Obra *</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Custo de Obra - João Silva - Loteamento X"
                    required
                  />
                </div>
              </TabsContent>

              {/* ABA DETALHES (vindos da intenção + ajustes) */}
              <TabsContent value="detalhes" className="space-y-4 mt-4">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border-2 border-blue-300">
                  <h3 className="font-bold text-lg mb-4 text-blue-900">Características Construtivas</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Os dados abaixo foram importados da Intenção de Compra. Você pode ajustá-los conforme necessário.
                  </p>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Área Total (m²) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.area_total}
                        onChange={(e) => setFormData({ ...formData, area_total: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>

                    <div>
                      <Label>Padrão da Obra *</Label>
                      <Select
                        value={formData.padrao_obra}
                        onValueChange={(value) => setFormData({ ...formData, padrao_obra: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PADROES).map(([key, padrao]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: padrao.cor }} />
                                {padrao.nome}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Pavimentos</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.quantidade_pavimentos}
                        onChange={(e) => setFormData({ ...formData, quantidade_pavimentos: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <Label>Pé Direito (m)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.pe_direito}
                        onChange={(e) => setFormData({ ...formData, pe_direito: parseFloat(e.target.value) || 2.8 })}
                      />
                    </div>

                    <div>
                      <Label>Tipo de Fundação</Label>
                      <Select
                        value={formData.tipo_fundacao}
                        onValueChange={(value) => setFormData({ ...formData, tipo_fundacao: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sapata">Sapata</SelectItem>
                          <SelectItem value="radier">Radier</SelectItem>
                          <SelectItem value="estaca">Estaca</SelectItem>
                          <SelectItem value="tubulao">Tubulão</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Tipo de Estrutura</Label>
                      <Select
                        value={formData.tipo_estrutura}
                        onValueChange={(value) => setFormData({ ...formData, tipo_estrutura: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alvenaria_estrutural">Alvenaria Estrutural</SelectItem>
                          <SelectItem value="concreto_armado">Concreto Armado</SelectItem>
                          <SelectItem value="metalica">Metálica</SelectItem>
                          <SelectItem value="madeira">Madeira</SelectItem>
                          <SelectItem value="mista">Mista</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="tem_laje"
                          checked={formData.tem_laje}
                          onCheckedChange={(checked) => setFormData({ ...formData, tem_laje: checked, tipo_laje: checked ? 'convencional' : 'nenhuma' })}
                        />
                        <Label htmlFor="tem_laje">Possui Laje</Label>
                      </div>
                    </div>
                  </div>

                  {formData.tem_laje && (
                    <div className="mt-4">
                      <Label>Tipo de Laje</Label>
                      <Select
                        value={formData.tipo_laje}
                        onValueChange={(value) => setFormData({ ...formData, tipo_laje: value })}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pre_moldada">Pré-Moldada</SelectItem>
                          <SelectItem value="convencional">Convencional</SelectItem>
                          <SelectItem value="nervurada">Nervurada</SelectItem>
                          <SelectItem value="protendida">Protendida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Resumo dos cômodos da intenção */}
                <div className="bg-white p-6 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-4">Cômodos (da Intenção de Compra)</h4>
                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Quartos</p>
                      <p className="text-2xl font-bold">{det.quartos || 0}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-gray-500">Suítes</p>
                      <p className="text-2xl font-bold text-purple-700">{det.suites || 0}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-gray-500">Banheiros</p>
                      <p className="text-2xl font-bold text-blue-700">{det.banheiros || 0}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-gray-500">Garagem</p>
                      <p className="text-2xl font-bold text-green-700">{det.garagem_vagas || 0} vagas</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {det.area_gourmet && <Badge>Área Gourmet</Badge>}
                    {det.churrasqueira && <Badge>Churrasqueira</Badge>}
                    {det.piscina && <Badge className="bg-blue-600">Piscina</Badge>}
                    {det.escritorio && <Badge>Escritório</Badge>}
                    {det.despensa && <Badge>Despensa</Badge>}
                    {det.area_servico && <Badge>Área de Serviço</Badge>}
                    {det.lavanderia && <Badge>Lavanderia</Badge>}
                    {det.varanda && <Badge>Varanda</Badge>}
                    {det.varanda_gourmet && <Badge>Varanda Gourmet</Badge>}
                    {det.jardim_inverno && <Badge>Jardim de Inverno</Badge>}
                    {det.closet_master && <Badge>Closet Master</Badge>}
                    {det.banheira && <Badge>Banheira</Badge>}
                    {det.edicola && <Badge>Edícula</Badge>}
                  </div>
                </div>

                {/* Acabamentos especificados */}
                {(det.tipo_telhado || det.tipo_piso_interno || det.tipo_piso_externo || det.tipo_revestimento_parede) && (
                  <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                    <h4 className="font-semibold text-amber-900 mb-4">Acabamentos Especificados</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {det.tipo_telhado && (
                        <div>
                          <p className="text-gray-500">Tipo de Telhado</p>
                          <p className="font-medium">{det.tipo_telhado}</p>
                        </div>
                      )}
                      {det.tipo_piso_interno && (
                        <div>
                          <p className="text-gray-500">Piso Interno</p>
                          <p className="font-medium">{det.tipo_piso_interno}</p>
                        </div>
                      )}
                      {det.tipo_piso_externo && (
                        <div>
                          <p className="text-gray-500">Piso Externo</p>
                          <p className="font-medium">{det.tipo_piso_externo}</p>
                        </div>
                      )}
                      {det.tipo_revestimento_parede && (
                        <div>
                          <p className="text-gray-500">Revestimento de Parede</p>
                          <p className="font-medium">{det.tipo_revestimento_parede}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ABA OPCIONAIS */}
              <TabsContent value="opcionais" className="space-y-4 mt-4">
                <div className="bg-white p-6 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-3">Opcionais (importados da Intenção de Compra)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="incluir_mobilia"
                        checked={formData.incluir_mobilia}
                        onCheckedChange={(checked) => setFormData({ ...formData, incluir_mobilia: checked })}
                      />
                      <Label htmlFor="incluir_mobilia" className="cursor-pointer">🛋️ Mobília Completa</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="incluir_automacao"
                        checked={formData.incluir_automacao}
                        onCheckedChange={(checked) => setFormData({ ...formData, incluir_automacao: checked })}
                      />
                      <Label htmlFor="incluir_automacao" className="cursor-pointer">🤖 Automação Residencial</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="incluir_wifi_dados"
                        checked={formData.incluir_wifi_dados}
                        onCheckedChange={(checked) => setFormData({ ...formData, incluir_wifi_dados: checked })}
                      />
                      <Label htmlFor="incluir_wifi_dados" className="cursor-pointer">📡 WiFi e Rede de Dados</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="incluir_aquecimento_solar"
                        checked={formData.incluir_aquecimento_solar}
                        onCheckedChange={(checked) => setFormData({ ...formData, incluir_aquecimento_solar: checked })}
                      />
                      <Label htmlFor="incluir_aquecimento_solar" className="cursor-pointer">☀️ Aquecimento Solar</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="incluir_ar_condicionado"
                        checked={formData.incluir_ar_condicionado}
                        onCheckedChange={(checked) => setFormData({ ...formData, incluir_ar_condicionado: checked })}
                      />
                      <Label htmlFor="incluir_ar_condicionado" className="cursor-pointer">❄️ Ar Condicionado</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="incluir_energia_solar"
                        checked={formData.incluir_energia_solar}
                        onCheckedChange={(checked) => setFormData({ ...formData, incluir_energia_solar: checked })}
                      />
                      <Label htmlFor="incluir_energia_solar" className="cursor-pointer">🔆 Energia Solar</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="incluir_sistema_seguranca"
                        checked={formData.incluir_sistema_seguranca}
                        onCheckedChange={(checked) => setFormData({ ...formData, incluir_sistema_seguranca: checked })}
                      />
                      <Label htmlFor="incluir_sistema_seguranca" className="cursor-pointer">🔒 Sistema de Segurança</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="incluir_paisagismo"
                        checked={formData.incluir_paisagismo}
                        onCheckedChange={(checked) => setFormData({ ...formData, incluir_paisagismo: checked })}
                      />
                      <Label htmlFor="incluir_paisagismo" className="cursor-pointer">🌳 Paisagismo</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ABA ORÇAMENTO */}
              <TabsContent value="orcamento" className="space-y-4 mt-4">
                {!formData.intencao_compra_id ? (
                  <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Selecione uma Intenção de Compra na primeira aba para gerar o orçamento.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3 flex-wrap">
                      <Button
                        type="button"
                        onClick={gerarItensPadrao}
                        disabled={loading || pesquisandoPrecos || !formData.area_total}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {loading ? 'Gerando...' : pesquisandoPrecos ? 'Pesquisando...' : '🪄 Gerar Orçamento com IA'}
                      </Button>

                      <Button
                        type="button"
                        onClick={() => setShowAdicionarManual(true)}
                        variant="outline"
                        disabled={loading || pesquisandoPrecos}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Item Manual
                      </Button>

                      {(itens || []).length > 0 && !pesquisandoPrecos && (
                        <Button
                          type="button"
                          onClick={() => {
                            const estado = prompt('Digite o ESTADO (UF) para atualizar preços:', 'SP');
                            if (estado) {
                              setEstadoPesquisa(estado.toUpperCase().trim());
                              atualizarPrecosComIA(itens, estado.toUpperCase().trim());
                            }
                          }}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          🤖 Atualizar Preços
                        </Button>
                      )}
                    </div>

                    {pesquisandoPrecos && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        <p className="text-blue-800">Pesquisando preços reais no mercado de {estadoPesquisa}...</p>
                      </div>
                    )}

                    {(itens || []).length > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-300">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Total de Itens</p>
                            <p className="text-2xl font-bold">{itens.length}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Valor Total</p>
                            <p className="text-2xl font-bold text-green-700">
                              R$ {valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Valor por m²</p>
                            <p className="text-2xl font-bold text-blue-700">
                              R$ {valorPorM2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(itens || []).length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg mb-4">Itens do Orçamento</h3>
                        <Tabs defaultValue={itensPorEtapa[0]?.id} className="w-full">
                          <TabsList className="flex-wrap h-auto bg-gray-100 p-2 gap-2">
                            {itensPorEtapa.map(etapa => (
                              <TabsTrigger key={etapa.id} value={etapa.id} className="flex items-center gap-1">
                                <span>{etapa.icon}</span>
                                <span className="hidden md:inline">{etapa.nome}</span>
                                <Badge variant="outline" className="ml-1">{etapa.itens.length}</Badge>
                              </TabsTrigger>
                            ))}
                          </TabsList>

                          {itensPorEtapa.map(etapa => (
                            <TabsContent key={etapa.id} value={etapa.id} className="mt-4">
                              <Card>
                                <CardHeader className="bg-gray-50">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      {etapa.icon} {etapa.nome}
                                    </CardTitle>
                                    <Badge className="bg-blue-600">
                                      R$ {etapa.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                  {etapa.itens.map((itemData, idx) => {
                                    const itemIndex = itens.findIndex(i => i === itemData);
                                    return (
                                      <div key={itemIndex} className="border rounded-lg p-4 bg-white hover:shadow-md">
                                        <div className="grid md:grid-cols-5 gap-3">
                                          <div className="md:col-span-2">
                                            <Label className="text-xs">Descrição</Label>
                                            <Input
                                              value={itemData.descricao}
                                              onChange={(e) => atualizarItem(itemIndex, 'descricao', e.target.value)}
                                              className="h-9"
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-xs">Unidade</Label>
                                            <Select
                                              value={itemData.unidade_medida}
                                              onValueChange={(val) => atualizarItem(itemIndex, 'unidade_medida', val)}
                                            >
                                              <SelectTrigger className="h-9">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="m2">m²</SelectItem>
                                                <SelectItem value="m3">m³</SelectItem>
                                                <SelectItem value="m">metro</SelectItem>
                                                <SelectItem value="kg">kg</SelectItem>
                                                <SelectItem value="saco">saco</SelectItem>
                                                <SelectItem value="unidade">unidade</SelectItem>
                                                <SelectItem value="conjunto">conjunto</SelectItem>
                                                <SelectItem value="servico">serviço</SelectItem>
                                                <SelectItem value="hora">hora</SelectItem>
                                                <SelectItem value="diaria">diária</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div>
                                            <Label className="text-xs">Qtd</Label>
                                            <Input
                                              type="number"
                                              value={itemData.quantidade_total}
                                              onChange={(e) => atualizarItem(itemIndex, 'quantidade_total', parseFloat(e.target.value) || 0)}
                                              className="h-9"
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-xs">Valor Unit.</Label>
                                            <div className="flex gap-1">
                                              <Input
                                                type="number"
                                                step="0.01"
                                                value={itemData.valor_unitario}
                                                onChange={(e) => atualizarItem(itemIndex, 'valor_unitario', parseFloat(e.target.value) || 0)}
                                                className="h-9"
                                              />
                                              <Button
                                                type="button"
                                                size="icon"
                                                variant="outline"
                                                className="h-9 w-9"
                                                onClick={() => {
                                                  setItemPesquisa({ ...itemData, index: itemIndex });
                                                  setShowPesquisaPreco(true);
                                                }}
                                              >
                                                <Sparkles className="w-4 h-4 text-blue-600" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                          <div className="flex items-center gap-2">
                                            <Badge className="bg-green-100 text-green-700">
                                              Total: R$ {(itemData.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </Badge>
                                            {itemData.eh_item_padrao && (
                                              <Badge variant="outline">Item Padrão</Badge>
                                            )}
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removerItem(itemIndex)}
                                            className="text-red-600 hover:bg-red-50"
                                          >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Remover
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </CardContent>
                              </Card>
                            </TabsContent>
                          ))}
                        </Tabs>
                      </div>
                    )}

                    <div>
                      <Label>Observações</Label>
                      <Textarea
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        rows={3}
                        placeholder="Observações sobre o custo..."
                      />
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>

          <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || !formData.intencao_compra_id || pesquisandoPrecos}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              <Save className="w-4 h-4 mr-2" />
              {item ? 'Atualizar' : 'Salvar'} Custo
            </Button>
          </div>
        </form>
      </Card>

      {/* DIALOG BUSCAR INTENÇÃO DE COMPRA */}
      <Dialog open={showSearchIntencao} onOpenChange={setShowSearchIntencao}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Selecionar Intenção de Compra
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Loteamento</TableHead>
                  <TableHead>Padrão</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Orçamento</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {intencoesCompra.length > 0 ? (
                  intencoesCompra.map((intencao) => {
                    const cliente = clientes.find(c => c.id === intencao.cliente_id);
                    const loteamento = loteamentos.find(l => l.id === intencao.loteamento_id);
                    return (
                      <TableRow
                        key={intencao.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onDoubleClick={() => {
                          carregarDadosIntencao(intencao);
                          setShowSearchIntencao(false);
                        }}
                      >
                        <TableCell className="font-medium">{cliente?.nome || '-'}</TableCell>
                        <TableCell>{loteamento?.nome || '-'}</TableCell>
                        <TableCell>
                          <Badge style={{ backgroundColor: PADROES[intencao.padrao_imovel]?.cor, color: 'white' }}>
                            {PADROES[intencao.padrao_imovel]?.nome || intencao.padrao_imovel}
                          </Badge>
                        </TableCell>
                        <TableCell>{intencao.area_construida_desejada || 0} m²</TableCell>
                        <TableCell className="text-sm">
                          R$ {(intencao.orcamento_minimo || 0).toLocaleString('pt-BR')} - R$ {(intencao.orcamento_maximo || 0).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => {
                              carregarDadosIntencao(intencao);
                              setShowSearchIntencao(false);
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nenhuma Intenção de Compra encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG ADICIONAR MANUAL */}
      {showAdicionarManual && (
        <Card className="shadow-2xl border-2 border-purple-500 mb-6">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Item Manualmente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Etapa *</Label>
                <Select
                  value={novoItemManual.etapa}
                  onValueChange={(val) => setNovoItemManual({ ...novoItemManual, etapa: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ETAPAS.map(etapa => (
                      <SelectItem key={etapa.id} value={etapa.id}>
                        {etapa.icon} {etapa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria *</Label>
                <Select
                  value={novoItemManual.categoria}
                  onValueChange={(value) => setNovoItemManual({ ...novoItemManual, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
                    <SelectItem value="equipamento">Equipamento</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="moveis">Móveis</SelectItem>
                    <SelectItem value="eletrodomesticos">Eletrodomésticos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Descrição *</Label>
              <Input
                value={novoItemManual.descricao}
                onChange={(e) => setNovoItemManual({ ...novoItemManual, descricao: e.target.value })}
                placeholder="Descrição do item..."
                required
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Unidade de Medida</Label>
                <Select
                  value={novoItemManual.unidade_medida}
                  onValueChange={(val) => setNovoItemManual({ ...novoItemManual, unidade_medida: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m2">m²</SelectItem>
                    <SelectItem value="m3">m³</SelectItem>
                    <SelectItem value="m">metro</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="saco">saco</SelectItem>
                    <SelectItem value="unidade">unidade</SelectItem>
                    <SelectItem value="conjunto">conjunto</SelectItem>
                    <SelectItem value="servico">serviço</SelectItem>
                    <SelectItem value="hora">hora</SelectItem>
                    <SelectItem value="diaria">diária</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={novoItemManual.quantidade_total}
                  onChange={(e) => setNovoItemManual({ ...novoItemManual, quantidade_total: e.target.value })}
                />
              </div>
              <div>
                <Label>Valor Unitário (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={novoItemManual.valor_unitario}
                  onChange={(e) => setNovoItemManual({ ...novoItemManual, valor_unitario: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowAdicionarManual(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={adicionarItemManual}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showPesquisaPreco && itemPesquisa && (
        <PesquisarPrecoDialog
          item={itemPesquisa}
          onClose={() => {
            setShowPesquisaPreco(false);
            setItemPesquisa(null);
          }}
          onSelectPrice={(preco) => {
            atualizarItem(itemPesquisa.index, 'valor_unitario', preco);
            setShowPesquisaPreco(false);
            setItemPesquisa(null);
          }}
        />
      )}

      {showSugestoesIA && (
        <SugestoesIADialog
          padrao={formData.padrao_obra}
          etapa={etapaSugestaoIA}
          estado={estadoPesquisa}
          area={formData.area_total}
          detalhamento_projeto={formData.detalhamento_projeto}
          open={showSugestoesIA}
          onClose={() => setShowSugestoesIA(false)}
          onAplicarSugestoes={aplicarSugestoesIA}
        />
      )}

      {showBuscarProdutoWeb && (
        <BuscarProdutoWebDialog
          onClose={() => setShowBuscarProdutoWeb(false)}
          onProdutoCadastrado={(produtoNovo) => {
            setNovoItemManual({
              ...novoItemManual,
              descricao: produtoNovo.nome,
              valor_unitario: produtoNovo.valor_medio || 0,
              unidade_medida: produtoNovo.unidade_medida || 'unidade',
            });
            setShowBuscarProdutoWeb(false);
            toast.success('Produto cadastrado!');
          }}
        />
      )}
    </>
  );
}