import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, Calendar, User, Building, FileText, CheckCircle, AlertCircle, Ban } from "lucide-react";

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
  atrasado: { label: "Atrasado", color: "bg-red-100 text-red-700", icon: AlertCircle },
  pago: { label: "Pago", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-700", icon: Ban },
};

export default function VisualizarPagamentoDialog({ pagamento, fornecedor, consorcio, unidade, onClose }) {
  const config = statusConfig[pagamento.status] || statusConfig.pendente;
  const Icon = config.icon;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--wine-700)]">
            <FileText className="w-5 h-5" />
            Detalhes do Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={config.color}>
              <Icon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
            <span className="text-2xl font-bold text-[var(--wine-700)]">
              R$ {(pagamento.valor || pagamento.valor_parcela || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="grid gap-3 bg-gray-50 p-4 rounded-lg">
            {fornecedor && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Fornecedor:</span>
                <span className="font-medium">{fornecedor.nome}</span>
              </div>
            )}

            {consorcio && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Consórcio:</span>
                <span className="font-medium">Grupo {consorcio.grupo} / Cota {consorcio.cota}</span>
              </div>
            )}

            {unidade && (
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Unidade:</span>
                <span className="font-medium">{unidade.codigo}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Vencimento:</span>
              <span className="font-medium">{formatDate(pagamento.data_vencimento)}</span>
            </div>

            {pagamento.data_pagamento && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Pago em:</span>
                <span className="font-medium text-green-700">{formatDate(pagamento.data_pagamento)}</span>
              </div>
            )}

            {pagamento.forma_pagamento && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Forma:</span>
                <span className="font-medium capitalize">{pagamento.forma_pagamento}</span>
              </div>
            )}

            {pagamento.numero_nota && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">NF:</span>
                <span className="font-medium">{pagamento.numero_nota}</span>
              </div>
            )}
          </div>

          {(pagamento.valor_juros > 0 || pagamento.valor_multa > 0) && (
            <div className="bg-orange-50 p-3 rounded-lg space-y-1">
              {pagamento.valor_juros > 0 && (
                <p className="text-sm text-orange-700">
                  Juros: R$ {pagamento.valor_juros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              )}
              {pagamento.valor_multa > 0 && (
                <p className="text-sm text-orange-700">
                  Multa: R$ {pagamento.valor_multa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              )}
              {pagamento.valor_total_pago && (
                <p className="text-sm font-bold text-orange-800 pt-1 border-t border-orange-200">
                  Total pago: R$ {pagamento.valor_total_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          )}

          {pagamento.descricao && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Descrição:</p>
              <p className="text-sm">{pagamento.descricao}</p>
            </div>
          )}

          {pagamento.arquivo_boleto && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <a 
                href={pagamento.arquivo_boleto} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Ver boleto anexado
              </a>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}