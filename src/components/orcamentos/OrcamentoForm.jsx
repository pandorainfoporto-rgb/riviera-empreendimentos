import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

const categorias = [
  { value: "pagamento_consorcio", label: "Pagamento Consórcio" },
  { value: "juros_consorcio", label: "Juros Consórcio" },
  { value: "multa_consorcio", label: "Multa Consórcio" },
  { value: "pagamento_fornecedor", label: "Pagamento Fornecedor" },
  { value: "investimento", label: "Investimento" },
  { value: "marketing", label: "Marketing" },
  { value: "operacional", label: "Operacional" },
  { value: "materiais_construcao", label: "Materiais de Construção" },
  { value: "mao_de_obra", label: "Mão de Obra" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "servicos_especializados", label: "Serviços Especializados" },
  { value: "impostos_taxas", label: "Impostos e Taxas" },
  { value: "administrativo", label: "Administrativo" },
  { value: "outros", label: "Outros" },
];

export default function OrcamentoForm({ item, loteamentos, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    mes_referencia: new Date().toISOString().slice(0, 7),
    loteamento_id: "",
    categoria: "materiais_construcao",
    valor_orcado: 0,
    limite_alerta_percentual: 80,
    observacoes: "",
    ativo: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="shadow-xl border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)]">
          {item ? "Editar Orçamento" : "Novo Orçamento"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mes_referencia">Mês de Referência *</Label>
              <Input
                id="mes_referencia"
                type="month"
                value={formData.mes_referencia}
                onChange={(e) => setFormData({ ...formData, mes_referencia: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loteamento_id">Loteamento (Opcional)</Label>
              <Select
                value={formData.loteamento_id}
                onValueChange={(value) => setFormData({ ...formData, loteamento_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Geral (Todos)</SelectItem>
                  {loteamentos.map(lot => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria de Despesa *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_orcado">Valor Orçado *</Label>
              <Input
                id="valor_orcado"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_orcado}
                onChange={(e) => setFormData({ ...formData, valor_orcado: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limite_alerta_percentual">
              Limite de Alerta (%) *
              <span className="text-sm text-gray-500 ml-2">
                Alerta quando gastos atingirem este percentual
              </span>
            </Label>
            <Input
              id="limite_alerta_percentual"
              type="number"
              min="1"
              max="100"
              value={formData.limite_alerta_percentual}
              onChange={(e) => setFormData({ ...formData, limite_alerta_percentual: parseInt(e.target.value) || 80 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
              placeholder="Observações sobre este orçamento..."
            />
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