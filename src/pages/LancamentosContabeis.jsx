import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Edit, Trash2, Search, FileText, ArrowRightLeft, 
  RotateCcw, Calendar, DollarSign, Filter
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-800" },
  confirmado: { label: "Confirmado", color: "bg-green-100 text-green-800" },
  estornado: { label: "Estornado", color: "bg-red-100 text-red-800" },
};

const tipoConfig = {
  manual: { label: "Manual", color: "bg-blue-100 text-blue-800" },
  automatico: { label: "Automático", color: "bg-purple-100 text-purple-800" },
  ajuste: { label: "Ajuste", color: "bg-orange-100 text-orange-800" },
  encerramento: { label: "Encerramento", color: "bg-gray-100 text-gray-800" },
};

export default function LancamentosContabeis() {
  const [busca, setBusca] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroDataInicio, setFiltroDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filtroDataFim, setFiltroDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  
  const [formData, setFormData] = useState({
    data_lancamento: format(new Date(), 'yyyy-MM-dd'),
    data_competencia: format(new Date(), 'yyyy-MM-dd'),
    conta_debito_id: "",
    conta_credito_id: "",
    valor: 0,
    historico: "",
    tipo: "manual",
    documento_referencia: "",
    centro_custo_id: "",
    observacoes: "",
  });

  const queryClient = useQueryClient();

  const { data: lancamentos = [], isLoading } = useQuery({
    queryKey: ['lancamentos_contabeis'],
    queryFn: () => base44.entities.LancamentoContabil.list('-data_lancamento'),
  });

  const { data: contas = [] } = useQuery({
    queryKey: ['plano_contas'],
    queryFn: () => base44.entities.PlanoContas.list('codigo'),
  });

  const { data: centrosCusto = [] } = useQuery({
    queryKey: ['centros_custo'],
    queryFn: async () => {
      try {
        return await base44.entities.CentroCusto.list();
      } catch {
        return [];
      }
    },
  });

  const contasAnaliticas = contas.filter(c => c.eh_analitica && c.ativa);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const numero = `LC-${Date.now()}`;
      return base44.entities.LancamentoContabil.create({ ...data, numero, status: 'confirmado' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos_contabeis'] });
      toast.success("Lançamento criado com sucesso!");
      setShowDialog(false);
      resetForm();
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LancamentoContabil.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos_contabeis'] });
      toast.success("Lançamento atualizado!");
      setShowDialog(false);
      setEditingLancamento(null);
      resetForm();
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const estornarMutation = useMutation({
    mutationFn: async (lancamento) => {
      // Criar lançamento de estorno (inverso)
      const estorno = await base44.entities.LancamentoContabil.create({
        numero: `EST-${Date.now()}`,
        data_lancamento: format(new Date(), 'yyyy-MM-dd'),
        data_competencia: lancamento.data_competencia,
        conta_debito_id: lancamento.conta_credito_id,
        conta_credito_id: lancamento.conta_debito_id,
        valor: lancamento.valor,
        historico: `Estorno: ${lancamento.historico}`,
        tipo: 'ajuste',
        status: 'confirmado',
        lancamento_estorno_id: lancamento.id,
      });
      
      // Marcar original como estornado
      await base44.entities.LancamentoContabil.update(lancamento.id, {
        status: 'estornado',
        lancamento_estorno_id: estorno.id,
      });
      
      return estorno;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos_contabeis'] });
      toast.success("Lançamento estornado!");
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LancamentoContabil.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos_contabeis'] });
      toast.success("Lançamento removido!");
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const resetForm = () => {
    setFormData({
      data_lancamento: format(new Date(), 'yyyy-MM-dd'),
      data_competencia: format(new Date(), 'yyyy-MM-dd'),
      conta_debito_id: "",
      conta_credito_id: "",
      valor: 0,
      historico: "",
      tipo: "manual",
      documento_referencia: "",
      centro_custo_id: "",
      observacoes: "",
    });
  };

  const handleEdit = (lancamento) => {
    if (lancamento.status !== 'rascunho') {
      toast.error("Apenas lançamentos em rascunho podem ser editados");
      return;
    }
    setEditingLancamento(lancamento);
    setFormData({
      data_lancamento: lancamento.data_lancamento || "",
      data_competencia: lancamento.data_competencia || "",
      conta_debito_id: lancamento.conta_debito_id || "",
      conta_credito_id: lancamento.conta_credito_id || "",
      valor: lancamento.valor || 0,
      historico: lancamento.historico || "",
      tipo: lancamento.tipo || "manual",
      documento_referencia: lancamento.documento_referencia || "",
      centro_custo_id: lancamento.centro_custo_id || "",
      observacoes: lancamento.observacoes || "",
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.conta_debito_id || !formData.conta_credito_id || !formData.valor || !formData.historico) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (formData.conta_debito_id === formData.conta_credito_id) {
      toast.error("Conta débito e crédito devem ser diferentes");
      return;
    }

    if (editingLancamento) {
      updateMutation.mutate({ id: editingLancamento.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEstornar = (lancamento) => {
    if (lancamento.status !== 'confirmado') {
      toast.error("Apenas lançamentos confirmados podem ser estornados");
      return;
    }
    if (window.confirm("Tem certeza que deseja estornar este lançamento?")) {
      estornarMutation.mutate(lancamento);
    }
  };

  const handleDelete = (lancamento) => {
    if (lancamento.status !== 'rascunho') {
      toast.error("Apenas lançamentos em rascunho podem ser removidos");
      return;
    }
    if (window.confirm("Remover este lançamento?")) {
      deleteMutation.mutate(lancamento.id);
    }
  };

  const getContaNome = (contaId) => {
    const conta = contas.find(c => c.id === contaId);
    return conta ? `${conta.codigo} - ${conta.nome}` : '-';
  };

  // Filtrar lançamentos
  const lancamentosFiltrados = lancamentos.filter(l => {
    const matchBusca = !busca || 
      l.historico?.toLowerCase().includes(busca.toLowerCase()) ||
      l.numero?.toLowerCase().includes(busca.toLowerCase());
    
    const matchStatus = filtroStatus === 'todos' || l.status === filtroStatus;
    
    const dataLanc = l.data_lancamento;
    const matchData = (!filtroDataInicio || dataLanc >= filtroDataInicio) && 
                     (!filtroDataFim || dataLanc <= filtroDataFim);
    
    return matchBusca && matchStatus && matchData;
  });

  // Totais
  const totalDebitos = lancamentosFiltrados
    .filter(l => l.status === 'confirmado')
    .reduce((acc, l) => acc + (l.valor || 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)] flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Lançamentos Contábeis
          </h1>
          <p className="text-gray-600 mt-1">Gerencie os lançamentos contábeis da empresa</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingLancamento(null);
            setShowDialog(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Lançamento
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid md:grid-cols-5 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por histórico ou número..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
              />
            </div>
            <div>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="estornado">Estornado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total de Lançamentos</p>
            <p className="text-2xl font-bold">{lancamentosFiltrados.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Movimentado</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {totalDebitos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Período</p>
            <p className="text-lg font-medium">
              {filtroDataInicio && format(parseISO(filtroDataInicio), "dd/MM/yyyy", { locale: ptBR })} - {filtroDataFim && format(parseISO(filtroDataFim), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Número</TableHead>
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead>Débito</TableHead>
                <TableHead>Crédito</TableHead>
                <TableHead className="w-[130px] text-right">Valor</TableHead>
                <TableHead>Histórico</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell>
                </TableRow>
              ) : lancamentosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">Nenhum lançamento encontrado</TableCell>
                </TableRow>
              ) : (
                lancamentosFiltrados.map(lancamento => {
                  const statusCfg = statusConfig[lancamento.status] || statusConfig.rascunho;
                  return (
                    <TableRow key={lancamento.id} className={lancamento.status === 'estornado' ? 'opacity-50' : ''}>
                      <TableCell className="font-mono text-sm">{lancamento.numero}</TableCell>
                      <TableCell>
                        {lancamento.data_lancamento && format(parseISO(lancamento.data_lancamento), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-sm">{getContaNome(lancamento.conta_debito_id)}</TableCell>
                      <TableCell className="text-sm">{getContaNome(lancamento.conta_credito_id)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        R$ {(lancamento.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{lancamento.historico}</TableCell>
                      <TableCell><Badge className={statusCfg.color}>{statusCfg.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {lancamento.status === 'rascunho' && (
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(lancamento)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {lancamento.status === 'confirmado' && (
                            <Button variant="ghost" size="icon" onClick={() => handleEstornar(lancamento)} title="Estornar">
                              <RotateCcw className="h-4 w-4 text-orange-600" />
                            </Button>
                          )}
                          {lancamento.status === 'rascunho' && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(lancamento)} className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Criação/Edição */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLancamento ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Lançamento *</Label>
                <Input
                  type="date"
                  value={formData.data_lancamento}
                  onChange={(e) => setFormData({ ...formData, data_lancamento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Competência</Label>
                <Input
                  type="date"
                  value={formData.data_competencia}
                  onChange={(e) => setFormData({ ...formData, data_competencia: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Conta Débito *</Label>
                <Select value={formData.conta_debito_id} onValueChange={(v) => setFormData({ ...formData, conta_debito_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {contasAnaliticas.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.codigo} - {c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Conta Crédito *</Label>
                <Select value={formData.conta_credito_id} onValueChange={(v) => setFormData({ ...formData, conta_credito_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {contasAnaliticas.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.codigo} - {c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="ajuste">Ajuste</SelectItem>
                    <SelectItem value="encerramento">Encerramento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Histórico *</Label>
              <Input
                value={formData.historico}
                onChange={(e) => setFormData({ ...formData, historico: e.target.value })}
                placeholder="Descrição do lançamento"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Documento de Referência</Label>
                <Input
                  value={formData.documento_referencia}
                  onChange={(e) => setFormData({ ...formData, documento_referencia: e.target.value })}
                  placeholder="NF, Recibo, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Centro de Custo</Label>
                <Select 
                  value={formData.centro_custo_id || "nenhum"} 
                  onValueChange={(v) => setFormData({ ...formData, centro_custo_id: v === "nenhum" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Nenhum</SelectItem>
                    {centrosCusto.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button 
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
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