
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, differenceInDays, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

const statusLabels = {
  ativo: { label: "Ativo", color: "bg-green-100 text-green-700 border-green-200" },
  resgatado: { label: "Resgatado", color: "bg-blue-100 text-blue-700 border-blue-200" },
  vencido: { label: "Vencido", color: "bg-orange-100 text-orange-700 border-orange-200" },
};

export default function InvestimentosList({ items, tiposAtivos, corretoras, bancos, empreendimentos, isLoading, onEdit, onDelete, calcularValorFuturo }) {
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
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">Nenhum investimento cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const tipoAtivo = tiposAtivos.find(t => t.id === item.tipo_ativo_id);
        const corretora = corretoras.find(c => c.id === item.corretora_id);
        const banco = bancos.find(b => b.id === item.banco_id);
        const empreendimento = empreendimentos.find(e => e.id === item.empreendimento_id);
        
        const calculo = calcularValorFuturo(item);
        const hoje = new Date();
        const dataVencimento = item.data_vencimento ? parseISO(item.data_vencimento) : null;
        const diasRestantes = dataVencimento ? differenceInDays(dataVencimento, hoje) : null;
        
        const progressoTempo = dataVencimento ? 
          ((calculo.mesesDecorridos / differenceInMonths(dataVencimento, parseISO(item.data_aplicacao))) * 100) : 0;

        return (
          <Card key={item.id} className="hover:shadow-xl transition-all duration-200 border-t-4 border-blue-400">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--wine-700)]">{item.nome}</h3>
                    {tipoAtivo && (
                      <p className="text-sm text-gray-500">{tipoAtivo.nome}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <Badge className={statusLabels[item.status]?.color || statusLabels.ativo.color}>
                  {statusLabels[item.status]?.label || "Ativo"}
                </Badge>

                <div className="bg-gradient-to-r from-gray-50 to-white p-3 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Valor Aplicado:</span>
                    <span className="font-semibold">R$ {item.valor_aplicado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rendimento Líquido:</span>
                    <span className="font-semibold text-green-600">+R$ {calculo.rendimentoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-gray-600">Valor Atual:</span>
                    <span className="font-bold text-blue-700">R$ {calculo.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {item.data_vencimento && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progresso</span>
                      <span>{diasRestantes > 0 ? `${diasRestantes} dias restantes` : 'Vencido'}</span>
                    </div>
                    <Progress value={progressoTempo} className="h-2" />
                  </div>
                )}

                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>Aplicado em: {format(parseISO(item.data_aplicacao), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                  {item.data_vencimento && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>Vencimento: {format(parseISO(item.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3 h-3" />
                    <span>Rentabilidade: {item.taxa_rendimento_mensal}% a.m.</span>
                  </div>
                  {(corretora || banco) && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{corretora?.nome || banco?.nome}</span>
                    </div>
                  )}
                  {empreendimento && (
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--wine-600)]">{empreendimento.nome}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
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
                    if (window.confirm("Tem certeza que deseja excluir este investimento?")) {
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
