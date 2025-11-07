import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Send, Mail, MessageSquare, Phone, FileText, Clock, 
  CheckCircle, Sparkles, Search, Filter, Calendar
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import HistoricoComunicacao from "./HistoricoComunicacao";
import RespostasRapidas from "./RespostasRapidas";

export default function ComunicacaoCliente({ cliente }) {
  const [assunto, setAssunto] = useState("geral");
  const [mensagem, setMensagem] = useState("");
  const [enviarEmail, setEnviarEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const enviarMensagemMutation = useMutation({
    mutationFn: async (data) => {
      const conversaId = `conv_${cliente.id}_${Date.now()}`;
      
      // Criar mensagem
      const novaMensagem = await base44.entities.Mensagem.create({
        cliente_id: cliente.id,
        conversa_id: conversaId,
        titulo: data.assunto,
        assunto: data.assunto,
        mensagem: data.mensagem,
        remetente_tipo: 'admin',
        remetente_email: user.email,
        remetente_nome: user.full_name,
        lida: false,
        status: 'aberto',
        prioridade: 'normal'
      });

      // Registrar no histórico
      await base44.entities.HistoricoComunicacao.create({
        cliente_id: cliente.id,
        tipo: 'mensagem',
        canal: 'sistema',
        assunto: data.assunto,
        conteudo: data.mensagem,
        remetente: user.full_name,
        remetente_email: user.email,
        destinatario: cliente.nome,
        destinatario_email: cliente.email,
        direcao: 'enviado',
        mensagem_id: novaMensagem.id,
        data_comunicacao: new Date().toISOString(),
        lido: false
      });

      // Enviar email se solicitado
      if (data.enviarEmail && cliente.email) {
        try {
          await base44.integrations.Core.SendEmail({
            to: cliente.email,
            subject: `Mensagem da Riviera: ${data.assunto}`,
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #922B3E 0%, #7D5999 100%); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0;">Riviera Incorporadora</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                  <div style="background: white; padding: 25px; border-radius: 8px;">
                    <p style="margin: 0 0 15px 0;"><strong>Olá, ${cliente.nome}!</strong></p>
                    <p style="color: #4B5563; line-height: 1.6; white-space: pre-wrap;">${data.mensagem}</p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                      <p style="margin: 0; color: #6B7280; font-size: 14px;">
                        Atenciosamente,<br/>
                        <strong>${user.full_name}</strong><br/>
                        Riviera Incorporadora
                      </p>
                    </div>
                  </div>
                </div>
                <div style="padding: 20px; text-align: center; background: #1F2937; color: white;">
                  <p style="margin: 0; font-size: 12px;">© 2025 Riviera Incorporadora</p>
                </div>
              </div>
            `,
            from_name: 'Riviera Incorporadora'
          });

          // Atualizar histórico
          await base44.entities.HistoricoComunicacao.create({
            cliente_id: cliente.id,
            tipo: 'email',
            canal: 'email',
            assunto: data.assunto,
            conteudo: data.mensagem,
            remetente: user.full_name,
            remetente_email: user.email,
            destinatario: cliente.nome,
            destinatario_email: cliente.email,
            direcao: 'enviado',
            data_comunicacao: new Date().toISOString(),
            email_enviado: true
          });
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError);
          toast.error('Mensagem enviada, mas houve erro ao enviar email');
        }
      }

      return novaMensagem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensagens']);
      queryClient.invalidateQueries(['historico_comunicacao']);
      setMensagem("");
      setEnviarEmail(false);
      toast.success(enviarEmail ? 'Mensagem e email enviados!' : 'Mensagem enviada!');
    },
    onError: (error) => {
      toast.error('Erro ao enviar: ' + error.message);
    }
  });

  const handleEnviar = () => {
    if (!mensagem.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    enviarMensagemMutation.mutate({
      assunto,
      mensagem,
      enviarEmail
    });
  };

  const handleUsarRespostaRapida = (resposta) => {
    let conteudoProcessado = resposta.conteudo;
    
    // Substituir placeholders
    conteudoProcessado = conteudoProcessado.replace(/\{\{nome_cliente\}\}/g, cliente.nome);
    conteudoProcessado = conteudoProcessado.replace(/\{\{email_cliente\}\}/g, cliente.email || '');
    conteudoProcessado = conteudoProcessado.replace(/\{\{telefone_cliente\}\}/g, cliente.telefone || '');
    
    setMensagem(conteudoProcessado);
    setAssunto(resposta.assunto);
    if (resposta.enviar_email) {
      setEnviarEmail(true);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)]">
          <CardTitle className="flex items-center gap-2 text-[var(--wine-700)]">
            <MessageSquare className="w-5 h-5" />
            Central de Comunicação - {cliente.nome}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="enviar" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="enviar">
                <Send className="w-4 h-4 mr-2" />
                Enviar Mensagem
              </TabsTrigger>
              <TabsTrigger value="historico">
                <Clock className="w-4 h-4 mr-2" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="respostas">
                <Sparkles className="w-4 h-4 mr-2" />
                Respostas Rápidas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="enviar" className="space-y-4 mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Destinatário</Label>
                  <Input value={cliente.nome} disabled />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={cliente.email || 'Não informado'} disabled />
                </div>
              </div>

              <div>
                <Label>Assunto</Label>
                <Select value={assunto} onValueChange={setAssunto}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="negociacao">Negociação</SelectItem>
                    <SelectItem value="pagamento">Pagamento</SelectItem>
                    <SelectItem value="documento">Documento</SelectItem>
                    <SelectItem value="obra">Obra</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="suporte">Suporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Mensagem</Label>
                <Textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  rows={8}
                  className="resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enviarEmail}
                      onChange={(e) => setEnviarEmail(e.target.checked)}
                      className="w-4 h-4"
                      disabled={!cliente.email}
                    />
                    <span className="text-sm">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Enviar também por email
                    </span>
                  </label>
                </div>

                <Button
                  onClick={handleEnviar}
                  disabled={enviarMensagemMutation.isPending}
                  className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
                >
                  {enviarMensagemMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Dica:</strong> Use a aba "Respostas Rápidas" para acelerar o atendimento com mensagens pré-definidas.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="historico" className="mt-6">
              <HistoricoComunicacao cliente={cliente} />
            </TabsContent>

            <TabsContent value="respostas" className="mt-6">
              <RespostasRapidas onUsar={handleUsarRespostaRapida} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}