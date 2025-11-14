import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Save, Package, DollarSign, FileText, Wrench } from "lucide-react";

const tiposProduto = [
  { value: "comercio", label: "Comércio" },
  { value: "servico", label: "Serviço" },
  { value: "fabricacao", label: "Fabricação" },
  { value: "materia_prima", label: "Matéria Prima" },
  { value: "patrimonio", label: "Patrimônio" },
  { value: "consumo", label: "Consumo" },
];

const unidadesMedida = [
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
  { value: "hora", label: "Hora" },
  { value: "dia", label: "Dia" },
  { value: "servico", label: "Serviço" },
];

export default function ItemEstoqueForm({ item, fornecedores = [], onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    tipo_item: "produto",
    ativo: true,
    codigo: "",
    descricao: "",
    descricao_alternativa: "",
    tipo_produto: "comercio",
    controla_estoque: true,
    movimentacao: "ambos",
    subgrupo: "",
    unidade_padrao: "unidade",
    preco_base: 0,
    valor_ultima_compra: 0,
    custo_ultima_compra: 0,
    custo_medio_estoque: 0,
    custo_medio_total: 0,
    estoque_minimo: 0,
    estoque_maximo: 0,
    estoque_atual: 0,
    localizacao_estoque: "",
    fornecedor_padrao_id: "",
    codigo_referencia: "",
    codigo_barras: "",
    ncm: "",
    marca: "",
    modelo: "",
    peso_liquido: 0,
    peso_bruto: 0,
    dimensoes: { largura: 0, altura: 0, profundidade: 0, unidade: "cm" },
    tempo_execucao_dias: 0,
    garantia_meses: 0,
    validade_dias: 0,
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
          {item ? "Editar Item" : "Novo Item de Estoque"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Tabs defaultValue="definicoes" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="definicoes">
                <Package className="w-4 h-4 mr-2" />
                Definições
              </TabsTrigger>
              <TabsTrigger value="precos">
                <DollarSign className="w-4 h-4 mr-2" />
                Preços
              </TabsTrigger>
              <TabsTrigger value="estoque">
                <FileText className="w-4 h-4 mr-2" />
                Estoque
              </TabsTrigger>
              <TabsTrigger value="especificacoes">
                <Wrench className="w-4 h-4 mr-2" />
                Especificações
              </TabsTrigger>
            </TabsList>

            {/* ABA DEFINIÇÕES */}
            <TabsContent value="definicoes" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Item *</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="produto"
                        checked={formData.tipo_item === "produto"}
                        onChange={(e) => setFormData({ ...formData, tipo_item: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span>Produto</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="servico"
                        checked={formData.tipo_item === "servico"}
                        onChange={(e) => setFormData({ ...formData, tipo_item: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span>Serviço</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="true"
                        checked={formData.ativo === true}
                        onChange={() => setFormData({ ...formData, ativo: true })}
                        className="w-4 h-4"
                      />
                      <span>Ativo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="false"
                        checked={formData.ativo === false}
                        onChange={() => setFormData({ ...formData, ativo: false })}
                        className="w-4 h-4"
                      />
                      <span>Inativo</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo">Código/ID</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="ID-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição do {formData.tipo_item === "produto" ? "Produto" : "Serviço"} *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição principal..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao_alternativa">Descrição Alternativa</Label>
                <Input
                  id="descricao_alternativa"
                  value={formData.descricao_alternativa}
                  onChange={(e) => setFormData({ ...formData, descricao_alternativa: e.target.value })}
                  placeholder="Descrição alternativa..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_produto">Tipo *</Label>
                  <Select
                    value={formData.tipo_produto}
                    onValueChange={(value) => setFormData({ ...formData, tipo_produto: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposProduto.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subgrupo">Subgrupo de Produtos</Label>
                  <Input
                    id="subgrupo"
                    value={formData.subgrupo}
                    onChange={(e) => setFormData({ ...formData, subgrupo: e.target.value })}
                    placeholder="Ex: Ferragens, Hidráulica..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Controla Estoque?</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.controla_estoque === true}
                      onChange={() => setFormData({ ...formData, controla_estoque: true })}
                      className="w-4 h-4"
                    />
                    <span>Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.controla_estoque === false}
                      onChange={() => setFormData({ ...formData, controla_estoque: false })}
                      className="w-4 h-4"
                    />
                    <span>Não</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Movimentação</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="compra"
                      checked={formData.movimentacao === "compra"}
                      onChange={(e) => setFormData({ ...formData, movimentacao: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span>Compra</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="venda"
                      checked={formData.movimentacao === "venda"}
                      onChange={(e) => setFormData({ ...formData, movimentacao: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span>Venda</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="ambos"
                      checked={formData.movimentacao === "ambos"}
                      onChange={(e) => setFormData({ ...formData, movimentacao: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span>Ambos</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidade_padrao">Unidade Padrão *</Label>
                <Select
                  value={formData.unidade_padrao}
                  onValueChange={(value) => setFormData({ ...formData, unidade_padrao: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesMedida.map(un => (
                      <SelectItem key={un.value} value={un.value}>
                        {un.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fornecedor_padrao_id">Fornecedor Padrão</Label>
                <Select
                  value={formData.fornecedor_padrao_id}
                  onValueChange={(value) => setFormData({ ...formData, fornecedor_padrao_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
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
            </TabsContent>

            {/* ABA PREÇOS */}
            <TabsContent value="precos" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco_base">Preço Base (R$)</Label>
                  <Input
                    id="preco_base"
                    type="number"
                    step="0.01"
                    value={formData.preco_base}
                    onChange={(e) => setFormData({ ...formData, preco_base: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_ultima_compra">Valor da Última Compra (R$)</Label>
                  <Input
                    id="valor_ultima_compra"
                    type="number"
                    step="0.01"
                    value={formData.valor_ultima_compra}
                    onChange={(e) => setFormData({ ...formData, valor_ultima_compra: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_ultima_compra">Custo da Última Compra (R$)</Label>
                  <Input
                    id="custo_ultima_compra"
                    type="number"
                    step="0.01"
                    value={formData.custo_ultima_compra}
                    onChange={(e) => setFormData({ ...formData, custo_ultima_compra: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_medio_estoque">Custo Médio Estoque (R$)</Label>
                  <Input
                    id="custo_medio_estoque"
                    type="number"
                    step="0.01"
                    value={formData.custo_medio_estoque}
                    onChange={(e) => setFormData({ ...formData, custo_medio_estoque: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_medio_total">Custo Médio Total (R$)</Label>
                  <Input
                    id="custo_medio_total"
                    type="number"
                    step="0.01"
                    value={formData.custo_medio_total}
                    onChange={(e) => setFormData({ ...formData, custo_medio_total: parseFloat(e.target.value) || 0 })}
                    className="bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </TabsContent>

            {/* ABA ESTOQUE */}
            <TabsContent value="estoque" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                  <Input
                    id="estoque_minimo"
                    type="number"
                    step="0.01"
                    value={formData.estoque_minimo}
                    onChange={(e) => setFormData({ ...formData, estoque_minimo: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estoque_maximo">Estoque Máximo</Label>
                  <Input
                    id="estoque_maximo"
                    type="number"
                    step="0.01"
                    value={formData.estoque_maximo}
                    onChange={(e) => setFormData({ ...formData, estoque_maximo: parseFloat(e.target.value) || 0 })}
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
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="localizacao_estoque">Localização no Estoque</Label>
                <Input
                  id="localizacao_estoque"
                  value={formData.localizacao_estoque}
                  onChange={(e) => setFormData({ ...formData, localizacao_estoque: e.target.value })}
                  placeholder="Ex: Prateleira A3, Galpão 2..."
                />
              </div>
            </TabsContent>

            {/* ABA ESPECIFICAÇÕES */}
            <TabsContent value="especificacoes" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo_referencia">Código de Referência</Label>
                  <Input
                    id="codigo_referencia"
                    value={formData.codigo_referencia}
                    onChange={(e) => setFormData({ ...formData, codigo_referencia: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo_barras">Código de Barras</Label>
                  <Input
                    id="codigo_barras"
                    value={formData.codigo_barras}
                    onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ncm">NCM</Label>
                  <Input
                    id="ncm"
                    value={formData.ncm}
                    onChange={(e) => setFormData({ ...formData, ncm: e.target.value })}
                    placeholder="0000.00.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="peso_liquido">Peso Líquido (Kg)</Label>
                  <Input
                    id="peso_liquido"
                    type="number"
                    step="0.001"
                    value={formData.peso_liquido}
                    onChange={(e) => setFormData({ ...formData, peso_liquido: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="peso_bruto">Peso Bruto (Kg)</Label>
                  <Input
                    id="peso_bruto"
                    type="number"
                    step="0.001"
                    value={formData.peso_bruto}
                    onChange={(e) => setFormData({ ...formData, peso_bruto: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="garantia_meses">Garantia (Meses)</Label>
                  <Input
                    id="garantia_meses"
                    type="number"
                    value={formData.garantia_meses}
                    onChange={(e) => setFormData({ ...formData, garantia_meses: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validade_dias">Validade (Dias)</Label>
                  <Input
                    id="validade_dias"
                    type="number"
                    value={formData.validade_dias}
                    onChange={(e) => setFormData({ ...formData, validade_dias: parseInt(e.target.value) || 0 })}
                  />
                </div>

                {formData.tipo_item === "servico" && (
                  <div className="space-y-2">
                    <Label htmlFor="tempo_execucao_dias">Tempo de Execução (Dias)</Label>
                    <Input
                      id="tempo_execucao_dias"
                      type="number"
                      value={formData.tempo_execucao_dias}
                      onChange={(e) => setFormData({ ...formData, tempo_execucao_dias: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Dimensões (cm)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Largura"
                    value={formData.dimensoes?.largura || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensoes: { ...formData.dimensoes, largura: parseFloat(e.target.value) || 0 }
                    })}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Altura"
                    value={formData.dimensoes?.altura || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensoes: { ...formData.dimensoes, altura: parseFloat(e.target.value) || 0 }
                    })}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Profundidade"
                    value={formData.dimensoes?.profundidade || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensoes: { ...formData.dimensoes, profundidade: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>
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