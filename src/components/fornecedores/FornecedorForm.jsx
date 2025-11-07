
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputMask, validarCNPJ, removeMask, buscarCEP } from "@/components/ui/input-mask";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FornecedorForm({ open, onClose, onSave, fornecedor }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    razao_social: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    telefone: "",
    telefone_secundario: "",
    email: "",
    site: "",
    logradouro: "",
    numero: "",
    complemento: "",
    referencia: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    tipo_servico: "",
    vendedor_nome: "",
    vendedor_telefone: "",
    vendedor_email: "",
    forma_pagamento_preferencial: "pix",
    banco: "",
    agencia: "",
    conta: "",
    tipo_pix: "cpf_cnpj",
    chave_pix: "",
    observacoes: "",
  });
  const [buscandoCep, setBuscandoCep] = useState(false);

  useEffect(() => {
    if (fornecedor) {
      setFormData(fornecedor);
    } else {
      setFormData({
        nome: "",
        cnpj: "",
        razao_social: "",
        inscricao_estadual: "",
        inscricao_municipal: "",
        telefone: "",
        telefone_secundario: "",
        email: "",
        site: "",
        logradouro: "",
        numero: "",
        complemento: "",
        referencia: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
        tipo_servico: "",
        vendedor_nome: "",
        vendedor_telefone: "",
        vendedor_email: "",
        forma_pagamento_preferencial: "pix",
        banco: "",
        agencia: "",
        conta: "",
        tipo_pix: "cpf_cnpj",
        chave_pix: "",
        observacoes: "",
      });
    }
  }, [fornecedor, open]);

  const handleBuscarCEP = async (cep) => {
    const cepLimpo = removeMask(cep);
    if (cepLimpo.length === 8) {
      setBuscandoCep(true);
      const resultado = await buscarCEP(cep);
      setBuscandoCep(false);

      if (resultado && !resultado.erro) {
        setFormData((prevData) => ({
          ...prevData,
          cep,
          logradouro: resultado.logradouro || prevData.logradouro,
          bairro: resultado.bairro || prevData.bairro,
          cidade: resultado.localidade || prevData.cidade, // 'localidade' is the correct key for city from ViaCEP
          estado: resultado.uf ? resultado.uf.toUpperCase() : prevData.estado, // 'uf' is the correct key for state from ViaCEP
        }));
      } else {
        // Optionally, clear address fields or show an error if CEP not found/invalid
        console.warn("CEP não encontrado ou inválido", resultado);
        // setErro("CEP não encontrado ou inválido."); // If you want to show an error to the user
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);

    if (!formData.nome || !formData.nome.trim()) {
      setErro("Nome é obrigatório");
      return;
    }

    if (!formData.cnpj || !formData.cnpj.trim()) {
      setErro("CNPJ é obrigatório");
      return;
    }

    const cnpjLimpo = removeMask(formData.cnpj);
    if (cnpjLimpo.length !== 14) {
      setErro("CNPJ deve ter 14 dígitos");
      return;
    }

    if (!validarCNPJ(formData.cnpj)) {
      setErro("CNPJ inválido");
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      const mensagemErro = error.response?.data?.message || error.message || 'Erro ao salvar fornecedor';
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
            {fornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}
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
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do fornecedor"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label>CNPJ *</Label>
              <InputMask
                mask="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label>Razão Social</Label>
              <Input
                value={formData.razao_social}
                onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                placeholder="Razão social"
                disabled={loading}
              />
            </div>

            <div>
              <Label>Inscrição Estadual</Label>
              <InputMask
                mask="inscricaoEstadual"
                value={formData.inscricao_estadual}
                onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                placeholder="000.000.000.000"
                disabled={loading}
              />
            </div>

            <div>
              <Label>Inscrição Municipal</Label>
              <Input
                value={formData.inscricao_municipal}
                onChange={(e) => setFormData({ ...formData, inscricao_municipal: e.target.value })}
                placeholder="Inscrição municipal"
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
              <Label>Telefone Secundário</Label>
              <InputMask
                mask="telefone"
                value={formData.telefone_secundario}
                onChange={(e) => setFormData({ ...formData, telefone_secundario: e.target.value })}
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
              <Label>Site</Label>
              <Input
                value={formData.site}
                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                placeholder="https://www.exemplo.com"
                disabled={loading}
              />
            </div>

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
                disabled={loading}
              />
            </div>

            <div>
              <Label>Número</Label>
              <Input
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="Nº"
                disabled={loading}
              />
            </div>

            <div>
              <Label>Complemento</Label>
              <Input
                value={formData.complemento}
                onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                placeholder="Sala, Galpão, etc"
                disabled={loading}
              />
            </div>

            <div>
              <Label>Bairro</Label>
              <Input
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                placeholder="Bairro"
                disabled={loading}
              />
            </div>

            <div>
              <Label>Referência</Label>
              <Input
                value={formData.referencia}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                placeholder="Ponto de referência"
                disabled={loading}
              />
            </div>

            <div>
              <Label>Cidade</Label>
              <Input
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Cidade"
                disabled={loading}
              />
            </div>

            <div>
              <Label>Estado (UF)</Label>
              <Input
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                placeholder="UF"
                maxLength={2}
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2 pt-4 border-t">
              <h3 className="font-semibold text-gray-900 mb-4">Dados Bancários</h3>
            </div>

            <div>
              <Label>Banco</Label>
              <Input
                value={formData.banco}
                onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                placeholder="Nome do banco"
                disabled={loading}
              />
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

            <div>
              <Label>Chave PIX</Label>
              <Input
                value={formData.chave_pix}
                onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                placeholder="Chave PIX"
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações sobre o fornecedor"
                rows={3}
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
                fornecedor ? "Atualizar" : "Criar Fornecedor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
