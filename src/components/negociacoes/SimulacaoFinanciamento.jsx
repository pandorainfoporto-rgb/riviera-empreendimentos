import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Download, Printer } from "lucide-react";
import { addMonths, format, setDate } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SimulacaoFinanciamento({ negociacao }) {
  const calcularSimulacao = () => {
    if (!negociacao.data_inicio || negociacao.quantidade_parcelas_mensais === 0) {
      return { parcelas: [], resumo: null };
    }

    const parcelas = [];
    const dataInicio = new Date(negociacao.data_inicio);
    const inicioMensais = negociacao.quantidade_parcelas_entrada || 0;
    let valorParcelaMensal = negociacao.valor_parcela_mensal || 0;
    let totalPago = negociacao.valor_entrada || 0;

    // Adicionar parcelas da entrada
    if (negociacao.valor_entrada > 0) {
      const valorParcelaEntrada = negociacao.valor_entrada / negociacao.quantidade_parcelas_entrada;
      
      for (let i = 0; i < negociacao.quantidade_parcelas_entrada; i++) {
        const dataVencimento = setDate(addMonths(dataInicio, i), negociacao.dia_vencimento);
        parcelas.push({
          numero: i + 1,
          tipo: 'Entrada',
          mesReferencia: format(dataVencimento, "MMM/yyyy", { locale: ptBR }),
          valorParcela: valorParcelaEntrada,
          valorCorrigido: valorParcelaEntrada,
          totalAcumulado: (i + 1) * valorParcelaEntrada,
        });
      }
    }

    // Adicionar parcelas mensais com correção
    for (let i = 0; i < negociacao.quantidade_parcelas_mensais; i++) {
      const mesAtual = inicioMensais + i;
      const dataVencimento = setDate(addMonths(dataInicio, mesAtual), negociacao.dia_vencimento);
      const valorOriginal = negociacao.valor_parcela_mensal;
      
      // Aplicar correção conforme tipo
      if (negociacao.tipo_correcao === 'mensal' && negociacao.percentual_correcao > 0) {
        // Correção mensal: aplica em cada mês
        valorParcelaMensal = negociacao.valor_parcela_mensal * Math.pow(1 + negociacao.percentual_correcao / 100, i);
      } else if (negociacao.tipo_correcao === 'anual' && negociacao.percentual_correcao > 0) {
        // Correção anual: aplica uma vez por ano no mês especificado
        const anosPassados = Math.floor(i / 12);
        const mesNoAno = (i % 12) + 1;
        
        if (anosPassados > 0 && mesNoAno === negociacao.mes_correcao_anual) {
          valorParcelaMensal = valorParcelaMensal * (1 + negociacao.percentual_correcao / 100);
        }
      }
      
      totalPago += valorParcelaMensal;
      
      parcelas.push({
        numero: inicioMensais + i + 1,
        tipo: 'Mensal',
        mesReferencia: format(dataVencimento, "MMM/yyyy", { locale: ptBR }),
        valorParcela: valorOriginal,
        valorCorrigido: valorParcelaMensal,
        totalAcumulado: totalPago,
        corrigida: valorParcelaMensal !== valorOriginal,
      });
    }

    const resumo = {
      valorTotal: negociacao.valor_total,
      valorEntrada: negociacao.valor_entrada,
      valorFinanciado: negociacao.valor_total - negociacao.valor_entrada,
      totalPago: totalPago,
      jurosAcumulados: totalPago - negociacao.valor_total,
      percentualJuros: ((totalPago - negociacao.valor_total) / negociacao.valor_total) * 100,
    };

    return { parcelas, resumo };
  };

  const { parcelas, resumo } = calcularSimulacao();

  const imprimirSimulacao = () => {
    window.print();
  };

  const gerarPDF = () => {
    window.print();
  };

  if (!resumo) {
    return null;
  }

  const getTipoCorrecaoLabel = () => {
    if (negociacao.tipo_correcao === 'nenhuma') return 'Sem Correção';
    if (negociacao.tipo_correcao === 'mensal') return `Correção Mensal ${negociacao.percentual_correcao}%`;
    if (negociacao.tipo_correcao === 'anual') return `Correção Anual ${negociacao.percentual_correcao}%`;
    return '';
  };

  return (
    <Card className="shadow-xl border-t-4 border-[var(--grape-600)] print:shadow-none">
      <CardHeader className="print:pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Simulação Completa do Financiamento
          </CardTitle>
          <div className="flex gap-2 print:hidden">
            <Button onClick={imprimirSimulacao} variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={gerarPDF} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Salvar PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo Financeiro */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 print:gap-2">
          <div className="p-3 bg-gradient-to-br from-[var(--wine-50)] to-[var(--grape-50)] rounded-lg print:border print:border-gray-300">
            <p className="text-xs text-gray-600 mb-1">Valor Original</p>
            <p className="text-base md:text-lg font-bold text-[var(--wine-700)]">
              R$ {resumo.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg print:border print:border-gray-300">
            <p className="text-xs text-gray-600 mb-1">Entrada ({negociacao.percentual_entrada}%)</p>
            <p className="text-base md:text-lg font-bold text-purple-700">
              R$ {resumo.valorEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg print:border print:border-gray-300">
            <p className="text-xs text-gray-600 mb-1">Valor Financiado</p>
            <p className="text-base md:text-lg font-bold text-blue-700">
              R$ {resumo.valorFinanciado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg print:border print:border-gray-300">
            <p className="text-xs text-gray-600 mb-1">Total a Pagar</p>
            <p className="text-base md:text-lg font-bold text-green-700">
              R$ {resumo.totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg print:border print:border-gray-300">
            <p className="text-xs text-gray-600 mb-1">Correção Total</p>
            <p className="text-base md:text-lg font-bold text-orange-700">
              R$ {resumo.jurosAcumulados.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-orange-600 mt-1">
              +{resumo.percentualJuros.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Info sobre tipo de correção */}
        {negociacao.tipo_correcao !== 'nenhuma' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900">Tipo de Correção</p>
                <p className="text-xs text-blue-700 mt-1">{getTipoCorrecaoLabel()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-900">Tabela</p>
                <p className="text-xs text-blue-700 mt-1">{negociacao.tabela_correcao.toUpperCase()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de Parcelas */}
        <div className="border rounded-lg overflow-hidden print:border-gray-400">
          <div className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white p-3 print:bg-gray-200 print:text-black">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Cronograma de Pagamentos Mês a Mês
            </h3>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto print:max-h-none print:overflow-visible">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0 z-10 print:static">
                <tr>
                  <th className="text-left p-2 text-xs md:text-sm font-semibold border-b">#</th>
                  <th className="text-left p-2 text-xs md:text-sm font-semibold border-b">Tipo</th>
                  <th className="text-left p-2 text-xs md:text-sm font-semibold border-b">Mês</th>
                  <th className="text-right p-2 text-xs md:text-sm font-semibold border-b">Valor Original</th>
                  <th className="text-right p-2 text-xs md:text-sm font-semibold border-b">Valor Corrigido</th>
                  <th className="text-right p-2 text-xs md:text-sm font-semibold border-b">Total Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {parcelas.map((parcela, index) => (
                  <tr 
                    key={index} 
                    className={`border-t hover:bg-gray-50 print:hover:bg-white ${parcela.corrigida ? 'bg-yellow-50 print:bg-yellow-50' : ''}`}
                  >
                    <td className="p-2 text-xs md:text-sm font-medium">{parcela.numero}</td>
                    <td className="p-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        parcela.tipo === 'Entrada' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {parcela.tipo}
                      </span>
                    </td>
                    <td className="p-2 text-xs md:text-sm capitalize">{parcela.mesReferencia}</td>
                    <td className="p-2 text-xs md:text-sm text-right font-medium">
                      R$ {parcela.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 text-xs md:text-sm text-right font-bold">
                      <span className={parcela.corrigida ? 'text-orange-700' : 'text-gray-900'}>
                        R$ {parcela.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {parcela.corrigida && (
                        <span className="ml-2 text-xs text-orange-600">
                          <TrendingUp className="w-3 h-3 inline" />
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-xs md:text-sm text-right font-bold text-[var(--wine-700)]">
                      R$ {parcela.totalAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gradient-to-r from-[var(--wine-100)] to-[var(--grape-100)] sticky bottom-0 print:static print:bg-gray-200">
                <tr>
                  <td colSpan="5" className="p-3 text-right font-bold text-[var(--wine-700)] text-sm md:text-base">
                    TOTAL GERAL:
                  </td>
                  <td className="p-3 text-right font-bold text-base md:text-lg text-[var(--wine-700)]">
                    R$ {resumo.totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {negociacao.tipo_correcao !== 'nenhuma' && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 print:border-gray-400">
            <p className="text-sm text-yellow-800">
              <strong>Atenção:</strong> As parcelas marcadas com <TrendingUp className="w-3 h-3 inline text-orange-600" /> indicam valores corrigidos.
              {negociacao.tipo_correcao === 'mensal' && ` Correção mensal de ${negociacao.percentual_correcao}% aplicada.`}
              {negociacao.tipo_correcao === 'anual' && ` Correção anual de ${negociacao.percentual_correcao}% aplicada em ${format(new Date(2024, negociacao.mes_correcao_anual - 1), "MMMM", { locale: ptBR })}.`}
            </p>
          </div>
        )}
      </CardContent>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </Card>
  );
}