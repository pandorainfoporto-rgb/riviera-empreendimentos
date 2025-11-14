import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputMask, validarCPF, validarCNPJ, removeMask } from "@/components/ui/input-mask";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SocioForm({ open, onClose, onSave, socio }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    cpf_cnpj: "",
    telefone: "",
    email: "",
    endereco: "",
    eh_fornecedor: false,
    tipo_servico_fornecedor: "nao_aplicavel",
  });

  useEffect(() => {
    if (socio) {
      setFormData(socio);
    } else {
      setFormData({
        nome: "",
        cpf_cnpj: "",
        telefone: "",
        email: "",
        endereco: "",
        eh_fornecedor: false,
        tipo_servico_fornecedor: "nao_aplicavel",
      });
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

    if (formData.eh_fornecedor && formData.tipo_servico_fornecedor === "nao_aplicavel") {
      setErro("Selecione o tipo de serviço quando marcar como fornecedor");
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label>Telefone</Label>
              <InputMask
                mask="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
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
              <Label>Endereço</Label>
              <Textarea
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Endereço completo"
                rows={2}
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="eh_fornecedor"
                  checked={formData.eh_fornecedor}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    eh_fornecedor: checked,
                    tipo_servico_fornecedor: checked ? formData.tipo_servico_fornecedor : "nao_aplicavel"
                  })}
                  disabled={loading}
                />
                <Label htmlFor="eh_fornecedor" className="font-semibold text-blue-900 cursor-pointer">
                  Sócio também atua como Fornecedor
                </Label>
              </div>

              {formData.eh_fornecedor && (
                <div className="space-y-2 mt-3">
                  <Label>Tipo de Serviço *</Label>
                  <Select
                    value={formData.tipo_servico_fornecedor}
                    onValueChange={(value) => setFormData({ ...formData, tipo_servico_fornecedor: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="materiais">Materiais</SelectItem>
                      <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
                      <SelectItem value="equipamentos">Equipamentos</SelectItem>
                      <SelectItem value="servicos_especializados">Serviços Especializados</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                socio ? "Atualizar" : "Criar Sócio"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}