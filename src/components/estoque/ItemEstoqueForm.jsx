import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Save, Package, DollarSign, FileText, Wrench, Users, Image as ImageIcon, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import ImageUploader from "../imagens/ImageUploader";
import ImageGallery from "../imagens/ImageGallery";

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
    grupo_id: "",
    subgrupo_id: "",
    almoxarifado_id: "",
    tipo_produto: "comercio",
    controla_estoque: true,
    movimentacao: "ambos",
    unidade_padrao: "unidade",
    preco_venda: 0,
    preco_base: 0,
    valor_ultima_compra: 0,
    custo_ultima_compra: 0,
    custo_medio_estoque: 0,
    custo_medio_total: 0,
    margem_lucro_percentual: 0,
    estoque_minimo: 0,
    estoque_maximo: 0,
    estoque_atual: 0,
    localizacao_estoque: "",
    fornecedor_padrao_id: "",
    fornecedores_disponiveis: [],
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

  const { data: grupos = [] } = useQuery({
    queryKey: ['gruposEstoque'],
    queryFn: () => base44.entities.GrupoEstoque.list(),
  });

  const { data: subgrupos = [] } = useQuery({
    queryKey: ['subgruposEstoque'],
    queryFn: () => base44.entities.SubGrupoEstoque.list(),
  });

  const { data: almoxarifados = [] } = useQuery({
    queryKey: ['almoxarifados'],
    queryFn: () => base44.entities.Almoxarifado.list(),
  });

  const subgruposFiltrados = subgrupos.filter(sg => sg.grupo_id === formData.grupo_id);

  // Calcular margem de lucro
  useEffect(() => {
    const custoBase = formData.custo_medio_total || formData.custo_ultima_compra || 0;
    if (custoBase > 0 && formData.preco_venda > 0) {
      const margem = ((formData.preco_venda - custoBase) / custoBase) * 100;
      setFormData(prev => ({ ...prev, margem_lucro_percentual: margem }));
    } else {
      setFormData(prev => ({ ...prev, margem_lucro_percentual: 0 }));
    }
  }, [formData.preco_venda, formData.custo_medio_total, formData.custo_ultima_compra]);

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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="definicoes">
                <Package className="w-4 h-4 mr-1" />
                Definições
              </TabsTrigger>
              <TabsTrigger value="fornecedores">
                <Users className="w-4 h-4 mr-1" />
                Fornecedores
              </TabsTrigger>
              <TabsTrigger value="precos">
                <DollarSign className="w-4 h-4 mr-1" />
                Preços
              </TabsTrigger>
              <TabsTrigger value="estoque">
                <FileText className="w-4 h-4 mr-1" />
                Estoque
              </TabsTrigger>
              <TabsTrigger value="imagens" disabled={!item?.id}>
                <ImageIcon className="w-4 h-4 mr-1" />
                Imagens
              </TabsTrigger>
              <TabsTrigger value="especificacoes">
                <Wrench className="w-4 h-4 mr-1" />
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

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grupo_id">Grupo</Label>
                  <Select
                    value={formData.grupo_id}
                    onValueChange={(value) => setFormData({ ...formData, grupo_id: value, subgrupo_id: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhum</SelectItem>
                      {grupos.map(grupo => (
                        <SelectItem key={grupo.id} value={grupo.id}>
                          {grupo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subgrupo_id">Subgrupo</Label>
                  <Select
                    value={formData.subgrupo_id}
                    onValueChange={(value) => setFormData({ ...formData, subgrupo_id: value })}
                    disabled={!formData.grupo_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.grupo_id ? "Selecione..." : "Escolha um grupo primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhum</SelectItem>
                      {subgruposFiltrados.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="almoxarifado_id">Almoxarifado</Label>
                  <Select
                    value={formData.almoxarifado_id}
                    onValueChange={(value) => setFormData({ ...formData, almoxarifado_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhum</SelectItem>
                      {almoxarifados.map(alm => (
                        <SelectItem key={alm.id} value={alm.id}>
                          {alm.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

            {/* ABA FORNECEDORES */}
            <TabsContent value="fornecedores" className="space-y-4 mt-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-semibold mb-2">📋 Fornecedores Disponíveis</p>
                <p className="text-xs text-blue-700">
                  Esta lista é atualizada automaticamente conforme você realiza compras. 
                  Os preços e dados são atualizados a cada nova compra registrada.
                </p>
              </div>

              {formData.fornecedores_disponiveis && formData.fornecedores_disponiveis.length > 0 ? (
                <div className="space-y-3">
                  {formData.fornecedores_disponiveis.map((forn, idx) => {
                    const fornecedorData = fornecedores.find(f => f.id === forn.fornecedor_id);
                    return (
                      <Card key={idx} className="border-l-4 border-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-gray-900">{fornecedorData?.nome || "Fornecedor"}</h4>
                              {forn.codigo_produto_fornecedor && (
                                <p className="text-sm text-gray-600">Código: {forn.codigo_produto_fornecedor}</p>
                              )}
                            </div>
                            {forn.eh_preferencial && (
                              <Badge className="bg-yellow-500 text-white">Preferencial</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Preço:</span>
                              <p className="font-semibold">R$ {forn.preco_unitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            {forn.prazo_entrega_dias > 0 && (
                              <div>
                                <span className="text-gray-600">Prazo:</span>
                                <p className="font-semibold">{forn.prazo_entrega_dias} dias</p>
                              </div>
                            )}
                            {forn.quantidade_minima > 0 && (
                              <div>
                                <span className="text-gray-600">Qtd Mín:</span>
                                <p className="font-semibold">{forn.quantidade_minima}</p>
                              </div>
                            )}
                            {forn.ultima_compra_data && (
                              <div>
                                <span className="text-gray-600">Última Compra:</span>
                                <p className="font-semibold">{new Date(forn.ultima_compra_data).toLocaleDateString('pt-BR')}</p>
                              </div>
                            )}
                          </div>
                          {forn.observacoes && (
                            <p className="text-xs text-gray-600 mt-2">{forn.observacoes}</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">Nenhum fornecedor registrado ainda</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Quando você realizar compras, os fornecedores aparecerão aqui automaticamente
                  </p>
                </div>
              )}
            </TabsContent>

            {/* ABA PREÇOS */}
            <TabsContent value="precos" className="space-y-4 mt-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-900 font-semibold mb-1">💰 Preço de Venda</p>
                    <p className="text-xs text-green-700">
                      Este é o único preço que você pode editar. Os demais são calculados automaticamente.
                    </p>
                  </div>
                  {formData.margem_lucro_percentual !== 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Margem de Lucro</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`w-5 h-5 ${formData.margem_lucro_percentual > 0 ? 'text-green-600' : 'text-red-600'}`} />
                        <p className={`text-2xl font-bold ${formData.margem_lucro_percentual > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formData.margem_lucro_percentual.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preco_venda">Preço de Venda (R$) *</Label>
                <Input
                  id="preco_venda"
                  type="number"
                  step="0.01"
                  value={formData.preco_venda}
                  onChange={(e) => setFormData({ ...formData, preco_venda: parseFloat(e.target.value) || 0 })}
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-gray-500">Este preço será usado nas operações de venda</p>
              </div>

              <div className="h-px bg-gray-300 my-6"></div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                <p className="text-sm text-amber-900 font-semibold mb-2">⚠️ Campos Calculados Automaticamente</p>
                <p className="text-xs text-amber-700">
                  Os campos abaixo são calculados automaticamente com base nas compras realizadas.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco_base">Preço Base (R$)</Label>
                  <Input
                    id="preco_base"
                    type="number"
                    step="0.01"
                    value={formData.preco_base}
                    className="bg-gray-100 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-gray-500">Calculado automaticamente</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_ultima_compra">Valor da Última Compra (R$)</Label>
                  <Input
                    id="valor_ultima_compra"
                    type="number"
                    step="0.01"
                    value={formData.valor_ultima_compra}
                    className="bg-gray-100 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-gray-500">Atualizado pelas compras</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_ultima_compra">Custo da Última Compra (R$)</Label>
                  <Input
                    id="custo_ultima_compra"
                    type="number"
                    step="0.01"
                    value={formData.custo_ultima_compra}
                    className="bg-gray-100 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-gray-500">Atualizado pelas compras</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_medio_estoque">Custo Médio Estoque (R$)</Label>
                  <Input
                    id="custo_medio_estoque"
                    type="number"
                    step="0.01"
                    value={formData.custo_medio_estoque}
                    className="bg-gray-100 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-gray-500">Calculado automaticamente</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_medio_total">Custo Médio Total (R$)</Label>
                  <Input
                    id="custo_medio_total"
                    type="number"
                    step="0.01"
                    value={formData.custo_medio_total}
                    className="bg-gray-100 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-gray-500">Calculado automaticamente</p>
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
                  <p className="text-xs text-gray-500">Quantidade mínima para alertas</p>
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
                  <p className="text-xs text-gray-500">Quantidade máxima recomendada</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estoque_atual">Estoque Atual</Label>
                  <Input
                    id="estoque_atual"
                    type="number"
                    step="0.01"
                    value={formData.estoque_atual}
                    className="bg-gray-100 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-gray-500">Atualizado pelas compras/saídas</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="localizacao_estoque">Localização no Estoque</Label>
                <Input
                  id="localizacao_estoque"
                  value={formData.localizacao_estoque}
                  onChange={(e) => setFormData({ ...formData, localizacao_estoque: e.target.value })}
                  placeholder="Ex: Prateleira A3, Corredor 2, Galpão B..."
                />
                <p className="text-xs text-gray-500">Localização física dentro do almoxarifado</p>
              </div>
            </TabsContent>

            {/* ABA IMAGENS */}
            <TabsContent value="imagens" className="space-y-4 mt-4">
              {!item?.id ? (
                <div className="p-8 text-center bg-amber-50 rounded-lg border-2 border-dashed border-amber-300">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                  <p className="text-amber-700 font-semibold">Salve o item primeiro</p>
                  <p className="text-sm text-amber-600 mt-1">
                    Para adicionar imagens, primeiro salve as informações básicas do item
                  </p>
                </div>
              ) : (
                <>
                  <ImageUploader
                    entidadeTipo="ItemEstoque"
                    entidadeId={item?.id}
                    tiposPadrao={["principal", "galeria", "outros"]}
                    onImageUploaded={() => {}}
                  />

                  <ImageGallery
                    entidadeTipo="ItemEstoque"
                    entidadeId={item?.id}
                    allowDelete={true}
                  />
                </>
              )}
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