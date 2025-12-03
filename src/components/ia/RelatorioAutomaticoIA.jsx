import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Download, Sparkles, RefreshCw, ChevronDown, ChevronUp, Printer, Copy, Check } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

export default function RelatorioAutomaticoIA({ 
  negociacoes = [],
  pagamentosClientes = [],
  pagamentosFornecedores = [],
  unidades = [],
  locacoes = [],
  cronogramasObra = [],
  consorcios = [],
  caixas = [],
  loteamentos = []
}) {
  const [analise, setAnalise] = useState(null);
  const [tipoRelatorio, setTipoRelatorio] = useState('executivo');
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const tiposRelatorio = [
    { value: 'executivo', label: '📊 Relatório Executivo Geral' },
    { value: 'financeiro', label: '💰 Relatório Financeiro Detalhado' },
    { value: 'vendas', label: '🏠 Relatório de Vendas e Negociações' },
    { value: 'obras', label: '🏗️ Relatório de Obras e Cronogramas' },
    { value: 'consorcios', label: '💳 Relatório de Consórcios' },
    { value: 'locacoes', label: '🔑 Relatório de Locações' },
  ];

  const gerarRelatorioMutation = useMutation({
    mutationFn: async () => {
      const hoje = new Date();
      const mesAtual = format(hoje, 'MMMM yyyy', { locale: ptBR });
      
      // Preparar dados baseado no tipo de relatório
      let dadosContexto = '';
      
      const unidadesVendidas = unidades.filter(u => u.status === 'vendida').length;
      const unidadesDisponiveis = unidades.filter(u => u.status === 'disponivel').length;
      const totalReceitas = pagamentosClientes.filter(p => p.status === 'pago').reduce((s, p) => s + (p.valor || 0), 0);
      const totalDespesas = pagamentosFornecedores.filter(p => p.status === 'pago').reduce((s, p) => s + (p.valor || 0), 0);
      const saldoCaixas = caixas.reduce((s, c) => s + (c.saldo || 0), 0);

      switch (tipoRelatorio) {
        case 'executivo':
          dadosContexto = `
DADOS GERAIS DA EMPRESA:
- Loteamentos: ${loteamentos.length}
- Total de Unidades: ${unidades.length}
- Unidades Vendidas: ${unidadesVendidas}
- Unidades Disponíveis: ${unidadesDisponiveis}
- Taxa de Ocupação: ${unidades.length > 0 ? ((unidadesVendidas / unidades.length) * 100).toFixed(1) : 0}%

FINANCEIRO:
- Saldo em Caixas: R$ ${saldoCaixas.toLocaleString('pt-BR')}
- Receitas Totais: R$ ${totalReceitas.toLocaleString('pt-BR')}
- Despesas Totais: R$ ${totalDespesas.toLocaleString('pt-BR')}
- Resultado: R$ ${(totalReceitas - totalDespesas).toLocaleString('pt-BR')}

NEGOCIAÇÕES:
- Total de Negociações: ${negociacoes.length}
- Ativas: ${negociacoes.filter(n => n.status === 'ativa').length}
- Finalizadas: ${negociacoes.filter(n => n.status === 'finalizada').length}
- Valor Total Negociado: R$ ${negociacoes.reduce((s, n) => s + (n.valor_total || 0), 0).toLocaleString('pt-BR')}

OBRAS:
- Em Andamento: ${cronogramasObra.filter(c => c.status === 'em_andamento').length}
- Concluídas: ${cronogramasObra.filter(c => c.status === 'concluida').length}
- Atrasadas: ${cronogramasObra.filter(c => c.status === 'atrasada').length}

CONSÓRCIOS:
- Total de Cotas: ${consorcios.length}
- Contempladas: ${consorcios.filter(c => c.contemplado).length}
- Valor Total em Cartas: R$ ${consorcios.reduce((s, c) => s + (c.valor_carta || 0), 0).toLocaleString('pt-BR')}

LOCAÇÕES:
- Contratos Ativos: ${locacoes.filter(l => l.status === 'ativo').length}
- Receita Mensal: R$ ${locacoes.filter(l => l.status === 'ativo').reduce((s, l) => s + (l.valor_aluguel || 0), 0).toLocaleString('pt-BR')}`;
          break;

        case 'financeiro':
          dadosContexto = `
POSIÇÃO FINANCEIRA:
- Saldo Total em Caixas: R$ ${saldoCaixas.toLocaleString('pt-BR')}
- Caixas: ${caixas.map(c => `${c.nome}: R$ ${(c.saldo || 0).toLocaleString('pt-BR')}`).join(', ')}

RECEITAS:
- Total Recebido: R$ ${totalReceitas.toLocaleString('pt-BR')}
- A Receber (Pendente): R$ ${pagamentosClientes.filter(p => p.status === 'pendente').reduce((s, p) => s + (p.valor || 0), 0).toLocaleString('pt-BR')}
- Atrasados: R$ ${pagamentosClientes.filter(p => p.status === 'atrasado').reduce((s, p) => s + (p.valor || 0), 0).toLocaleString('pt-BR')}

DESPESAS:
- Total Pago: R$ ${totalDespesas.toLocaleString('pt-BR')}
- A Pagar (Pendente): R$ ${pagamentosFornecedores.filter(p => p.status === 'pendente').reduce((s, p) => s + (p.valor || 0), 0).toLocaleString('pt-BR')}
- Atrasados: R$ ${pagamentosFornecedores.filter(p => p.status === 'atrasado').reduce((s, p) => s + (p.valor || 0), 0).toLocaleString('pt-BR')}

RESULTADO:
- Lucro/Prejuízo: R$ ${(totalReceitas - totalDespesas).toLocaleString('pt-BR')}
- Margem: ${totalReceitas > 0 ? (((totalReceitas - totalDespesas) / totalReceitas) * 100).toFixed(1) : 0}%`;
          break;

        case 'vendas':
          dadosContexto = `
VENDAS E NEGOCIAÇÕES:
- Total de Negociações: ${negociacoes.length}
- Por Status:
  - Ativas: ${negociacoes.filter(n => n.status === 'ativa').length}
  - Aguardando Contrato: ${negociacoes.filter(n => n.status === 'aguardando_assinatura_contrato').length}
  - Contrato Assinado: ${negociacoes.filter(n => n.status === 'contrato_assinado').length}
  - Finalizadas: ${negociacoes.filter(n => n.status === 'finalizada').length}
  - Canceladas: ${negociacoes.filter(n => n.status === 'cancelada').length}

VALORES:
- Valor Total Negociado: R$ ${negociacoes.reduce((s, n) => s + (n.valor_total || 0), 0).toLocaleString('pt-BR')}
- Ticket Médio: R$ ${negociacoes.length > 0 ? (negociacoes.reduce((s, n) => s + (n.valor_total || 0), 0) / negociacoes.length).toLocaleString('pt-BR') : 0}

UNIDADES:
- Total: ${unidades.length}
- Vendidas: ${unidadesVendidas}
- Disponíveis: ${unidadesDisponiveis}
- Em Construção: ${unidades.filter(u => u.status === 'em_construcao').length}
- Taxa de Conversão: ${unidades.length > 0 ? ((unidadesVendidas / unidades.length) * 100).toFixed(1) : 0}%`;
          break;

        case 'obras':
          dadosContexto = `
CRONOGRAMA DE OBRAS:
- Total de Etapas: ${cronogramasObra.length}
- Por Status:
  - Não Iniciadas: ${cronogramasObra.filter(c => c.status === 'nao_iniciada').length}
  - Em Andamento: ${cronogramasObra.filter(c => c.status === 'em_andamento').length}
  - Concluídas: ${cronogramasObra.filter(c => c.status === 'concluida').length}
  - Atrasadas: ${cronogramasObra.filter(c => c.status === 'atrasada').length}
  - Pausadas: ${cronogramasObra.filter(c => c.status === 'pausada').length}

PROGRESSO MÉDIO: ${cronogramasObra.length > 0 ? (cronogramasObra.reduce((s, c) => s + (c.percentual_conclusao || 0), 0) / cronogramasObra.length).toFixed(1) : 0}%

UNIDADES EM CONSTRUÇÃO: ${unidades.filter(u => u.status === 'em_construcao').length}`;
          break;

        case 'consorcios':
          dadosContexto = `
CONSÓRCIOS:
- Total de Cotas: ${consorcios.length}
- Contempladas: ${consorcios.filter(c => c.contemplado).length}
- Não Contempladas: ${consorcios.filter(c => !c.contemplado).length}
- Investimento (sem cliente): ${consorcios.filter(c => c.eh_investimento_caixa).length}

VALORES:
- Valor Total em Cartas: R$ ${consorcios.reduce((s, c) => s + (c.valor_carta || 0), 0).toLocaleString('pt-BR')}
- Valor Médio por Cota: R$ ${consorcios.length > 0 ? (consorcios.reduce((s, c) => s + (c.valor_carta || 0), 0) / consorcios.length).toLocaleString('pt-BR') : 0}

CONTEMPLAÇÕES:
- Por Lance: ${consorcios.filter(c => c.tipo_contemplacao === 'lance').length}
- Por Sorteio: ${consorcios.filter(c => c.tipo_contemplacao === 'sorteio').length}`;
          break;

        case 'locacoes':
          dadosContexto = `
LOCAÇÕES:
- Total de Contratos: ${locacoes.length}
- Por Status:
  - Ativos: ${locacoes.filter(l => l.status === 'ativo').length}
  - Inadimplentes: ${locacoes.filter(l => l.status === 'inadimplente').length}
  - Encerrados: ${locacoes.filter(l => l.status === 'encerrado').length}

RECEITA MENSAL:
- Total: R$ ${locacoes.filter(l => l.status === 'ativo').reduce((s, l) => s + (l.valor_aluguel || 0), 0).toLocaleString('pt-BR')}
- Média por Contrato: R$ ${locacoes.filter(l => l.status === 'ativo').length > 0 ? (locacoes.filter(l => l.status === 'ativo').reduce((s, l) => s + (l.valor_aluguel || 0), 0) / locacoes.filter(l => l.status === 'ativo').length).toLocaleString('pt-BR') : 0}`;
          break;
      }

      const tipoLabel = tiposRelatorio.find(t => t.value === tipoRelatorio)?.label || tipoRelatorio;

      const prompt = `Gere um relatório gerencial profissional e detalhado em português brasileiro.

TIPO DE RELATÓRIO: ${tipoLabel}
PERÍODO: ${mesAtual}
EMPRESA: Riviera Incorporadora

${dadosContexto}

O relatório deve incluir:
1. Sumário executivo com os principais pontos
2. Análise detalhada dos dados apresentados
3. Comparativos e tendências identificadas
4. Pontos de atenção e riscos
5. Recomendações estratégicas
6. Conclusão

Use formatação Markdown com títulos, subtítulos, listas e destaques. Seja objetivo mas completo. Inclua números e percentuais relevantes.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            data_geracao: { type: "string" },
            conteudo_markdown: { type: "string" },
            principais_indicadores: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  indicador: { type: "string" },
                  valor: { type: "string" },
                  tendencia: { type: "string" }
                }
              }
            },
            alertas: { type: "array", items: { type: "string" } },
            proximos_passos: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setAnalise(data);
    }
  });

  const handleCopy = () => {
    if (analise?.conteudo_markdown) {
      navigator.clipboard.writeText(analise.conteudo_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${analise?.titulo || 'Relatório'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            h1 { color: #7C2D3E; border-bottom: 2px solid #7C2D3E; padding-bottom: 10px; }
            h2 { color: #922B3E; margin-top: 30px; }
            h3 { color: #333; }
            ul { margin: 10px 0; }
            li { margin: 5px 0; }
            .header { text-align: center; margin-bottom: 30px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${analise?.titulo || 'Relatório Gerencial'}</h1>
            <p>Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>
          ${analise?.conteudo_markdown?.replace(/#{1,6}\s/g, '<h3>').replace(/\n/g, '<br>')}
          <div class="footer">
            <p>Riviera Incorporadora - Sistema de Gestão</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card className="shadow-lg border-l-4 border-purple-500">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Relatórios Automatizados com IA
            </CardTitle>
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent>
            {/* Seleção de tipo */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione o tipo de relatório" />
                </SelectTrigger>
                <SelectContent>
                  {tiposRelatorio.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                onClick={() => gerarRelatorioMutation.mutate()}
                disabled={gerarRelatorioMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {gerarRelatorioMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Gerar Relatório
              </Button>
            </div>

            {!analise && !gerarRelatorioMutation.isPending && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Selecione o tipo de relatório e clique em "Gerar Relatório"</p>
              </div>
            )}

            {gerarRelatorioMutation.isPending && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin text-purple-600" />
                <p className="text-gray-600">Gerando relatório inteligente...</p>
              </div>
            )}

            {analise && (
              <div className="space-y-6">
                {/* Header do Relatório */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div>
                    <h3 className="font-bold text-purple-900 text-lg">{analise.titulo}</h3>
                    <p className="text-sm text-purple-700">
                      Gerado em: {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                      <Printer className="w-4 h-4 mr-1" />
                      Imprimir
                    </Button>
                  </div>
                </div>

                {/* Indicadores Principais */}
                {analise.principais_indicadores?.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {analise.principais_indicadores.map((ind, i) => (
                      <div key={i} className="p-3 bg-white rounded-lg border shadow-sm text-center">
                        <p className="text-xs text-gray-500">{ind.indicador}</p>
                        <p className="text-lg font-bold text-gray-900">{ind.valor}</p>
                        <Badge variant="outline" className={`text-xs ${
                          ind.tendencia === 'alta' ? 'text-green-600' :
                          ind.tendencia === 'baixa' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {ind.tendencia}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Alertas */}
                {analise.alertas?.length > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Alertas</h4>
                    <ul className="space-y-1">
                      {analise.alertas.map((a, i) => (
                        <li key={i} className="text-sm text-yellow-800 flex items-start gap-2">
                          <span>•</span> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Conteúdo do Relatório */}
                <div className="prose prose-sm max-w-none p-6 bg-white rounded-lg border shadow-sm">
                  <ReactMarkdown>{analise.conteudo_markdown}</ReactMarkdown>
                </div>

                {/* Próximos Passos */}
                {analise.proximos_passos?.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">✅ Próximos Passos Recomendados</h4>
                    <ol className="space-y-1 list-decimal list-inside">
                      {analise.proximos_passos.map((p, i) => (
                        <li key={i} className="text-sm text-green-800">{p}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}