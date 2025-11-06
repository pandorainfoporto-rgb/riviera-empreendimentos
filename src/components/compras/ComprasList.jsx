import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, DollarSign, Trash2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  pendente: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
  processada: {
    label: "Processada",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  cancelada: {
    label: "Cancelada",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};

export default function ComprasList({ items, fornecedores, unidades, isLoading, onDelete }) {
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Carregando...</div>;
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhuma compra registrada</p>
          <p className="text-sm text-gray-400 mt-2">Importe um XML ou cadastre uma compra manual</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => {
        const fornecedor = fornecedores.find(f => f.id === item.fornecedor_id);
        const unidade = unidades.find(u => u.id === item.unidade_id);
        const config = statusConfig[item.status];
        const Icon = config.icon;

        return (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-6 h-6 text-[var(--wine-600)]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-[var(--wine-700)]">
                          NF-e {item.numero_nota}
                          {item.serie && ` - Série ${item.serie}`}
                        </h3>
                        <Badge className={config.color}>
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{fornecedor?.nome}</p>
                    </div>
                  </div>

                  {item.chave_acesso && (
                    <p className="text-xs text-gray-500 font-mono mb-3">
                      Chave: {item.chave_acesso}
                    </p>
                  )}

                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500 text-xs">Emissão</p>
                        <p className="font-semibold">{format(parseISO(item.data_emissao), 'dd/MM/yyyy', { locale: ptBR })}</p>
                      </div>
                    </div>

                    {item.data_entrada && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500 text-xs">Entrada</p>
                          <p className="font-semibold">{format(parseISO(item.data_entrada), 'dd/MM/yyyy', { locale: ptBR })}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500 text-xs">Valor Total</p>
                        <p className="font-bold text-[var(--wine-700)]">
                          R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {unidade && (
                      <div>
                        <p className="text-gray-500 text-xs">Destino</p>
                        <p className="font-semibold">{unidade.codigo}</p>
                      </div>
                    )}
                  </div>

                  {item.observacoes && (
                    <p className="text-sm text-gray-600 mt-3 italic">{item.observacoes}</p>
                  )}

                  <div className="flex gap-2 mt-4 flex-wrap">
                    {item.gerar_contas_pagar && (
                      <Badge variant="outline" className="text-xs">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Contas geradas
                      </Badge>
                    )}
                    {item.atualizar_estoque && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Estoque atualizado
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onDelete(item.id)}
                    className="hover:bg-red-100 hover:border-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}