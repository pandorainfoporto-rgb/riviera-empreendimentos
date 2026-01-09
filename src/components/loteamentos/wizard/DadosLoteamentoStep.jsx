import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EnderecoForm from "../../endereco/EnderecoForm";

export default function DadosLoteamentoStep({ data, onNext, onCancel }) {
  const [formData, setFormData] = useState(data);
  const [erro, setErro] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro(null);

    if (!formData.nome || !formData.nome.trim()) {
      setErro("Nome do loteamento é obrigatório");
      return;
    }

    if (!formData.cidade || !formData.estado) {
      setErro("Cidade e Estado são obrigatórios");
      return;
    }

    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {erro && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-800">{erro}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>Nome do Loteamento *</Label>
          <Input
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Ex: Jardim das Flores"
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label>Descrição</Label>
          <Textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Descreva o loteamento..."
            rows={3}
          />
        </div>

        <div>
          <Label>Área Total (m²)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.area_total}
            onChange={(e) => setFormData({ ...formData, area_total: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
          />
        </div>

        <div>
          <Label>Quantidade de Lotes</Label>
          <Input
            type="number"
            value={formData.quantidade_lotes}
            onChange={(e) => setFormData({ ...formData, quantidade_lotes: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>

        <div className="md:col-span-2 pt-4 border-t">
          <h3 className="font-semibold text-gray-900 mb-4">📍 Endereço do Loteamento</h3>
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
            onChange={(enderecoData) => setFormData({ ...formData, ...enderecoData })}
            prefix="loteamento_"
          />
        </div>

        <div className="md:col-span-2">
          <Label>Observações</Label>
          <Textarea
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]">
          Próximo: Upload DWG
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}