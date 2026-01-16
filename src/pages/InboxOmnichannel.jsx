import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageSquare, Send, Search, Filter, Archive, UserCheck, AlertCircle,
  Clock, Zap, Phone, Instagram, Facebook, Mail, Globe, CheckCircle2,
  User, TrendingUp, Star, MoreVertical, Store, Users
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function InboxOmnichannel() {
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("aguardando");
  const [busca, setBusca] = useState("");
  const [tipoInbox, setTipoInbox] = useState("omnichannel"); // omnichannel, clientes, imobiliarias
  const queryClient = useQueryClient();

  const { data: conversas = [] } = useQuery({
    queryKey: ['conversas_omnichannel', filtroStatus],
    queryFn: async () => {
      if (filtroStatus === "todas") {
        return await base44.entities.ConversaOmnichannel.list('-data_ultimo_contato');
      }
      return await base44.entities.ConversaOmnichannel.filter({ 
        status: filtroStatus 
      }, '-data_ultimo_contato');
    },
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  const { data: mensagens = [] } = useQuery({
    queryKey: ['mensagens_omnichannel', conversaSelecionada?.id],
    queryFn: () => base44.entities.MensagemOmnichannel.filter({ 
      conversa_id: conversaSelecionada.id 
    }, 'data_hora'),
    enabled: !!conversaSelecionada,
    refetchInterval: 2000, // Atualiza a cada 2 segundos
  });

  const { data: canais = [] } = useQuery({
    queryKey: ['canais_atendimento'],
    queryFn: () => base44.entities.CanalAtendimento.list(),
  });

  const { data: mensagensClientes = [] } = useQuery({
    queryKey: ['mensagens_clientes'],
    queryFn: () => base44.entities.Mensagem.filter({ remetente_tipo: 'cliente' }, '-created_date'),
    enabled: tipoInbox === 'clientes',
  });

  const { data: mensagensImobiliarias = [] } = useQuery({
    queryKey: ['mensagens_imobiliarias'],
    queryFn: () => base44.entities.MensagemImobiliaria.filter({}, '-created_date'),
    enabled: tipoInbox === 'imobiliarias',
  });

  const enviarMensagemMutation = useMutation({
    mutationFn: async ({ conversaId, conteudo }) => {
      const user = await base44.auth.me();
      return base44.entities.MensagemOmnichannel.create({
        conversa_id: conversaId,
        remetente_tipo: 'atendente',
        remetente_id: user.id,
        remetente_nome: user.full_name,
        conteudo,
        tipo_conteudo: 'texto',
        status_entrega: 'enviando',
        data_hora: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensagens_omnichannel']);
      setNovaMensagem("");
      toast.success("Mensagem enviada!");
    },
  });

  const marcarAtendidaMutation = useMutation({
    mutationFn: async (conversaId) => {
      const user = await base44.auth.me();
      return base44.entities.ConversaOmnichannel.update(conversaId, {
        status: 'em_atendimento',
        atendente_id: user.id,
        lida: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['conversas_omnichannel']);
      toast.success("Conversa marcada como em atendimento");
    },
  });

  const finalizarConversaMutation = useMutation({
    mutationFn: (conversaId) => 
      base44.entities.ConversaOmnichannel.update(conversaId, {
        status: 'finalizado',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['conversas_omnichannel']);
      setConversaSelecionada(null);
      toast.success("Conversa finalizada!");
    },
  });

  const getIconByCanal = (canalId) => {
    const canal = canais.find(c => c.id === canalId);
    if (!canal) return MessageSquare;
    
    const icons = {
      whatsapp: Phone,
      instagram: Instagram,
      facebook: Facebook,
      site: Globe,
      email: Mail,
    };
    return icons[canal.tipo] || MessageSquare;
  };

  const conversasFiltradas = conversas.filter(c => 
    !busca || 
    c.contato_nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.contato_telefone?.includes(busca) ||
    c.assunto?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleEnviarMensagem = () => {
    if (!novaMensagem.trim() || !conversaSelecionada) return;
    enviarMensagemMutation.mutate({
      conversaId: conversaSelecionada.id,
      conteudo: novaMensagem,
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 p-6">
      {/* Lista de Conversas */}
      <div className="w-96 flex flex-col bg-white rounded-lg border">
        <div className="p-4 border-b space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            Inbox Unificado
          </h2>

          <Tabs value={tipoInbox} onValueChange={setTipoInbox}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="omnichannel" className="text-xs">
                <MessageSquare className="w-4 h-4 mr-1" />
                Omni
              </TabsTrigger>
              <TabsTrigger value="clientes" className="text-xs">
                <Users className="w-4 h-4 mr-1" />
                Clientes
              </TabsTrigger>
              <TabsTrigger value="imobiliarias" className="text-xs">
                <Store className="w-4 h-4 mr-1" />
                Imobiliárias
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Buscar conversas..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          {tipoInbox === 'omnichannel' && (
            <Tabs value={filtroStatus} onValueChange={setFiltroStatus}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="aguardando" className="text-xs">
                  Aguardando
                  {conversas.filter(c => c.status === 'aguardando').length > 0 && (
                    <Badge className="ml-1 bg-red-600">
                      {conversas.filter(c => c.status === 'aguardando').length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="em_atendimento" className="text-xs">Em Atend.</TabsTrigger>
                <TabsTrigger value="finalizado" className="text-xs">Finalizadas</TabsTrigger>
                <TabsTrigger value="todas" className="text-xs">Todas</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {tipoInbox === 'omnichannel' && conversasFiltradas.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          )}
          
          {tipoInbox === 'omnichannel' && conversasFiltradas.map((conversa) => {
              const Icon = getIconByCanal(conversa.canal_id);
              const isSelected = conversaSelecionada?.id === conversa.id;
              
              return (
                <div
                  key={conversa.id}
                  onClick={() => setConversaSelecionada(conversa)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''
                  } ${!conversa.lida ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-purple-600 text-white">
                        {conversa.contato_nome?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm truncate">
                          {conversa.contato_nome || conversa.contato_telefone || 'Sem nome'}
                        </p>
                        <Icon className="w-4 h-4 text-gray-400" />
                      </div>

                      <p className="text-xs text-gray-600 truncate mb-2">
                        {conversa.assunto || 'Sem assunto'}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap">
                        {conversa.tipo_contato === 'cliente' && (
                          <Badge className="bg-green-600 text-xs">Cliente</Badge>
                        )}
                        {conversa.tipo_contato === 'lead' && (
                          <Badge className="bg-blue-600 text-xs">Lead</Badge>
                        )}
                        {conversa.atendido_por_ia && (
                          <Badge variant="outline" className="text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            IA
                          </Badge>
                        )}
                        {!conversa.lida && (
                          <Badge className="bg-red-600 text-xs">Nova</Badge>
                        )}
                        <span className="text-xs text-gray-500 ml-auto">
                          {moment(conversa.data_ultimo_contato).fromNow()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          {tipoInbox === 'clientes' && (
            mensagensClientes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>Nenhuma mensagem de cliente</p>
              </div>
            ) : (
              mensagensClientes.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 border-b cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-600 text-white">
                        {msg.cliente_nome?.[0]?.toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{msg.cliente_nome || 'Cliente'}</p>
                      <p className="text-xs text-gray-600 truncate">{msg.conteudo}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {!msg.lida && <Badge className="bg-red-600 text-xs">Nova</Badge>}
                        <span className="text-xs text-gray-500">
                          {moment(msg.created_date).fromNow()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          )}

          {tipoInbox === 'imobiliarias' && (
            mensagensImobiliarias.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>Nenhuma mensagem de imobiliária</p>
              </div>
            ) : (
              mensagensImobiliarias.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 border-b cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-green-600 text-white">
                        {msg.imobiliaria_nome?.[0]?.toUpperCase() || 'I'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{msg.imobiliaria_nome || 'Imobiliária'}</p>
                      <p className="text-xs text-gray-600 truncate">{msg.mensagem}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {!msg.lida && <Badge className="bg-red-600 text-xs">Nova</Badge>}
                        <span className="text-xs text-gray-500">
                          {moment(msg.created_date).fromNow()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 flex flex-col bg-white rounded-lg border">
        {!conversaSelecionada ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header da Conversa */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-purple-600 text-white">
                    {conversaSelecionada.contato_nome?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {conversaSelecionada.contato_nome || conversaSelecionada.contato_telefone}
                  </p>
                  <div className="flex items-center gap-2">
                    {conversaSelecionada.contato_telefone && (
                      <p className="text-xs text-gray-600">{conversaSelecionada.contato_telefone}</p>
                    )}
                    {conversaSelecionada.tipo_contato === 'cliente' && (
                      <Badge className="bg-green-600 text-xs">Cliente</Badge>
                    )}
                    {conversaSelecionada.tipo_contato === 'lead' && (
                      <Badge className="bg-blue-600 text-xs">Lead</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {conversaSelecionada.status === 'aguardando' && (
                  <Button 
                    size="sm" 
                    onClick={() => marcarAtendidaMutation.mutate(conversaSelecionada.id)}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Assumir Atendimento
                  </Button>
                )}
                {conversaSelecionada.status === 'em_atendimento' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => finalizarConversaMutation.mutate(conversaSelecionada.id)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Finalizar
                  </Button>
                )}
              </div>
            </div>

            {/* Análise da IA */}
            {conversaSelecionada.analise_ia && (
              <div className="p-4 bg-purple-50 border-b">
                <div className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-purple-900 mb-2">
                      Análise Automática da IA
                    </p>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {conversaSelecionada.analise_ia.intencao && (
                        <div>
                          <p className="text-xs text-gray-600">Intenção</p>
                          <Badge>{conversaSelecionada.analise_ia.intencao}</Badge>
                        </div>
                      )}
                      {conversaSelecionada.analise_ia.sentimento && (
                        <div>
                          <p className="text-xs text-gray-600">Sentimento</p>
                          <Badge variant={
                            conversaSelecionada.analise_ia.sentimento === 'positivo' ? 'default' :
                            conversaSelecionada.analise_ia.sentimento === 'negativo' ? 'destructive' : 'outline'
                          }>
                            {conversaSelecionada.analise_ia.sentimento}
                          </Badge>
                        </div>
                      )}
                      {conversaSelecionada.analise_ia.urgencia && (
                        <div>
                          <p className="text-xs text-gray-600">Urgência</p>
                          <Badge variant="outline">{conversaSelecionada.analise_ia.urgencia}</Badge>
                        </div>
                      )}
                      {conversaSelecionada.analise_ia.interesse_produto && (
                        <div>
                          <p className="text-xs text-gray-600">Interesse</p>
                          <Badge variant="outline">{conversaSelecionada.analise_ia.interesse_produto}</Badge>
                        </div>
                      )}
                    </div>
                    {conversaSelecionada.analise_ia.resumo && (
                      <p className="text-sm text-gray-700 italic">
                        "{conversaSelecionada.analise_ia.resumo}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {mensagens.map((msg) => {
                const isAtendente = msg.remetente_tipo === 'atendente' || msg.remetente_tipo === 'ia';
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isAtendente ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isAtendente 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-white text-gray-900 border'
                      }`}
                    >
                      {msg.remetente_tipo === 'ia' && (
                        <div className="flex items-center gap-1 mb-1">
                          <Zap className="w-3 h-3" />
                          <p className="text-xs opacity-75">Resposta Automática IA</p>
                        </div>
                      )}
                      {msg.remetente_tipo === 'atendente' && (
                        <p className="text-xs opacity-75 mb-1">{msg.remetente_nome}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
                      <p className={`text-xs mt-1 ${
                        isAtendente ? 'text-purple-200' : 'text-gray-500'
                      }`}>
                        {moment(msg.data_hora).format('HH:mm')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEnviarMensagem();
                    }
                  }}
                  rows={2}
                  className="flex-1"
                />
                <Button 
                  onClick={handleEnviarMensagem}
                  disabled={!novaMensagem.trim() || enviarMensagemMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}