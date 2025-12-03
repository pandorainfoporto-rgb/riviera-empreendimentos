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
  Home, FileSignature, Gavel, ClipboardList, Info
} from "lucide-react";
import { toast } from "sonner";

const tiposDocumento = [
  { value: "contrato_compra_venda", label: "Contrato de Compra e Venda", icon: FileSignature },
  { value: "contrato_locacao", label: "Contrato de Locação", icon: Home },
  { value: "contrato_parceria", label: "Contrato de Parceria/Sociedade", icon: Users },
  { value: "contrato_prestacao_servicos", label: "Contrato de Prestação de Serviços", icon: FileText },
  { value: "contrato_empreitada", label: "Contrato de Empreitada", icon: Building },
  { value: "distrato", label: "Distrato/Rescisão", icon: FileText },
  { value: "aditivo", label: "Aditivo Contratual", icon: FileText },
  { value: "procuracao", label: "Procuração", icon: Gavel },
  { value: "declaracao", label: "Declaração", icon: ClipboardList },
  { value: "notificacao", label: "Notificação Extrajudicial", icon: AlertTriangle },
  { value: "termo_entrega", label: "Termo de Entrega de Chaves", icon: Home },
  { value: "termo_vistoria", label: "Termo de Vistoria", icon: Search },
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
    valor: "",
    prazo: "",
    clausulasEspeciais: "",
    detalhesAdicionais: "",
  });

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
      
      const prompt = `Você é um advogado especialista em direito imobiliário e contratos. 
Gere um ${tipoLabel} completo, profissional e juridicamente válido no Brasil.

DADOS DO DOCUMENTO:
- Tipo: ${tipoLabel}
- Parte A (Contratante/Vendedor/Locador): ${dadosDocumento.parteA || 'A definir'}
- Parte B (Contratado/Comprador/Locatário): ${dadosDocumento.parteB || 'A definir'}
- Objeto: ${dadosDocumento.objeto || 'A definir'}
- Valor: ${dadosDocumento.valor || 'A definir'}
- Prazo: ${dadosDocumento.prazo || 'A definir'}
- Cláusulas Especiais Solicitadas: ${dadosDocumento.clausulasEspeciais || 'Nenhuma'}
- Detalhes Adicionais: ${dadosDocumento.detalhesAdicionais || 'Nenhum'}

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

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Parte A (Contratante/Vendedor)</Label>
                    <Input
                      value={dadosDocumento.parteA}
                      onChange={(e) => setDadosDocumento({ ...dadosDocumento, parteA: e.target.value })}
                      placeholder="Nome completo e CPF/CNPJ"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parte B (Contratado/Comprador)</Label>
                    <Input
                      value={dadosDocumento.parteB}
                      onChange={(e) => setDadosDocumento({ ...dadosDocumento, parteB: e.target.value })}
                      placeholder="Nome completo e CPF/CNPJ"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Objeto do Contrato</Label>
                  <Textarea
                    value={dadosDocumento.objeto}
                    onChange={(e) => setDadosDocumento({ ...dadosDocumento, objeto: e.target.value })}
                    placeholder="Descreva o objeto do contrato (ex: imóvel, serviço, parceria...)"
                    rows={2}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      value={dadosDocumento.valor}
                      onChange={(e) => setDadosDocumento({ ...dadosDocumento, valor: e.target.value })}
                      placeholder="Ex: 500.000,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo</Label>
                    <Input
                      value={dadosDocumento.prazo}
                      onChange={(e) => setDadosDocumento({ ...dadosDocumento, prazo: e.target.value })}
                      placeholder="Ex: 12 meses, indeterminado..."
                    />
                  </div>
                </div>

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
    </div>
  );
}