
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText, Download, Eye, RefreshCw, CheckCircle2, XCircle,
  Clock, AlertTriangle, Printer, Copy, Search
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Boletos() {
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroBusca, setFiltroBusca] = useState("");
  const [boletoSelecionado, setBoletoSelecionado] = useState(null);
  const [showHistoricoDialog, setShowHistoricoDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: boletos = [], isLoading } = useQuery({
    queryKey: ['boletos'],
    queryFn: () => base44.entities.Boleto.list('-created_date'),
  });

  const { data: integracoes = [] } = useQuery({
    queryKey: ['integracoes_bancarias'],
    queryFn: () => base44.entities.IntegracaoBancaria.list(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const gerarBoletoMutation = useMutation({
    mutationFn: async ({ pagamento_cliente_id, integracao_id }) => {
      const response = await base44.functions.invoke('registrarBoletoInteligente', {
        pagamento_cliente_id,
        integracao_id,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao gerar boleto');
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
      setGerandoBoleto(null);
      
      if (data.url_boleto) {
        toast.success('✅ Boleto gerado com sucesso!');
        window.open(data.url_boleto, '_blank');
      } else {
        toast.success('✅ Boleto criado! Gere arquivo CNAB para envio ao banco.');
      }
    },
    onError: (error) => {
      toast.error(`❌ ${error.message}`);
      setGerandoBoleto(null);
    },
  });

  const boletosFiltrados = boletos.filter(boleto => {
    const matchStatus = filtroStatus === "todos" || boleto.status === filtroStatus;
    const matchBusca = !filtroBusca || 
      boleto.sacado_nome?.toLowerCase().includes(filtroBusca.toLowerCase()) ||
      boleto.nosso_numero?.includes(filtroBusca) ||
      boleto.numero_documento?.includes(filtroBusca);
    return matchStatus && matchBusca;
  });

  const statusColors = {
    emitido: "bg-blue-100 text-blue-700",
    registrado: "bg-green-100 text-green-700",
    pago: "bg-emerald-600 text-white",
    cancelado: "bg-gray-100 text-gray-700",
    baixado: "bg-orange-100 text-orange-700",
    protestado: "bg-red-600 text-white",
    negativado: "bg-red-100 text-red-700",
    pago_parcial: "bg-purple-100 text-purple-700", // Added for partial payments
  };

  const statusIcons = {
    emitido: Clock,
    registrado: CheckCircle2,
    pago: CheckCircle2,
    cancelado: XCircle,
    baixado: AlertTriangle,
    protestado: AlertTriangle,
    negativado: AlertTriangle,
    pago_parcial: Clock, // Changed to clock for partial payments
  };

  const copiarLinhaDigitavel = (linha) => {
    navigator.clipboard.writeText(linha);
    toast.success("Linha digitável copiada!");
  };

  const copiarPixCopiaCola = (pix) => {
    navigator.clipboard.writeText(pix);
    toast.success("Código PIX copiado!");
  };

  const visualizarHistorico = (boleto) => {
    setBoletoSelecionado(boleto);
    setShowHistoricoDialog(true);
  };

  const totalBoletos = boletosFiltrados.length;
  const totalEmitidos = boletosFiltrados.filter(b => b.status === 'emitido').length;
  const totalRegistrados = boletosFiltrados.filter(b => b.status === 'registrado').length;
  const totalPagos = boletosFiltrados.filter(b => b.status === 'pago').length;
  const valorTotal = boletosFiltrados.reduce((sum, b) => sum + (b.valor_nominal || 0), 0);
  const valorPago = boletosFiltrados.filter(b => b.status === 'pago').reduce((sum, b) => sum + (b.valor_pago || 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Boletos Bancários</h1>
          <p className="text-gray-600 mt-1">Gestão de boletos registrados</p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-700">{totalBoletos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Registrados</p>
                <p className="text-2xl font-bold text-green-700">{totalRegistrados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pagos</p>
                <p className="text-2xl font-bold text-emerald-700">{totalPagos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-lg font-bold text-purple-700">
                  R$ {(valorTotal / 1000).toFixed(0)}k
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recebido</p>
                <p className="text-lg font-bold text-green-700">
                  R$ {(valorPago / 1000).toFixed(0)}k
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por sacado, nosso número, documento..."
                  value={filtroBusca}
                  onChange={(e) => setFiltroBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="emitido">Emitidos</SelectItem>
                <SelectItem value="registrado">Registrados</SelectItem>
                <SelectItem value="pago">Pagos</SelectItem>
                <SelectItem value="pago_parcial">Pagos Parcialmente</SelectItem> {/* Added partial payment status */}
                <SelectItem value="cancelado">Cancelados</SelectItem>
                <SelectItem value="baixado">Baixados</SelectItem>
                <SelectItem value="protestado">Protestados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Boletos */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando boletos...</p>
            </CardContent>
          </Card>
        ) : boletosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum boleto encontrado</p>
              <p className="text-sm text-gray-400 mt-2">
                Boletos são gerados automaticamente ao criar pagamentos de clientes
              </p>
            </CardContent>
          </Card>
        ) : (
          boletosFiltrados.map((boleto) => {
            const StatusIcon = statusIcons[boleto.status] || Clock;
            const integracao = integracoes.find(i => i.id === boleto.integracao_bancaria_id);
            const temHistoricoPagamentos = (boleto.historico_pagamentos?.length || 0) > 0;
            const valorPendenteRestante = boleto.valor_nominal - (boleto.valor_pago_parcial || 0);

            return (
              <Card key={boleto.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${statusColors[boleto.status] || 'bg-gray-100'}`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-bold text-lg">{boleto.sacado_nome}</h3>
                            <Badge className={statusColors[boleto.status]}>
                              {boleto.status?.toUpperCase().replace('_', ' ')}
                            </Badge>
                            {temHistoricoPagamentos && (
                              <Badge variant="outline" className="text-xs">
                                {boleto.historico_pagamentos.length} pagamento(s)
                              </Badge>
                            )}
                          </div>
                          <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <p>CPF/CNPJ: {boleto.sacado_cpf_cnpj}</p>
                            <p>Nosso Número: {boleto.nosso_numero}</p>
                            <p>Vencimento: {format(parseISO(boleto.data_vencimento), "dd/MM/yyyy", {locale: ptBR})}</p>
                            <p>Banco: {integracao?.banco || 'N/A'}</p>
                          </div>

                          {/* Histórico de Pagamentos Parciais */}
                          {boleto.status === 'pago_parcial' && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-blue-900">💰 Pagamentos Parciais</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => visualizarHistorico(boleto)}
                                  className="text-xs"
                                >
                                  Ver Histórico Completo
                                </Button>
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Valor Original:</span>
                                  <span className="font-mono">R$ {boleto.valor_nominal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                </div>
                                <div className="flex justify-between text-blue-700">
                                  <span>Já Pago:</span>
                                  <span className="font-mono font-semibold">R$ {(boleto.valor_pago_parcial || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                </div>
                                <div className="flex justify-between text-red-700">
                                  <span>Saldo Pendente:</span>
                                  <span className="font-mono font-semibold">R$ {valorPendenteRestante.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {boleto.linha_digitavel && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xs text-gray-600 mb-1">Linha Digitável:</p>
                              <p className="font-mono text-sm">{boleto.linha_digitavel}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copiarLinhaDigitavel(boleto.linha_digitavel)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {boleto.pix_copia_cola && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-xs text-blue-600 mb-1">PIX Copia e Cola:</p>
                              <p className="font-mono text-xs truncate">{boleto.pix_copia_cola}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copiarPixCopiaCola(boleto.pix_copia_cola)}
                            >
                              <Copy className="w-4 h-4 text-blue-600" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:w-48">
                      <div className="text-right mb-2">
                        <p className="text-sm text-gray-600">Valor</p>
                        <p className="text-2xl font-bold text-[var(--wine-700)]">
                          R$ {(boleto.valor_nominal || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </p>
                        {boleto.status === 'pago' && boleto.valor_pago && (
                          <p className="text-xs text-green-600">
                            Pago: R$ {boleto.valor_pago.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </p>
                        )}
                        {boleto.status === 'pago_parcial' && (
                          <p className="text-xs text-blue-600">
                            Parcial: R$ {(boleto.valor_pago_parcial || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </p>
                        )}
                      </div>

                      {temHistoricoPagamentos && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => visualizarHistorico(boleto)}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Histórico
                        </Button>
                      )}

                      {boleto.url_boleto && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(boleto.url_boleto, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(boleto.url_boleto, '_blank')}
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog Histórico de Pagamentos */}
      {showHistoricoDialog && boletoSelecionado && (
        <Dialog open={showHistoricoDialog} onOpenChange={setShowHistoricoDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Histórico de Pagamentos - {boletoSelecionado.sacado_nome}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Resumo */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-600">Valor Original</p>
                    <p className="text-lg font-bold text-blue-900">
                      R$ {boletoSelecionado.valor_nominal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-600">Total Pago</p>
                    <p className="text-lg font-bold text-green-900">
                      R$ {(boletoSelecionado.valor_pago || boletoSelecionado.valor_pago_parcial || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-600">Saldo Restante</p>
                    <p className="text-lg font-bold text-orange-900">
                      R$ {(boletoSelecionado.valor_nominal - (boletoSelecionado.valor_pago_parcial || 0)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline de Pagamentos */}
              <div>
                <h3 className="font-semibold mb-4">📜 Histórico de Pagamentos</h3>
                <div className="space-y-3">
                  {(boletoSelecionado.historico_pagamentos && boletoSelecionado.historico_pagamentos.length > 0) ? (
                    boletoSelecionado.historico_pagamentos.map((pagamento, idx) => (
                      <div key={idx} className="flex gap-4 relative">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          </div>
                          {idx < boletoSelecionado.historico_pagamentos.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="bg-gray-50 rounded-lg p-4 border">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  R$ {pagamento.valor_pago.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {format(parseISO(pagamento.data_pagamento), "dd/MM/yyyy HH:mm", {locale: ptBR})}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {pagamento.origem?.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              {pagamento.forma_pagamento && (
                                <p>• Forma: {pagamento.forma_pagamento}</p>
                              )}
                              {pagamento.codigo_ocorrencia_cnab && (
                                <p>• Código CNAB: {pagamento.codigo_ocorrencia_cnab}</p>
                              )}
                              {pagamento.observacoes && (
                                <p>• {pagamento.observacoes}</p>
                              )}
                              {pagamento.registrado_por && (
                                <p className="text-gray-500 mt-2">
                                  Registrado por: {pagamento.registrado_por}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">Nenhum pagamento registrado</p>
                  )}
                </div>
              </div>

              {/* Histórico de Status */}
              {(boletoSelecionado.historico_status && boletoSelecionado.historico_status.length > 0) && (
                <div>
                  <h3 className="font-semibold mb-4">📊 Histórico de Status</h3>
                  <div className="space-y-2">
                    {boletoSelecionado.historico_status.map((status, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="text-xs text-gray-500 w-32">
                          {format(parseISO(status.data), "dd/MM HH:mm", {locale: ptBR})}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {status.status_anterior || 'Inicial'} → <span className="text-green-600">{status.status_novo}</span>
                          </p>
                          <p className="text-xs text-gray-600">{status.descricao}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {status.origem}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tentativas de Conciliação */}
              {(boletoSelecionado.tentativas_conciliacao && boletoSelecionado.tentativas_conciliacao.length > 0) && (
                <div>
                  <h3 className="font-semibold mb-4">🔍 Tentativas de Conciliação</h3>
                  <div className="space-y-2">
                    {boletoSelecionado.tentativas_conciliacao.map((tentativa, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="flex-1">
                          <p className="font-medium">
                            {format(parseISO(tentativa.data_tentativa), "dd/MM/yyyy HH:mm", {locale: ptBR})}
                          </p>
                          <p className="text-xs text-gray-600">
                            Score de match: {tentativa.score_match}%
                          </p>
                        </div>
                        {tentativa.sucesso ? (
                          <Badge className="bg-green-600">✅ Sucesso</Badge>
                        ) : (
                          <Badge className="bg-red-600">❌ Falhou</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setShowHistoricoDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
