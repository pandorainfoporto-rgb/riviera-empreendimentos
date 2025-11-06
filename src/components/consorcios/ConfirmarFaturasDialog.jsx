import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, X, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function ConfirmarFaturasDialog({ formData, faturas, cliente, unidade, onConfirm, onCancel, isProcessing }) {
  const totalFaturas = faturas.reduce((sum, f) => sum + f.valor_total, 0);
  const totalFundoReserva = faturas.reduce((sum, f) => sum + f.valor_fundo_reserva, 0);
  const totalFundoComum = faturas.reduce((sum, f) => sum + (f.valor_fundo_comum || 0), 0);
  const totalTaxaAdmin = faturas.reduce((sum, f) => sum + f.valor_taxa_administracao, 0);
  const totalEncargos = totalFundoReserva + totalFundoComum + totalTaxaAdmin;

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-[var(--wine-700)]">Confirmar Geração de Faturas</DialogTitle>
          <DialogDescription>
            {formData.eh_investimento_caixa ? (
              <>Cota de Investimento - Grupo {formData.grupo} Cota {formData.cota}</>
            ) : (
              <>{cliente?.nome} - {unidade?.codigo} - Grupo {formData.grupo} Cota {formData.cota}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total de Parcelas:</p>
                  <p className="text-lg font-bold text-gray-900">{faturas.length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Valor por Parcela:</p>
                  <p className="text-lg font-bold text-green-700">
                    R$ {formData.valor_parcela?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Encargos por Parcela:</p>
                  <p className="text-lg font-bold text-purple-600">
                    R$ {((faturas[0]?.valor_fundo_reserva || 0) + (faturas[0]?.valor_fundo_comum || 0) + (faturas[0]?.valor_taxa_administracao || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Total Geral:</p>
                  <p className="text-lg font-bold text-[var(--wine-700)]">
                    R$ {totalFaturas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo dos Totais */}
          <Card className="border-t-4 border-indigo-500">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Composição do Valor no Período</h4>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-gray-600 mb-1">Fundo Reserva</p>
                  <p className="text-xl font-bold text-orange-700">
                    R$ {totalFundoReserva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {formData.fundo_reserva_percentual}%
                  </Badge>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-gray-600 mb-1">Fundo Comum</p>
                  <p className="text-xl font-bold text-blue-700">
                    R$ {totalFundoComum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {formData.fundo_comum_percentual}%
                  </Badge>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-gray-600 mb-1">Taxa Admin</p>
                  <p className="text-xl font-bold text-purple-700">
                    R$ {totalTaxaAdmin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {formData.taxa_administracao_percentual}%
                  </Badge>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-gray-600 mb-1">Valor Total</p>
                  <p className="text-xl font-bold text-green-700">
                    R$ {totalFaturas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {faturas.length} parcelas
                  </Badge>
                </div>
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-600">Total de Encargos Inclusos no Período</p>
                <p className="text-lg font-bold text-gray-900">
                  R$ {totalEncargos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {faturas.map((fatura, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-[var(--wine-600)]" />
                          <span className="font-semibold">Parcela {fatura.numero_parcela}/{faturas.length}</span>
                          <span className="text-sm text-gray-600">
                            Venc: {format(parseISO(fatura.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Valor Total</p>
                            <p className="font-bold text-[var(--wine-700)]">R$ {fatura.valor_parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Fundo Reserva</p>
                            <p className="font-semibold text-orange-700">R$ {fatura.valor_fundo_reserva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Fundo Comum</p>
                            <p className="font-semibold text-blue-700">R$ {(fatura.valor_fundo_comum || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Taxa Admin</p>
                            <p className="font-semibold text-purple-700">R$ {fatura.valor_taxa_administracao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Encargos</p>
                            <p className="font-semibold text-gray-600">
                              R$ {(fatura.valor_fundo_reserva + (fatura.valor_fundo_comum || 0) + fatura.valor_taxa_administracao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isProcessing}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {isProcessing ? "Gerando..." : "Confirmar e Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}