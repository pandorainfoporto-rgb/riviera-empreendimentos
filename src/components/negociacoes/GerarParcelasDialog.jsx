
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";
import { addMonths, format, setDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner"; // Assuming sonner is used for toasts

export default function GerarParcelasDialog({ negociacao, cliente, unidade, onClose, onSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState(null);

  const calcularParcelas = () => {
    const parcelas = [];
    const dataInicio = new Date(negociacao.data_inicio);
    
    // Gerar parcelas da entrada
    if (negociacao.valor_entrada > 0 && negociacao.quantidade_parcelas_entrada > 0) {
      const valorParcelaEntrada = negociacao.valor_entrada / negociacao.quantidade_parcelas_entrada;
      
      for (let i = 0; i < negociacao.quantidade_parcelas_entrada; i++) {
        const dataVencimento = setDate(addMonths(dataInicio, i), negociacao.dia_vencimento);
        parcelas.push({
          tipo: 'entrada',
          numero: i + 1,
          valor: valorParcelaEntrada,
          data_vencimento: format(dataVencimento, 'yyyy-MM-dd'),
        });
      }
    }
    
    // Gerar parcelas mensais
    const inicioMensais = negociacao.quantidade_parcelas_entrada || 0;
    let valorParcelaMensal = negociacao.valor_parcela_mensal;
    
    if (negociacao.quantidade_parcelas_mensais > 0) {
      for (let i = 0; i < negociacao.quantidade_parcelas_mensais; i++) {
        const mesAtual = inicioMensais + i;
        const dataVencimento = setDate(addMonths(dataInicio, mesAtual), negociacao.dia_vencimento);
        
        // Aplicar correção ANTES de adicionar a parcela
        if (negociacao.tipo_correcao === 'mensal' && negociacao.percentual_correcao > 0 && i > 0) {
          // Correção mensal: aplica a cada mês
          valorParcelaMensal = valorParcelaMensal * (1 + negociacao.percentual_correcao / 100);
        } else if (negociacao.tipo_correcao === 'anual' && negociacao.percentual_correcao > 0 && negociacao.tabela_correcao !== 'nenhuma') {
          // Correção anual: aplica apenas no mês de aniversário da negociação
          if (i > 0 && i % 12 === 0) {
            valorParcelaMensal = valorParcelaMensal * (1 + negociacao.percentual_correcao / 100);
          }
        }
        
        parcelas.push({
          tipo: 'parcela',
          numero: i + 1,
          valor: valorParcelaMensal,
          data_vencimento: format(dataVencimento, 'yyyy-MM-dd'),
        });
      }
    }
    
    return parcelas;
  };

  const handlePreview = () => {
    const parcelas = calcularParcelas();
    setPreview(parcelas);
  };

  const handleGerarParcelas = async () => {
    setIsProcessing(true);
    try {
      const parcelas = calcularParcelas();
      
      // Criar as parcelas no banco de dados
      const parcelasParaCriar = parcelas.map((parcela) => ({
        cliente_id: negociacao.cliente_id,
        unidade_id: negociacao.unidade_id, // CORRIGIDO: usar unidade_id ao invés de empreendimento_id
        negociacao_id: negociacao.id,
        valor: parcela.valor,
        data_vencimento: parcela.data_vencimento,
        status: 'pendente',
        tipo: parcela.tipo,
        observacoes: `${parcela.tipo === 'entrada' ? 'Entrada' : 'Parcela'} ${parcela.numero}/${parcela.tipo === 'entrada' ? negociacao.quantidade_parcelas_entrada : negociacao.quantidade_parcelas_mensais} - Unidade ${unidade?.codigo || 'N/A'}`,
      }));

      await base44.entities.PagamentoCliente.bulkCreate(parcelasParaCriar);
      
      // Atualizar a negociação marcando as parcelas como geradas
      await base44.entities.Negociacao.update(negociacao.id, {
        parcelas_geradas: true,
      });

      onSuccess();
      toast.success(`${parcelas.length} parcelas geradas com sucesso!`);
    } catch (error) {
      console.error("Erro ao gerar parcelas:", error);
      toast.error("Erro ao gerar parcelas: " + (error.message || "Erro desconhecido"));
    }
    setIsProcessing(false);
  };

  React.useEffect(() => {
    handlePreview();
  }, []);

  const totalParcelas = preview?.length || 0;
  const totalValor = preview?.reduce((sum, p) => sum + p.valor, 0) || 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--wine-700)]">Gerar Parcelas da Negociação</DialogTitle>
          <DialogDescription>
            {cliente?.nome} - Unidade: {unidade?.codigo || 'N/A'}
          </DialogDescription>
        </DialogHeader>

        {negociacao.parcelas_geradas && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              As parcelas desta negociação já foram geradas anteriormente. Gerar novamente criará parcelas duplicadas.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-[var(--wine-50)] to-[var(--grape-50)] rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total de Parcelas</p>
              <p className="text-2xl font-bold text-[var(--wine-700)]">{totalParcelas}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Valor Total</p>
              <p className="text-2xl font-bold text-green-700">
                R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Correção</p>
              <p className="text-lg font-bold text-blue-700">
                {negociacao.tipo_correcao === 'nenhuma' 
                  ? 'Sem Correção' 
                  : negociacao.tipo_correcao === 'mensal'
                    ? `${negociacao.percentual_correcao}% ao mês`
                    : `${negociacao.percentual_correcao}% ao ano`
                }
              </p>
              {negociacao.tipo_correcao !== 'nenhuma' && negociacao.tabela_correcao !== 'nenhuma' && (
                <p className="text-xs text-blue-600 mt-1">
                  Índice: {negociacao.tabela_correcao?.toUpperCase()}
                </p>
              )}
            </div>
          </div>

          {preview && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-3 border-b">
                <h3 className="font-semibold text-gray-900">Prévia das Parcelas</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold">Tipo</th>
                      <th className="text-left p-3 text-sm font-semibold">#</th>
                      <th className="text-left p-3 text-sm font-semibold">Vencimento</th>
                      <th className="text-right p-3 text-sm font-semibold">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((parcela, index) => {
                      const parcelaAnterior = index > 0 ? preview[index - 1] : null;
                      const valorMudou = parcelaAnterior && parcela.tipo === 'parcela' && parcelaAnterior.tipo === 'parcela' && Math.abs(parcela.valor - parcelaAnterior.valor) > 0.01;
                      
                      return (
                        <tr key={index} className={`border-t hover:bg-gray-50 ${valorMudou ? 'bg-yellow-50' : ''}`}>
                          <td className="p-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              parcela.tipo === 'entrada' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {parcela.tipo === 'entrada' ? 'Entrada' : 'Parcela'}
                            </span>
                          </td>
                          <td className="p-3 text-sm">{parcela.numero}</td>
                          <td className="p-3 text-sm">
                            {format(new Date(parcela.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                          </td>
                          <td className="p-3 text-sm text-right font-semibold text-[var(--wine-700)]">
                            R$ {parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {valorMudou && (
                              <span className="text-xs text-yellow-700 ml-2">↑</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {negociacao.tipo_correcao === 'mensal' && negociacao.percentual_correcao > 0 && (
            <Alert className="bg-orange-50 border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Correção Mensal:</strong> O valor das parcelas aumentará {negociacao.percentual_correcao}% a cada mês.
              </AlertDescription>
            </Alert>
          )}

          {negociacao.tipo_correcao === 'anual' && negociacao.percentual_correcao > 0 && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Correção Anual:</strong> O valor das parcelas será reajustado {negociacao.percentual_correcao}% a cada 12 meses.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGerarParcelas}
            disabled={isProcessing}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Gerar {totalParcelas} Parcelas
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
