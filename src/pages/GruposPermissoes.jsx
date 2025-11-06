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
import { 
  Shield, Plus, Edit, Trash2, Users, Lock, Unlock, 
  Eye, EyeOff, CheckCircle2, XCircle, Settings 
} from "lucide-react";
import { toast } from "sonner";

const MODULOS = [
  {
    id: 'loteamentos',
    nome: 'Loteamentos',
    acoes: ['visualizar', 'criar', 'editar', 'excluir'],
  },
  {
    id: 'unidades',
    nome: 'Unidades',
    acoes: ['visualizar', 'criar', 'editar', 'excluir'],
  },
  {
    id: 'clientes',
    nome: 'Clientes',
    acoes: ['visualizar', 'criar', 'editar', 'excluir'],
  },
  {
    id: 'fornecedores',
    nome: 'Fornecedores',
    acoes: ['visualizar', 'criar', 'editar', 'excluir'],
  },
  {
    id: 'socios',
    nome: 'Sócios',
    acoes: ['visualizar', 'criar', 'editar', 'excluir'],
  },
  {
    id: 'financeiro',
    nome: 'Financeiro',
    acoes: ['visualizar', 'pagamentos_clientes', 'pagamentos_fornecedores', 'aportes', 'negociacoes'],
  },
  {
    id: 'consorcios',
    nome: 'Consórcios',
    acoes: ['visualizar', 'criar', 'editar', 'excluir', 'lances'],
  },
  {
    id: 'obras',
    nome: 'Obras',
    acoes: ['visualizar', 'cronograma', 'execucao', 'documentos'],
  },
  {
    id: 'compras',
    nome: 'Compras',
    acoes: ['visualizar', 'criar', 'aprovar'],
  },
  {
    id: 'relatorios',
    nome: 'Relatórios',
    acoes: ['financeiros', 'obras', 'vendas', 'consorcios'],
  },
  {
    id: 'configuracoes',
    nome: 'Configurações',
    acoes: ['gateways', 'usuarios', 'grupos_permissoes'],
  },
  {
    id: 'portal_cliente',
    nome: 'Portal Cliente',
    acoes: ['acesso', 'apenas_sua_unidade'],
  },
  {
    id: 'portal_imobiliaria',
    nome: 'Portal Imobiliária',
    acoes: ['acesso', 'cadastrar_leads', 'visualizar_lotes', 'mensagens'],
  },
];

const GRUPOS_PADRAO = {
  admin: {
    nome: 'Administrador',
    descricao: 'Acesso total ao sistema',
    cor: '#dc2626',
    permissoes: Object.fromEntries(
      MODULOS.map(mod => [
        mod.id,
        Object.fromEntries(mod.acoes.map(acao => [acao, true]))
      ])
    ),
  },
  usuario: {
    nome: 'Usuário Operacional',
    descricao: 'Acesso operacional completo (sem configurações)',
    cor: '#2563eb',
    permissoes: {
      loteamentos: { visualizar: true, criar: true, editar: true, excluir: false },
      unidades: { visualizar: true, criar: true, editar: true, excluir: false },
      clientes: { visualizar: true, criar: true, editar: true, excluir: false },
      fornecedores: { visualizar: true, criar: true, editar: true, excluir: false },
      socios: { visualizar: true, criar: false, editar: false, excluir: false },
      financeiro: { visualizar: true, pagamentos_clientes: true, pagamentos_fornecedores: true, aportes: false, negociacoes: true },
      consorcios: { visualizar: true, criar: true, editar: true, excluir: false, lances: true },
      obras: { visualizar: true, cronograma: true, execucao: true, documentos: true },
      compras: { visualizar: true, criar: true, aprovar: false },
      relatorios: { financeiros: true, obras: true, vendas: true, consorcios: true },
      configuracoes: { gateways: false, usuarios: false, grupos_permissoes: false },
      portal_cliente: { acesso: false, apenas_sua_unidade: true },
      portal_imobiliaria: { acesso: false, cadastrar_leads: false, visualizar_lotes: false, mensagens: false },
    },
  },
  cliente: {
    nome: 'Portal Cliente',
    descricao: 'Acesso exclusivo ao portal do cliente',
    cor: '#10b981',
    permissoes: {
      loteamentos: { visualizar: false, criar: false, editar: false, excluir: false },
      unidades: { visualizar: false, criar: false, editar: false, excluir: false },
      clientes: { visualizar: false, criar: false, editar: false, excluir: false },
      fornecedores: { visualizar: false, criar: false, editar: false, excluir: false },
      socios: { visualizar: false, criar: false, editar: false, excluir: false },
      financeiro: { visualizar: false, pagamentos_clientes: false, pagamentos_fornecedores: false, aportes: false, negociacoes: false },
      consorcios: { visualizar: false, criar: false, editar: false, excluir: false, lances: false },
      obras: { visualizar: false, cronograma: false, execucao: false, documentos: false },
      compras: { visualizar: false, criar: false, aprovar: false },
      relatorios: { financeiros: false, obras: false, vendas: false, consorcios: false },
      configuracoes: { gateways: false, usuarios: false, grupos_permissoes: false },
      portal_cliente: { acesso: true, apenas_sua_unidade: true },
      portal_imobiliaria: { acesso: false, cadastrar_leads: false, visualizar_lotes: false, mensagens: false },
    },
  },
  imobiliaria: {
    nome: 'Portal Imobiliária',
    descricao: 'Acesso exclusivo ao portal da imobiliária',
    cor: '#8b5cf6',
    permissoes: {
      loteamentos: { visualizar: false, criar: false, editar: false, excluir: false },
      unidades: { visualizar: false, criar: false, editar: false, excluir: false },
      clientes: { visualizar: false, criar: false, editar: false, excluir: false },
      fornecedores: { visualizar: false, criar: false, editar: false, excluir: false },
      socios: { visualizar: false, criar: false, editar: false, excluir: false },
      financeiro: { visualizar: false, pagamentos_clientes: false, pagamentos_fornecedores: false, aportes: false, negociacoes: false },
      consorcios: { visualizar: false, criar: false, editar: false, excluir: false, lances: false },
      obras: { visualizar: false, cronograma: false, execucao: false, documentos: false },
      compras: { visualizar: false, criar: false, aprovar: false },
      relatorios: { financeiros: false, obras: false, vendas: false, consorcios: false },
      configuracoes: { gateways: false, usuarios: false, grupos_permissoes: false },
      portal_cliente: { acesso: false, apenas_sua_unidade: true },
      portal_imobiliaria: { acesso: true, cadastrar_leads: true, visualizar_lotes: true, mensagens: true },
    },
  },
};

