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
import { Checkbox } from "@/components/ui/checkbox";
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
import { 
  Plus, Edit, Trash2, Search, FolderTree, ChevronRight, ChevronDown,
  FileText, Wallet, TrendingUp, TrendingDown, Building2
} from "lucide-react";
import { toast } from "sonner";

const tipoConfig = {
  ativo: { label: "Ativo", color: "bg-blue-100 text-blue-800", icon: Wallet },
  passivo: { label: "Passivo", color: "bg-red-100 text-red-800", icon: TrendingDown },
  receita: { label: "Receita", color: "bg-green-100 text-green-800", icon: TrendingUp },
  despesa: { label: "Despesa", color: "bg-orange-100 text-orange-800", icon: TrendingDown },
  patrimonio_liquido: { label: "Patrimônio Líquido", color: "bg-purple-100 text-purple-800", icon: Building2 },
};

export default function PlanoContas() {
  const [busca, setBusca] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingConta, setEditingConta] = useState(null);
  const [expandedContas, setExpandedContas] = useState(new Set());
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    tipo: "ativo",
    natureza: "devedora",
    nivel: 1,
    conta_pai_id: "",
    eh_analitica: true,
    saldo_inicial: 0,
    ativa: true,
    observacoes: "",
  });

  const queryClient = useQueryClient();

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ['plano_contas'],
    queryFn: () => base44.entities.PlanoContas.list('codigo'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PlanoContas.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plano_contas'] });
      toast.success("Conta criada com sucesso!");
      setShowDialog(false);
      resetForm();
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlanoContas.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plano_contas'] });
      toast.success("Conta atualizada!");
      setShowDialog(false);
      setEditingConta(null);
      resetForm();
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlanoContas.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plano_contas'] });
      toast.success("Conta removida!");
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const resetForm = () => {
    setFormData({
      codigo: "",
      nome: "",
      tipo: "ativo",
      natureza: "devedora",
      nivel: 1,
      conta_pai_id: "",
      eh_analitica: true,
      saldo_inicial: 0,
      ativa: true,
      observacoes: "",
    });
  };

  const handleEdit = (conta) => {
    setEditingConta(conta);
    setFormData({
      codigo: conta.codigo || "",
      nome: conta.nome || "",
      tipo: conta.tipo || "ativo",
      natureza: conta.natureza || "devedora",
      nivel: conta.nivel || 1,
      conta_pai_id: conta.conta_pai_id || "",
      eh_analitica: conta.eh_analitica !== false,
      saldo_inicial: conta.saldo_inicial || 0,
      ativa: conta.ativa !== false,
      observacoes: conta.observacoes || "",
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.codigo || !formData.nome) {
      toast.error("Código e nome são obrigatórios");
      return;
    }

    if (editingConta) {
      updateMutation.mutate({ id: editingConta.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (conta) => {
    if (window.confirm(`Remover a conta "${conta.codigo} - ${conta.nome}"?`)) {
      deleteMutation.mutate(conta.id);
    }
  };

  const toggleExpand = (contaId) => {
    const newExpanded = new Set(expandedContas);
    if (newExpanded.has(contaId)) {
      newExpanded.delete(contaId);
    } else {
      newExpanded.add(contaId);
    }
    setExpandedContas(newExpanded);
  };

  // Organizar contas em árvore
  const contasRaiz = contas.filter(c => !c.conta_pai_id);
  const getFilhos = (contaId) => contas.filter(c => c.conta_pai_id === contaId);

  const contasFiltradas = busca
    ? contas.filter(c => 
        c.codigo?.toLowerCase().includes(busca.toLowerCase()) ||
        c.nome?.toLowerCase().includes(busca.toLowerCase())
      )
    : null;

  const renderConta = (conta, nivel = 0) => {
    const filhos = getFilhos(conta.id);
    const temFilhos = filhos.length > 0;
    const expandido = expandedContas.has(conta.id);
    const config = tipoConfig[conta.tipo] || tipoConfig.ativo;

    return (
      <React.Fragment key={conta.id}>
        <TableRow className={!conta.ativa ? "opacity-50" : ""}>
          <TableCell>
            <div className="flex items-center gap-2" style={{ paddingLeft: `${nivel * 24}px` }}>
              {temFilhos ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => toggleExpand(conta.id)}
                >
                  {expandido ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="w-6" />
              )}
              <span className="font-mono font-medium">{conta.codigo}</span>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              {conta.eh_analitica ? (
                <FileText className="h-4 w-4 text-gray-400" />
              ) : (
                <FolderTree className="h-4 w-4 text-blue-500" />
              )}
              <span>{conta.nome}</span>
            </div>
          </TableCell>
          <TableCell>
            <Badge className={config.color}>{config.label}</Badge>
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              {conta.natureza === 'devedora' ? 'Devedora' : 'Credora'}
            </Badge>
          </TableCell>
          <TableCell className="text-right font-mono">
            R$ {(conta.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </TableCell>
          <TableCell>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(conta)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(conta)} className="text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {temFilhos && expandido && filhos.map(filho => renderConta(filho, nivel + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)] flex items-center gap-3">
            <FolderTree className="w-8 h-8" />
            Plano de Contas
          </h1>
          <p className="text-gray-600 mt-1">Gerencie a estrutura contábil da empresa</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingConta(null);
            setShowDialog(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por código ou nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="w-[150px]">Tipo</TableHead>
                <TableHead className="w-[120px]">Natureza</TableHead>
                <TableHead className="w-[150px] text-right">Saldo</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                </TableRow>
              ) : contasFiltradas ? (
                contasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Nenhuma conta encontrada</TableCell>
                  </TableRow>
                ) : (
                  contasFiltradas.map(conta => {
                    const config = tipoConfig[conta.tipo] || tipoConfig.ativo;
                    return (
                      <TableRow key={conta.id}>
                        <TableCell className="font-mono font-medium">{conta.codigo}</TableCell>
                        <TableCell>{conta.nome}</TableCell>
                        <TableCell><Badge className={config.color}>{config.label}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{conta.natureza === 'devedora' ? 'Devedora' : 'Credora'}</Badge></TableCell>
                        <TableCell className="text-right font-mono">R$ {(conta.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(conta)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(conta)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )
              ) : contasRaiz.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Nenhuma conta cadastrada</TableCell>
                </TableRow>
              ) : (
                contasRaiz.map(conta => renderConta(conta))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Criação/Edição */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingConta ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ex: 1.1.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome da conta"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="passivo">Passivo</SelectItem>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                    <SelectItem value="patrimonio_liquido">Patrimônio Líquido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Natureza</Label>
                <Select value={formData.natureza} onValueChange={(v) => setFormData({ ...formData, natureza: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="devedora">Devedora</SelectItem>
                    <SelectItem value="credora">Credora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Conta Pai</Label>
                <Select 
                  value={formData.conta_pai_id || "nenhuma"} 
                  onValueChange={(v) => setFormData({ ...formData, conta_pai_id: v === "nenhuma" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">Nenhuma (Raiz)</SelectItem>
                    {contas.filter(c => !c.eh_analitica && c.id !== editingConta?.id).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.codigo} - {c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Saldo Inicial</Label>
                <Input
                  type="number"
                  value={formData.saldo_inicial}
                  onChange={(e) => setFormData({ ...formData, saldo_inicial: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="eh_analitica"
                  checked={formData.eh_analitica}
                  onCheckedChange={(c) => setFormData({ ...formData, eh_analitica: c })}
                />
                <Label htmlFor="eh_analitica">Conta Analítica (aceita lançamentos)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ativa"
                  checked={formData.ativa}
                  onCheckedChange={(c) => setFormData({ ...formData, ativa: c })}
                />
                <Label htmlFor="ativa">Conta Ativa</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
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