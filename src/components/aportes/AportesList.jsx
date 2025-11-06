import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle, Calendar, Building2, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  pendente: "bg-yellow-100 text-yellow-700 border-yellow-200",
  pago: "bg-green-100 text-green-700 border-green-200",
  atrasado: "bg-red-100 text-red-700 border-red-200",
  cancelado: "bg-gray-100 text-gray-700 border-gray-200",
};

const statusLabels = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

export default function AportesList({ items, socios, empreendimentos, isLoading, onEdit, onDelete, onUpdateStatus }) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-gray-500">Nenhum aporte cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  const getSocioNome = (socioId) => {
    const socio = socios.find(s => s.id === socioId);
    return socio ? socio.nome : "Desconhecido";
  };

  const getEmpreendimentoNome = (empId) => {
    const emp = empreendimentos.find(e => e.id === empId);
    return emp ? emp.nome : "Desconhecido";
  };

  const handleMarcarPago = (item) => {
    const hoje = new Date().toISOString().split('T')[0];
    onUpdateStatus(item.id, 'pago', hoje);
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const vencido = item.status === 'pendente' && isBefore(parseISO(item.data_vencimento), new Date());
        
        return (
          <Card 
            key={item.id} 
            className={`hover:shadow-xl transition-all duration-200 border-t-4 ${
              item.status === 'pago' 
                ? 'border-green-500' 
                : vencido 
                  ? 'border-red-500' 
                  : 'border-[var(--wine-400)]'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[var(--wine-700)] mb-1">
                    {format(parseISO(item.mes_referencia + "-01"), "MMMM 'de' yyyy", { locale: ptBR })}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <User className="w-4 h-4" />
                    <span>{getSocioNome(item.socio_id)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span className="line-clamp-1">{getEmpreendimentoNome(item.empreendimento_id)}</span>
                  </div>
                </div>
                <Badge className={statusColors[item.status]}>
                  {statusLabels[item.status]}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Valor</span>
                  <span className="text-xl font-bold text-[var(--wine-700)]">
                    R$ {item.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Vencimento</span>
                  <span className={vencido ? "text-red-600 font-semibold" : ""}>
                    {format(parseISO(item.data_vencimento), "dd/MM/yyyy")}
                  </span>
                </div>
                {item.data_pagamento && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Pagamento</span>
                    <span className="text-green-600 font-semibold">
                      {format(parseISO(item.data_pagamento), "dd/MM/yyyy")}
                    </span>
                  </div>
                )}
                {item.forma_pagamento && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Forma</span>
                    <span className="capitalize">{item.forma_pagamento}</span>
                  </div>
                )}
              </div>

              {item.observacoes && (
                <p className="text-sm text-gray-600 mb-4 p-2 bg-gray-50 rounded">{item.observacoes}</p>
              )}

              <div className="flex gap-2">
                {item.status !== 'pago' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarcarPago(item)}
                    className="flex-1 hover:bg-green-50 hover:text-green-700 hover:border-green-400"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Pago
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(item)}
                  className="flex-1 hover:bg-[var(--wine-100)] hover:text-[var(--wine-700)] hover:border-[var(--wine-400)]"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (window.confirm("Tem certeza que deseja excluir este aporte?")) {
                      onDelete(item.id);
                    }
                  }}
                  className="hover:bg-red-50 hover:text-red-700 hover:border-red-400"
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