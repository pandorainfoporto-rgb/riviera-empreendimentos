import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CheckCircle2, XCircle, Clock, Search, Eye, MessageSquare, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function LeadsImobiliarias() {
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');
  const [leadSelecionado, setLeadSelecionado] = useState(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [showAprovar, setShowAprovar] = useState(false);
  const [showRejeitar, setShowRejeitar] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ['leads_prevenda'],
    queryFn: () => base44.entities.LeadPreVenda.list('-created_date'),
  });

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const atualizarStatusMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeadPreVenda.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads_prevenda'] });
      setShowAprovar(false);
      setShowRejeitar(false);
      setShowDetalhes(false);
      setObservacoes('');
      toast.success('Status atualizado com sucesso!');
    },
  });

  const handleAprovar = () => {
    atualizarStatusMutation.mutate({
      id: leadSelecionado.id,
      data: {
        status: 'aprovado',
        observacoes_incorporadora: observacoes,
        data_retorno: new Date().toISOString(),
      },
    });
  };

  const handleRejeitar = () => {
    atualizarStatusMutation.mutate({
      id: leadSelecionado.id,
      data: {
        status: 'rejeitado',
        observacoes_incorporadora: observacoes,
      },
    });
  };

  const handleConverter = () => {
    atualizarStatusMutation.mutate({
      id: leadSelecionado.id,
      data: {
        status: 'convertido',
        observacoes_incorporadora: observacoes,
      },
    });
  };

  const leadsFiltrados = leads.filter(lead => {
    const imobiliaria = imobiliarias.find(i => i.id === lead.imobiliaria_id);
    const matchBusca = !busca || 
      lead.nome_cliente?.toLowerCase().includes(busca.toLowerCase()) ||
      lead.email?.toLowerCase().includes(busca.toLowerCase()) ||
      imobiliaria?.nome?.toLowerCase().includes(busca.toLowerCase());
    
    const matchStatus = filtroStatus === 'todos' || lead.status === filtroStatus;
    
    return matchBusca && matchStatus;
  });

  const statusColors = {
    novo: 'bg-blue-100 text-blue-800 border-blue-300',
    em_analise: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    aprovado: 'bg-green-100 text-green-800 border-green-300',
    convertido: 'bg-purple-100 text-purple-800 border-purple-300',
    rejeitado: 'bg-red-100 text-red-800 border-red-300',
    cancelado: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const statusLabels = {
    novo: 'Novo',
    em_analise: 'Em Análise',
    aprovado: 'Aprovado',
    convertido: 'Convertido',
    rejeitado: 'Rejeitado',
    cancelado: 'Cancelado',
  };

  const interesseColors = {
    baixo: 'bg-gray-100 text-gray-700',
    medio: 'bg-blue-100 text-blue-700',
    alto: 'bg-red-100 text-red-700',
  };

  const leadsNovos = leads.filter(l => l.status === 'novo').length;
  const leadsEmAnalise = leads.filter(l => l.status === 'em_analise').length;
  const leadsAprovados = leads.filter(l => l.status === 'aprovado').length;
  const leadsConvertidos = leads.filter(l => l.status === 'convertido').length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Leads de Imobiliárias</h1>
          <p className="text-gray-600 mt-1">Gerencie os leads cadastrados pelas imobiliárias parceiras</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-t-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Novos</p>
                <p className="text-2xl font-bold text-blue-700">{leadsNovos}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Em Análise</p>
                <p className="text-2xl font-bold text-yellow-700">{leadsEmAnalise}</p>
              </div>
              <Search className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Aprovados</p>
                <p className="text-2xl font-bold text-green-700">{leadsAprovados}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Convertidos</p>
                <p className="text-2xl font-bold text-purple-700">{leadsConvertidos}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, email ou imobiliária..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Tabs value={filtroStatus} onValueChange={setFiltroStatus}>
              <TabsList className="bg-gray-100">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="novo">Novos</TabsTrigger>
                <TabsTrigger value="em_analise">Em Análise</TabsTrigger>
                <TabsTrigger value="aprovado">Aprovados</TabsTrigger>
                <TabsTrigger value="convertido">Convertidos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Leads */}
      <div className="space-y-4">
        {leadsFiltrados.map((lead) => {
          const imobiliaria = imobiliarias.find(i => i.id === lead.imobiliaria_id);
          const unidade = unidades.find(u => u.id === lead.unidade_id);

          return (
            <Card key={lead.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{lead.nome_cliente}</h3>
                        <p className="text-sm text-gray-600">{lead.email} • {lead.telefone}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={statusColors[lead.status]}>
                          {statusLabels[lead.status]}
                        </Badge>
                        <Badge className={interesseColors[lead.interesse_nivel]}>
                          Interesse: {lead.interesse_nivel}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Imobiliária</p>
                        <p className="font-semibold">{imobiliaria?.nome || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Unidade</p>
                        <p className="font-semibold">{unidade?.codigo || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Renda Mensal</p>
                        <p className="font-semibold">
                          {lead.renda_mensal ? `R$ ${lead.renda_mensal.toLocaleString('pt-BR')}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Entrada</p>
                        <p className="font-semibold">
                          {lead.valor_entrada ? `R$ ${lead.valor_entrada.toLocaleString('pt-BR')}` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {lead.observacoes_imobiliaria && (
                      <p className="text-sm text-gray-600 italic">
                        💬 {lead.observacoes_imobiliaria}
                      </p>
                    )}

                    <p className="text-xs text-gray-400">
                      Cadastrado em {format(parseISO(lead.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => {
                        setLeadSelecionado(lead);
                        setShowDetalhes(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>

                    {lead.status === 'novo' && (
                      <>
                        <Button
                          onClick={() => {
                            setLeadSelecionado(lead);
                            setShowAprovar(true);
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() => {
                            setLeadSelecionado(lead);
                            setShowRejeitar(true);
                          }}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rejeitar
                        </Button>
                      </>
                    )}

                    {lead.status === 'aprovado' && (
                      <Button
                        onClick={() => {
                          setLeadSelecionado(lead);
                          handleConverter();
                        }}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Converter
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {leadsFiltrados.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum lead encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Detalhes */}
      {showDetalhes && leadSelecionado && (
        <Dialog open onOpenChange={setShowDetalhes}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome Completo</Label>
                  <p className="font-semibold">{leadSelecionado.nome_cliente}</p>
                </div>
                <div>
                  <Label>CPF</Label>
                  <p className="font-semibold">{leadSelecionado.cpf}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-semibold">{leadSelecionado.email}</p>
                </div>
                <div>
                  <Label>Telefone</Label>
                  <p className="font-semibold">{leadSelecionado.telefone}</p>
                </div>
                {leadSelecionado.telefone_secundario && (
                  <div>
                    <Label>Telefone Secundário</Label>
                    <p className="font-semibold">{leadSelecionado.telefone_secundario}</p>
                  </div>
                )}
                {leadSelecionado.profissao && (
                  <div>
                    <Label>Profissão</Label>
                    <p className="font-semibold">{leadSelecionado.profissao}</p>
                  </div>
                )}
                <div>
                  <Label>Renda Mensal</Label>
                  <p className="font-semibold">
                    R$ {(leadSelecionado.renda_mensal || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label>Valor de Entrada</Label>
                  <p className="font-semibold">
                    R$ {(leadSelecionado.valor_entrada || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label>Forma de Pagamento</Label>
                  <p className="font-semibold">{leadSelecionado.forma_pagamento_pretendida}</p>
                </div>
                <div>
                  <Label>Nível de Interesse</Label>
                  <Badge className={interesseColors[leadSelecionado.interesse_nivel]}>
                    {leadSelecionado.interesse_nivel}
                  </Badge>
                </div>
              </div>

              {leadSelecionado.observacoes_imobiliaria && (
                <div>
                  <Label>Observações da Imobiliária</Label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {leadSelecionado.observacoes_imobiliaria}
                  </p>
                </div>
              )}

              {leadSelecionado.observacoes_incorporadora && (
                <div>
                  <Label>Observações da Incorporadora</Label>
                  <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                    {leadSelecionado.observacoes_incorporadora}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetalhes(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Aprovar */}
      {showAprovar && leadSelecionado && (
        <Dialog open onOpenChange={setShowAprovar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Deseja aprovar o lead de <strong>{leadSelecionado.nome_cliente}</strong>?</p>
              <div>
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione observações..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAprovar(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAprovar} className="bg-green-600 hover:bg-green-700">
                Aprovar Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Rejeitar */}
      {showRejeitar && leadSelecionado && (
        <Dialog open onOpenChange={setShowRejeitar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Deseja rejeitar o lead de <strong>{leadSelecionado.nome_cliente}</strong>?</p>
              <div>
                <Label>Motivo (opcional)</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione o motivo da rejeição..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejeitar(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRejeitar} className="bg-red-600 hover:bg-red-700">
                Rejeitar Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}