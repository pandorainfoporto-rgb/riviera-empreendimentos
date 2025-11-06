import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Plus, Trash2, Briefcase } from "lucide-react";

export default function SocioForm({ item, unidades, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    nome: "",
    cpf_cnpj: "",
    telefone: "",
    email: "",
    endereco: "",
    unidades: [],
    eh_fornecedor: false,
    tipo_servico_fornecedor: "outros",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validação: se for fornecedor, precisa ter pelo menos uma unidade
    if (formData.eh_fornecedor && (!formData.unidades || formData.unidades.length === 0)) {
      alert("Para cadastrar como fornecedor, é necessário vincular pelo menos uma unidade.");
      return;
    }

    onSubmit(formData);
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
    <Card className="shadow-xl border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)]">
          {item ? "Editar Sócio" : "Novo Sócio"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--wine-700)]">Dados Pessoais</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
                <Input
                  id="cpf_cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              />
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor Investido (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={uni.valor_investido}
                          onChange={(e) => updateUnidade(index, 'valor_investido', e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeUnidade(index)}
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
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isProcessing}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
          >
            <Save className="w-4 h-4 mr-2" />
            {item ? "Atualizar" : "Criar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}