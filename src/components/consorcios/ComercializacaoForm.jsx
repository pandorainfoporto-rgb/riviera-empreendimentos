import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, DollarSign, TrendingUp, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ComercializacaoForm({ item, consorcios, clientes, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    consorcio_id: "",
    cliente_id: "",
    valor_carta: 0,
    valor_venda: 0,
    lucro_reais: 0,
    lucro_percentual: 0,
    data_venda: new Date().toISOString().split('T')[0],
    forma_pagamento: "pix",
    status: "vendida",
    observacoes: "",
  });

  const [consorcioSelecionado, setConsorcioSelecionado] = useState(null);
  const [showNovoClienteDialog, setShowNovoClienteDialog] = useState(false);
  const [novoClienteData, setNovoClienteData] = useState({
    nome: "",
    cpf_cnpj: "",
    telefone: "",
    email: "",
    endereco: "",
    eh_cliente_externo_consorcio: true,
  });

  const queryClient = useQueryClient();

  const criarClienteMutation = useMutation({
    mutationFn: (data) => base44.entities.Cliente.create(data),
    onSuccess: (novoCliente) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setFormData({ ...formData, cliente_id: novoCliente.id });
      setShowNovoClienteDialog(false);
      setNovoClienteData({
        nome: "",
        cpf_cnpj: "",
        telefone: "",
        email: "",
        endereco: "",
        eh_cliente_externo_consorcio: true,
      });
      toast.success("Cliente cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar cliente: " + error.message);
    },
  });

  // Quando selecionar um consórcio, preencher o valor da carta
  useEffect(() => {
    if (formData.consorcio_id) {
      const consorcio = consorcios.find(c => c.id === formData.consorcio_id);
      if (consorcio) {
        setConsorcioSelecionado(consorcio);
        setFormData(prev => ({
          ...prev,
          valor_carta: consorcio.valor_carta || 0,
        }));
      }
    }
  }, [formData.consorcio_id, consorcios]);

  // Calcular lucro automaticamente
  useEffect(() => {
    if (formData.valor_venda > 0 && formData.valor_carta > 0) {
      const lucroReais = formData.valor_venda - formData.valor_carta;
      const lucroPercentual = (lucroReais / formData.valor_carta) * 100;
      
      setFormData(prev => ({
        ...prev,
        lucro_reais: lucroReais,
        lucro_percentual: lucroPercentual,
      }));
    }
  }, [formData.valor_venda, formData.valor_carta]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.cliente_id) {
      toast.error("É obrigatório selecionar ou cadastrar um cliente para realizar a venda");
      return;
    }
    
    onSubmit(formData);
  };

  const handleCriarCliente = (e) => {
    e.preventDefault();
    
    if (!novoClienteData.nome || !novoClienteData.cpf_cnpj) {
      toast.error("Nome e CPF/CNPJ são obrigatórios");
      return;
    }

    criarClienteMutation.mutate(novoClienteData);
  };

  // Filtrar apenas consórcios contemplados e não resgatados
  const consorciosDisponiveis = consorcios.filter(c => 
    c.contemplado && !c.resgatado
  );

  const lucroPositivo = formData.lucro_reais >= 0;

  return (
    <>
      <Card className="shadow-xl border-t-4 border-green-600">
        <CardHeader>
          <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            {item ? "Editar Comercialização" : "Nova Venda de Cota Contemplada"}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {consorciosDisponiveis.length === 0 && (
              <Alert className="border-orange-500 bg-orange-50">
                <AlertDescription className="text-orange-800">
                  Não há cotas contempladas disponíveis para venda. Cadastre consórcios contemplados primeiro.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="consorcio_id">Cota Contemplada *</Label>
              <Select
                value={formData.consorcio_id}
                onValueChange={(value) => setFormData({ ...formData, consorcio_id: value })}
                required
                disabled={!!item}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cota contemplada" />
                </SelectTrigger>
                <SelectContent>
                  {consorciosDisponiveis.map(cons => {
                    const clienteOriginal = clientes.find(c => c.id === cons.cliente_id);
                    return (
                      <SelectItem key={cons.id} value={cons.id}>
                        Grupo {cons.grupo} - Cota {cons.cota} - R$ {cons.valor_carta?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        {clienteOriginal && ` (${clienteOriginal.nome})`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {consorcioSelecionado && (
              <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-3">Informações da Cota</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Grupo:</span>
                    <span className="font-semibold ml-2">{consorcioSelecionado.grupo}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cota:</span>
                    <span className="font-semibold ml-2">{consorcioSelecionado.cota}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Valor da Carta:</span>
                    <span className="font-semibold ml-2 text-[var(--wine-700)]">
                      R$ {consorcioSelecionado.valor_carta?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tipo Contemplação:</span>
                    <span className="font-semibold ml-2">
                      {consorcioSelecionado.tipo_contemplacao === 'lance' ? 'Lance' : 'Sorteio'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente Comprador *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.cliente_id}
                  onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                  required
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome} - {cliente.cpf_cnpj}
                        {cliente.eh_cliente_externo_consorcio && " (Consórcio)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNovoClienteDialog(true)}
                  className="whitespace-nowrap border-[var(--wine-600)] text-[var(--wine-700)] hover:bg-[var(--wine-50)]"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Cliente
                </Button>
              </div>
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800 text-xs">
                  <strong>💡 Dica:</strong> Se o cliente não está cadastrado, clique em "Novo Cliente" para cadastrá-lo rapidamente.
                </AlertDescription>
              </Alert>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor_carta">Valor da Carta (Ref.) *</Label>
                <Input
                  id="valor_carta"
                  type="number"
                  step="0.01"
                  value={formData.valor_carta}
                  onChange={(e) => setFormData({ ...formData, valor_carta: parseFloat(e.target.value) || 0 })}
                  required
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_venda">Valor de Venda *</Label>
                <Input
                  id="valor_venda"
                  type="number"
                  step="0.01"
                  value={formData.valor_venda}
                  onChange={(e) => setFormData({ ...formData, valor_venda: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            {/* Resumo de Lucro */}
            {formData.valor_venda > 0 && (
              <div className={`p-4 rounded-lg border-2 ${
                lucroPositivo 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                  : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className={`w-5 h-5 ${lucroPositivo ? 'text-green-600' : 'text-red-600'}`} />
                  <h4 className={`font-semibold ${lucroPositivo ? 'text-green-900' : 'text-red-900'}`}>
                    Análise de {lucroPositivo ? 'Lucro' : 'Prejuízo'}
                  </h4>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Valor em Reais</p>
                    <p className={`text-2xl font-bold ${lucroPositivo ? 'text-green-700' : 'text-red-700'}`}>
                      R$ {formData.lucro_reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Percentual</p>
                    <p className={`text-2xl font-bold ${lucroPositivo ? 'text-green-700' : 'text-red-700'}`}>
                      {formData.lucro_percentual.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_venda">Data da Venda *</Label>
                <Input
                  id="data_venda"
                  type="date"
                  value={formData.data_venda}
                  onChange={(e) => setFormData({ ...formData, data_venda: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                <Select
                  value={formData.forma_pagamento}
                  onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
                  required
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
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="negociacao">Em Negociação</SelectItem>
                  <SelectItem value="vendida">Vendida</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais sobre a venda..."
                rows={3}
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
              disabled={isProcessing || !formData.cliente_id}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
            >
              <Save className="w-4 h-4 mr-2" />
              {item ? "Atualizar" : "Registrar Venda"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Dialog Novo Cliente */}
      <Dialog open={showNovoClienteDialog} onOpenChange={setShowNovoClienteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Cadastrar Novo Cliente de Consórcio
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarCliente} className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800 text-sm">
                <strong>ℹ️ Cliente de Consórcio:</strong> Este cliente será usado apenas para compra/venda de cotas. Não é necessário vincular unidade ou loteamento.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="novo_nome">Nome Completo *</Label>
                <Input
                  id="novo_nome"
                  value={novoClienteData.nome}
                  onChange={(e) => setNovoClienteData({ ...novoClienteData, nome: e.target.value })}
                  placeholder="Digite o nome completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novo_cpf">CPF/CNPJ *</Label>
                <Input
                  id="novo_cpf"
                  value={novoClienteData.cpf_cnpj}
                  onChange={(e) => setNovoClienteData({ ...novoClienteData, cpf_cnpj: e.target.value })}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="novo_telefone">Telefone</Label>
                <Input
                  id="novo_telefone"
                  value={novoClienteData.telefone}
                  onChange={(e) => setNovoClienteData({ ...novoClienteData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novo_email">Email</Label>
                <Input
                  id="novo_email"
                  type="email"
                  value={novoClienteData.email}
                  onChange={(e) => setNovoClienteData({ ...novoClienteData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="novo_endereco">Endereço</Label>
              <Textarea
                id="novo_endereco"
                value={novoClienteData.endereco}
                onChange={(e) => setNovoClienteData({ ...novoClienteData, endereco: e.target.value })}
                rows={2}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNovoClienteDialog(false)}
                disabled={criarClienteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={criarClienteMutation.isPending}
                className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
              >
                <Save className="w-4 h-4 mr-2" />
                {criarClienteMutation.isPending ? "Salvando..." : "Salvar Cliente"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}