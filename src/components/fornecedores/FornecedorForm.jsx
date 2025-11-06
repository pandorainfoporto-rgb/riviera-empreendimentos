import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Plus, Trash2, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Funções de máscara
const maskCNPJ = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const maskCEP = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

const tiposServicoPadrao = [
  "Materiais de Construção",
  "Mão de Obra",
  "Equipamentos",
  "Serviços Especializados",
  "Elétrica",
  "Hidráulica",
  "Pintura",
  "Acabamento",
  "Ferragens",
  "Madeiras",
  "Vidros",
  "Esquadrias",
  "Pisos e Revestimentos",
  "Louças e Metais",
  "Gesso",
  "Paisagismo",
  "Consultoria",
];

export default function FornecedorForm({ item, loteamentos, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    nome: "",
    cnpj: "",
    razao_social: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    telefone: "",
    telefone_secundario: "",
    email: "",
    site: "",
    logradouro: "",
    numero: "",
    complemento: "",
    referencia: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    tipo_servico: "",
    tipos_servico_personalizados: [],
    vendedor_nome: "",
    vendedor_telefone: "",
    vendedor_email: "",
    forma_pagamento_preferencial: "pix",
    condicao_prazo: {
      tem_entrada: false,
      percentual_entrada: 0,
      quantidade_parcelas: 0,
    },
    prazo_entrega_padrao: 0,
    valor_minimo_pedido: 0,
    desconto_padrao: 0,
    banco: "",
    agencia: "",
    conta: "",
    tipo_pix: "cpf_cnpj",
    chave_pix: "",
    ativo: true,
    observacoes: "",
    loteamento_id: "",
  });

  const [novoTipoServico, setNovoTipoServico] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const adicionarTipoServico = () => {
    if (novoTipoServico.trim() && !formData.tipos_servico_personalizados.includes(novoTipoServico.trim())) {
      setFormData({
        ...formData,
        tipos_servico_personalizados: [...formData.tipos_servico_personalizados, novoTipoServico.trim()]
      });
      setNovoTipoServico("");
    }
  };

  const removerTipoServico = (tipo) => {
    setFormData({
      ...formData,
      tipos_servico_personalizados: formData.tipos_servico_personalizados.filter(t => t !== tipo)
    });
  };

  return (
    <Card className="shadow-xl border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)]">
          {item ? "Editar Fornecedor" : "Novo Fornecedor"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
              <TabsTrigger value="endereco">Endereço</TabsTrigger>
              <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
              <TabsTrigger value="servicos">Serviços</TabsTrigger>
            </TabsList>

            {/* ABA DADOS GERAIS */}
            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Fantasia *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razao_social">Razão Social</Label>
                  <Input
                    id="razao_social"
                    value={formData.razao_social}
                    onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                  <Input
                    id="inscricao_estadual"
                    value={formData.inscricao_estadual}
                    onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                  <Input
                    id="inscricao_municipal"
                    value={formData.inscricao_municipal}
                    onChange={(e) => setFormData({ ...formData, inscricao_municipal: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone Principal</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone_secundario">Telefone Secundário</Label>
                  <Input
                    id="telefone_secundario"
                    value={formData.telefone_secundario}
                    onChange={(e) => setFormData({ ...formData, telefone_secundario: maskPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site">Website</Label>
                  <Input
                    id="site"
                    value={formData.site}
                    onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Representante/Vendedor</h4>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendedor_nome">Nome do Vendedor</Label>
                    <Input
                      id="vendedor_nome"
                      value={formData.vendedor_nome}
                      onChange={(e) => setFormData({ ...formData, vendedor_nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendedor_telefone">Telefone do Vendedor</Label>
                    <Input
                      id="vendedor_telefone"
                      value={formData.vendedor_telefone}
                      onChange={(e) => setFormData({ ...formData, vendedor_telefone: maskPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendedor_email">Email do Vendedor</Label>
                    <Input
                      id="vendedor_email"
                      type="email"
                      value={formData.vendedor_email}
                      onChange={(e) => setFormData({ ...formData, vendedor_email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo" className="cursor-pointer">
                  Fornecedor Ativo
                </Label>
              </div>
            </TabsContent>

            {/* ABA ENDEREÇO */}
            <TabsContent value="endereco" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.logradouro || ""}
                    onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero || ""}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="Nº"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento || ""}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    placeholder="Sala, Galpão, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referencia">Ponto de Referência</Label>
                  <Input
                    id="referencia"
                    value={formData.referencia || ""}
                    onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                    placeholder="Próximo a..."
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro || ""}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    placeholder="Bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade || ""}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado (UF)</Label>
                  <Input
                    id="estado"
                    value={formData.estado || ""}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep || ""}
                    onChange={(e) => setFormData({ ...formData, cep: maskCEP(e.target.value) })}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ABA PAGAMENTO */}
            <TabsContent value="pagamento" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="forma_pagamento_preferencial">Forma de Pagamento Preferencial</Label>
                <Select
                  value={formData.forma_pagamento_preferencial}
                  onValueChange={(value) => setFormData({ ...formData, forma_pagamento_preferencial: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="prazo">A Prazo</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Condições de Prazo */}
              {formData.forma_pagamento_preferencial === "prazo" && (
                <div className="p-4 border rounded-lg bg-blue-50">
                  <h4 className="font-semibold text-gray-900 mb-3">Condições de Pagamento a Prazo</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tem_entrada"
                        checked={formData.condicao_prazo?.tem_entrada || false}
                        onCheckedChange={(checked) => setFormData({ 
                          ...formData, 
                          condicao_prazo: { ...formData.condicao_prazo, tem_entrada: checked }
                        })}
                      />
                      <Label htmlFor="tem_entrada" className="cursor-pointer">
                        Tem Entrada
                      </Label>
                    </div>

                    {formData.condicao_prazo?.tem_entrada && (
                      <div className="space-y-2">
                        <Label htmlFor="percentual_entrada">Percentual da Entrada (%)</Label>
                        <Input
                          id="percentual_entrada"
                          type="number"
                          step="0.01"
                          value={formData.condicao_prazo?.percentual_entrada || 0}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            condicao_prazo: { 
                              ...formData.condicao_prazo, 
                              percentual_entrada: parseFloat(e.target.value) || 0 
                            }
                          })}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="quantidade_parcelas">Quantidade de Parcelas</Label>
                      <Input
                        id="quantidade_parcelas"
                        type="number"
                        value={formData.condicao_prazo?.quantidade_parcelas || 0}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          condicao_prazo: { 
                            ...formData.condicao_prazo, 
                            quantidade_parcelas: parseInt(e.target.value) || 0 
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Dados PIX
                </h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_pix">Tipo de Chave PIX</Label>
                    <Select
                      value={formData.tipo_pix || "cpf_cnpj"}
                      onValueChange={(value) => setFormData({ ...formData, tipo_pix: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf_cnpj">CPF/CNPJ</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="telefone">Telefone</SelectItem>
                        <SelectItem value="chave_aleatoria">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chave_pix">Chave PIX</Label>
                    <Input
                      id="chave_pix"
                      value={formData.chave_pix || ""}
                      onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                      placeholder={
                        formData.tipo_pix === 'cpf_cnpj' ? '000.000.000-00' :
                        formData.tipo_pix === 'email' ? 'email@exemplo.com' :
                        formData.tipo_pix === 'telefone' ? '(00) 00000-0000' :
                        'Chave aleatória'
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Dados Bancários</h4>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="banco">Banco</Label>
                    <Input
                      id="banco"
                      value={formData.banco}
                      onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agencia">Agência</Label>
                    <Input
                      id="agencia"
                      value={formData.agencia}
                      onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conta">Conta</Label>
                    <Input
                      id="conta"
                      value={formData.conta}
                      onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prazo_entrega_padrao">Prazo de Entrega (dias)</Label>
                  <Input
                    id="prazo_entrega_padrao"
                    type="number"
                    value={formData.prazo_entrega_padrao}
                    onChange={(e) => setFormData({ ...formData, prazo_entrega_padrao: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_minimo_pedido">Valor Mínimo Pedido (R$)</Label>
                  <Input
                    id="valor_minimo_pedido"
                    type="number"
                    step="0.01"
                    value={formData.valor_minimo_pedido}
                    onChange={(e) => setFormData({ ...formData, valor_minimo_pedido: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desconto_padrao">Desconto Padrão (%)</Label>
                  <Input
                    id="desconto_padrao"
                    type="number"
                    step="0.01"
                    value={formData.desconto_padrao}
                    onChange={(e) => setFormData({ ...formData, desconto_padrao: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ABA SERVIÇOS */}
            <TabsContent value="servicos" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_servico">Tipo de Serviço Principal</Label>
                <Select
                  value={formData.tipo_servico}
                  onValueChange={(value) => setFormData({ ...formData, tipo_servico: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposServicoPadrao.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipos de Serviço Adicionais</Label>
                <div className="flex gap-2">
                  <Input
                    value={novoTipoServico}
                    onChange={(e) => setNovoTipoServico(e.target.value)}
                    placeholder="Digite um tipo de serviço"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        adicionarTipoServico();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={adicionarTipoServico}
                    variant="outline"
                    size="icon"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tipos_servico_personalizados?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tipos_servico_personalizados.map((tipo, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {tipo}
                        <button
                          type="button"
                          onClick={() => removerTipoServico(tipo)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="loteamento_id">Loteamento (Opcional)</Label>
                <Select
                  value={formData.loteamento_id || ""}
                  onValueChange={(value) => setFormData({ ...formData, loteamento_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum</SelectItem>
                    {loteamentos.map(lot => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.nome}
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