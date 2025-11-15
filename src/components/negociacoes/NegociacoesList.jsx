import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Calendar, DollarSign, User, Building2, CheckCircle2, List, FileText, CheckSquare, Flag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  ativa: "bg-green-100 text-green-700 border-green-200",
  aguardando_assinatura_contrato: "bg-yellow-100 text-yellow-700 border-yellow-200",
  contrato_assinado: "bg-blue-100 text-blue-700 border-blue-200",
  finalizada: "bg-purple-100 text-purple-700 border-purple-200",
  cancelada: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels = {
  ativa: "Ativa",
  aguardando_assinatura_contrato: "Aguardando Assinatura",
  contrato_assinado: "Contrato Assinado",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

export default function NegociacoesList({ items, clientes, unidades, isLoading, onEdit, onDelete, onGerarParcelas, onGerarContrato, onAprovarContrato, onAlterarStatus }) {
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

  if (!items || items.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-gray-500">Nenhuma negociação cadastrada</p>
        </CardContent>
      </Card>
    );
  }

  const getClienteNome = (clienteId) => {
    if (!clientes || !clienteId) return "Desconhecido";
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nome : "Desconhecido";
  };

  const getUnidadeCodigo = (unidadeId) => {
    if (!unidades || !unidadeId) return "Desconhecida";
    const unidade = unidades.find(u => u.id === unidadeId);
    return unidade ? unidade.codigo : "Desconhecida";
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const podeEditar = item.status !== 'finalizada';
        
        return (
          <Card 
            key={item.id} 
            className={`hover:shadow-xl transition-all duration-200 border-t-4 ${
              item.status === 'ativa' 
                ? 'border-green-500' 
                : item.status === 'aguardando_assinatura_contrato'
                  ? 'border-yellow-500'
                  : item.status === 'contrato_assinado'
                    ? 'border-blue-500'
                    : item.status === 'finalizada'
                      ? 'border-purple-500'
                      : 'border-red-500'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-[var(--wine-500)]" />
                    <h3 className="text-lg font-bold text-[var(--wine-700)]">
                      {getClienteNome(item.cliente_id)}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Building2 className="w-4 h-4" />
                    <span className="line-clamp-1">{getUnidadeCodigo(item.unidade_id)}</span>
                  </div>
                </div>
                <Badge className={statusColors[item.status] || "bg-gray-100 text-gray-700 border-gray-200"}>
                  {statusLabels[item.status] || item.status}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)] rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Valor Total</span>
                    <span className="text-xl font-bold text-[var(--wine-700)]">
                      R$ {(item.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {item.valor_entrada > 0 && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Entrada</span>
                      <span className="font-semibold text-green-700">
                        R$ {(item.valor_entrada || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Parcelas Entrada</p>
                    <p className="font-semibold">{item.quantidade_parcelas_entrada || 0}x</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Parcelas Mensais</p>
                    <p className="font-semibold">{item.quantidade_parcelas_mensais || 0}x</p>
                  </div>
                </div>

                {item.valor_parcela_mensal > 0 && (
                  <div className="flex justify-between items-center text-sm p-2 bg-blue-50 rounded">
                    <span className="text-blue-700">Valor da Parcela</span>
                    <span className="font-semibold text-blue-900">
                      R$ {(item.valor_parcela_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {item.data_prevista_entrega && (
                  <div className="flex justify-between items-center text-sm p-2 bg-purple-50 rounded">
                    <span className="text-purple-700">Entrega Prevista</span>
                    <span className="font-semibold text-purple-900">
                      {format(parseISO(item.data_prevista_entrega), "dd/MM/yyyy")}
                    </span>
                  </div>
                )}

                {item.tipo_correcao && item.tipo_correcao !== 'nenhuma' && item.percentual_correcao > 0 && (
                  <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                    <DollarSign className="w-3 h-3" />
                    <span>
                      Correção {item.tipo_correcao === 'mensal' ? 'mensal' : 'anual'}: {item.percentual_correcao}%
                      {item.tabela_correcao && item.tabela_correcao !== 'nenhuma' && item.tabela_correcao !== 'personalizada' && 
                        ` (${item.tabela_correcao.toUpperCase()})`
                      }
                    </span>
                  </div>
                )}

                {item.data_inicio && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Início
                    </span>
                    <span className="font-medium">
                      {format(parseISO(item.data_inicio), "dd/MM/yyyy")}
                    </span>
                  </div>
                )}

                {item.parcelas_geradas && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Parcelas já geradas</span>
                  </div>
                )}
              </div>

              {item.observacoes && (
                <p className="text-sm text-gray-600 mb-4 p-2 bg-gray-50 rounded line-clamp-2">{item.observacoes}</p>
              )}

              <div className="flex gap-2 flex-wrap">
                {!item.contrato_gerado && item.status === 'ativa' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGerarContrato(item)}
                    className="flex-1 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-400"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Gerar Contrato
                  </Button>
                )}
                
                {item.contrato_gerado && item.status === 'aguardando_assinatura_contrato' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAprovarContrato(item)}
                    className="flex-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Aprovar Contrato
                  </Button>
                )}

                {!item.parcelas_geradas && (item.status === 'ativa' || item.status === 'contrato_assinado') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGerarParcelas(item)}
                    className="flex-1 hover:bg-green-50 hover:text-green-700 hover:border-green-400"
                  >
                    <List className="w-4 h-4 mr-2" />
                    Gerar Parcelas
                  </Button>
                )}

                {podeEditar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(item)}
                    className="flex-1 hover:bg-[var(--wine-100)] hover:text-[var(--wine-700)] hover:border-[var(--wine-400)]"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}

                {item.status !== 'finalizada' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAlterarStatus(item)}
                    className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-400"
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (window.confirm("Tem certeza que deseja excluir esta negociação?")) {
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