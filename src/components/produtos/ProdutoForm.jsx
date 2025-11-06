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
  { value: "cimento_areia", label: "Cimento/Areia" },
  { value: "tijolos_blocos", label: "Tijolos/Blocos" },
  { value: "ferragens", label: "Ferragens" },
  { value: "madeiras", label: "Madeiras" },
  { value: "tintas", label: "Tintas" },
  { value: "hidraulica", label: "Hidráulica" },
  { value: "eletrica", label: "Elétrica" },
  { value: "acabamento", label: "Acabamento" },
  { value: "outros", label: "Outros" },
];

const unidades = [
  { value: "kg", label: "Kg" },
  { value: "saco", label: "Saco" },
  { value: "m", label: "Metro" },
  { value: "m2", label: "m²" },
  { value: "m3", label: "m³" },
  { value: "litro", label: "Litro" },
  { value: "unidade", label: "Unidade" },
  { value: "caixa", label: "Caixa" },
  { value: "barra", label: "Barra" },
  { value: "rolo", label: "Rolo" },
];

export default function ProdutoForm({ item, fornecedores, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    nome: "",
    descricao: "",
    categoria: "outros",
    unidade_medida: "unidade",
    valor_unitario: 0,
    estoque_minimo: 0,
    estoque_atual: 0,
    fornecedor_padrao_id: "",
    codigo_referencia: "",
    marca: "",
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
          {item ? "Editar Produto" : "Novo Produto"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Produto *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Cimento CP-II, Tijolo Cerâmico..."
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

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo_referencia">Código de Referência</Label>
              <Input
                id="codigo_referencia"
                value={formData.codigo_referencia}
                onChange={(e) => setFormData({ ...formData, codigo_referencia: e.target.value })}
                placeholder="COD-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                placeholder="Ex: Votorantim, Tigre..."
              />
            </div>

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
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição detalhada do produto..."
              rows={2}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
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
              <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
              <Input
                id="estoque_minimo"
                type="number"
                step="0.01"
                value={formData.estoque_minimo}
                onChange={(e) => setFormData({ ...formData, estoque_minimo: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estoque_atual">Estoque Atual</Label>
              <Input
                id="estoque_atual"
                type="number"
                step="0.01"
                value={formData.estoque_atual}
                onChange={(e) => setFormData({ ...formData, estoque_atual: parseFloat(e.target.value) || 0 })}
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
            <Label htmlFor="ativo" className="cursor-pointer">Produto ativo</Label>
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