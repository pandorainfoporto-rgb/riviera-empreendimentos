import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, Plus, Edit, Trash2, CheckCircle2, AlertCircle, Users, Search
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GruposPermissoes() {
  const [busca, setBusca] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    permissoes: {
      dashboard: true,
      cadastros: {},
      financeiro: {},
      operacional: {},
      fluxo_financeiro: {},
      consorcios: {},
      mensagens: {},
      documentacao: {},
      configuracoes: {},
      relatorios: {}
    },
    ativo: true
  });
  const [mensagem, setMensagem] = useState({ tipo: "", texto: "" });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: grupos = [], isLoading } = useQuery({
    queryKey: ['grupos_permissoes'],
    queryFn: () => base44.entities.GrupoUsuario.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GrupoUsuario.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos_permissoes'] });
      setMensagem({ tipo: "success", texto: "Grupo criado com sucesso!" });
      setTimeout(() => setMensagem({ tipo: "", texto: "" }), 3000);
      setShowDialog(false);
      resetForm();
    },
    onError: (error) => {
      setMensagem({ tipo: "error", texto: `Erro: ${error.message}` });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GrupoUsuario.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos_permissoes'] });
      setMensagem({ tipo: "success", texto: "Grupo atualizado com sucesso!" });
      setTimeout(() => setMensagem({ tipo: "", texto: "" }), 3000);
      setShowDialog(false);
      setEditingGrupo(null);
      resetForm();
    },
    onError: (error) => {
      setMensagem({ tipo: "error", texto: `Erro: ${error.message}` });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GrupoUsuario.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos_permissoes'] });
      setMensagem({ tipo: "success", texto: "Grupo removido com sucesso!" });
      setTimeout(() => setMensagem({ tipo: "", texto: "" }), 3000);
    },
    onError: (error) => {
      setMensagem({ tipo: "error", texto: `Erro ao remover: ${error.message}` });
    },
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      permissoes: {
        dashboard: true,
        cadastros: {},
        financeiro: {},
        operacional: {},
        fluxo_financeiro: {},
        consorcios: {},
        mensagens: {},
        documentacao: {},
        configuracoes: {},
        relatorios: {}
      },
      ativo: true
    });
  };

  const handleEdit = (grupo) => {
    setEditingGrupo(grupo);
    setFormData({
      nome: grupo.nome || "",
      descricao: grupo.descricao || "",
      permissoes: grupo.permissoes || {
        dashboard: true,
        cadastros: {},
        financeiro: {},
        operacional: {},
        fluxo_financeiro: {},
        consorcios: {},
        mensagens: {},
        documentacao: {},
        configuracoes: {},
        relatorios: {}
      },
      ativo: grupo.ativo !== false
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.nome) {
      setMensagem({ tipo: "error", texto: "Nome do grupo é obrigatório" });
      return;
    }

    if (editingGrupo) {
      updateMutation.mutate({ id: editingGrupo.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (grupo) => {
    if (window.confirm(`Tem certeza que deseja remover o grupo "${grupo.nome}"?`)) {
      deleteMutation.mutate(grupo.id);
    }
  };

  const updatePermissao = (categoria, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      permissoes: {
        ...prev.permissoes,
        [categoria]: {
          ...prev.permissoes[categoria],
          [campo]: valor
        }
      }
    }));
  };

  const marcarTodosCategoria = (categoria, valor) => {
    const campos = Object.keys(formData.permissoes[categoria] || {});
    const novosValores = {};
    campos.forEach(campo => {
      novosValores[campo] = valor;
    });
    
    setFormData(prev => ({
      ...prev,
      permissoes: {
        ...prev.permissoes,
        [categoria]: novosValores
      }
    }));
  };

  const gruposFiltrados = grupos.filter(g => 
    !busca || g.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  const contarPermissoes = (permissoes) => {
    let total = 0;
    if (!permissoes || typeof permissoes !== 'object') return 0;
    Object.values(permissoes).forEach(valor => {
      if (typeof valor === 'boolean' && valor) {
        total++;
      } else if (valor && typeof valor === 'object') {
        total += Object.values(valor).filter(v => v === true).length;
      }
    });
    return total;
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <Alert className="max-w-md">
          <Shield className="w-4 h-4" />
          <AlertDescription>
            Apenas administradores podem gerenciar grupos de permissões.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)] flex items-center gap-3">
            <Shield className="w-8 h-8" />
            Grupos de Permissões
          </h1>
          <p className="text-gray-600 mt-1">Configure grupos de acesso para usuários do sistema</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingGrupo(null);
            setShowDialog(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Grupo
        </Button>
      </div>

      {mensagem.texto && (
        <Alert className={mensagem.tipo === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
          {mensagem.tipo === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <AlertDescription className={mensagem.tipo === "success" ? "text-green-800" : "text-red-800"}>
            {mensagem.texto}
          </AlertDescription>
        </Alert>
      )}

      {/* Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar grupo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Grupos */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Carregando grupos...</p>
            </CardContent>
          </Card>
        ) : gruposFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum grupo encontrado</p>
              <Button
                onClick={() => {
                  resetForm();
                  setEditingGrupo(null);
                  setShowDialog(true);
                }}
                className="mt-4"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Grupo
              </Button>
            </CardContent>
          </Card>
        ) : (
          gruposFiltrados.map((grupo) => (
            <Card key={grupo.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-xl text-gray-900">{grupo.nome}</h3>
                      {grupo.ativo ? (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
                      )}
                    </div>
                    {grupo.descricao && (
                      <p className="text-sm text-gray-600 mb-3">{grupo.descricao}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{contarPermissoes(grupo.permissoes)} permissões ativas</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(grupo)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(grupo)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Edição/Criação */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGrupo ? 'Editar Grupo de Permissões' : 'Novo Grupo de Permissões'}
            </DialogTitle>
            <DialogDescription>
              Configure as permissões que os usuários deste grupo terão acesso
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Grupo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Gerente, Vendedor, Financeiro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva o perfil de acesso deste grupo"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo" className="cursor-pointer">Grupo ativo</Label>
              </div>
            </div>

            {/* Permissões */}
            <div className="border-t pt-6">
              <h3 className="font-bold text-lg mb-4">Permissões de Acesso</h3>
              
              <Tabs defaultValue="cadastros" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-4">
                  <TabsTrigger value="cadastros">Cadastros</TabsTrigger>
                  <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
                  <TabsTrigger value="operacional">Operacional</TabsTrigger>
                  <TabsTrigger value="config">Config</TabsTrigger>
                  <TabsTrigger value="outros">Outros</TabsTrigger>
                </TabsList>

                {/* Cadastros */}
                <TabsContent value="cadastros" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">Módulo de Cadastros</h4>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => marcarTodosCategoria('cadastros', true)}>
                        Marcar Todos
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => marcarTodosCategoria('cadastros', false)}>
                        Desmarcar Todos
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'loteamentos', label: 'Loteamentos' },
                      { key: 'unidades', label: 'Unidades' },
                      { key: 'lotes', label: 'Lotes' },
                      { key: 'socios', label: 'Sócios' },
                      { key: 'clientes', label: 'Clientes' },
                      { key: 'fornecedores', label: 'Fornecedores' },
                      { key: 'imobiliarias', label: 'Imobiliárias' },
                      { key: 'corretores', label: 'Corretores' },
                      { key: 'produtos', label: 'Produtos' },
                      { key: 'servicos', label: 'Serviços' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cadastros_${key}`}
                          checked={formData.permissoes.cadastros[key] || false}
                          onCheckedChange={(checked) => updatePermissao('cadastros', key, checked)}
                        />
                        <Label htmlFor={`cadastros_${key}`} className="cursor-pointer">{label}</Label>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Financeiro */}
                <TabsContent value="financeiro" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">Módulo Financeiro</h4>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => marcarTodosCategoria('financeiro', true)}>
                        Marcar Todos
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => marcarTodosCategoria('financeiro', false)}>
                        Desmarcar Todos
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'caixas', label: 'Caixas' },
                      { key: 'bancos', label: 'Bancos e Integrações' },
                      { key: 'boletos', label: 'Boletos' },
                      { key: 'conciliacao', label: 'Conciliação Bancária' },
                      { key: 'contas', label: 'Contas' },
                      { key: 'corretoras', label: 'Corretoras' },
                      { key: 'tipos_ativos', label: 'Tipos de Ativos' },
                      { key: 'administradoras', label: 'Administradoras' },
                      { key: 'locacoes', label: 'Locações' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`financeiro_${key}`}
                          checked={formData.permissoes.financeiro[key] || false}
                          onCheckedChange={(checked) => updatePermissao('financeiro', key, checked)}
                        />
                        <Label htmlFor={`financeiro_${key}`} className="cursor-pointer">{label}</Label>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold mb-4">Fluxo Financeiro</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'fluxo_unidade', label: 'Fluxo por Unidade' },
                        { key: 'transferencias_caixas', label: 'Transferências entre Caixas' },
                        { key: 'posicao_caixa', label: 'Posição de Caixa' },
                        { key: 'orcamentos', label: 'Orçamentos' },
                        { key: 'aportes_socios', label: 'Aportes Sócios' },
                        { key: 'negociacoes', label: 'Negociações' },
                        { key: 'recebimentos_clientes', label: 'Recebimentos Clientes' },
                        { key: 'pagamentos_fornecedores', label: 'Pagamentos Fornecedores' },
                        { key: 'investimentos', label: 'Investimentos' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`fluxo_${key}`}
                            checked={formData.permissoes.fluxo_financeiro[key] || false}
                            onCheckedChange={(checked) => updatePermissao('fluxo_financeiro', key, checked)}
                          />
                          <Label htmlFor={`fluxo_${key}`} className="cursor-pointer">{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Operacional */}
                <TabsContent value="operacional" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">Módulo Operacional</h4>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => marcarTodosCategoria('operacional', true)}>
                        Marcar Todos
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => marcarTodosCategoria('operacional', false)}>
                        Desmarcar Todos
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'cronograma_obra', label: 'Cronograma de Obra' },
                      { key: 'execucao_obra', label: 'Execução de Obra' },
                      { key: 'custos_obra', label: 'Custos de Obra' },
                      { key: 'orcamentos_compra', label: 'Orçamentos de Compra' },
                      { key: 'compras', label: 'Compras' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`operacional_${key}`}
                          checked={formData.permissoes.operacional[key] || false}
                          onCheckedChange={(checked) => updatePermissao('operacional', key, checked)}
                        />
                        <Label htmlFor={`operacional_${key}`} className="cursor-pointer">{label}</Label>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold mb-4">Consórcios</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'cadastro_cotas', label: 'Cadastro de Cotas' },
                        { key: 'comercializacao', label: 'Comercialização' },
                        { key: 'transferencias', label: 'Transferências' },
                        { key: 'resgates', label: 'Resgates' },
                        { key: 'parcelas', label: 'Parcelas' },
                        { key: 'lances', label: 'Lances' },
                        { key: 'resultados', label: 'Resultados' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`consorcios_${key}`}
                            checked={formData.permissoes.consorcios[key] || false}
                            onCheckedChange={(checked) => updatePermissao('consorcios', key, checked)}
                          />
                          <Label htmlFor={`consorcios_${key}`} className="cursor-pointer">{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Configurações */}
                <TabsContent value="config" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">Configurações</h4>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => marcarTodosCategoria('configuracoes', true)}>
                        Marcar Todos
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => marcarTodosCategoria('configuracoes', false)}>
                        Desmarcar Todos
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'gerenciar_usuarios', label: 'Gerenciar Usuários' },
                      { key: 'grupos_permissoes', label: 'Grupos de Permissões' },
                      { key: 'integracao_bancaria', label: 'Integração Bancária' },
                      { key: 'templates_email', label: 'Templates de Email' },
                      { key: 'gateways_pagamento', label: 'Gateways de Pagamento' },
                      { key: 'centros_custo', label: 'Centros de Custo' },
                      { key: 'tipos_despesa', label: 'Tipos de Despesa' },
                      { key: 'colaboradores', label: 'Colaboradores' },
                      { key: 'folha_pagamento', label: 'Folha de Pagamento' },
                      { key: 'backup', label: 'Backup e Recuperação' },
                      { key: 'integracoes', label: 'Integrações' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`config_${key}`}
                          checked={formData.permissoes.configuracoes[key] || false}
                          onCheckedChange={(checked) => updatePermissao('configuracoes', key, checked)}
                        />
                        <Label htmlFor={`config_${key}`} className="cursor-pointer">{label}</Label>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Outros */}
                <TabsContent value="outros" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-4">Mensagens</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'crm', label: 'CRM' },
                        { key: 'leads_imobiliarias', label: 'Leads Imobiliárias' },
                        { key: 'mensagens_clientes', label: 'Mensagens Clientes' },
                        { key: 'mensagens_imobiliarias', label: 'Mensagens Imobiliárias' },
                        { key: 'templates_email', label: 'Templates Email' },
                        { key: 'respostas_rapidas', label: 'Respostas Rápidas' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`mensagens_${key}`}
                            checked={formData.permissoes.mensagens[key] || false}
                            onCheckedChange={(checked) => updatePermissao('mensagens', key, checked)}
                          />
                          <Label htmlFor={`mensagens_${key}`} className="cursor-pointer">{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4">Documentação</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'templates', label: 'Templates' },
                        { key: 'documentos_gerados', label: 'Documentos Gerados' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`doc_${key}`}
                            checked={formData.permissoes.documentacao[key] || false}
                            onCheckedChange={(checked) => updatePermissao('documentacao', key, checked)}
                          />
                          <Label htmlFor={`doc_${key}`} className="cursor-pointer">{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4">Relatórios</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'geral', label: 'Relatórios Geral' },
                        { key: 'financeiros', label: 'Financeiros' },
                        { key: 'vendas', label: 'Vendas & Imóveis' },
                        { key: 'obras', label: 'Obras' },
                        { key: 'consorcios', label: 'Consórcios' },
                        { key: 'parceiros', label: 'Parceiros' },
                        { key: 'comunicacao', label: 'Comunicação' },
                        { key: 'consolidado', label: 'Consolidado' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`rel_${key}`}
                            checked={formData.permissoes.relatorios[key] || false}
                            onCheckedChange={(checked) => updatePermissao('relatorios', key, checked)}
                          />
                          <Label htmlFor={`rel_${key}`} className="cursor-pointer">{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setEditingGrupo(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
            >
              {(createMutation.isPending || updateMutation.isPending) ? "Salvando..." : "Salvar Grupo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        :root {
          --wine-600: #922B3E;
          --wine-700: #7C2D3E;
          --grape-600: #7D5999;
        }
      `}</style>
    </div>
  );
}