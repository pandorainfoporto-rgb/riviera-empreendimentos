import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Wallet, Landmark, TrendingUp, CreditCard, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function CaixaForm({ item, contas, corretoras, loteamentos, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    nome: "",
    tipo: "dinheiro",
    conta_id: "",
    corretora_id: "",
    gateway_id: "",
    loteamento_id: "",
    saldo_inicial: 0,
    ativo: true,
    eh_padrao: false,
    lancar_taxas_automaticamente: true,
    observacoes: ""
  });

  // Buscar gateways configurados
  const { data: gateways = [] } = useQuery({
    queryKey: ['configuracoes_gateway'],
    queryFn: () => base44.entities.ConfiguracaoGateway.list(),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const tiposIcones = {
    dinheiro: Wallet,
    conta_bancaria: Landmark,
    corretora: TrendingUp,
    gateway: CreditCard,
  };

  const IconeTipo = tiposIcones[formData.tipo] || Wallet;

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconeTipo className="w-6 h-6 text-[var(--wine-600)]" />
            {item ? "Editar Caixa" : "Novo Caixa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Caixa *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Caixa Asaas Principal"
              required
            />
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Caixa *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                tipo: value,
                conta_id: "",
                corretora_id: "",
                gateway_id: ""
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Dinheiro
                  </div>
                </SelectItem>
                <SelectItem value="conta_bancaria">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4" />
                    Conta Bancária
                  </div>
                </SelectItem>
                <SelectItem value="corretora">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Corretora
                  </div>
                </SelectItem>
                <SelectItem value="gateway">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Gateway de Pagamento
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conta Bancária */}
          {formData.tipo === 'conta_bancaria' && (
            <div className="space-y-2">
              <Label htmlFor="conta_id">Conta Bancária *</Label>
              <Select
                value={formData.conta_id}
                onValueChange={(value) => setFormData({ ...formData, conta_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {contas.map(conta => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.numero_conta} - {conta.tipo_conta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Corretora */}
          {formData.tipo === 'corretora' && (
            <div className="space-y-2">
              <Label htmlFor="corretora_id">Corretora *</Label>
              <Select
                value={formData.corretora_id}
                onValueChange={(value) => setFormData({ ...formData, corretora_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma corretora" />
                </SelectTrigger>
                <SelectContent>
                  {corretoras.map(corretora => (
                    <SelectItem key={corretora.id} value={corretora.id}>
                      {corretora.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Gateway */}
          {formData.tipo === 'gateway' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gateway_id">Gateway de Pagamento *</Label>
                <Select
                  value={formData.gateway_id}
                  onValueChange={(value) => {
                    const gateway = gateways.find(g => g.id === value);
                    setFormData({ 
                      ...formData, 
                      gateway_id: value,
                      nome: formData.nome || `Caixa ${gateway?.nome_exibicao || 'Gateway'}`
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    {gateways.filter(g => g.ativo).map(gateway => (
                      <SelectItem key={gateway.id} value={gateway.id}>
                        <div className="flex items-center justify-between gap-2 w-full">
                          <span>{gateway.nome_exibicao}</span>
                          <Badge variant="outline" className="text-xs">
                            {gateway.ambiente === 'producao' ? '🚀 Produção' : '🧪 Sandbox'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lançamento Automático de Taxas */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="lancar_taxas" className="font-semibold text-blue-900">
                      Lançar Taxas Automaticamente
                    </Label>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    As taxas cobradas pelo gateway serão lançadas automaticamente como "Custo de Operação"
                  </p>
                </div>
                <Switch
                  id="lancar_taxas"
                  checked={formData.lancar_taxas_automaticamente}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, lancar_taxas_automaticamente: checked })
                  }
                />
              </div>

              {gateways.length === 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Nenhum gateway ativo</p>
                      <p className="text-xs text-orange-700 mt-1">
                        Configure e ative um gateway em Configurações → Gateways de Pagamento
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loteamento (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="loteamento_id">Loteamento (Opcional)</Label>
            <Select
              value={formData.loteamento_id}
              onValueChange={(value) => setFormData({ ...formData, loteamento_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Nenhum</SelectItem>
                {loteamentos.map(loteamento => (
                  <SelectItem key={loteamento.id} value={loteamento.id}>
                    {loteamento.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Saldo Inicial */}
          <div className="space-y-2">
            <Label htmlFor="saldo_inicial">Saldo Inicial</Label>
            <Input
              id="saldo_inicial"
              type="number"
              step="0.01"
              value={formData.saldo_inicial}
              onChange={(e) => setFormData({ ...formData, saldo_inicial: parseFloat(e.target.value) || 0 })}
            />
          </div>

          {/* Switches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Caixa Ativo</Label>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="eh_padrao">Caixa Padrão</Label>
                <p className="text-xs text-gray-500">Usado por padrão quando não especificado</p>
              </div>
              <Switch
                id="eh_padrao"
                checked={formData.eh_padrao}
                onCheckedChange={(checked) => setFormData({ ...formData, eh_padrao: checked })}
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
              placeholder="Anotações sobre este caixa..."
            />
          </div>

          {/* Info Box */}
          {formData.tipo === 'gateway' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-900">💡 Funcionamento</p>
                  <ul className="text-xs text-green-700 mt-2 space-y-1">
                    <li>✓ Recebimentos via gateway são lançados automaticamente neste caixa</li>
                    <li>✓ Taxas são registradas como "Custo de Operação"</li>
                    <li>✓ Cada movimentação vincula ao pagamento original</li>
                    <li>✓ Saldo atualizado em tempo real</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              {isProcessing ? "Salvando..." : "Salvar Caixa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}