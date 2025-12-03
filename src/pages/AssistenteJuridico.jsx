import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Scale, FileText, Search, AlertTriangle, CheckCircle2, Lightbulb,
  Upload, Download, Copy, Loader2, BookOpen, Shield, FileSearch,
  Sparkles, Brain, ListChecks, MessageSquare, Building, Users,
  Home, FileSignature, Gavel, ClipboardList, Info, Plus, Trash2, UserPlus, X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import SearchClienteDialog from "../components/shared/SearchClienteDialog";
import SearchFornecedorDialog from "../components/shared/SearchFornecedorDialog";
import SearchUnidadeDialog from "../components/shared/SearchUnidadeDialog";

const tiposDocumento = [
  { 
    value: "contrato_compra_venda", 
    label: "Contrato de Compra e Venda", 
    icon: FileSignature,
    parteALabel: "Vendedor(a)/Promitente Vendedor(a)",
    parteBLabel: "Comprador(a)/Promitente Comprador(a)",
    objetoLabel: "Imóvel Objeto da Venda",
    valorLabel: "Valor Total da Venda (R$)",
    prazoLabel: "Prazo para Escrituração",
    camposExtras: ["forma_pagamento", "entrada", "parcelas", "indice_correcao", "data_entrega_posse"]
  },
  { 
    value: "contrato_locacao", 
    label: "Contrato de Locação", 
    icon: Home,
    parteALabel: "Locador(a)",
    parteBLabel: "Locatário(a)",
    objetoLabel: "Imóvel Objeto da Locação",
    valorLabel: "Valor do Aluguel Mensal (R$)",
    prazoLabel: "Prazo da Locação",
    camposExtras: ["caucao", "fiador", "dia_vencimento", "indice_reajuste", "finalidade_locacao"]
  },
  { 
    value: "contrato_parceria", 
    label: "Contrato de Parceria/Sociedade", 
    icon: Users,
    parteALabel: "Sócio(a) / Parceiro(a) 1",
    parteBLabel: "Sócio(a) / Parceiro(a) 2",
    objetoLabel: "Objeto da Parceria/Sociedade",
    valorLabel: "Capital Social / Investimento Total (R$)",
    prazoLabel: "Prazo da Parceria",
    camposExtras: ["percentual_participacao", "distribuicao_lucros", "responsabilidades", "clausula_saida"]
  },
  { 
    value: "contrato_prestacao_servicos", 
    label: "Contrato de Prestação de Serviços", 
    icon: FileText,
    parteALabel: "Contratante",
    parteBLabel: "Contratado(a)/Prestador(a)",
    objetoLabel: "Serviços a Serem Prestados",
    valorLabel: "Valor Total dos Serviços (R$)",
    prazoLabel: "Prazo de Execução",
    camposExtras: ["forma_pagamento_servico", "cronograma_entregas", "penalidade_atraso", "garantia_servico"]
  },
  { 
    value: "contrato_empreitada", 
    label: "Contrato de Empreitada", 
    icon: Building,
    parteALabel: "Dono da Obra / Contratante",
    parteBLabel: "Empreiteiro(a) / Construtora",
    objetoLabel: "Obra/Construção Objeto do Contrato",
    valorLabel: "Valor Total da Empreitada (R$)",
    prazoLabel: "Prazo de Conclusão da Obra",
    camposExtras: ["tipo_empreitada", "memorial_descritivo", "cronograma_obra", "retencao_garantia", "responsavel_materiais"]
  },
  { 
    value: "distrato", 
    label: "Distrato/Rescisão Contratual", 
    icon: FileText,
    parteALabel: "Distratante 1",
    parteBLabel: "Distratante 2",
    objetoLabel: "Contrato Original a Ser Distratado",
    valorLabel: "Valores a Serem Devolvidos/Retidos (R$)",
    prazoLabel: "Prazo para Quitação/Devolução",
    camposExtras: ["motivo_distrato", "multa_rescisoria", "valores_pagos", "forma_devolucao"]
  },
  { 
    value: "aditivo", 
    label: "Aditivo Contratual", 
    icon: FileText,
    parteALabel: "Parte Contratante",
    parteBLabel: "Parte Contratada",
    objetoLabel: "Contrato Original e Cláusulas a Serem Alteradas",
    valorLabel: "Novo Valor (se aplicável) (R$)",
    prazoLabel: "Novo Prazo (se aplicável)",
    camposExtras: ["numero_contrato_original", "data_contrato_original", "alteracoes_especificas"]
  },
  { 
    value: "procuracao", 
    label: "Procuração", 
    icon: Gavel,
    parteALabel: "Outorgante (Quem concede poderes)",
    parteBLabel: "Outorgado(a) / Procurador(a)",
    objetoLabel: "Poderes Concedidos",
    valorLabel: "Limite de Valor para Atos (R$)",
    prazoLabel: "Prazo de Validade da Procuração",
    camposExtras: ["tipo_procuracao", "poderes_especificos", "substabelecimento", "finalidade_procuracao"]
  },
  { 
    value: "declaracao", 
    label: "Declaração", 
    icon: ClipboardList,
    parteALabel: "Declarante",
    parteBLabel: "Destinatário (opcional)",
    objetoLabel: "Fato/Situação Declarada",
    valorLabel: "Valor Relacionado (se aplicável) (R$)",
    prazoLabel: "Validade da Declaração",
    camposExtras: ["tipo_declaracao", "finalidade_declaracao", "documentos_anexos"]
  },
  { 
    value: "notificacao", 
    label: "Notificação Extrajudicial", 
    icon: AlertTriangle,
    parteALabel: "Notificante (Quem notifica)",
    parteBLabel: "Notificado(a)",
    objetoLabel: "Fato/Situação Objeto da Notificação",
    valorLabel: "Valor em Discussão (se aplicável) (R$)",
    prazoLabel: "Prazo para Resposta/Regularização",
    camposExtras: ["motivo_notificacao", "providencias_exigidas", "consequencias_descumprimento"]
  },
  { 
    value: "termo_entrega", 
    label: "Termo de Entrega de Chaves", 
    icon: Home,
    parteALabel: "Entregador(a) (Proprietário/Vendedor)",
    parteBLabel: "Recebedor(a) (Comprador/Locatário)",
    objetoLabel: "Imóvel Objeto da Entrega",
    valorLabel: "Valor do Imóvel (R$)",
    prazoLabel: "Data da Entrega",
    camposExtras: ["estado_conservacao", "leitura_medidores", "chaves_entregues", "pendencias"]
  },
  { 
    value: "termo_vistoria", 
    label: "Termo de Vistoria", 
    icon: Search,
    parteALabel: "Vistoriador(a) / Proprietário(a)",
    parteBLabel: "Vistoriado(a) / Locatário(a)",
    objetoLabel: "Imóvel Vistoriado",
    valorLabel: "Valor Estimado de Reparos (se houver) (R$)",
    prazoLabel: "Data da Vistoria",
    camposExtras: ["tipo_vistoria", "estado_geral", "itens_vistoriados", "fotos_anexas", "observacoes_vistoria"]
  },
];

const categoriasInsights = [
  { value: "compra_venda", label: "Compra e Venda de Imóveis" },
  { value: "locacao", label: "Locação de Imóveis" },
  { value: "construcao", label: "Construção Civil" },
  { value: "condominio", label: "Direito Condominial" },
  { value: "financiamento", label: "Financiamento Imobiliário" },
  { value: "incorporacao", label: "Incorporação Imobiliária" },
  { value: "usucapiao", label: "Usucapião" },
  { value: "registros", label: "Registros e Cartórios" },
];

