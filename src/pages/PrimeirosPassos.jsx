import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  CheckCircle2, Circle, Rocket, BookOpen, Users,
  Building2, MapPin, FileText, Settings, DollarSign, HardHat,
  ArrowRight, MessageSquare, Calendar, Video, PlayCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function PrimeirosPassos() {


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

  const { data: tutoriaisDestaque = [] } = useQuery({
    queryKey: ['tutoriais_primeiros_passos'],
    queryFn: async () => {
      const todos = await base44.entities.Tutorial.filter({ 
        ativo: true, 
        mostrar_primeiros_passos: true 
      }, 'ordem');
      return todos.filter(t => t.video_url);
    },
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
              <CheckCircle2 className="w-5 h-5 text-[var(--wine-700)]" />
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



      {/* Tutoriais em Vídeo */}
      {tutoriaisDestaque.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-600" />
              Tutoriais em Vídeo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tutoriaisDestaque.map((tutorial) => (
                <Card key={tutorial.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gray-900 rounded-lg mb-3 relative overflow-hidden group cursor-pointer">
                      <video 
                        className="w-full h-full object-cover"
                        controls
                      >
                        <source src={tutorial.video_url} type="video/mp4" />
                      </video>
                    </div>
                    <h4 className="font-semibold mb-1">{tutorial.titulo}</h4>
                    <p className="text-xs text-gray-600 mb-2">{tutorial.descricao}</p>
                    {tutorial.duracao && (
                      <Badge variant="outline" className="text-xs">
                        <PlayCircle className="w-3 h-3 mr-1" />
                        {tutorial.duracao}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Como funciona a geração automática de contratos?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-gray-700">
                  O sistema usa IA para gerar contratos completos. Na negociação, clique em "Gerar Contrato", 
                  escolha o template, selecione os dados a incluir e a IA criará um contrato profissional.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Os clientes conseguem pagar parcelas online?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-gray-700">
                  Sim! Ao dar acesso ao portal do cliente, ele pode pagar via PIX, Cartão ou Boleto. 
                  O pagamento é confirmado automaticamente.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Documentação */}
      <div className="grid md:grid-cols-2 gap-6">
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
          </CardContent>
        </Card>

        {progresso === 100 && (
          <Card className="border-t-4 border-green-500">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Rocket className="w-5 h-5" />
                Próximos Passos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Link to={createPageUrl('IntencoesCompra')}>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Criar Primeira Intenção
                </Button>
              </Link>
              <Link to={createPageUrl('Negociacoes')}>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Fazer Primeira Venda
                </Button>
              </Link>
              <Link to={createPageUrl('CronogramaObra')}>
                <Button variant="outline" className="w-full justify-start">
                  <HardHat className="w-4 h-4 mr-2" />
                  Iniciar Primeira Obra
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}