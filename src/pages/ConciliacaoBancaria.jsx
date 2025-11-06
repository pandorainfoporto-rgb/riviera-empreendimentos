
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload, CheckCircle2, AlertTriangle, XCircle, RefreshCw,
  FileText, TrendingUp, Download
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ConciliacaoBancaria() {
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sincronizandoAPI, setSincronizandoAPI] = useState(null);
  const [enviandoRemessa, setEnviandoRemessa] = useState(null); // Renamed from enviandoRemessaFileId
  const [showSugestoesDialog, setShowSugestoesDialog] = useState(false);
  const [movimentoSelecionado, setMovimentoSelecionado] = useState(null);
  const [conciliacaoSelecionada, setConciliacaoSelecionada] = useState(null);
  const [executandoConciliacaoAuto, setExecutandoConciliacaoAuto] = useState(false);
  const queryClient = useQueryClient();

  const { data: conciliacoes = [], isLoading } = useQuery({
    queryKey: ['conciliacoes_bancarias'],
    queryFn: () => base44.entities.ConciliacaoBancaria.list('-data_processamento'),
  });

  const { data: integracoes = [] } = useQuery({
    queryKey: ['integracoes_bancarias'],
    queryFn: () => base44.entities.IntegracaoBancaria.list(),
  });

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
  });

  const { data: arquivosRemessa = [] } = useQuery({
    queryKey: ['arquivos_remessa'],
    queryFn: () => base44.entities.ArquivoRemessa.list('-data_geracao'),
  });

  const { data: boletos = [] } = useQuery({
    queryKey: ['boletos'],
    queryFn: () => base44.entities.Boleto.list(),
  });

  const { data: contasBancarias = [] } = useQuery({
    queryKey: ['contas_bancarias'],
    queryFn: () => base44.entities.ContaBancaria.list(),
  });

  const handleUploadRetorno = async (file, integracaoId, caixaId) => {
    try {
      setUploadingFile(true);
      toast.info("Processando arquivo de retorno...");

      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const response = await base44.functions.invoke('processarRetornoCNAB', {
        integracao_id: integracaoId,
        caixa_id: caixaId,
        arquivo_url: file_url,
      });

      if (response.data?.success) {
        toast.success(`✅ ${response.data.quantidade_conciliados} registros conciliados automaticamente!`);
        queryClient.invalidateQueries({ queryKey: ['conciliacoes_bancarias'] });
      } else {
        toast.error(response.data?.error || 'Erro ao processar arquivo');
      }
      
    } catch (error) {
      toast.error("Erro ao processar arquivo: " + error.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSincronizarAPI = async (integracaoId, caixaId) => {
    try {
      setSincronizandoAPI(integracaoId);
      toast.info("Buscando extrato via API...");

      const response = await base44.functions.invoke('sincronizarExtratosBancarios', {
        integracao_id: integracaoId,
        caixa_id: caixaId,
      });

      if (response.data?.success) {
        toast.success(`✅ ${response.data.quantidade_movimentos} movimentos importados!`);
        queryClient.invalidateQueries({ queryKey: ['conciliacoes_bancarias'] });
      } else {
        toast.warning(response.data?.message || 'Sincronização não disponível');
      }
      
    } catch (error) {
      toast.error("Erro: " + error.message);
    } finally {
      setSincronizandoAPI(null);
    }
  };

  const conciliarManualMutation = useMutation({
    mutationFn: async ({ conciliacao_id, movimento_index, boleto_id, caixa_id }) => {
      const response = await base44.functions.invoke('conciliarMovimentoManual', {
        conciliacao_id,
        movimento_index,
        boleto_id,
        caixa_id,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao conciliar');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conciliacoes_bancarias'] });
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
      setShowSugestoesDialog(false);
      toast.success('✅ Movimento conciliado com sucesso!');
    },
    onError: (error) => {
      toast.error(`❌ ${error.message}`);
    },
  });

  const abrirSugestoes = (conciliacao, movimento) => {
    setConciliacaoSelecionada(conciliacao);
    setMovimentoSelecionado(movimento);
    setShowSugestoesDialog(true);
  };

  const enviarRemessaMutation = useMutation({
    mutationFn: async ({ arquivo_remessa_id }) => {
      const response = await base44.functions.invoke('enviarArquivoRemessaBanco', {
        arquivo_remessa_id,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao enviar remessa');
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['arquivos_remessa'] });
      setEnviandoRemessa(null); // Updated state variable
      
      if (data.sucessos > 0) {
        toast.success(`✅ ${data.sucessos} arquivo(s) enviado(s) com sucesso!`);
      }
      if (data.falhas > 0) {
        toast.warning(`⚠️ ${data.falhas} arquivo(s) com erro. Verifique os detalhes.`);
      }
    },
    onError: (error) => {
      toast.error(`❌ ${error.message}`);
      setEnviandoRemessa(null); // Updated state variable
    },
  });

  const conciliacaoAutomaticaMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('conciliacaoAutomaticaPeriodica', {});

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro na conciliação automática');
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conciliacoes_bancarias'] });
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
      setExecutandoConciliacaoAuto(false);
      
      if (data.total_conciliados > 0 || data.total_escalados > 0) {
        toast.success(
          `✅ Conciliação automática concluída!\n` +
          `${data.total_conciliados} conciliado(s), ${data.total_escalados} escalado(s) para revisão`
        );
      } else {
        toast.info('ℹ️ Nenhum movimento elegível para conciliação automática');
      }
    },
    onError: (error) => {
      toast.error(`❌ ${error.message}`);
      setExecutandoConciliacaoAuto(false);
    },
  });

  const ignorarMovimentoMutation = useMutation({
    mutationFn: async ({ conciliacao_id, movimento_index }) => {
      const conc = await base44.entities.ConciliacaoBancaria.get(conciliacao_id);
      const movs = [...conc.movimentos];
      
      movs[movimento_index].status_conciliacao = 'ignorado';
      movs[movimento_index].conciliado_por = 'Sistema - Ignorado';
      movs[movimento_index].data_conciliacao = new Date().toISOString();
      movs[movimento_index].observacoes_ignorar = 'Movimento ignorado manualmente';

      const quantPendentes = Math.max(0, conc.quantidade_pendentes - 1);
      const quantConciliados = conc.quantidade_conciliados; // Already incremented by auto or manual
      const quantDivergencias = conc.quantidade_divergencias;
      
      // Determine new status based on remaining pending/divergences
      let newStatus = conc.status;
      if (quantPendentes === 0 && quantDivergencias === 0) {
        newStatus = 'concluido';
      } else if (quantPendentes > 0 || quantDivergencias > 0) {
        newStatus = 'aguardando_revisao';
      }

      await base44.entities.ConciliacaoBancaria.update(conciliacao_id, {
        movimentos: movs,
        quantidade_pendentes: quantPendentes,
        status: newStatus,
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conciliacoes_bancarias'] });
      toast.success('Movimento ignorado');
    },
    onError: (error) => {
      toast.error(`❌ ${error.message}`);
    },
  });


  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Conciliação Bancária</h1>
          <p className="text-gray-600 mt-1">Conciliação automática de extratos e retornos CNAB</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              setExecutandoConciliacaoAuto(true);
              conciliacaoAutomaticaMutation.mutate();
            }}
            disabled={executandoConciliacaoAuto}
            className="bg-blue-50 hover:bg-blue-100"
          >
            {executandoConciliacaoAuto ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Conciliando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Conciliar Automaticamente
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={() => enviarRemessaMutation.mutate({})} // Assuming empty object tells backend to send all pending
            disabled={enviarRemessaMutation.isLoading}
          >
            {enviarRemessaMutation.isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Enviar Remessas Pendentes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Arquivos de Remessa Pendentes */}
      {arquivosRemessa.filter(a => !a.enviado_banco && a.status === 'gerado').length > 0 && (
        <Card className="border-l-4 border-orange-500 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="w-5 h-5" />
              Arquivos de Remessa Pendentes de Envio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {arquivosRemessa
              .filter(a => !a.enviado_banco && a.status === 'gerado')
              .map((arquivo) => {
                const integracao = integracoes.find(i => i.id === arquivo.integracao_bancaria_id);
                
                return (
                  <div key={arquivo.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{arquivo.nome_arquivo}</p>
                      <p className="text-xs text-gray-600">
                        {integracao?.nome_configuracao} • {arquivo.quantidade_boletos} boleto(s) • 
                        R$ {(arquivo.valor_total / 100).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEnviandoRemessa(arquivo.id); // Updated state variable
                        enviarRemessaMutation.mutate({ arquivo_remessa_id: arquivo.id });
                      }}
                      disabled={enviandoRemessa === arquivo.id || enviarRemessaMutation.isLoading} // Updated state variable
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {enviandoRemessa === arquivo.id ? ( // Updated state variable
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3 mr-1" />
                          Enviar ao Banco
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      {/* Cards de Upload por Integração */}
      <div className="grid md:grid-cols-2 gap-6">
        {integracoes.filter(i => i.ativo).map((integracao) => {
          const caixaVinculado = caixas.find(c => c.tipo === 'conta_bancaria' && c.nome?.includes(integracao.banco));
          const caixaId = caixaVinculado?.id || caixas[0]?.id; // Fallback to first caixa if specific one not found

          return (
            <Card key={integracao.id} className="border-2 border-dashed hover:border-solid transition-all">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{integracao.nome_configuracao}</span>
                  <Badge variant="outline">{integracao.banco}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>Ag: {integracao.agencia}-{integracao.agencia_digito}</p>
                  <p>CC: {integracao.conta}-{integracao.conta_digito}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Arquivo de Retorno CNAB</Label>
                  <Input
                    type="file"
                    accept=".ret,.txt"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file && caixaId) handleUploadRetorno(file, integracao.id, caixaId);
                    }}
                    disabled={uploadingFile || !caixaId}
                  />
                  <p className="text-xs text-gray-500">
                    Formatos aceitos: .ret, .txt (CNAB 240 ou 400)
                  </p>
                </div>

                {integracao.tipo_integracao === 'api' && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleSincronizarAPI(integracao.id, caixaId)}
                    disabled={sincronizandoAPI === integracao.id || !caixaId}
                  >
                    {sincronizandoAPI === integracao.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Buscar Extrato via API
                      </>
                    )}
                  </Button>
                )}

                {!caixaId && (
                  <p className="text-xs text-amber-600">
                    ⚠️ Configure um caixa bancário primeiro
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Histórico de Conciliações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Conciliações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conciliacoes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma conciliação processada ainda</p>
              </div>
            ) : (
              conciliacoes.map((conciliacao) => {
                const integracao = integracoes.find(i => i.id === conciliacao.integracao_bancaria_id);
                const caixa = caixas.find(c => c.id === conciliacao.caixa_id);
                const conta = contasBancarias.find(c => c.id === conciliacao.conta_bancaria_id);
                const percentualConciliado = conciliacao.quantidade_registros > 0
                  ? (conciliacao.quantidade_conciliados / conciliacao.quantidade_registros) * 100
                  : 0;

                const movimentosComSugestoes = conciliacao.movimentos?.filter(
                  m => m.status_conciliacao === 'sugestao_match' && !m.escalado_revisao
                ) || [];

                const movimentosEscalados = conciliacao.movimentos?.filter(
                  m => m.escalado_revisao
                ) || [];

                return (
                  <Card key={conciliacao.id} className="bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-lg">{integracao?.nome_configuracao}</h4>
                          {conta && (
                            <p className="text-sm text-gray-600">{conta.nome_conta}</p>
                          )}
                          <p className="text-sm text-gray-600">
                            {format(new Date(conciliacao.data_processamento), "dd/MM/yyyy HH:mm", {locale: ptBR})}
                          </p>
                          <p className="text-xs text-gray-500">
                            Caixa: {caixa?.nome}
                          </p>
                        </div>
                        <Badge className={
                          conciliacao.status === 'concluido' ? 'bg-green-600' :
                          conciliacao.status === 'aguardando_revisao' ? 'bg-blue-600' :
                          conciliacao.status === 'erro' ? 'bg-red-600' : 'bg-orange-600'
                        }>
                          {conciliacao.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-sm text-gray-600">Registros</p>
                          <p className="text-2xl font-bold">{conciliacao.quantidade_registros}</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">Conciliados</p>
                          <p className="text-2xl font-bold text-green-700">{conciliacao.quantidade_conciliados}</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">Sugestões</p>
                          <p className="text-2xl font-bold text-blue-700">{conciliacao.quantidade_pendentes || 0}</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-sm text-gray-600">Divergências</p>
                          <p className="text-2xl font-bold text-red-700">{conciliacao.quantidade_divergencias}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progresso de Conciliação</span>
                          <span className="font-semibold">{percentualConciliado.toFixed(1)}%</span>
                        </div>
                        <Progress value={percentualConciliado} className="h-2" />
                      </div>

                      {/* Movimentos escalados para revisão urgente */}
                      {movimentosEscalados.length > 0 && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold text-red-900 flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5" />
                              🚨 {movimentosEscalados.length} movimento(s) requerem REVISÃO URGENTE
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-100"
                              onClick={() => abrirSugestoes(conciliacao, movimentosEscalados[0])}
                            >
                              Revisar Agora
                            </Button>
                          </div>
                          <p className="text-xs text-red-700">
                            Movimentos aguardando conciliação há mais de 7 dias
                          </p>
                        </div>
                      )}

                      {/* Movimentos com sugestões de match */}
                      {movimentosComSugestoes.length > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold text-blue-900">
                              🎯 {movimentosComSugestoes.length} movimento(s) com sugestões
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirSugestoes(conciliacao, movimentosComSugestoes[0])}
                            >
                              Revisar
                            </Button>
                          </div>
                          <p className="text-xs text-blue-700">
                            Sistema identificou possíveis correspondências que requerem confirmação manual
                          </p>
                        </div>
                      )}

                      {conciliacao.diferenca_saldo !== 0 && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <p className="text-sm font-semibold text-amber-900">
                              Diferença de saldo: R$ {Math.abs(conciliacao.diferenca_saldo).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Sugestões de Conciliação */}
      {showSugestoesDialog && movimentoSelecionado && conciliacaoSelecionada && (
        <Dialog open={showSugestoesDialog} onOpenChange={setShowSugestoesDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Sugestões de Conciliação
                {movimentoSelecionado.escalado_revisao && (
                  <Badge className="bg-red-600 ml-2">🚨 URGENTE</Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Alerta de escalação */}
              {movimentoSelecionado.escalado_revisao && (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-900">Movimento Escalado para Revisão Urgente</p>
                      <p className="text-sm text-red-700 mt-1">
                        {movimentoSelecionado.motivo_escalacao}
                      </p>
                      <p className="text-xs text-red-600 mt-2">
                        Escalado em: {format(parseISO(movimentoSelecionado.data_escalacao), "dd/MM/yyyy HH:mm", {locale: ptBR})}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detalhes do Movimento Bancário */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">💰 Movimento Bancário</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Data:</p>
                    <p className="font-semibold">{format(parseISO(movimentoSelecionado.data_movimento), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Valor:</p>
                    <p className="font-semibold text-blue-700">
                      R$ {movimentoSelecionado.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Nosso Número:</p>
                    <p className="font-mono text-sm">{movimentoSelecionado.nosso_numero || 'N/A'}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Descrição: {movimentoSelecionado.descricao}
                </p>
              </div>

              {/* Sugestões */}
              <div>
                <h3 className="font-semibold mb-4">🎯 Boletos Sugeridos (por relevância)</h3>
                <div className="space-y-3">
                  {movimentoSelecionado.sugestoes_match?.map((sugestao, idx) => {
                    const boleto = boletos.find(b => b.id === sugestao.boleto_id);
                    
                    if (!boleto) return null;

                    return (
                      <Card 
                        key={idx}
                        className={`hover:shadow-lg transition-all ${
                          sugestao.score >= 90 ? 'border-2 border-green-500' :
                          sugestao.score >= 70 ? 'border-2 border-blue-500' :
                          'border-2 border-orange-500'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold">{boleto.sacado_nome}</h4>
                                <Badge className={
                                  sugestao.score >= 90 ? 'bg-green-600' :
                                  sugestao.score >= 70 ? 'bg-blue-600' :
                                  'bg-orange-600'
                                }>
                                  {sugestao.score}% Match
                                </Badge>
                              </div>
                              <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                                <p>Nosso Número: {boleto.nosso_numero}</p>
                                <p>Vencimento: {format(parseISO(boleto.data_vencimento), "dd/MM/yyyy")}</p>
                                <p className="font-semibold">
                                  Valor: R$ {boleto.valor_nominal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                </p>
                                <p>Status: {boleto.status}</p>
                              </div>
                            </div>
                          </div>

                          {/* Análise das Diferenças */}
                          <div className="bg-gray-50 p-3 rounded-lg mt-3 text-xs">
                            <p className="font-semibold mb-2">📊 Análise:</p>
                            <div className="space-y-1">
                              {sugestao.diferencas?.nosso_numero_match && (
                                <p className="text-green-700">✅ Nosso número corresponde parcialmente</p>
                              )}
                              <p className={sugestao.diferencas?.valor_diferenca <= 1 ? 'text-green-700' : 'text-orange-700'}>
                                💵 Diferença de valor: R$ {sugestao.diferencas?.valor_diferenca?.toFixed(2)}
                              </p>
                              <p className={sugestao.diferencas?.dias_diferenca <= 3 ? 'text-green-700' : 'text-orange-700'}>
                                📅 Diferença de data: {sugestao.diferencas?.dias_diferenca} dia(s)
                              </p>
                            </div>
                            <p className="text-gray-600 mt-2 italic">{sugestao.motivo_match}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <Button
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                const movIndex = conciliacaoSelecionada.movimentos.indexOf(movimentoSelecionado);
                                conciliarManualMutation.mutate({
                                  conciliacao_id: conciliacaoSelecionada.id,
                                  movimento_index: movIndex,
                                  boleto_id: boleto.id,
                                  caixa_id: conciliacaoSelecionada.caixa_id,
                                });
                              }}
                              disabled={conciliarManualMutation.isPending}
                            >
                              {conciliarManualMutation.isPending ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Conciliando...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Confirmar
                                </>
                              )}
                            </Button>
                            {idx === 0 && ( // Only show "Ignorar" for the first suggestion
                              <Button
                                variant="outline"
                                className="w-full border-gray-300"
                                onClick={() => {
                                  const movIndex = conciliacaoSelecionada.movimentos.indexOf(movimentoSelecionado);
                                  if (confirm('Tem certeza que deseja IGNORAR este movimento? Ele será marcado como ignorado e não aparecerá mais para conciliação.')) {
                                    ignorarMovimentoMutation.mutate({
                                      conciliacao_id: conciliacaoSelecionada.id,
                                      movimento_index: movIndex,
                                    });
                                    setShowSugestoesDialog(false);
                                  }
                                }}
                                disabled={ignorarMovimentoMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Ignorar Movimento
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSugestoesDialog(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
