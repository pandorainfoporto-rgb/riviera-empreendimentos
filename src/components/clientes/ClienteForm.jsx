
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputMask, validarCPF, validarCNPJ, removeMask, buscarCEP } from "@/components/ui/input-mask";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, MessageSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ImageUploader from "../imagens/ImageUploader";
import ImageGallery from "../imagens/ImageGallery";
import EnderecoForm from "../endereco/EnderecoForm";

export default function ClienteForm({ open, onClose, onSave, cliente }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  // buscandoCep state is removed as EnderecoForm will handle its own CEP loading
  const [formData, setFormData] = useState({
    nome: "",
    cpf_cnpj: "",
    eh_inquilino: false,
    telefone: "",
    telefone_emergencia: "",
    email: "",
    tipo_logradouro: "", // Added for EnderecoForm
    logradouro: "",
    numero: "",
    complemento: "",
    referencia: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    profissao: "",
    renda_mensal: 0,
    tem_acesso_portal: false,
    unidade_id: "",
  });

  // Buscar unidades disponíveis
  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  useEffect(() => {
    if (cliente) {
      setFormData({
        nome: cliente.nome || "",
        cpf_cnpj: cliente.cpf_cnpj || "",
        eh_inquilino: cliente.eh_inquilino || false,
        telefone: cliente.telefone || "",
        telefone_emergencia: cliente.telefone_emergencia || "",
        email: cliente.email || "",
        tipo_logradouro: cliente.tipo_logradouro || "", // Added for EnderecoForm
        logradouro: cliente.logradouro || "",
        numero: cliente.numero || "",
        complemento: cliente.complemento || "",
        referencia: cliente.referencia || "",
        bairro: cliente.bairro || "",
        cidade: cliente.cidade || "",
        estado: cliente.estado || "",
        cep: cliente.cep || "",
        profissao: cliente.profissao || "",
        renda_mensal: cliente.renda_mensal || 0,
        tem_acesso_portal: cliente.tem_acesso_portal || false,
        unidade_id: cliente.unidade_id || "",
      });
    } else {
      setFormData({
        nome: "",
        cpf_cnpj: "",
        eh_inquilino: false,
        telefone: "",
        telefone_emergencia: "",
        email: "",
        tipo_logradouro: "", // Added for EnderecoForm
        logradouro: "",
        numero: "",
        complemento: "",
        referencia: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
        profissao: "",
        renda_mensal: 0,
        tem_acesso_portal: false,
        unidade_id: "",
      });
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

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">📋 Dados</TabsTrigger>
            <TabsTrigger value="imagens" disabled={!cliente?.id}>
              🖼️ Fotos {!cliente?.id && "(Salve primeiro)"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                  <Label>Telefone</Label>
                  <InputMask
                    mask="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    disabled={loading}
                  />
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

                <div className={formData.eh_inquilino ? "" : "md:col-span-2"}>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
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
                  <p className="text-xs text-gray-500 mt-1">
                    💡 A unidade pode ser vinculada agora ou posteriormente através de uma negociação
                  </p>
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

                {formData.eh_inquilino && (
                  <>
                    <div>
                      <Label>Profissão</Label>
                      <Input
                        value={formData.profissao}
                        onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
                        placeholder="Profissão"
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
                  </>
                )}

                <div className="md:col-span-2 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">📍 Endereço</h3>
                </div>

                <div className="md:col-span-2">
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
                    prefix="cliente_" // Prefix for internal field names/ids if needed by EnderecoForm
                    disabled={loading}
                  />
                </div>
              </div>

              <DialogFooter>
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
      </DialogContent>
    </Dialog>
  );
}
