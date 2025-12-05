import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputMask, validarCPF, validarCNPJ, removeMask } from "@/components/ui/input-mask";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, MessageSquare, User, MapPin, CreditCard, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ImageUploader from "../imagens/ImageUploader";
import ImageGallery from "../imagens/ImageGallery";
import EnderecoForm from "../endereco/EnderecoForm";

const initialFormData = {
  nome: "",
  cpf_cnpj: "",
  rg: "",
  eh_inquilino: false,
  telefone: "",
  telefone_emergencia: "",
  email: "",
  profissao: "",
  filiacao_pai: "",
  filiacao_mae: "",
  tipo_logradouro: "",
  logradouro: "",
  numero: "",
  complemento: "",
  referencia: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  banco: "",
  agencia: "",
  conta: "",
  tipo_conta: "",
  tipo_pix: "",
  chave_pix: "",
  renda_mensal: 0,
  tem_acesso_portal: false,
  unidade_id: "",
};

export default function ClienteForm({ open, onClose, onSave, cliente }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  // Buscar unidades disponíveis
  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  useEffect(() => {
    if (open) {
      if (cliente) {
        setFormData({
          ...initialFormData,
          ...cliente,
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [cliente, open]);

  const validarFormulario = () => {
    if (!formData.nome || !formData.nome.trim()) {
      setErro("Nome é obrigatório");
      return false;
    }

    if (!formData.cpf_cnpj || !formData.cpf_cnpj.trim()) {
      setErro("CPF/CNPJ é obrigatório");
      return false;
    }

    const cpfCnpjLimpo = removeMask(formData.cpf_cnpj);
    if (cpfCnpjLimpo.length === 11) {
      if (!validarCPF(formData.cpf_cnpj)) {
        setErro("CPF inválido");
        return false;
      }
    } else if (cpfCnpjLimpo.length === 14) {
      if (!validarCNPJ(formData.cpf_cnpj)) {
        setErro("CNPJ inválido");
        return false;
      }
    } else {
      setErro("CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos");
      return false;
    }

    // Basic address validation (can be enhanced in EnderecoForm or here if needed)
    if (!formData.cep || removeMask(formData.cep).length !== 8) {
      setErro("CEP inválido");
      return false;
    }
    if (!formData.logradouro.trim()) {
      setErro("Logradouro é obrigatório");
      return false;
    }
    if (!formData.numero.trim()) {
      setErro("Número do endereço é obrigatório");
      return false;
    }
    if (!formData.bairro.trim()) {
      setErro("Bairro é obrigatório");
      return false;
    }
    if (!formData.cidade.trim()) {
      setErro("Cidade é obrigatória");
      return false;
    }
    if (!formData.estado.trim() || formData.estado.trim().length !== 2) {
      setErro("Estado (UF) é obrigatório e deve ter 2 letras");
      return false;
    }


    return true;
  };

  // handleBuscarCEP and buscandoCep state are removed as EnderecoForm will handle this internally.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);

    if (!validarFormulario()) {
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      const mensagemErro = error.response?.data?.message || error.message || 'Erro ao salvar cliente';
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarMensagem = () => {
    if (cliente?.id) {
      window.open(`#/MensagensClientes?cliente_id=${cliente.id}`, '_blank');
    }
  };

  // Filtrar apenas unidades disponíveis ou a unidade já vinculada ao cliente
  const unidadesDisponiveis = unidades.filter(u =>
    u.status === 'disponivel' || (cliente && u.id === cliente.unidade_id)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {cliente ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            {cliente && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEnviarMensagem}
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Enviar Mensagem
              </Button>
            )}
          </div>
        </DialogHeader>

        {erro && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <p className="font-semibold">Erro ao salvar</p>
              <p className="text-sm mt-1">{erro}</p>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dados">
                <User className="w-4 h-4 mr-1" />
                Dados
              </TabsTrigger>
              <TabsTrigger value="endereco">
                <MapPin className="w-4 h-4 mr-1" />
                Endereço
              </TabsTrigger>
              <TabsTrigger value="filiacao">
                <Users className="w-4 h-4 mr-1" />
                Filiação
              </TabsTrigger>
              <TabsTrigger value="bancario">
                <CreditCard className="w-4 h-4 mr-1" />
                Bancário
              </TabsTrigger>
              <TabsTrigger value="imagens" disabled={!cliente?.id}>
                🖼️ Fotos
              </TabsTrigger>
            </TabsList>

            {/* ABA DADOS PESSOAIS */}
            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>CPF/CNPJ *</Label>
                  <InputMask
                    mask="cpfCnpj"
                    value={formData.cpf_cnpj}
                    onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>RG</Label>
                  <Input
                    value={formData.rg}
                    onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                    placeholder="Número do RG"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Telefone</Label>
                  <InputMask
                    mask="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Profissão</Label>
                  <Input
                    value={formData.profissao}
                    onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
                    placeholder="Ex: Empresário, Engenheiro..."
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Renda Mensal (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.renda_mensal}
                    onChange={(e) => setFormData({ ...formData, renda_mensal: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="unidade_id">Unidade Vinculada (Opcional)</Label>
                  <Select
                    value={formData.unidade_id}
                    onValueChange={(value) => setFormData({ ...formData, unidade_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma unidade (ou deixe em branco)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhuma</SelectItem>
                      {unidadesDisponiveis.map(uni => (
                        <SelectItem key={uni.id} value={uni.id}>
                          {uni.codigo} - {uni.tipo}
                          {uni.valor_venda > 0 && ` - R$ ${uni.valor_venda.toLocaleString('pt-BR')}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <Label>É inquilino (locatário)?</Label>
                    <Switch
                      checked={formData.eh_inquilino}
                      onCheckedChange={(checked) => setFormData({ ...formData, eh_inquilino: checked })}
                      disabled={loading}
                    />
                  </div>
                </div>

                {formData.eh_inquilino && (
                  <div>
                    <Label>Telefone de Emergência</Label>
                    <InputMask
                      mask="telefone"
                      value={formData.telefone_emergencia}
                      onChange={(e) => setFormData({ ...formData, telefone_emergencia: e.target.value })}
                      placeholder="(00) 00000-0000"
                      disabled={loading}
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <Label className="font-semibold text-blue-900">Tem acesso ao Portal do Cliente?</Label>
                      <p className="text-xs text-blue-700 mt-1">Cliente poderá acessar o portal online</p>
                    </div>
                    <Switch
                      checked={formData.tem_acesso_portal}
                      onCheckedChange={(checked) => setFormData({ ...formData, tem_acesso_portal: checked })}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ABA ENDEREÇO */}
            <TabsContent value="endereco" className="space-y-4 mt-4">
              <EnderecoForm
                endereco={{
                  tipo_logradouro: formData.tipo_logradouro,
                  logradouro: formData.logradouro,
                  numero: formData.numero,
                  complemento: formData.complemento,
                  referencia: formData.referencia,
                  bairro: formData.bairro,
                  cidade: formData.cidade,
                  estado: formData.estado,
                  cep: formData.cep,
                }}
                onChange={(enderecoData) => setFormData((prevData) => ({ ...prevData, ...enderecoData }))}
                prefix="cliente_"
              />
            </TabsContent>

            {/* ABA FILIAÇÃO */}
            <TabsContent value="filiacao" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Nome do Pai</Label>
                  <Input
                    value={formData.filiacao_pai}
                    onChange={(e) => setFormData({ ...formData, filiacao_pai: e.target.value })}
                    placeholder="Nome completo do pai"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Nome da Mãe</Label>
                  <Input
                    value={formData.filiacao_mae}
                    onChange={(e) => setFormData({ ...formData, filiacao_mae: e.target.value })}
                    placeholder="Nome completo da mãe"
                    disabled={loading}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ABA DADOS BANCÁRIOS */}
            <TabsContent value="bancario" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Banco</Label>
                  <Input
                    value={formData.banco}
                    onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                    placeholder="Ex: Banco do Brasil, Itaú..."
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Tipo de Conta</Label>
                  <Select
                    value={formData.tipo_conta}
                    onValueChange={(value) => setFormData({ ...formData, tipo_conta: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrente">Conta Corrente</SelectItem>
                      <SelectItem value="poupanca">Conta Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Agência</Label>
                  <Input
                    value={formData.agencia}
                    onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                    placeholder="0000"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Conta</Label>
                  <Input
                    value={formData.conta}
                    onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                    placeholder="00000-0"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2 border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">PIX</h3>
                </div>

                <div>
                  <Label>Tipo de Chave PIX</Label>
                  <Select
                    value={formData.tipo_pix}
                    onValueChange={(value) => setFormData({ ...formData, tipo_pix: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf_cnpj">CPF/CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="telefone">Telefone</SelectItem>
                      <SelectItem value="chave_aleatoria">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Chave PIX</Label>
                  <Input
                    value={formData.chave_pix}
                    onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                    placeholder="Informe a chave PIX"
                    disabled={loading}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="imagens" className="space-y-6 mt-4">
              <ImageUploader
                entidadeTipo="Cliente"
                entidadeId={cliente?.id}
                tiposPadrao={["principal", "galeria", "documentacao", "outros"]}
                onImageUploaded={() => {}}
              />

              <ImageGallery
                entidadeTipo="Cliente"
                entidadeId={cliente?.id}
                allowDelete={true}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                cliente ? "Atualizar" : "Criar Cliente"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}