import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Loader2, CheckCircle2, Search, ChevronRight, ChevronLeft, Eye, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchTemplateDialog from "../shared/SearchTemplateDialog";
import ContratoGeradoDialog from "./ContratoGeradoDialog";

export default function GerarContratoDialog({ negociacao, cliente, unidade, open, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [templateSelecionado, setTemplateSelecionado] = useState("");
  const [gerando, setGerando] = useState(false);
  const [showTemplateSearch, setShowTemplateSearch] = useState(false);
  const [contratoGerado, setContratoGerado] = useState(null);
  const [showContratoDialog, setShowContratoDialog] = useState(false);
  
  // Seleção de dados a incluir
  const [dadosIncluir, setDadosIncluir] = useState({
    cliente: true,
    unidade: true,
    negociacao: true,
    loteamento: false,
  });

  // Prompt gerado e editável
  const [promptGerado, setPromptGerado] = useState("");
  const [promptEditavel, setPromptEditavel] = useState("");
  const [nomePromptSalvar, setNomePromptSalvar] = useState("");

  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['documentoTemplates'],
    queryFn: () => base44.entities.DocumentoTemplate.filter({ tipo: 'contrato', ativo: true }),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const templateAtual = templates.find(t => t.id === templateSelecionado);
  const loteamento = unidade?.loteamento_id ? loteamentos.find(l => l.id === unidade.loteamento_id) : null;

  useEffect(() => {
    if (step === 2 && templateAtual) {
      gerarPromptPrevio();
    }
  }, [step, templateAtual, dadosIncluir]);

  const gerarPromptPrevio = () => {
    let prompt = `Você é um assistente especializado em gerar documentos jurídicos e comerciais imobiliários.

TIPO DE DOCUMENTO: ${templateAtual.tipo}
CATEGORIA: ${templateAtual.categoria}

TEMPLATE BASE:
${templateAtual.conteudo_template}

INSTRUÇÕES ESPECÍFICAS:
${templateAtual.instrucoes_ia || 'Gerar documento profissional e completo seguindo as melhores práticas jurídicas.'}

DADOS PARA PREENCHER O DOCUMENTO:
`;

    if (dadosIncluir.cliente && cliente) {
      prompt += `
CLIENTE:
- Nome: ${cliente.nome}
- CPF/CNPJ: ${cliente.cpf_cnpj}
- Telefone: ${cliente.telefone || 'Não informado'}
- Email: ${cliente.email || 'Não informado'}
- Endereço: ${cliente.logradouro || ''} ${cliente.numero || ''}, ${cliente.bairro || ''}, ${cliente.cidade || ''}-${cliente.estado || ''}
- CEP: ${cliente.cep || 'Não informado'}
- Profissão: ${cliente.profissao || 'Não informado'}
`;
    }

    if (dadosIncluir.unidade && unidade) {
      prompt += `
UNIDADE/IMÓVEL:
- Código: ${unidade.codigo}
- Tipo: ${unidade.tipo}
- Área Total: ${unidade.area_total} m²
- Área Construída: ${unidade.area_construida || 'N/A'} m²
- Quartos: ${unidade.quartos || 'N/A'}
- Banheiros: ${unidade.banheiros || 'N/A'}
- Vagas de Garagem: ${unidade.vagas_garagem || 'N/A'}
- Endereço: ${unidade.endereco || 'A definir'}
- Matrícula: ${unidade.matricula || 'A definir'}
- Valor de Venda: R$ ${(unidade.valor_venda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
`;
    }

    if (dadosIncluir.loteamento && loteamento) {
      prompt += `
LOTEAMENTO:
- Nome: ${loteamento.nome}
- Localização: ${loteamento.endereco || ''}, ${loteamento.cidade || ''}-${loteamento.estado || ''}
- Área Total: ${loteamento.area_total || 'N/A'} m²
- Registro: ${loteamento.numero_registro || 'A definir'}
`;
    }

    if (dadosIncluir.negociacao && negociacao) {
      prompt += `
NEGOCIAÇÃO:
- Valor Total: R$ ${(negociacao.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Entrada: R$ ${(negociacao.valor_entrada || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Parcelas Mensais: ${negociacao.quantidade_parcelas_mensais || 0}x de R$ ${(negociacao.valor_parcela_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Data de Início: ${negociacao.data_inicio || 'A definir'}
- Dia de Vencimento: ${negociacao.dia_vencimento || 10}
- Índice de Reajuste: ${negociacao.tabela_correcao || 'Não aplicável'}
`;
    }

    prompt += `
TAREFA:
1. Gere um documento COMPLETO e PROFISSIONAL do tipo "${templateAtual.tipo}"
2. Use TODOS os dados fornecidos acima para preencher o documento
3. Inclua TODAS as cláusulas necessárias conforme o tipo de documento
4. Use linguagem jurídica apropriada e formal
5. Estruture o documento de forma clara com títulos, seções e numeração
6. Inclua campos para assinaturas ao final
7. Inclua data e local no início do documento
8. Se houver cláusulas padrão no template, incorpore-as
9. Retorne APENAS o conteúdo do documento em HTML formatado

IMPORTANTE: O documento deve estar 100% pronto para uso, sem placeholders ou campos em branco.
Data do documento: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
Local: ${loteamento?.cidade || unidade?.endereco?.split(',')[1]?.trim() || 'São Paulo'}, ${loteamento?.estado || 'SP'}
`;

    setPromptGerado(prompt);
    setPromptEditavel(prompt);
  };

  const salvarPromptMutation = useMutation({
    mutationFn: async () => {
      if (!nomePromptSalvar.trim()) {
        throw new Error("Digite um nome para o prompt");
      }

      const promptsSalvos = templateAtual.prompts_salvos || [];
      promptsSalvos.push({
        nome: nomePromptSalvar,
        prompt: promptEditavel,
        data_criacao: new Date().toISOString(),
      });

      await base44.entities.DocumentoTemplate.update(templateSelecionado, {
        prompts_salvos: promptsSalvos,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentoTemplates'] });
      toast.success("Prompt salvo com sucesso!");
      setNomePromptSalvar("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const gerarContrato = async () => {
    setGerando(true);

    try {
      const response = await base44.functions.invoke('gerarDocumentoIA', {
        template_id: templateSelecionado,
        negociacao_id: negociacao.id,
        cliente_id: negociacao.cliente_id,
        unidade_id: negociacao.unidade_id,
        prompt_customizado: promptEditavel,
      });

      if (response.data.success && response.data.documento_id) {
        await base44.entities.Negociacao.update(negociacao.id, {
          status: 'aguardando_assinatura_contrato',
          contrato_id: response.data.documento_id,
          contrato_gerado: true,
        });

        await base44.entities.Unidade.update(negociacao.unidade_id, {
          status: 'reservada',
        });

        await base44.entities.Contrato.create({
          numero_contrato: response.data.numero_documento,
          tipo: 'venda',
          cliente_id: negociacao.cliente_id,
          unidade_id: negociacao.unidade_id,
          negociacao_id: negociacao.id,
          documento_gerado_id: response.data.documento_id,
          valor_total: negociacao.valor_total,
          data_contrato: new Date().toISOString().split('T')[0],
          status: 'aguardando_assinatura',
          conteudo_html: response.data.conteudo,
        });

        queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
        queryClient.invalidateQueries({ queryKey: ['unidades'] });
        queryClient.invalidateQueries({ queryKey: ['documentosGerados'] });
        queryClient.invalidateQueries({ queryKey: ['contratos'] });

        setContratoGerado({
          documentoId: response.data.documento_id,
          numeroDocumento: response.data.numero_documento,
          conteudo: response.data.conteudo,
        });

        onClose();
        setShowContratoDialog(true);
        
        toast.success("✅ Contrato gerado com sucesso!");
        
        if (onSuccess) onSuccess();
      } else {
        toast.error("Erro ao gerar contrato: " + (response.data.message || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Erro ao gerar contrato:", error);
      toast.error("Erro ao gerar contrato: " + error.message);
    } finally {
      setGerando(false);
    }
  };

  const carregarPromptSalvo = (prompt) => {
    setPromptEditavel(prompt);
    toast.success("Prompt carregado!");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--wine-700)]">
              <FileText className="w-5 h-5" />
              Gerar Contrato de Venda
              <Badge variant="outline" className="ml-auto">Passo {step} de 3</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Passo 1: Seleção de Template e Dados */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3">Dados da Negociação</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Cliente</p>
                      <p className="font-semibold text-gray-900">{cliente?.nome}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Unidade</p>
                      <p className="font-semibold text-gray-900">{unidade?.codigo}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Valor Total</p>
                      <p className="font-bold text-green-700">
                        R$ {(negociacao.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Entrada</p>
                      <p className="font-semibold text-gray-900">
                        R$ {(negociacao.valor_entrada || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Template de Contrato *
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setShowTemplateSearch(true)}
                    >
                      <Search className="w-3 h-3" />
                    </Button>
                  </Label>
                  <Input
                    value={templateAtual?.nome || ""}
                    disabled
                    className="bg-gray-100"
                    placeholder="Clique na lupa para selecionar..."
                  />
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-3">Selecione os dados a incluir no documento</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="incluir-cliente"
                        checked={dadosIncluir.cliente}
                        onCheckedChange={(checked) => setDadosIncluir({ ...dadosIncluir, cliente: checked })}
                      />
                      <Label htmlFor="incluir-cliente" className="font-normal">
                        Dados do Cliente (nome, CPF, endereço, profissão)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="incluir-unidade"
                        checked={dadosIncluir.unidade}
                        onCheckedChange={(checked) => setDadosIncluir({ ...dadosIncluir, unidade: checked })}
                      />
                      <Label htmlFor="incluir-unidade" className="font-normal">
                        Dados da Unidade (código, área, características)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="incluir-negociacao"
                        checked={dadosIncluir.negociacao}
                        onCheckedChange={(checked) => setDadosIncluir({ ...dadosIncluir, negociacao: checked })}
                      />
                      <Label htmlFor="incluir-negociacao" className="font-normal">
                        Dados Financeiros (valor, parcelas, condições)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="incluir-loteamento"
                        checked={dadosIncluir.loteamento}
                        onCheckedChange={(checked) => setDadosIncluir({ ...dadosIncluir, loteamento: checked })}
                      />
                      <Label htmlFor="incluir-loteamento" className="font-normal">
                        Dados do Loteamento (nome, localização)
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Passo 2: Preview e Edição do Prompt */}
            {step === 2 && (
              <div className="space-y-4">
                <Tabs defaultValue="editar" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="editar">Editar Prompt</TabsTrigger>
                    <TabsTrigger value="salvos">Prompts Salvos ({templateAtual?.prompts_salvos?.length || 0})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="editar" className="space-y-4">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>💡 Dica:</strong> Você pode editar o prompt abaixo para personalizar a geração do documento. 
                        A IA usará estas instruções para criar o contrato.
                      </p>
                    </div>

                    <div>
                      <Label>Prompt para a IA</Label>
                      <Textarea
                        value={promptEditavel}
                        onChange={(e) => setPromptEditavel(e.target.value)}
                        rows={20}
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome para salvar este prompt..."
                        value={nomePromptSalvar}
                        onChange={(e) => setNomePromptSalvar(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => salvarPromptMutation.mutate()}
                        disabled={salvarPromptMutation.isPending}
                        variant="outline"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Prompt
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="salvos" className="space-y-2">
                    {templateAtual?.prompts_salvos?.length > 0 ? (
                      <div className="space-y-2">
                        {templateAtual.prompts_salvos.map((prompt, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-sm">{prompt.nome}</h4>
                              <span className="text-xs text-gray-500">
                                {new Date(prompt.data_criacao).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => carregarPromptSalvo(prompt.prompt)}
                            >
                              Carregar este prompt
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>Nenhum prompt salvo ainda.</p>
                        <p className="text-sm">Salve prompts personalizados para reutilizar depois.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Passo 3: Confirmação */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Ações que serão realizadas:
                  </h4>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span>Gerar contrato usando IA com o prompt personalizado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span>Atualizar negociação para <Badge className="bg-yellow-500 text-white">Aguardando Assinatura</Badge></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span>Atualizar unidade para <Badge className="bg-yellow-100 text-yellow-800">Reservada</Badge></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span>Criar registro de contrato</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>ℹ️ Resumo:</strong> Template "{templateAtual?.nome}", incluindo dados de{' '}
                    {[
                      dadosIncluir.cliente && 'Cliente',
                      dadosIncluir.unidade && 'Unidade',
                      dadosIncluir.negociacao && 'Negociação',
                      dadosIncluir.loteamento && 'Loteamento'
                    ].filter(Boolean).join(', ')}.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <div className="flex justify-between w-full">
              <div>
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    disabled={gerando}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={gerando}>
                  Cancelar
                </Button>

                {step < 3 ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    disabled={!templateSelecionado}
                    className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={gerarContrato} 
                    disabled={gerando}
                    className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                  >
                    {gerando ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Gerar Contrato
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SearchTemplateDialog
        open={showTemplateSearch}
        onClose={() => setShowTemplateSearch(false)}
        templates={templates}
        onSelect={(template) => {
          setTemplateSelecionado(template.id);
          setShowTemplateSearch(false);
        }}
      />

      {contratoGerado && (
        <ContratoGeradoDialog
          open={showContratoDialog}
          onClose={() => {
            setShowContratoDialog(false);
            setContratoGerado(null);
          }}
          documentoId={contratoGerado.documentoId}
          numeroDocumento={contratoGerado.numeroDocumento}
          conteudo={contratoGerado.conteudo}
          negociacao={negociacao}
          cliente={cliente}
          unidade={unidade}
        />
      )}
    </>
  );
}