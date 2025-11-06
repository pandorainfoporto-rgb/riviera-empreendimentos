import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, Send, Search, AlertCircle, 
  CheckCircle, User, Shield, Filter
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function MensagensClientes() {
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [mensagemTexto, setMensagemTexto] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("todos");

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: mensagens = [], refetch } = useQuery({
    queryKey: ['mensagens_admin'],
    queryFn: () => base44.entities.Mensagem.list('-created_date'),
    refetchInterval: 10000,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  // Agrupar mensagens por conversa
  const conversas = React.useMemo(() => {
    const grouped = mensagens.reduce((acc, msg) => {
      const conversaId = msg.conversa_id || msg.id;
      if (!acc[conversaId]) {
        const cliente = clientes.find(c => c.id === msg.cliente_id);
        acc[conversaId] = {
          id: conversaId,
          cliente_id: msg.cliente_id,
          cliente_nome: cliente?.nome || 'Cliente não encontrado',
          titulo: msg.titulo,
          assunto: msg.assunto,
          status: msg.status,
          prioridade: msg.prioridade,
          mensagens: [],
          ultimaMensagem: msg.created_date,
          naoLidas: 0,
        };
      }
      acc[conversaId].mensagens.push(msg);
      if (!msg.lida && msg.remetente_tipo === 'cliente') {
        acc[conversaId].naoLidas++;
      }
      if (new Date(msg.created_date) > new Date(acc[conversaId].ultimaMensagem)) {
        acc[conversaId].ultimaMensagem = msg.created_date;
        acc[conversaId].status = msg.status;
        acc[conversaId].prioridade = msg.prioridade;
      }
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => 
      new Date(b.ultimaMensagem) - new Date(a.ultimaMensagem)
    );
  }, [mensagens, clientes]);

  const conversasFiltradas = conversas.filter(c => {
    const matchesSearch = c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mensagens.some(m => m.mensagem.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filtroStatus === 'todos' || c.status === filtroStatus;
    const matchesPrioridade = filtroPrioridade === 'todos' || c.prioridade === filtroPrioridade;
    
    return matchesSearch && matchesStatus && matchesPrioridade;
  });

  const enviarMensagemMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Mensagem.create({
        ...data,
        remetente_tipo: 'admin',
        remetente_email: user.email,
        remetente_nome: user.full_name,
        lida: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens_admin'] });
      setMensagemTexto("");
      toast.success("Mensagem enviada!");
    },
  });

  const atualizarStatusMutation = useMutation({
    mutationFn: async ({ conversaId, status }) => {
      const mensagensConversa = conversaSelecionada.mensagens;
      const ultimaMensagem = mensagensConversa[mensagensConversa.length - 1];
      
      return await base44.entities.Mensagem.update(ultimaMensagem.id, {
        status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens_admin'] });
      toast.success("Status atualizado!");
    },
  });

  const marcarComoLidaMutation = useMutation({
    mutationFn: async (mensagemId) => {
      return await base44.entities.Mensagem.update(mensagemId, {
        lida: true,
        data_leitura: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens_admin'] });
    },
  });

  const handleEnviarMensagem = () => {
    if (!mensagemTexto.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    enviarMensagemMutation.mutate({
      cliente_id: conversaSelecionada.cliente_id,
      conversa_id: conversaSelecionada.id,
      titulo: conversaSelecionada.titulo,
      assunto: conversaSelecionada.assunto,
      mensagem: mensagemTexto,
      status: conversaSelecionada.status,
      prioridade: conversaSelecionada.prioridade,
    });
  };

  // Marcar como lidas ao selecionar conversa
  useEffect(() => {
    if (conversaSelecionada) {
      conversaSelecionada.mensagens.forEach(msg => {
        if (!msg.lida && msg.remetente_tipo === 'cliente') {
          marcarComoLidaMutation.mutate(msg.id);
        }
      });
    }
  }, [conversaSelecionada?.id]);

  const totalNaoLidas = conversas.reduce((sum, c) => sum + c.naoLidas, 0);

  const getAssuntoColor = (assunto) => {
    const colors = {
      geral: "bg-gray-100 text-gray-700",
      negociacao: "bg-blue-100 text-blue-700",
      pagamento: "bg-green-100 text-green-700",
      documento: "bg-purple-100 text-purple-700",
      obra: "bg-orange-100 text-orange-700",
      financeiro: "bg-red-100 text-red-700",
      suporte: "bg-yellow-100 text-yellow-700",
    };
    return colors[assunto] || "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status) => {
    const colors = {
      aberto: "bg-blue-100 text-blue-700",
      em_andamento: "bg-yellow-100 text-yellow-700",
      resolvido: "bg-green-100 text-green-700",
      fechado: "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getPrioridadeColor = (prioridade) => {
    const colors = {
      baixa: "bg-gray-100 text-gray-700",
      normal: "bg-blue-100 text-blue-700",
      alta: "bg-orange-100 text-orange-700",
      urgente: "bg-red-100 text-red-700",
    };
    return colors[prioridade] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Mensagens de Clientes</h1>
          <p className="text-gray-600 mt-1">Gerencie as conversas com os clientes</p>
        </div>
        {totalNaoLidas > 0 && (
          <Badge className="bg-red-500 text-white text-lg px-4 py-2">
            {totalNaoLidas} não lida{totalNaoLidas > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Lista de Conversas */}
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar conversas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Status</SelectItem>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="resolvido">Resolvido</SelectItem>
                    <SelectItem value="fechado">Fechado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas Prioridades</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto">
              {conversasFiltradas.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 text-sm">Nenhuma conversa encontrada</p>
                </div>
              ) : (
                conversasFiltradas.map((conversa) => (
                  <div
                    key={conversa.id}
                    onClick={() => setConversaSelecionada(conversa)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      conversaSelecionada?.id === conversa.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{conversa.cliente_nome}</h4>
                        <p className="text-xs text-gray-600 truncate">{conversa.titulo}</p>
                      </div>
                      {conversa.naoLidas > 0 && (
                        <Badge className="bg-red-500 text-white ml-2">{conversa.naoLidas}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="outline" className={`${getAssuntoColor(conversa.assunto)} text-xs`}>
                        {conversa.assunto}
                      </Badge>
                      <Badge variant="outline" className={`${getStatusColor(conversa.status)} text-xs`}>
                        {conversa.status}
                      </Badge>
                      {conversa.prioridade !== 'normal' && (
                        <Badge variant="outline" className={`${getPrioridadeColor(conversa.prioridade)} text-xs`}>
                          {conversa.prioridade}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {format(parseISO(conversa.ultimaMensagem), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="lg:col-span-2 shadow-lg">
          {!conversaSelecionada ? (
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Selecione uma conversa para visualizar</p>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg">{conversaSelecionada.cliente_nome}</CardTitle>
                    <p className="text-sm text-gray-600">{conversaSelecionada.titulo}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={getAssuntoColor(conversaSelecionada.assunto)}>
                        {conversaSelecionada.assunto}
                      </Badge>
                      <Badge className={getPrioridadeColor(conversaSelecionada.prioridade)}>
                        {conversaSelecionada.prioridade}
                      </Badge>
                    </div>
                  </div>
                  <Select
                    value={conversaSelecionada.status}
                    onValueChange={(value) => atualizarStatusMutation.mutate({ conversaId: conversaSelecionada.id, status: value })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="resolvido">Resolvido</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[400px] overflow-y-auto mb-4 space-y-4">
                  {conversaSelecionada.mensagens
                    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                    .map((msg) => {
                      const isAdmin = msg.remetente_tipo === 'admin';
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${isAdmin ? 'justify-start' : 'justify-end'}`}
                        >
                          {isAdmin && (
                            <Avatar className="w-8 h-8 bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)]">
                              <AvatarFallback className="text-white text-xs">
                                <Shield className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[70%]`}>
                            <div
                              className={`rounded-lg p-3 ${
                                isAdmin
                                  ? 'bg-gray-100 text-gray-900'
                                  : 'bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white'
                              }`}
                            >
                              {isAdmin && (
                                <p className="text-xs font-semibold mb-1">{msg.remetente_nome}</p>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{msg.mensagem}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1 px-1">
                              <p className="text-xs text-gray-500">
                                {format(parseISO(msg.created_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                              </p>
                              {!isAdmin && msg.lida && (
                                <CheckCircle className="w-3 h-3 text-blue-500" />
                              )}
                            </div>
                          </div>
                          {!isAdmin && (
                            <Avatar className="w-8 h-8 bg-blue-100">
                              <AvatarFallback className="text-blue-700 text-xs">
                                <User className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })}
                </div>

                {conversaSelecionada.status !== 'fechado' && (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={mensagemTexto}
                      onChange={(e) => setMensagemTexto(e.target.value)}
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleEnviarMensagem();
                        }
                      }}
                    />
                    <Button
                      onClick={handleEnviarMensagem}
                      disabled={!mensagemTexto.trim() || enviarMensagemMutation.isPending}
                      className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {conversaSelecionada.status === 'fechado' && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <p className="text-sm text-gray-600">
                      Esta conversa foi fechada. Altere o status para continuar.
                    </p>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}