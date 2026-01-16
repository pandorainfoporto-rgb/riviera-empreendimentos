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
  User, TrendingUp, Star, MoreVertical
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
    refetchInterval: 5000,
  });

  // Buscar mensagens legadas (clientes e imobiliárias)
  const { data: mensagensClientes = [] } = useQuery({
    queryKey: ['mensagens_clientes_legadas'],
    queryFn: async () => {
      return await base44.entities.Mensagem.filter({
        lida: false,
        remetente_tipo: 'cliente'
      });
    },
    refetchInterval: 5000,
  });

  const { data: mensagensImobiliarias = [] } = useQuery({
    queryKey: ['mensagens_imobiliarias_legadas'],
    queryFn: async () => {
      return await base44.entities.MensagemImobiliaria.filter({
        lida: false,
        remetente_tipo: 'imobiliaria'
      });
    },
    refetchInterval: 5000,
  });

  const { data: mensagens = [] } = useQuery({
    queryKey: ['mensagens_omnichannel', conversaSelecionada?.id],
    queryFn: async () => {
      if (!conversaSelecionada) return [];
      
      // Se for conversa legada
      if (conversaSelecionada.tipo_origem === 'portal_cliente') {
        const msgs = await base44.entities.Mensagem.filter({ cliente_id: conversaSelecionada.cliente_id });
        return msgs.map(m => ({
          id: m.id,
          conversa_id: conversaSelecionada.id,
          remetente_tipo: m.remetente_tipo,
          remetente_nome: m.remetente_tipo === 'cliente' ? m.cliente_nome : 'Atendente',
          conteudo: m.mensagem,
          data_hora: m.created_date,
        }));
      }
      
      if (conversaSelecionada.tipo_origem === 'portal_imobiliaria') {
        const msgs = await base44.entities.MensagemImobiliaria.filter({ imobiliaria_id: conversaSelecionada.imobiliaria_id });
        return msgs.map(m => ({
          id: m.id,
          conversa_id: conversaSelecionada.id,
          remetente_tipo: m.remetente_tipo,
          remetente_nome: m.remetente_tipo === 'imobiliaria' ? m.imobiliaria_nome : 'Atendente',
          conteudo: m.mensagem,
          data_hora: m.created_date,
        }));
      }
      
      // Conversa omnichannel normal
      return await base44.entities.MensagemOmnichannel.filter({ 
        conversa_id: conversaSelecionada.id 
      }, 'data_hora');
    },
    enabled: !!conversaSelecionada,
    refetchInterval: 2000,
  });

  const { data: canais = [] } = useQuery({
    queryKey: ['canais_atendimento'],
    queryFn: () => base44.entities.CanalAtendimento.list(),
  });

  const { data: respostasRapidas = [] } = useQuery({
    queryKey: ['respostas_rapidas_chat'],
    queryFn: () => base44.entities.RespostaRapidaChat.filter({ ativo: true }),
  });

  const enviarMensagemMutation = useMutation({
    mutationFn: async ({ conversaId, conteudo, tipoOrigem, respostaRapida }) => {
      const user = await base44.auth.me();
      
      // Se for conversa legada, enviar pela entidade original
      if (tipoOrigem === 'portal_cliente') {
        const clienteId = conversaSelecionada.cliente_id;
        const msg = await base44.entities.Mensagem.create({
          cliente_id: clienteId,
          remetente_tipo: 'sistema',
          mensagem: conteudo,
          assunto: conversaSelecionada.assunto,
          lida: false,
        });

        if (respostaRapida?.tipo_funcao && respostaRapida.tipo_funcao !== 'mensagem_simples') {
          await base44.functions.invoke('executarFuncaoRespostaRapida', {
            conversa_id: conversaId,
            tipo_funcao: respostaRapida.tipo_funcao,
            mensagem_id: msg.id,
          });
        }

        return msg;
      }
      
      if (tipoOrigem === 'portal_imobiliaria') {
        const imobiliariaId = conversaSelecionada.imobiliaria_id;
        const msg = await base44.entities.MensagemImobiliaria.create({
          imobiliaria_id: imobiliariaId,
          remetente_tipo: 'sistema',
          mensagem: conteudo,
          assunto: conversaSelecionada.assunto,
          lida: false,
        });

        if (respostaRapida?.tipo_funcao && respostaRapida.tipo_funcao !== 'mensagem_simples') {
          await base44.functions.invoke('executarFuncaoRespostaRapida', {
            conversa_id: conversaId,
            tipo_funcao: respostaRapida.tipo_funcao,
            mensagem_id: msg.id,
          });
        }

        return msg;
      }
      
      // Conversa omnichannel normal
      const msg = await base44.entities.MensagemOmnichannel.create({
        conversa_id: conversaId,
        remetente_tipo: 'atendente',
        remetente_id: user.id,
        remetente_nome: user.full_name,
        conteudo,
        tipo_conteudo: 'texto',
        status_entrega: 'enviando',
        data_hora: new Date().toISOString(),
      });

      // Executar função especial se houver
      if (respostaRapida?.tipo_funcao && respostaRapida.tipo_funcao !== 'mensagem_simples') {
        await base44.functions.invoke('executarFuncaoRespostaRapida', {
          conversa_id: conversaId,
          tipo_funcao: respostaRapida.tipo_funcao,
          mensagem_id: msg.id,
        });
      }

      // Incrementar contador de uso
      if (respostaRapida) {
        await base44.entities.RespostaRapidaChat.update(respostaRapida.id, {
          uso_contador: (respostaRapida.uso_contador || 0) + 1
        });
      }

      return msg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensagens_omnichannel']);
      queryClient.invalidateQueries(['mensagens_clientes_legadas']);
      queryClient.invalidateQueries(['mensagens_imobiliarias_legadas']);
      setNovaMensagem("");
      setMostrarRespostasRapidas(false);
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

  const getIconByCanal = (canalId, tipoOrigem) => {
    // Se for mensagem legada (cliente ou imobiliária)
    if (tipoOrigem === 'portal_cliente') return User;
    if (tipoOrigem === 'portal_imobiliaria') return Store;
    
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

  // Converter mensagens legadas em formato de conversa
  const conversasLegadas = [
    ...mensagensClientes.map(m => ({
      id: `cliente_${m.id}`,
      tipo_origem: 'portal_cliente',
      contato_nome: m.cliente_nome || 'Cliente',
      contato_telefone: m.cliente_telefone,
      cliente_id: m.cliente_id,
      assunto: m.assunto || 'Mensagem do Portal',
      status: 'aguardando',
      tipo_contato: 'cliente',
      data_ultimo_contato: m.created_date,
      lida: false,
      mensagem_original: m,
    })),
    ...mensagensImobiliarias.map(m => ({
      id: `imobiliaria_${m.id}`,
      tipo_origem: 'portal_imobiliaria',
      contato_nome: m.imobiliaria_nome || 'Imobiliária',
      contato_telefone: m.imobiliaria_telefone,
      imobiliaria_id: m.imobiliaria_id,
      assunto: m.assunto || 'Mensagem do Portal',
      status: 'aguardando',
      tipo_contato: 'lead',
      data_ultimo_contato: m.created_date,
      lida: false,
      mensagem_original: m,
    }))
  ];

  // Mesclar conversas omnichannel com legadas
  const todasConversas = [...conversas, ...conversasLegadas].sort((a, b) => 
    new Date(b.data_ultimo_contato) - new Date(a.data_ultimo_contato)
  );

  const conversasFiltradas = todasConversas.filter(c => {
    // Filtro de status
    if (filtroStatus !== "todas" && c.status !== filtroStatus) return false;
    
    // Filtro de busca
    if (busca) {
      return c.contato_nome?.toLowerCase().includes(busca.toLowerCase()) ||
             c.contato_telefone?.includes(busca) ||
             c.assunto?.toLowerCase().includes(busca.toLowerCase());
    }
    
    return true;
  });

  const handleEnviarMensagem = () => {
    if (!novaMensagem.trim() || !conversaSelecionada) return;
    enviarMensagemMutation.mutate({
      conversaId: conversaSelecionada.id,
      conteudo: novaMensagem,
      tipoOrigem: conversaSelecionada.tipo_origem,
      respostaRapida: null,
    });
  };

  const handleUsarRespostaRapida = (resposta) => {
    let mensagemFinal = resposta.mensagem
      .replace('{nome}', conversaSelecionada?.contato_nome || 'Cliente')
      .replace('{data}', new Date().toLocaleDateString())
      .replace('{protocolo}', conversaSelecionada?.metadados?.protocolo || 'Será gerado');
    
    enviarMensagemMutation.mutate({ 
      conversaId: conversaSelecionada.id,
      conteudo: mensagemFinal,
      tipoOrigem: conversaSelecionada.tipo_origem,
      respostaRapida: resposta 
    });
  };

  const handleInputChange = (e) => {
    const valor = e.target.value;
    setNovaMensagem(valor);

    // Detectar "/" para mostrar respostas rápidas
    if (valor.startsWith('/')) {
      const termoBusca = valor.slice(1).toLowerCase();
      const filtradas = respostasRapidas.filter(r => 
        r.atalho.toLowerCase().includes(termoBusca) ||
        r.titulo.toLowerCase().includes(termoBusca)
      );
      setRespostasFiltradas(filtradas);
      setMostrarRespostasRapidas(filtradas.length > 0);
    } else {
      setMostrarRespostasRapidas(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 p-6">
      {/* Lista de Conversas */}
      <div className="w-96 flex flex-col bg-white rounded-lg border">
        <div className="p-4 border-b space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            Inbox Omnichannel
          </h2>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Buscar conversas..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={filtroStatus} onValueChange={setFiltroStatus}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="aguardando" className="text-xs">
                Aguardando
                {todasConversas.filter(c => c.status === 'aguardando').length > 0 && (
                  <Badge className="ml-1 bg-red-600">
                    {todasConversas.filter(c => c.status === 'aguardando').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="em_atendimento" className="text-xs">Em Atend.</TabsTrigger>
              <TabsTrigger value="finalizado" className="text-xs">Finalizadas</TabsTrigger>
              <TabsTrigger value="todas" className="text-xs">Todas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          ) : (
            conversasFiltradas.map((conversa) => {
              const Icon = getIconByCanal(conversa.canal_id, conversa.tipo_origem);
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
            })
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
            <div className="border-t">
              {/* Lista de respostas rápidas */}
              {mostrarRespostasRapidas && respostasFiltradas.length > 0 && (
                <div className="border-b bg-white shadow-lg max-h-64 overflow-y-auto">
                  {respostasFiltradas.map((resposta) => (
                    <button
                      key={resposta.id}
                      onClick={() => handleUsarRespostaRapida(resposta)}
                      className="w-full text-left p-3 hover:bg-purple-50 border-b last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-600 text-white font-mono text-xs">
                          /{resposta.atalho}
                        </Badge>
                        <span className="font-semibold text-sm">{resposta.titulo}</span>
                        {resposta.tipo_funcao !== 'mensagem_simples' && (
                          <Badge variant="outline" className="text-xs">
                            ⚡ {resposta.tipo_funcao.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {resposta.mensagem.substring(0, 80)}...
                      </p>
                    </button>
                  ))}
                </div>
              )}

              <div className="p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Digite / para respostas rápidas e funções..."
                    value={novaMensagem}
                    onChange={handleInputChange}
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
                <p className="text-xs text-gray-500 mt-2">
                  💡 Digite <strong>/</strong> para acessar respostas rápidas, boletos, PIX, protocolos e mais
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}