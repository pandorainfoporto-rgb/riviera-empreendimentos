import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const categoriasLabels = {
  pagamento_consorcio: "Pagamento Consórcio",
  juros_consorcio: "Juros Consórcio",
  multa_consorcio: "Multa Consórcio",
  pagamento_fornecedor: "Pagamento Fornecedor",
  investimento: "Investimento",
  marketing: "Marketing",
  operacional: "Operacional",
  materiais_construcao: "Materiais de Construção",
  mao_de_obra: "Mão de Obra",
  equipamentos: "Equipamentos",
  servicos_especializados: "Serviços Especializados",
  impostos_taxas: "Impostos e Taxas",
  administrativo: "Administrativo",
  outros: "Outros",
};

export default function OrcamentosList({ items, loteamentos, calcularGastoReal, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
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
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum orçamento cadastrado para este período</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {items.map((item) => {
        const loteamento = loteamentos.find(l => l.id === item.loteamento_id);
        const gastoReal = calcularGastoReal(item.categoria, item.mes_referencia, item.loteamento_id);
        const percentualGasto = (gastoReal / item.valor_orcado) * 100;
        const saldo = item.valor_orcado - gastoReal;
        const temAlerta = percentualGasto >= item.limite_alerta_percentual;
        const excedeu = percentualGasto > 100;
        
        // Determinar cor da barra de progresso
        let progressColor = "bg-green-600";
        if (excedeu) {
          progressColor = "bg-red-600";
        } else if (temAlerta) {
          progressColor = "bg-amber-600";
        }

        // Formato do mês
        const [ano, mes] = item.mes_referencia.split('-');
        const dataRef = new Date(parseInt(ano), parseInt(mes) - 1, 1);
        const mesFormatado = format(dataRef, "MMMM yyyy", { locale: ptBR });

        return (
          <Card key={item.id} className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-[var(--wine-700)] text-lg">
                    {categoriasLabels[item.categoria]}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {mesFormatado.charAt(0).toUpperCase() + mesFormatado.slice(1)}
                  </p>
                  {loteamento && (
                    <p className="text-xs text-gray-400 mt-1">{loteamento.nome}</p>
                  )}
                </div>
                {temAlerta && (
                  <Badge className={`${excedeu ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {excedeu ? 'Excedido' : 'Alerta'}
                  </Badge>
                )}
                {!temAlerta && percentualGasto > 0 && (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    OK
                  </Badge>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Orçado:</span>
                  <span className="font-semibold text-gray-900">
                    R$ {item.valor_orcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Gasto:</span>
                  <span className={`font-semibold ${excedeu ? 'text-red-600' : 'text-gray-900'}`}>
                    R$ {gastoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm border-t pt-2">
                  <span className="text-gray-600">Saldo:</span>
                  <span className={`font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {Math.abs(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Progresso</span>
                    <span className="font-semibold">{percentualGasto.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${progressColor} transition-all duration-300`}
                      style={{ width: `${Math.min(percentualGasto, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {item.observacoes && (
                <p className="text-xs text-gray-500 italic mb-3">{item.observacoes}</p>
              )}

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
                  onClick={() => onDelete(item.id)}
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