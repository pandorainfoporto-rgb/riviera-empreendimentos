
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Plus, Trash2, Briefcase } from "lucide-react";

// NEW IMPORTS
import { InputMask, validarCPF, validarCNPJ, removeMask, buscarCEP } from "@/components/ui/input-mask";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SocioForm({ open, onClose, onSave, socio, unidades }) {
  const [formData, setFormData] = useState(() => socio || {
    nome: "",
    cpf_cnpj: "",
    telefone: "",
    email: "",
    endereco: "",
    unidades: [],
    eh_fornecedor: false,
    tipo_servico_fornecedor: "outros",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);

  // Effect to update formData when the 'socio' prop changes (e.g., when editing a different socio)
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
        unidades: [],
        eh_fornecedor: false,
        tipo_servico_fornecedor: "outros",
      });
    }
    setErro(null); // Clear errors when socio changes or dialog opens
  }, [socio, open]);

  const handleBuscarCEP = async (cep) => {
    const cepLimpo = removeMask(cep);
    if (cepLimpo.length === 8) {
      setBuscandoCep(true);
      setErro(null); // Clear previous error for CEP
      try {
        const resultado = await buscarCEP(cepLimpo);

        if (!resultado.erro) {
          const enderecoCompleto = `${resultado.logradouro}, ${resultado.bairro}, ${resultado.localidade}/${resultado.uf}`;
          setFormData({
            ...formData,
            endereco: enderecoCompleto,
          });
        } else {
          setErro("CEP não encontrado ou inválido.");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        setErro("Erro ao buscar CEP. Tente novamente.");
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null); // Clear previous errors

    if (!formData.nome || !formData.nome.trim()) {
      setErro("Nome é obrigatório.");
      return;
    }

    if (!formData.cpf_cnpj || !formData.cpf_cnpj.trim()) {
      setErro("CPF/CNPJ é obrigatório.");
      return;
    }

    const cpfCnpjLimpo = removeMask(formData.cpf_cnpj);
    if (cpfCnpjLimpo.length === 11) {
      if (!validarCPF(formData.cpf_cnpj)) {
        setErro("CPF inválido.");
        return;
      }
    } else if (cpfCnpjLimpo.length === 14) {
      if (!validarCNPJ(formData.cpf_cnpj)) {
        setErro("CNPJ inválido.");
        return;
      }
    } else {
      setErro("CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos.");
      return;
    }

    // Validação: se for fornecedor, precisa ter pelo menos uma unidade
    if (formData.eh_fornecedor && (!formData.unidades || formData.unidades.length === 0)) {
      setErro("Para cadastrar como fornecedor, é necessário vincular pelo menos uma unidade.");
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

  const addUnidade = () => {
    setFormData({
      ...formData,
      unidades: [
        ...(formData.unidades || []),
        { unidade_id: "", percentual_participacao: 0, valor_investido: 0 }
      ]
    });
  };

  const removeUnidade = (index) => {
    setFormData({
      ...formData,
      unidades: formData.unidades.filter((_, i) => i !== index)
    });
  };

  const updateUnidade = (index, field, value) => {
    const newUnidades = [...formData.unidades];
    newUnidades[index] = {
      ...newUnidades[index],
      [field]: field === 'unidade_id' ? value : parseFloat(value)
    };
    setFormData({ ...formData, unidades: newUnidades });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--wine-700)]">
            {socio ? "Editar Sócio" : "Novo Sócio"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do sócio e suas participações nas unidades.
          </DialogDescription>
        </DialogHeader>

        {erro && (
          <Alert variant="destructive" className="my-4">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--wine-700)]">Dados Pessoais</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
                <InputMask
                  id="cpf_cnpj"
                  mask="cpfCnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <InputMask
                  id="telefone"
                  mask="telefone"
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

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, Número, Bairro, Cidade/Estado"
                  disabled={loading}
                />
                <div className="mt-2">
                  <Label>CEP (para busca automática)</Label>
                  <InputMask
                    mask="cep"
                    onBlur={(e) => handleBuscarCEP(e.target.value)}
                    placeholder="00000-000"
                    disabled={loading || buscandoCep}
                  />
                  {buscandoCep && (
                    <p className="text-xs text-blue-600 mt-1">Buscando CEP...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Participação em Unidades */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[var(--wine-700)]">Participação em Unidades</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addUnidade}
                className="hover:bg-[var(--wine-100)]"
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {formData.unidades && formData.unidades.length > 0 ? (
              <div className="space-y-4">
                {formData.unidades.map((uni, index) => (
                  <Card key={index} className="p-4 bg-gray-50">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2 md:col-span-3">
                        <Label>Unidade</Label>
                        <Select
                          value={uni.unidade_id}
                          onValueChange={(value) => updateUnidade(index, 'unidade_id', value)}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {unidades.map(u => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.codigo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Participação (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={uni.percentual_participacao}
                          onChange={(e) => updateUnidade(index, 'percentual_participacao', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor Investido (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={uni.valor_investido}
                          onChange={(e) => updateUnidade(index, 'valor_investido', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeUnidade(index)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nenhuma unidade adicionada</p>
            )}
          </div>

          {/* Fornecedor */}
          <div className="space-y-4 p-4 border-2 border-dashed border-[var(--grape-400)] rounded-lg bg-[var(--grape-50)]">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="eh_fornecedor"
                checked={formData.eh_fornecedor}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  eh_fornecedor: checked,
                  tipo_servico_fornecedor: checked ? (formData.tipo_servico_fornecedor || "outros") : "outros"
                })}
                disabled={loading}
              />
              <Label htmlFor="eh_fornecedor" className="cursor-pointer font-semibold">
                Também é Fornecedor
              </Label>
            </div>

            {formData.eh_fornecedor && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <strong>Cadastro Automático:</strong> Um fornecedor será criado automaticamente para cada unidade vinculada
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_servico_fornecedor">Tipo de Serviço *</Label>
                  <Select
                    value={formData.tipo_servico_fornecedor}
                    onValueChange={(value) => setFormData({ ...formData, tipo_servico_fornecedor: value })}
                    required
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
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

                {(!formData.unidades || formData.unidades.length === 0) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Adicione pelo menos uma unidade para cadastrar como fornecedor
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
            >
              <Save className="w-4 h-4 mr-2" />
              {socio ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
