import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save } from "lucide-react";

const categorias = [
  { value: "mao_de_obra", label: "Mão de Obra" },
  { value: "projeto", label: "Projeto" },
  { value: "consultoria", label: "Consultoria" },
  { value: "assessoria", label: "Assessoria" },
  { value: "manutencao", label: "Manutenção" },
  { value: "outros", label: "Outros" },
];

const unidades = [
  { value: "hora", label: "Hora" },
  { value: "dia", label: "Dia" },
  { value: "m2", label: "m²" },
  { value: "m3", label: "m³" },
  { value: "unidade", label: "Unidade" },
  { value: "servico", label: "Serviço" },
];

export default function ServicoForm({ item, fornecedores, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    nome: "",
    descricao: "",
    categoria: "mao_de_obra",
    unidade_medida: "servico",
    valor_unitario: 0,
    tempo_execucao: 0,
    fornecedor_padrao_id: "",
    ativo: true,
    observacoes: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="shadow-xl border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)]">
          {item ? "Editar Serviço" : "Novo Serviço"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Serviço *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Pedreiro, Eletricista..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição detalhada do serviço..."
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unidade_medida">Unidade de Medida *</Label>
              <Select
                value={formData.unidade_medida}
                onValueChange={(value) => setFormData({ ...formData, unidade_medida: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map(un => (
                    <SelectItem key={un.value} value={un.value}>
                      {un.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_unitario">Valor Unitário (R$)</Label>
              <Input
                id="valor_unitario"
                type="number"
                step="0.01"
                value={formData.valor_unitario}
                onChange={(e) => setFormData({ ...formData, valor_unitario: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tempo_execucao">Tempo de Execução (dias)</Label>
              <Input
                id="tempo_execucao"
                type="number"
                value={formData.tempo_execucao}
                onChange={(e) => setFormData({ ...formData, tempo_execucao: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fornecedor_padrao_id">Fornecedor Padrão</Label>
            <Select
              value={formData.fornecedor_padrao_id}
              onValueChange={(value) => setFormData({ ...formData, fornecedor_padrao_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um fornecedor..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Nenhum</SelectItem>
                {fornecedores.map(forn => (
                  <SelectItem key={forn.id} value={forn.id}>
                    {forn.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
            />
            <Label htmlFor="ativo" className="cursor-pointer">Serviço ativo</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isProcessing} className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]">
            <Save className="w-4 h-4 mr-2" />
            {isProcessing ? "Salvando..." : "Salvar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}