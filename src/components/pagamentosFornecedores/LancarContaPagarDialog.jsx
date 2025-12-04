import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, Plus } from "lucide-react";
import { toast } from "sonner";

export default function LancarContaPagarDialog({ open, onClose }) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    fornecedor_id: "",
    unidade_id: "",
    centro_custo_id: "",
    tipo_despesa_id: "",
    descricao: "",
    valor: "",
    data_vencimento: "",
    forma_pagamento: "pix",
    numero_nota: "",
    observacoes: "",
  });

  const [searchFornecedor, setSearchFornecedor] = useState("");
  const [showFornecedorList, setShowFornecedorList] = useState(false);

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: centrosCusto = [] } = useQuery({
    queryKey: ['centrosCusto'],
    queryFn: () => base44.entities.CentroCusto.list(),
  });

  const { data: tiposDespesa = [] } = useQuery({
    queryKey: ['tiposDespesa'],
    queryFn: () => base44.entities.TipoDespesa.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PagamentoFornecedor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentosFornecedores'] });
      toast.success("Conta a pagar lançada com sucesso!");
      onClose();
    },
    onError: (error) => {
      toast.error("Erro ao lançar conta: " + error.message);
    },
  });

  const filteredFornecedores = fornecedores.filter(f => 
    f.nome?.toLowerCase().includes(searchFornecedor.toLowerCase()) ||
    f.cnpj?.includes(searchFornecedor)
  );

  const selectedFornecedor = fornecedores.find(f => f.id === formData.fornecedor_id);

  const handleSubmit = () => {
    if (!formData.fornecedor_id) {
      toast.error("Selecione um fornecedor");
      return;
    }
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    if (!formData.data_vencimento) {
      toast.error("Informe a data de vencimento");
      return;
    }

    createMutation.mutate({
      ...formData,
      valor: parseFloat(formData.valor),
      status: 'pendente',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--wine-700)]">Lançar Contas a Pagar</DialogTitle>
          <DialogDescription>
            Cadastre uma nova conta a pagar para fornecedor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Busca de Fornecedor */}
          <div className="space-y-2">
            <Label>Fornecedor *</Label>
            {selectedFornecedor ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">{selectedFornecedor.nome}</p>
                  <p className="text-sm text-green-600">{selectedFornecedor.cnpj}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ ...formData, fornecedor_id: "" })}
                >
                  Alterar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar fornecedor por nome ou CNPJ..."
                  value={searchFornecedor}
                  onChange={(e) => {
                    setSearchFornecedor(e.target.value);
                    setShowFornecedorList(true);
                  }}
                  onFocus={() => setShowFornecedorList(true)}
                  className="pl-10"
                />
                {showFornecedorList && searchFornecedor && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredFornecedores.length > 0 ? (
                      filteredFornecedores.slice(0, 10).map(f => (
                        <button
                          key={f.id}
                          className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                          onClick={() => {
                            setFormData({ ...formData, fornecedor_id: f.id });
                            setSearchFornecedor("");
                            setShowFornecedorList(false);
                          }}
                        >
                          <p className="font-medium">{f.nome}</p>
                          <p className="text-sm text-gray-500">{f.cnpj}</p>
                        </button>
                      ))
                    ) : (
                      <p className="p-3 text-gray-500 text-center">Nenhum fornecedor encontrado</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select 
                value={formData.unidade_id} 
                onValueChange={(v) => setFormData({ ...formData, unidade_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.codigo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Centro de Custo</Label>
              <Select 
                value={formData.centro_custo_id} 
                onValueChange={(v) => setFormData({ ...formData, centro_custo_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {centrosCusto.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Despesa</Label>
              <Select 
                value={formData.tipo_despesa_id} 
                onValueChange={(v) => setFormData({ ...formData, tipo_despesa_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {tiposDespesa.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select 
                value={formData.forma_pagamento} 
                onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}
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
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Input
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição da despesa..."
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Valor *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Vencimento *</Label>
              <Input
                type="date"
                value={formData.data_vencimento}
                onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Número NF</Label>
              <Input
                value={formData.numero_nota}
                onChange={(e) => setFormData({ ...formData, numero_nota: e.target.value })}
                placeholder="NF-12345"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Lançar Conta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}