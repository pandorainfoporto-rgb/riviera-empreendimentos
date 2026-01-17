import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  DollarSign, TrendingUp, FileText, Calendar, AlertCircle, 
  Building2, PieChart, ArrowRight, Wallet, Users
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import LayoutSocio from "../components/LayoutSocio";

export default function PortalSocioDashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: socio } = useQuery({
    queryKey: ['meu_socio', user?.socio_id],
    queryFn: async () => {
      if (!user?.socio_id) return null;
      return await base44.entities.Socio.get(user.socio_id);
    },
    enabled: !!user?.socio_id,
  });

  const { data: aportes = [] } = useQuery({
    queryKey: ['meus_aportes', user?.socio_id],
    queryFn: async () => {
      if (!user?.socio_id) return [];
      return await base44.entities.AporteSocio.filter({ socio_id: user.socio_id }, '-data_vencimento');
    },
    enabled: !!user?.socio_id,
  });

  const { data: atas = [] } = useQuery({
    queryKey: ['atas_recentes'],
    queryFn: () => base44.entities.AtaAssembleia.filter({ status: 'publicada' }, '-data_realizacao', 5),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const hoje = new Date().toISOString().split('T')[0];
  
  // Estatísticas de aportes
  const aportesPendentes = aportes.filter(a => a.status === 'pendente');
  const aportesAtrasados = aportes.filter(a => a.status === 'pendente' && a.data_vencimento < hoje);
  const totalAportado = aportes
    .filter(a => a.status === 'pago')
    .reduce((sum, a) => sum + (a.valor || 0), 0);
  const totalPendente = aportesPendentes.reduce((sum, a) => sum + (a.valor || 0), 0);

  // Estatísticas de empreendimentos
  const unidadesVendidas = unidades.filter(u => u.status === 'vendida').length;
  const unidadesEmConstrucao = unidades.filter(u => u.status === 'em_construcao').length;

  return (
    <LayoutSocio>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--wine-700)]">
              Olá, {socio?.nome?.split(' ')[0] || 'Sócio'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Bem-vindo ao Portal do Sócio • {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Alertas */}
        {aportesAtrasados.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800">Atenção: Você tem {aportesAtrasados.length} aporte(s) em atraso</p>
              <p className="text-sm text-red-600">
                Total em atraso: R$ {aportesAtrasados.reduce((sum, a) => sum + (a.valor || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Link to={createPageUrl('PortalSocioAportes')}>
              <Button variant="outline" className="border-red-400 text-red-700 hover:bg-red-100">
                Ver Aportes
              </Button>
            </Link>
          </div>
        )}

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Aportado</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {totalAportado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">A Pagar</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Wallet className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unidades Vendidas</p>
                  <p className="text-2xl font-bold text-blue-600">{unidadesVendidas}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Em Construção</p>
                  <p className="text-2xl font-bold text-purple-600">{unidadesEmConstrucao}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <PieChart className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Próximos Aportes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[var(--wine-600)]" />
                Próximos Aportes
              </CardTitle>
              <Link to={createPageUrl('PortalSocioAportes')}>
                <Button variant="ghost" size="sm">
                  Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {aportesPendentes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum aporte pendente</p>
              ) : (
                <div className="space-y-3">
                  {aportesPendentes.slice(0, 3).map(aporte => (
                    <div key={aporte.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{aporte.descricao || 'Aporte Mensal'}</p>
                        <p className="text-sm text-gray-500">
                          Vencimento: {format(new Date(aporte.data_vencimento), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[var(--wine-700)]">
                          R$ {(aporte.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <Badge className={aporte.data_vencimento < hoje ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                          {aporte.data_vencimento < hoje ? 'Atrasado' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Últimas Atas/Assembleias */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--wine-600)]" />
                Atas e Assembleias Recentes
              </CardTitle>
              <Link to={createPageUrl('PortalSocioAtas')}>
                <Button variant="ghost" size="sm">
                  Ver todas <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {atas.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma ata publicada</p>
              ) : (
                <div className="space-y-3">
                  {atas.slice(0, 3).map(ata => (
                    <div key={ata.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{ata.titulo}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(ata.data_realizacao), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {ata.tipo}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumo dos Loteamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[var(--wine-600)]" />
              Resumo dos Loteamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loteamentos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum loteamento cadastrado</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loteamentos.map(loteamento => {
                  const unidadesLoteamento = unidades.filter(u => u.loteamento_id === loteamento.id);
                  const vendidas = unidadesLoteamento.filter(u => u.status === 'vendida').length;
                  const total = unidadesLoteamento.length;
                  const percentual = total > 0 ? Math.round((vendidas / total) * 100) : 0;

                  return (
                    <div key={loteamento.id} className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900">{loteamento.nome}</h4>
                      <p className="text-sm text-gray-500 mb-3">{loteamento.cidade} - {loteamento.estado}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Vendas</span>
                          <span className="font-medium">{vendidas}/{total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] h-2 rounded-full transition-all"
                            style={{ width: `${percentual}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-right">{percentual}% comercializado</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutSocio>
  );
}