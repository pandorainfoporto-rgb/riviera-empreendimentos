import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users, Search, Plus, Filter, TrendingUp, Target,
  Phone, Mail, MessageSquare, Calendar, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

import LeadKanban from "../components/crm/LeadKanban";
import LeadDetalhes from "../components/crm/LeadDetalhes";
import LeadForm from "../components/crm/LeadForm";
import LeadsList from "../components/crm/LeadsList";
import TarefasFollowUp from "../components/crm/TarefasFollowUp";
import FiltrosAvancados from "../components/crm/FiltrosAvancados";
import EnviarEmailCampanha from "../components/crm/EnviarEmailCampanha";

export default function CRM() {
  const [visao, setVisao] = useState("kanban"); // kanban, lista, tarefas
  const [leadSelecionado, setLeadSelecionado] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showEmailCampanha, setShowEmailCampanha] = useState(false);
  const [editando, setEditando] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState({
    status: "todos",
    estagio: "todos",
    temperatura: "todos",
    fonte: "todos",
    imobiliaria: "todos",
    corretor: "todos",
    dataInicio: null,
    dataFim: null,
  });

  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ['leads_crm'],
    queryFn: () => base44.entities.LeadPreVenda.list('-created_date'),
  });

  const { data: atividades = [] } = useQuery({
    queryKey: ['atividades_leads'],
    queryFn: () => base44.entities.AtividadeLead.list('-data_atividade'),
  });

  const { data: tarefas = [] } = useQuery({
    queryKey: ['tarefas_followup'],
    queryFn: () => base44.entities.TarefaFollowUp.list('data_agendada'),
  });

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  const { data: corretores = [] } = useQuery({
    queryKey: ['corretores'],
    queryFn: () => base44.entities.Corretor.list(),
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeadPreVenda.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads_crm'] });
      toast.success("Lead atualizado!");
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: (data) => base44.entities.LeadPreVenda.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads_crm'] });
      setShowForm(false);
      setEditando(null);
      toast.success("Lead criado!");
    },
  });

  // Aplicar filtros
  const leadsFiltrados = leads.filter(lead => {
    const matchBusca = !busca || 
      lead.nome_cliente?.toLowerCase().includes(busca.toLowerCase()) ||
      lead.email?.toLowerCase().includes(busca.toLowerCase()) ||
      lead.telefone?.includes(busca);

    const matchStatus = filtros.status === "todos" || lead.status === filtros.status;
    const matchEstagio = filtros.estagio === "todos" || lead.estagio_funil === filtros.estagio;
    const matchTemp = filtros.temperatura === "todos" || lead.temperatura_lead === filtros.temperatura;
    const matchFonte = filtros.fonte === "todos" || lead.fonte_lead === filtros.fonte;
    const matchImob = filtros.imobiliaria === "todos" || lead.imobiliaria_id === filtros.imobiliaria;
    const matchCorr = filtros.corretor === "todos" || lead.corretor_id === filtros.corretor;

    return matchBusca && matchStatus && matchEstagio && matchTemp && matchFonte && matchImob && matchCorr;
  });

  // Estatísticas
  const stats = {
    total: leadsFiltrados.length,
    novos: leadsFiltrados.filter(l => l.status === 'novo').length,
    qualificados: leadsFiltrados.filter(l => l.status === 'qualificado').length,
    emNegociacao: leadsFiltrados.filter(l => l.status === 'em_negociacao').length,
    convertidos: leadsFiltrados.filter(l => l.status === 'convertido').length,
    taxaConversao: leadsFiltrados.length > 0 
      ? ((leadsFiltrados.filter(l => l.status === 'convertido').length / leadsFiltrados.length) * 100).toFixed(1)
      : 0,
    tarefasPendentes: tarefas.filter(t => t.status === 'pendente').length,
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">CRM - Gestão de Leads</h1>
          <p className="text-gray-600 mt-1">Pipeline completo de vendas e relacionamento</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowEmailCampanha(true)}
            variant="outline"
            className="border-purple-300"
          >
            <Mail className="w-4 h-4 mr-2" />
            Campanha Email
          </Button>
          <Button
            onClick={() => {
              setEditando(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Novos</p>
              <p className="text-2xl font-bold text-green-600">{stats.novos}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Qualificados</p>
              <p className="text-2xl font-bold text-purple-600">{stats.qualificados}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Negociação</p>
              <p className="text-2xl font-bold text-orange-600">{stats.emNegociacao}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Convertidos</p>
              <p className="text-2xl font-bold text-cyan-600">{stats.convertidos}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Taxa Conversão</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.taxaConversao}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Tarefas</p>
              <p className="text-2xl font-bold text-orange-600">{stats.tarefasPendentes}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Busca e Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, email ou telefone..."
                className="pl-10"
              />
            </div>
            <FiltrosAvancados
              filtros={filtros}
              onFiltrosChange={setFiltros}
              imobiliarias={imobiliarias}
              corretores={corretores}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Visualização */}
      <Tabs value={visao} onValueChange={setVisao}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="kanban">
            <Target className="w-4 h-4 mr-2" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="lista">
            <Users className="w-4 h-4 mr-2" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="tarefas">
            <Calendar className="w-4 h-4 mr-2" />
            Tarefas ({stats.tarefasPendentes})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-6">
          <LeadKanban
            leads={leadsFiltrados}
            onLeadClick={setLeadSelecionado}
            onUpdateLead={(id, data) => updateLeadMutation.mutate({ id, data })}
            imobiliarias={imobiliarias}
            corretores={corretores}
          />
        </TabsContent>

        <TabsContent value="lista" className="mt-6">
          <LeadsList
            leads={leadsFiltrados}
            onLeadClick={setLeadSelecionado}
            onEdit={(lead) => {
              setEditando(lead);
              setShowForm(true);
            }}
            imobiliarias={imobiliarias}
            corretores={corretores}
          />
        </TabsContent>

        <TabsContent value="tarefas" className="mt-6">
          <TarefasFollowUp
            tarefas={tarefas}
            leads={leads}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog Lead Detalhes */}
      {leadSelecionado && (
        <LeadDetalhes
          lead={leadSelecionado}
          atividades={atividades.filter(a => a.lead_id === leadSelecionado.id)}
          tarefas={tarefas.filter(t => t.lead_id === leadSelecionado.id)}
          onClose={() => setLeadSelecionado(null)}
          onUpdate={(data) => {
            updateLeadMutation.mutate({ id: leadSelecionado.id, data });
            setLeadSelecionado({ ...leadSelecionado, ...data });
          }}
          imobiliarias={imobiliarias}
          corretores={corretores}
        />
      )}

      {/* Dialog Formulário Lead */}
      {showForm && (
        <LeadForm
          lead={editando}
          onSave={(data) => {
            if (editando) {
              updateLeadMutation.mutate({ id: editando.id, data });
              setShowForm(false);
              setEditando(null);
            } else {
              createLeadMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditando(null);
          }}
          imobiliarias={imobiliarias}
          corretores={corretores}
        />
      )}

      {/* Dialog Email Campanha */}
      {showEmailCampanha && (
        <EnviarEmailCampanha
          leads={leadsFiltrados}
          onClose={() => setShowEmailCampanha(false)}
        />
      )}
    </div>
  );
}