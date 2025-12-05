import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, DollarSign, FileText, TrendingUp, MessageSquare, 
  CheckCircle, Clock, AlertTriangle, Settings, Trash2, Eye
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import LayoutSocio from "../components/LayoutSocio";

const tipoConfig = {
  novo_aporte: { label: 'Novo Aporte', icon: DollarSign, color: 'bg-green-100 text-green-800' },
  vencimento_aporte: { label: 'Vencimento', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  pagamento_confirmado: { label: 'Pagamento Confirmado', icon: CheckCircle, color: 'bg-blue-100 text-blue-800' },
  nova_ata: { label: 'Nova Ata', icon: FileText, color: 'bg-purple-100 text-purple-800' },
  alerta_financeiro: { label: 'Alerta Financeiro', icon: TrendingUp, color: 'bg-orange-100 text-orange-800' },
  comunicado_diretoria: { label: 'Comunicado', icon: MessageSquare, color: 'bg-indigo-100 text-indigo-800' },
};

const prioridadeConfig = {
  baixa: { label: 'Baixa', color: 'bg-gray-100 text-gray-600' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-600' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-600' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-600' },
};

export default function PortalSocioNotificacoes() {
  const [tabAtiva, setTabAtiva] = useState("todas");
  const [showConfig, setShowConfig] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notificacoes = [], isLoading } = useQuery({
    queryKey: ['minhasNotificacoes', user?.socio_id],
    queryFn: async () => {
      if (!user?.socio_id) return [];
      return await base44.entities.NotificacaoSocio.filter({ socio_id: user.socio_id }, '-created_date');
    },
    enabled: !!user?.socio_id,
    refetchInterval: 30000,
  });

  const { data: preferencias } = useQuery({
    queryKey: ['minhasPreferencias', user?.socio_id],
    queryFn: async () => {
      if (!user?.socio_id) return null;
      const prefs = await base44.entities.PreferenciaNotificacaoSocio.filter({ socio_id: user.socio_id });
      return prefs[0] || null;
    },
    enabled: !!user?.socio_id,
  });

  const [configPrefs, setConfigPrefs] = useState({
    novos_aportes: true,
    vencimento_aportes: true,
    pagamento_confirmado: true,
    novas_atas: true,
    alertas_financeiros: true,
    comunicados_diretoria: true,
    email_ativo: true,
    push_ativo: true,
  });

  React.useEffect(() => {
    if (preferencias) {
      setConfigPrefs({
        novos_aportes: preferencias.novos_aportes ?? true,
        vencimento_aportes: preferencias.vencimento_aportes ?? true,
        pagamento_confirmado: preferencias.pagamento_confirmado ?? true,
        novas_atas: preferencias.novas_atas ?? true,
        alertas_financeiros: preferencias.alertas_financeiros ?? true,
        comunicados_diretoria: preferencias.comunicados_diretoria ?? true,
        email_ativo: preferencias.email_ativo ?? true,
        push_ativo: preferencias.push_ativo ?? true,
      });
    }
  }, [preferencias]);

  const marcarLidaMutation = useMutation({
    mutationFn: async (notificacaoId) => {
      await base44.entities.NotificacaoSocio.update(notificacaoId, {
        lida: true,
        data_leitura: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhasNotificacoes'] });
    },
  });

  const marcarTodasLidasMutation = useMutation({
    mutationFn: async () => {
      const naoLidas = notificacoes.filter(n => !n.lida);
      await Promise.all(naoLidas.map(n => 
        base44.entities.NotificacaoSocio.update(n.id, {
          lida: true,
          data_leitura: new Date().toISOString(),
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhasNotificacoes'] });
      toast.success("Todas as notificações foram marcadas como lidas");
    },
  });

  const salvarPreferenciasMutation = useMutation({
    mutationFn: async (prefs) => {
      if (preferencias) {
        await base44.entities.PreferenciaNotificacaoSocio.update(preferencias.id, prefs);
      } else {
        await base44.entities.PreferenciaNotificacaoSocio.create({
          socio_id: user.socio_id,
          user_id: user.id,
          ...prefs,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhasPreferencias'] });
      toast.success("Preferências salvas com sucesso!");
      setShowConfig(false);
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  const filteredNotificacoes = notificacoes.filter(n => {
    if (tabAtiva === "todas") return true;
    if (tabAtiva === "nao_lidas") return !n.lida;
    return n.tipo === tabAtiva;
  });

  return (
    <LayoutSocio>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-[var(--wine-700)]" />
            <div>
              <h1 className="text-3xl font-bold text-[var(--wine-700)]">Notificações</h1>
              <p className="text-gray-600 mt-1">
                {naoLidas > 0 ? `${naoLidas} notificação(ões) não lida(s)` : 'Todas as notificações lidas'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {naoLidas > 0 && (
              <Button 
                variant="outline"
                onClick={() => marcarTodasLidasMutation.mutate()}
                disabled={marcarTodasLidasMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => setShowConfig(!showConfig)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>

        {/* Configurações de Notificações */}
        {showConfig && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações de Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Tipos de Notificação</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <Label htmlFor="novos_aportes">Novos aportes lançados</Label>
                    </div>
                    <Switch 
                      id="novos_aportes"
                      checked={configPrefs.novos_aportes}
                      onCheckedChange={(checked) => setConfigPrefs({...configPrefs, novos_aportes: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <Label htmlFor="vencimento_aportes">Alertas de vencimento</Label>
                    </div>
                    <Switch 
                      id="vencimento_aportes"
                      checked={configPrefs.vencimento_aportes}
                      onCheckedChange={(checked) => setConfigPrefs({...configPrefs, vencimento_aportes: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <Label htmlFor="pagamento_confirmado">Confirmações de pagamento</Label>
                    </div>
                    <Switch 
                      id="pagamento_confirmado"
                      checked={configPrefs.pagamento_confirmado}
                      onCheckedChange={(checked) => setConfigPrefs({...configPrefs, pagamento_confirmado: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <Label htmlFor="novas_atas">Novas atas e assembleias</Label>
                    </div>
                    <Switch 
                      id="novas_atas"
                      checked={configPrefs.novas_atas}
                      onCheckedChange={(checked) => setConfigPrefs({...configPrefs, novas_atas: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <Label htmlFor="alertas_financeiros">Alertas de desempenho financeiro</Label>
                    </div>
                    <Switch 
                      id="alertas_financeiros"
                      checked={configPrefs.alertas_financeiros}
                      onCheckedChange={(checked) => setConfigPrefs({...configPrefs, alertas_financeiros: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      <Label htmlFor="comunicados_diretoria">Comunicados da diretoria</Label>
                    </div>
                    <Switch 
                      id="comunicados_diretoria"
                      checked={configPrefs.comunicados_diretoria}
                      onCheckedChange={(checked) => setConfigPrefs({...configPrefs, comunicados_diretoria: checked})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Canais de Entrega</h4>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="email_ativo" className="font-medium">Notificações por Email</Label>
                      <p className="text-sm text-gray-500">Receba um email para cada notificação</p>
                    </div>
                    <Switch 
                      id="email_ativo"
                      checked={configPrefs.email_ativo}
                      onCheckedChange={(checked) => setConfigPrefs({...configPrefs, email_ativo: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="push_ativo" className="font-medium">Notificações Push</Label>
                      <p className="text-sm text-gray-500">Receba alertas no navegador</p>
                    </div>
                    <Switch 
                      id="push_ativo"
                      checked={configPrefs.push_ativo}
                      onCheckedChange={(checked) => setConfigPrefs({...configPrefs, push_ativo: checked})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowConfig(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => salvarPreferenciasMutation.mutate(configPrefs)}
                  disabled={salvarPreferenciasMutation.isPending}
                  className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                >
                  {salvarPreferenciasMutation.isPending ? "Salvando..." : "Salvar Preferências"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="todas">
              Todas
              <Badge className="ml-2 bg-gray-200 text-gray-700">{notificacoes.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="nao_lidas">
              Não Lidas
              {naoLidas > 0 && <Badge className="ml-2 bg-red-500 text-white">{naoLidas}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="novo_aporte">Aportes</TabsTrigger>
            <TabsTrigger value="nova_ata">Atas</TabsTrigger>
            <TabsTrigger value="alerta_financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="comunicado_diretoria">Comunicados</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Lista de Notificações */}
        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Carregando notificações...
              </CardContent>
            </Card>
          ) : filteredNotificacoes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma notificação encontrada</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotificacoes.map(notificacao => {
              const config = tipoConfig[notificacao.tipo] || tipoConfig.comunicado_diretoria;
              const Icon = config.icon;
              const prioridadeConf = prioridadeConfig[notificacao.prioridade] || prioridadeConfig.normal;

              return (
                <Card 
                  key={notificacao.id} 
                  className={`hover:shadow-md transition-all cursor-pointer ${!notificacao.lida ? 'border-l-4 border-l-[var(--wine-600)] bg-gradient-to-r from-purple-50 to-white' : ''}`}
                  onClick={() => !notificacao.lida && marcarLidaMutation.mutate(notificacao.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${config.color.replace('text-', 'bg-').replace('800', '100')}`}>
                        <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`font-semibold ${!notificacao.lida ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notificacao.titulo}
                              </h4>
                              <Badge className={config.color}>{config.label}</Badge>
                              {notificacao.prioridade !== 'normal' && (
                                <Badge className={prioridadeConf.color}>{prioridadeConf.label}</Badge>
                              )}
                              {!notificacao.lida && (
                                <span className="w-2 h-2 bg-[var(--wine-600)] rounded-full"></span>
                              )}
                            </div>
                            <p className="text-gray-600 mt-1">{notificacao.mensagem}</p>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {format(new Date(notificacao.created_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>

                        {notificacao.lida && notificacao.data_leitura && (
                          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Lida em {format(new Date(notificacao.data_leitura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </LayoutSocio>
  );
}