export default function AssistenteJuridico() {
  const [activeTab, setActiveTab] = useState("gerar");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Estados para geração de documentos
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [dadosDocumento, setDadosDocumento] = useState({
    parteA: "",
    parteB: "",
    objeto: "",
    unidadeId: "",
    valor: "",
    prazo: "",
    clausulasEspeciais: "",
    detalhesAdicionais: "",
    testemunhaA_nome: "",
    testemunhaA_cpf: "",
    testemunhaB_nome: "",
    testemunhaB_cpf: "",
    // Campos extras por tipo de documento
    // Compra e Venda
    forma_pagamento: "",
    entrada: "",
    parcelas: "",
    indice_correcao: "",
    data_entrega_posse: "",
    // Locação
    caucao: "",
    fiador: "",
    dia_vencimento: "",
    indice_reajuste: "",
    finalidade_locacao: "",
    // Parceria
    percentual_participacao: "",
    distribuicao_lucros: "",
    responsabilidades: "",
    clausula_saida: "",
    // Prestação de Serviços
    forma_pagamento_servico: "",
    cronograma_entregas: "",
    penalidade_atraso: "",
    garantia_servico: "",
    // Empreitada
    tipo_empreitada: "",
    memorial_descritivo: "",
    cronograma_obra: "",
    retencao_garantia: "",
    responsavel_materiais: "",
    // Distrato
    motivo_distrato: "",
    multa_rescisoria: "",
    valores_pagos: "",
    forma_devolucao: "",
    // Aditivo
    numero_contrato_original: "",
    data_contrato_original: "",
    alteracoes_especificas: "",
    // Procuração
    tipo_procuracao: "",
    poderes_especificos: "",
    substabelecimento: "",
    finalidade_procuracao: "",
    // Declaração
    tipo_declaracao: "",
    finalidade_declaracao: "",
    documentos_anexos: "",
    // Notificação
    motivo_notificacao: "",
    providencias_exigidas: "",
    consequencias_descumprimento: "",
    // Termo Entrega
    estado_conservacao: "",
    leitura_medidores: "",
    chaves_entregues: "",
    pendencias: "",
    // Termo Vistoria
    tipo_vistoria: "",
    estado_geral: "",
    itens_vistoriados: "",
    fotos_anexas: "",
    observacoes_vistoria: "",
  });

  // Pegar configuração do tipo selecionado
  const tipoConfig = tiposDocumento.find(t => t.value === tipoDocumento);

  // Estados para análise de documentos
  const [arquivoUrl, setArquivoUrl] = useState("");
  const [textoAnalise, setTextoAnalise] = useState("");
  const [tipoAnalise, setTipoAnalise] = useState("riscos");

  // Estados para resumo
  const [textoResumo, setTextoResumo] = useState("");

  // Estados para insights
  const [categoriaInsight, setCategoriaInsight] = useState("");
  const [perguntaInsight, setPerguntaInsight] = useState("");

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: socios = [] } = useQuery({
    queryKey: ['socios'],
    queryFn: () => base44.entities.Socio.list(),
  });

  // Estados para dialogs de busca
  const [showSearchClienteA, setShowSearchClienteA] = useState(false);
  const [showSearchFornecedorA, setShowSearchFornecedorA] = useState(false);
  const [showSearchClienteB, setShowSearchClienteB] = useState(false);
  const [showSearchFornecedorB, setShowSearchFornecedorB] = useState(false);
  const [showSearchUnidade, setShowSearchUnidade] = useState(false);
  const [showSearchSocio, setShowSearchSocio] = useState(false);
  const [socioIndexBusca, setSocioIndexBusca] = useState(null);
  const [showNovoParticipante, setShowNovoParticipante] = useState(false);
  const [novoParticipanteIndex, setNovoParticipanteIndex] = useState(null);
  const [novoParticipante, setNovoParticipante] = useState({ nome: "", cpf_cnpj: "", endereco: "", percentual: "" });

  // Estado para lista de sócios (parceria)
  const [listaSocios, setListaSocios] = useState([
    { nome: "", cpf_cnpj: "", endereco: "", percentual: "" },
    { nome: "", cpf_cnpj: "", endereco: "", percentual: "" },
  ]);

  const adicionarSocio = () => {
    setListaSocios([...listaSocios, { nome: "", cpf_cnpj: "", endereco: "", percentual: "" }]);
  };

  const removerSocio = (index) => {
    if (listaSocios.length > 2) {
      setListaSocios(listaSocios.filter((_, i) => i !== index));
    }
  };

  const atualizarSocio = (index, campo, valor) => {
    const novos = [...listaSocios];
    novos[index][campo] = valor;
    setListaSocios(novos);
  };

  const preencherSocioComDados = (index, dados) => {
    const novos = [...listaSocios];
    novos[index] = {
      nome: dados.nome || "",
      cpf_cnpj: dados.cpf_cnpj || dados.cpf || "",
      endereco: dados.endereco || `${dados.logradouro || ""}, ${dados.numero || ""}, ${dados.bairro || ""}, ${dados.cidade || ""}-${dados.estado || ""}`,
      percentual: novos[index].percentual || "",
    };
    setListaSocios(novos);
  };

  const handleBuscarSocio = (index) => {
    setSocioIndexBusca(index);
    setShowSearchSocio(true);
  };

  const handleNovoParticipante = (index) => {
    setNovoParticipanteIndex(index);
    setNovoParticipante({ nome: "", cpf_cnpj: "", endereco: "", percentual: "" });
    setShowNovoParticipante(true);
  };

  const confirmarNovoParticipante = () => {
    if (novoParticipanteIndex !== null) {
      const novos = [...listaSocios];
      novos[novoParticipanteIndex] = { ...novoParticipante };
      setListaSocios(novos);
    }
    setShowNovoParticipante(false);
    setNovoParticipanteIndex(null);
  };

  // Função para preencher Parte A com cliente ou fornecedor
  const preencherParteA = (tipo, id) => {
    if (tipo === 'cliente') {
      const cliente = clientes.find(c => c.id === id);
      if (cliente) {
        setDadosDocumento(prev => ({
          ...prev,
          parteA: `${cliente.nome}, inscrito no CPF/CNPJ sob o nº ${cliente.cpf_cnpj || '_______________'}, residente e domiciliado em ${cliente.logradouro ? `${cliente.logradouro}, ${cliente.numero || 'S/N'}, ${cliente.bairro || ''}, ${cliente.cidade || ''}-${cliente.estado || ''}` : '_______________'}`
        }));
      }
    } else if (tipo === 'fornecedor') {
      const fornecedor = fornecedores.find(f => f.id === id);
      if (fornecedor) {
        setDadosDocumento(prev => ({
          ...prev,
          parteA: `${fornecedor.razao_social || fornecedor.nome}, inscrita no CNPJ sob o nº ${fornecedor.cnpj || '_______________'}, com sede em ${fornecedor.logradouro ? `${fornecedor.logradouro}, ${fornecedor.numero || 'S/N'}, ${fornecedor.bairro || ''}, ${fornecedor.cidade || ''}-${fornecedor.estado || ''}` : '_______________'}`
        }));
      }
    }
  };

  // Função para preencher Parte B com cliente ou fornecedor
  const preencherParteB = (tipo, id) => {
    if (tipo === 'cliente') {
      const cliente = clientes.find(c => c.id === id);
      if (cliente) {
        setDadosDocumento(prev => ({
          ...prev,
          parteB: `${cliente.nome}, inscrito no CPF/CNPJ sob o nº ${cliente.cpf_cnpj || '_______________'}, residente e domiciliado em ${cliente.logradouro ? `${cliente.logradouro}, ${cliente.numero || 'S/N'}, ${cliente.bairro || ''}, ${cliente.cidade || ''}-${cliente.estado || ''}` : '_______________'}`
        }));
      }
    } else if (tipo === 'fornecedor') {
      const fornecedor = fornecedores.find(f => f.id === id);
      if (fornecedor) {
        setDadosDocumento(prev => ({
          ...prev,
          parteB: `${fornecedor.razao_social || fornecedor.nome}, inscrita no CNPJ sob o nº ${fornecedor.cnpj || '_______________'}, com sede em ${fornecedor.logradouro ? `${fornecedor.logradouro}, ${fornecedor.numero || 'S/N'}, ${fornecedor.bairro || ''}, ${fornecedor.cidade || ''}-${fornecedor.estado || ''}` : '_______________'}`
        }));
      }
    }
  };

  // Função para selecionar unidade e preencher objeto/valor
  const selecionarUnidade = (unidadeId) => {
    const unidade = unidades.find(u => u.id === unidadeId);
    if (unidade) {
      const loteamento = loteamentos.find(l => l.id === unidade.loteamento_id);
      setDadosDocumento(prev => ({
        ...prev,
        unidadeId: unidadeId,
        objeto: `Unidade ${unidade.codigo}${loteamento ? ` do empreendimento ${loteamento.nome}` : ''}, com área de ${unidade.area_total || '___'} m², ${unidade.endereco ? `localizada em ${unidade.endereco}` : ''}, matrícula nº ${unidade.matricula || '_______________'}`,
        valor: unidade.valor_venda ? unidade.valor_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : prev.valor,
      }));
    }
  };

  // Função para gerar documento
  const handleGerarDocumento = async () => {
    if (!tipoDocumento) {
      toast.error("Selecione o tipo de documento");
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      const tipoLabel = tiposDocumento.find(t => t.value === tipoDocumento)?.label;
      
      // Montar dados extras específicos do tipo
      const dadosExtras = {};
      if (tipoConfig?.camposExtras) {
        tipoConfig.camposExtras.forEach(campo => {
          if (dadosDocumento[campo]) {
            dadosExtras[campo] = dadosDocumento[campo];
          }
        });
      }

      const prompt = `Você é um advogado especialista em direito imobiliário e contratos. 
Gere um ${tipoLabel} completo, profissional e juridicamente válido no Brasil.

DADOS DO DOCUMENTO:
- Tipo: ${tipoLabel}
- ${tipoConfig?.parteALabel || 'Parte A'}: ${dadosDocumento.parteA || 'A definir'}
- ${tipoConfig?.parteBLabel || 'Parte B'}: ${dadosDocumento.parteB || 'A definir'}
- ${tipoConfig?.objetoLabel || 'Objeto'}: ${dadosDocumento.objeto || 'A definir'}
- ${tipoConfig?.valorLabel || 'Valor'}: ${dadosDocumento.valor || 'A definir'}
- ${tipoConfig?.prazoLabel || 'Prazo'}: ${dadosDocumento.prazo || 'A definir'}
- Cláusulas Especiais Solicitadas: ${dadosDocumento.clausulasEspeciais || 'Nenhuma'}
- Detalhes Adicionais: ${dadosDocumento.detalhesAdicionais || 'Nenhum'}
- Testemunha 1: ${dadosDocumento.testemunhaA_nome || 'A definir'}, CPF: ${dadosDocumento.testemunhaA_cpf || 'A definir'}
- Testemunha 2: ${dadosDocumento.testemunhaB_nome || 'A definir'}, CPF: ${dadosDocumento.testemunhaB_cpf || 'A definir'}

DADOS ESPECÍFICOS DO TIPO DE DOCUMENTO:
${Object.entries(dadosExtras).map(([k, v]) => `- ${k.replace(/_/g, ' ').toUpperCase()}: ${v}`).join('\n') || 'Nenhum dado específico informado'}

${tipoDocumento === 'contrato_parceria' ? `
SÓCIOS/PARCEIROS DO CONTRATO:
${listaSocios.map((s, i) => `
Sócio ${i + 1}:
- Nome: ${s.nome || 'A definir'}
- CPF/CNPJ: ${s.cpf_cnpj || 'A definir'}
- Endereço: ${s.endereco || 'A definir'}
- Percentual de Participação: ${s.percentual || 'A definir'}
`).join('\n')}
` : ''}

INSTRUÇÕES:
1. Crie um documento completo com todas as cláusulas necessárias
2. Inclua cláusulas de proteção para ambas as partes
3. Adicione cláusulas sobre inadimplemento, multas e rescisão
4. Inclua cláusula de foro
5. Use linguagem jurídica formal mas clara
6. Formate adequadamente com numeração de cláusulas
7. Inclua espaços para assinaturas e testemunhas
8. Considere a legislação brasileira vigente (Código Civil, Lei do Inquilinato, etc.)

Gere o documento completo em formato texto.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            documento: { type: "string", description: "Texto completo do documento" },
            observacoes: { type: "string", description: "Observações importantes sobre o documento" },
            clausulas_principais: { 
              type: "array", 
              items: { type: "string" },
              description: "Lista das principais cláusulas do documento" 
            },
          },
        },
      });

      setResultado({
        tipo: "documento",
        dados: response,
      });
      toast.success("Documento gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar documento: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para analisar documento
  const handleAnalisarDocumento = async () => {
    if (!textoAnalise && !arquivoUrl) {
      toast.error("Cole o texto do documento ou faça upload de um arquivo");
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      let textoParaAnalise = textoAnalise;

      // Se tiver arquivo, extrair texto
      if (arquivoUrl && !textoAnalise) {
        const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: arquivoUrl,
          json_schema: {
            type: "object",
            properties: {
              texto_completo: { type: "string" },
            },
          },
        });
        textoParaAnalise = extracted.output?.texto_completo || "";
      }

      const tiposAnalisePrompt = {
        riscos: "Identifique TODOS os riscos jurídicos, cláusulas abusivas, pontos de vulnerabilidade e possíveis problemas legais.",
        inconsistencias: "Encontre inconsistências, contradições, ambiguidades e falhas técnicas no documento.",
        clausulas_faltantes: "Liste cláusulas importantes que estão faltando e deveriam estar presentes neste tipo de documento.",
        compliance: "Verifique a conformidade com a legislação brasileira vigente (Código Civil, CDC, Lei do Inquilinato, etc.)",
        completa: "Faça uma análise completa incluindo riscos, inconsistências, cláusulas faltantes e compliance.",
      };

      const prompt = `Você é um advogado especialista em análise de contratos imobiliários e de construção civil.

DOCUMENTO PARA ANÁLISE:
${textoParaAnalise}

TIPO DE ANÁLISE SOLICITADA: ${tiposAnalisePrompt[tipoAnalise]}

Realize uma análise jurídica detalhada e profissional do documento acima.

Para cada ponto identificado:
1. Descreva o problema ou risco
2. Explique o impacto potencial
3. Sugira uma solução ou correção
4. Indique o nível de gravidade (alto, médio, baixo)

Seja específico e cite trechos do documento quando relevante.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            resumo_analise: { type: "string", description: "Resumo executivo da análise" },
            score_risco: { type: "number", description: "Score de risco de 0 a 100 (0=sem risco, 100=alto risco)" },
            pontos_criticos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  descricao: { type: "string" },
                  gravidade: { type: "string", enum: ["alta", "media", "baixa"] },
                  sugestao: { type: "string" },
                  trecho_relacionado: { type: "string" },
                },
              },
            },
            pontos_positivos: {
              type: "array",
              items: { type: "string" },
            },
            recomendacoes_gerais: {
              type: "array",
              items: { type: "string" },
            },
            legislacao_aplicavel: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      });

      setResultado({
        tipo: "analise",
        dados: response,
      });
      toast.success("Análise concluída!");
    } catch (error) {
      toast.error("Erro na análise: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para resumir documento
  const handleResumirDocumento = async () => {
    if (!textoResumo) {
      toast.error("Cole o texto do documento para resumir");
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      const prompt = `Você é um advogado especialista em direito imobiliário.

DOCUMENTO:
${textoResumo}

Crie um resumo executivo completo deste documento jurídico incluindo:
1. Tipo de documento e partes envolvidas
2. Objeto principal
3. Principais obrigações de cada parte
4. Valores e prazos importantes
5. Cláusulas mais relevantes
6. Penalidades e multas previstas
7. Condições de rescisão
8. Pontos de atenção

O resumo deve ser claro, objetivo e permitir uma compreensão rápida do documento sem precisar lê-lo integralmente.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            tipo_documento: { type: "string" },
            partes: {
              type: "object",
              properties: {
                parte_a: { type: "string" },
                parte_b: { type: "string" },
              },
            },
            objeto: { type: "string" },
            resumo_executivo: { type: "string" },
            principais_obrigacoes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  parte: { type: "string" },
                  obrigacao: { type: "string" },
                },
              },
            },
            valores_prazos: {
              type: "array",
              items: { type: "string" },
            },
            clausulas_importantes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  descricao: { type: "string" },
                },
              },
            },
            penalidades: {
              type: "array",
              items: { type: "string" },
            },
            pontos_atencao: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      });

      setResultado({
        tipo: "resumo",
        dados: response,
      });
      toast.success("Resumo gerado!");
    } catch (error) {
      toast.error("Erro ao resumir: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para obter insights
  const handleObterInsights = async () => {
    if (!categoriaInsight && !perguntaInsight) {
      toast.error("Selecione uma categoria ou faça uma pergunta");
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      const categoriaLabel = categoriasInsights.find(c => c.value === categoriaInsight)?.label;
      
      const prompt = `Você é um advogado especialista em direito imobiliário e construção civil no Brasil, com amplo conhecimento prático e teórico.

${categoriaInsight ? `CATEGORIA: ${categoriaLabel}` : ''}
${perguntaInsight ? `PERGUNTA ESPECÍFICA: ${perguntaInsight}` : ''}

${categoriaInsight && !perguntaInsight ? `
Forneça insights práticos e atualizados sobre ${categoriaLabel}, incluindo:
1. Principais aspectos legais e regulamentações
2. Boas práticas do mercado
3. Cuidados e precauções importantes
4. Erros comuns a evitar
5. Tendências e mudanças recentes na legislação
6. Dicas práticas para profissionais do setor
` : ''}

${perguntaInsight ? `
Responda de forma completa, prática e fundamentada na legislação brasileira vigente.
Inclua exemplos práticos quando relevante.
Cite a legislação aplicável.
` : ''}

Seja didático mas profissional.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            introducao: { type: "string" },
            topicos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  conteudo: { type: "string" },
                  dicas: { type: "array", items: { type: "string" } },
                },
              },
            },
            legislacao_relevante: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  lei: { type: "string" },
                  descricao: { type: "string" },
                },
              },
            },
            alertas_importantes: {
              type: "array",
              items: { type: "string" },
            },
            conclusao: { type: "string" },
          },
        },
      });

      setResultado({
        tipo: "insights",
        dados: response,
      });
      toast.success("Insights gerados!");
    } catch (error) {
      toast.error("Erro ao obter insights: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Upload de arquivo
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setArquivoUrl(file_url);
      toast.success("Arquivo carregado!");
    } catch (error) {
      toast.error("Erro no upload: " + error.message);
    }
  };

  // Copiar resultado
  const handleCopiar = (texto) => {
    navigator.clipboard.writeText(texto);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--wine-700)] flex items-center gap-3">
            <Scale className="w-8 h-8" />
            Assistente Jurídico IA
          </h1>
          <p className="text-gray-600 mt-1">
            Geração, análise e insights jurídicos para o setor imobiliário
          </p>
        </div>
        <Badge className="bg-purple-100 text-purple-800 px-4 py-2">
          <Brain className="w-4 h-4 mr-2" />
          Powered by AI
        </Badge>
      </div>

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-1">
          <TabsTrigger value="gerar" className="flex items-center gap-2">
            <FileSignature className="w-4 h-4" />
            <span className="hidden sm:inline">Gerar</span> Documento
          </TabsTrigger>
          <TabsTrigger value="analisar" className="flex items-center gap-2">
            <FileSearch className="w-4 h-4" />
            <span className="hidden sm:inline">Analisar</span> Documento
          </TabsTrigger>
          <TabsTrigger value="resumir" className="flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            <span className="hidden sm:inline">Resumir</span> Documento
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights <span className="hidden sm:inline">Jurídicos</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Gerar Documento */}
        <TabsContent value="gerar" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="w-5 h-5" />
                  Gerar Documento Legal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Documento *</Label>
                  <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposDocumento.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          <div className="flex items-center gap-2">
                            <tipo.icon className="w-4 h-4" />
                            {tipo.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Parte A */}
                <div className="space-y-2">
                  <Label>{tipoConfig?.parteALabel || "Parte A"}</Label>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSearchClienteA(true)}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Buscar Cliente
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSearchFornecedorA(true)}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Buscar Empresa
                    </Button>
                  </div>
                  <Textarea
                    value={dadosDocumento.parteA}
                    onChange={(e) => setDadosDocumento({ ...dadosDocumento, parteA: e.target.value })}
                    placeholder={`Nome completo, CPF/CNPJ e endereço - ${tipoConfig?.parteALabel || "Parte A"}`}
                    rows={2}
                  />
                </div>

                {/* Parte B */}
                <div className="space-y-2">
                  <Label>{tipoConfig?.parteBLabel || "Parte B"}</Label>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSearchClienteB(true)}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Buscar Cliente
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSearchFornecedorB(true)}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Buscar Empresa
                    </Button>
                  </div>
                  <Textarea
                    value={dadosDocumento.parteB}
                    onChange={(e) => setDadosDocumento({ ...dadosDocumento, parteB: e.target.value })}
                    placeholder={`Nome completo, CPF/CNPJ e endereço - ${tipoConfig?.parteBLabel || "Parte B"}`}
                    rows={2}
                  />
                </div>

                {/* Objeto do Contrato */}
                <div className="space-y-2">
                  <Label>{tipoConfig?.objetoLabel || "Objeto"}</Label>
                  {["contrato_compra_venda", "contrato_locacao", "termo_entrega", "termo_vistoria"].includes(tipoDocumento) && (
                    <div className="flex gap-2 mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSearchUnidade(true)}
                        className="w-full justify-start"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Selecionar Unidade Cadastrada
                      </Button>
                    </div>
                  )}
                  <Textarea
                    value={dadosDocumento.objeto}
                    onChange={(e) => setDadosDocumento({ ...dadosDocumento, objeto: e.target.value })}
                    placeholder={tipoConfig?.objetoLabel || "Descreva o objeto..."}
                    rows={2}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{tipoConfig?.valorLabel || "Valor (R$)"}</Label>
                    <Input
                      value={dadosDocumento.valor}
                      onChange={(e) => setDadosDocumento({ ...dadosDocumento, valor: e.target.value })}
                      placeholder="Ex: 500.000,00"
                    />
                    {dadosDocumento.unidadeId && (
                      <p className="text-xs text-green-600">Valor preenchido da unidade selecionada (editável)</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{tipoConfig?.prazoLabel || "Prazo"}</Label>
                    <Input
                      value={dadosDocumento.prazo}
                      onChange={(e) => setDadosDocumento({ ...dadosDocumento, prazo: e.target.value })}
                      placeholder="Ex: 12 meses, indeterminado..."
                    />
                  </div>
                </div>

                {/* CAMPOS ESPECÍFICOS POR TIPO DE DOCUMENTO */}
                {tipoDocumento === "contrato_compra_venda" && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
                    <p className="font-semibold text-blue-800 text-sm">Dados Específicos - Compra e Venda</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Forma de Pagamento</Label>
                        <Select value={dadosDocumento.forma_pagamento} onValueChange={(v) => setDadosDocumento({...dadosDocumento, forma_pagamento: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a_vista">À Vista</SelectItem>
                            <SelectItem value="parcelado_direto">Parcelado Direto</SelectItem>
                            <SelectItem value="financiamento">Financiamento Bancário</SelectItem>
                            <SelectItem value="consorcio">Consórcio</SelectItem>
                            <SelectItem value="permuta">Permuta</SelectItem>
                            <SelectItem value="misto">Misto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Valor da Entrada (R$)</Label>
                        <Input value={dadosDocumento.entrada} onChange={(e) => setDadosDocumento({...dadosDocumento, entrada: e.target.value})} placeholder="Ex: 50.000,00" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Número de Parcelas</Label>
                        <Input value={dadosDocumento.parcelas} onChange={(e) => setDadosDocumento({...dadosDocumento, parcelas: e.target.value})} placeholder="Ex: 60 parcelas" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Índice de Correção</Label>
                        <Select value={dadosDocumento.indice_correcao} onValueChange={(v) => setDadosDocumento({...dadosDocumento, indice_correcao: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nenhum">Sem correção</SelectItem>
                            <SelectItem value="igpm">IGP-M</SelectItem>
                            <SelectItem value="ipca">IPCA</SelectItem>
                            <SelectItem value="incc">INCC</SelectItem>
                            <SelectItem value="cub">CUB</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm">Data Prevista para Entrega da Posse</Label>
                        <Input type="date" value={dadosDocumento.data_entrega_posse} onChange={(e) => setDadosDocumento({...dadosDocumento, data_entrega_posse: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}

                {tipoDocumento === "contrato_locacao" && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-4">
                    <p className="font-semibold text-green-800 text-sm">Dados Específicos - Locação</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Finalidade da Locação</Label>
                        <Select value={dadosDocumento.finalidade_locacao} onValueChange={(v) => setDadosDocumento({...dadosDocumento, finalidade_locacao: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="residencial">Residencial</SelectItem>
                            <SelectItem value="comercial">Comercial</SelectItem>
                            <SelectItem value="temporada">Temporada</SelectItem>
                            <SelectItem value="industrial">Industrial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Dia do Vencimento</Label>
                        <Input value={dadosDocumento.dia_vencimento} onChange={(e) => setDadosDocumento({...dadosDocumento, dia_vencimento: e.target.value})} placeholder="Ex: 10" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Valor da Caução (R$)</Label>
                        <Input value={dadosDocumento.caucao} onChange={(e) => setDadosDocumento({...dadosDocumento, caucao: e.target.value})} placeholder="Ex: 3 aluguéis" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Índice de Reajuste</Label>
                        <Select value={dadosDocumento.indice_reajuste} onValueChange={(v) => setDadosDocumento({...dadosDocumento, indice_reajuste: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="igpm">IGP-M</SelectItem>
                            <SelectItem value="ipca">IPCA</SelectItem>
                            <SelectItem value="ipc">IPC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm">Fiador (Nome, CPF e Endereço)</Label>
                        <Textarea value={dadosDocumento.fiador} onChange={(e) => setDadosDocumento({...dadosDocumento, fiador: e.target.value})} placeholder="Dados completos do fiador ou 'Sem fiador'" rows={2} />
                      </div>
                    </div>
                  </div>
                )}

                {tipoDocumento === "contrato_parceria" && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-purple-800 text-sm">Sócios / Parceiros do Contrato</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={adicionarSocio}
                        className="text-purple-700 border-purple-300"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Sócio
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {listaSocios.map((socio, index) => (
                        <div key={index} className="p-3 bg-white rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-sm font-semibold text-purple-800">
                              Sócio/Parceiro {index + 1}
                            </Label>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleBuscarSocio(index)}
                                title="Buscar sócio cadastrado"
                              >
                                <Search className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleNovoParticipante(index)}
                                title="Cadastrar novo participante"
                              >
                                <UserPlus className="w-4 h-4" />
                              </Button>
                              {listaSocios.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removerSocio(index)}
                                  className="text-red-600"
                                  title="Remover sócio"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="grid md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Nome Completo</Label>
                              <Input
                                value={socio.nome}
                                onChange={(e) => atualizarSocio(index, 'nome', e.target.value)}
                                placeholder="Nome completo"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">CPF/CNPJ</Label>
                              <Input
                                value={socio.cpf_cnpj}
                                onChange={(e) => atualizarSocio(index, 'cpf_cnpj', e.target.value)}
                                placeholder="000.000.000-00"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Percentual (%)</Label>
                              <Input
                                value={socio.percentual}
                                onChange={(e) => atualizarSocio(index, 'percentual', e.target.value)}
                                placeholder="Ex: 50%"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1 md:col-span-3">
                              <Label className="text-xs">Endereço</Label>
                              <Input
                                value={socio.endereco}
                                onChange={(e) => atualizarSocio(index, 'endereco', e.target.value)}
                                placeholder="Endereço completo"
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-purple-200">
                      <div className="space-y-2">
                        <Label className="text-sm">Distribuição de Lucros</Label>
                        <Input value={dadosDocumento.distribuicao_lucros} onChange={(e) => setDadosDocumento({...dadosDocumento, distribuicao_lucros: e.target.value})} placeholder="Ex: Proporcional, Mensal, etc." />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Cláusula de Saída/Dissolução</Label>
                        <Input value={dadosDocumento.clausula_saida} onChange={(e) => setDadosDocumento({...dadosDocumento, clausula_saida: e.target.value})} placeholder="Condições para saída..." />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm">Responsabilidades de Cada Parte</Label>
                        <Textarea value={dadosDocumento.responsabilidades} onChange={(e) => setDadosDocumento({...dadosDocumento, responsabilidades: e.target.value})} placeholder="Descreva as responsabilidades..." rows={2} />
                      </div>
                    </div>
                  </div>
                )}

                {tipoDocumento === "contrato_prestacao_servicos" && (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 space-y-4">
                    <p className="font-semibold text-orange-800 text-sm">Dados Específicos - Prestação de Serviços</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Forma de Pagamento</Label>
                        <Select value={dadosDocumento.forma_pagamento_servico} onValueChange={(v) => setDadosDocumento({...dadosDocumento, forma_pagamento_servico: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a_vista">À Vista na Conclusão</SelectItem>
                            <SelectItem value="parcelado">Parcelado</SelectItem>
                            <SelectItem value="por_etapa">Por Etapa Concluída</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Penalidade por Atraso (%)</Label>
                        <Input value={dadosDocumento.penalidade_atraso} onChange={(e) => setDadosDocumento({...dadosDocumento, penalidade_atraso: e.target.value})} placeholder="Ex: 2% ao mês" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm">Cronograma de Entregas</Label>
                        <Textarea value={dadosDocumento.cronograma_entregas} onChange={(e) => setDadosDocumento({...dadosDocumento, cronograma_entregas: e.target.value})} placeholder="Descreva etapas e prazos..." rows={2} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm">Garantia do Serviço</Label>
                        <Input value={dadosDocumento.garantia_servico} onChange={(e) => setDadosDocumento({...dadosDocumento, garantia_servico: e.target.value})} placeholder="Ex: 90 dias após conclusão" />
                      </div>
                    </div>
                  </div>
                )}

                {tipoDocumento === "contrato_empreitada" && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 space-y-4">
                    <p className="font-semibold text-yellow-800 text-sm">Dados Específicos - Empreitada</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Tipo de Empreitada</Label>
                        <Select value={dadosDocumento.tipo_empreitada} onValueChange={(v) => setDadosDocumento({...dadosDocumento, tipo_empreitada: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="global">Global (Preço Fechado)</SelectItem>
                            <SelectItem value="por_administracao">Por Administração</SelectItem>
                            <SelectItem value="mista">Mista</SelectItem>
                            <SelectItem value="por_medicao">Por Medição</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Responsável pelos Materiais</Label>
                        <Select value={dadosDocumento.responsavel_materiais} onValueChange={(v) => setDadosDocumento({...dadosDocumento, responsavel_materiais: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="empreiteiro">Empreiteiro</SelectItem>
                            <SelectItem value="contratante">Contratante</SelectItem>
                            <SelectItem value="misto">Misto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Retenção de Garantia (%)</Label>
                        <Input value={dadosDocumento.retencao_garantia} onChange={(e) => setDadosDocumento({...dadosDocumento, retencao_garantia: e.target.value})} placeholder="Ex: 5% do valor total" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Memorial Descritivo</Label>
                        <Input value={dadosDocumento.memorial_descritivo} onChange={(e) => setDadosDocumento({...dadosDocumento, memorial_descritivo: e.target.value})} placeholder="Anexo ou referência" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm">Cronograma da Obra</Label>
                        <Textarea value={dadosDocumento.cronograma_obra} onChange={(e) => setDadosDocumento({...dadosDocumento, cronograma_obra: e.target.value})} placeholder="Etapas e prazos..." rows={2} />
                      </div>
                    </div>
                  </div>
                )}

                {tipoDocumento === "distrato" && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-4">
                    <p className="font-semibold text-red-800 text-sm">Dados Específicos - Distrato/Rescisão</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Motivo do Distrato</Label>
                        <Select value={dadosDocumento.motivo_distrato} onValueChange={(v) => setDadosDocumento({...dadosDocumento, motivo_distrato: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="comum_acordo">Comum Acordo</SelectItem>
                            <SelectItem value="inadimplemento">Inadimplemento</SelectItem>
                            <SelectItem value="desistencia">Desistência</SelectItem>
                            <SelectItem value="forca_maior">Força Maior</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Multa Rescisória (R$)</Label>
                        <Input value={dadosDocumento.multa_rescisoria} onChange={(e) => setDadosDocumento({...dadosDocumento, multa_rescisoria: e.target.value})} placeholder="Ex: 10% do valor" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Valores já Pagos (R$)</Label>
                        <Input value={dadosDocumento.valores_pagos} onChange={(e) => setDadosDocumento({...dadosDocumento, valores_pagos: e.target.value})} placeholder="Total pago até o momento" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Forma de Devolução</Label>
                        <Select value={dadosDocumento.forma_devolucao} onValueChange={(v) => setDadosDocumento({...dadosDocumento, forma_devolucao: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a_vista">À Vista</SelectItem>
                            <SelectItem value="parcelado">Parcelado</SelectItem>
                            <SelectItem value="compensacao">Compensação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {tipoDocumento === "aditivo" && (
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 space-y-4">
                    <p className="font-semibold text-indigo-800 text-sm">Dados Específicos - Aditivo Contratual</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Nº do Contrato Original</Label>
                        <Input value={dadosDocumento.numero_contrato_original} onChange={(e) => setDadosDocumento({...dadosDocumento, numero_contrato_original: e.target.value})} placeholder="Número de identificação" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Data do Contrato Original</Label>
                        <Input type="date" value={dadosDocumento.data_contrato_original} onChange={(e) => setDadosDocumento({...dadosDocumento, data_contrato_original: e.target.value})} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm">Alterações Específicas</Label>
                        <Textarea value={dadosDocumento.alteracoes_especificas} onChange={(e) => setDadosDocumento({...dadosDocumento, alteracoes_especificas: e.target.value})} placeholder="Descreva detalhadamente as alterações..." rows={3} />
                      </div>
                    </div>
                  </div>
                )}

                {tipoDocumento === "procuracao" && (
                  <div className="p-4 bg-teal-50 rounded-lg border border-teal-200 space-y-4">
                    <p className="font-semibold text-teal-800 text-sm">Dados Específicos - Procuração</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Tipo de Procuração</Label>
                        <Select value={dadosDocumento.tipo_procuracao} onValueChange={(v) => setDadosDocumento({...dadosDocumento, tipo_procuracao: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ad_judicia">Ad Judicia (Judicial)</SelectItem>
                            <SelectItem value="ad_negotia">Ad Negotia (Negócios)</SelectItem>
                            <SelectItem value="ampla">Ampla/Geral</SelectItem>
                            <SelectItem value="especifica">Específica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Substabelecimento</Label>
                        <Select value={dadosDocumento.substabelecimento} onValueChange={(v) => setDadosDocumento({...dadosDocumento, substabelecimento: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="com">Com poderes para substabelecer</SelectItem>
                            <SelectItem value="sem">Sem poderes para substabelecer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm">Poderes Específicos</Label>
                        <Textarea value={dadosDocumento.poderes_especificos} onChange={(e) => setDadosDocumento({...dadosDocumento, poderes_especificos: e.target.value})} placeholder="Descreva os poderes concedidos..." rows={3} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm">Finalidade da Procuração</Label>
                        <Input value={dadosDocumento.finalidade_procuracao} onChange={(e) => setDadosDocumento({...dadosDocumento, finalidade_procuracao: e.target.value})} placeholder="Ex: Venda de imóvel, representação em assembleia..." />
                      </div>
                    </div>
                  </div>
                )}

                {tipoDocumento === "declaracao" && (
                  <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200 space-y-4">
                    <p className="font-semibold text-cyan-800 text-sm">Dados Específicos - Declaração</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Tipo de Declaração</Label>
                        <Select value={dadosDocumento.tipo_declaracao} onValueChange={(v) => setDadosDocumento({...dadosDocumento, tipo_declaracao: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="residencia">Residência</SelectItem>
                            <SelectItem value="quitacao">Quitação</SelectItem>
                            <SelectItem value="responsabilidade">Responsabilidade</SelectItem>
                            <SelectItem value="ausencia_debitos">Ausência de Débitos</SelectItem>
                            <SelectItem value="uniao_estavel">União Estável</SelectItem>
                            <SelectItem value="hipossuficiencia">Hipossuficiência</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Finalidade da Declaração</Label>
                        <Input value={dadosDocumento.finalidade_declaracao} onChange={(e) => setDadosDocumento({...dadosDocumento, finalidade_declaracao: e.target.value})} placeholder="Para que será utilizada" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm">Documentos Anexos (referência)</Label>
                        <Input value={dadosDocumento.documentos_anexos} onChange={(e) => setDadosDocumento({...dadosDocumento, documentos_anexos: e.target.value})} placeholder="Ex: RG, CPF, Comprovante de residência" />
                      </div>
                    </div>
                  </div>
                )}

                {tipoDocumento === "notificacao" && (
                  <div className="p-4 bg-rose-50 rounded-lg border border-rose-200 space-y-4">
                    <p className="font-semibold text-rose-800 text-sm">Dados Específicos - Notificação Extrajudicial</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Motivo da Notificação</Label>
                        <Select value={dadosDocumento.motivo_notificacao} onValueChange={(v) => setDadosDocumento({...dadosDocumento, motivo_notificacao: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cobranca">Cobrança de Débito</SelectItem>
                            <SelectItem value="rescisao">Rescisão de Contrato</SelectItem>
                            <SelectItem value="desocupacao">Desocupação de Imóvel</SelectItem>
                            <SelectItem value="cumprimento">Cumprimento de Obrigação</SelectItem>
                            <SelectItem value="cessacao">Cessação de Conduta</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Consequências do Descumprimento</Label>
                        <Input value={dadosDocumento.consequencias_descumprimento} onChange={(e) => setDadosDocumento({...dadosDocumento, consequencias_descumprimento: e.target.value})} placeholder="Ex: Medidas judiciais cabíveis" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm">Providências Exigidas</Label>
                        <Textarea value={dadosDocumento.providencias_exigidas} onChange={(e) => setDadosDocumento({...dadosDocumento, providencias_exigidas: e.target.value})} placeholder="O que se exige do notificado..." rows={2} />
                      </div>
                    </div>
                  </div>
                )}

                {tipoDocumento === "termo_entrega" && (
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 space-y-4">
                    <p className="font-semibold text-emerald-800 text-sm">Dados Específicos - Termo de Entrega de Chaves</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Estado de Conservação</Label>
                        <Select value={dadosDocumento.estado_conservacao} onValueChange={(v) => setDadosDocumento({...dadosDocumento, estado_conservacao: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excelente">Excelente</SelectItem>
                            <SelectItem value="bom">Bom</SelectItem>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="necessita_reparos">Necessita Reparos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Chaves Entregues</Label>
                        <Input value={dadosDocumento.chaves_entregues} onChange={(e) => setDadosDocumento({...dadosDocumento, chaves_entregues: e.target.value})} placeholder="Ex: 3 chaves porta principal, 2 garagem" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Leitura dos Medidores</Label>
                        <Input value={dadosDocumento.leitura_medidores} onChange={(e) => setDadosDocumento({...dadosDocumento, leitura_medidores: e.target.value})} placeholder="Luz: ___ / Água: ___ / Gás: ___" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Pendências (se houver)</Label>
                        <Input value={dadosDocumento.pendencias} onChange={(e) => setDadosDocumento({...dadosDocumento, pendencias: e.target.value})} placeholder="Listar pendências ou 'Nenhuma'" />
                      </div>
                    </div>
                  </div>
                )}

                {tipoDocumento === "termo_vistoria" && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-4">
                    <p className="font-semibold text-amber-800 text-sm">Dados Específicos - Termo de Vistoria</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Tipo de Vistoria</Label>
                        <Select value={dadosDocumento.tipo_vistoria} onValueChange={(v) => setDadosDocumento({...dadosDocumento, tipo_vistoria: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entrada">Entrada (Início Locação)</SelectItem>
                            <SelectItem value="saida">Saída (Fim Locação)</SelectItem>
                            <SelectItem value="periodica">Periódica</SelectItem>
                            <SelectItem value="entrega_obra">Entrega de Obra</SelectItem>
                            <SelectItem value="pre_venda">Pré-Venda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Estado Geral do Imóvel</Label>
                        <Select value={dadosDocumento.estado_geral} onValueChange={(v) => setDadosDocumento({...dadosDocumento, estado_geral: v})}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excelente">Excelente</SelectItem>
                            <SelectItem value="bom">Bom</SelectItem>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="ruim">Ruim</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm">Itens Vistoriados (resumo)</Label>
                        <Textarea value={dadosDocumento.itens_vistoriados} onChange={(e) => setDadosDocumento({...dadosDocumento, itens_vistoriados: e.target.value})} placeholder="Paredes, pisos, instalações elétricas/hidráulicas, esquadrias..." rows={2} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm">Observações da Vistoria</Label>
                        <Textarea value={dadosDocumento.observacoes_vistoria} onChange={(e) => setDadosDocumento({...dadosDocumento, observacoes_vistoria: e.target.value})} placeholder="Defeitos encontrados, reparos necessários..." rows={2} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Cláusulas Especiais (opcional)</Label>
                  <Textarea
                    value={dadosDocumento.clausulasEspeciais}
                    onChange={(e) => setDadosDocumento({ ...dadosDocumento, clausulasEspeciais: e.target.value })}
                    placeholder="Descreva cláusulas específicas que deseja incluir..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Detalhes Adicionais (opcional)</Label>
                  <Textarea
                    value={dadosDocumento.detalhesAdicionais}
                    onChange={(e) => setDadosDocumento({ ...dadosDocumento, detalhesAdicionais: e.target.value })}
                    placeholder="Outras informações relevantes..."
                    rows={2}
                  />
                </div>

                {/* Testemunhas */}
                <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
                  <Label className="font-semibold">Testemunhas</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Testemunha 1 - Nome</Label>
                      <Input
                        value={dadosDocumento.testemunhaA_nome}
                        onChange={(e) => setDadosDocumento({ ...dadosDocumento, testemunhaA_nome: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Testemunha 1 - CPF</Label>
                      <Input
                        value={dadosDocumento.testemunhaA_cpf}
                        onChange={(e) => setDadosDocumento({ ...dadosDocumento, testemunhaA_cpf: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Testemunha 2 - Nome</Label>
                      <Input
                        value={dadosDocumento.testemunhaB_nome}
                        onChange={(e) => setDadosDocumento({ ...dadosDocumento, testemunhaB_nome: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Testemunha 2 - CPF</Label>
                      <Input
                        value={dadosDocumento.testemunhaB_cpf}
                        onChange={(e) => setDadosDocumento({ ...dadosDocumento, testemunhaB_cpf: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGerarDocumento}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando documento...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar Documento com IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Resultado - Documento Gerado */}
            {resultado?.tipo === "documento" && (
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle2 className="w-5 h-5" />
                      Documento Gerado
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleCopiar(resultado.dados.documento)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {resultado.dados.observacoes && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Observações Importantes
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">{resultado.dados.observacoes}</p>
                    </div>
                  )}

                  {resultado.dados.clausulas_principais?.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-2">Cláusulas Principais:</p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {resultado.dados.clausulas_principais.map((c, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 mt-1 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {resultado.dados.documento}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Analisar Documento */}
        <TabsContent value="analisar" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="w-5 h-5" />
                  Analisar Documento Legal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Análise</Label>
                  <Select value={tipoAnalise} onValueChange={setTipoAnalise}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="riscos">Identificar Riscos</SelectItem>
                      <SelectItem value="inconsistencias">Encontrar Inconsistências</SelectItem>
                      <SelectItem value="clausulas_faltantes">Cláusulas Faltantes</SelectItem>
                      <SelectItem value="compliance">Verificar Compliance</SelectItem>
                      <SelectItem value="completa">Análise Completa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Upload de Documento (PDF ou Imagem)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                  />
                  {arquivoUrl && (
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Arquivo carregado
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Ou cole o texto do documento</Label>
                  <Textarea
                    value={textoAnalise}
                    onChange={(e) => setTextoAnalise(e.target.value)}
                    placeholder="Cole aqui o texto completo do documento para análise..."
                    rows={10}
                  />
                </div>

                <Button
                  onClick={handleAnalisarDocumento}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analisando documento...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Analisar Documento
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Resultado - Análise */}
            {resultado?.tipo === "analise" && (
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <FileSearch className="w-5 h-5" />
                    Resultado da Análise
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Score de Risco */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Score de Risco</span>
                      <span className={`font-bold text-lg ${
                        resultado.dados.score_risco > 70 ? 'text-red-600' :
                        resultado.dados.score_risco > 40 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {resultado.dados.score_risco}/100
                      </span>
                    </div>
                    <Progress 
                      value={resultado.dados.score_risco} 
                      className={`h-3 ${
                        resultado.dados.score_risco > 70 ? '[&>div]:bg-red-500' :
                        resultado.dados.score_risco > 40 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'
                      }`}
                    />
                  </div>

                  {/* Resumo */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800">Resumo da Análise</p>
                    <p className="text-sm text-blue-700 mt-1">{resultado.dados.resumo_analise}</p>
                  </div>

                  {/* Pontos Críticos */}
                  {resultado.dados.pontos_criticos?.length > 0 && (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="criticos">
                        <AccordionTrigger className="text-red-700">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Pontos Críticos ({resultado.dados.pontos_criticos.length})
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            {resultado.dados.pontos_criticos.map((ponto, i) => (
                              <div key={i} className={`p-3 rounded-lg border ${
                                ponto.gravidade === 'alta' ? 'bg-red-50 border-red-200' :
                                ponto.gravidade === 'media' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-gray-50 border-gray-200'
                              }`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">{ponto.titulo}</span>
                                  <Badge className={
                                    ponto.gravidade === 'alta' ? 'bg-red-100 text-red-700' :
                                    ponto.gravidade === 'media' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                  }>
                                    {ponto.gravidade}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700">{ponto.descricao}</p>
                                {ponto.sugestao && (
                                  <p className="text-sm text-green-700 mt-2">
                                    <strong>Sugestão:</strong> {ponto.sugestao}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}

                  {/* Pontos Positivos */}
                  {resultado.dados.pontos_positivos?.length > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-800 mb-2">Pontos Positivos</p>
                      <ul className="text-sm text-green-700 space-y-1">
                        {resultado.dados.pontos_positivos.map((p, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 mt-1 flex-shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recomendações */}
                  {resultado.dados.recomendacoes_gerais?.length > 0 && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm font-medium text-purple-800 mb-2">Recomendações</p>
                      <ul className="text-sm text-purple-700 space-y-1">
                        {resultado.dados.recomendacoes_gerais.map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Lightbulb className="w-3 h-3 mt-1 flex-shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Resumir Documento */}
        <TabsContent value="resumir" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5" />
                  Resumir Documento Legal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cole o texto do documento</Label>
                  <Textarea
                    value={textoResumo}
                    onChange={(e) => setTextoResumo(e.target.value)}
                    placeholder="Cole aqui o texto completo do documento para resumir..."
                    rows={15}
                  />
                </div>

                <Button
                  onClick={handleResumirDocumento}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resumindo documento...
                    </>
                  ) : (
                    <>
                      <ListChecks className="w-4 h-4 mr-2" />
                      Gerar Resumo Executivo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Resultado - Resumo */}
            {resultado?.tipo === "resumo" && (
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <ListChecks className="w-5 h-5" />
                    Resumo Executivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium">Tipo de Documento</p>
                      <p className="font-semibold text-blue-900">{resultado.dados.tipo_documento}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-purple-600 font-medium">Objeto</p>
                      <p className="font-semibold text-purple-900 text-sm">{resultado.dados.objeto}</p>
                    </div>
                  </div>

                  {resultado.dados.partes && (
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium">Parte A</p>
                        <p className="text-sm">{resultado.dados.partes.parte_a}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium">Parte B</p>
                        <p className="text-sm">{resultado.dados.partes.parte_b}</p>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Resumo Executivo</p>
                    <p className="text-sm text-gray-700">{resultado.dados.resumo_executivo}</p>
                  </div>

                  {resultado.dados.principais_obrigacoes?.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-2">Principais Obrigações</p>
                      <div className="space-y-2">
                        {resultado.dados.principais_obrigacoes.map((o, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-medium text-blue-700">{o.parte}:</span>{" "}
                            <span className="text-blue-600">{o.obrigacao}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resultado.dados.valores_prazos?.length > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-2">Valores e Prazos</p>
                      <ul className="text-sm text-green-700 space-y-1">
                        {resultado.dados.valores_prazos.map((v, i) => (
                          <li key={i}>• {v}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {resultado.dados.penalidades?.length > 0 && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-red-800 mb-2">Penalidades</p>
                      <ul className="text-sm text-red-700 space-y-1">
                        {resultado.dados.penalidades.map((p, i) => (
                          <li key={i}>• {p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {resultado.dados.pontos_atencao?.length > 0 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-2">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        Pontos de Atenção
                      </p>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {resultado.dados.pontos_atencao.map((p, i) => (
                          <li key={i}>• {p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Insights Jurídicos */}
        <TabsContent value="insights" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Insights Jurídicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={categoriaInsight} onValueChange={setCategoriaInsight}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasInsights.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ou faça uma pergunta específica</Label>
                  <Textarea
                    value={perguntaInsight}
                    onChange={(e) => setPerguntaInsight(e.target.value)}
                    placeholder="Ex: Quais são os cuidados ao comprar um imóvel na planta? Quais cláusulas são essenciais em um contrato de empreitada?"
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleObterInsights}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Pesquisando...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Obter Insights
                    </>
                  )}
                </Button>

                {/* Sugestões de perguntas */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-3">Sugestões de perguntas:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Cuidados na compra de imóvel na planta",
                      "Direitos do locatário na Lei do Inquilinato",
                      "Cláusulas essenciais em contrato de empreitada",
                      "Como funciona a alienação fiduciária?",
                      "Direitos do comprador em caso de atraso na entrega",
                    ].map((sugestao, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => setPerguntaInsight(sugestao)}
                        className="text-xs"
                      >
                        {sugestao}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resultado - Insights */}
            {resultado?.tipo === "insights" && (
              <Card className="border-yellow-200">
                <CardHeader className="bg-yellow-50">
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <Lightbulb className="w-5 h-5" />
                    {resultado.dados.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                  {resultado.dados.introducao && (
                    <p className="text-sm text-gray-700">{resultado.dados.introducao}</p>
                  )}

                  {resultado.dados.topicos?.map((topico, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">{topico.titulo}</h4>
                      <p className="text-sm text-gray-700 mb-3">{topico.conteudo}</p>
                      {topico.dicas?.length > 0 && (
                        <div className="space-y-1">
                          {topico.dicas.map((dica, j) => (
                            <p key={j} className="text-sm text-blue-700 flex items-start gap-2">
                              <CheckCircle2 className="w-3 h-3 mt-1 flex-shrink-0" />
                              {dica}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {resultado.dados.legislacao_relevante?.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Legislação Relevante
                      </p>
                      <div className="space-y-2">
                        {resultado.dados.legislacao_relevante.map((leg, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-medium text-blue-700">{leg.lei}:</span>{" "}
                            <span className="text-blue-600">{leg.descricao}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resultado.dados.alertas_importantes?.length > 0 && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="font-medium text-red-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Alertas Importantes
                      </p>
                      <ul className="text-sm text-red-700 space-y-1">
                        {resultado.dados.alertas_importantes.map((a, i) => (
                          <li key={i}>• {a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {resultado.dados.conclusao && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="font-medium text-green-800 mb-2">Conclusão</p>
                      <p className="text-sm text-green-700">{resultado.dados.conclusao}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs de Busca com CRUD */}
      <SearchClienteDialog
        open={showSearchClienteA}
        onClose={() => setShowSearchClienteA(false)}
        clientes={clientes}
        onSelect={(cliente) => {
          preencherParteA('cliente', cliente.id);
          setShowSearchClienteA(false);
        }}
      />

      <SearchFornecedorDialog
        open={showSearchFornecedorA}
        onClose={() => setShowSearchFornecedorA(false)}
        fornecedores={fornecedores}
        onSelect={(fornecedor) => {
          preencherParteA('fornecedor', fornecedor.id);
          setShowSearchFornecedorA(false);
        }}
      />

      <SearchClienteDialog
        open={showSearchClienteB}
        onClose={() => setShowSearchClienteB(false)}
        clientes={clientes}
        onSelect={(cliente) => {
          preencherParteB('cliente', cliente.id);
          setShowSearchClienteB(false);
        }}
      />

      <SearchFornecedorDialog
        open={showSearchFornecedorB}
        onClose={() => setShowSearchFornecedorB(false)}
        fornecedores={fornecedores}
        onSelect={(fornecedor) => {
          preencherParteB('fornecedor', fornecedor.id);
          setShowSearchFornecedorB(false);
        }}
      />

      <SearchUnidadeDialog
        open={showSearchUnidade}
        onClose={() => setShowSearchUnidade(false)}
        unidades={unidades}
        onSelect={(unidade) => {
          selecionarUnidade(unidade.id);
          setShowSearchUnidade(false);
        }}
      />

      {/* Dialog Buscar Sócio Cadastrado */}
      <Dialog open={showSearchSocio} onOpenChange={setShowSearchSocio}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Buscar Sócio Cadastrado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-20">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {socios.length > 0 ? (
                    socios.map((s) => (
                      <TableRow key={s.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell className="font-medium">{s.nome}</TableCell>
                        <TableCell>{s.cpf_cnpj}</TableCell>
                        <TableCell>{s.telefone || '-'}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => {
                              preencherSocioComDados(socioIndexBusca, s);
                              setShowSearchSocio(false);
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        Nenhum sócio cadastrado no sistema
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => {
                setShowSearchSocio(false);
                handleNovoParticipante(socioIndexBusca);
              }}>
                <UserPlus className="w-4 h-4 mr-2" />
                Cadastrar Novo Participante
              </Button>
              <Button variant="outline" onClick={() => setShowSearchSocio(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Participante (não salva no banco) */}
      <Dialog open={showNovoParticipante} onOpenChange={setShowNovoParticipante}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Novo Participante
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 -mt-2">
            Este participante será usado apenas neste documento e não será salvo no cadastro de sócios do sistema.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={novoParticipante.nome}
                onChange={(e) => setNovoParticipante({...novoParticipante, nome: e.target.value})}
                placeholder="Nome completo do participante"
              />
            </div>
            <div className="space-y-2">
              <Label>CPF/CNPJ *</Label>
              <Input
                value={novoParticipante.cpf_cnpj}
                onChange={(e) => setNovoParticipante({...novoParticipante, cpf_cnpj: e.target.value})}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço Completo</Label>
              <Textarea
                value={novoParticipante.endereco}
                onChange={(e) => setNovoParticipante({...novoParticipante, endereco: e.target.value})}
                placeholder="Rua, número, bairro, cidade, estado, CEP"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Percentual de Participação (%)</Label>
              <Input
                value={novoParticipante.percentual}
                onChange={(e) => setNovoParticipante({...novoParticipante, percentual: e.target.value})}
                placeholder="Ex: 25%"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovoParticipante(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarNovoParticipante} disabled={!novoParticipante.nome || !novoParticipante.cpf_cnpj}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}