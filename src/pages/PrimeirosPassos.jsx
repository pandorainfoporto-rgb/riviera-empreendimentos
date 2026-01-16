import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle2, Circle, Rocket, PlayCircle, BookOpen, Users,
  Building2, MapPin, FileText, Settings, DollarSign, HardHat,
  ArrowRight, Sparkles, Video, MessageSquare, Calendar, Clock, Lightbulb, Play
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";

export default function PrimeirosPassos() {
  const [activeVideo, setActiveVideo] = useState(null);
  const [showTutorialDialog, setShowTutorialDialog] = useState(false);
  const [tutorialData, setTutorialData] = useState(null);
  const [generatingTutorial, setGeneratingTutorial] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Verificar dados existentes para calcular progresso
  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas_check'],
    queryFn: () => base44.entities.Empresa.list(),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos_check'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes_check'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores_check'],
    queryFn: () => base44.entities.Fornecedor.list(),
  });

  const { data: socios = [] } = useQuery({
    queryKey: ['socios_check'],
    queryFn: () => base44.entities.Socio.list(),
  });

  const checklistItens = [
    {
      id: 'empresa',
      titulo: '1. Cadastrar Dados da Empresa',
      descricao: 'Configure os dados básicos da sua incorporadora',
      concluido: empresas.length > 0,
      link: 'Empresas',
      icon: Building2,
      tempo: '5 min',
      prioridade: 'alta'
    },
    {
      id: 'loteamento',
      titulo: '2. Criar Primeiro Loteamento',
      descricao: 'Cadastre seu primeiro empreendimento com mapa de lotes',
      concluido: loteamentos.length > 0,
      link: 'Loteamentos',
      icon: MapPin,
      tempo: '15 min',
      prioridade: 'alta'
    },
    {
      id: 'clientes',
      titulo: '3. Cadastrar Clientes',
      descricao: 'Adicione seus primeiros clientes ao sistema',
      concluido: clientes.length > 0,
      link: 'Clientes',
      icon: Users,
      tempo: '10 min',
      prioridade: 'média'
    },
    {
      id: 'fornecedores',
      titulo: '4. Cadastrar Fornecedores',
      descricao: 'Registre fornecedores de materiais e serviços',
      concluido: fornecedores.length > 0,
      link: 'Fornecedores',
      icon: HardHat,
      tempo: '10 min',
      prioridade: 'média'
    },
    {
      id: 'socios',
      titulo: '5. Cadastrar Sócios (Opcional)',
      descricao: 'Se aplicável, cadastre os sócios da empresa',
      concluido: socios.length > 0,
      link: 'Socios',
      icon: Users,
      tempo: '5 min',
      prioridade: 'baixa'
    },
    {
      id: 'financeiro',
      titulo: '6. Configurar Caixas',
      descricao: 'Configure contas bancárias e caixas',
      concluido: false,
      link: 'Caixas',
      icon: DollarSign,
      tempo: '10 min',
      prioridade: 'alta'
    },
  ];

  const itensConcluidos = checklistItens.filter(i => i.concluido).length;
  const progresso = (itensConcluidos / checklistItens.length) * 100;

  const handleGerarTutorial = async (titulo) => {
    setGeneratingTutorial(true);
    toast.info("Gerando vídeo tutorial com IA... Isso pode levar até 2 minutos");
    try {
      const response = await base44.functions.invoke('gerarTutorialVideo', {
        modulo: "Primeiros Passos",
        funcionalidade: titulo
      });

      setTutorialData(response.data);
      setShowTutorialDialog(true);
      toast.success("Vídeo tutorial gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar tutorial: " + error.message);
    } finally {
      setGeneratingTutorial(false);
    }
  };

  const tutoriaisVideo = [
    {
      id: 'intro',
      titulo: 'Visão Geral do Sistema',
      descricao: 'Conheça o sistema Riviera e suas principais funcionalidades',
      duracao: '5 min',
      topicos: [
        'Interface e navegação',
        'Módulos disponíveis',
        'Fluxo de trabalho básico',
        'Onde encontrar ajuda'
      ]
    },
    {
      id: 'loteamentos',
      titulo: 'Cadastro de Loteamentos',
      descricao: 'Aprenda a cadastrar loteamentos e mapear lotes visualmente',
      duracao: '10 min',
      topicos: [
        'Wizard de cadastro',
        'Upload de planta DWG',
        'Mapeamento visual de lotes',
        'Status e cores dos lotes'
      ]
    },
    {
      id: 'negociacoes',
      titulo: 'Processo de Vendas',
      descricao: 'Fluxo completo desde a intenção até o contrato',
      duracao: '15 min',
      topicos: [
        'Intenção de compra com mapa',
        'Custo de obra',
        'Criação de negociação',
        'Geração de contratos'
      ]
    },
    {
      id: 'financeiro',
      titulo: 'Gestão Financeira',
      descricao: 'Como gerenciar recebimentos e pagamentos',
      duracao: '12 min',
      topicos: [
        'Caixas e contas',
        'Receber de clientes',
        'Pagar fornecedores',
        'Relatórios financeiros'
      ]
    },
    {
      id: 'obras',
      titulo: 'Gestão de Obras',
      descricao: 'Cronograma, execução e custos de obra',
      duracao: '10 min',
      topicos: [
        'Criar cronograma',
        'Registrar execução',
        'Upload de fotos',
        'Controle de custos'
      ]
    },
  ];

  const guiasRapidos = [
    {
      titulo: 'Como vender meu primeiro lote?',
      icon: MapPin,
      passos: [
        'Cadastre o loteamento em Cadastros > Loteamentos',
        'Use o wizard para mapear os lotes visualmente',
        'Cadastre o cliente em Cadastros > Clientes',
        'Crie uma Intenção de Compra selecionando o lote no mapa',
        'Gere o Custo de Obra a partir da intenção',
        'Crie a Negociação com valores e condições',
        'Gere as parcelas e o contrato',
        'Aprove o contrato para finalizar'
      ]
    },
    {
      titulo: 'Como receber pagamento de cliente?',
      icon: DollarSign,
      passos: [
        'Acesse Gestão > Receber',
        'Encontre a parcela pendente',
        'Clique em "Receber"',
        'Escolha a forma de pagamento (PIX, Boleto, Dinheiro, etc)',
        'Selecione o caixa de destino',
        'Confirme - sistema atualiza automaticamente'
      ]
    },
    {
      titulo: 'Como dar acesso ao portal do cliente?',
      icon: Users,
      passos: [
        'Acesse Cadastros > Clientes',
        'Edite o cliente',
        'Ative "Tem acesso ao portal"',
        'Sistema enviará email de convite automaticamente',
        'Cliente cria senha no primeiro acesso',
        'Cliente pode acompanhar obra, pagar online, ver documentos'
      ]
    },
    {
      titulo: 'Como registrar uma compra?',
      icon: HardHat,
      passos: [
        'Acesse Operacional > Compras',
        'Clique em "Nova Compra"',
        'Opção 1: Upload XML da nota fiscal (automático)',
        'Opção 2: Cadastro manual de produtos',
        'Vincule à unidade/obra',
        'Sistema gera pagamento automaticamente',
        'Atualiza estoque'
      ]
    },
  ];

  const recursosAvancados = [
    {
      titulo: 'Integração Bancária',
      descricao: 'Emissão de boletos e conciliação automática',
      link: 'IntegracaoBancaria',
      icon: DollarSign,
    },
    {
      titulo: 'Assistente Jurídico IA',
      descricao: 'Geração e análise de contratos com IA',
      link: 'AssistenteJuridico',
      icon: FileText,
    },
    {
      titulo: 'Dashboard Customizável',
      descricao: 'Monte seu dashboard personalizado',
      link: 'DashboardCustomizavel',
      icon: Settings,
    },
    {
      titulo: 'Gestão de Tarefas',
      descricao: 'Visão unificada de todas as tarefas',
      link: 'GestaoTarefas',
      icon: Calendar,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Rocket className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Bem-vindo ao Sistema Riviera!</h1>
            <p className="text-white/90 text-sm sm:text-base">
              Configure seu sistema em poucos passos e comece a gerenciar seus empreendimentos hoje mesmo.
            </p>
            <Badge className="bg-white/20 text-white mt-3">v4.6.0 - Janeiro 2026</Badge>
          </div>
        </div>
      </div>

      {/* Progresso Geral */}
      <Card className="border-2 border-[var(--wine-300)] shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)]">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--wine-700)]" />
              Progresso da Configuração Inicial
            </span>
            <Badge className={progresso === 100 ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}>
              {itensConcluidos} de {checklistItens.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Configuração Completa</span>
              <span className="font-bold text-[var(--wine-700)]">{progresso.toFixed(0)}%</span>
            </div>
            <Progress value={progresso} className="h-3" />
          </div>

          <div className="space-y-3">
            {checklistItens.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                  item.concluido 
                    ? 'bg-green-50 border-green-200' 
                    : item.prioridade === 'alta'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {item.concluido ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`font-semibold ${item.concluido ? 'text-green-900' : 'text-gray-900'}`}>
                      {item.titulo}
                    </h3>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {item.tempo}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{item.descricao}</p>
                  {!item.concluido && (
                    <Link to={createPageUrl(item.link)}>
                      <Button size="sm" className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]">
                        <item.icon className="w-4 h-4 mr-2" />
                        Começar Agora
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {progresso === 100 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900">Parabéns! Configuração Completa!</h3>
                  <p className="text-sm text-green-700">Você está pronto para começar a usar o sistema.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guias Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Guias Rápidos - Como Fazer
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            {guiasRapidos.map((guia, idx) => (
              <Card key={idx} className="border-l-4 border-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <guia.icon className="w-5 h-5 text-blue-600" />
                    {guia.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {guia.passos.map((passo, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="text-gray-700">{passo}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tutoriais Detalhados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-purple-600" />
            Tutoriais em Vídeo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Assista aos tutoriais para dominar cada módulo do sistema. Em breve com vídeos demonstrativos.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutoriaisVideo.map((tutorial) => (
              <Card key={tutorial.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mb-3 flex items-center justify-center">
                    <Video className="w-12 h-12 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-1">{tutorial.titulo}</h3>
                  <p className="text-xs text-gray-600 mb-2">{tutorial.descricao}</p>
                  <Badge variant="outline" className="text-xs mb-3">
                    <PlayCircle className="w-3 h-3 mr-1" />
                    {tutorial.duracao}
                  </Badge>
                  <div className="mb-3 pt-3 border-t">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Você vai aprender:</p>
                    <ul className="space-y-1">
                      {tutorial.topicos.map((topico, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                          {topico}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => handleGerarTutorial(tutorial.titulo)}
                    disabled={generatingTutorial}
                  >
                    {generatingTutorial ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Gerar Tutorial IA
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recursos Avançados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-600" />
            Recursos Avançados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Após a configuração básica, explore recursos avançados para turbinar sua gestão.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recursosAvancados.map((recurso) => (
              <Link key={recurso.link} to={createPageUrl(recurso.link)}>
                <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <recurso.icon className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{recurso.titulo}</h3>
                    <p className="text-xs text-gray-600">{recurso.descricao}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            Perguntas Frequentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Como funciona o sistema de filtros no mapa de lotes?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-gray-700 mb-2">
                  No wizard de Intenção de Compra, ao selecionar o lote, você pode usar filtros avançados:
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                  <li><strong>Status:</strong> Filtre apenas lotes disponíveis, reservados, em negociação ou vendidos</li>
                  <li><strong>Preço:</strong> Defina faixa de valor mínimo e máximo</li>
                  <li><strong>Área:</strong> Filtre por área mínima e máxima em m²</li>
                  <li><strong>Busca:</strong> Pesquise por número do lote ou quadra</li>
                </ul>
                <p className="text-sm text-gray-700 mt-2">
                  O mapa atualiza dinamicamente mostrando apenas lotes que atendem aos critérios.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Como funciona a geração automática de contratos?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-gray-700">
                  O sistema usa IA para gerar contratos completos. Na negociação, clique em "Gerar Contrato", 
                  escolha o template, selecione os dados a incluir (cliente, unidade, financeiro) e a IA criará 
                  um contrato profissional com todas as cláusulas necessárias. Você pode revisar e editar antes de aprovar.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Os clientes conseguem pagar parcelas online?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-gray-700">
                  Sim! Ao dar acesso ao portal do cliente, ele pode pagar parcelas via PIX, Cartão de Crédito ou 
                  Boleto Bancário. O pagamento é confirmado automaticamente via webhook e lançado no caixa configurado.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Como funciona o mapeamento visual de lotes?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-gray-700">
                  Ao cadastrar um loteamento, você pode fazer upload da planta (DWG convertido em imagem) e 
                  delimitar cada lote clicando nos cantos. O sistema cria polígonos interativos que mostram 
                  status em cores diferentes: verde (disponível), amarelo (reservado), azul (negociação) e vermelho (vendido).
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Posso importar notas fiscais XML automaticamente?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-gray-700">
                  Sim! Em Operacional &gt; Compras, faça upload do XML da NF-e. O sistema extrai automaticamente 
                  todos os dados: fornecedor, produtos, valores, quantidades. Cria pagamentos, atualiza estoque 
                  e vincula à obra. Tudo em segundos!
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>Como configurar permissões para outros usuários?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-gray-700">
                  Vá em Configurações &gt; Grupos de Permissões. Crie grupos (ex: &quot;Financeiro&quot;, &quot;Obras&quot;, &quot;Vendas&quot;) 
                  e configure quais módulos cada grupo pode acessar. Depois, em Gerenciar Usuários, convide 
                  pessoas e associe ao grupo correto. Cada usuário só verá o que tem permissão.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>O que fazer se tiver dúvidas ou problemas?</AccordionTrigger>
              <AccordionContent>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>Você tem várias opções de ajuda:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Wiki:</strong> Menu Sobre &gt; Wiki / Documentação - Documentação completa</li>
                    <li><strong>Changelog:</strong> Menu Sobre &gt; Changelog - Veja todas as atualizações</li>
                    <li><strong>Assistente Riviera:</strong> Botão flutuante no canto direito - IA que responde dúvidas</li>
                    <li><strong>Suporte:</strong> Entre em contato com nossa equipe</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Recursos Avançados */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-t-4 border-orange-500">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Sparkles className="w-5 h-5" />
              Explore Recursos Avançados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {recursosAvancados.map((recurso) => (
                <Link key={recurso.link} to={createPageUrl(recurso.link)}>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <recurso.icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{recurso.titulo}</h4>
                      <p className="text-xs text-gray-600">{recurso.descricao}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-purple-500">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <BookOpen className="w-5 h-5" />
              Documentação Completa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-gray-700 mb-4">
              Acesse a documentação completa para aprender cada detalhe do sistema.
            </p>
            <div className="space-y-3">
              <Link to={createPageUrl('Wiki')}>
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Wiki & Documentação
                  <Badge className="ml-auto bg-purple-100 text-purple-700">Completo</Badge>
                </Button>
              </Link>
              <Link to={createPageUrl('Changelog')}>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Changelog
                  <Badge className="ml-auto bg-blue-100 text-blue-700">v4.6.0</Badge>
                </Button>
              </Link>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <p className="text-sm font-semibold text-purple-900 mb-2">💡 Dica Profissional</p>
              <p className="text-xs text-purple-800">
                Use o <strong>Assistente Riviera</strong> (botão flutuante no canto da tela) para 
                tirar dúvidas em tempo real. Ele conhece todo o sistema e pode ajudar com qualquer questão!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximos Passos */}
      {progresso === 100 && (
        <Card className="border-2 border-green-500 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Rocket className="w-5 h-5" />
              🎉 Próximos Passos - Comece a Operar!
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Link to={createPageUrl('IntencoesCompra')}>
                <Card className="hover:shadow-lg transition-all cursor-pointer h-full bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-4 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-bold text-sm mb-1">Criar Primeira Intenção</h3>
                    <p className="text-xs text-gray-600">Capture requisitos do cliente</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to={createPageUrl('Negociacoes')}>
                <Card className="hover:shadow-lg transition-all cursor-pointer h-full bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-bold text-sm mb-1">Fazer Primeira Venda</h3>
                    <p className="text-xs text-gray-600">Negocie e feche contrato</p>
                  </CardContent>
                </Card>
              </Link>

              <Link to={createPageUrl('CronogramaObra')}>
                <Card className="hover:shadow-lg transition-all cursor-pointer h-full bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardContent className="p-4 text-center">
                    <HardHat className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <h3 className="font-bold text-sm mb-1">Iniciar Primeira Obra</h3>
                    <p className="text-xs text-gray-600">Crie cronograma e execute</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog do Tutorial em Vídeo */}
      <Dialog open={showTutorialDialog} onOpenChange={setShowTutorialDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Video className="w-6 h-6 text-purple-600" />
              {tutorialData?.titulo}
            </DialogTitle>
          </DialogHeader>

          {tutorialData && (
            <div className="space-y-6 mt-4">
              {/* Vídeo Gerado */}
              {tutorialData.video_url && (
                <Card className="border-2 border-purple-500">
                  <CardContent className="p-0">
                    <video 
                      controls 
                      className="w-full rounded-lg"
                      src={tutorialData.video_url}
                      autoPlay
                    >
                      <source src={tutorialData.video_url} type="video/mp4" />
                      Seu navegador não suporta vídeo.
                    </video>
                  </CardContent>
                </Card>
              )}

              {/* Informações do Tutorial */}
              <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">Duração Estimada</p>
                  <p className="text-lg font-bold text-purple-700">{tutorialData.tutorial.duracao_estimada}</p>
                </div>
              </div>

              {/* Introdução */}
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Play className="w-5 h-5 text-purple-600 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-purple-900 mb-2">🎙️ Narração (Voz Feminina):</p>
                      <p className="text-gray-800 italic mb-3">"{tutorialData.tutorial.introducao.narracao}"</p>
                      <Badge className="bg-purple-600">{tutorialData.tutorial.introducao.legenda}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Passos */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Passo a Passo
                </h3>
                
                {tutorialData.tutorial.passos.map((passo) => (
                  <Card key={passo.numero} className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">
                            {passo.numero}
                          </span>
                          {passo.titulo}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {passo.tempo}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Narração */}
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs font-semibold text-purple-900 mb-1">🎙️ Narração (Voz Feminina):</p>
                        <p className="text-sm text-gray-800 italic">"{passo.narracao}"</p>
                      </div>

                      {/* Legenda */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">💬 Legenda:</span>
                        <Badge className="bg-purple-600">{passo.legenda}</Badge>
                      </div>

                      {/* Ação */}
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-semibold text-blue-900 mb-1">🖱️ Ação no Sistema:</p>
                        <p className="text-sm text-gray-800">{passo.acao}</p>
                      </div>

                      {/* Dica */}
                      {passo.dica && (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-xs font-semibold text-yellow-900 mb-1 flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" />
                            Dica:
                          </p>
                          <p className="text-sm text-gray-800">{passo.dica}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Conclusão */}
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-900 mb-2">🎙️ Conclusão:</p>
                      <p className="text-gray-800 italic mb-3">"{tutorialData.tutorial.conclusao.narracao}"</p>
                      <Badge className="bg-green-600">{tutorialData.tutorial.conclusao.legenda}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowTutorialDialog(false)}>
                  Fechar
                </Button>
                {tutorialData.video_url && (
                  <a href={tutorialData.video_url} download={`tutorial-${tutorialData.funcionalidade}.mp4`}>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Video className="w-4 h-4 mr-2" />
                      Baixar Vídeo
                    </Button>
                  </a>
                )}
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    const texto = JSON.stringify(tutorialData, null, 2);
                    navigator.clipboard.writeText(texto);
                    toast.success("Tutorial copiado!");
                  }}
                >
                  Copiar Script
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}