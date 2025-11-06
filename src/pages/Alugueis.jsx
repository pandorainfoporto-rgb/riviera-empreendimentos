import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Home, Plus, Edit, Trash2, Calendar, DollarSign, Users,
  FileText, CheckCircle2, XCircle, AlertTriangle, Clock,
  Building, Key, TrendingUp, Eye
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, addMonths, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Alugueis() {
  const [showForm, setShowForm] = useState(false);
  const [editingLocacao, setEditingLocacao] = useState(null);
  const [showGerarParcelasDialog, setShowGerarParcelasDialog] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const queryClient = useQueryClient();

  const { data: locacoes = [], isLoading } = useQuery({
    queryKey: ['locacoes'],
    queryFn: () => base44.entities.Locacao.list('-data_inicio'),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  const { data: alugueisMensais = [] } = useQuery({
    queryKey: ['alugueis_mensais'],
    queryFn: () => base44.entities.AluguelMensal.list(),
  });

  const [formData, setFormData] = useState({
    unidade_id: "",
    cliente_id: "",
    imobiliaria_id: "",
    tipo_contrato: "residencial",
    data_inicio: "",
    prazo_meses: 12,
    renovacao_automatica: false,
    valor_aluguel: 0,
    valor_condominio: 0,
    valor_iptu: 0,
    valor_agua: 0,
    valor_luz: 0,
    valor_gas: 0,
    valor_internet: 0,
    valor_seguro: 0,
    dia_vencimento: 10,
    indice_reajuste: "igpm",
    mes_reajuste: 12,
    garantia_tipo: "fiador",
    comissao_imobiliaria_percentual: 10,
    multa_rescisao: 0,
    permite_animais: false,
    mobiliada: false,
    observacoes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const dataFim = addMonths(parseISO(data.data_inicio), data.prazo_meses);
      const valorTotal = 
        data.valor_aluguel + 
        data.valor_condominio + 
        data.valor_iptu + 
        (data.valor_agua || 0) +
        (data.valor_luz || 0) +
        (data.valor_gas || 0) +
        (data.valor_internet || 0) +
        (data.valor_seguro || 0);

      const comissaoValor = (data.valor_aluguel * data.comissao_imobiliaria_percentual) / 100;

      return base44.entities.Locacao.create({
        ...data,
        data_fim: dataFim.toISOString().split('T')[0],
        valor_total_mensal: valorTotal,
        comissao_imobiliaria_valor: comissaoValor,
        status: 'ativo',
      });
    },
    onSuccess: (locacao) => {
      queryClient.invalidateQueries({ queryKey: ['locacoes'] });
      
      // Atualizar status da unidade para "alugada"
      base44.entities.Unidade.update(locacao.unidade_id, {
        status: 'alugada',
      });
      
      setShowForm(false);
      setShowGerarParcelasDialog(locacao);
      toast.success("Locação cadastrada! Gere as parcelas mensais.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const valorTotal = 
        data.valor_aluguel + 
        data.valor_condominio + 
        data.valor_iptu + 
        (data.valor_agua || 0) +
        (data.valor_luz || 0) +
        (data.valor_gas || 0) +
        (data.valor_internet || 0) +
        (data.valor_seguro || 0);

      const comissaoValor = (data.valor_aluguel * data.comissao_imobiliaria_percentual) / 100;

      return base44.entities.Locacao.update(id, {
        ...data,
        valor_total_mensal: valorTotal,
        comissao_imobiliaria_valor: comissaoValor,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locacoes'] });
      setShowForm(false);
      toast.success("Locação atualizada!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const locacao = locacoes.find(l => l.id === id);
      
      // Atualizar status da unidade
      if (locacao) {
        await base44.entities.Unidade.update(locacao.unidade_id, {
          status: 'disponivel',
        });
      }
      
      return base44.entities.Locacao.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locacoes'] });
      toast.success("Locação excluída!");
    },
  });

  const gerarParcelasMutation = useMutation({
    mutationFn: async (locacao) => {
      const parcelas = [];
      const inicio = parseISO(locacao.data_inicio);
      const totalMeses = locacao.prazo_meses;

      for (let i = 0; i < totalMeses; i++) {
        const mesRef = addMonths(inicio, i);
        const anoMes = format(mesRef, 'yyyy-MM');
        const dia = locacao.dia_vencimento;
        const dataVencimento = new Date(mesRef.getFullYear(), mesRef.getMonth(), dia);

        const parcela = await base44.entities.AluguelMensal.create({
          locacao_id: locacao.id,
          mes_referencia: anoMes,
          numero_parcela: i + 1,
          valor_aluguel: locacao.valor_aluguel,
          valor_condominio: locacao.valor_condominio,
          valor_iptu: locacao.valor_iptu,
          valor_agua: locacao.valor_agua || 0,
          valor_luz: locacao.valor_luz || 0,
          valor_gas: locacao.valor_gas || 0,
          valor_internet: locacao.valor_internet || 0,
          valor_seguro: locacao.valor_seguro || 0,
          valor_total: locacao.valor_total_mensal,
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          status: 'pendente',
        });

        parcelas.push(parcela);
      }

      // Marcar como gerado
      await base44.entities.Locacao.update(locacao.id, {
        alugueis_gerados: true,
      });

      return parcelas;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alugueis_mensais'] });
      queryClient.invalidateQueries({ queryKey: ['locacoes'] });
      setShowGerarParcelasDialog(null);
      toast.success("Parcelas de aluguel geradas com sucesso!");
    },
  });

  const handleOpenForm = (locacao = null) => {
    if (locacao) {
      setEditingLocacao(locacao);
      setFormData({
        unidade_id: locacao.unidade_id,
        cliente_id: locacao.cliente_id,
        imobiliaria_id: locacao.imobiliaria_id || "",
        tipo_contrato: locacao.tipo_contrato,
        data_inicio: locacao.data_inicio,
        prazo_meses: locacao.prazo_meses,
        renovacao_automatica: locacao.renovacao_automatica,
        valor_aluguel: locacao.valor_aluguel,
        valor_condominio: locacao.valor_condominio || 0,
        valor_iptu: locacao.valor_iptu || 0,
        valor_agua: locacao.valor_agua || 0,
        valor_luz: locacao.valor_luz || 0,
        valor_gas: locacao.valor_gas || 0,
        valor_internet: locacao.valor_internet || 0,
        valor_seguro: locacao.valor_seguro || 0,
        dia_vencimento: locacao.dia_vencimento,
        indice_reajuste: locacao.indice_reajuste,
        mes_reajuste: locacao.mes_reajuste,
        garantia_tipo: locacao.garantia_tipo,
        comissao_imobiliaria_percentual: locacao.comissao_imobiliaria_percentual,
        multa_rescisao: locacao.multa_rescisao || 0,
        permite_animais: locacao.permite_animais,
        mobiliada: locacao.mobiliada,
        observacoes: locacao.observacoes || "",
      });
    } else {
      setEditingLocacao(null);
      setFormData({
        unidade_id: "",
        cliente_id: "",
        imobiliaria_id: "",
        tipo_contrato: "residencial",
        data_inicio: "",
        prazo_meses: 12,
        renovacao_automatica: false,
        valor_aluguel: 0,
        valor_condominio: 0,
        valor_iptu: 0,
        valor_agua: 0,
        valor_luz: 0,
        valor_gas: 0,
        valor_internet: 0,
        valor_seguro: 0,
        dia_vencimento: 10,
        indice_reajuste: "igpm",
        mes_reajuste: 12,
        garantia_tipo: "fiador",
        comissao_imobiliaria_percentual: 10,
        multa_rescisao: 0,
        permite_animais: false,
        mobiliada: false,
        observacoes: "",
      });
    }
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingLocacao) {
      updateMutation.mutate({ id: editingLocacao.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const unidadesDisponiveis = unidades.filter(u => u.disponivel_locacao);
  const clientesInquilinos = clientes.filter(c => c.eh_inquilino);

  const locacoesFiltradas = locacoes.filter(loc => {
    if (filtroStatus === "todos") return true;
    return loc.status === filtroStatus;
  });

  const statusColors = {
    ativo: "bg-green-100 text-green-800",
    encerrado: "bg-gray-100 text-gray-800",
    inadimplente: "bg-red-100 text-red-800",
    em_negociacao: "bg-yellow-100 text-yellow-800",
  };

  const statusIcons = {
    ativo: CheckCircle2,
    encerrado: XCircle,
    inadimplente: AlertTriangle,
    em_negociacao: Clock,
  };

  // Calcular resumos
  const totalAtivas = locacoes.filter(l => l.status === 'ativo').length;
  const receitaMensal = locacoes
    .filter(l => l.status === 'ativo')
    .reduce((sum, l) => sum + (l.valor_aluguel || 0), 0);
  const inadimplentes = locacoes.filter(l => l.status === 'inadimplente').length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Locações</h1>
          <p className="text-gray-600 mt-1">Gestão completa de contratos de aluguel</p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl('DashboardAlugueis')}>
            <Button variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Button
            onClick={() => handleOpenForm()}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Locação
          </Button>
        </div>
      </div>

      {/* Cards Resumo */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="border-t-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Locações Ativas</p>
                <p className="text-3xl font-bold text-blue-700">{totalAtivas}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Mensal</p>
                <p className="text-2xl font-bold text-green-700">
                  R$ {(receitaMensal / 1000).toFixed(1)}k
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inadimplentes</p>
                <p className="text-3xl font-bold text-red-700">{inadimplentes}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unidades Disponíveis</p>
                <p className="text-3xl font-bold text-purple-700">{unidadesDisponiveis.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inadimplente">Inadimplentes</SelectItem>
                <SelectItem value="encerrado">Encerrados</SelectItem>
                <SelectItem value="em_negociacao">Em Negociação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Locações */}
      <div className="grid md:grid-cols-2 gap-6">
        {isLoading ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando locações...</p>
            </CardContent>
          </Card>
        ) : locacoesFiltradas.length === 0 ? (
          <Card className="col-span-full border-dashed border-2">
            <CardContent className="p-12 text-center">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Nenhuma locação encontrada</p>
              <p className="text-sm text-gray-400 mb-4">
                Comece cadastrando um novo contrato de locação
              </p>
              <Button onClick={() => handleOpenForm()} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Nova Locação
              </Button>
            </CardContent>
          </Card>
        ) : (
          locacoesFiltradas.map((locacao) => {
            const unidade = unidades.find(u => u.id === locacao.unidade_id);
            const cliente = clientes.find(c => c.id === locacao.cliente_id);
            const imobiliaria = imobiliarias.find(i => i.id === locacao.imobiliaria_id);
            const StatusIcon = statusIcons[locacao.status] || Clock;
            
            const parcelasPagas = alugueisMensais.filter(a => 
              a.locacao_id === locacao.id && a.status === 'pago'
            ).length;
            
            const parcelasPendentes = alugueisMensais.filter(a => 
              a.locacao_id === locacao.id && a.status === 'pendente'
            ).length;

            const mesesDecorridos = locacao.data_inicio 
              ? differenceInMonths(new Date(), parseISO(locacao.data_inicio))
              : 0;

            return (
              <Card key={locacao.id} className="hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-2 rounded-lg ${statusColors[locacao.status]}`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{unidade?.codigo || 'Unidade não encontrada'}</h3>
                          <p className="text-sm text-gray-600">{cliente?.nome || 'Cliente não encontrado'}</p>
                        </div>
                      </div>
                      <Badge className={statusColors[locacao.status]}>
                        {locacao.status?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handleOpenForm(locacao)}
                        variant="ghost"
                        size="icon"
                        className="text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          if (confirm(`Deseja excluir esta locação?`)) {
                            deleteMutation.mutate(locacao.id);
                          }
                        }}
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Início:</p>
                        <p className="font-semibold">{format(parseISO(locacao.data_inicio), "dd/MM/yyyy", {locale: ptBR})}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Término:</p>
                        <p className="font-semibold">{format(parseISO(locacao.data_fim), "dd/MM/yyyy", {locale: ptBR})}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Prazo:</p>
                        <p className="font-semibold">{locacao.prazo_meses} meses</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Vencimento:</p>
                        <p className="font-semibold">Dia {locacao.dia_vencimento}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700">Aluguel Mensal</span>
                        <span className="text-2xl font-bold text-green-700">
                          R$ {(locacao.valor_aluguel || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        {locacao.valor_condominio > 0 && (
                          <p>+ Condomínio: R$ {locacao.valor_condominio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                        )}
                        {locacao.valor_iptu > 0 && (
                          <p>+ IPTU: R$ {locacao.valor_iptu.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                        )}
                        <p className="font-semibold text-green-800 pt-1 border-t border-green-200">
                          Total: R$ {(locacao.valor_total_mensal || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </p>
                      </div>
                    </div>

                    {imobiliaria && (
                      <div className="flex items-center justify-between text-sm p-2 bg-blue-50 rounded">
                        <span className="text-gray-700">Imobiliária: {imobiliaria.nome}</span>
                        <Badge variant="outline">
                          {locacao.comissao_imobiliaria_percentual}% comissão
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-sm">
                        <span className="text-gray-600">Parcelas: </span>
                        <span className="font-semibold text-green-600">{parcelasPagas} pagas</span>
                        <span className="text-gray-400"> / </span>
                        <span className="font-semibold text-orange-600">{parcelasPendentes} pendentes</span>
                      </div>
                      {!locacao.alugueis_gerados && (
                        <Button
                          size="sm"
                          onClick={() => setShowGerarParcelasDialog(locacao)}
                          className="bg-blue-600"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Gerar Parcelas
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog Formulário */}
      {showForm && (
        <Dialog open onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLocacao ? 'Editar Locação' : 'Nova Locação'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="dados_basicos">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="dados_basicos">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="valores">Valores</TabsTrigger>
                  <TabsTrigger value="garantia">Garantia</TabsTrigger>
                  <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                </TabsList>

                <TabsContent value="dados_basicos" className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Unidade *</Label>
                      <Select
                        value={formData.unidade_id}
                        onValueChange={(val) => {
                          const uni = unidades.find(u => u.id === val);
                          setFormData({
                            ...formData,
                            unidade_id: val,
                            valor_aluguel: uni?.valor_aluguel || 0,
                            valor_condominio: uni?.valor_condominio || 0,
                            valor_iptu_mensal: uni?.valor_iptu_mensal || 0,
                            comissao_imobiliaria_percentual: uni?.comissao_imobiliaria_locacao_percentual || 10,
                          });
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {unidadesDisponiveis.map((uni) => (
                            <SelectItem key={uni.id} value={uni.id}>
                              {uni.codigo} - R$ {(uni.valor_aluguel || 0).toLocaleString('pt-BR')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Inquilino *</Label>
                      <Select
                        value={formData.cliente_id}
                        onValueChange={(val) => setFormData({...formData, cliente_id: val})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o inquilino" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientesInquilinos.map((cli) => (
                            <SelectItem key={cli.id} value={cli.id}>
                              {cli.nome} - {cli.cpf_cnpj}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Imobiliária</Label>
                      <Select
                        value={formData.imobiliaria_id}
                        onValueChange={(val) => setFormData({...formData, imobiliaria_id: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sem imobiliária" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Sem imobiliária</SelectItem>
                          {imobiliarias.map((imob) => (
                            <SelectItem key={imob.id} value={imob.id}>
                              {imob.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Contrato</Label>
                      <Select
                        value={formData.tipo_contrato}
                        onValueChange={(val) => setFormData({...formData, tipo_contrato: val})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="residencial">Residencial</SelectItem>
                          <SelectItem value="comercial">Comercial</SelectItem>
                          <SelectItem value="temporada">Temporada</SelectItem>
                          <SelectItem value="por_temporada">Por Temporada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Data de Início *</Label>
                      <Input
                        type="date"
                        value={formData.data_inicio}
                        onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Prazo (meses) *</Label>
                      <Input
                        type="number"
                        value={formData.prazo_meses}
                        onChange={(e) => setFormData({...formData, prazo_meses: parseInt(e.target.value)})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Dia do Vencimento *</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.dia_vencimento}
                        onChange={(e) => setFormData({...formData, dia_vencimento: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="valores" className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor Aluguel *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valor_aluguel}
                        onChange={(e) => setFormData({...formData, valor_aluguel: parseFloat(e.target.value)})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Condomínio</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valor_condominio}
                        onChange={(e) => setFormData({...formData, valor_condominio: parseFloat(e.target.value) || 0})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>IPTU Mensal</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valor_iptu}
                        onChange={(e) => setFormData({...formData, valor_iptu: parseFloat(e.target.value) || 0})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Água</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valor_agua}
                        onChange={(e) => setFormData({...formData, valor_agua: parseFloat(e.target.value) || 0})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Luz</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valor_luz}
                        onChange={(e) => setFormData({...formData, valor_luz: parseFloat(e.target.value) || 0})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Internet</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valor_internet}
                        onChange={(e) => setFormData({...formData, valor_internet: parseFloat(e.target.value) || 0})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Seguro Incêndio</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valor_seguro}
                        onChange={(e) => setFormData({...formData, valor_seguro: parseFloat(e.target.value) || 0})}
                      />
                    </div>

                    {formData.imobiliaria_id && (
                      <div className="space-y-2">
                        <Label>Comissão Imobiliária (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.comissao_imobiliaria_percentual}
                          onChange={(e) => setFormData({...formData, comissao_imobiliaria_percentual: parseFloat(e.target.value)})}
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-900">Valor Total Mensal:</span>
                      <span className="text-2xl font-bold text-blue-700">
                        R$ {(
                          formData.valor_aluguel + 
                          formData.valor_condominio + 
                          formData.valor_iptu +
                          (formData.valor_agua || 0) +
                          (formData.valor_luz || 0) +
                          (formData.valor_gas || 0) +
                          (formData.valor_internet || 0) +
                          (formData.valor_seguro || 0)
                        ).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Índice de Reajuste</Label>
                      <Select
                        value={formData.indice_reajuste}
                        onValueChange={(val) => setFormData({...formData, indice_reajuste: val})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="igpm">IGP-M</SelectItem>
                          <SelectItem value="ipca">IPCA</SelectItem>
                          <SelectItem value="incc">INCC</SelectItem>
                          <SelectItem value="fixo">Percentual Fixo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Mês do Reajuste</Label>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        value={formData.mes_reajuste}
                        onChange={(e) => setFormData({...formData, mes_reajuste: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="garantia" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Tipo de Garantia</Label>
                    <Select
                      value={formData.garantia_tipo}
                      onValueChange={(val) => setFormData({...formData, garantia_tipo: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fiador">Fiador</SelectItem>
                        <SelectItem value="caucao">Caução</SelectItem>
                        <SelectItem value="seguro_fianca">Seguro Fiança</SelectItem>
                        <SelectItem value="titulo_capitalizacao">Título de Capitalização</SelectItem>
                        <SelectItem value="sem_garantia">Sem Garantia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Multa por Rescisão Antecipada</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.multa_rescisao}
                      onChange={(e) => setFormData({...formData, multa_rescisao: parseFloat(e.target.value) || 0})}
                      placeholder="Valor em reais"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="detalhes" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <Label>Permite Animais</Label>
                      <Switch
                        checked={formData.permite_animais}
                        onCheckedChange={(checked) => setFormData({...formData, permite_animais: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <Label>Mobiliada</Label>
                      <Switch
                        checked={formData.mobiliada}
                        onCheckedChange={(checked) => setFormData({...formData, mobiliada: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <Label>Renovação Automática</Label>
                      <Switch
                        checked={formData.renovacao_automatica}
                        onCheckedChange={(checked) => setFormData({...formData, renovacao_automatica: checked})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      rows={4}
                      placeholder="Observações sobre a locação..."
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Gerar Parcelas */}
      {showGerarParcelasDialog && (
        <Dialog open onOpenChange={() => setShowGerarParcelasDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Parcelas de Aluguel</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-900 mb-2">
                  📅 {showGerarParcelasDialog.prazo_meses} parcelas mensais
                </p>
                <p className="text-sm text-blue-800">
                  Vencimento: Dia {showGerarParcelasDialog.dia_vencimento} de cada mês
                </p>
                <p className="text-sm text-blue-800">
                  Valor: R$ {(showGerarParcelasDialog.valor_total_mensal || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </p>
              </div>

              <p className="text-sm text-gray-600">
                Serão geradas {showGerarParcelasDialog.prazo_meses} parcelas automaticamente.
                Você poderá gerenciá-las individualmente após a geração.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGerarParcelasDialog(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => gerarParcelasMutation.mutate(showGerarParcelasDialog)}
                disabled={gerarParcelasMutation.isPending}
                className="bg-blue-600"
              >
                {gerarParcelasMutation.isPending ? 'Gerando...' : 'Gerar Parcelas'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}