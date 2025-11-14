
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send, Paperclip, Star, Mail, CheckCircle2, MoreVertical,
  Download, Eye, Tag, Sparkles, Loader2, XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ComunicacaoThread({ cliente, conversaId, conversa, onTemplateClick }) {
  const [novaMensagem, setNovaMensagem] = useState("");
  const [enviarEmail, setEnviarEmail] = useState(true);
  const [anexos, setAnexos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [encerrandoConversa, setEncerrandoConversa] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const [novaTag, setNovaTag] = useState(""); // This seems unused if `tagsMsg` is used per message. Will keep it for now but might be a leftover.
  const [tagsMsg, setTagsMsg] = useState({}); // Stores input values for tags per message ID
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [sugestaoIA, setSugestaoIA] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    scrollToBottom();
    marcarComoLida();
  }, [conversaId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const marcarComoLida = async () => {
    const mensagensNaoLidas = conversa.mensagens.filter(
      m => !m.lida && m.remetente_tipo === 'cliente'
    );

    if (mensagensNaoLidas.length === 0) return;

    try {
      await Promise.all(
        mensagensNaoLidas.map(msg =>
          base44.entities.Mensagem.update(msg.id, {
            lida: true,
            data_leitura: new Date().toISOString()
          })
        )
      );

      queryClient.invalidateQueries(['mensagens_todas']);
      queryClient.invalidateQueries(['mensagensNaoLidasClientes']);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const analisarMensagemIA = async (mensagem) => {
    if (!mensagem || mensagem.remetente_tipo !== 'cliente') return;

    setAnalisandoIA(true);
    try {
      const resultado = await base44.functions.invoke('analisarMensagemIA', {
        mensagem_id: mensagem.id,
        conteudo_mensagem: mensagem.mensagem
      });

      if (resultado.data?.analise?.templates_sugeridos?.length > 0) {
        setSugestaoIA(resultado.data.analise);
      }

      queryClient.invalidateQueries(['mensagens_todas']);
    } catch (error) {
      console.error('Erro ao analisar:', error);
    } finally {
      setAnalisandoIA(false);
    }
  };

  const adicionarTagMensagem = async (mensagemId, tag) => {
    const msgs = conversa.mensagens.filter(m => m.id === mensagemId);
    if (msgs.length === 0) return;

    const msg = msgs[0];
    const tagsAtuais = msg.tags || [];

    if (!tagsAtuais.includes(tag)) {
      await base44.entities.Mensagem.update(mensagemId, {
        tags: [...tagsAtuais, tag]
      });
      queryClient.invalidateQueries(['mensagens_todas']);
    }
  };

  const removerTagMensagem = async (mensagemId, tag) => {
    const msgs = conversa.mensagens.filter(m => m.id === mensagemId);
    if (msgs.length === 0) return;

    const msg = msgs[0];
    const tagsAtuais = msg.tags || [];

    await base44.entities.Mensagem.update(mensagemId, {
      tags: tagsAtuais.filter(t => t !== tag)
    });
    queryClient.invalidateQueries(['mensagens_todas']);
  };

  const usarTemplateSugerido = async (template) => {
    const templates = await base44.entities.RespostaTemplate.filter({ id: template.template_id });
    if (templates && templates.length > 0) {
      let conteudoProcessado = templates[0].conteudo;

      // Substituir placeholders
      const placeholders = {
        '{{nome_cliente}}': cliente.nome,
        '{{email_cliente}}': cliente.email,
        '{{telefone_cliente}}': cliente.telefone || '',
        '{{data_hoje}}': new Date().toLocaleDateString('pt-BR'),
      };

      Object.entries(placeholders).forEach(([chave, valor]) => {
        conteudoProcessado = conteudoProcessado.replaceAll(chave, valor);
      });

      setNovaMensagem(conteudoProcessado);
      setSugestaoIA(null);
    }
  };

  const enviarMensagemMutation = useMutation({
    mutationFn: async () => {
      setEnviando(true);
      const resultado = await base44.functions.invoke('enviarMensagemComEmail', {
        cliente_id: cliente.id,
        titulo: conversa.titulo,
        mensagem: novaMensagem,
        assunto: conversa.mensagens[0]?.assunto || 'geral',
        conversa_id: conversaId,
        enviar_email: enviarEmail,
        anexos: anexos,
        prioridade: conversa.prioridade || 'normal'
      });
      return resultado.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensagens_todas']);
      setNovaMensagem("");
      setAnexos([]);
      setEnviando(false);
      scrollToBottom();
    },
    onError: () => {
      setEnviando(false);
    }
  });

  const handleUploadAnexo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const resultado = await base44.integrations.Core.UploadFile({ file });
      setAnexos([...anexos, { nome: file.name, url: resultado.file_url }]);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    }
  };

  const mudarStatusMutation = useMutation({
    mutationFn: (novoStatus) => {
      return Promise.all(
        conversa.mensagens.map(msg =>
          base44.entities.Mensagem.update(msg.id, { status: novoStatus })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensagens_todas']);
    },
  });

  const encerrarConversaMutation = useMutation({
    mutationFn: async () => {
      setEncerrandoConversa(true);
      const resultado = await base44.functions.invoke('encerrarConversaCliente', {
        conversa_id: conversaId,
        cliente_id: cliente.id
      });
      return resultado.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensagens_todas']);
      toast.success('Conversa encerrada! Histórico enviado por email.');
      setEncerrandoConversa(false);
    },
    onError: (error) => {
      toast.error('Erro ao encerrar: ' + error.message);
      setEncerrandoConversa(false);
    }
  });

  const getInitials = (nome) => {
    if (!nome) return "?";
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const conversaEncerrada = conversa.status === 'fechado';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{conversa.titulo}</CardTitle>
          <div className="flex gap-2">
            {!conversaEncerrada && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm('Deseja encerrar esta conversa? O histórico será enviado por email para o cliente.')) {
                    encerrarConversaMutation.mutate();
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
                    Encerrar Conversa
                  </>
                )}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  Status: {conversa.status}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => mudarStatusMutation.mutate('aberto')}>
                  Aberto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => mudarStatusMutation.mutate('em_andamento')}>
                  Em Andamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => mudarStatusMutation.mutate('resolvido')}>
                  Resolvido
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => mudarStatusMutation.mutate('fechado')}>
                  Fechado
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {conversaEncerrada && (
          <Alert className="mb-4 bg-gray-100 border-gray-300">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription>
              Esta conversa foi encerrada. O histórico foi enviado por email para o cliente.
            </AlertDescription>
          </Alert>
        )}

        {/* Sugestão de IA */}
        {sugestaoIA && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-purple-900 mb-2">
                  Análise Inteligente da Mensagem
                </h4>
                <p className="text-sm text-gray-700 mb-3">{sugestaoIA.resumo_analise}</p>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Templates Sugeridos:</p>
                  {sugestaoIA.templates_sugeridos.slice(0, 3).map((temp, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{temp.nome}</p>
                        <p className="text-xs text-gray-600">{temp.motivo}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => usarTemplateSugerido(temp)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Usar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSugestaoIA(null)}
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        {/* Mensagens */}
        <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-lg">
          {conversa.mensagens
            .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
            .map((msg) => {
              const isAdmin = msg.remetente_tipo === 'admin';

              return (
                <div
                  key={msg.id}
                  className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${isAdmin ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="flex-shrink-0 h-8 w-8">
                      <AvatarFallback className={
                        isAdmin
                          ? "bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white text-xs"
                          : "bg-gray-300 text-gray-700 text-xs"
                      }>
                        {getInitials(msg.remetente_nome || (isAdmin ? user?.full_name : cliente.nome))}
                      </AvatarFallback>
                    </Avatar>

                    <div className={`flex-1 ${isAdmin ? 'text-right' : ''}`}>
                      <div className={`rounded-2xl p-3 ${
                        isAdmin
                          ? 'bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.mensagem}</p>

                        {msg.arquivos && msg.arquivos.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.arquivos.map((arquivo, idx) => (
                              <a
                                key={idx}
                                href={arquivo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 text-xs p-2 rounded ${
                                  isAdmin ? 'bg-white/20' : 'bg-gray-100'
                                }`}
                              >
                                <Paperclip className="w-3 h-3" />
                                {arquivo.nome}
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Tags */}
                        {msg.tags && msg.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {msg.tags.map((tag, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className={`text-xs cursor-pointer ${isAdmin ? 'bg-white/20 text-white' : 'bg-gray-100'}`}
                                onClick={() => removerTagMensagem(msg.id, tag)}
                              >
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Adicionar Tag e Analisar IA */}
                      {!isAdmin && (
                        <div className="mt-2 flex gap-2 justify-start">
                          <Input
                            placeholder="Adicionar tag..."
                            value={tagsMsg[msg.id] || ""}
                            onChange={(e) => setTagsMsg({ ...tagsMsg, [msg.id]: e.target.value })}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && tagsMsg[msg.id]?.trim()) {
                                adicionarTagMensagem(msg.id, tagsMsg[msg.id].trim());
                                setTagsMsg({ ...tagsMsg, [msg.id]: "" });
                              }
                            }}
                            className="h-7 text-xs max-w-[150px]"
                          />
                          {msg.remetente_tipo === 'cliente' && !msg.template_sugerido_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => analisarMensagemIA(msg)}
                              disabled={analisandoIA}
                              className="h-7 text-xs px-2"
                            >
                              {analisandoIA ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Analisar IA
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}

                      <div className={`flex items-center gap-2 mt-1 text-xs ${
                        isAdmin ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-gray-500">
                          {new Date(msg.created_date).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {msg.email_enviado && (
                          <Badge variant="outline" className="text-xs">
                            <Mail className="w-3 h-3 mr-1" />
                            Email enviado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        {/* Anexos Selecionados */}
        {anexos.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {anexos.map((anexo, idx) => (
              <Badge key={idx} variant="secondary" className="flex items-center gap-2">
                <Paperclip className="w-3 h-3" />
                {anexo.nome}
                <button
                  onClick={() => setAnexos(anexos.filter((_, i) => i !== idx))}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Input de Resposta */}
        {!conversaEncerrada && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Textarea
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={3}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    if (novaMensagem.trim()) {
                      enviarMensagemMutation.mutate();
                    }
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="enviar-email"
                    checked={enviarEmail}
                    onCheckedChange={setEnviarEmail}
                  />
                  <Label htmlFor="enviar-email" className="text-sm cursor-pointer">
                    Enviar por email também
                  </Label>
                </div>

                <input
                  type="file"
                  id="anexo-upload"
                  className="hidden"
                  onChange={handleUploadAnexo}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => document.getElementById('anexo-upload').click()}
                >
                  <Paperclip className="w-4 h-4 mr-1" />
                  Anexar
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={onTemplateClick}
                >
                  <Star className="w-4 h-4 mr-1" />
                  Usar Template
                </Button>
              </div>

              <Button
                onClick={() => enviarMensagemMutation.mutate()}
                disabled={!novaMensagem.trim() || enviando}
                className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)] gap-2"
              >
                <Send className="w-4 h-4" />
                {enviando ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              💡 Pressione Ctrl+Enter para enviar rapidamente
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
