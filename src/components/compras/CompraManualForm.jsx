import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { Save, X, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CompraManualForm({ fornecedores, unidades, produtos, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    numero_nota: "",
    serie: "",
    fornecedor_id: "",
    unidade_id: "",
    data_emissao: new Date().toISOString().split('T')[0],
    data_entrada: new Date().toISOString().split('T')[0],
    forma_pagamento: "prazo",
    gerar_contas_pagar: true,
    atualizar_estoque: true,
    observacoes: "",
  });

  const [itens, setItens] = useState([
    { produto_id: "", quantidade: 0, valor_unitario: 0 }
  ]);

  const [isProcessing, setIsProcessing] = useState(false);

  const addItem = () => {
    setItens([...itens, { produto_id: "", quantidade: 0, valor_unitario: 0 }]);
  };

  const removeItem = (index) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const novosItens = [...itens];
    novosItens[index] = {
      ...novosItens[index],
      [field]: field === 'produto_id' ? value : parseFloat(value) || 0
    };
    setItens(novosItens);
  };

  const calcularTotal = () => {
    return itens.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fornecedor_id || !formData.unidade_id || itens.length === 0) {
      alert("Preencha todos os campos obrigatórios e adicione pelo menos um item");
      return;
    }

    setIsProcessing(true);

    try {
      const valorTotal = calcularTotal();

      // 1. Criar a compra
      const compra = await base44.entities.CompraNotaFiscal.create({
        ...formData,
        valor_produtos: valorTotal,
        valor_total: valorTotal,
        status: 'processada',
      });

      // 2. Criar itens da compra
      for (const item of itens) {
        if (item.produto_id && item.quantidade > 0) {
          const produto = produtos.find(p => p.id === item.produto_id);
          
          await base44.entities.ItemCompra.create({
            compra_id: compra.id,
            produto_id: item.produto_id,
            descricao: produto.nome,
            unidade_medida: produto.unidade_medida,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valor_total: item.quantidade * item.valor_unitario,
          });

          // 3. Atualizar estoque se necessário
          if (formData.atualizar_estoque) {
            await base44.entities.Produto.update(item.produto_id, {
              ...produto,
              estoque_atual: (produto.estoque_atual || 0) + item.quantidade,
            });
          }
        }
      }

      // 4. Gerar conta a pagar se necessário
      if (formData.gerar_contas_pagar) {
        const fornecedor = fornecedores.find(f => f.id === formData.fornecedor_id);
        await base44.entities.PagamentoFornecedor.create({
          fornecedor_id: formData.fornecedor_id,
          unidade_id: formData.unidade_id,
          tipo: "produto",
          valor: valorTotal,
          data_vencimento: formData.data_entrada,
          forma_pagamento: formData.forma_pagamento,
          status: 'pendente',
          descricao: `NF ${formData.numero_nota} - ${fornecedor?.nome}`,
          numero_nota: formData.numero_nota,
        });
      }

      onSuccess();
    } catch (err) {
      alert("Erro ao salvar compra: " + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--wine-700)]">Cadastro Manual de Compra</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_nota">Número da Nota *</Label>
              <Input
                id="numero_nota"
                value={formData.numero_nota}
                onChange={(e) => setFormData({ ...formData, numero_nota: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serie">Série</Label>
              <Input
                id="serie"
                value={formData.serie}
                onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_emissao">Data Emissão *</Label>
              <Input
                id="data_emissao"
                type="date"
                value={formData.data_emissao}
                onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fornecedor_id">Fornecedor *</Label>
              <Select
                value={formData.fornecedor_id}
                onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map(forn => (
                    <SelectItem key={forn.id} value={forn.id}>
                      {forn.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade_id">Unidade Destino *</Label>
              <Select
                value={formData.unidade_id}
                onValueChange={(value) => setFormData({ ...formData, unidade_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map(uni => (
                    <SelectItem key={uni.id} value={uni.id}>
                      {uni.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_entrada">Data Entrada</Label>
              <Input
                id="data_entrada"
                type="date"
                value={formData.data_entrada}
                onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
              <Select
                value={formData.forma_pagamento}
                onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="prazo">A Prazo</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Itens da Compra *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-2">
              {itens.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid md:grid-cols-4 gap-3 items-end">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Produto</Label>
                        <Select
                          value={item.produto_id}
                          onValueChange={(value) => updateItem(index, 'produto_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {produtos.map(prod => (
                              <SelectItem key={prod.id} value={prod.id}>
                                {prod.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.quantidade}
                          onChange={(e) => updateItem(index, 'quantidade', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Valor Unit.</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.valor_unitario}
                          onChange={(e) => updateItem(index, 'valor_unitario', e.target.value)}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Subtotal: R$ {(item.quantidade * item.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-right p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-green-700">
                R$ {calcularTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="gerar_contas_pagar"
                checked={formData.gerar_contas_pagar}
                onCheckedChange={(checked) => setFormData({ ...formData, gerar_contas_pagar: checked })}
              />
              <Label htmlFor="gerar_contas_pagar" className="cursor-pointer">
                Gerar conta a pagar automaticamente
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="atualizar_estoque"
                checked={formData.atualizar_estoque}
                onCheckedChange={(checked) => setFormData({ ...formData, atualizar_estoque: checked })}
              />
              <Label htmlFor="atualizar_estoque" className="cursor-pointer">
                Atualizar estoque automaticamente
              </Label>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isProcessing}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {isProcessing ? "Salvando..." : "Salvar Compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}