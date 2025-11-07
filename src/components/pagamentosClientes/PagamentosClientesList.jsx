import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Edit, X, Calendar, AlertCircle,
  CheckCircle2, Clock, CreditCard, Home, Eye
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PagamentosClientesList({
  items = [],
  clientes = [],
  unidades = [],
  onReceber,
  onEditar,
  onVisualizarDetalhes,
  isLoading,
}) {
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');

  // Placeholder for filtering logic
  const pagamentosFiltrados = items;

  const statusColors = {
    pendente: "bg-yellow-100 text-yellow-800 border-yellow-300",
    pago: "bg-green-100 text-green-800 border-green-300",
    parcial: "bg-blue-100 text-blue-800 border-blue-300",
    atrasado: "bg-red-100 text-red-800 border-red-300",
    cancelado: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const statusLabels = {
    pendente: "Pendente",
    pago: "Pago",
    parcial: "Parcial",
    atrasado: "Atrasado",
    cancelado: "Cancelado",
  };

  const formasPagamentoLabels = {
    pix: "PIX",
    boleto: "Boleto",
    credit_card: "Cartão de Crédito",
    debit_card: "Cartão de Débito",
    dinheiro: "Dinheiro",
    transferencia: "Transferência",
    cheque: "Cheque",
    multiplas: "Múltiplas Formas",
    outros: "Outros",
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {pagamentosFiltrados.map((pagamento) => {
          const cliente = clientes?.find(c => c.id === pagamento.cliente_id);
          const unidade = unidades?.find(u => u.id === pagamento.unidade_id);
          const isAtrasado = pagamento.status === 'atrasado';
          const isPago = pagamento.status === 'pago';
          const isParcial = pagamento.status === 'parcial';
          const hasMultiplasFormas = isPago && pagamento.forma_pagamento === 'multiplas' && pagamento.formas_pagamento?.length > 0;

          return (
            <Card key={pagamento.id} className={`${isAtrasado ? 'border-red-300 border-2' : ''}`}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isPago ? 'bg-green-100' : isAtrasado ? 'bg-red-100' : 'bg-yellow-100'}`}>
                        {isPago ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : isAtrasado ? (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{cliente?.nome || 'Cliente não encontrado'}</h3>
                          <Badge className={statusColors[pagamento.status] || statusColors.pendente}>
                            {statusLabels[pagamento.status] || statusLabels.pendente}
                          </Badge>
                          {pagamento.tipo && (
                            <Badge variant="outline" className="text-xs">
                              {pagamento.tipo}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Home className="w-3 h-3" />
                          {unidade?.codigo || 'Unidade não encontrada'}
                        </p>

                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">Vencimento</p>
                            <p className="font-medium">
                              {pagamento.data_vencimento ? format(parseISO(pagamento.data_vencimento), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                            </p>
                          </div>
                          {isPago && pagamento.data_pagamento && (
                            <div>
                              <p className="text-gray-500 text-xs">Pagamento</p>
                              <p className="font-medium text-green-600">
                                {format(parseISO(pagamento.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Múltiplas Formas de Pagamento */}
                        {hasMultiplasFormas && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              Recebido em múltiplas formas:
                            </p>
                            <div className="space-y-1">
                              {pagamento.formas_pagamento.map((forma, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-blue-700">
                                      {formasPagamentoLabels[forma.forma] || forma.forma}
                                    </span>
                                    {forma.observacoes && (
                                      <span className="text-gray-500">({forma.observacoes})</span>
                                    )}
                                  </div>
                                  <span className="font-mono font-semibold text-blue-900">
                                    R$ {(forma.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Forma Única */}
                        {isPago && !hasMultiplasFormas && pagamento.forma_pagamento && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              <CreditCard className="w-3 h-3 mr-1" />
                              {formasPagamentoLabels[pagamento.forma_pagamento] || pagamento.forma_pagamento}
                            </Badge>
                          </div>
                        )}

                        {pagamento.observacoes && (
                          <p className="text-xs text-gray-600 mt-2 italic">
                            💬 {pagamento.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Valor</p>
                      <p className="text-xl font-bold text-gray-900">
                        R$ {(pagamento.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {isPago && pagamento.valor_total_recebido && pagamento.valor_total_recebido !== pagamento.valor && (
                        <p className="text-xs text-gray-600">
                          Total recebido: R$ {pagamento.valor_total_recebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {!isPago && !isParcial && onReceber && (
                        <Button
                          onClick={() => onReceber(pagamento)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Receber
                        </Button>
                      )}
                      {onVisualizarDetalhes && (
                        <Button
                          onClick={() => onVisualizarDetalhes(pagamento)}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      )}
                      {onEditar && (
                        <Button
                          onClick={() => onEditar(pagamento)}
                          size="sm"
                          variant="ghost"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {pagamentosFiltrados.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum pagamento encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}