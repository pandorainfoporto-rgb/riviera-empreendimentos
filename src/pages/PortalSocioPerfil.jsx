import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Mail, Phone, Save, Bell, Shield } from "lucide-react";
import { toast } from "sonner";
import LayoutSocio from "../components/LayoutSocio";

export default function PortalSocioPerfil() {
  const queryClient = useQueryClient();

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

  useEffect(() => {
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
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  return (
    <LayoutSocio>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Meu Perfil</h1>
          <p className="text-gray-600 mt-1">Gerencie suas informações e preferências</p>
        </div>

        {/* Dados do Sócio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={socio?.nome || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>CPF/CNPJ</Label>
                <Input value={socio?.cpf_cnpj || ''} disabled />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <Input value={user?.email || ''} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <Input value={socio?.telefone || ''} disabled />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Para alterar seus dados, entre em contato com a administração.
            </p>
          </CardContent>
        </Card>

        {/* Preferências de Notificação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Preferências de Notificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Tipos de Notificação</h4>
                
                {[
                  { key: 'novos_aportes', label: 'Novos aportes lançados' },
                  { key: 'vencimento_aportes', label: 'Alertas de vencimento' },
                  { key: 'pagamento_confirmado', label: 'Confirmações de pagamento' },
                  { key: 'novas_atas', label: 'Novas atas e assembleias' },
                  { key: 'alertas_financeiros', label: 'Alertas financeiros' },
                  { key: 'comunicados_diretoria', label: 'Comunicados da diretoria' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <Label htmlFor={item.key}>{item.label}</Label>
                    <Switch 
                      id={item.key}
                      checked={configPrefs[item.key]}
                      onCheckedChange={(checked) => setConfigPrefs({...configPrefs, [item.key]: checked})}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Canais de Entrega</h4>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="email_ativo" className="font-medium">Notificações por Email</Label>
                    <p className="text-sm text-gray-500">Receba alertas por email</p>
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

            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={() => salvarPreferenciasMutation.mutate(configPrefs)}
                disabled={salvarPreferenciasMutation.isPending}
                className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
              >
                <Save className="w-4 h-4 mr-2" />
                {salvarPreferenciasMutation.isPending ? "Salvando..." : "Salvar Preferências"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Para alterar sua senha ou configurações de segurança, entre em contato com a administração.
            </p>
            <Button variant="outline" disabled>
              Solicitar Alteração de Senha
            </Button>
          </CardContent>
        </Card>
      </div>
    </LayoutSocio>
  );
}