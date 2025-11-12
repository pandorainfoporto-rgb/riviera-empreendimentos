import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Users, MessageSquare, TrendingUp, Building, Award, UserPlus } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

import LayoutImobiliaria from "../components/LayoutImobiliaria";

export default function PortalImobiliariaDashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: imobiliaria } = useQuery({
    queryKey: ['minha_imobiliaria'],
    queryFn: async () => {
      if (!user?.imobiliaria_id) return null;
      const result = await base44.entities.Imobiliaria.filter({ id: user.imobiliaria_id });
      return result[0];
    },
    enabled: !!user?.imobiliaria_id,
  });

  const { data: lotesDisponiveis = [] } = useQuery({
    queryKey: ['lotes_disponiveis'],
    queryFn: () => base44.entities.Unidade.filter({ status: 'disponivel' }),
  });

  const { data: meusLeads = [] } = useQuery({
    queryKey: ['meus_leads'],
    queryFn: async () => {
      if (!user?.imobiliaria_id) return [];
      return await base44.entities.LeadPreVenda.filter({ imobiliaria_id: user.imobiliaria_id });
    },
    enabled: !!user?.imobiliaria_id,
  });

  const { data: mensagensNaoLidas = 0 } = useQuery({
    queryKey: ['mensagens_nao_lidas'],
    queryFn: async () => {
      if (!user?.imobiliaria_id) return 0;
      const mensagens = await base44.entities.MensagemImobiliaria.filter({ 
        imobiliaria_id: user.imobiliaria_id,
        lida: false,
        remetente_tipo: 'incorporadora'
      });
      return mensagens.length;
    },
    enabled: !!user?.imobiliaria_id,
  });

  const leadsNovos = meusLeads.filter(l => l.status === 'novo').length;
  const leadsConvertidos = meusLeads.filter(l => l.status === 'convertido').length;
  const leadsEmAnalise = meusLeads.filter(l => l.status === 'em_analise').length;

  return (
    <LayoutImobiliaria>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">
            Bem-vindo ao Portal, {user?.full_name}!
          </h1>
          <p className="text-gray-600 mt-2">
            {imobiliaria?.nome || 'Carregando...'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-t-4 border-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Lotes Disponíveis</p>
                  <p className="text-3xl font-bold text-gray-900">{lotesDisponiveis.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MapPin className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Meus Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{meusLeads.length}</p>
                  <p className="text-xs text-gray-500 mt-1">{leadsNovos} novos</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Mensagens</p>
                  <p className="text-3xl font-bold text-gray-900">{mensagensNaoLidas}</p>
                  <p className="text-xs text-gray-500 mt-1">não lidas</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Convertidos</p>
                  <p className="text-3xl font-bold text-gray-900">{leadsConvertidos}</p>
                  <p className="text-xs text-gray-500 mt-1">este mês</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Award className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to={createPageUrl('PortalImobiliariaLotes')}>
                <Button className="w-full h-20 bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-lg">
                  <MapPin className="w-6 h-6 mr-2" />
                  Ver Lotes Disponíveis
                </Button>
              </Link>

              <Link to={createPageUrl('LeadsImobiliarias')}>
                <Button className="w-full h-20 bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 text-lg">
                  <UserPlus className="w-6 h-6 mr-2" />
                  Cadastrar Novo Lead
                </Button>
              </Link>

              <Link to={createPageUrl('PortalImobiliariaMensagens')}>
                <Button className="w-full h-20 bg-gradient-to-r from-purple-600 to-violet-600 hover:opacity-90 text-lg relative">
                  <MessageSquare className="w-6 h-6 mr-2" />
                  Enviar Mensagem
                  {mensagensNaoLidas > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {mensagensNaoLidas}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Leads Recentes */}
        {meusLeads.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Leads Recentes</CardTitle>
                <Link to={createPageUrl('LeadsImobiliarias')}>
                  <Button variant="outline" size="sm">
                    Ver Todos
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {meusLeads.slice(0, 5).map((lead) => {
                  const statusColors = {
                    novo: 'bg-blue-100 text-blue-800',
                    em_analise: 'bg-yellow-100 text-yellow-800',
                    aprovado: 'bg-green-100 text-green-800',
                    convertido: 'bg-purple-100 text-purple-800',
                    rejeitado: 'bg-red-100 text-red-800',
                  };

                  return (
                    <div key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{lead.nome_cliente}</h4>
                        <p className="text-sm text-gray-600">{lead.email} • {lead.telefone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                          {lead.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {meusLeads.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhum lead cadastrado ainda
              </h3>
              <p className="text-gray-600 mb-6">
                Comece cadastrando seu primeiro lead e acompanhe todo o processo de vendas
              </p>
              <Link to={createPageUrl('LeadsImobiliarias')}>
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Cadastrar Primeiro Lead
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutImobiliaria>
  );
}