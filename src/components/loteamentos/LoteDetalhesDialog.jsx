import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, Ruler, DollarSign, Calendar, User, FileText, 
  CheckCircle2, Clock, Building2, TrendingUp
} from "lucide-react";
import moment from "moment";

const STATUS_COLORS = {
  disponivel: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-500' },
  reservado: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-500' },
  em_negociacao: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500' },
  vendido: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-500' },
  indisponivel: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-500' },
};

const STATUS_LABELS = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  em_negociacao: 'Em Negociação',
  vendido: 'Vendido',
  indisponivel: 'Indisponível',
};

export default function LoteDetalhesDialog({ lote, open, onClose }) {
  const { data: cliente } = useQuery({
    queryKey: ['cliente', lote?.cliente_id],
    queryFn: () => base44.entities.Cliente.get(lote.cliente_id),
    enabled: !!lote?.cliente_id,
  });

  const { data: negociacao } = useQuery({
    queryKey: ['negociacao', lote?.negociacao_id],
    queryFn: () => base44.entities.Negociacao.get(lote.negociacao_id),
    enabled: !!lote?.negociacao_id,
  });

  const { data: unidade } = useQuery({
    queryKey: ['unidade', lote?.unidade_id],
    queryFn: () => base44.entities.Unidade.get(lote.unidade_id),
    enabled: !!lote?.unidade_id,
  });

  if (!lote) return null;

  const statusInfo = STATUS_COLORS[lote.status] || STATUS_COLORS.disponivel;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Lote {lote.numero}</DialogTitle>
            <Badge 
              className={`${statusInfo.bg} ${statusInfo.text} ${statusInfo.border} border-2 text-sm px-3 py-1`}
            >
              {STATUS_LABELS[lote.status]}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {lote.quadra && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Quadra</p>
                    <p className="font-semibold">{lote.quadra}</p>
                  </div>
                </div>
              )}

              {lote.area && (
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Área</p>
                    <p className="font-semibold">{lote.area.toFixed(2)} m²</p>
                  </div>
                </div>
              )}

              {lote.matricula && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Matrícula</p>
                    <p className="font-semibold">{lote.matricula}</p>
                  </div>
                </div>
              )}

              {lote.valor_total && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Valor Total</p>
                    <p className="font-bold text-green-700">
                      R$ {lote.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}

              {lote.valor_m2 && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Valor por m²</p>
                    <p className="font-semibold text-blue-700">
                      R$ {lote.valor_m2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medidas */}
          {(lote.frente || lote.fundo || lote.lado_esquerdo || lote.lado_direito) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ruler className="w-5 h-5" />
                  Medidas do Lote
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {lote.frente && (
                  <div>
                    <p className="text-xs text-gray-500">Frente</p>
                    <p className="font-semibold">{lote.frente} m</p>
                  </div>
                )}
                {lote.fundo && (
                  <div>
                    <p className="text-xs text-gray-500">Fundo</p>
                    <p className="font-semibold">{lote.fundo} m</p>
                  </div>
                )}
                {lote.lado_esquerdo && (
                  <div>
                    <p className="text-xs text-gray-500">Lado Esquerdo</p>
                    <p className="font-semibold">{lote.lado_esquerdo} m</p>
                  </div>
                )}
                {lote.lado_direito && (
                  <div>
                    <p className="text-xs text-gray-500">Lado Direito</p>
                    <p className="font-semibold">{lote.lado_direito} m</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Características */}
          {lote.caracteristicas && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Características
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {lote.caracteristicas.esquina && (
                    <Badge variant="outline">Esquina</Badge>
                  )}
                  {lote.caracteristicas.aclive && (
                    <Badge variant="outline">Aclive</Badge>
                  )}
                  {lote.caracteristicas.declive && (
                    <Badge variant="outline">Declive</Badge>
                  )}
                  {lote.caracteristicas.plano && (
                    <Badge variant="outline">Plano</Badge>
                  )}
                  {lote.caracteristicas.nascente && (
                    <Badge variant="outline">Nascente: {lote.caracteristicas.nascente}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cliente/Negociação */}
          {(cliente || negociacao || unidade) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações da Venda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cliente && (
                  <div>
                    <p className="text-xs text-gray-500">Cliente</p>
                    <p className="font-semibold">{cliente.nome}</p>
                    {cliente.telefone && (
                      <p className="text-sm text-gray-600">{cliente.telefone}</p>
                    )}
                  </div>
                )}

                {negociacao && (
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Valor Negociação</p>
                      <p className="font-bold text-green-700">
                        R$ {negociacao.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <Badge variant="outline">{negociacao.status}</Badge>
                    </div>
                  </div>
                )}

                {unidade && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500">Unidade Criada</p>
                    <p className="font-semibold">{unidade.codigo || 'Sem código'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {lote.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {lote.observacoes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Histórico */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Criado em:</span>
                <span className="font-semibold">
                  {moment(lote.created_date).format('DD/MM/YYYY HH:mm')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Última atualização:</span>
                <span className="font-semibold">
                  {moment(lote.updated_date).format('DD/MM/YYYY HH:mm')}
                </span>
              </div>
              {lote.created_by && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Criado por:</span>
                  <span className="font-semibold">{lote.created_by}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}