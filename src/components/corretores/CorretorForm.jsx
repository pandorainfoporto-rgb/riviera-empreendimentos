
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, User, MapPin, CreditCard, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InputMask, validarCPF, removeMask, buscarCEP } from "@/components/ui/input-mask";

export default function CorretorForm({ open, onClose, onSave, corretor, imobiliarias }) {
  const [formData, setFormData] = useState(corretor || {
    nome: "",
    cpf: "",
    creci: "",
    imobiliaria_id: "",
    telefone: "",
    email: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    percentual_comissao_padrao: 3,
    banco: "",
    agencia: "",
    conta: "",
    pix: "",
    ativo: true,
    observacoes: "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false); // New state for CEP search loading

  // Effect to reset form data and errors when the dialog opens or corretor changes
  useEffect(() => {
    if (open) {
      setFormData(corretor || {
        nome: "",
        cpf: "",
        creci: "",
        imobiliaria_id: "",
        telefone: "",
        email: "",
        endereco: "",
        cidade: "",
        estado: "",
        cep: "",
        percentual_comissao_padrao: 3,
        banco: "",
        agencia: "",
        conta: "",
        pix: "",
        ativo: true,
        observacoes: "",
      });
      setErro(null);
    }
  }, [open, corretor]);

  const handleBuscarCEP = async (e) => {
    const cepValue = e.target.value;
    const cepLimpo = removeMask(cepValue);

    if (cepLimpo.length === 8) {
      setBuscandoCep(true);
      try {
        const resultado = await buscarCEP(cepLimpo); // Assumes buscarCEP takes unmasked CEP

        if (resultado && !resultado.erro) {
          setFormData((prevData) => ({
            ...prevData,
            endereco: `${resultado.logradouro || ''}${resultado.bairro ? `, ${resultado.bairro}` : ''}`,
            cidade: resultado.localidade || '',
            estado: resultado.uf || '',
            // Keep the cep field as the user typed it or update with the found one if necessary
          }));
        } else {
          console.warn("CEP não encontrado ou inválido:", cepLimpo);
          // Optionally clear related fields if CEP is not found
          setFormData((prevData) => ({
            ...prevData,
            endereco: '',
            cidade: '',
            estado: '',
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        // Handle network errors, etc.
      } finally {
        setBuscandoCep(false);
      }
    } else if (cepLimpo.length > 0 && cepLimpo.length < 8) {
      // If CEP is incomplete or cleared, also clear address fields
       setFormData((prevData) => ({
          ...prevData,
          endereco: '',
          cidade: '',
          estado: '',
      }));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);

    // Validation checks
    if (!formData.nome || !formData.nome.trim()) {
      setErro("Nome é obrigatório");
      return;
    }

    if (!formData.cpf || !formData.cpf.trim()) {
      setErro("CPF é obrigatório");
      return;
    }

    const cpfLimpo = removeMask(formData.cpf);
    if (cpfLimpo.length !== 11) {
      setErro("CPF deve ter 11 dígitos");
      return;
    }

    if (!validarCPF(formData.cpf)) {
      setErro("CPF inválido");
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar corretor:', error);
      setErro(error.message || 'Erro ao salvar corretor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--wine-700)] flex items-center gap-2">
            <User className="w-5 h-5" />
            {corretor ? "Editar Corretor" : "Novo Corretor"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do corretor para adicionar ou editar o registro.
          </DialogDescription>
        </DialogHeader>

        {/* Display error message if any */}
        {erro && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
              <TabsTrigger value="contato">Contato</TabsTrigger>
              <TabsTrigger value="pagamento">Comissões</TabsTrigger>
            </TabsList>

            {/* ABA DADOS GERAIS */}
            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <InputMask
                    mask="cpf"
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creci">CRECI</Label>
                  <Input
                    id="creci"
                    value={formData.creci}
                    onChange={(e) => setFormData({ ...formData, creci: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imobiliaria_id">Imobiliária</Label>
                  <Select
                    value={formData.imobiliaria_id}
                    onValueChange={(value) => setFormData({ ...formData, imobiliaria_id: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma imobiliária" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhuma (Autônomo)</SelectItem>
                      {imobiliarias.filter(i => i.ativa).map(imob => (
                        <SelectItem key={imob.id} value={imob.id}>
                          {imob.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  disabled={loading}
                />
                <Label htmlFor="ativo" className="cursor-pointer">Corretor Ativo</Label>
              </div>
            </TabsContent>

            {/* ABA CONTATO */}
            <TabsContent value="contato" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <InputMask
                    mask="telefone"
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Endereço
                </h3>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <InputMask
                        mask="cep"
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                        onBlur={handleBuscarCEP} // Added onBlur for CEP search
                        placeholder="00000-000"
                        disabled={loading || buscandoCep} // Disabled during CEP search
                      />
                      {buscandoCep && (
                        <p className="text-xs text-blue-600 mt-1">Buscando CEP...</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                        disabled={loading || buscandoCep} // Also disabled if CEP is being searched
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado (UF)</Label>
                      <Input
                        id="estado"
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        maxLength={2}
                        disabled={loading || buscandoCep} // Also disabled if CEP is being searched
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço Completo</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      disabled={loading || buscandoCep} // Also disabled if CEP is being searched
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ABA COMISSÕES E PAGAMENTO */}
            <TabsContent value="pagamento" className="space-y-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Importante:</strong> Defina o percentual padrão de comissão e dados para pagamento.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentual_comissao_padrao">Percentual de Comissão Padrão (%)</Label>
                <Input
                  id="percentual_comissao_padrao"
                  type="number"
                  step="0.01"
                  value={formData.percentual_comissao_padrao}
                  onChange={(e) => setFormData({ ...formData, percentual_comissao_padrao: parseFloat(e.target.value) || 0 })}
                  placeholder="Ex: 3"
                  disabled={loading}
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Dados Bancários
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="banco">Banco</Label>
                    <Input
                      id="banco"
                      value={formData.banco}
                      onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agencia">Agência</Label>
                    <Input
                      id="agencia"
                      value={formData.agencia}
                      onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conta">Conta</Label>
                    <Input
                      id="conta"
                      value={formData.conta}
                      onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="pix">Chave PIX</Label>
                  <Input
                    id="pix"
                    value={formData.pix}
                    onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="flex justify-end gap-3 bg-gray-50 px-6 py-4 -mx-6 -mb-6 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || buscandoCep} // Disable save button during CEP search
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
