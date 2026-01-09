import React, { useState } from "react";
import SelecionarLoteMapaDialog from "../components/imobiliarias/SelecionarLoteMapaDialog";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Plus, Search, Eye, Clock, CheckCircle2, AlertCircle,
  User, Home, Palette, Settings, DollarSign, Building2, MapPin,
  Bed, Bath, Car
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import LayoutImobiliaria from "../components/LayoutImobiliaria";

const STATUS_CONFIG = {
  rascunho: { label: "Aguardando Análise", color: "#6b7280", icon: Clock },
  aguardando_projeto: { label: "Em Desenvolvimento", color: "#f59e0b", icon: Clock },
  aguardando_reuniao: { label: "Projeto Pronto", color: "#3b82f6", icon: CheckCircle2 },
  aprovado: { label: "Aprovado", color: "#10b981", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "#ef4444", icon: AlertCircle },
};

const PADRAO_OPTIONS = [
  { value: "economico", label: "Econômico" },
  { value: "medio_baixo", label: "Médio Baixo" },
  { value: "medio", label: "Médio" },
  { value: "medio_alto", label: "Médio Alto" },
  { value: "alto", label: "Alto Padrão" },
  { value: "luxo", label: "Luxo" },
];

export default function PortalImobiliariaIntencoes() {
  const [showForm, setShowForm] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [intencaoSelecionada, setIntencaoSelecionada] = useState(null);
  const [busca, setBusca] = useState('');
  const [formData, setFormData] = useState({
    nome_cliente: '',
    cpf_cliente: '',
    email_cliente: '',
    telefone_cliente: '',
    loteamento_id: '',
    padrao_imovel: 'medio',
    orcamento_minimo: '',
    orcamento_maximo: '',
    area_construida_desejada: '',
    quantidade_pavimentos: 1,
    quantidade_quartos: 2,
    quantidade_suites: 1,
    quantidade_banheiros: 2,
    quantidade_lavabos: 0,
    vagas_garagem: 1,
    garagem_coberta: true,
    comodos: {
      sala_estar: true,
      sala_jantar: true,
      cozinha: true,
      area_servico: true,
      churrasqueira: false,
      piscina: false,
      varanda: false,
      area_gourmet: false,
    },
    adicionais: {
      ar_condicionado: false,
      aquecimento_solar: false,
      energia_solar: false,
      automacao_residencial: false,
      sistema_seguranca: false,
    },
    detalhes_especificos: '',
    observacoes: '',
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: imobiliaria } = useQuery({
    queryKey: ['minha_imobiliaria_intencoes'],
    queryFn: async () => {
      if (!user?.imobiliaria_id) return null;
      const result = await base44.entities.Imobiliaria.filter({ id: user.imobiliaria_id });
      return result[0];
    },
    enabled: !!user?.imobiliaria_id,
  });

  const { data: intencoes = [] } = useQuery({
    queryKey: ['intencoes_imobiliaria', user?.imobiliaria_id],
    queryFn: async () => {
      if (!user?.imobiliaria_id) return [];
      // Buscar leads da imobiliária que viraram intenções
      const leads = await base44.entities.LeadPreVenda.filter({ imobiliaria_id: user.imobiliaria_id });
      const intencoesAll = await base44.entities.IntencaoCompra.list('-created_date');
      // Filtrar intenções que correspondem aos clientes dos leads
      return intencoesAll.filter(i => i.created_by?.includes(user.email) || leads.some(l => l.intencao_compra_id === i.id));
    },
    enabled: !!user?.imobiliaria_id,
    initialData: [],
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos_form'],
    queryFn: () => base44.entities.Loteamento.list(),
    initialData: [],
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes_imobiliaria'],
    queryFn: () => base44.entities.Cliente.list(),
    initialData: [],
  });

  const createIntencaoMutation = useMutation({
    mutationFn: async (data) => {
      // Primeiro, criar ou encontrar o cliente
      let cliente = clientes.find(c => c.cpf_cnpj === data.cpf_cliente);
      if (!cliente) {
        cliente = await base44.entities.Cliente.create({
          nome: data.nome_cliente,
          cpf_cnpj: data.cpf_cliente,
          email: data.email_cliente,
          telefone: data.telefone_cliente,
        });
      }

      // Criar a intenção de compra
      const intencao = await base44.entities.IntencaoCompra.create({
        cliente_id: cliente.id,
        loteamento_id: data.loteamento_id,
        status: 'rascunho',
        padrao_imovel: data.padrao_imovel,
        orcamento_minimo: data.orcamento_minimo,
        orcamento_maximo: data.orcamento_maximo,
        area_construida_desejada: data.area_construida_desejada,
        quantidade_pavimentos: data.quantidade_pavimentos,
        quantidade_quartos: data.quantidade_quartos,
        quantidade_suites: data.quantidade_suites,
        quantidade_banheiros: data.quantidade_banheiros,
        quantidade_lavabos: data.quantidade_lavabos,
        vagas_garagem: data.vagas_garagem,
        garagem_coberta: data.garagem_coberta,
        comodos: data.comodos,
        adicionais: data.adicionais,
        detalhes_especificos: data.detalhes_especificos,
        observacoes: `Cadastrado via Portal Imobiliária: ${imobiliaria?.nome || 'N/A'}\n\n${data.observacoes}`,
      });

      return intencao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intencoes_imobiliaria'] });
      queryClient.invalidateQueries({ queryKey: ['clientes_imobiliaria'] });
      toast.success('Pré-Intenção cadastrada! A incorporadora será notificada.');
      setShowForm(false);
      resetForm();
    },
    onError: () => {
      toast.error('Erro ao cadastrar pré-intenção');
    },
  });

  const resetForm = () => {
    setFormData({
      nome_cliente: '',
      cpf_cliente: '',
      email_cliente: '',
      telefone_cliente: '',
      loteamento_id: '',
      padrao_imovel: 'medio',
      orcamento_minimo: '',
      orcamento_maximo: '',
      area_construida_desejada: '',
      quantidade_pavimentos: 1,
      quantidade_quartos: 2,
      quantidade_suites: 1,
      quantidade_banheiros: 2,
      quantidade_lavabos: 0,
      vagas_garagem: 1,
      garagem_coberta: true,
      comodos: {
        sala_estar: true,
        sala_jantar: true,
        cozinha: true,
        area_servico: true,
        churrasqueira: false,
        piscina: false,
        varanda: false,
        area_gourmet: false,
      },
      adicionais: {
        ar_condicionado: false,
        aquecimento_solar: false,
        energia_solar: false,
        automacao_residencial: false,
        sistema_seguranca: false,
      },
      detalhes_especificos: '',
      observacoes: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome_cliente || !formData.cpf_cliente || !formData.telefone_cliente) {
      toast.error('Preencha os dados obrigatórios do cliente');
      return;
    }
    createIntencaoMutation.mutate(formData);
  };

  const intencoesFiltradas = intencoes.filter(i => {
    const cliente = clientes.find(c => c.id === i.cliente_id);
    return !busca || 
      cliente?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      cliente?.cpf_cnpj?.includes(busca);
  });

  return (
    <LayoutImobiliaria>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--wine-700)]">Pré-Intenções de Compra</h1>
            <p className="text-gray-600 mt-1">Cadastre pré-intenções para seus clientes</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Pré-Intenção
          </Button>
        </div>

        {/* Busca */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou CPF do cliente..."
            className="pl-10"
          />
        </div>

        {/* Lista de Intenções */}
        {intencoesFiltradas.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhuma pré-intenção cadastrada
              </h3>
              <p className="text-gray-600 mb-6">
                Cadastre uma pré-intenção de compra para seu cliente
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
              >
                <Plus className="w-5 h-5 mr-2" />
                Cadastrar Primeira Pré-Intenção
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {intencoesFiltradas.map((intencao) => {
              const cliente = clientes.find(c => c.id === intencao.cliente_id);
              const loteamento = loteamentos.find(l => l.id === intencao.loteamento_id);
              const statusConfig = STATUS_CONFIG[intencao.status];
              const StatusIcon = statusConfig?.icon || Clock;

              return (
                <Card key={intencao.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-[var(--wine-100)] flex items-center justify-center">
                            <User className="w-5 h-5 text-[var(--wine-600)]" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{cliente?.nome || 'Cliente'}</h3>
                            <p className="text-sm text-gray-600">{cliente?.cpf_cnpj}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-500">Loteamento</p>
                            <p className="font-medium text-sm">{loteamento?.nome || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Padrão</p>
                            <p className="font-medium text-sm capitalize">{intencao.padrao_imovel?.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Área</p>
                            <p className="font-medium text-sm">{intencao.area_construida_desejada || 0}m²</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Orçamento</p>
                            <p className="font-medium text-sm text-green-600">
                              R$ {(intencao.orcamento_maximo || 0).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <Badge style={{ backgroundColor: statusConfig?.color }} className="text-white">
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig?.label}
                        </Badge>
                        <p className="text-xs text-gray-500">
                          {format(parseISO(intencao.created_date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIntencaoSelecionada(intencao);
                            setShowDetalhes(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog Nova Pré-Intenção */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Nova Pré-Intenção de Compra
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden">
            <Tabs defaultValue="cliente" className="flex flex-col h-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="cliente">
                  <User className="w-4 h-4 mr-1" />
                  Cliente
                </TabsTrigger>
                <TabsTrigger value="imovel">
                  <Home className="w-4 h-4 mr-1" />
                  Imóvel
                </TabsTrigger>
                <TabsTrigger value="comodos">
                  <Building2 className="w-4 h-4 mr-1" />
                  Cômodos
                </TabsTrigger>
                <TabsTrigger value="orcamento">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Orçamento
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 h-[400px] mt-4 pr-4">
                <TabsContent value="cliente" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Nome Completo *</Label>
                      <Input
                        value={formData.nome_cliente}
                        onChange={(e) => setFormData({...formData, nome_cliente: e.target.value})}
                        placeholder="Nome do cliente"
                        required
                      />
                    </div>
                    <div>
                      <Label>CPF *</Label>
                      <Input
                        value={formData.cpf_cliente}
                        onChange={(e) => setFormData({...formData, cpf_cliente: e.target.value})}
                        placeholder="000.000.000-00"
                        required
                      />
                    </div>
                    <div>
                      <Label>Telefone *</Label>
                      <Input
                        value={formData.telefone_cliente}
                        onChange={(e) => setFormData({...formData, telefone_cliente: e.target.value})}
                        placeholder="(00) 00000-0000"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        value={formData.email_cliente}
                        onChange={(e) => setFormData({...formData, email_cliente: e.target.value})}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label>Loteamento de Preferência</Label>
                    <Select
                      value={formData.loteamento_id}
                      onValueChange={(value) => setFormData({...formData, loteamento_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um loteamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {loteamentos.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="imovel" className="space-y-4">
                  <div>
                    <Label>Padrão do Imóvel</Label>
                    <Select
                      value={formData.padrao_imovel}
                      onValueChange={(value) => setFormData({...formData, padrao_imovel: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PADRAO_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Área Desejada (m²)</Label>
                      <Input
                        type="number"
                        value={formData.area_construida_desejada}
                        onChange={(e) => setFormData({...formData, area_construida_desejada: parseFloat(e.target.value) || ''})}
                        placeholder="150"
                      />
                    </div>
                    <div>
                      <Label>Pavimentos</Label>
                      <Input
                        type="number"
                        min={1}
                        max={4}
                        value={formData.quantidade_pavimentos}
                        onChange={(e) => setFormData({...formData, quantidade_pavimentos: parseInt(e.target.value) || 1})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label>Quartos</Label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.quantidade_quartos}
                        onChange={(e) => setFormData({...formData, quantidade_quartos: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label>Suítes</Label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.quantidade_suites}
                        onChange={(e) => setFormData({...formData, quantidade_suites: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label>Banheiros</Label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.quantidade_banheiros}
                        onChange={(e) => setFormData({...formData, quantidade_banheiros: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label>Garagem</Label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.vagas_garagem}
                        onChange={(e) => setFormData({...formData, vagas_garagem: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.garagem_coberta}
                      onCheckedChange={(checked) => setFormData({...formData, garagem_coberta: checked})}
                    />
                    <Label>Garagem Coberta</Label>
                  </div>
                </TabsContent>

                <TabsContent value="comodos" className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Cômodos Desejados</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'sala_estar', label: 'Sala de Estar' },
                        { key: 'sala_jantar', label: 'Sala de Jantar' },
                        { key: 'cozinha', label: 'Cozinha' },
                        { key: 'area_servico', label: 'Área de Serviço' },
                        { key: 'churrasqueira', label: 'Churrasqueira' },
                        { key: 'piscina', label: 'Piscina' },
                        { key: 'varanda', label: 'Varanda' },
                        { key: 'area_gourmet', label: 'Área Gourmet' },
                      ].map(item => (
                        <div key={item.key} className="flex items-center gap-2 p-2 border rounded-lg">
                          <Switch
                            checked={formData.comodos?.[item.key] || false}
                            onCheckedChange={(checked) => setFormData({
                              ...formData, 
                              comodos: { ...formData.comodos, [item.key]: checked }
                            })}
                          />
                          <Label className="text-sm">{item.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Adicionais</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'ar_condicionado', label: 'Ar Condicionado' },
                        { key: 'aquecimento_solar', label: 'Aquecimento Solar' },
                        { key: 'energia_solar', label: 'Energia Solar' },
                        { key: 'automacao_residencial', label: 'Automação' },
                        { key: 'sistema_seguranca', label: 'Segurança' },
                      ].map(item => (
                        <div key={item.key} className="flex items-center gap-2 p-2 border rounded-lg">
                          <Switch
                            checked={formData.adicionais?.[item.key] || false}
                            onCheckedChange={(checked) => setFormData({
                              ...formData, 
                              adicionais: { ...formData.adicionais, [item.key]: checked }
                            })}
                          />
                          <Label className="text-sm">{item.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="orcamento" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Orçamento Mínimo (R$)</Label>
                      <Input
                        type="number"
                        value={formData.orcamento_minimo}
                        onChange={(e) => setFormData({...formData, orcamento_minimo: parseFloat(e.target.value) || ''})}
                        placeholder="200000"
                      />
                    </div>
                    <div>
                      <Label>Orçamento Máximo (R$)</Label>
                      <Input
                        type="number"
                        value={formData.orcamento_maximo}
                        onChange={(e) => setFormData({...formData, orcamento_maximo: parseFloat(e.target.value) || ''})}
                        placeholder="500000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Detalhes Específicos</Label>
                    <Textarea
                      value={formData.detalhes_especificos}
                      onChange={(e) => setFormData({...formData, detalhes_especificos: e.target.value})}
                      rows={3}
                      placeholder="Descreva preferências específicas do cliente..."
                    />
                  </div>

                  <div>
                    <Label>Observações da Imobiliária</Label>
                    <Textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      rows={3}
                      placeholder="Informações adicionais para a incorporadora..."
                    />
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createIntencaoMutation.isPending}
                className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
              >
                {createIntencaoMutation.isPending ? 'Cadastrando...' : 'Cadastrar Pré-Intenção'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhes da Pré-Intenção
            </DialogTitle>
          </DialogHeader>

          {intencaoSelecionada && (
            <div className="space-y-6">
              {(() => {
                const cliente = clientes.find(c => c.id === intencaoSelecionada.cliente_id);
                const loteamento = loteamentos.find(l => l.id === intencaoSelecionada.loteamento_id);
                const statusConfig = STATUS_CONFIG[intencaoSelecionada.status];

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[var(--wine-100)] flex items-center justify-center">
                          <User className="w-6 h-6 text-[var(--wine-600)]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl">{cliente?.nome}</h3>
                          <p className="text-gray-600">{cliente?.telefone}</p>
                        </div>
                      </div>
                      <Badge style={{ backgroundColor: statusConfig?.color }} className="text-white px-4 py-2">
                        {statusConfig?.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Loteamento</p>
                        <p className="font-semibold">{loteamento?.nome || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Área</p>
                        <p className="font-semibold">{intencaoSelecionada.area_construida_desejada || 0}m²</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Quartos</p>
                        <p className="font-semibold">{intencaoSelecionada.quantidade_quartos || 0}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Banheiros</p>
                        <p className="font-semibold">{intencaoSelecionada.quantidade_banheiros || 0}</p>
                      </div>
                    </div>

                    {intencaoSelecionada.projeto_arquitetonico_url && (
                      <Card className="bg-purple-50 border-purple-200">
                        <CardHeader>
                          <CardTitle className="text-base">Projeto Disponível</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={() => window.open(intencaoSelecionada.projeto_arquitetonico_url, '_blank')}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar Projeto
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {intencaoSelecionada.observacoes && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-semibold mb-2">Observações</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{intencaoSelecionada.observacoes}</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </LayoutImobiliaria>
  );
}