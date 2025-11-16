import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ImportarXmlDialog({ fornecedores, unidades, produtos, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dadosNota, setDadosNota] = useState(null);
  const [config, setConfig] = useState({
    fornecedor_id: "",
    unidade_id: "",
    data_entrada: new Date().toISOString().split('T')[0],
    gerar_contas_pagar: true,
    atualizar_estoque: true,
    forma_pagamento: "prazo",
  });
  const [itensVinculados, setItensVinculados] = useState([]);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const processarXml = async () => {
    if (!file) {
      setError("Selecione um arquivo XML");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Ler o conteúdo do arquivo XML
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const xmlContent = e.target.result;

          // Enviar XML para processamento via backend
          const response = await base44.functions.invoke('processarNFeXML', {
            xml_content: xmlContent
          });

          if (!response.data.success) {
            setError(response.data.message || "Erro ao processar XML");
            setIsProcessing(false);
            return;
          }

          const dados = response.data.dados;
          
          // Tentar encontrar fornecedor pelo CNPJ
          const fornecedorEncontrado = fornecedores.find(f => 
            f.cnpj?.replace(/[^\d]/g, '') === dados.cnpj_fornecedor?.replace(/[^\d]/g, '')
          );

          setDadosNota(dados);

          setConfig({
            ...config,
            fornecedor_id: fornecedorEncontrado?.id || "",
          });

          // Preparar itens para vinculação
          const itensPreparados = dados.itens.map(item => ({
            ...item,
            produto_id: null,
            criar_novo: false,
            produto_sugerido: produtos.find(p => 
              p.codigo_referencia === item.codigo_produto ||
              p.nome?.toLowerCase().includes(item.descricao?.toLowerCase())
            ),
          }));

          setItensVinculados(itensPreparados);
          setStep(2);
          setIsProcessing(false);

        } catch (err) {
          setError("Erro ao processar XML: " + err.message);
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setError("Erro ao ler arquivo");
        setIsProcessing(false);
      };

      reader.readAsText(file);

    } catch (err) {
      setError("Erro ao processar XML: " + err.message);
      setIsProcessing(false);
    }
  };

  const vincularProduto = (index, produtoId) => {
    const novosItens = [...itensVinculados];
    novosItens[index] = {
      ...novosItens[index],
      produto_id: produtoId,
      criar_novo: false,
    };
    setItensVinculados(novosItens);
  };

  const marcarCriarNovo = (index, criar) => {
    const novosItens = [...itensVinculados];
    novosItens[index] = {
      ...novosItens[index],
      criar_novo: criar,
      produto_id: null,
    };
    setItensVinculados(novosItens);
  };

  const finalizarImportacao = async () => {
    if (!config.fornecedor_id || !config.unidade_id) {
      setError("Selecione o fornecedor e a unidade de destino");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Criar produtos novos se necessário
      for (const item of itensVinculados) {
        if (item.criar_novo) {
          const novoProduto = await base44.entities.Produto.create({
            nome: item.descricao,
            codigo_referencia: item.codigo_produto,
            unidade_medida: item.unidade_medida || "unidade",
            valor_unitario: item.valor_unitario,
            categoria: "outros",
            fornecedor_padrao_id: config.fornecedor_id,
            ativo: true,
          });
          item.produto_id = novoProduto.id;
        }
      }

      // 2. Criar a compra
      const compra = await base44.entities.CompraNotaFiscal.create({
        numero_nota: dadosNota.numero_nota,
        serie: dadosNota.serie,
        chave_acesso: dadosNota.chave_acesso,
        fornecedor_id: config.fornecedor_id,
        unidade_id: config.unidade_id,
        data_emissao: dadosNota.data_emissao,
        data_entrada: config.data_entrada,
        valor_produtos: dadosNota.valor_produtos,
        valor_frete: dadosNota.valor_frete || 0,
        valor_seguro: dadosNota.valor_seguro || 0,
        valor_desconto: dadosNota.valor_desconto || 0,
        valor_outras_despesas: dadosNota.valor_outras_despesas || 0,
        valor_total: dadosNota.valor_total,
        forma_pagamento: config.forma_pagamento,
        gerar_contas_pagar: config.gerar_contas_pagar,
        atualizar_estoque: config.atualizar_estoque,
        status: 'processada',
      });

      // 3. Criar itens da compra
      const itensParaCriar = itensVinculados.map(item => ({
        compra_id: compra.id,
        produto_id: item.produto_id,
        codigo_produto_fornecedor: item.codigo_produto,
        descricao: item.descricao,
        unidade_medida: item.unidade_medida,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        ncm: item.ncm,
        cfop: item.cfop,
        estoque_atualizado: false,
      }));

      await base44.entities.ItemCompra.bulkCreate(itensParaCriar);

      // 4. Atualizar estoque se necessário
      if (config.atualizar_estoque) {
        for (const item of itensVinculados) {
          if (item.produto_id) {
            const produto = await base44.entities.Produto.get(item.produto_id);
            if (produto) {
              await base44.entities.Produto.update(item.produto_id, {
                estoque_atual: (produto.estoque_atual || 0) + item.quantidade,
              });
            }
          }
        }
      }

      // 5. Gerar contas a pagar se necessário
      if (config.gerar_contas_pagar) {
        await base44.entities.PagamentoFornecedor.create({
          fornecedor_id: config.fornecedor_id,
          unidade_id: config.unidade_id,
          tipo: "produto",
          valor: dadosNota.valor_total,
          data_vencimento: config.data_entrada,
          forma_pagamento: config.forma_pagamento,
          status: 'pendente',
          descricao: `NF-e ${dadosNota.numero_nota} - ${dadosNota.nome_fornecedor}`,
          numero_nota: dadosNota.numero_nota,
        });
      }

      onSuccess();
    } catch (err) {
      setError("Erro ao finalizar importação: " + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[var(--wine-700)] flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar XML de Nota Fiscal - Passo {step} de 3
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[var(--wine-400)] transition-colors">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <Label htmlFor="xml-file" className="cursor-pointer">
                  <div className="text-lg font-semibold text-gray-700 mb-2">
                    {file ? file.name : "Selecione o arquivo XML da NF-e"}
                  </div>
                  <p className="text-sm text-gray-500">
                    Clique para selecionar ou arraste o arquivo aqui
                  </p>
                </Label>
                <Input
                  id="xml-file"
                  type="file"
                  accept=".xml,application/xml,text/xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {file && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Arquivo selecionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                  </AlertDescription>
                </Alert>
              )}

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>ℹ️ Formatos aceitos:</strong> Arquivos XML de NF-e (Nota Fiscal Eletrônica)
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  O sistema irá extrair automaticamente todos os dados da nota usando IA.
                </p>
              </div>
            </div>
          )}

          {step === 2 && dadosNota && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dados da Nota Fiscal</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-600">Número</Label>
                    <p className="font-semibold">{dadosNota.numero_nota}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Série</Label>
                    <p className="font-semibold">{dadosNota.serie}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-gray-600">Fornecedor</Label>
                    <p className="font-semibold">{dadosNota.nome_fornecedor || dadosNota.razao_social_fornecedor}</p>
                    <p className="text-xs text-gray-500">{dadosNota.cnpj_fornecedor}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Valor Total</Label>
                    <p className="font-bold text-green-600">
                      R$ {dadosNota.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Itens</Label>
                    <p className="font-semibold">{dadosNota.itens?.length} produtos</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fornecedor_id">Fornecedor *</Label>
                  <Select
                    value={config.fornecedor_id}
                    onValueChange={(value) => setConfig({ ...config, fornecedor_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map(forn => (
                        <SelectItem key={forn.id} value={forn.id}>
                          {forn.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!config.fornecedor_id && dadosNota.nome_fornecedor && (
                    <p className="text-xs text-orange-600">
                      ⚠️ Fornecedor não encontrado. Cadastre o fornecedor primeiro.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidade_id">Unidade Destino *</Label>
                  <Select
                    value={config.unidade_id}
                    onValueChange={(value) => setConfig({ ...config, unidade_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map(uni => (
                        <SelectItem key={uni.id} value={uni.id}>
                          {uni.codigo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_entrada">Data de Entrada</Label>
                  <Input
                    id="data_entrada"
                    type="date"
                    value={config.data_entrada}
                    onChange={(e) => setConfig({ ...config, data_entrada: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                  <Select
                    value={config.forma_pagamento}
                    onValueChange={(value) => setConfig({ ...config, forma_pagamento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="prazo">A Prazo</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gerar_contas_pagar"
                    checked={config.gerar_contas_pagar}
                    onCheckedChange={(checked) => setConfig({ ...config, gerar_contas_pagar: checked })}
                  />
                  <Label htmlFor="gerar_contas_pagar" className="cursor-pointer">
                    Gerar contas a pagar automaticamente
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="atualizar_estoque"
                    checked={config.atualizar_estoque}
                    onCheckedChange={(checked) => setConfig({ ...config, atualizar_estoque: checked })}
                  />
                  <Label htmlFor="atualizar_estoque" className="cursor-pointer">
                    Atualizar estoque automaticamente
                  </Label>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Vincule os produtos da nota aos produtos cadastrados ou crie novos produtos
                </AlertDescription>
              </Alert>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {itensVinculados.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{item.codigo_produto}</Badge>
                              <p className="font-semibold text-sm">{item.descricao}</p>
                            </div>
                            <p className="text-xs text-gray-600">
                              Qtd: {item.quantidade} {item.unidade_medida} - 
                              Valor Unit: R$ {item.valor_unitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - 
                              Total: R$ {item.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          
                          <div className="w-64 space-y-2">
                            {!item.criar_novo ? (
                              <>
                                <Select
                                  value={item.produto_id || ""}
                                  onValueChange={(value) => vincularProduto(index, value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecionar produto" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {produtos.map(prod => (
                                      <SelectItem key={prod.id} value={prod.id}>
                                        {prod.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => marcarCriarNovo(index, true)}
                                  className="w-full"
                                >
                                  Criar Novo Produto
                                </Button>
                              </>
                            ) : (
                              <div className="space-y-2">
                                <Badge className="bg-green-100 text-green-800">Criar Novo</Badge>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => marcarCriarNovo(index, false)}
                                  className="w-full"
                                >
                                  Vincular Existente
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          {step === 1 && (
            <Button 
              onClick={processarXml} 
              disabled={!file || isProcessing}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Processar XML
                </>
              )}
            </Button>
          )}
          {step === 2 && (
            <Button 
              onClick={() => setStep(3)}
              disabled={!config.fornecedor_id || !config.unidade_id}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              Próximo: Vincular Produtos
            </Button>
          )}
          {step === 3 && (
            <Button 
              onClick={finalizarImportacao}
              disabled={isProcessing}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Finalizar Importação
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}