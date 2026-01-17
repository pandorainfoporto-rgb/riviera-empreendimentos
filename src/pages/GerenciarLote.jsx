import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Save, ArrowLeft, MapPin, Ruler, DollarSign, User, FileText, 
  Trash2, Plus, Upload, Download, History, Eye, Edit3
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import SearchClienteDialog from "@/components/shared/SearchClienteDialog";
import VisualizacaoLote3D from "@/components/loteamentos/VisualizacaoLote3D";

export default function GerenciarLote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === "novo";

  const [formData, setFormData] = useState({
    loteamento_id: "",
    numero: "",
    quadra: "",
    area: "",
    testada: "",
    valor_total: "",
    valor_m2: "",
    status: "disponivel",
    cliente_id: "",
    negociacao_id: "",
    observacoes: "",
    coordenadas_mapa: [],
    descricao_localizacao: "",
    numero_matricula: "",
    inscricao_municipal: "",
    documentos: [],
    historico: []
  });

  const [showClienteDialog, setShowClienteDialog] = useState(false);
  const [editandoCoordenadas, setEditandoCoordenadas] = useState(false);
  const [coordenadasTexto, setCoordenadasTexto] = useState("");

  const { data: lote, isLoading } = useQuery({
    queryKey: ['lote', id],
    queryFn: () => base44.entities.Lote.get(id),
    enabled: !isNew,
    onSuccess: (data) => {
      setFormData(data);
      setCoordenadasTexto(JSON.stringify(data.coordenadas_mapa || [], null, 2));
    }
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list()
  });

  const { data: cliente } = useQuery({
    queryKey: ['cliente', formData.cliente_id],
    queryFn: () => base44.entities.Cliente.get(formData.cliente_id),
    enabled: !!formData.cliente_id
  });

  const { data: negociacao } = useQuery({
    queryKey: ['negociacao', formData.negociacao_id],
    queryFn: () => base44.entities.Negociacao.get(formData.negociacao_id),
    enabled: !!formData.negociacao_id
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (isNew) {
        return base44.entities.Lote.create(data);
      }
      return base44.entities.Lote.update(id, data);
    },
    onSuccess: () => {
      toast({ title: "Lote salvo com sucesso!" });
      queryClient.invalidateQueries(['lote', id]);
      queryClient.invalidateQueries(['lotes']);
      if (isNew) {
        navigate(-1);
      }
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar lote", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Lote.delete(id),
    onSuccess: () => {
      toast({ title: "Lote excluído com sucesso!" });
      navigate(-1);
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir lote", description: error.message, variant: "destructive" });
    }
  });

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      area: parseFloat(formData.area) || 0,
      testada: parseFloat(formData.testada) || 0,
      valor_total: parseFloat(formData.valor_total) || 0,
      valor_m2: parseFloat(formData.valor_m2) || 0,
    };
    saveMutation.mutate(dataToSave);
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este lote?")) {
      deleteMutation.mutate();
    }
  };

  const handleSelecionarCliente = (cliente) => {
    setFormData({ ...formData, cliente_id: cliente.id });
    setShowClienteDialog(false);
  };

  const handleSalvarCoordenadas = () => {
    try {
      const coordenadas = JSON.parse(coordenadasTexto);
      setFormData({ ...formData, coordenadas_mapa: coordenadas });
      setEditandoCoordenadas(false);
      toast({ title: "Coordenadas atualizadas!" });
    } catch (error) {
      toast({ title: "Erro ao processar coordenadas", description: "JSON inválido", variant: "destructive" });
    }
  };

  const adicionarDocumento = () => {
    const novoDoc = {
      id: Date.now().toString(),
      tipo: "documento_geral",
      titulo: "Novo Documento",
      url: "",
      data_upload: new Date().toISOString()
    };
    setFormData({ 
      ...formData, 
      documentos: [...(formData.documentos || []), novoDoc] 
    });
  };

  const removerDocumento = (docId) => {
    setFormData({
      ...formData,
      documentos: formData.documentos.filter(d => d.id !== docId)
    });
  };

  const adicionarHistorico = (evento) => {
    const novoEvento = {
      id: Date.now().toString(),
      data: new Date().toISOString(),
      evento: evento,
      usuario: "Sistema"
    };
    setFormData({
      ...formData,
      historico: [...(formData.historico || []), novoEvento]
    });
  };

  const statusOptions = [
    { value: "disponivel", label: "Disponível", color: "bg-green-100 text-green-800" },
    { value: "reservado", label: "Reservado", color: "bg-yellow-100 text-yellow-800" },
    { value: "em_negociacao", label: "Em Negociação", color: "bg-blue-100 text-blue-800" },
    { value: "vendido", label: "Vendido", color: "bg-gray-100 text-gray-800" },
    { value: "indisponivel", label: "Indisponível", color: "bg-red-100 text-red-800" }
  ];

  if (isLoading && !isNew) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isNew ? "Novo Lote" : `Lote ${formData.numero}`}
            </h1>
            {!isNew && (
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusOptions.find(s => s.value === formData.status)?.color}>
                  {statusOptions.find(s => s.value === formData.status)?.label}
                </Badge>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          )}
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dados" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
          <TabsTrigger value="localizacao">Localização</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="cliente">Cliente/Negociação</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="3d">Visualização 3D</TabsTrigger>
        </TabsList>

        {/* Aba: Dados Básicos */}
        <TabsContent value="dados">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Loteamento *</Label>
                  <Select 
                    value={formData.loteamento_id} 
                    onValueChange={(value) => setFormData({...formData, loteamento_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o loteamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {loteamentos.map(lot => (
                        <SelectItem key={lot.id} value={lot.id}>{lot.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status *</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Número do Lote *</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    placeholder="001"
                  />
                </div>
                <div>
                  <Label>Quadra</Label>
                  <Input
                    value={formData.quadra}
                    onChange={(e) => setFormData({...formData, quadra: e.target.value})}
                    placeholder="A"
                  />
                </div>
                <div>
                  <Label>Área (m²) *</Label>
                  <Input
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    placeholder="250.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Testada (m)</Label>
                  <Input
                    type="number"
                    value={formData.testada}
                    onChange={(e) => setFormData({...formData, testada: e.target.value})}
                    placeholder="10.00"
                  />
                </div>
                <div>
                  <Label>Número da Matrícula</Label>
                  <Input
                    value={formData.numero_matricula}
                    onChange={(e) => setFormData({...formData, numero_matricula: e.target.value})}
                    placeholder="12345"
                  />
                </div>
              </div>

              <div>
                <Label>Inscrição Municipal</Label>
                <Input
                  value={formData.inscricao_municipal}
                  onChange={(e) => setFormData({...formData, inscricao_municipal: e.target.value})}
                  placeholder="123456789"
                />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Observações gerais sobre o lote..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Localização */}
        <TabsContent value="localizacao">
          <Card>
            <CardHeader>
              <CardTitle>Localização e Coordenadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Descrição da Localização</Label>
                <Textarea
                  value={formData.descricao_localizacao}
                  onChange={(e) => setFormData({...formData, descricao_localizacao: e.target.value})}
                  placeholder="Ex: Esquina com Rua Principal, próximo ao parque..."
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Coordenadas do Mapa (JSON)</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditandoCoordenadas(!editandoCoordenadas)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {editandoCoordenadas ? "Cancelar" : "Editar"}
                  </Button>
                </div>
                {editandoCoordenadas ? (
                  <>
                    <Textarea
                      value={coordenadasTexto}
                      onChange={(e) => setCoordenadasTexto(e.target.value)}
                      placeholder='[[x1, y1], [x2, y2], [x3, y3], ...]'
                      rows={10}
                      className="font-mono text-sm"
                    />
                    <Button onClick={handleSalvarCoordenadas} className="mt-2">
                      Salvar Coordenadas
                    </Button>
                  </>
                ) : (
                  <div className="p-4 bg-gray-50 rounded border font-mono text-sm">
                    {formData.coordenadas_mapa?.length > 0 
                      ? `${formData.coordenadas_mapa.length} pontos definidos`
                      : "Nenhuma coordenada definida"
                    }
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Financeiro */}
        <TabsContent value="financeiro">
          <Card>
            <CardHeader>
              <CardTitle>Informações Financeiras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor Total (R$) *</Label>
                  <Input
                    type="number"
                    value={formData.valor_total}
                    onChange={(e) => setFormData({...formData, valor_total: e.target.value})}
                    placeholder="150000.00"
                  />
                </div>
                <div>
                  <Label>Valor por m² (R$)</Label>
                  <Input
                    type="number"
                    value={formData.valor_m2}
                    onChange={(e) => setFormData({...formData, valor_m2: e.target.value})}
                    placeholder="600.00"
                  />
                </div>
              </div>

              {formData.area && formData.valor_total && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">Cálculo Automático</p>
                  <p className="text-lg font-bold text-blue-700 mt-1">
                    R$ {(parseFloat(formData.valor_total) / parseFloat(formData.area)).toFixed(2)} por m²
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Cliente/Negociação */}
        <TabsContent value="cliente">
          <Card>
            <CardHeader>
              <CardTitle>Cliente e Negociação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Cliente Vinculado</Label>
                <div className="flex gap-2">
                  <Input
                    value={cliente?.nome || "Nenhum cliente vinculado"}
                    readOnly
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={() => setShowClienteDialog(true)}>
                    <User className="w-4 h-4 mr-2" />
                    Selecionar
                  </Button>
                  {formData.cliente_id && (
                    <Button variant="ghost" onClick={() => setFormData({...formData, cliente_id: ""})}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {cliente && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-sm"><strong>Nome:</strong> {cliente.nome}</p>
                  <p className="text-sm"><strong>CPF/CNPJ:</strong> {cliente.cpf_cnpj}</p>
                  <p className="text-sm"><strong>Telefone:</strong> {cliente.telefone}</p>
                  <p className="text-sm"><strong>Email:</strong> {cliente.email}</p>
                </div>
              )}

              <div>
                <Label>ID da Negociação</Label>
                <Input
                  value={formData.negociacao_id}
                  onChange={(e) => setFormData({...formData, negociacao_id: e.target.value})}
                  placeholder="ID da negociação vinculada"
                />
              </div>

              {negociacao && (
                <div className="p-4 bg-green-50 rounded-lg space-y-2">
                  <p className="text-sm"><strong>Status:</strong> {negociacao.status}</p>
                  <p className="text-sm"><strong>Valor Total:</strong> R$ {negociacao.valor_total?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                  <p className="text-sm"><strong>Data Início:</strong> {new Date(negociacao.data_inicio).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Documentos */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Documentos do Lote</CardTitle>
                <Button onClick={adicionarDocumento}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Documento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.documentos?.length > 0 ? (
                <div className="space-y-3">
                  {formData.documentos.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">{doc.titulo}</p>
                          <p className="text-xs text-gray-600">
                            {doc.tipo} • {new Date(doc.data_upload).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {doc.url && (
                          <Button variant="outline" size="sm" onClick={() => window.open(doc.url, '_blank')}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => removerDocumento(doc.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum documento cadastrado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Histórico */}
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Alterações</CardTitle>
            </CardHeader>
            <CardContent>
              {formData.historico?.length > 0 ? (
                <div className="space-y-3">
                  {formData.historico.map((evento) => (
                    <div key={evento.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg border">
                      <History className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">{evento.evento}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(evento.data).toLocaleString('pt-BR')} • {evento.usuario}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum histórico registrado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Visualização 3D */}
        <TabsContent value="3d">
          <Card>
            <CardHeader>
              <CardTitle>Visualização 3D do Lote</CardTitle>
            </CardHeader>
            <CardContent>
              <VisualizacaoLote3D 
                lote={formData} 
                loteamentos={loteamentos}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Seleção de Cliente */}
      <SearchClienteDialog
        open={showClienteDialog}
        onClose={() => setShowClienteDialog(false)}
        onSelect={handleSelecionarCliente}
      />
    </div>
  );
}