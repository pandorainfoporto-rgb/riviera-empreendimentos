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
import {
  Save, X, Sparkles, Calculator, Plus, Trash2,
  Search, TrendingUp, Package, Edit, DollarSign, Loader2, Home, Building2, Waves
} from "lucide-react";
import { toast } from "sonner";

import PesquisarPrecoDialog from "./PesquisarPrecoDialog";
import SugestoesIADialog from "./SugestoesIADialog";
import BuscarProdutoWebDialog from "./BuscarProdutoWebDialog";
import SearchUnidadeDialog from "../shared/SearchUnidadeDialog";

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
  medio_baixo: {
    nome: 'Médio/Baixo',
    descricao: 'Materiais econômicos e funcionais',
    cor: '#10b981',
    multiplicador: 0.7,
  },
  medio: {
    nome: 'Médio',
    descricao: 'Materiais de boa qualidade',
    cor: '#3b82f6',
    multiplicador: 1.0,
  },
  alto: {
    nome: 'Alto',
    descricao: 'Materiais premium',
    cor: '#f59e0b',
    multiplicador: 1.5,
  },
  luxo: {
    nome: 'Luxo',
    descricao: 'Materiais de altíssima qualidade',
    cor: '#8b5cf6',
    multiplicador: 2.5,
  },
};

// Função para determinar se quantidade deve ser inteira
const deveSerInteiro = (unidadeMedida, categoria) => {
  // Agora TODAS as unidades devem ser inteiras (padrão Brasil)
  const unidadesInteiras = ['unidade', 'conjunto', 'saco', 'balde', 'lata', 'galao', 'rolo', 'barra', 'caixa', 'm2', 'm3', 'm', 'kg', 'diaria', 'hora', 'servico', 'ponto']; // Added 'm', 'kg', 'ponto' as well
  return unidadesInteiras.includes(unidadeMedida);
};

