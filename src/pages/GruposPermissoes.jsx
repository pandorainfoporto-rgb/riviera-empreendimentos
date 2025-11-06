import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Shield, Users, Edit, Trash2, Copy, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function GruposPermissoes() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipo: "personalizado",
    nivel_acesso: "personalizado",
    cor: "#922B3E",
    ativo: true,
    permissoes: {},
    restricoes_dados: {},
    limites_operacionais: {}
  });

  const { data: grupos = [], isLoading } = useQuery({
    queryKey: ['grupos_usuario'],
    queryFn: () => base44.entities.GrupoUsuario.list(),
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios_sistema'],
    queryFn: () => base44.entities.UsuarioSistema.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GrupoUsuario.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos_usuario'] });
      toast.success('Grupo criado com sucesso!');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Erro ao criar grupo: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GrupoUsuario.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos_usuario'] });
      toast.success('Grupo atualizado com sucesso!');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Erro ao atualizar grupo: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GrupoUsuario.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos_usuario'] });
      toast.success('Grupo excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir grupo: ' + error.message);
    },
  });

  const handleOpenDialog = (grupo = null) => {
    if (grupo) {
      setEditingGrupo(grupo);
      setFormData({
        nome: grupo.nome || "",
        descricao: grupo.descricao || "",
        tipo: grupo.tipo || "personalizado",
        nivel_acesso: grupo.nivel_acesso || "personalizado",
        cor: grupo.cor || "#922B3E",
        ativo: grupo.ativo !== false,
        permissoes: grupo.permissoes || {},
        restricoes_dados: grupo.restricoes_dados || {},
        limites_operacionais: grupo.limites_operacionais || {}
      });
    } else {
      setEditingGrupo(null);
      setFormData({
        nome: "",
        descricao: "",
        tipo: "personalizado",
        nivel_acesso: "personalizado",
        cor: "#922B3E",
        ativo: true,
        permissoes: {},
        restricoes_dados: {},
        limites_operacionais: {}
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingGrupo(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nome) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (editingGrupo) {
      updateMutation.mutate({ id: editingGrupo.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (grupo) => {
    if (grupo.eh_sistema) {
      toast.error('Não é possível excluir grupos do sistema');
      return;
    }

    const usuariosDoGrupo = usuarios.filter(u => u.grupo_id === grupo.id).length;
    if (usuariosDoGrupo > 0) {
      toast.error(`Não é possível excluir. ${usuariosDoGrupo} usuário(s) vinculado(s)`);
      return;
    }

    if (confirm(`Confirma exclusão do grupo "${grupo.nome}"?`)) {
      deleteMutation.mutate(grupo.id);
    }
  };

  const handleDuplicate = (grupo) => {
    setEditingGrupo(null);
    setFormData({
      ...grupo,
      nome: grupo.nome + " (Cópia)",
      eh_sistema: false,
      id: undefined
    });
    setShowDialog(true);
  };

  const updatePermissao = (modulo, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      permissoes: {
        ...prev.permissoes,
        [modulo]: {
          ...prev.permissoes[modulo],
          [campo]: valor
        }
      }
    }));
  };

  const aplicarTemplate = (template) => {
    const templates = {
      completo: {
        dashboard: { visualizar: true, executiva: true, financeiro: true, obras: true, consorcios: true },
        loteamentos: { visualizar: true, criar: true, editar: true, excluir: true },
        unidades: { visualizar: true, criar: true, editar: true, excluir: true, visualizar_valores: true },
        clientes: { visualizar: true, criar: true, editar: true, excluir: true, visualizar_dados_sensiveis: true, gerenciar_acesso_portal: true },
        financeiro: { visualizar: true, visualizar_valores: true, recebimentos_visualizar: true, recebimentos_criar: true, recebimentos_editar: true, recebimentos_receber: true, pagamentos_visualizar: true, pagamentos_criar: true, pagamentos_editar: true, pagamentos_pagar: true, pagamentos_aprovar: true },
        relatorios: { financeiros: true, dre: true, fluxo_caixa: true, obras: true, vendas: true, consolidado: true, exportar: true },
        configuracoes: { acessar: true, gateways: true, usuarios: true, grupos_permissoes: true }
      },
      gerencial: {
        dashboard: { visualizar: true, executiva: true, financeiro: true },
        loteamentos: { visualizar: true, criar: true, editar: true },
        unidades: { visualizar: true, criar: true, editar: true, visualizar_valores: true },
        clientes: { visualizar: true, criar: true, editar: true },
        financeiro: { visualizar: true, visualizar_valores: true, recebimentos_visualizar: true, recebimentos_criar: true, pagamentos_visualizar: true, pagamentos_criar: true },
        relatorios: { financeiros: true, dre: true, fluxo_caixa: true, consolidado: true, exportar: true }
      },
      operacional: {
        dashboard: { visualizar: true },
        loteamentos: { visualizar: true },
        unidades: { visualizar: true },
        clientes: { visualizar: true, criar: true, editar: true },
        financeiro: { recebimentos_visualizar: true, pagamentos_visualizar: true },
        obras: { visualizar: true, execucao_visualizar: true, execucao_atualizar: true }
      },
      consulta: {
        dashboard: { visualizar: true },
        loteamentos: { visualizar: true },
        unidades: { visualizar: true },
        clientes: { visualizar: true },
        financeiro: { visualizar: true, recebimentos_visualizar: true, pagamentos_visualizar: true },
        relatorios: { financeiros: true, vendas: true }
      }
    };

    if (templates[template]) {
      setFormData(prev => ({
        ...prev,
        nivel_acesso: template,
        permissoes: templates[template]
      }));
      toast.success(`Template "${template}" aplicado com sucesso!`);
    }
  };

  const contarUsuarios = (grupoId) => {
    return usuarios.filter(u => u.grupo_id === grupoId).length;
  };

  const modulosPermissoes = [
    {
      nome: "Dashboard",
      chave: "dashboard",
      campos: [
        { chave: "visualizar", label: "Visualizar" },
        { chave: "executiva", label: "Dashboard Executiva" },
        { chave: "financeiro", label: "Dashboard Financeiro" },
        { chave: "obras", label: "Dashboard Obras" },
        { chave: "consorcios", label: "Dashboard Consórcios" },
      ]
    },
    {
      nome: "Loteamentos",
      chave: "loteamentos",
      campos: [
        { chave: "visualizar", label: "Visualizar" },
        { chave: "criar", label: "Criar" },
        { chave: "editar", label: "Editar" },
        { chave: "excluir", label: "Excluir" },
        { chave: "apenas_proprios", label: "Apenas Próprios" },
      ]
    },
    {
      nome: "Unidades",
      chave: "unidades",
      campos: [
        { chave: "visualizar", label: "Visualizar" },
        { chave: "criar", label: "Criar" },
        { chave: "editar", label: "Editar" },
        { chave: "excluir", label: "Excluir" },
        { chave: "visualizar_valores", label: "Visualizar Valores" },
      ]
    },
    {
      nome: "Clientes",
      chave: "clientes",
      campos: [
        { chave: "visualizar", label: "Visualizar" },
        { chave: "criar", label: "Criar" },
        { chave: "editar", label: "Editar" },
        { chave: "excluir", label: "Excluir" },
        { chave: "visualizar_dados_sensiveis", label: "Dados Sensíveis" },
        { chave: "gerenciar_acesso_portal", label: "Gerenciar Acesso Portal" },
      ]
    },
    {
      nome: "Financeiro",
      chave: "financeiro",
      campos: [
        { chave: "visualizar", label: "Visualizar" },
        { chave: "visualizar_valores", label: "Visualizar Valores" },
        { chave: "recebimentos_visualizar", label: "Ver Recebimentos" },
        { chave: "recebimentos_criar", label: "Criar Recebimentos" },
        { chave: "recebimentos_receber", label: "Receber Pagamentos" },
        { chave: "pagamentos_visualizar", label: "Ver Pagamentos" },
        { chave: "pagamentos_criar", label: "Criar Pagamentos" },
        { chave: "pagamentos_pagar", label: "Pagar" },
        { chave: "pagamentos_aprovar", label: "Aprovar Pagamentos" },
      ]
    },
    {
      nome: "Caixas",
      chave: "caixas",
      campos: [
        { chave: "visualizar", label: "Visualizar" },
        { chave: "criar", label: "Criar" },
        { chave: "editar", label: "Editar" },
        { chave: "visualizar_saldos", label: "Ver Saldos" },
        { chave: "movimentar", label: "Movimentar" },
        { chave: "transferir", label: "Transferir" },
        { chave: "conciliar", label: "Conciliar" },
      ]
    },
    {
      nome: "Obras",
      chave: "obras",
      campos: [
        { chave: "visualizar", label: "Visualizar" },
        { chave: "cronograma_criar", label: "Criar Cronograma" },
        { chave: "cronograma_editar", label: "Editar Cronograma" },
        { chave: "execucao_atualizar", label: "Atualizar Execução" },
        { chave: "custos_visualizar", label: "Ver Custos" },
        { chave: "custos_editar", label: "Editar Custos" },
        { chave: "documentos_upload", label: "Upload Documentos" },
      ]
    },
    {
      nome: "Relatórios",
      chave: "relatorios",
      campos: [
        { chave: "financeiros", label: "Financeiros" },
        { chave: "dre", label: "DRE" },
        { chave: "fluxo_caixa", label: "Fluxo de Caixa" },
        { chave: "obras", label: "Obras" },
        { chave: "vendas", label: "Vendas" },
        { chave: "consolidado", label: "Consolidado" },
        { chave: "exportar", label: "Exportar" },
      ]
    },
    {
      nome: "Configurações",
      chave: "configuracoes",
      campos: [
        { chave: "acessar", label: "Acessar" },
        { chave: "gateways", label: "Gateways" },
        { chave: "integracao_bancaria", label: "Integração Bancária" },
        { chave: "usuarios", label: "Usuários" },
        { chave: "grupos_permissoes", label: "Grupos/Permissões" },
      ]
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Grupos e Permissões</h1>
          <p className="text-gray-600 mt-1">Gerencie grupos de usuários e suas permissões</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]">
          <Plus className="w-4 h-4 mr-2" />
          Novo Grupo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {grupos.map((grupo) => {
          const usuariosCount = contarUsuarios(grupo.id);
          
          return (
            <Card key={grupo.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: grupo.cor || '#922B3E' }}
                    >
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{grupo.nome}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={grupo.ativo ? "default" : "secondary"}>
                          {grupo.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {grupo.eh_sistema && (
                          <Badge variant="outline" className="bg-blue-50">Sistema</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {grupo.descricao && (
                  <p className="text-sm text-gray-600">{grupo.descricao}</p>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{usuariosCount} usuário(s)</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 capitalize">{grupo.nivel_acesso || 'Personalizado'}</span>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleOpenDialog(grupo)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDuplicate(grupo)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  {!grupo.eh_sistema && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(grupo)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGrupo ? 'Editar Grupo' : 'Novo Grupo'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="geral">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="permissoes">Permissões</TabsTrigger>
                <TabsTrigger value="restricoes">Restrições</TabsTrigger>
                <TabsTrigger value="limites">Limites</TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome *</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Gerentes"
                    />
                  </div>

                  <div>
                    <Label>Tipo</Label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="usuario">Usuário</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do grupo"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nível de Acesso</Label>
                    <Select value={formData.nivel_acesso} onValueChange={(value) => setFormData({ ...formData, nivel_acesso: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completo">Completo</SelectItem>
                        <SelectItem value="gerencial">Gerencial</SelectItem>
                        <SelectItem value="operacional">Operacional</SelectItem>
                        <SelectItem value="consulta">Consulta</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Cor do Grupo</Label>
                    <Input
                      type="color"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                  <Label>Grupo Ativo</Label>
                </div>

                <div className="border-t pt-4">
                  <Label className="mb-3 block">Aplicar Template de Permissões</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Button type="button" variant="outline" size="sm" onClick={() => aplicarTemplate('completo')}>
                      Completo
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => aplicarTemplate('gerencial')}>
                      Gerencial
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => aplicarTemplate('operacional')}>
                      Operacional
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => aplicarTemplate('consulta')}>
                      Consulta
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="permissoes" className="space-y-4">
                <Accordion type="multiple" className="w-full">
                  {modulosPermissoes.map((modulo) => (
                    <AccordionItem key={modulo.chave} value={modulo.chave}>
                      <AccordionTrigger className="text-sm font-semibold">
                        {modulo.nome}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-3 p-4">
                          {modulo.campos.map((campo) => (
                            <div key={campo.chave} className="flex items-center gap-2">
                              <Switch
                                checked={formData.permissoes[modulo.chave]?.[campo.chave] || false}
                                onCheckedChange={(checked) => updatePermissao(modulo.chave, campo.chave, checked)}
                              />
                              <Label className="text-sm cursor-pointer">{campo.label}</Label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              <TabsContent value="restricoes" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.restricoes_dados?.apenas_registros_criados_por_usuario || false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        restricoes_dados: {
                          ...formData.restricoes_dados,
                          apenas_registros_criados_por_usuario: checked
                        }
                      })}
                    />
                    <Label>Ver apenas registros criados pelo usuário</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.restricoes_dados?.limitar_por_centro_custo || false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        restricoes_dados: {
                          ...formData.restricoes_dados,
                          limitar_por_centro_custo: checked
                        }
                      })}
                    />
                    <Label>Limitar por centro de custo</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="limites" className="space-y-4">
                <div>
                  <Label>Valor Máximo de Aprovação (R$)</Label>
                  <Input
                    type="number"
                    value={formData.limites_operacionais?.valor_maximo_aprovacao || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      limites_operacionais: {
                        ...formData.limites_operacionais,
                        valor_maximo_aprovacao: parseFloat(e.target.value)
                      }
                    })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valor máximo que pode aprovar sem supervisor (0 = sem limite)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.limites_operacionais?.pode_aprovar_pagamentos || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      limites_operacionais: {
                        ...formData.limites_operacionais,
                        pode_aprovar_pagamentos: checked
                      }
                    })}
                  />
                  <Label>Pode aprovar pagamentos</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.limites_operacionais?.pode_excluir_registros || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      limites_operacionais: {
                        ...formData.limites_operacionais,
                        pode_excluir_registros: checked
                      }
                    })}
                  />
                  <Label>Pode excluir registros</Label>
                </div>

                <div>
                  <Label>Dias retroativos para edição</Label>
                  <Input
                    type="number"
                    value={formData.limites_operacionais?.dias_retroativos_edicao || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      limites_operacionais: {
                        ...formData.limites_operacionais,
                        dias_retroativos_edicao: parseInt(e.target.value)
                      }
                    })}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quantos dias pode editar registros retroativos (0 = sem limite)
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]">
                {editingGrupo ? 'Atualizar' : 'Criar'} Grupo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}