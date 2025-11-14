import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Building, User, XCircle, Loader2, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MensagensImobiliarias() {
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [encerrandoConversa, setEncerrandoConversa] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: mensagens = [] } = useQuery({
    queryKey: ['mensagens_imobiliarias_admin'],
    queryFn: () => base44.entities.MensagemImobiliaria.list('-created_date'),
    refetchInterval: 5000,
  });

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  // Agrupar mensagens por conversa
  const conversas = mensagens.reduce((acc, msg) => {
    const convId = msg.conversa_id || msg.id;
    if (!acc[convId]) {
      acc[convId] = {
        id: convId,
        imobiliaria_id: msg.imobiliaria_id,
        titulo: msg.titulo,
        assunto: msg.assunto,
        status: msg.status,
        mensagens: [],
        naoLidas: 0,
        ultimaMensagem: null,
      };
    }
    acc[convId].mensagens.push(msg);
    if (!msg.lida && msg.remetente_tipo === 'imobiliaria') {
      acc[convId].naoLidas++;
    }
    if (!acc[convId].ultimaMensagem || new Date(msg.created_date) > new Date(acc[convId].ultimaMensagem.created_date)) {
      acc[convId].ultimaMensagem = msg;
    }
    return acc;
  }, {});

  const conversasArray = Object.values(conversas).sort((a, b) => 
    new Date(b.ultimaMensagem.created_date) - new Date(a.ultimaMensagem.created_date)
  );

  const enviarMensagemMutation = useMutation({
    mutationFn: (data) => base44.entities.MensagemImobiliaria.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens_imobiliarias_admin'] });
      setNovaMensagem('');
      toast.success('Mensagem enviada!');
    },
  });

  const marcarComoLidaMutation = useMutation({
    mutationFn: (id) => base44.entities.MensagemImobiliaria.update(id, { 
      lida: true, 
      data_leitura: new Date().toISOString() 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens_imobiliarias_admin'] });
      queryClient.invalidateQueries({ queryKey: ['mensagensNaoLidasImobiliarias'] });
    },
  });

  const encerrarConversaMutation = useMutation({
    mutationFn: async (convId) => {
      setEncerrandoConversa(true);
      const conversaAtual = conversasArray.find(c => c.id === convId);
      
      // Atualizar todas mensagens para fechado
      await Promise.all(
        conversaAtual.mensagens.map(msg =>
          base44.entities.MensagemImobiliaria.update(msg.id, { status: 'fechado' })
        )
      );

      // Buscar dados da imobiliária para enviar email
      const imobiliaria = imobiliarias.find(i => i.id === conversaAtual.imobiliaria_id);
      
      if (imobiliaria?.email) {
        // Criar HTML do histórico
        const historicoHTML = `
          <h2>${conversaAtual.titulo}</h2>
          <p><strong>Imobiliária:</strong> ${imobiliaria.nome}</p>
          <p><strong>Data Encerramento:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <hr>
          ${conversaAtual.mensagens.map(msg => `
            <div style="margin: 15px 0; padding: 15px; border-radius: 8px; ${
              msg.remetente_tipo === 'imobiliaria' ? 'background: #f3f4f6; text-align: left;' : 'background: #922B3E; color: white; text-align: right;'
            }">
              <strong>${msg.remetente_nome}</strong>
              <p>${msg.mensagem.replace(/\n/g, '<br>')}</p>
              <small style="opacity: 0.7;">${new Date(msg.created_date).toLocaleString('pt-BR')}</small>
            </div>
          `).join('')}
        `;

        await base44.integrations.Core.SendEmail({
          from_name: "Riviera Incorporadora",
          to: imobiliaria.email,
          subject: `Conversa Encerrada: ${conversaAtual.titulo}`,
          body: historicoHTML
        });
      }

      return convId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens_imobiliarias_admin'] });
      toast.success('Conversa encerrada! Histórico enviado por email.');
      setConversaSelecionada(null);
      setEncerrandoConversa(false);
    },
    onError: (error) => {
      toast.error('Erro ao encerrar: ' + error.message);
      setEncerrandoConversa(false);
    }
  });

  const handleEnviarMensagem = () => {
    if (!novaMensagem.trim()) return;

    const conversa = conversasArray.find(c => c.id === conversaSelecionada);
    
    enviarMensagemMutation.mutate({
      imobiliaria_id: conversa.imobiliaria_id,
      conversa_id: conversaSelecionada,
      titulo: conversa.titulo,
      assunto: conversa.ultimaMensagem.assunto,
      mensagem: novaMensagem,
      remetente_tipo: 'incorporadora',
      remetente_email: user.email,
      remetente_nome: user.full_name,
      status: conversa.status || 'aberto',
    });
  };

  const handleSelecionarConversa = (convId) => {
    setConversaSelecionada(convId);
    
    // Marcar mensagens como lidas
    const conversa = conversasArray.find(c => c.id === convId);
    const mensagensNaoLidas = conversa.mensagens.filter(m => !m.lida && m.remetente_tipo === 'imobiliaria');
    
    mensagensNaoLidas.forEach(msg => {
      marcarComoLidaMutation.mutate(msg.id);
    });
  };

  const conversaSelecionadaObj = conversasArray.find(c => c.id === conversaSelecionada);
  const totalNaoLidas = conversasArray.reduce((sum, c) => sum + c.naoLidas, 0);
  const conversaEncerrada = conversaSelecionadaObj?.status === 'fechado';

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Mensagens de Imobiliárias</h1>
          <p className="text-gray-600 mt-1">
            Gerencie a comunicação com as imobiliárias parceiras
            {totalNaoLidas > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">
                {totalNaoLidas} não lidas
              </Badge>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Conversas */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversas ({conversasArray.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {conversasArray.map((conversa) => {
                const imobiliaria = imobiliarias.find(i => i.id === conversa.imobiliaria_id);
                
                return (
                  <div
                    key={conversa.id}
                    onClick={() => handleSelecionarConversa(conversa.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      conversaSelecionada === conversa.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <h4 className="font-semibold text-sm">{imobiliaria?.nome || 'N/A'}</h4>
                      </div>
                      {conversa.naoLidas > 0 && (
                        <Badge className="bg-red-500 text-white">{conversa.naoLidas}</Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-700 mb-1">{conversa.titulo}</p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {conversa.ultimaMensagem.mensagem}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(parseISO(conversa.ultimaMensagem.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                );
              })}

              {conversasArray.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma conversa ainda</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversa Selecionada */}
        <Card className="lg:col-span-2">
          {conversaSelecionadaObj ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{conversaSelecionadaObj.titulo}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {imobiliarias.find(i => i.id === conversaSelecionadaObj.imobiliaria_id)?.nome || 'N/A'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {conversaSelecionadaObj.ultimaMensagem.assunto}
                    </Badge>
                    {!conversaEncerrada && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Deseja encerrar esta conversa? O histórico será enviado por email.')) {
                            encerrarConversaMutation.mutate(conversaSelecionadaObj.id);
                          }
                        }}
                        disabled={encerrandoConversa}
                      >
                        {encerrandoConversa ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Encerrando...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            Encerrar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {conversaEncerrada && (
                  <Alert className="mb-4 bg-gray-100 border-gray-300">
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      Esta conversa foi encerrada. O histórico foi enviado por email.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
                  {conversaSelecionadaObj.mensagens
                    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                    .map((msg) => {
                      const isIncorporadora = msg.remetente_tipo === 'incorporadora';
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isIncorporadora ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              isIncorporadora
                                ? 'bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {isIncorporadora ? (
                                <User className="w-3 h-3" />
                              ) : (
                                <Building className="w-3 h-3" />
                              )}
                              <span className="text-xs font-semibold">
                                {msg.remetente_nome}
                              </span>
                            </div>
                            <p className="text-sm">{msg.mensagem}</p>
                            <p className={`text-xs mt-1 ${isIncorporadora ? 'text-white/70' : 'text-gray-500'}`}>
                              {format(parseISO(msg.created_date), "dd/MM HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {!conversaEncerrada ? (
                  <div className="flex gap-2">
                    <Input
                      value={novaMensagem}
                      onChange={(e) => setNovaMensagem(e.target.value)}
                      placeholder="Digite sua resposta..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleEnviarMensagem();
                        }
                      }}
                    />
                    <Button
                      onClick={handleEnviarMensagem}
                      disabled={!novaMensagem.trim()}
                      className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    Esta conversa foi encerrada
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Selecione uma conversa para visualizar</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}