export default function CustoObraForm({ item, unidades = [], loteamentos = [], clientes = [], intencaoCompra, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    unidade_id: '',
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
    // NOVOS CAMPOS - Detalhamento de Projeto
    detalhamento_projeto: {
      quartos_terreo: 0,
      suites_terreo: 0,
      quartos_superior: 0,
      suites_superior: 0,
      salas_estar: 0,
      salas_jantar: 0,
      salas_tv: 0,
      cozinha_tipo: 'americana',
      cozinha_tem_ilha: false,
      banheiros_sociais: 0,
      lavabo: false,
      area_gourmet: false,
      area_gourmet_churrasqueira: false,
      area_gourmet_forno_pizza: false,
      adega: false,
      adega_climatizada: false,
      escritorio: false,
      biblioteca: false,
      despensa: false,
      area_servico: false,
      quarto_servico: false,
      varanda: false,
      segundo_pavimento: false,
      subsolo: false,
      subsolo_garagem_vagas: 0,
      garagem_vagas: 0, // Adicionado
      piscina: false,
      piscina_tipo: 'vinil',
      piscina_tamanho_m2: 0,
      piscina_aquecida: false,
      jardim: false,
      jardim_area_m2: 0,
      jardim_irrigacao: false,
      deck: false,
      deck_area_m2: 0,
      deck_material: 'madeira',
    }
  });

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
    produto_id: '',
    servico_id: '',
    descricao: '',
    unidade_medida: 'unidade',
    quantidade_total: 1,
    valor_unitario: 0,
    fornecedor_id: '',
  });
  const [pesquisandoPrecos, setPesquisandoPrecos] = useState(false);
  const [estadoPesquisa, setEstadoPesquisa] = useState('SP');
  const [valorTotalPrevia, setValorTotalPrevia] = useState(0); // Novo estado para prévia de valor
  const [showSearchUnidade, setShowSearchUnidade] = useState(false);

  const queryClient = useQueryClient();

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

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      try {
        return await base44.entities.Produto.list();
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const { data: servicos = [] } = useQuery({
    queryKey: ['servicos'],
    queryFn: async () => {
      try {
        return await base44.entities.Servico.list();
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

  // Carregar itens existentes
  useEffect(() => {
    if (item?.id) {
      const loadItens = async () => {
        try {
          const itensCarregados = await base44.entities.ItemCustoObra.filter({ custo_obra_id: item.id });
          setItens(itensCarregados || []);
          // Calcular valorTotalPrevia se os itens já vêm com preços de referência
          setValorTotalPrevia((itensCarregados || []).reduce((sum, item) => sum + (item.valor_total || 0), 0));
        } catch (error) {
          console.error('Erro ao carregar itens:', error);
          setItens([]);
        }
      };
      loadItens();
    }
  }, [item]);

  // Pré-carregar dados da Intenção de Compra
  useEffect(() => {
    if (intencaoCompra && !item) {
      const cliente = clientes.find(c => c.id === intencaoCompra.cliente_id);
      setFormData(prev => ({
        ...prev,
        nome: `Custo de Obra - ${cliente?.nome || 'Cliente'}`,
        intencao_compra_id: intencaoCompra.id,
        padrao_obra: intencaoCompra.padrao_imovel || 'medio',
        area_total: intencaoCompra.area_construida_desejada || 0,
        quantidade_pavimentos: intencaoCompra.quantidade_pavimentos || 1,
        incluir_mobilia: intencaoCompra.adicionais?.mobilia_planejada || false,
        incluir_automacao: intencaoCompra.adicionais?.automacao_residencial || false,
        incluir_wifi_dados: intencaoCompra.adicionais?.wifi_estruturado || false,
        incluir_aquecimento_solar: intencaoCompra.adicionais?.aquecimento_solar || false,
        incluir_ar_condicionado: intencaoCompra.adicionais?.ar_condicionado || false,
        incluir_energia_solar: intencaoCompra.adicionais?.energia_solar || false,
        incluir_sistema_seguranca: intencaoCompra.adicionais?.sistema_seguranca || intencaoCompra.adicionais?.cameras || intencaoCompra.adicionais?.alarme || false,
        incluir_paisagismo: intencaoCompra.adicionais?.jardim_paisagismo || false,
        detalhamento_projeto: {
          quartos_terreo: intencaoCompra.quantidade_quartos || 0,
          suites_terreo: intencaoCompra.quantidade_suites || 0,
          quartos_superior: 0,
          suites_superior: 0,
          salas_estar: intencaoCompra.comodos?.sala_estar ? 1 : 0,
          salas_jantar: intencaoCompra.comodos?.sala_jantar ? 1 : 0,
          salas_tv: intencaoCompra.comodos?.sala_tv ? 1 : 0,
          cozinha_tipo: intencaoCompra.comodos?.cozinha_americana ? 'americana' : 'tradicional',
          banheiros_sociais: intencaoCompra.quantidade_banheiros || 0,
          lavabo: intencaoCompra.quantidade_lavabos > 0,
          area_gourmet: intencaoCompra.comodos?.area_gourmet || false,
          area_gourmet_churrasqueira: intencaoCompra.comodos?.churrasqueira || false,
          escritorio: intencaoCompra.comodos?.escritorio || intencaoCompra.comodos?.home_office || false,
          despensa: intencaoCompra.comodos?.despensa || false,
          area_servico: intencaoCompra.comodos?.area_servico || intencaoCompra.comodos?.lavanderia || false,
          quarto_servico: intencaoCompra.comodos?.quarto_empregada || false,
          varanda: intencaoCompra.comodos?.varanda || intencaoCompra.comodos?.varanda_gourmet || false,
          segundo_pavimento: intencaoCompra.quantidade_pavimentos > 1,
          garagem_vagas: intencaoCompra.vagas_garagem || 0,
          piscina: intencaoCompra.comodos?.piscina || false,
          jardim: intencaoCompra.adicionais?.jardim_paisagismo || false,
        },
        observacoes: `Importado da Intenção de Compra - Detalhes específicos: ${intencaoCompra.detalhes_especificos || 'Nenhum'}`,
      }));
    }
  }, [intencaoCompra, item, clientes]);

  // Carregar detalhamento da unidade selecionada
  useEffect(() => {
    if (formData.unidade_id && !item) { // Only auto-fill if it's a new item or if the unit changes on a new item form
      const unidadeSelecionada = unidades.find(u => u.id === formData.unidade_id);
      if (unidadeSelecionada?.detalhamento_pavimentos) {
        const det = unidadeSelecionada.detalhamento_pavimentos;

        setFormData(prev => ({
          ...prev,
          detalhamento_projeto: {
            quartos_terreo: det.pavimento_terreo?.quartos?.filter(q => !q.eh_suite).length || 0,
            suites_terreo: det.pavimento_terreo?.quartos?.filter(q => q.eh_suite).length || 0,
            quartos_superior: det.pavimento_superior?.quartos?.filter(q => !q.eh_suite).length || 0,
            suites_superior: det.pavimento_superior?.quartos?.filter(q => q.eh_suite).length || 0,
            salas_estar: (det.pavimento_terreo?.salas?.filter(s => s.tipo === 'estar').length || 0) +
                        (det.pavimento_superior?.salas?.filter(s => s.tipo === 'estar').length || 0),
            salas_jantar: det.pavimento_terreo?.salas?.filter(s => s.tipo === 'jantar').length || 0,
            salas_tv: (det.pavimento_terreo?.salas?.filter(s => s.tipo === 'tv').length || 0) +
                     (det.pavimento_superior?.salas?.filter(s => s.tipo === 'tv').length || 0),
            cozinha_tipo: det.pavimento_terreo?.cozinha?.tipo || 'americana',
            cozinha_tem_ilha: det.pavimento_terreo?.cozinha?.tem_ilha || false,
            banheiros_sociais: (det.pavimento_terreo?.banheiros_sociais || 0) + (det.pavimento_superior?.banheiros_sociais || 0),
            lavabo: det.pavimento_terreo?.lavabo || false,
            area_gourmet: det.pavimento_terreo?.area_gourmet?.possui || false,
            area_gourmet_churrasqueira: det.pavimento_terreo?.area_gourmet?.tem_churrasqueira || false,
            area_gourmet_forno_pizza: det.pavimento_terreo?.area_gourmet?.tem_forno_pizza || false,
            adega: det.pavimento_terreo?.adega?.possui || false,
            adega_climatizada: det.pavimento_terreo?.adega?.climatizada || false,
            escritorio: det.pavimento_terreo?.escritorio?.possui || det.pavimento_superior?.escritorio?.possui || false,
            biblioteca: det.pavimento_superior?.biblioteca?.possui || false,
            despensa: det.pavimento_terreo?.despensa?.possui || false,
            area_servico: det.pavimento_terreo?.area_servico?.possui || false,
            quarto_servico: det.pavimento_terreo?.quarto_servico?.possui || false,
            varanda: det.pavimento_superior?.varanda?.possui || false,
            segundo_pavimento: det.pavimento_superior?.possui || false,
            subsolo: det.pavimento_subsolo?.possui || false,
            subsolo_garagem_vagas: det.pavimento_subsolo?.garagem_quantidade_vagas || 0,
            garagem_vagas: unidadeSelecionada.vagas_garagem || 0, // Carregar vagas da unidade
            piscina: det.areas_externas?.piscina?.possui || false,
            piscina_tipo: det.areas_externas?.piscina?.tipo || 'vinil',
            piscina_tamanho_m2: det.areas_externas?.piscina?.tamanho_m2 || 0,
            piscina_aquecida: det.areas_externas?.piscina?.aquecida || false,
            jardim: det.areas_externas?.jardim?.possui || false,
            jardim_area_m2: det.areas_externas?.jardim?.area_m2 || 0,
            jardim_irrigacao: det.areas_externas?.jardim?.tem_irrigacao || false,
            deck: det.areas_externas?.deck?.possui || false,
            deck_area_m2: det.areas_externas?.deck?.area_m2 || 0,
            deck_material: det.areas_externas?.deck?.material || 'madeira',
          }
        }));
      }
    }
  }, [formData.unidade_id, unidades, item]);


  const gerarItensPadrao = async () => {
    if (!formData.area_total || formData.area_total <= 0) {
      toast.error('Informe a área total primeiro');
      return;
    }

    setLoading(true);

    try {
      const det = formData.detalhamento_projeto;
      const totalQuartos = (det.quartos_terreo || 0) + (det.suites_terreo || 0) + (det.quartos_superior || 0) + (det.suites_superior || 0);
      const totalSuites = (det.suites_terreo || 0) + (det.suites_superior || 0);
      const totalBanheiros = (det.banheiros_sociais || 0) + totalSuites + (det.lavabo ? 1 : 0);
      const totalGaragem = (det.garagem_vagas || 0) + (det.subsolo_garagem_vagas || 0);

      toast.info('🤖 IA calculando quantidades conforme projeto REAL...', { duration: 3000 });

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um engenheiro civil especialista em orçamento de obras brasileiras.

REGRAS BRASIL:
- TODAS as quantidades devem ser INTEIRAS (m², m³, sacos, diárias, horas)
- No Brasil NÃO vendemos 2.5m², nem 1.7m³, nem 3.4 diárias
- Arredondar SEMPRE para cima (teto)
- Instalações: calcular POR CÔMODO, não por m²

DADOS DA OBRA:
- Área Total: ${formData.area_total}m²
- Pavimentos: ${formData.quantidade_pavimentos}
- Tem Laje: ${formData.tem_laje ? 'SIM' : 'NÃO'}
- Tipo Laje: ${formData.tem_laje ? formData.tipo_laje : 'não aplicável'}
- Pé Direito: ${formData.pe_direito}m
- Fundação: ${formData.tipo_fundacao}
- Estrutura: ${formData.tipo_estrutura}

CÔMODOS:
- Quartos: ${totalQuartos} (${totalSuites} suítes)
- Banheiros: ${totalBanheiros}
- Garagem: ${totalGaragem} vagas
- Salas: ${det.salas_estar} estar, ${det.salas_jantar} jantar, ${det.salas_tv} TV

CÁLCULOS:

1. **Fundação**: 0.8 a 1.5 (NÃO multiplicar área)

2. **Instalações Elétricas**: PONTOS TOTAIS
   - ${totalQuartos} quartos × 8 = ${totalQuartos * 8}
   - ${totalBanheiros} banheiros × 6 = ${totalBanheiros * 6}
   - Cozinha = 15
   - TOTAL PONTOS (não multiplicar área!)

3. **Instalações Hidráulicas**: PONTOS
   - ${totalBanheiros} banheiros × 12 = ${totalBanheiros * 12}
   - Cozinha = 8

4. **Cobertura**: 1.2 a 1.4 (área telhado)

5. **Revestimentos**: área paredes (não só piso)

Retorne:`,
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
      let valorTotalEstimado = 0; // Renamed for clarity with valorTotalPrevia

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
        let quantidadePorM2 = material[`quantidade_por_m2_${padraoSelecionado}`] || 0;

        if (material.etapa === 'fundacao') {
          quantidadePorM2 *= (ajustesIA.fundacao_multiplicador || 1);
        } else if (material.etapa === 'estrutura' && !formData.tem_laje) {
          quantidadePorM2 *= (ajustesIA.estrutura_multiplicador || 0.6);
        } else if (material.etapa === 'instalacoes_eletricas') {
          if (ajustesIA.instalacoes_eletricas_total_pontos) {
            quantidadePorM2 = material.unidade_medida === 'unidade' || material.unidade_medida === 'ponto'
              ? ajustesIA.instalacoes_eletricas_total_pontos / formData.area_total // Back-calculate a 'per m2' value so that when multiplied by area_total, it yields total points
              : quantidadePorM2 * 0.3; // Generic multiplier for other electrical units (e.g., wire in meters)
          } else {
            quantidadePorM2 *= 0.3;
          }
        } else if (material.etapa === 'instalacoes_hidraulicas') {
          if (ajustesIA.instalacoes_hidraulicas_total_pontos) {
            quantidadePorM2 = material.unidade_medida === 'unidade' || material.unidade_medida === 'ponto'
              ? ajustesIA.instalacoes_hidraulicas_total_pontos / formData.area_total
              : quantidadePorM2 * 0.4; // Generic multiplier for other hydraulic units
          } else {
            quantidadePorM2 *= 0.4;
          }
        } else if (material.etapa === 'revestimentos') {
          if (ajustesIA.revestimentos_area_paredes_m2) {
            // Adjust original quantidade_por_m2 (which might be for floor area) to reflect wall area
            // A simple proportional adjustment based on the original material's per-m2 quantity
            quantidadePorM2 = (ajustesIA.revestimentos_area_paredes_m2 / formData.area_total) * (material.quantidade_por_m2_medio || 1);
          }
        } else if (material.etapa === 'pintura') {
          if (ajustesIA.pintura_area_total_m2) {
            // Similar adjustment for paint, aligning material's quantity_per_m2 to AI's total paintable area
            quantidadePorM2 = (ajustesIA.pintura_area_total_m2 / formData.area_total) * (material.quantidade_por_m2_medio || 1);
          }
        } else if (material.etapa === 'cobertura') {
          quantidadePorM2 *= (ajustesIA.cobertura_multiplicador || 1.3);
        }

        const descricao = material[`descricao_${padraoSelecionado}`] || material.nome;
        let quantidadeTotal = quantidadePorM2 * formData.area_total;

        // BRASIL: SEMPRE INTEIRO
        quantidadeTotal = Math.ceil(quantidadeTotal);
        
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
            quantidade_m2: quantidadePorM2, // Mantém a referência, mas a quantidade total é calculada
            quantidade_total: quantidadeTotal,
            valor_unitario: material.valor_referencia_unitario || 0,
            valor_total: valorItem,
            eh_item_padrao: true,
          });
        }
      });

      // Se tem laje, adicionar materiais específicos calculados pela IA
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

      toast.success(`✅ ${novosItens.length} itens gerados com cálculos baseados no projeto!\n\n💰 Valor estimado (preços referência): R$ ${valorTotalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n${ajustesIA.observacoes}`, {
        duration: 8000,
      });

      const estado = prompt(`🤖 ${novosItens.length} itens foram gerados!\n\n💰 PRÉVIA: R$ ${valorTotalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (preços referência)\n\n💡 A IA pode buscar preços REAIS do mercado e atualizar automaticamente!\n\nDigite o estado (SP, RJ, MG, etc) ou clique Cancelar:`, 'SP');

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
      toast.info(`🤖 Iniciando pesquisa inteligente de ${itensParaAtualizar.length} itens em ${estado}...`, {
        duration: 3000,
      });

      let itensAtualizados = 0;
      const novosItensComPrecos = [];

      for (let i = 0; i < itensParaAtualizar.length; i++) {
        const itemAtual = itensParaAtualizar[i];

        try {
          toast.info(`Pesquisando ${i + 1}/${itensParaAtualizar.length}: ${itemAtual.descricao.substring(0, 35)}...`, {
            duration: 2000,
          });

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

          await new Promise(resolve => setTimeout(resolve, 800));

        } catch (error) {
          console.error(`Erro ao pesquisar ${itemAtual.descricao}:`, error);
          novosItensComPrecos.push(itemAtual);
        }
      }

      setItens(novosItensComPrecos);
      
      const valorFinal = novosItensComPrecos.reduce((sum, i) => sum + (i.valor_total || 0), 0);
      
      toast.success(`✅ Concluído! ${itensAtualizados} de ${itensParaAtualizar.length} preços atualizados!\n\n💰 ANTES: R$ ${valorTotalPrevia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n💰 DEPOIS: R$ ${valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n📊 Diferença: R$ ${(valorFinal - valorTotalPrevia).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, {
        duration: 8000,
      });

    } catch (error) {
      toast.error('Erro ao atualizar preços');
      console.error(error);
    } finally {
      setPesquisandoPrecos(false);
    }
  };

  const atualizarItem = (index, field, value) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [field]: value };

    // Recalcular quantidade total baseado em quantidade_m2 e area
    if (field === 'quantidade_m2') {
      let qtdTotal = parseFloat(value) * formData.area_total;

      // BRASIL: SEMPRE INTEIRO
      if (deveSerInteiro(novosItens[index].unidade_medida, novosItens[index].categoria)) {
        qtdTotal = Math.ceil(qtdTotal);
      }

      novosItens[index].quantidade_total = qtdTotal;
      novosItens[index].valor_total = qtdTotal * (novosItens[index].valor_unitario || 0);
    }

    // Recalcular valor total
    if (field === 'quantidade_total' || field === 'valor_unitario') {
      let qtdTotal = field === 'quantidade_total' ? parseFloat(value) : novosItens[index].quantidade_total;

      // BRASIL: SEMPRE INTEIRO
      if (deveSerInteiro(novosItens[index].unidade_medida, novosItens[index].categoria)) {
        qtdTotal = Math.ceil(qtdTotal);
        novosItens[index].quantidade_total = qtdTotal; // Atualiza a quantidade total para o valor arredondado
      }

      novosItens[index].valor_total = qtdTotal * (novosItens[index].valor_unitario || 0);
    }

    setItens(novosItens);
  };

  const removerItem = (index) => {
    setItens((itens || []).filter((_, i) => i !== index));
  };

  const adicionarItemManual = () => {
    let qtdTotal = parseFloat(novoItemManual.quantidade_total) || 0;

    // BRASIL: SEMPRE INTEIRO
    if (deveSerInteiro(novoItemManual.unidade_medida, novoItemManual.categoria)) {
      qtdTotal = Math.ceil(qtdTotal);
    }

    const novoItem = {
      etapa: novoItemManual.etapa,
      categoria: novoItemManual.categoria,
      produto_id: novoItemManual.produto_id || null,
      servico_id: novoItemManual.servico_id || null,
      descricao: novoItemManual.descricao || (produtos || []).find(p => p.id === novoItemManual.produto_id)?.nome || (servicos || []).find(s => s.id === novoItemManual.servico_id)?.nome || '',
      unidade_medida: (produtos || []).find(p => p.id === novoItemManual.produto_id)?.unidade_medida || (servicos || []).find(s => s.id === novoItemManual.servico_id)?.unidade_medida || novoItemManual.unidade_medida,
      quantidade_total: qtdTotal,
      valor_unitario: parseFloat(novoItemManual.valor_unitario) || (produtos || []).find(p => p.id === novoItemManual.produto_id)?.valor_unitario || (servicos || []).find(s => s.id === novoItemManual.servico_id)?.valor_unitario || 0,
      fornecedor_id: novoItemManual.fornecedor_id || (produtos || []).find(p => p.id === novoItemManual.produto_id)?.fornecedor_padrao_id || (servicos || []).find(s => s.id === novoItemManual.servico_id)?.fornecedor_padrao_id || '',
      eh_item_padrao: false,
    };

    novoItem.valor_total = novoItem.quantidade_total * novoItem.valor_unitario;

    setItens([...(itens || []), novoItem]);
    setShowAdicionarManual(false);

    setNovoItemManual({
      etapa: 'fundacao',
      categoria: 'material',
      produto_id: '',
      servico_id: '',
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
      let qtdTotal = sug.quantidade_total || ((sug.quantidade_por_m2 || 0) * formData.area_total);
      
      // BRASIL: SEMPRE INTEIRO
      if (deveSerInteiro(sug.unidade_medida, sug.categoria)) {
        qtdTotal = Math.ceil(qtdTotal);
      }

      return {
        etapa: etapaSugestaoIA,
        categoria: sug.categoria,
        descricao: `${sug.nome} - ${sug.especificacao}`,
        unidade_medida: sug.unidade_medida,
        quantidade_total: qtdTotal,
        quantidade_m2: sug.quantidade_por_m2 || 0, // Ensure it's not undefined
        valor_unitario: sug.valor_unitario_atual || 0,
        valor_total: qtdTotal * (sug.valor_unitario_atual || 0),
        eh_item_padrao: false,
      };
    });

    setItens([...(itens || []), ...novosItens]);
    setShowSugestoesIA(false);
    toast.success(`✅ ${novosItens.length} itens adicionados das sugestões da IA!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    onSubmit(custoData);
  };

  const itensPorEtapa = ETAPAS.map(etapa => ({
    ...etapa,
    itens: (itens || []).filter(item => item.etapa === etapa.id),
    total: (itens || []).filter(item => item.etapa === etapa.id).reduce((sum, item) => sum + (item.valor_total || 0), 0),
  })).filter(e => e.itens.length > 0);

  const valorTotalGeral = (itens || []).reduce((sum, item) => sum + (item.valor_total || 0), 0);
  const valorPorM2 = formData.area_total > 0 ? valorTotalGeral / formData.area_total : 0;

  const det = formData.detalhamento_projeto || {};
  const totalQuartos = (det.quartos_terreo || 0) + (det.suites_terreo || 0) + (det.quartos_superior || 0) + (det.suites_superior || 0);
  const totalSuites = (det.suites_terreo || 0) + (det.suites_superior || 0);

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
            <Tabs defaultValue="basico" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger value="basico">📋 Básico</TabsTrigger>
                <TabsTrigger value="detalhamento">🏠 Projeto</TabsTrigger>
                <TabsTrigger value="opcionais">✨ Opcionais</TabsTrigger>
                <TabsTrigger value="orcamento">💰 Orçamento</TabsTrigger>
              </TabsList>

              {/* ABA BÁSICO */}
              <TabsContent value="basico" className="space-y-4 mt-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">Informações Básicas</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Custo *</Label>
                      <Input
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Custo Completo - Apto 101"
                        required
                      />
                    </div>

                    <div>
                      <Label>Unidade *</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            value={
                              formData.unidade_id
                                ? (() => {
                                    const uni = (unidades || []).find(u => u.id === formData.unidade_id);
                                    const lot = (loteamentos || []).find(l => l.id === uni?.loteamento_id);
                                    return uni ? `${uni.codigo} - ${lot?.nome || ''} (${uni.area_total}m²)` : '';
                                  })()
                                : ''
                            }
                            placeholder="Selecione uma unidade..."
                            readOnly
                            className="cursor-pointer"
                            onClick={() => setShowSearchUnidade(true)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowSearchUnidade(true)}
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

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
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PADROES).map(([key, padrao]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: padrao.cor }} />
                                {padrao.nome} - {padrao.descricao}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Características Construtivas */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-300">
                    <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      🏗️ Características Construtivas (para cálculo NBR)
                    </h4>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm">Quantidade de Pavimentos *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.quantidade_pavimentos}
                          onChange={(e) => setFormData({ ...formData, quantidade_pavimentos: parseInt(e.target.value) || 1 })}
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Pé Direito (m) *</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="2.4"
                          max="5"
                          value={formData.pe_direito}
                          onChange={(e) => setFormData({ ...formData, pe_direito: parseFloat(e.target.value) || 2.8 })}
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Tipo de Fundação *</Label>
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
                        <Label className="text-sm">Tipo de Estrutura *</Label>
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
                    </div>

                    {/* LAJE */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-400">
                      <div className="flex items-center gap-3 mb-3">
                        <Checkbox
                          id="tem_laje"
                          checked={formData.tem_laje}
                          onCheckedChange={(checked) => {
                            setFormData({
                              ...formData,
                              tem_laje: checked,
                              tipo_laje: checked ? 'convencional' : 'nenhuma'
                            });
                          }}
                        />
                        <Label htmlFor="tem_laje" className="cursor-pointer font-bold text-amber-900 text-base">
                          🏗️ Obra possui LAJE de concreto?
                        </Label>
                      </div>

                      {formData.tem_laje && (
                        <div className="mt-3">
                          <Label className="text-sm">Tipo de Laje *</Label>
                          <Select
                            value={formData.tipo_laje}
                            onValueChange={(value) => setFormData({ ...formData, tipo_laje: value })}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pre_moldada">Pré-Moldada (mais econômica)</SelectItem>
                              <SelectItem value="convencional">Convencional Maciça</SelectItem>
                              <SelectItem value="nervurada">Nervurada (cubetas)</SelectItem>
                              <SelectItem value="protendida">Protendida (grandes vãos)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-amber-700 mt-2">
                            ⚠️ <strong>IMPORTANTE:</strong> Laje aumenta significativamente o custo (concreto, aço, forma).
                            A IA calculará automaticamente conforme NBR 6118.
                          </p>
                        </div>
                      )}

                      {!formData.tem_laje && (
                        <p className="text-xs text-amber-700 mt-2">
                          ℹ️ Obra SEM laje: cobertura será em madeiramento + telha (mais econômico)
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-purple-700 mt-3">
                      ℹ️ Estes dados serão usados pela IA para calcular quantidades de materiais conforme normas NBR 6118, 6122 e 15575
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* ABA DETALHAMENTO DO PROJETO */}
              <TabsContent value="detalhamento" className="space-y-6 mt-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-300">
                  <h3 className="font-bold text-lg mb-2 text-green-900 flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Detalhamento do Projeto
                  </h3>
                  <p className="text-sm text-green-700 mb-4">
                    Informe os cômodos e características para cálculo PRECISO de materiais
                  </p>

                  {totalQuartos > 0 && (
                    <div className="mb-4 flex gap-2">
                      <Badge className="bg-green-600 text-white">{totalQuartos} Quartos Total</Badge>
                      <Badge className="bg-purple-600 text-white">{totalSuites} Suítes</Badge>
                    </div>
                  )}

                  {/* PAVIMENTO TÉRREO */}
                  <Card className="mb-4">
                    <CardHeader className="bg-gray-50">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Home className="w-5 h-5" />
                        Pavimento Térreo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm">Quartos</Label>
                          <Input
                            type="number"
                            min="0"
                            value={det.quartos_terreo || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                quartos_terreo: parseInt(e.target.value) || 0
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Suítes</Label>
                          <Input
                            type="number"
                            min="0"
                            value={det.suites_terreo || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                suites_terreo: parseInt(e.target.value) || 0
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Banheiros Sociais</Label>
                          <Input
                            type="number"
                            min="0"
                            value={det.banheiros_sociais || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                banheiros_sociais: parseInt(e.target.value) || 0
                              }
                            })}
                          />
                        </div>
                        <div className="flex items-end">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={det.lavabo}
                              onCheckedChange={(checked) => setFormData({
                                ...formData,
                                detalhamento_projeto: {
                                  ...formData.detalhamento_projeto,
                                  lavabo: checked
                                }
                              })}
                            />
                            <Label className="text-sm">Lavabo</Label>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm">Salas de Estar</Label>
                          <Input
                            type="number"
                            min="0"
                            value={det.salas_estar || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                salas_estar: parseInt(e.target.value) || 0
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Salas de Jantar</Label>
                          <Input
                            type="number"
                            min="0"
                            value={det.salas_jantar || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                salas_jantar: parseInt(e.target.value) || 0
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Salas de TV</Label>
                          <Input
                            type="number"
                            min="0"
                            value={det.salas_tv || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                salas_tv: parseInt(e.target.value) || 0
                              }
                            })}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Tipo de Cozinha</Label>
                          <Select
                            value={det.cozinha_tipo || 'americana'}
                            onValueChange={(value) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                cozinha_tipo: value
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="americana">Americana</SelectItem>
                              <SelectItem value="tradicional">Tradicional</SelectItem>
                              <SelectItem value="gourmet">Gourmet</SelectItem>
                              <SelectItem value="integrada_sala">Integrada com Sala</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={det.cozinha_tem_ilha}
                              onCheckedChange={(checked) => setFormData({
                                ...formData,
                                detalhamento_projeto: {
                                  ...formData.detalhamento_projeto,
                                  cozinha_tem_ilha: checked
                                }
                              })}
                            />
                            <Label className="text-sm">Cozinha tem Ilha</Label>
                          </div>
                        </div>
                      </div>

                      {/* GARAGEM (TÉRREO - SEPARADO DO SUBSOLO) */}
                      <div className="p-3 bg-indigo-50 rounded-lg border-2 border-indigo-300">
                        <Label className="text-sm font-bold mb-2 block">🚗 Garagem</Label>
                        <div>
                          <Label className="text-xs">Vagas de Garagem (Térreo/Externa)</Label>
                          <Input
                            type="number"
                            min="0"
                            className="h-9"
                            value={det.garagem_vagas || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                garagem_vagas: parseInt(e.target.value) || 0
                              }
                            })}
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            ℹ️ Garagem no térreo ou externa (não inclui subsolo)
                          </p>
                        </div>
                      </div>

                      {/* Ambientes Térreo */}
                      <div className="grid md:grid-cols-3 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={det.area_gourmet}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                area_gourmet: checked,
                                area_gourmet_churrasqueira: checked ? det.area_gourmet_churrasqueira : false,
                                area_gourmet_forno_pizza: checked ? det.area_gourmet_forno_pizza : false,
                              }
                            })}
                          />
                          <Label className="text-sm">🍖 Área Gourmet</Label>
                        </div>
                        {det.area_gourmet && (
                          <>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={det.area_gourmet_churrasqueira}
                                onCheckedChange={(checked) => setFormData({
                                  ...formData,
                                  detalhamento_projeto: {
                                    ...formData.detalhamento_projeto,
                                    area_gourmet_churrasqueira: checked
                                  }
                                })}
                              />
                              <Label className="text-sm text-gray-600">+ Churrasqueira</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={det.area_gourmet_forno_pizza}
                                onCheckedChange={(checked) => setFormData({
                                  ...formData,
                                  detalhamento_projeto: {
                                    ...formData.detalhamento_projeto,
                                    area_gourmet_forno_pizza: checked
                                  }
                                })}
                              />
                              <Label className="text-sm text-gray-600">+ Forno Pizza</Label>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="grid md:grid-cols-3 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={det.adega}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                adega: checked,
                                adega_climatizada: checked ? det.adega_climatizada : false,
                              }
                            })}
                          />
                          <Label className="text-sm">🍷 Adega</Label>
                        </div>
                        {det.adega && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={det.adega_climatizada}
                              onCheckedChange={(checked) => setFormData({
                                ...formData,
                                detalhamento_projeto: {
                                  ...formData.detalhamento_projeto,
                                  adega_climatizada: checked
                                }
                              })}
                            />
                            <Label className="text-sm text-gray-600">+ Climatizada</Label>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={det.escritorio}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                escritorio: checked
                              }
                            })}
                          />
                          <Label className="text-sm">💼 Escritório</Label>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={det.despensa}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                despensa: checked
                              }
                            })}
                          />
                          <Label className="text-sm">📦 Despensa</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={det.area_servico}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                area_servico: checked
                              }
                            })}
                          />
                          <Label className="text-sm">🧺 Área de Serviço</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={det.quarto_servico}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                quarto_servico: checked
                              }
                            })}
                          />
                          <Label className="text-sm">🛏️ Quarto de Serviço</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* PAVIMENTO SUPERIOR */}
                  <Card className="mb-4">
                    <CardHeader className="bg-gray-50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building2 className="w-5 h-5" />
                          Segundo Pavimento
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={det.segundo_pavimento}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                segundo_pavimento: checked,
                                quartos_superior: checked ? det.quartos_superior : 0,
                                suites_superior: checked ? det.suites_superior : 0,
                                biblioteca: checked ? det.biblioteca : false,
                                varanda: checked ? det.varanda : false,
                              }
                            })}
                          />
                          <Label className="text-sm font-bold">Possui 2º Pavimento</Label>
                        </div>
                      </div>
                    </CardHeader>
                    {det.segundo_pavimento && (
                      <CardContent className="p-4 space-y-4">
                        <div className="grid md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-sm">Quartos</Label>
                            <Input
                              type="number"
                              min="0"
                              value={det.quartos_superior || 0}
                              onChange={(e) => setFormData({
                                ...formData,
                                detalhamento_projeto: {
                                  ...formData.detalhamento_projeto,
                                  quartos_superior: parseInt(e.target.value) || 0
                                }
                              })}
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Suítes</Label>
                            <Input
                              type="number"
                              min="0"
                              value={det.suites_superior || 0}
                              onChange={(e) => setFormData({
                                ...formData,
                                detalhamento_projeto: {
                                  ...formData.detalhamento_projeto,
                                  suites_superior: parseInt(e.target.value) || 0
                                }
                              })}
                            />
                          </div>
                          <div className="flex items-end">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={det.biblioteca}
                                onCheckedChange={(checked) => setFormData({
                                  ...formData,
                                  detalhamento_projeto: {
                                    ...formData.detalhamento_projeto,
                                    biblioteca: checked
                                  }
                                })}
                              />
                              <Label className="text-sm">📚 Biblioteca</Label>
                            </div>
                          </div>
                          <div className="flex items-end">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={det.varanda}
                                onCheckedChange={(checked) => setFormData({
                                  ...formData,
                                  detalhamento_projeto: {
                                    ...formData.detalhamento_projeto,
                                    varanda: checked
                                  }
                                })}
                              />
                              <Label className="text-sm">🌅 Varanda</Label>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* SUBSOLO */}
                  <Card className="mb-4">
                    <CardHeader className="bg-gray-50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">⬇️ Subsolo</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={det.subsolo}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                subsolo: checked,
                                subsolo_garagem_vagas: checked ? det.subsolo_garagem_vagas : 0,
                              }
                            })}
                          />
                          <Label className="text-sm font-bold">Possui Subsolo</Label>
                        </div>
                      </div>
                    </CardHeader>
                    {det.subsolo && (
                      <CardContent className="p-4">
                        <div>
                          <Label className="text-sm">Vagas de Garagem ADICIONAL no Subsolo</Label>
                          <Input
                            type="number"
                            min="0"
                            value={det.subsolo_garagem_vagas || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                subsolo_garagem_vagas: parseInt(e.target.value) || 0
                              }
                            })}
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            ℹ️ Vagas ADICIONAIS no subsolo (somam com as do térreo para o total de vagas cobertas/fechadas).
                          </p>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* ÁREAS EXTERNAS */}
                  <Card>
                    <CardHeader className="bg-gray-50">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Waves className="w-5 h-5" />
                        Áreas Externas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {/* PISCINA */}
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <Checkbox
                            checked={det.piscina}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                piscina: checked,
                                piscina_tamanho_m2: checked ? det.piscina_tamanho_m2 : 0,
                                piscina_aquecida: checked ? det.piscina_aquecida : false,
                              }
                            })}
                          />
                          <Label className="text-sm font-bold">🏊 Piscina</Label>
                        </div>
                        {det.piscina && (
                          <div className="grid md:grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Tipo</Label>
                              <Select
                                value={det.piscina_tipo || 'vinil'}
                                onValueChange={(value) => setFormData({
                                  ...formData,
                                  detalhamento_projeto: {
                                    ...formData.detalhamento_projeto,
                                    piscina_tipo: value
                                  }
                                })}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="vinil">Vinil</SelectItem>
                                  <SelectItem value="fibra">Fibra</SelectItem>
                                  <SelectItem value="alvenaria">Alvenaria</SelectItem>
                                  <SelectItem value="infinity">Infinity</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Tamanho (m²)</Label>
                              <Input
                                type="number"
                                className="h-8"
                                value={det.piscina_tamanho_m2 || 0}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  detalhamento_projeto: {
                                    ...formData.detalhamento_projeto,
                                    piscina_tamanho_m2: parseFloat(e.target.value) || 0
                                  }
                                })}
                              />
                            </div>
                            <div className="flex items-end">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={det.piscina_aquecida}
                                  onCheckedChange={(checked) => setFormData({
                                    ...formData,
                                    detalhamento_projeto: {
                                      ...formData.detalhamento_projeto,
                                      piscina_aquecida: checked
                                    }
                                  })}
                                />
                                <Label className="text-xs">Aquecida</Label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* JARDIM */}
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <Checkbox
                            checked={det.jardim}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                jardim: checked,
                                jardim_area_m2: checked ? det.jardim_area_m2 : 0,
                                jardim_irrigacao: checked ? det.jardim_irrigacao : false,
                              }
                            })}
                          />
                          <Label className="text-sm font-bold">🌳 Jardim</Label>
                        </div>
                        {det.jardim && (
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Área (m²)</Label>
                              <Input
                                type="number"
                                className="h-8"
                                value={det.jardim_area_m2 || 0}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  detalhamento_projeto: {
                                    ...formData.detalhamento_projeto,
                                    jardim_area_m2: parseFloat(e.target.value) || 0
                                  }
                                })}
                              />
                            </div>
                            <div className="flex items-end">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={det.jardim_irrigacao}
                                  onCheckedChange={(checked) => setFormData({
                                    ...formData,
                                    detalhamento_projeto: {
                                      ...formData.detalhamento_projeto,
                                      jardim_irrigacao: checked
                                    }
                                  })}
                                />
                                <Label className="text-xs">Irrigação Automática</Label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* DECK */}
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <Checkbox
                            checked={det.deck}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              detalhamento_projeto: {
                                ...formData.detalhamento_projeto,
                                deck: checked,
                                deck_area_m2: checked ? det.deck_area_m2 : 0,
                              }
                            })}
                          />
                          <Label className="text-sm font-bold">🪵 Deck</Label>
                        </div>
                        {det.deck && (
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Material</Label>
                              <Select
                                value={det.deck_material || 'madeira'}
                                onValueChange={(value) => setFormData({
                                  ...formData,
                                  detalhamento_projeto: {
                                    ...formData.detalhamento_projeto,
                                    deck_material: value
                                  }
                                })}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="madeira">Madeira</SelectItem>
                                  <SelectItem value="composito">Compósito</SelectItem>
                                  <SelectItem value="pedra">Pedra</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Área (m²)</Label>
                              <Input
                                type="number"
                                className="h-8"
                                value={det.deck_area_m2 || 0}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  detalhamento_projeto: {
                                    ...formData.detalhamento_projeto,
                                    deck_area_m2: parseFloat(e.target.value) || 0
                                  }
                                })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ABA OPCIONAIS */}
              <TabsContent value="opcionais" className="space-y-4 mt-4">
                <div className="bg-white p-6 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-3">Opcionais Básicos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
                      <Checkbox
                        id="incluir_mobilia"
                        checked={formData.incluir_mobilia}
                        onCheckedChange={(checked) => setFormData({ ...formData, incluir_mobilia: checked })}
                      />
                      <Label htmlFor="incluir_mobilia" className="cursor-pointer">
                        🛋️ Mobília Completa
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
                      <Checkbox
                        id="incluir_automacao"
                        checked={formData.incluir_automacao}
                        onCheckedChange={(checked) => setFormData({ ...formData, incluir_automacao: checked })}
                      />
                      <Label htmlFor="incluir_automacao" className="cursor-pointer">
                        🤖 Automação Residencial
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
                      <Checkbox
                        id="incluir_wifi_dados"
                        checked={formData.incluir_wifi_dados}
                        onCheckedChange={(checked) => setFormData({ ...formData, incluir_wifi_dados: checked })}
                      />
                      <Label htmlFor="incluir_wifi_dados" className="cursor-pointer">
                        📡 WiFi e Rede de Dados
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
                      <Checkbox
                        id="incluir_aquecimento_solar"
                        checked={formData.incluir_aquecimento_solar}
                        onCheckedChange={(checked) => setFormData({ ...formData, incluir_aquecimento_solar: checked })}
                      />
                      <Label htmlFor="incluir_aquecimento_solar" className="cursor-pointer">
                        ☀️ Aquecimento Solar
                      </Label>
                    </div>
                  </div>
                </div>

                {(formData.padrao_obra === 'alto' || formData.padrao_obra === 'luxo') && (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-300">
                    <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Opcionais Recomendados para Alto Padrão
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
                        <Checkbox
                          id="incluir_ar_condicionado"
                          checked={formData.incluir_ar_condicionado}
                          onCheckedChange={(checked) => setFormData({ ...formData, incluir_ar_condicionado: checked })}
                        />
                        <Label htmlFor="incluir_ar_condicionado" className="cursor-pointer">
                          ❄️ Ar Condicionado Central
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
                        <Checkbox
                          id="incluir_energia_solar"
                          checked={formData.incluir_energia_solar}
                          onCheckedChange={(checked) => setFormData({ ...formData, incluir_energia_solar: checked })}
                        />
                        <Label htmlFor="incluir_energia_solar" className="cursor-pointer">
                          🔆 Energia Solar Fotovoltaica
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
                        <Checkbox
                          id="incluir_sistema_seguranca"
                          checked={formData.incluir_sistema_seguranca}
                          onCheckedChange={(checked) => setFormData({ ...formData, incluir_sistema_seguranca: checked })}
                        />
                        <Label htmlFor="incluir_sistema_seguranca" className="cursor-pointer">
                          🔒 Sistema de Segurança
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
                        <Checkbox
                          id="incluir_paisagismo"
                          checked={formData.incluir_paisagismo}
                          onCheckedChange={(checked) => setFormData({ ...formData, incluir_paisagismo: checked })}
                        />
                        <Label htmlFor="incluir_paisagismo" className="cursor-pointer">
                          🌳 Paisagismo Profissional
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ABA ORÇAMENTO */}
              <TabsContent value="orcamento" className="space-y-4 mt-4">
                <div className="flex gap-3 flex-wrap">
                  <Button
                    type="button"
                    onClick={gerarItensPadrao}
                    disabled={loading || pesquisandoPrecos || !formData.area_total}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {loading ? 'Gerando...' : pesquisandoPrecos ? 'Pesquisando Preços...' : '🪄 Gerar Itens + Prévia de Custo'}
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
                        const estado = prompt('🤖 Atualização Inteligente de Preços\n\nDigite o ESTADO (UF):\n\nExemplos: SP, RJ, MG, RS, SC, PR\n\nA IA vai buscar preços REAIS no mercado!', 'SP');
                        if (estado && estado.trim()) {
                          setEstadoPesquisa(estado.toUpperCase().trim());
                          atualizarPrecosComIA(itens, estado.toUpperCase().trim());
                        }
                      }}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg animate-pulse"
                    >
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      🤖 Atualizar TODOS os Preços
                    </Button>
                  )}
                </div>

                {/* PRÉVIA DE VALOR */}
                {valorTotalPrevia > 0 && (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-amber-800 font-medium">💰 Prévia de Custo (Preços Referência)</p>
                        <p className="text-2xl font-bold text-amber-900 mt-1">
                          R$ {valorTotalPrevia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      {valorTotalGeral > 0 && valorTotalGeral !== valorTotalPrevia && (
                        <div className="text-right">
                          <p className="text-sm text-green-800 font-medium">✅ Após Pesquisa IA</p>
                          <p className="text-2xl font-bold text-green-900 mt-1">
                            R$ {valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <Badge className={`mt-1 ${valorTotalGeral > valorTotalPrevia ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                            {valorTotalGeral > valorTotalPrevia ? '📈' : '📉'} R$ {Math.abs(valorTotalGeral - valorTotalPrevia).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {pesquisandoPrecos && (
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg shadow-lg">
                    <div className="flex items-start gap-4">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-bold text-blue-900 text-lg">🤖 IA pesquisando preços reais no mercado de {estadoPesquisa}...</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Consultando lojas físicas, e-commerce e fornecedores regionais
                        </p>
                        <div className="mt-3 flex gap-3 text-xs">
                          <Badge className="bg-blue-600 text-white">🏪 Lojas</Badge>
                          <Badge className="bg-cyan-600 text-white">🌐 E-commerce</Badge>
                          <Badge className="bg-indigo-600 text-white">🏭 Distribuidores</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(itens || []).length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-300">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total de Itens</p>
                        <p className="text-2xl font-bold text-gray-900">{(itens || []).length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Valor Total Atual</p>
                        <p className="text-2xl font-bold text-green-700">
                          R$ {valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Valor por m²</p>
                        <p className="text-2xl font-bold text-blue-700">
                          R$ {valorPorM2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(itens || []).length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-4 text-gray-900">Itens do Orçamento</h3>

                    <Tabs defaultValue={itensPorEtapa[0]?.id} className="w-full">
                      <TabsList className="flex-wrap h-auto bg-gray-100 p-2 gap-2">
                        {(itensPorEtapa || []).map(etapa => (
                          <TabsTrigger key={etapa.id} value={etapa.id} className="flex items-center gap-2">
                            <span>{etapa.icon}</span>
                            <span className="hidden md:inline">{etapa.nome}</span>
                            <Badge variant="outline" className="ml-1">
                              {etapa.itens.length}
                            </Badge>
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {(itensPorEtapa || []).map(etapa => (
                        <TabsContent key={etapa.id} value={etapa.id} className="mt-4">
                          <Card>
                            <CardHeader className="bg-gray-50">
                              <div className="flex items-center justify-between flex-wrap gap-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <span>{etapa.icon}</span>
                                  {etapa.nome}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-blue-600 text-white">
                                    Total: R$ {etapa.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </Badge>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      if (!formData.area_total || formData.area_total <= 0) {
                                        toast.error('Informe a área total primeiro');
                                        return;
                                      }
                                      setEtapaSugestaoIA(etapa.id);
                                      setShowSugestoesIA(true);
                                    }}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                                    disabled={pesquisandoPrecos}
                                  >
                                    <Sparkles className="w-4 h-4 mr-1" />
                                    Sugestões IA
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                              {(etapa.itens || []).map((itemData, index) => {
                                const itemIndex = (itens || []).findIndex(i => i === itemData);
                                const materialPadrao = (materiaisPadrao || []).find(m =>
                                  m.nome === itemData.descricao ||
                                  itemData.descricao?.includes(m.nome)
                                );

                                return (
                                  <div key={itemIndex} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                                    {materialPadrao?.imagens && materialPadrao.imagens.length > 0 && (
                                      <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
                                        {materialPadrao.imagens.map((img, imgIdx) => (
                                          <div key={imgIdx} className="flex-shrink-0 relative group">
                                            <img
                                              src={img.url}
                                              alt={img.descricao}
                                              className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all cursor-pointer"
                                              onClick={() => window.open(img.url, '_blank')}
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg transition-all flex items-center justify-center">
                                              <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                🔍 Ampliar
                                              </p>
                                            </div>
                                            <Badge className="absolute -top-2 -right-2 text-xs" variant="outline">
                                              {img.padrao}
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    <div className="grid md:grid-cols-6 gap-3">
                                      <div className="md:col-span-2">
                                        <Label className="text-xs">Descrição</Label>
                                        <Input
                                          value={itemData.descricao}
                                          onChange={(e) => atualizarItem(itemIndex, 'descricao', e.target.value)}
                                          className="h-9"
                                        />
                                      </div>

                                      <div>
                                        <Label className="text-xs">Categoria</Label>
                                        <Select
                                          value={itemData.categoria}
                                          onValueChange={(val) => atualizarItem(itemIndex, 'categoria', val)}
                                        >
                                          <SelectTrigger className="h-9">
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
                                          step={deveSerInteiro(itemData.unidade_medida, itemData.categoria) ? "1" : "0.01"}
                                          value={itemData.quantidade_total}
                                          onChange={(e) => atualizarItem(itemIndex, 'quantidade_total', parseFloat(e.target.value) || 0)}
                                          className="h-9"
                                        />
                                      </div>

                                      <div>
                                        <Label className="text-xs">Valor Unit. (R$)</Label>
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
                                            className="h-9 w-9 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-blue-300"
                                            onClick={() => {
                                              setItemPesquisa({ ...itemData, index: itemIndex });
                                              setShowPesquisaPreco(true);
                                            }}
                                            title="🤖 Pesquisar preço REAL no mercado com IA"
                                          >
                                            <Sparkles className="w-4 h-4 text-blue-600" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid md:grid-cols-4 gap-3 mt-3">
                                      <div className="md:col-span-2">
                                        <Label className="text-xs">Fornecedor</Label>
                                        <Select
                                          value={itemData.fornecedor_id || ''}
                                          onValueChange={(val) => atualizarItem(itemIndex, 'fornecedor_id', val)}
                                        >
                                          <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Selecione..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value={null}>Nenhum</SelectItem>
                                            {(fornecedores || []).map(forn => (
                                              <SelectItem key={forn.id} value={forn.id}>
                                                {forn.nome}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <Label className="text-xs">Valor Total</Label>
                                        <div className="h-9 flex items-center px-3 bg-green-100 rounded-md font-bold text-green-700">
                                          R$ {(itemData.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                      </div>

                                      <div className="flex items-end">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removerItem(itemIndex)}
                                          className="w-full hover:bg-red-50 hover:text-red-700"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Remover
                                        </Button>
                                      </div>
                                    </div>

                                    {itemData.eh_item_padrao && (
                                      <div className="mt-2 flex items-center gap-2">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                          Item Padrão
                                        </Badge>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="text-xs text-blue-600 hover:text-blue-700"
                                          onClick={async () => {
                                            const estado = prompt('Digite o estado (ex: SP, RJ):', 'SP');
                                            if (!estado) return;

                                            setPesquisandoPrecos(true);
                                            try {
                                              const response = await base44.functions.invoke('pesquisarPrecoRegional', {
                                                produto_nome: itemData.descricao,
                                                unidade_medida: itemData.unidade_medida,
                                                estado: estado.toUpperCase(),
                                                cidade: '',
                                              });

                                              if (response.data.success && response.data.data.preco_medio) {
                                                atualizarItem(itemIndex, 'valor_unitario', response.data.data.preco_medio);
                                                toast.success(`Preço atualizado: R$ ${response.data.data.preco_medio.toFixed(2)}`);
                                              }
                                            } catch (error) {
                                              toast.error('Erro ao pesquisar preço');
                                            } finally {
                                              setPesquisandoPrecos(false);
                                            }
                                          }}
                                          disabled={pesquisandoPrecos}
                                        >
                                          <Sparkles className="w-3 h-3 mr-1" />
                                          {pesquisandoPrecos ? 'Pesquisando...' : '🤖 Atualizar Preço Real'}
                                        </Button>
                                      </div>
                                    )}
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
              disabled={isProcessing || (itens || []).length === 0 || pesquisandoPrecos}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              <Save className="w-4 h-4 mr-2" />
              {item ? 'Atualizar' : 'Salvar'} Custo
            </Button>
          </div>
        </form>
      </Card>

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
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-300">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-blue-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    🌐 Produto não está na lista?
                  </p>
                  <p className="text-sm text-blue-700">
                    Busque na internet e cadastre automaticamente com fotos!
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setShowBuscarProdutoWeb(true)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600"
                >
                  <Search className="w-4 h-4 mr-2" />
                  🤖 Buscar na Web
                </Button>
              </div>
            </div>

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
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Material de Construção</SelectItem>
                    <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
                    <SelectItem value="equipamento">Equipamento</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="moveis">Móveis</SelectItem>
                    <SelectItem value="eletrodomesticos">Eletrodomésticos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {novoItemManual.categoria === 'material' && (
              <div>
                <Label>Produto da Grade</Label>
                <Select
                  value={novoItemManual.produto_id}
                  onValueChange={(val) => {
                    const produto = (produtos || []).find(p => p.id === val);
                    setNovoItemManual({
                      ...novoItemManual,
                      produto_id: val,
                      descricao: produto?.nome || '',
                      valor_unitario: produto?.valor_unitario || 0,
                      unidade_medida: produto?.unidade_medida || 'unidade',
                      fornecedor_id: produto?.fornecedor_padrao_id || '',
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum (digitar manualmente)</SelectItem>
                    {(produtos || []).filter(p => p.ativo).map(prod => (
                      <SelectItem key={prod.id} value={prod.id}>
                        {prod.nome} - R$ {prod.valor_unitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / {prod.unidade_medida}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {novoItemManual.categoria === 'servico' && (
              <div>
                <Label>Serviço da Grade</Label>
                <Select
                  value={novoItemManual.servico_id}
                  onValueChange={(val) => {
                    const servico = (servicos || []).find(s => s.id === val);
                    setNovoItemManual({
                      ...novoItemManual,
                      servico_id: val,
                      descricao: servico?.nome || '',
                      valor_unitario: servico?.valor_unitario || 0,
                      unidade_medida: servico?.unidade_medida || 'servico',
                      fornecedor_id: servico?.fornecedor_padrao_id || '',
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum (digitar manualmente)</SelectItem>
                    {(servicos || []).filter(s => s.ativo).map(serv => (
                      <SelectItem key={serv.id} value={serv.id}>
                        {serv.nome} - R$ {serv.valor_unitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                <Label>Unidade de Medida *</Label>
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
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  step={deveSerInteiro(novoItemManual.unidade_medida, novoItemManual.categoria) ? "1" : "0.01"}
                  min="0"
                  value={novoItemManual.quantidade_total}
                  onChange={(e) => {
                    let valor = parseFloat(e.target.value) || 0;

                    // BRASIL: SEMPRE INTEIRO
                    if (deveSerInteiro(novoItemManual.unidade_medida, novoItemManual.categoria)) {
                      valor = Math.ceil(valor);
                    }

                    setNovoItemManual({ ...novoItemManual, quantidade_total: valor });
                  }}
                  required
                />
                {deveSerInteiro(novoItemManual.unidade_medida, novoItemManual.categoria) && (
                  <p className="text-xs text-blue-600 mt-1">
                    ℹ️ Quantidade será arredondada para o próximo inteiro (não pode ser fracionada).
                  </p>
                )}
              </div>

              <div>
                <Label>Valor Unitário (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={novoItemManual.valor_unitario}
                  onChange={(e) => setNovoItemManual({ ...novoItemManual, valor_unitario: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Fornecedor</Label>
              <Select
                value={novoItemManual.fornecedor_id}
                onValueChange={(val) => setNovoItemManual({ ...novoItemManual, fornecedor_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {(fornecedores || []).map(forn => (
                    <SelectItem key={forn.id} value={forn.id}>
                      {forn.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdicionarManual(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={adicionarItemManual}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
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
            toast.success('Produto cadastrado! Preencha os demais dados.');
          }}
        />
      )}

      <SearchUnidadeDialog
        open={showSearchUnidade}
        onClose={() => setShowSearchUnidade(false)}
        onSelect={(unidade) => {
          setFormData({
            ...formData,
            unidade_id: unidade.id,
            area_total: unidade.area_total || 0,
          });
          setShowSearchUnidade(false);
        }}
        unidades={unidades}
        loteamentos={loteamentos}
      />
    </>
  );
}