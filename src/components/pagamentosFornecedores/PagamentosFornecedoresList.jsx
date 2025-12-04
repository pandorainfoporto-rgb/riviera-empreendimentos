import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, AlertCircle, CheckCircle, Ban } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  pendente: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: AlertCircle,
  },
  atrasado: {
    label: "Atrasado",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: AlertCircle,
  },
  pago: {
    label: "Pago",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: Ban,
  },
};

export default function PagamentosFornecedoresList({ items, fornecedores, consorcios, unidades, isLoading, userRole, onPagar, onCancelar, onVisualizar, onEstornar }) {
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Carregando...</div>;
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">Nenhum pagamento encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => {
        const fornecedor = fornecedores?.find(f => f.id === item.fornecedor_id);
        const unidade = unidades?.find(u => u.id === item.unidade_id);
        const config = statusConfig[item.status] || statusConfig.pendente;
        const Icon = config.icon;

        const hoje = new Date();
        let dataVenc;
        let diasAtraso = 0;
        
        try {
          dataVenc = parseISO(item.data_vencimento);
          diasAtraso = item.status === 'atrasado' ? differenceInDays(hoje, dataVenc) : 0;
        } catch (error) {
          console.error('Erro ao processar data:', error);
          dataVenc = new Date();
        }

        return (
          <Card key={item.id} className={`hover:shadow-lg transition-shadow ${item.status === 'atrasado' ? 'border-l-4 border-red-500' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[var(--wine-700)]">{fornecedor?.nome || 'Fornecedor desconhecido'}</h3>
                    <Badge className={config.color}>
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{unidade?.codigo || 'Unidade desconhecida'}</p>
                  {item.descricao && (
                    <p className="text-sm text-gray-500 mt-1">{item.descricao}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[var(--wine-700)]">
                    R$ {(item.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {item.status === 'pago' && item.valor_total_pago && item.valor_total_pago !== item.valor && (
                    <p className="text-xs text-gray-500">
                      Pago: R$ {(item.valor_total_pago || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Vencimento: {format(dataVenc, "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
                {item.data_pagamento && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Pago em: {format(parseISO(item.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                )}
              </div>

              {item.status === 'atrasado' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Atrasado há <strong>{diasAtraso} dia(s)</strong>
                  </p>
                </div>
              )}

              {((item.valor_juros || 0) > 0 || (item.valor_multa || 0) > 0) && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 space-y-1">
                  {(item.valor_juros || 0) > 0 && (
                    <p className="text-xs text-orange-700">
                      Juros aplicados: R$ {(item.valor_juros || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  {(item.valor_multa || 0) > 0 && (
                    <p className="text-xs text-orange-700">
                      Multa aplicada: R$ {(item.valor_multa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              )}

              {item.numero_nota && (
                <p className="text-xs text-gray-500 mb-4">NF: {item.numero_nota}</p>
              )}

              <div className="flex gap-2 flex-wrap">
                {(item.status === 'pendente' || item.status === 'atrasado') && (
                  <Button
                    onClick={() => onPagar(item)}
                    className="flex-1 bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pagar
                  </Button>
                )}
                
                {onVisualizar && (
                  <Button
                    variant="outline"
                    onClick={() => onVisualizar(item)}
                  >
                    Visualizar
                  </Button>
                )}

                {item.status === 'pago' && onEstornar && userRole === 'admin' && (
                  <Button
                    variant="outline"
                    onClick={() => onEstornar(item)}
                    className="hover:bg-orange-50 hover:border-orange-400 hover:text-orange-700"
                  >
                    Estornar
                  </Button>
                )}
                
                {(item.status === 'pendente' || item.status === 'atrasado') && userRole === 'admin' && (
                  <Button
                    variant="outline"
                    onClick={() => onCancelar(item)}
                    className="hover:bg-red-50 hover:border-red-400 hover:text-red-700"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}