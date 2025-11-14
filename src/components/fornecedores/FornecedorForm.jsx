import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputMask, validarCNPJ, removeMask } from "@/components/ui/input-mask";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, Package, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import EnderecoForm from "../endereco/EnderecoForm";

export default function FornecedorForm({ open, onClose, onSave, fornecedor }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    razao_social: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    telefone: "",
    telefone_secundario: "",
    email: "",
    site: "",
    tipo_logradouro: "",
    logradouro: "",
    numero: "",
    complemento: "",
    referencia: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    tipo_servico: "",
    vendedor_nome: "",
    vendedor_telefone: "",
    vendedor_email: "",
    forma_pagamento_preferencial: "pix",
    banco: "",
    agencia: "",
    conta: "",
    tipo_pix: "cpf_cnpj",
    chave_pix: "",
    observacoes: "",
  });

  const { data: compras = [] } = useQuery({
    queryKey: ['compras_fornecedor', fornecedor?.id],
    queryFn: async () => {
      if (!fornecedor?.id) return [];
      return await base44.entities.CompraNotaFiscal.filter({ fornecedor_id: fornecedor.id });
    },
    enabled: !!fornecedor?.id,
  });

  const { data: itensCompras = [] } = useQuery({
    queryKey: ['itens_compras_fornecedor', fornecedor?.id],
    queryFn: async () => {
      if (!fornecedor?.id || compras.length === 0) return [];
      const compraIds = compras.map(c => c.id);
      const todosItens = await Promise.all(
        compraIds.map(compraId => base44.entities.ItemCompra.filter({ compra_id: compraId }))
      );
      return todosItens.flat();
    },
    enabled: !!fornecedor?.id && compras.length > 0,
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos_estoque'],
    queryFn: () => base44.entities.ItemEstoque.list(),
    enabled: !!fornecedor?.id,
  });

  const produtosUnicos = React.useMemo(() => {
    if (!itensCompras || itensCompras.length === 0) return [];
    
    const produtosMap = new Map();
    
    itensCompras.forEach(item => {
      if (!item.produto_id) return;
      
      if (!produtosMap.has(item.produto_id)) {
        produtosMap.set(item.produto_id, {
          produto_id: item.produto_id,
          descricao: item.descricao,
          quantidade_total: item.quantidade,
          valor_medio: item.valor_unitario,
          ultima_compra: item.created_date,
          total_compras: 1,
        });
      } else {
        const existente = produtosMap.get(item.produto_id);
        existente.quantidade_total += item.quantidade;
        existente.total_compras += 1;
        existente.valor_medio = (existente.valor_medio + item.valor_unitario) / 2;
        if (new Date(item.created_date) > new Date(existente.ultima_compra)) {
          existente.ultima_compra = item.created_date;
        }
      }
    });
    
    return Array.from(produtosMap.values());
  }, [itensCompras]);

  useEffect(() => {
    if (fornecedor) {
      setFormData(fornecedor);
    } else {
      setFormData({
        nome: "",
        cnpj: "",
        razao_social: "",
        inscricao_estadual: "",
        inscricao_municipal: "",
        telefone: "",
        telefone_secundario: "",
        email: "",
        site: "",
        tipo_logradouro: "",
        logradouro: "",
        numero: "",
        complemento: "",
        referencia: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
        tipo_servico: "",
        vendedor_nome: "",
        vendedor_telefone: "",
        vendedor_email: "",
        forma_pagamento_preferencial: "pix",
        banco: "",
        agencia: "",
        conta: "",
        tipo_pix: "cpf_cnpj",
        chave_pix: "",
        observacoes: "",
      });
    }
  }, [fornecedor, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);

    if (!formData.nome || !formData.nome.trim()) {
      setErro("Nome é obrigatório");
      return;
    }

    if (!formData.cnpj || !formData.cnpj.trim()) {
      setErro("CNPJ é obrigatório");
      return;
    }

    const cnpjLimpo = removeMask(formData.cnpj);
    if (cnpjLimpo.length !== 14) {
      setErro("CNPJ deve ter 14 dígitos");
      return;
    }

    if (!validarCNPJ(formData.cnpj)) {
      setErro("CNPJ inválido");
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      const mensagemErro = error.response?.data?.message || error.message || 'Erro ao salvar fornecedor';
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  const abrirProduto = (produtoId) => {
    window.open(`/app/Estoque?produto_id=${produtoId}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}
          </DialogTitle>
        </DialogHeader>

        {erro && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <p className="font-semibold">Erro ao salvar</p>
              <p className="text-sm mt-1">{erro}</p>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dados">Dados Cadastrais</TabsTrigger>
            <TabsTrigger value="bancarios">Dados Bancários</TabsTrigger>
            <TabsTrigger value="produtos" disabled={!fornecedor?.id}>
              Produtos ({produtosUnicos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Nome *</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome do fornecedor"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>CNPJ *</Label>
                  <InputMask
                    mask="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Razão Social</Label>
                  <Input
                    value={formData.razao_social}
                    onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                    placeholder="Razão social"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Inscrição Estadual</Label>
                  <InputMask
                    mask="inscricaoEstadual"
                    value={formData.inscricao_estadual}
                    onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                    placeholder="000.000.000.000"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Inscrição Municipal</Label>
                  <Input
                    value={formData.inscricao_municipal}
                    onChange={(e) => setFormData({ ...formData, inscricao_municipal: e.target.value })}
                    placeholder="Inscrição municipal"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Telefone</Label>
                  <InputMask
                    mask="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Telefone Secundário</Label>
                  <InputMask
                    mask="telefone"
                    value={formData.telefone_secundario}
                    onChange={(e) => setFormData({ ...formData, telefone_secundario: e.target.value })}
                    placeholder="(00) 00000-0000"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Site</Label>
                  <Input
                    value={formData.site}
                    onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                    placeholder="https://www.exemplo.com"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">📍 Endereço</h3>
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
                    onChange={(enderecoData) => setFormData((prevData) => ({ ...prevData, ...enderecoData }))}
                    prefix="fornecedor_"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações sobre o fornecedor"
                    rows={3}
                    disabled={loading}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    fornecedor ? "Atualizar" : "Criar Fornecedor"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="bancarios">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Banco</Label>
                  <Input
                    value={formData.banco}
                    onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                    placeholder="Nome do banco"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Agência</Label>
                  <Input
                    value={formData.agencia}
                    onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                    placeholder="0000"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Conta</Label>
                  <Input
                    value={formData.conta}
                    onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                    placeholder="00000-0"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Chave PIX</Label>
                  <Input
                    value={formData.chave_pix}
                    onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                    placeholder="Chave PIX"
                    disabled={loading}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    fornecedor ? "Atualizar" : "Criar Fornecedor"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="produtos">
            <div className="space-y-4">
              {produtosUnicos.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum produto comprado deste fornecedor</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Os produtos aparecerão aqui após registrar compras
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      {produtosUnicos.length} produto(s) comprado(s)
                    </h3>
                  </div>

                  {produtosUnicos.map((item, index) => {
                    const produto = produtos.find(p => p.id === item.produto_id);
                    
                    return (
                      <Card 
                        key={index}
                        className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-blue-500"
                        onClick={() => abrirProduto(item.produto_id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Package className="w-4 h-4 text-blue-600" />
                                <h4 className="font-semibold text-gray-900">{item.descricao}</h4>
                                <ExternalLink className="w-3 h-3 text-gray-400" />
                              </div>
                              
                              {produto && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {produto.codigo && (
                                    <Badge variant="outline" className="text-xs">
                                      Cód: {produto.codigo}
                                    </Badge>
                                  )}
                                  {produto.marca && (
                                    <Badge variant="outline" className="text-xs">
                                      {produto.marca}
                                    </Badge>
                                  )}
                                  {produto.unidade_padrao && (
                                    <Badge variant="outline" className="text-xs">
                                      {produto.unidade_padrao}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              <div className="grid grid-cols-3 gap-3 text-sm mt-3">
                                <div>
                                  <p className="text-gray-600 text-xs">Qtd. Total Comprada</p>
                                  <p className="font-semibold text-gray-900">
                                    {item.quantidade_total.toLocaleString('pt-BR')}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 text-xs">Valor Médio</p>
                                  <p className="font-semibold text-green-700">
                                    R$ {item.valor_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 text-xs">Total de Compras</p>
                                  <p className="font-semibold text-blue-700">
                                    {item.total_compras}x
                                  </p>
                                </div>
                              </div>

                              <div className="mt-2 text-xs text-gray-500">
                                Última compra: {new Date(item.ultima_compra).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}