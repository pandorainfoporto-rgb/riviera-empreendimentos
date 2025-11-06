import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, AlertCircle, CheckCircle, PiggyBank, User, Building2 } from "lucide-react";
import { format, parseISO, differenceInDays, isBefore } from "date-fns";
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
};

export default function ParcelasConsorciosList({ items, consorcios, clientes, unidades, isLoading, onPagar }) {
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Carregando...</div>;
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">Nenhuma parcela encontrada</p>
        </CardContent>
      </Card>
    );
  }

  const hoje = new Date();

  return (
    <div className="grid gap-4">
      {items.map((item) => {
        const consorcio = consorcios?.find(c => c.id === item.consorcio_id);
        const cliente = clientes?.find(c => c.id === consorcio?.cliente_id);
        const unidade = unidades?.find(u => u.id === consorcio?.unidade_id);
        
        // Determinar status real verificando se está atrasado
        let statusFinal = item.status;
        if (item.status === 'pendente') {
          try {
            const dataVenc = parseISO(item.data_vencimento);
            if (isBefore(dataVenc, hoje)) {
              statusFinal = 'atrasado';
            }
          } catch (error) {
            console.error('Erro ao processar data:', error);
          }
        }

        const config = statusConfig[statusFinal] || statusConfig.pendente;
        const Icon = config.icon;
        const ehInvestimento = consorcio?.eh_investimento_caixa;

        let dataVenc;
        let diasAtraso = 0;
        
        try {
          dataVenc = parseISO(item.data_vencimento);
          diasAtraso = statusFinal === 'atrasado' ? differenceInDays(hoje, dataVenc) : 0;
        } catch (error) {
          console.error('Erro ao processar data:', error);
          dataVenc = new Date();
        }

        return (
          <Card 
            key={item.id} 
            className={`hover:shadow-lg transition-shadow ${
              statusFinal === 'atrasado' ? 'border-l-4 border-red-500' : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-[var(--wine-700)]">
                      {ehInvestimento ? (
                        <span className="flex items-center gap-2">
                          <PiggyBank className="w-5 h-5 text-blue-600" />
                          Investimento Caixa
                        </span>
                      ) : (
                        cliente?.nome || 'Cliente desconhecido'
                      )}
                    </h3>
                    <Badge className={config.color}>
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                    <Badge variant="outline" className="border-[var(--grape-600)] text-[var(--grape-700)]">
                      Parcela {item.numero_parcela}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {ehInvestimento ? 'Sem unidade vinculada' : (unidade?.codigo || 'Unidade desconhecida')}
                    </span>
                    <span>Grupo: {consorcio?.grupo || 'N/A'}</span>
                    <span>Cota: {consorcio?.cota || 'N/A'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[var(--wine-700)]">
                    R$ {(item.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Valor Parcela:</span>
                    <span className="font-semibold">R$ {(item.valor_parcela || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {(item.valor_fundo_reserva || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fundo Reserva:</span>
                      <span className="font-semibold">R$ {(item.valor_fundo_reserva || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {(item.valor_fundo_comum || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fundo Comum:</span>
                      <span className="font-semibold">R$ {(item.valor_fundo_comum || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {(item.valor_taxa_administracao || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxa Admin:</span>
                      <span className="font-semibold">R$ {(item.valor_taxa_administracao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Vencimento: {format(dataVenc, "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                  {item.data_pagamento && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        Pago em: {format(parseISO(item.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {statusFinal === 'atrasado' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Atrasado há <strong>{diasAtraso} dia(s)</strong>
                  </p>
                </div>
              )}

              {item.observacoes && (
                <p className="text-xs text-gray-500 mb-4 p-2 bg-gray-50 rounded">
                  {item.observacoes}
                </p>
              )}

              {(statusFinal === 'pendente' || statusFinal === 'atrasado') && (
                <Button
                  onClick={() => onPagar({ ...item, status: statusFinal })}
                  className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Pagar Parcela
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}