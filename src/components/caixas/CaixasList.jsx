import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Landmark, TrendingUp, CreditCard, Edit, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

export default function CaixasList({ 
  items, 
  contas, 
  corretoras, 
  loteamentos,
  gateways = [],
  isLoading, 
  onEdit, 
  onDelete 
}) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
        <p className="text-gray-600 mt-4">Carregando...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">Nenhum caixa cadastrado</p>
          <p className="text-gray-500 text-sm mt-2">Clique em "Novo Caixa" para começar</p>
        </CardContent>
      </Card>
    );
  }

  const tiposIcones = {
    dinheiro: { icon: Wallet, label: "Dinheiro", color: "bg-green-100 text-green-700" },
    conta_bancaria: { icon: Landmark, label: "Conta Bancária", color: "bg-blue-100 text-blue-700" },
    corretora: { icon: TrendingUp, label: "Corretora", color: "bg-purple-100 text-purple-700" },
    gateway: { icon: CreditCard, label: "Gateway", color: "bg-orange-100 text-orange-700" },
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((caixa) => {
        const tipoConfig = tiposIcones[caixa.tipo] || tiposIcones.dinheiro;
        const IconeTipo = tipoConfig.icon;
        
        const conta = contas?.find(c => c.id === caixa.conta_id);
        const corretora = corretoras?.find(c => c.id === caixa.corretora_id);
        const loteamento = loteamentos?.find(l => l.id === caixa.loteamento_id);
        const gateway = gateways?.find(g => g.id === caixa.gateway_id);

        return (
          <Card key={caixa.id} className={`hover:shadow-xl transition-all ${
            caixa.eh_padrao ? 'border-[var(--wine-600)] border-2' : ''
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${tipoConfig.color}`}>
                    <IconeTipo className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{caixa.nome}</h3>
                    <Badge variant="outline" className="text-xs mt-1">
                      {tipoConfig.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Saldo */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Saldo Atual</p>
                <p className={`text-2xl font-bold ${
                  (caixa.saldo_atual || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  R$ {(caixa.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Detalhes */}
              <div className="space-y-2 text-sm mb-4">
                {caixa.tipo === 'conta_bancaria' && conta && (
                  <div>
                    <p className="text-gray-500">Conta:</p>
                    <p className="font-semibold">{conta.numero_conta}</p>
                  </div>
                )}

                {caixa.tipo === 'corretora' && corretora && (
                  <div>
                    <p className="text-gray-500">Corretora:</p>
                    <p className="font-semibold">{corretora.nome}</p>
                  </div>
                )}

                {caixa.tipo === 'gateway' && gateway && (
                  <div>
                    <p className="text-gray-500">Gateway:</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{gateway.nome_exibicao}</p>
                      <Badge variant="outline" className="text-xs">
                        {gateway.ambiente === 'producao' ? '🚀' : '🧪'}
                      </Badge>
                    </div>
                    {caixa.lancar_taxas_automaticamente && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Taxas automáticas
                      </div>
                    )}
                  </div>
                )}

                {loteamento && (
                  <div>
                    <p className="text-gray-500">Loteamento:</p>
                    <p className="font-semibold">{loteamento.nome}</p>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {caixa.ativo ? (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Ativo
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-700">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Inativo
                  </Badge>
                )}
                {caixa.eh_padrao && (
                  <Badge className="bg-[var(--wine-100)] text-[var(--wine-700)]">
                    ⭐ Padrão
                  </Badge>
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-[var(--wine-300)] text-[var(--wine-700)] hover:bg-[var(--wine-50)]"
                  onClick={() => onEdit(caixa)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => onDelete(caixa.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}