export default function GruposPermissoes() {
  const [showForm, setShowForm] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [grupoSelecionado, setGrupoSelecionado] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'personalizado',
    cor: '#3b82f6',
    permissoes: {},
  });

  const queryClient = useQueryClient();

  const { data: grupos = [], isLoading } = useQuery({
    queryKey: ['grupos_usuario'],
    queryFn: () => base44.entities.GrupoUsuario.list(),
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => base44.entities.User.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GrupoUsuario.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos_usuario'] });
      setShowForm(false);
      toast.success('Grupo criado com sucesso!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GrupoUsuario.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos_usuario'] });
      setShowForm(false);
      setEditingGrupo(null);
      toast.success('Grupo atualizado com sucesso!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GrupoUsuario.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos_usuario'] });
      toast.success('Grupo excluído com sucesso!');
    },
  });

  const inicializarGruposPadrao = useMutation({
    mutationFn: async () => {
      const promises = Object.entries(GRUPOS_PADRAO).map(([tipo, config]) => 
        base44.entities.GrupoUsuario.create({
          nome: config.nome,
          descricao: config.descricao,
          tipo: tipo,
          eh_sistema: true,
          cor: config.cor,
          permissoes: config.permissoes,
          ativo: true,
        })
      );
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos_usuario'] });
      toast.success('Grupos padrão criados com sucesso!');
    },
  });

  const handleOpenForm = (grupo = null) => {
    if (grupo) {
      setEditingGrupo(grupo);
      setFormData({
        nome: grupo.nome,
        descricao: grupo.descricao,
        tipo: grupo.tipo,
        cor: grupo.cor || '#3b82f6',
        permissoes: grupo.permissoes || {},
      });
    } else {
      setEditingGrupo(null);
      setFormData({
        nome: '',
        descricao: '',
        tipo: 'personalizado',
        cor: '#3b82f6',
        permissoes: Object.fromEntries(
          MODULOS.map(mod => [
            mod.id,
            Object.fromEntries(mod.acoes.map(acao => [acao, false]))
          ])
        ),
      });
    }
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingGrupo) {
      updateMutation.mutate({ id: editingGrupo.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const togglePermissao = (modulo, acao) => {
    setFormData({
      ...formData,
      permissoes: {
        ...formData.permissoes,
        [modulo]: {
          ...(formData.permissoes[modulo] || {}),
          [acao]: !(formData.permissoes[modulo]?.[acao] || false),
        },
      },
    });
  };

  const toggleModuloCompleto = (modulo) => {
    const moduloObj = MODULOS.find(m => m.id === modulo);
    const todasAtivas = moduloObj.acoes.every(acao => formData.permissoes[modulo]?.[acao]);
    
    setFormData({
      ...formData,
      permissoes: {
        ...formData.permissoes,
        [modulo]: Object.fromEntries(
          moduloObj.acoes.map(acao => [acao, !todasAtivas])
        ),
      },
    });
  };

  const gruposPorTipo = {
    sistema: grupos.filter(g => g.eh_sistema),
    personalizado: grupos.filter(g => !g.eh_sistema),
  };

  const gruposExistem = grupos.length > 0;
  const faltamGruposPadrao = ['admin', 'usuario', 'cliente', 'imobiliaria'].some(
    tipo => !grupos.find(g => g.tipo === tipo)
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Grupos e Permissões</h1>
          <p className="text-gray-600 mt-1">Gerencie grupos de usuários e controle de acesso</p>
        </div>
        <div className="flex gap-2">
          {faltamGruposPadrao && (
            <Button
              onClick={() => inicializarGruposPadrao.mutate()}
              variant="outline"
              className="bg-blue-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              Inicializar Grupos Padrão
            </Button>
          )}
          <Button
            onClick={() => handleOpenForm()}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Grupo
          </Button>
        </div>
      </div>

      {/* Alert Inicial */}
      {!gruposExistem && (
        <Card className="border-l-4 border-blue-500 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Configure os grupos de permissões</p>
                <p className="text-sm text-blue-800 mt-1">
                  Clique em "Inicializar Grupos Padrão" para criar os grupos Admin, Usuário, Cliente e Imobiliária automaticamente.
                  Depois você pode criar grupos personalizados conforme necessário.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grupos do Sistema */}
      {gruposPorTipo.sistema.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Grupos do Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {gruposPorTipo.sistema.map((grupo) => {
              const usuariosGrupo = usuarios.filter(u => u.grupo_id === grupo.id).length;
              
              return (
                <Card key={grupo.id} className="hover:shadow-lg transition-shadow border-t-4" style={{ borderTopColor: grupo.cor }}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{grupo.nome}</h3>
                        <p className="text-sm text-gray-600 mt-1">{grupo.descricao}</p>
                      </div>
                      <Badge variant="outline" className="bg-gray-100">
                        Sistema
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{usuariosGrupo} usuários</span>
                      </div>
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: grupo.cor }}></div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setGrupoSelecionado(grupo)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Permissões
                      </Button>
                      <Button
                        onClick={() => handleOpenForm(grupo)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Grupos Personalizados */}
      {gruposPorTipo.personalizado.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Grupos Personalizados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {gruposPorTipo.personalizado.map((grupo) => {
              const usuariosGrupo = usuarios.filter(u => u.grupo_id === grupo.id).length;
              
              return (
                <Card key={grupo.id} className="hover:shadow-lg transition-shadow border-t-4" style={{ borderTopColor: grupo.cor }}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{grupo.nome}</h3>
                        <p className="text-sm text-gray-600 mt-1">{grupo.descricao}</p>
                      </div>
                      {!grupo.ativo && (
                        <Badge variant="outline" className="bg-gray-100 text-gray-600">
                          Inativo
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{usuariosGrupo} usuários</span>
                      </div>
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: grupo.cor }}></div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setGrupoSelecionado(grupo)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      <Button
                        onClick={() => handleOpenForm(grupo)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          if (confirm(`Deseja excluir o grupo "${grupo.nome}"?`)) {
                            deleteMutation.mutate(grupo.id);
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialog Formulário */}
      {showForm && (
        <Dialog open onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGrupo ? `Editar Grupo: ${editingGrupo.nome}` : 'Novo Grupo de Permissões'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <Label>Nome do Grupo *</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Gerente Comercial"
                    required
                    disabled={editingGrupo?.eh_sistema}
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label>Cor do Grupo</Label>
                  <Input
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="h-10"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva o propósito deste grupo..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Permissões */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Permissões do Grupo</h3>
                <div className="space-y-4">
                  {MODULOS.map((modulo) => {
                    const todasAtivas = modulo.acoes.every(
                      acao => formData.permissoes[modulo.id]?.[acao]
                    );

                    return (
                      <Card key={modulo.id} className="border">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{modulo.nome}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleModuloCompleto(modulo.id)}
                              className={todasAtivas ? 'text-green-600' : 'text-gray-400'}
                            >
                              {todasAtivas ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Todas
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Nenhuma
                                </>
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {modulo.acoes.map((acao) => {
                              const ativo = formData.permissoes[modulo.id]?.[acao] || false;
                              
                              return (
                                <div
                                  key={acao}
                                  className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    ativo
                                      ? 'border-green-500 bg-green-50'
                                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                  }`}
                                  onClick={() => togglePermissao(modulo.id, acao)}
                                >
                                  <span className="text-sm font-medium capitalize">
                                    {acao.replace('_', ' ')}
                                  </span>
                                  {ativo ? (
                                    <Lock className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Unlock className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]">
                  {editingGrupo ? 'Atualizar Grupo' : 'Criar Grupo'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Ver Permissões */}
      {grupoSelecionado && (
        <Dialog open onOpenChange={() => setGrupoSelecionado(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: grupoSelecionado.cor }}></div>
                Permissões: {grupoSelecionado.nome}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {MODULOS.map((modulo) => {
                const permissoesModulo = grupoSelecionado.permissoes?.[modulo.id] || {};
                const temPermissao = modulo.acoes.some(acao => permissoesModulo[acao]);

                if (!temPermissao) return null;

                return (
                  <Card key={modulo.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{modulo.nome}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2">
                        {modulo.acoes.map((acao) => {
                          if (!permissoesModulo[acao]) return null;
                          
                          return (
                            <Badge key={acao} className="bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {acao.replace('_', ' ')}
                            </Badge>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <DialogFooter>
              <Button onClick={() => setGrupoSelecionado(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}