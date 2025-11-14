
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputMask, validarCNPJ, removeMask } from "@/components/ui/input-mask"; // Removed buscarCEP
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EnderecoForm from "../endereco/EnderecoForm"; // New import

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
    // Address fields, now managed by EnderecoForm but still stored here
    tipo_logradouro: "", // Added as EnderecoForm might use it
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
  // buscandoCep state is no longer needed as EnderecoForm manages its own CEP search.

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
        tipo_logradouro: "", // Added
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

  // handleBuscarCEP is no longer needed here, it's handled internally by EnderecoForm.

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
              <h3 className="font-semibold text-gray-900 mb-4">📍 Endereço</h3>
            </div>

            {/* EnderecoForm component replaces all individual address fields */}
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
                prefix="fornecedor_"
                disabled={loading} // Pass loading state to disable EnderecoForm fields
              />
            </div>

            <div className="md:col-span-2 pt-4 border-t">
              <h3 className="font-semibold text-gray-900 mb-4">💳 Dados Bancários</h3>
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
