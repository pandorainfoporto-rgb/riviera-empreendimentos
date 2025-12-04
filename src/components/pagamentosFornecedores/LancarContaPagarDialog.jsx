import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Save, X, Upload, FileText, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

import SearchFornecedorDialog from "../shared/SearchFornecedorDialog";
import SearchCaixaDialog from "../shared/SearchCaixaDialog";
import SearchTipoDespesaDialog from "../shared/SearchTipoDespesaDialog";
import SearchPlanoContasDialog from "../shared/SearchPlanoContasDialog";
import { gerarNumeroSequencial } from "../utils/gerarNumeroSequencial";

export default function LancarContaPagarDialog({ open, onClose }) {
  const [formData, setFormData] = useState({
    fornecedor_id: "",
    valor: 0,
    data_vencimento: new Date().toISOString().split('T')[0],
    data_lancamento: new Date().toISOString().split('T')[0],
    caixa_id: "",
    forma_pagamento: "pix",
    tipo_despesa_id: "",
    conta_contabil_id: "",
    numero_nota: "",
    numero_documento: "",
    descricao: "",
    observacoes: "",
    anexo_url: "",
    tipo_pix: "cpf_cnpj",
    chave_pix: "",
  });

  const [uploadingAnexo, setUploadingAnexo] = useState(false);

  const [showSearchFornecedor, setShowSearchFornecedor] = useState(false);
  const [showSearchCaixa, setShowSearchCaixa] = useState(false);
  const [showSearchTipoDespesa, setShowSearchTipoDespesa] = useState(false);
  const [showSearchPlanoContas, setShowSearchPlanoContas] = useState(false);

  const queryClient = useQueryClient();

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
  });

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
  });

  const { data: tiposDespesa = [] } = useQuery({
    queryKey: ['tiposDespesa'],
    queryFn: () => base44.entities.TipoDespesa.list(),
  });

  const { data: planoContas = [] } = useQuery({
    queryKey: ['planoContas'],
    queryFn: async () => {
      try {
        return await base44.entities.PlanoContas.list();
      } catch {
        return [];
      }
    },
  });

  const fornecedor = fornecedores.find(f => f.id === formData.fornecedor_id);
  const caixa = caixas.find(c => c.id === formData.caixa_id);
  const tipoDespesa = tiposDespesa.find(t => t.id === formData.tipo_despesa_id);
  const contaContabil = planoContas.find(p => p.id === formData.conta_contabil_id);

  const lancarContaMutation = useMutation({
    mutationFn: async (data) => {
      // Gerar números sequenciais
      const numeroPagamentoFornecedor = await gerarNumeroSequencial('PagamentoFornecedor');

      // Criar Pagamento Fornecedor
      const pagamentoFornecedor = await base44.entities.PagamentoFornecedor.create({
        numero: numeroPagamentoFornecedor,
        fornecedor_id: data.fornecedor_id,
        valor: data.valor,
        data_vencimento: data.data_vencimento,
        status: 'pendente',
        forma_pagamento: data.forma_pagamento,
        tipo_despesa_id: data.tipo_despesa_id,
        descricao: data.descricao || `Pagamento - ${fornecedor?.nome}`,
        numero_nota: data.numero_nota,
        caixa_id: data.caixa_id,
        chave_pix: data.forma_pagamento === 'pix' ? data.chave_pix : null,
        tipo_pix: data.forma_pagamento === 'pix' ? data.tipo_pix : null,
        anexo_url: data.anexo_url,
        observacoes: data.observacoes,
      });

      return { pagamentoFornecedor };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contasPagar'] });
      queryClient.invalidateQueries({ queryKey: ['pagamentosFornecedores'] });
      toast.success("✅ Conta a pagar lançada com sucesso!");
      onClose();
    },
    onError: (error) => {
      toast.error("Erro ao lançar conta: " + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.fornecedor_id) {
      toast.error("Selecione o fornecedor");
      return;
    }
    if (!formData.valor || formData.valor <= 0) {
      toast.error("Informe o valor");
      return;
    }
    if (!formData.data_vencimento) {
      toast.error("Informe a data de vencimento");
      return;
    }

    lancarContaMutation.mutate(formData);
  };

  const formatCurrency = (value) => {
    const numValue = parseFloat(value) || 0;
    return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const handleCurrencyChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    const numValue = parseFloat(value) / 100;
    setFormData({ ...formData, valor: numValue });
  };

  const handleAnexoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAnexo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, anexo_url: file_url });
      toast.success("Anexo carregado!");
    } catch (error) {
      toast.error("Erro ao fazer upload: " + error.message);
    } finally {
      setUploadingAnexo(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[var(--wine-700)]">Lançar Conta a Pagar</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fornecedor *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={fornecedor?.nome || ""}
                      placeholder="Selecione o fornecedor..."
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSearchFornecedor(true)}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Valor (R$) *</Label>
                  <Input
                    value={formatCurrency(formData.valor)}
                    onChange={handleCurrencyChange}
                    placeholder="0,00"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Lançamento *</Label>
                  <Input
                    type="date"
                    value={formData.data_lancamento}
                    onChange={(e) => setFormData({ ...formData, data_lancamento: e.target.value })}
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
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Caixa Previsto</Label>
                  <div className="flex gap-2">
                    <Input
                      value={caixa?.nome || ""}
                      placeholder="Selecione o caixa..."
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSearchCaixa(true)}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
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
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.forma_pagamento === 'pix' && (
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="space-y-2">
                    <Label>Tipo de Chave PIX</Label>
                    <Select
                      value={formData.tipo_pix}
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
                    <Label>Chave PIX</Label>
                    <Input
                      value={formData.chave_pix}
                      onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                      placeholder="Digite a chave PIX..."
                    />
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Despesa</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tipoDespesa?.nome || ""}
                      placeholder="Selecione o tipo..."
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSearchTipoDespesa(true)}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Conta Contábil Analítica</Label>
                  <div className="flex gap-2">
                    <Input
                      value={contaContabil ? `${contaContabil.codigo} - ${contaContabil.nome}` : ""}
                      placeholder="Selecione a conta..."
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSearchPlanoContas(true)}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número da Nota Fiscal</Label>
                  <Input
                    value={formData.numero_nota}
                    onChange={(e) => setFormData({ ...formData, numero_nota: e.target.value })}
                    placeholder="Ex: NF-12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Número do Documento</Label>
                  <Input
                    value={formData.numero_documento}
                    onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                    placeholder="Ex: DOC-12345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição da conta a pagar..."
                />
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

              <div className="space-y-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-gray-900">Anexar Título/Documento</span>
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    onChange={handleAnexoUpload}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="flex-1"
                    disabled={uploadingAnexo}
                  />
                  {uploadingAnexo && (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  )}
                </div>
                {formData.anexo_url && (
                  <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                    <FileText className="w-4 h-4" />
                    <a 
                      href={formData.anexo_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-green-700"
                    >
                      Anexo carregado - clique para visualizar
                    </a>
                  </div>
                )}
                {!formData.anexo_url && (
                  <p className="text-xs text-gray-600">
                    Formatos aceitos: PDF, JPG, PNG
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={lancarContaMutation.isPending}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={lancarContaMutation.isPending}
                className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
              >
                <Save className="w-4 h-4 mr-2" />
                {lancarContaMutation.isPending ? "Gravando..." : "Gravar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SearchFornecedorDialog
        open={showSearchFornecedor}
        onClose={() => setShowSearchFornecedor(false)}
        onSelect={(fornecedor) => {
          setFormData({ ...formData, fornecedor_id: fornecedor.id });
          setShowSearchFornecedor(false);
        }}
      />

      <SearchCaixaDialog
        open={showSearchCaixa}
        onClose={() => setShowSearchCaixa(false)}
        onSelect={(caixa) => {
          setFormData({ ...formData, caixa_id: caixa.id });
          setShowSearchCaixa(false);
        }}
      />

      <SearchTipoDespesaDialog
        open={showSearchTipoDespesa}
        onClose={() => setShowSearchTipoDespesa(false)}
        onSelect={(tipo) => {
          setFormData({ ...formData, tipo_despesa_id: tipo.id });
          setShowSearchTipoDespesa(false);
        }}
      />

      <SearchPlanoContasDialog
        open={showSearchPlanoContas}
        onClose={() => setShowSearchPlanoContas(false)}
        onSelect={(conta) => {
          setFormData({ ...formData, conta_contabil_id: conta.id });
          setShowSearchPlanoContas(false);
        }}
      />
    </>
  );
}