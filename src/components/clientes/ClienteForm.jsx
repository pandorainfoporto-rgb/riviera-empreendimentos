import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ClienteForm({ item, unidades, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    nome: "",
    cpf_cnpj: "",
    telefone: "",
    email: "",
    logradouro: "",
    numero: "",
    complemento: "",
    referencia: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    eh_cliente_externo_consorcio: false,
    unidade_id: "",
    valor_contrato: "",
    data_contrato: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.cpf_cnpj) {
      alert("Nome e CPF/CNPJ são obrigatórios");
      return;
    }

    if (!formData.eh_cliente_externo_consorcio && !formData.unidade_id) {
      alert("Para clientes de obra é necessário selecionar uma unidade");
      return;
    }
    
    const dataToSubmit = {
      ...formData,
      valor_contrato: formData.valor_contrato ? parseFloat(formData.valor_contrato) : null,
      unidade_id: formData.unidade_id || null,
      data_contrato: formData.data_contrato || null,
    };
    
    onSubmit(dataToSubmit);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item ? "Editar Cliente" : "Novo Cliente"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Nome Completo *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>CPF/CNPJ *</Label>
              <Input
                value={formData.cpf_cnpj}
                onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Endereço</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label>Logradouro</Label>
                <Input
                  value={formData.logradouro}
                  onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                  placeholder="Rua, Avenida..."
                />
              </div>

              <div>
                <Label>Número</Label>
                <Input
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                />
              </div>

              <div>
                <Label>CEP</Label>
                <Input
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  placeholder="00000-000"
                />
              </div>

              <div>
                <Label>Complemento</Label>
                <Input
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  placeholder="Apto, Bloco..."
                />
              </div>

              <div>
                <Label>Bairro</Label>
                <Input
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                />
              </div>

              <div>
                <Label>Cidade</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                />
              </div>

              <div>
                <Label>Estado (UF)</Label>
                <Input
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <Label>Referência</Label>
              <Input
                value={formData.referencia}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                placeholder="Ponto de referência..."
              />
            </div>
          </div>

          {/* Unidade e Contrato */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.eh_cliente_externo_consorcio}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, eh_cliente_externo_consorcio: checked })
                }
              />
              <Label>Cliente externo (apenas consórcio, sem unidade)</Label>
            </div>

            {!formData.eh_cliente_externo_consorcio && (
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Unidade</Label>
                  <Select
                    value={formData.unidade_id}
                    onValueChange={(value) => setFormData({ ...formData, unidade_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.codigo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Valor do Contrato</Label>
                  <Input
                    type="number"
                    value={formData.valor_contrato}
                    onChange={(e) => setFormData({ ...formData, valor_contrato: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Data do Contrato</Label>
                  <Input
                    type="date"
                    value={formData.data_contrato}
                    onChange={(e) => setFormData({ ...formData, data_contrato: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
              disabled={isProcessing}
            >
              {isProcessing ? 'Salvando...' : (item ? 'Atualizar' : 'Criar Cliente')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}