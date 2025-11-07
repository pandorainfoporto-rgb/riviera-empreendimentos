
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputMask, validarCPF, validarCNPJ, removeMask, buscarCEP } from "@/components/ui/input-mask";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ClienteForm({ open, onClose, onSave, cliente }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    cpf_cnpj: "",
    eh_inquilino: false,
    telefone: "",
    telefone_emergencia: "",
    email: "",
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
      });
    } else {
      setFormData({
        nome: "",
        cpf_cnpj: "",
        eh_inquilino: false,
        telefone: "",
        telefone_emergencia: "",
        email: "",
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

    return true;
  };

  const handleBuscarCEP = async (cep) => {
    const cepLimpo = removeMask(cep);
    if (cepLimpo.length === 8) {
      setBuscandoCep(true);
      setErro(null); // Clear any previous error

      try {
        const resultado = await buscarCEP(cepLimpo);

        if (!resultado.erro) {
          setFormData((prevData) => ({
            ...prevData,
            cep, // Keep the masked CEP
            logradouro: resultado.logradouro || "",
            bairro: resultado.bairro || "",
            cidade: resultado.localidade || "", // 'localidade' is the correct property for city from viacep
            estado: resultado.uf || "",       // 'uf' is the correct property for state from viacep
          }));
        } else {
          setErro("CEP não encontrado ou inválido.");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        setErro("Erro ao buscar CEP. Verifique sua conexão ou tente novamente.");
      } finally {
        setBuscandoCep(false);
      }
    }
  };


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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cliente ? "Editar Cliente" : "Novo Cliente"}
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
              <h3 className="font-semibold text-gray-900 mb-4">Endereço</h3>
            </div>

            <div>
              <Label>CEP</Label>
              <InputMask
                mask="cep"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                onBlur={(e) => handleBuscarCEP(e.target.value)}
                placeholder="00000-000"
                disabled={loading || buscandoCep}
              />
              {buscandoCep && (
                <p className="text-xs text-blue-600 mt-1">Buscando CEP...</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label>Logradouro</Label>
              <Input
                value={formData.logradouro}
                onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                placeholder="Rua, Avenida, etc"
                disabled={loading || buscandoCep}
              />
            </div>

            <div>
              <Label>Número</Label>
              <Input
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="Nº"
                disabled={loading || buscandoCep}
              />
            </div>

            <div>
              <Label>Complemento</Label>
              <Input
                value={formData.complemento}
                onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                placeholder="Apto, Sala, etc"
                disabled={loading || buscandoCep}
              />
            </div>

            <div>
              <Label>Bairro</Label>
              <Input
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                placeholder="Bairro"
                disabled={loading || buscandoCep}
              />
            </div>

            <div>
              <Label>Referência</Label>
              <Input
                value={formData.referencia}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                placeholder="Ponto de referência"
                disabled={loading || buscandoCep}
              />
            </div>

            <div>
              <Label>Cidade</Label>
              <Input
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Cidade"
                disabled={loading || buscandoCep}
              />
            </div>

            <div>
              <Label>Estado (UF)</Label>
              <Input
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                placeholder="UF"
                maxLength={2}
                disabled={loading || buscandoCep}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading || buscandoCep}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || buscandoCep}
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
