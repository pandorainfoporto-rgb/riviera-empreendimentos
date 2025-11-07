import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, Mail, Phone, FileText, Video, Calendar, 
  Search, Filter, Download, ArrowUpDown, Eye, CheckCircle2,
  Clock, Send, Inbox
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const tipoIcons = {
  mensagem: MessageSquare,
  email: Mail,
  telefone: Phone,
  whatsapp: MessageSquare,
  reuniao: Video,
  visita: Calendar,
  documento_enviado: FileText,
  notificacao: Send,
  sms: MessageSquare,
  outros: FileText
};

const canalColors = {
  sistema: "bg-blue-100 text-blue-700",
  email: "bg-purple-100 text-purple-700",
  whatsapp: "bg-green-100 text-green-700",
  telefone: "bg-orange-100 text-orange-700",
  presencial: "bg-gray-100 text-gray-700",
  sms: "bg-pink-100 text-pink-700"
};

export default function HistoricoComunicacao({ cliente }) {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroCanal, setFiltroCanal] = useState("todos");
  const [ordenacao, setOrdenacao] = useState("recente");

  const { data: historico = [], isLoading } = useQuery({
    queryKey: ['historico_comunicacao', cliente.id],
    queryFn: () => base44.entities.HistoricoComunicacao.filter({ cliente_id: cliente.id }),
  });

  const { data: mensagens = [] } = useQuery({
    queryKey: ['mensagens_cliente', cliente.id],
    queryFn: () => base44.entities.Mensagem.filter({ cliente_id: cliente.id }),
  });

  // Combinar histórico direto + mensagens
  const comunicacoesCompletas = [
    ...historico,
    ...mensagens.map(m => ({
      id: m.id,
      cliente_id: m.cliente_id,
      tipo: 'mensagem',
      canal: 'sistema',
      assunto: m.assunto,
      conteudo: m.mensagem,
      remetente: m.remetente_nome,
      remetente_email: m.remetente_email,
      direcao: m.remetente_tipo === 'admin' ? 'enviado' : 'recebido',
      data_comunicacao: m.created_date,
      lido: m.lida,
      data_leitura: m.data_leitura
    }))
  ];

  const comunicacoesFiltradas = comunicacoesCompletas
    .filter(c => {
      const matchesBusca = c.conteudo?.toLowerCase().includes(busca.toLowerCase()) ||
                           c.assunto?.toLowerCase().includes(busca.toLowerCase());
      const matchesTipo = filtroTipo === 'todos' || c.tipo === filtroTipo;
      const matchesCanal = filtroCanal === 'todos' || c.canal === filtroCanal;
      return matchesBusca && matchesTipo && matchesCanal;
    })
    .sort((a, b) => {
      if (ordenacao === 'recente') {
        return new Date(b.data_comunicacao) - new Date(a.data_comunicacao);
      } else {
        return new Date(a.data_comunicacao) - new Date(b.data_comunicacao);
      }
    });

  const estatisticas = {
    total: comunicacoesFiltradas.length,
    enviadas: comunicacoesFiltradas.filter(c => c.direcao === 'enviado').length,
    recebidas: comunicacoesFiltradas.filter(c => c.direcao === 'recebido').length,
    naoLidas: comunicacoesFiltradas.filter(c => !c.lido && c.direcao === 'recebido').length,
    emails: comunicacoesFiltradas.filter(c => c.tipo === 'email' || c.email_enviado).length,
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--wine-600)] mx-auto"></div>
        <p className="mt-2 text-gray-600 text-sm">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-[var(--wine-600)]">{estatisticas.total}</p>
            <p className="text-xs text-gray-600">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{estatisticas.enviadas}</p>
            <p className="text-xs text-gray-600">Enviadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{estatisticas.recebidas}</p>
            <p className="text-xs text-gray-600">Recebidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{estatisticas.naoLidas}</p>
            <p className="text-xs text-gray-600">Não Lidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{estatisticas.emails}</p>
            <p className="text-xs text-gray-600">Emails</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar comunicações..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Tipos</SelectItem>
            <SelectItem value="mensagem">Mensagens</SelectItem>
            <SelectItem value="email">Emails</SelectItem>
            <SelectItem value="telefone">Telefone</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="documento_enviado">Documentos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroCanal} onValueChange={setFiltroCanal}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Canais</SelectItem>
            <SelectItem value="sistema">Sistema</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="telefone">Telefone</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOrdenacao(ordenacao === 'recente' ? 'antigo' : 'recente')}
        >
          <ArrowUpDown className="w-4 h-4" />
        </Button>
      </div>

      {/* Timeline de Comunicações */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {comunicacoesFiltradas.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma comunicação encontrada</p>
            </CardContent>
          </Card>
        ) : (
          comunicacoesFiltradas.map((com) => {
            const TipoIcon = tipoIcons[com.tipo] || MessageSquare;
            const isEnviado = com.direcao === 'enviado';

            return (
              <Card key={com.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${isEnviado ? 'bg-blue-50' : 'bg-green-50'}`}>
                      <TipoIcon className={`w-5 h-5 ${isEnviado ? 'text-blue-600' : 'text-green-600'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={canalColors[com.canal]}>
                              {com.canal}
                            </Badge>
                            <Badge variant="outline">
                              {com.tipo}
                            </Badge>
                            {isEnviado ? (
                              <Badge className="bg-blue-100 text-blue-700">
                                <Send className="w-3 h-3 mr-1" />
                                Enviado
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700">
                                <Inbox className="w-3 h-3 mr-1" />
                                Recebido
                              </Badge>
                            )}
                            {com.email_enviado && (
                              <Badge className="bg-purple-100 text-purple-700">
                                <Mail className="w-3 h-3 mr-1" />
                                Email enviado
                              </Badge>
                            )}
                            {com.lido && (
                              <Badge className="bg-gray-100 text-gray-700">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Lido
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 mt-2">{com.assunto || 'Sem assunto'}</h4>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {format(parseISO(com.data_comunicacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                        {com.conteudo}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {isEnviado ? 'De' : 'Para'}: <strong>{isEnviado ? com.remetente : com.destinatario}</strong>
                        </span>
                        {com.tempo_resposta_minutos && (
                          <span>
                            <Clock className="w-3 h-3 inline mr-1" />
                            Respondido em {com.tempo_resposta_minutos}min
                          </span>
                        )}
                        {com.anexos && com.anexos.length > 0 && (
                          <span>
                            <FileText className="w-3 h-3 inline mr-1" />
                            {com.anexos.length} anexo(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}