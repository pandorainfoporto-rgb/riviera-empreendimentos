import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare, Send, Search, Mail, Phone, User, Clock,
  Paperclip, Star, Filter, MoreVertical, CheckCircle2, AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ComunicacaoThread from "../components/comunicacao/ComunicacaoThread";
import NovaMensagemDialog from "../components/comunicacao/NovaMensagemDialog";
import RespostasTemplateDialog from "../components/comunicacao/RespostasTemplateDialog";
import HistoricoComunicacaoDialog from "../components/comunicacao/HistoricoComunicacaoDialog";

const prioridadeColors = {
  baixa: "bg-gray-100 text-gray-700",
  normal: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700"
};

const statusColors = {
  aberto: "bg-blue-100 text-blue-700",
  em_andamento: "bg-yellow-100 text-yellow-700",
  resolvido: "bg-green-100 text-green-700",
  fechado: "bg-gray-100 text-gray-700"
};

export default function MensagensClientesPage() {
  const [busca, setBusca] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [showNovaMensagem, setShowNovaMensagem] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("todos");
  const queryClient = useQueryClient();

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: mensagens = [] } = useQuery({
    queryKey: ['mensagens_todas'],
    queryFn: () => base44.entities.Mensagem.list('-created_date'),
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['respostas_template'],
    queryFn: () => base44.entities.RespostaTemplate.filter({ ativo: true }),
  });

  // Agrupar mensagens por cliente e conversa
  const mensagensPorCliente = mensagens.reduce((acc, msg) => {
    if (!acc[msg.cliente_id]) {
      acc[msg.cliente_id] = {
        conversas: {},
        totalNaoLidas: 0,
        ultimaMensagem: null
      };
    }
    
    const convId = msg.conversa_id || msg.id;
    if (!acc[msg.cliente_id].conversas[convId]) {
      acc[msg.cliente_id].conversas[convId] = {
        id: convId,
        titulo: msg.titulo,
        mensagens: [],
        naoLidas: 0,
        status: msg.status,
        prioridade: msg.prioridade
      };
    }
    
    acc[msg.cliente_id].conversas[convId].mensagens.push(msg);
    
    if (!msg.lida && msg.remetente_tipo === 'cliente') {
      acc[msg.cliente_id].conversas[convId].naoLidas++;
      acc[msg.cliente_id].totalNaoLidas++;
    }
    
    if (!acc[msg.cliente_id].ultimaMensagem || 
        new Date(msg.created_date) > new Date(acc[msg.cliente_id].ultimaMensagem.created_date)) {
      acc[msg.cliente_id].ultimaMensagem = msg;
    }
    
    return acc;
  }, {});

  const clientesComMensagens = clientes
    .filter(c => mensagensPorCliente[c.id])
    .map(c => ({
      ...c,
      ...mensagensPorCliente[c.id]
    }))
    .filter(c => {
      const matchBusca = c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
                        c.email?.toLowerCase().includes(busca.toLowerCase());
      return matchBusca;
    })
    .sort((a, b) => {
      if (!a.ultimaMensagem) return 1;
      if (!b.ultimaMensagem) return -1;
      return new Date(b.ultimaMensagem.created_date) - new Date(a.ultimaMensagem.created_date);
    });

  const totalNaoLidas = Object.values(mensagensPorCliente)
    .reduce((sum, cliente) => sum + cliente.totalNaoLidas, 0);

  const conversasAbertas = mensagens.filter(m => m.status === 'aberto' || m.status === 'em_andamento').length;

  const handleSelecionarCliente = (cliente) => {
    setClienteSelecionado(cliente);
    setConversaSelecionada(null);
  };

  const handleSelecionarConversa = (conversaId) => {
    setConversaSelecionada(conversaId);
  };

  const getInitials = (nome) => {
    if (!nome) return "?";
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Central de Comunicação</h1>
          <p className="text-gray-600 mt-1">Gerencie todas as conversas com clientes</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowTemplates(true)}
            className="gap-2"
          >
            <Star className="w-4 h-4" />
            Templates
          </Button>
          <Button
            onClick={() => setShowNovaMensagem(true)}
            className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)] gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Nova Mensagem
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clientesComMensagens.length}</p>
                <p className="text-xs text-gray-600">Conversas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{totalNaoLidas}</p>
                <p className="text-xs text-gray-600">Não Lidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{conversasAbertas}</p>
                <p className="text-xs text-gray-600">Aguardando Resposta</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mensagens.filter(m => m.status === 'resolvido').length}
                </p>
                <p className="text-xs text-gray-600">Resolvidas Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Lista de Clientes */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg">Clientes</CardTitle>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar cliente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {clientesComMensagens.map((cliente) => (
                <div
                  key={cliente.id}
                  onClick={() => handleSelecionarCliente(cliente)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    clienteSelecionado?.id === cliente.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white text-xs">
                        {getInitials(cliente.nome)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm truncate">{cliente.nome}</h4>
                        {cliente.totalNaoLidas > 0 && (
                          <Badge className="bg-red-500 text-white text-xs">
                            {cliente.totalNaoLidas}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 truncate mb-1">
                        {cliente.ultimaMensagem?.mensagem?.substring(0, 50)}...
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(cliente.ultimaMensagem?.created_date).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {clientesComMensagens.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma conversa encontrada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Área de Conversas */}
        <div className="lg:col-span-8 space-y-4">
          {clienteSelecionado ? (
            <>
              {/* Header do Cliente */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white">
                          {getInitials(clienteSelecionado.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg">{clienteSelecionado.nome}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {clienteSelecionado.email}
                          </span>
                          {clienteSelecionado.telefone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {clienteSelecionado.telefone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowHistorico(true)}
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Histórico
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowTemplates(true)}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Templates
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conversas do Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Conversas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    {Object.values(clienteSelecionado.conversas || {})
                      .sort((a, b) => {
                        const dataA = Math.max(...a.mensagens.map(m => new Date(m.created_date)));
                        const dataB = Math.max(...b.mensagens.map(m => new Date(m.created_date)));
                        return dataB - dataA;
                      })
                      .map((conversa) => (
                        <div
                          key={conversa.id}
                          onClick={() => handleSelecionarConversa(conversa.id)}
                          className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
                            conversaSelecionada === conversa.id 
                              ? 'bg-blue-50 border-blue-300' 
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{conversa.titulo}</h4>
                            <div className="flex gap-2">
                              {conversa.naoLidas > 0 && (
                                <Badge className="bg-red-500 text-white">
                                  {conversa.naoLidas}
                                </Badge>
                              )}
                              <Badge className={statusColors[conversa.status]}>
                                {conversa.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{conversa.mensagens.length} mensagens</span>
                            <Badge className={prioridadeColors[conversa.prioridade]}>
                              {conversa.prioridade}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Thread de Mensagens */}
              {conversaSelecionada && (
                <ComunicacaoThread
                  cliente={clienteSelecionado}
                  conversaId={conversaSelecionada}
                  conversa={clienteSelecionado.conversas[conversaSelecionada]}
                  onTemplateClick={() => setShowTemplates(true)}
                />
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Selecione um cliente
                </h3>
                <p className="text-gray-600 mb-6">
                  Escolha um cliente na lista para ver as conversas
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showNovaMensagem && (
        <NovaMensagemDialog
          open={showNovaMensagem}
          onClose={() => setShowNovaMensagem(false)}
          clienteInicial={clienteSelecionado}
        />
      )}

      {showTemplates && (
        <RespostasTemplateDialog
          open={showTemplates}
          onClose={() => setShowTemplates(false)}
          cliente={clienteSelecionado}
          conversaId={conversaSelecionada}
        />
      )}

      {showHistorico && clienteSelecionado && (
        <HistoricoComunicacaoDialog
          open={showHistorico}
          onClose={() => setShowHistorico(false)}
          cliente={clienteSelecionado}
        />
      )}
    </div>
  );
}