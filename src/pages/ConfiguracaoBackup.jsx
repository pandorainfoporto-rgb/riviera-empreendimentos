import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Database, Plus, Edit, Trash2, Play, Clock, Cloud, 
  HardDrive, Download, Upload, CheckCircle2, AlertCircle,
  Calendar, Lock, Bell, Folder
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const plataformas = [
  { value: "google_drive", label: "Google Drive", icon: "☁️" },
  { value: "onedrive", label: "Microsoft OneDrive", icon: "📁" },
  { value: "mega", label: "Mega", icon: "🔒" },
  { value: "magalucloud", label: "Magalu Cloud", icon: "🛒" },
  { value: "local", label: "Local (Download)", icon: "💾" },
];

const frequencias = [
  { value: "diario", label: "Diário" },
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
  { value: "personalizado", label: "Personalizado" },
];

const diasSemana = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

export default function ConfiguracaoBackup() {
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [executandoBackup, setExecutandoBackup] = useState(false);
  const queryClient = useQueryClient();

  const { data: configuracoes = [] } = useQuery({
    queryKey: ['configuracoes_backup'],
    queryFn: () => base44.entities.ConfiguracaoBackup.list(),
  });

  const { data: historico = [] } = useQuery({
    queryKey: ['historico_backup'],
    queryFn: () => base44.entities.HistoricoBackup.list('-data_inicio', 20),
  });

  const [formData, setFormData] = useState({
    nome_configuracao: "",
    plataforma: "google_drive",
    credenciais: {},
    pasta_destino: "",
    backup_automatico: false,
    frequencia: "semanal",
    dia_semana: 0,
    dia_mes: 1,
    horario: "03:00",
    entidades_incluidas: [],
    incluir_arquivos: true,
    compactar: true,
    criptografar: false,
    senha_criptografia: "",
    manter_ultimos: 10,
    notificar_conclusao: true,
    emails_notificacao: [],
    ativa: true,
    observacoes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ConfiguracaoBackup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes_backup'] });
      setShowForm(false);
      toast.success("Configuração criada com sucesso!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ConfiguracaoBackup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes_backup'] });
      setShowForm(false);
      setEditingConfig(null);
      toast.success("Configuração atualizada!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ConfiguracaoBackup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes_backup'] });
      toast.success("Configuração excluída!");
    },
  });

  const handleOpenForm = (config = null) => {
    if (config) {
      setEditingConfig(config);
      setFormData(config);
    } else {
      setEditingConfig(null);
      setFormData({
        nome_configuracao: "",
        plataforma: "google_drive",
        credenciais: {},
        pasta_destino: "",
        backup_automatico: false,
        frequencia: "semanal",
        dia_semana: 0,
        dia_mes: 1,
        horario: "03:00",
        entidades_incluidas: [],
        incluir_arquivos: true,
        compactar: true,
        criptografar: false,
        senha_criptografia: "",
        manter_ultimos: 10,
        notificar_conclusao: true,
        emails_notificacao: [],
        ativa: true,
        observacoes: "",
      });
    }
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleExecutarBackup = async (configId) => {
    setExecutandoBackup(true);
    toast.info("Executando backup...");

    try {
      const response = await base44.functions.invoke('executarBackup', { configuracao_id: configId });
      
      if (response.data.success) {
        toast.success("Backup executado com sucesso!");
        queryClient.invalidateQueries({ queryKey: ['historico_backup'] });
      } else {
        toast.error(response.data.error || "Erro ao executar backup");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao executar backup");
    } finally {
      setExecutandoBackup(false);
    }
  };

  const backupsRecentes = historico.slice(0, 5);
  const ultimoBackupSucesso = historico.find(h => h.status === 'concluido');

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Backup e Recuperação</h1>
          <p className="text-gray-600 mt-1">Configure backups automáticos para proteger seus dados</p>
        </div>
        <Button
          onClick={() => handleOpenForm()}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Configuração
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Configurações</p>
                <p className="text-2xl font-bold text-blue-700">{configuracoes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Backups</p>
                <p className="text-2xl font-bold text-green-700">{historico.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Último Backup</p>
                <p className="text-sm font-bold text-purple-700">
                  {ultimoBackupSucesso ? format(new Date(ultimoBackupSucesso.data_conclusao), "dd/MM HH:mm") : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Espaço Usado</p>
                <p className="text-xl font-bold text-orange-700">
                  {ultimoBackupSucesso?.tamanho_formatado || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações */}
      <div className="grid md:grid-cols-2 gap-6">
        {configuracoes.map((config) => {
          const plat = plataformas.find(p => p.value === config.plataforma);
          
          return (
            <Card key={config.id} className="hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{plat?.icon}</span>
                      <h3 className="font-bold text-lg text-gray-900">{config.nome_configuracao}</h3>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">
                      {plat?.label}
                    </Badge>
                    {config.backup_automatico && (
                      <Badge className="bg-green-100 text-green-700 ml-2">
                        <Clock className="w-3 h-3 mr-1" />
                        Automático
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleExecutarBackup(config.id)}
                      variant="ghost"
                      size="icon"
                      className="text-green-600 hover:bg-green-50"
                      disabled={executandoBackup}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleOpenForm(config)}
                      variant="ghost"
                      size="icon"
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm(`Deseja excluir "${config.nome_configuracao}"?`)) {
                          deleteMutation.mutate(config.id);
                        }
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {config.backup_automatico && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frequência:</span>
                      <span className="font-medium">{config.frequencia}</span>
                    </div>
                  )}
                  {config.horario && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Horário:</span>
                      <span className="font-medium">{config.horario}</span>
                    </div>
                  )}
                  {config.ultimo_backup && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Último backup:</span>
                      <span className="font-medium text-xs">
                        {format(new Date(config.ultimo_backup), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Manter últimos:</span>
                    <span className="font-medium">{config.manter_ultimos} backups</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  {config.compactar && <Badge variant="outline">ZIP</Badge>}
                  {config.criptografar && <Badge variant="outline"><Lock className="w-3 h-3 mr-1" />Criptografado</Badge>}
                  {config.incluir_arquivos && <Badge variant="outline">+ Arquivos</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Histórico Recente */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Recente de Backups</CardTitle>
        </CardHeader>
        <CardContent>
          {backupsRecentes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum backup executado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backupsRecentes.map((hist) => {
                const config = configuracoes.find(c => c.id === hist.configuracao_backup_id);
                
                return (
                  <div key={hist.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{config?.nome_configuracao || 'N/A'}</p>
                        {hist.status === 'concluido' ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Concluído
                          </Badge>
                        ) : hist.status === 'erro' ? (
                          <Badge className="bg-red-100 text-red-700">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Erro
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700">
                            Em andamento
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {hist.tipo === 'manual' ? '👤 Manual' : '🤖 Automático'}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-600">
                        <span>{format(new Date(hist.data_inicio), "dd/MM/yyyy HH:mm")}</span>
                        {hist.tamanho_formatado && <span>• {hist.tamanho_formatado}</span>}
                        {hist.quantidade_registros && <span>• {hist.quantidade_registros} registros</span>}
                        {hist.duracao_segundos && <span>• {hist.duracao_segundos}s</span>}
                      </div>
                    </div>
                    {hist.arquivo_nuvem && hist.status === 'concluido' && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Form */}
      {showForm && (
        <Dialog open onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? `Editar: ${editingConfig.nome_configuracao}` : 'Nova Configuração de Backup'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="geral" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="geral">Geral</TabsTrigger>
                  <TabsTrigger value="agendamento">Agendamento</TabsTrigger>
                  <TabsTrigger value="opcoes">Opções</TabsTrigger>
                  <TabsTrigger value="nuvem">Nuvem</TabsTrigger>
                </TabsList>

                <TabsContent value="geral" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Nome da Configuração *</Label>
                    <Input
                      value={formData.nome_configuracao}
                      onChange={(e) => setFormData({...formData, nome_configuracao: e.target.value})}
                      placeholder="Ex: Backup Diário Google Drive"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Plataforma de Armazenamento *</Label>
                    <Select
                      value={formData.plataforma}
                      onValueChange={(val) => setFormData({...formData, plataforma: val})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {plataformas.map(plat => (
                          <SelectItem key={plat.value} value={plat.value}>
                            {plat.icon} {plat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Pasta de Destino</Label>
                    <Input
                      value={formData.pasta_destino}
                      onChange={(e) => setFormData({...formData, pasta_destino: e.target.value})}
                      placeholder="Caminho ou ID da pasta"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="agendamento" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <Label className="text-base">Backup Automático</Label>
                      <p className="text-sm text-gray-600">Executar backups agendados</p>
                    </div>
                    <Switch
                      checked={formData.backup_automatico}
                      onCheckedChange={(checked) => setFormData({...formData, backup_automatico: checked})}
                    />
                  </div>

                  {formData.backup_automatico && (
                    <>
                      <div className="space-y-2">
                        <Label>Frequência</Label>
                        <Select
                          value={formData.frequencia}
                          onValueChange={(val) => setFormData({...formData, frequencia: val})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencias.map(freq => (
                              <SelectItem key={freq.value} value={freq.value}>
                                {freq.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.frequencia === 'semanal' && (
                        <div className="space-y-2">
                          <Label>Dia da Semana</Label>
                          <Select
                            value={formData.dia_semana?.toString()}
                            onValueChange={(val) => setFormData({...formData, dia_semana: parseInt(val)})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {diasSemana.map(dia => (
                                <SelectItem key={dia.value} value={dia.value.toString()}>
                                  {dia.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {formData.frequencia === 'mensal' && (
                        <div className="space-y-2">
                          <Label>Dia do Mês (1-31)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            value={formData.dia_mes}
                            onChange={(e) => setFormData({...formData, dia_mes: parseInt(e.target.value)})}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Horário de Execução</Label>
                        <Input
                          type="time"
                          value={formData.horario}
                          onChange={(e) => setFormData({...formData, horario: e.target.value})}
                        />
                        <p className="text-xs text-gray-500">Horário do servidor (UTC-3)</p>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="opcoes" className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <Label>Incluir Arquivos</Label>
                      <Switch
                        checked={formData.incluir_arquivos}
                        onCheckedChange={(checked) => setFormData({...formData, incluir_arquivos: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <Label>Compactar (ZIP)</Label>
                      <Switch
                        checked={formData.compactar}
                        onCheckedChange={(checked) => setFormData({...formData, compactar: checked})}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label className="text-base">Criptografar Backup</Label>
                        <p className="text-sm text-gray-600">Proteger com senha</p>
                      </div>
                      <Switch
                        checked={formData.criptografar}
                        onCheckedChange={(checked) => setFormData({...formData, criptografar: checked})}
                      />
                    </div>
                    {formData.criptografar && (
                      <div className="space-y-2 mt-3">
                        <Label>Senha de Criptografia *</Label>
                        <Input
                          type="password"
                          value={formData.senha_criptografia}
                          onChange={(e) => setFormData({...formData, senha_criptografia: e.target.value})}
                          required={formData.criptografar}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Manter Últimos Backups</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.manter_ultimos}
                      onChange={(e) => setFormData({...formData, manter_ultimos: parseInt(e.target.value)})}
                    />
                    <p className="text-xs text-gray-500">Backups antigos serão excluídos automaticamente</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label className="text-base">Notificar por E-mail</Label>
                        <p className="text-sm text-gray-600">Enviar e-mail ao concluir backup</p>
                      </div>
                      <Switch
                        checked={formData.notificar_conclusao}
                        onCheckedChange={(checked) => setFormData({...formData, notificar_conclusao: checked})}
                      />
                    </div>
                    {formData.notificar_conclusao && (
                      <div className="space-y-2">
                        <Label>E-mails para Notificação (separados por vírgula)</Label>
                        <Input
                          value={(formData.emails_notificacao || []).join(', ')}
                          onChange={(e) => setFormData({
                            ...formData, 
                            emails_notificacao: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          placeholder="email1@example.com, email2@example.com"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="nuvem" className="space-y-4 mt-4">
                  {formData.plataforma === 'google_drive' && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-3">☁️ Configuração Google Drive</h4>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Client ID</Label>
                          <Input
                            value={formData.credenciais?.client_id || ''}
                            onChange={(e) => setFormData({
                              ...formData, 
                              credenciais: {...formData.credenciais, client_id: e.target.value}
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Client Secret</Label>
                          <Input
                            type="password"
                            value={formData.credenciais?.client_secret || ''}
                            onChange={(e) => setFormData({
                              ...formData, 
                              credenciais: {...formData.credenciais, client_secret: e.target.value}
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ID da Pasta (opcional)</Label>
                          <Input
                            value={formData.credenciais?.folder_id || ''}
                            onChange={(e) => setFormData({
                              ...formData, 
                              credenciais: {...formData.credenciais, folder_id: e.target.value}
                            })}
                            placeholder="Se deixar vazio, vai para raiz"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.plataforma === 'onedrive' && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-3">📁 Configuração OneDrive</h4>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Client ID</Label>
                          <Input
                            value={formData.credenciais?.client_id || ''}
                            onChange={(e) => setFormData({
                              ...formData, 
                              credenciais: {...formData.credenciais, client_id: e.target.value}
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Client Secret</Label>
                          <Input
                            type="password"
                            value={formData.credenciais?.client_secret || ''}
                            onChange={(e) => setFormData({
                              ...formData, 
                              credenciais: {...formData.credenciais, client_secret: e.target.value}
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.plataforma === 'mega' && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-900 mb-3">🔒 Configuração Mega</h4>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>E-mail Mega</Label>
                          <Input
                            type="email"
                            value={formData.credenciais?.client_id || ''}
                            onChange={(e) => setFormData({
                              ...formData, 
                              credenciais: {...formData.credenciais, client_id: e.target.value}
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Senha</Label>
                          <Input
                            type="password"
                            value={formData.credenciais?.client_secret || ''}
                            onChange={(e) => setFormData({
                              ...formData, 
                              credenciais: {...formData.credenciais, client_secret: e.target.value}
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.plataforma === 'local' && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">💾 Backup Local</h4>
                      <p className="text-sm text-gray-600">
                        O backup será baixado automaticamente para seu computador quando executado.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]">
                  {editingConfig ? 'Atualizar' : 'Criar'} Configuração
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}