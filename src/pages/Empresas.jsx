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
import { 
  Building2, Plus, Edit, Trash2, Star, Mail, Phone, 
  MapPin, FileText, TrendingUp, Upload
} from "lucide-react";
import { toast } from "sonner";

export default function Empresas() {
  const [showForm, setShowForm] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const queryClient = useQueryClient();

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => base44.entities.Empresa.list(),
  });

  const [formData, setFormData] = useState({
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    telefone: "",
    telefone_secundario: "",
    email: "",
    email_financeiro: "",
    site: "",
    logo_url: "",
    regime_tributario: "simples_nacional",
    aliquota_iss: 0,
    aliquota_ir: 0,
    responsavel_legal: "",
    responsavel_legal_cpf: "",
    responsavel_tecnico: "",
    responsavel_tecnico_crea: "",
    banco_principal: "",
    agencia: "",
    conta: "",
    pix: "",
    eh_principal: false,
    ativa: true,
    observacoes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Empresa.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      setShowForm(false);
      toast.success("Empresa criada com sucesso!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Empresa.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      setShowForm(false);
      setEditingEmpresa(null);
      toast.success("Empresa atualizada!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Empresa.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast.success("Empresa excluída!");
    },
  });

  const handleOpenForm = (empresa = null) => {
    if (empresa) {
      setEditingEmpresa(empresa);
      setFormData(empresa);
    } else {
      setEditingEmpresa(null);
      setFormData({
        razao_social: "",
        nome_fantasia: "",
        cnpj: "",
        inscricao_estadual: "",
        inscricao_municipal: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
        telefone: "",
        telefone_secundario: "",
        email: "",
        email_financeiro: "",
        site: "",
        logo_url: "",
        regime_tributario: "simples_nacional",
        aliquota_iss: 0,
        aliquota_ir: 0,
        responsavel_legal: "",
        responsavel_legal_cpf: "",
        responsavel_tecnico: "",
        responsavel_tecnico_crea: "",
        banco_principal: "",
        agencia: "",
        conta: "",
        pix: "",
        eh_principal: false,
        ativa: true,
        observacoes: "",
      });
    }
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEmpresa) {
      updateMutation.mutate({ id: editingEmpresa.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const empresaPrincipal = empresas.find(e => e.eh_principal);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Empresas</h1>
          <p className="text-gray-600 mt-1">Gerencie as empresas do grupo</p>
        </div>
        <Button
          onClick={() => handleOpenForm()}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {empresas.map((empresa) => (
          <Card key={empresa.id} className={`hover:shadow-xl transition-shadow ${empresa.eh_principal ? 'border-2 border-[var(--wine-600)]' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {empresa.logo_url && (
                      <img src={empresa.logo_url} alt="Logo" className="w-12 h-12 object-contain rounded" />
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {empresa.nome_fantasia || empresa.razao_social}
                      </h3>
                      {empresa.eh_principal && (
                        <Badge className="bg-[var(--wine-600)] mt-1">
                          <Star className="w-3 h-3 mr-1" />
                          Empresa Principal
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{empresa.razao_social}</p>
                  <p className="text-xs text-gray-500 mt-1">CNPJ: {empresa.cnpj}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    onClick={() => handleOpenForm(empresa)}
                    variant="ghost"
                    size="icon"
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirm(`Deseja excluir a empresa "${empresa.nome_fantasia}"?`)) {
                        deleteMutation.mutate(empresa.id);
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
                {empresa.telefone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {empresa.telefone}
                  </div>
                )}
                {empresa.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    {empresa.email}
                  </div>
                )}
                {empresa.cidade && empresa.estado && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {empresa.cidade}/{empresa.estado}
                  </div>
                )}
                {empresa.regime_tributario && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="w-4 h-4" />
                    {empresa.regime_tributario.replace('_', ' ')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog Form */}
      {showForm && (
        <Dialog open onOpenChange={setShowForm}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmpresa ? `Editar: ${editingEmpresa.nome_fantasia}` : 'Nova Empresa'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="dados_basicos" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="dados_basicos">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="endereco">Endereço</TabsTrigger>
                  <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
                  <TabsTrigger value="bancario">Bancário</TabsTrigger>
                </TabsList>

                <TabsContent value="dados_basicos" className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Razão Social *</Label>
                      <Input
                        value={formData.razao_social}
                        onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome Fantasia</Label>
                      <Input
                        value={formData.nome_fantasia}
                        onChange={(e) => setFormData({...formData, nome_fantasia: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>CNPJ *</Label>
                      <Input
                        value={formData.cnpj}
                        onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Inscrição Estadual</Label>
                      <Input
                        value={formData.inscricao_estadual}
                        onChange={(e) => setFormData({...formData, inscricao_estadual: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Inscrição Municipal</Label>
                      <Input
                        value={formData.inscricao_municipal}
                        onChange={(e) => setFormData({...formData, inscricao_municipal: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={formData.telefone}
                        onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone Secundário</Label>
                      <Input
                        value={formData.telefone_secundario}
                        onChange={(e) => setFormData({...formData, telefone_secundario: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>E-mail Principal</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail Financeiro</Label>
                      <Input
                        type="email"
                        value={formData.email_financeiro}
                        onChange={(e) => setFormData({...formData, email_financeiro: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input
                      value={formData.site}
                      onChange={(e) => setFormData({...formData, site: e.target.value})}
                      placeholder="https://"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL do Logotipo</Label>
                    <Input
                      value={formData.logo_url}
                      onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                      placeholder="https://"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div>
                        <Label>Empresa Principal</Label>
                        <p className="text-sm text-gray-600">Usar como empresa principal do sistema</p>
                      </div>
                      <Switch
                        checked={formData.eh_principal}
                        onCheckedChange={(checked) => setFormData({...formData, eh_principal: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <Label>Empresa Ativa</Label>
                        <p className="text-sm text-gray-600">Habilitar esta empresa</p>
                      </div>
                      <Switch
                        checked={formData.ativa}
                        onCheckedChange={(checked) => setFormData({...formData, ativa: checked})}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="endereco" className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 space-y-2">
                      <Label>Logradouro</Label>
                      <Input
                        value={formData.logradouro}
                        onChange={(e) => setFormData({...formData, logradouro: e.target.value})}
                        placeholder="Rua, Avenida..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Número</Label>
                      <Input
                        value={formData.numero}
                        onChange={(e) => setFormData({...formData, numero: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Complemento</Label>
                      <Input
                        value={formData.complemento}
                        onChange={(e) => setFormData({...formData, complemento: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bairro</Label>
                      <Input
                        value={formData.bairro}
                        onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Input
                        value={formData.cidade}
                        onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado (UF)</Label>
                      <Input
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CEP</Label>
                      <Input
                        value={formData.cep}
                        onChange={(e) => setFormData({...formData, cep: e.target.value})}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fiscal" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Regime Tributário</Label>
                    <Select
                      value={formData.regime_tributario}
                      onValueChange={(val) => setFormData({...formData, regime_tributario: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                        <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                        <SelectItem value="lucro_real">Lucro Real</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Alíquota ISS (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.aliquota_iss}
                        onChange={(e) => setFormData({...formData, aliquota_iss: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alíquota IR (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.aliquota_ir}
                        onChange={(e) => setFormData({...formData, aliquota_ir: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">Responsável Legal</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                          value={formData.responsavel_legal}
                          onChange={(e) => setFormData({...formData, responsavel_legal: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CPF</Label>
                        <Input
                          value={formData.responsavel_legal_cpf}
                          onChange={(e) => setFormData({...formData, responsavel_legal_cpf: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-3">Responsável Técnico</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                          value={formData.responsavel_tecnico}
                          onChange={(e) => setFormData({...formData, responsavel_tecnico: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CREA</Label>
                        <Input
                          value={formData.responsavel_tecnico_crea}
                          onChange={(e) => setFormData({...formData, responsavel_tecnico_crea: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="bancario" className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Banco Principal</Label>
                      <Input
                        value={formData.banco_principal}
                        onChange={(e) => setFormData({...formData, banco_principal: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Agência</Label>
                      <Input
                        value={formData.agencia}
                        onChange={(e) => setFormData({...formData, agencia: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Conta</Label>
                      <Input
                        value={formData.conta}
                        onChange={(e) => setFormData({...formData, conta: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Chave PIX</Label>
                    <Input
                      value={formData.pix}
                      onChange={(e) => setFormData({...formData, pix: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      rows={4}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]">
                  {editingEmpresa ? 'Atualizar' : 'Criar'} Empresa
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}