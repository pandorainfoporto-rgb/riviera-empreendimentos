import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputMask, validarCPF, validarCNPJ, removeMask } from "@/components/ui/input-mask";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle, User, MapPin, CreditCard, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnderecoForm from "../endereco/EnderecoForm";

const initialFormData = {
  nome: "",
  cpf_cnpj: "",
  rg: "",
  telefone: "",
  email: "",
  profissao: "",
  filiacao_pai: "",
  filiacao_mae: "",
  estado_civil: "",
  conjuge_nome: "",
  conjuge_cpf: "",
  conjuge_rg: "",
  conjuge_profissao: "",
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
};

export default function SocioForm({ open, onClose, onSave, socio }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (open) {
      setFormData(socio || initialFormData);
    }
  }, [socio, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);

    if (!formData.nome || !formData.nome.trim()) {
      setErro("Nome é obrigatório");
      return;
    }

    if (!formData.cpf_cnpj || !formData.cpf_cnpj.trim()) {
      setErro("CPF/CNPJ é obrigatório");
      return;
    }

    const cpfCnpjLimpo = removeMask(formData.cpf_cnpj);
    if (cpfCnpjLimpo.length === 11 && !validarCPF(formData.cpf_cnpj)) {
      setErro("CPF inválido");
      return;
    }
    if (cpfCnpjLimpo.length === 14 && !validarCNPJ(formData.cpf_cnpj)) {
      setErro("CNPJ inválido");
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar sócio:', error);
      const mensagemErro = error.response?.data?.message || error.message || 'Erro ao salvar sócio';
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  const estadoCivilOptions = [
    { value: "solteiro", label: "Solteiro(a)" },
    { value: "casado", label: "Casado(a)" },
    { value: "divorciado", label: "Divorciado(a)" },
    { value: "viuvo", label: "Viúvo(a)" },
    { value: "uniao_estavel", label: "União Estável" },
  ];

  const mostrarConjuge = formData.estado_civil === "casado" || formData.estado_civil === "uniao_estavel";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--wine-700)] flex items-center gap-2">
            <User className="w-5 h-5" />
            {socio ? "Editar Sócio" : "Novo Sócio"}
          </DialogTitle>
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dados">
                <User className="w-4 h-4 mr-1" />
                Dados
              </TabsTrigger>
              <TabsTrigger value="endereco">
                <MapPin className="w-4 h-4 mr-1" />
                Endereço
              </TabsTrigger>
              <TabsTrigger value="conjuge">
                <Users className="w-4 h-4 mr-1" />
                Cônjuge
              </TabsTrigger>
              <TabsTrigger value="bancario">
                <CreditCard className="w-4 h-4 mr-1" />
                Bancário
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
                    placeholder="Nome completo do sócio"
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
                  <Label>Estado Civil</Label>
                  <Select
                    value={formData.estado_civil}
                    onValueChange={(value) => setFormData({ ...formData, estado_civil: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {estadoCivilOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Filiação</h3>
                </div>

                <div>
                  <Label>Nome do Pai</Label>
                  <Input
                    value={formData.filiacao_pai}
                    onChange={(e) => setFormData({ ...formData, filiacao_pai: e.target.value })}
                    placeholder="Nome completo do pai"
                    disabled={loading}
                  />
                </div>

                <div>
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
                onChange={(enderecoData) => setFormData(prev => ({ ...prev, ...enderecoData }))}
                prefix="socio_"
              />
            </TabsContent>

            {/* ABA CÔNJUGE */}
            <TabsContent value="conjuge" className="space-y-4 mt-4">
              {!mostrarConjuge ? (
                <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 font-semibold">Dados do cônjuge não aplicáveis</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Selecione "Casado(a)" ou "União Estável" na aba Dados para preencher
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Nome do Cônjuge</Label>
                    <Input
                      value={formData.conjuge_nome}
                      onChange={(e) => setFormData({ ...formData, conjuge_nome: e.target.value })}
                      placeholder="Nome completo do cônjuge"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label>CPF do Cônjuge</Label>
                    <InputMask
                      mask="cpf"
                      value={formData.conjuge_cpf}
                      onChange={(e) => setFormData({ ...formData, conjuge_cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label>RG do Cônjuge</Label>
                    <Input
                      value={formData.conjuge_rg}
                      onChange={(e) => setFormData({ ...formData, conjuge_rg: e.target.value })}
                      placeholder="Número do RG"
                      disabled={loading}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Profissão do Cônjuge</Label>
                    <Input
                      value={formData.conjuge_profissao}
                      onChange={(e) => setFormData({ ...formData, conjuge_profissao: e.target.value })}
                      placeholder="Ex: Empresária, Médica..."
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
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
                socio ? "Atualizar" : "Criar Sócio"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}