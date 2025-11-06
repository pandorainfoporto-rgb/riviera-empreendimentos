
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Landmark, Plus, Edit, Trash2, CheckCircle2, XCircle,
  FileText, Upload, Download, RefreshCw, AlertTriangle, Info,
  Plug, Key, Copy, CreditCard // Added CreditCard
} from "lucide-react";
import { toast } from "sonner";

const configBancos = {
  bradesco: {
    nome: "Bradesco",
    codigo: "237",
    suporta_api: true,
    suporta_cnab: true,
    carteiras: ["09", "26"],
    url_homologacao: "https://cobranca.bradesconetempresa.b.br/ibpjpp/homolog",
    url_producao: "https://cobranca.bradesconetempresa.b.br/ibpjpp",
    instrucoes: [
      "Necessário certificado digital A1",
      "Carteira 09: Com Registro",
      "Carteira 26: Sem Registro",
      "CNAB 240 ou 400"
    ]
  },
  itau: {
    nome: "Itaú",
    codigo: "341",
    suporta_api: true,
    suporta_cnab: true,
    carteiras: ["109", "157", "175", "188"],
    url_homologacao: "https://sandbox.itau.com.br",
    url_producao: "https://api.itau.com.br",
    instrucoes: [
      "API OAuth 2.0",
      "Carteira 109: Direta Eletrônica com Emissão e Registro",
      "Carteira 175: Escritural sem Registro",
      "CNAB 240"
    ]
  },
  santander: {
    nome: "Santander",
    codigo: "033",
    suporta_api: true,
    suporta_cnab: true,
    carteiras: ["101", "102", "201"],
    url_homologacao: "https://trust-open.santander.com.br",
    url_producao: "https://trust-open.santander.com.br",
    instrucoes: [
      "API REST com OAuth 2.0",
      "Carteira 101: Cobrança Simples Rápida COM Registro",
      "Carteira 102: Cobrança Simples SEM Registro",
      "CNAB 240 ou 400"
    ]
  },
  banco_brasil: {
    nome: "Banco do Brasil",
    codigo: "001",
    suporta_api: true,
    suporta_cnab: true,
    carteiras: ["11", "12", "15", "17", "18"],
    url_homologacao: "https://oauth.hm.bb.com.br",
    url_producao: "https://oauth.bb.com.br",
    instrucoes: [
      "Necessário Convênio BB",
      "API OAuth 2.0 ou CNAB",
      "Carteira 17: Cobrança Simples COM Registro",
      "CNAB 240 (recomendado) ou 400"
    ]
  },
  caixa: {
    nome: "Caixa Econômica Federal",
    codigo: "104",
    suporta_api: true,
    suporta_cnab: true,
    carteiras: ["SR", "CR", "CS", "RG"],
    url_homologacao: "https://developers.caixa.gov.br/sandbox",
    url_producao: "https://api.caixa.gov.br",
    instrucoes: [
      "Necessário Convênio CAIXA",
      "API com certificado digital",
      "Carteira CR: Com Registro",
      "Carteira SR: Sem Registro",
      "CNAB 240"
    ]
  },
  sicoob: {
    nome: "Sicoob",
    codigo: "756",
    suporta_api: true,
    suporta_cnab: true,
    carteiras: ["1/01", "1/02"],
    url_homologacao: "https://sandbox.sicoob.com.br",
    url_producao: "https://api.sicoob.com.br",
    instrucoes: [
      "API REST",
      "Carteira 1/01: Simples COM Registro",
      "Carteira 1/02: Simples SEM Registro",
      "CNAB 240 ou 400"
    ]
  },
  sicredi: {
    nome: "Sicredi",
    codigo: "748",
    suporta_api: true,
    suporta_cnab: true,
    carteiras: ["1", "3"],
    url_homologacao: "https://api-parceiro.sicredi.com.br/sb",
    url_producao: "https://api-parceiro.sicredi.com.br",
    instrucoes: [
      "API REST com OAuth 2.0",
      "Carteira 1: COM Registro",
      "Carteira 3: SEM Registro",
      "CNAB 240"
    ]
  },
  cresol: {
    nome: "Cresol",
    codigo: "133",
    suporta_api: false,
    suporta_cnab: true,
    carteiras: ["02", "03"],
    url_homologacao: null,
    url_producao: null,
    instrucoes: [
      "Apenas CNAB (sem API própria)",
      "Carteira 02: COM Registro",
      "Carteira 03: SEM Registro",
      "CNAB 400"
    ]
  }
};

export default function IntegracaoBancaria() {
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [bancoSelecionado, setBancoSelecionado] = useState(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [integracaoApiKey, setIntegracaoApiKey] = useState(null);
  const [showContasDialog, setShowContasDialog] = useState(false);
  const [integracaoContas, setIntegracaoContas] = useState(null);
  const queryClient = useQueryClient();

  const { data: integracoes = [] } = useQuery({
    queryKey: ['integracoes_bancarias'],
    queryFn: () => base44.entities.IntegracaoBancaria.list(),
  });

  const { data: bancos = [] } = useQuery({
    queryKey: ['bancos'],
    queryFn: () => base44.entities.Banco.list(),
  });

  const { data: contasBancarias = [] } = useQuery({
    queryKey: ['contas_bancarias'],
    queryFn: () => base44.entities.ContaBancaria.list(),
  });

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
  });

  const [formData, setFormData] = useState({
    nome_configuracao: "",
    banco: "bradesco",
    tipo_integracao: "api",
    ambiente: "homologacao",
    agencia: "",
    agencia_digito: "",
    conta: "",
    conta_digito: "",
    convenio: "",
    carteira: "",
    variacao_carteira: "",
    beneficiario_nome: "",
    beneficiario_cpf_cnpj: "",
    beneficiario_endereco: "",
    beneficiario_cidade: "",
    beneficiario_uf: "",
    beneficiario_cep: "",
    client_id: "",
    client_secret: "",
    api_key: "",
    layout_remessa: "cnab240",
    juros_mora_percentual: 0.033,
    multa_atraso_percentual: 2,
    dias_protesto: 0,
    dias_negativacao: 0,
    dias_baixa_automatica: 60,
    ativo: true,
    padrao: false,
    observacoes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.IntegracaoBancaria.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracoes_bancarias'] });
      setShowForm(false);
      setEditingConfig(null);
      toast.success("Integração criada com sucesso!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.IntegracaoBancaria.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracoes_bancarias'] });
      setShowForm(false);
      setEditingConfig(null);
      toast.success("Integração atualizada!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IntegracaoBancaria.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracoes_bancarias'] });
      toast.success("Integração excluída!");
    },
  });

  const testarConexaoMutation = useMutation({
    mutationFn: async ({ integracao_id }) => {
      const response = await base44.functions.invoke('testarConexaoBancaria', {
        integracao_id,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao testar conexão');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracoes_bancarias'] });
      toast.success('✅ Conexão testada com sucesso!');
    },
    onError: (error) => {
      toast.error(`❌ ${error.message}`);
    },
  });

  const criarContaMutation = useMutation({
    mutationFn: (data) => base44.entities.ContaBancaria.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_bancarias'] });
      toast.success("Conta bancária criada!");
    },
  });

  const handleOpenForm = (config = null) => {
    if (config) {
      setEditingConfig(config);
      setFormData(config);
      setBancoSelecionado(config.banco);
    } else {
      setEditingConfig(null);
      setBancoSelecionado("bradesco");
      setFormData({
        nome_configuracao: "",
        banco: "bradesco",
        tipo_integracao: "api",
        ambiente: "homologacao",
        agencia: "",
        agencia_digito: "",
        conta: "",
        conta_digito: "",
        convenio: "",
        carteira: "",
        variacao_carteira: "",
        beneficiario_nome: "",
        beneficiario_cpf_cnpj: "",
        beneficiario_endereco: "",
        beneficiario_cidade: "",
        beneficiario_uf: "",
        beneficiario_cep: "",
        client_id: "",
        client_secret: "",
        api_key: "",
        layout_remessa: "cnab240",
        juros_mora_percentual: 0.033,
        multa_atraso_percentual: 2,
        dias_protesto: 0,
        dias_negativacao: 0,
        dias_baixa_automatica: 60,
        ativo: true,
        padrao: false,
        observacoes: "",
      });
    }
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const configAtual = bancoSelecionado ? configBancos[bancoSelecionado] : null;

  // New state and functions for API Key dialog
  const mostrarApiKey = (integracao) => {
    setIntegracaoApiKey(integracao);
    setShowApiKeyDialog(true);
  };

  const copiarApiKey = (apiKey) => {
    navigator.clipboard.writeText(apiKey);
    toast.success("API Key copiada!");
  };

  const mostrarContas = (integracao) => {
    setIntegracaoContas(integracao);
    setShowContasDialog(true);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Integração Bancária</h1>
          <p className="text-gray-600 mt-1">Configure boletos registrados e conciliação automática</p>
        </div>
        <Button
          onClick={() => handleOpenForm()}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Integração
        </Button>
      </div>

      {/* Card de API Externa */}
      <Card className="border-l-4 border-purple-500 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Plug className="w-5 h-5" />
            🔌 API Externa para Registro de Boletos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-900 mb-3">
              <strong>Integre sistemas externos</strong> para registrar boletos automaticamente via API REST.
            </p>
            <div className="space-y-2 text-sm text-purple-800">
              <p>✅ Endpoint: <code className="bg-purple-100 px-2 py-1 rounded text-purple-700">/api/functions/apiExternaRegistroBoleto</code></p>
              <p>✅ Autenticação: API Key no header <code className="bg-purple-100 px-2 py-1 rounded text-purple-700">X-API-Key</code></p>
              <p>✅ Método: <code className="bg-purple-100 px-2 py-1 rounded text-purple-700">POST</code></p>
              <p>✅ Retorna: linha digitável, código de barras, URL do boleto</p>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://docs.base44.com/integracao-boletos', '_blank')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver Documentação da API
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guia de Integração */}
      <Card className="border-l-4 border-blue-500 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Info className="w-5 h-5" />
            📋 Bancos Suportados e Requisitos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(configBancos).map(([key, config]) => (
              <div key={key} className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-900">{config.nome}</h4>
                  <Badge variant="outline">Código {config.codigo}</Badge>
                </div>
                <div className="space-y-1 text-xs text-gray-700">
                  {config.instrucoes.map((instr, idx) => (
                    <p key={idx}>• {instr}</p>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  {config.suporta_api && (
                    <Badge className="bg-green-100 text-green-700 text-xs">API</Badge>
                  )}
                  {config.suporta_cnab && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">CNAB</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Integrações */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integracoes.map((integracao) => {
          const configBanco = configBancos[integracao.banco];
          const contasVinculadas = contasBancarias.filter(c => c.integracao_bancaria_id === integracao.id);
          
          return (
            <Card key={integracao.id} className={`hover:shadow-xl transition-shadow ${integracao.padrao ? 'border-2 border-[var(--wine-600)]' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-bold text-lg text-gray-900">{integracao.nome_configuracao}</h3>
                      {integracao.padrao && <Badge className="bg-[var(--wine-600)]">Padrão</Badge>}
                      {integracao.ativo && <Badge className="bg-green-100 text-green-700">Ativa</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Landmark className="w-4 h-4" />
                      {configBanco?.nome || integracao.banco}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Ag: {integracao.agencia}-{integracao.agencia_digito || '0'} | 
                      CC: {integracao.conta}-{integracao.conta_digito || '0'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Carteira: {integracao.carteira}
                      {integracao.convenio && ` | Convênio: ${integracao.convenio}`}
                    </p>
                    {contasVinculadas.length > 0 && (
                      <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {contasVinculadas.length} conta(s) vinculada(s)
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleOpenForm(integracao)}
                      variant="ghost"
                      size="icon"
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm(`Deseja excluir "${integracao.nome_configuracao}"?`)) {
                          deleteMutation.mutate(integracao.id);
                        }
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tipo:</span>
                    <Badge variant="outline">
                      {integracao.tipo_integracao === 'api' ? '🔌 API' : '📄 CNAB'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Layout:</span>
                    <Badge variant="outline">{integracao.layout_remessa?.toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Ambiente:</span>
                    <Badge className={integracao.ambiente === 'producao' ? 'bg-green-600' : 'bg-orange-600'}>
                      {integracao.ambiente === 'producao' ? 'Produção' : 'Homologação'}
                    </Badge>
                  </div>

                  {/* API Key para integração externa */}
                  {integracao.api_key && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-gray-600">API Key:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => mostrarApiKey(integracao)}
                        className="text-xs"
                      >
                        <Key className="w-3 h-3 mr-1" />
                        Ver Chave
                      </Button>
                    </div>
                  )}
                </div>

                {integracao.status_conexao && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      {integracao.status_conexao === 'sucesso' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-700">Conexão OK</span>
                        </>
                      ) : integracao.status_conexao === 'erro' ? (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-700">Erro</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Não testado</span>
                        </>
                      )}
                    </div>
                    {integracao.mensagem_erro && (
                      <p className="text-xs text-red-600 mt-1">{integracao.mensagem_erro}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => testarConexaoMutation.mutate({ integracao_id: integracao.id })}
                    disabled={testarConexaoMutation.isPending}
                  >
                    {testarConexaoMutation.isPending ? (
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <FileText className="w-3 h-3 mr-1" />
                    )}
                    Testar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => mostrarContas(integracao)}
                  >
                    <CreditCard className="w-3 h-3 mr-1" />
                    Contas
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {integracoes.length === 0 && (
          <Card className="col-span-full border-dashed border-2">
            <CardContent className="p-12 text-center">
              <Landmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Nenhuma integração bancária configurada</p>
              <p className="text-sm text-gray-400 mb-4">
                Configure uma integração para gerar boletos registrados
              </p>
              <Button onClick={() => handleOpenForm()} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeira Integração
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Formulário */}
      {showForm && (
        <Dialog open onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingConfig ? 'Editar Integração' : 'Nova Integração Bancária'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seleção de Banco */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Configuração *</Label>
                  <Input
                    value={formData.nome_configuracao}
                    onChange={(e) => setFormData({...formData, nome_configuracao: e.target.value})}
                    placeholder="Ex: Bradesco Principal"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Banco *</Label>
                  <Select
                    value={formData.banco}
                    onValueChange={(val) => {
                      setBancoSelecionado(val);
                      setFormData({
                        ...formData,
                        banco: val,
                        layout_remessa: val === 'cresol' ? 'cnab400' : 'cnab240'
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(configBancos).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.nome} ({config.codigo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Informações do Banco Selecionado */}
              {configAtual && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      📌 Informações - {configAtual.nome}
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {configAtual.instrucoes.map((instr, idx) => (
                        <li key={idx}>• {instr}</li>
                      ))}
                    </ul>
                    <div className="flex gap-2 mt-3">
                      {configAtual.suporta_api && (
                        <Badge className="bg-green-600">Suporta API</Badge>
                      )}
                      {configAtual.suporta_cnab && (
                        <Badge className="bg-blue-600">Suporta CNAB</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Tabs defaultValue="dados_basicos">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="dados_basicos">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="autenticacao">Autenticação</TabsTrigger>
                  <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
                  <TabsTrigger value="opcoes">Opções</TabsTrigger>
                </TabsList>

                <TabsContent value="dados_basicos" className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Agência *</Label>
                      <Input
                        value={formData.agencia}
                        onChange={(e) => setFormData({...formData, agencia: e.target.value})}
                        placeholder="0001"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dígito Agência</Label>
                      <Input
                        value={formData.agencia_digito}
                        onChange={(e) => setFormData({...formData, agencia_digito: e.target.value})}
                        placeholder="0"
                        maxLength={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Carteira *</Label>
                      <Select
                        value={formData.carteira}
                        onValueChange={(val) => setFormData({...formData, carteira: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {configAtual?.carteiras?.map((cart) => (
                            <SelectItem key={cart} value={cart}>
                              {cart}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Conta *</Label>
                      <Input
                        value={formData.conta}
                        onChange={(e) => setFormData({...formData, conta: e.target.value})}
                        placeholder="12345"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dígito Conta *</Label>
                      <Input
                        value={formData.conta_digito}
                        onChange={(e) => setFormData({...formData, conta_digito: e.target.value})}
                        placeholder="6"
                        maxLength={2}
                        required
                      />
                    </div>
                    {(bancoSelecionado === 'banco_brasil' || bancoSelecionado === 'caixa') && (
                      <div className="space-y-2">
                        <Label>Convênio *</Label>
                        <Input
                          value={formData.convenio}
                          onChange={(e) => setFormData({...formData, convenio: e.target.value})}
                          placeholder="1234567"
                        />
                      </div>
                    )}
                    {bancoSelecionado === 'caixa' && (
                      <div className="space-y-2">
                        <Label>Variação Carteira</Label>
                        <Input
                          value={formData.variacao_carteira}
                          onChange={(e) => setFormData({...formData, variacao_carteira: e.target.value})}
                          placeholder="000"
                        />
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Dados do Beneficiário</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome/Razão Social *</Label>
                        <Input
                          value={formData.beneficiario_nome}
                          onChange={(e) => setFormData({...formData, beneficiario_nome: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CPF/CNPJ *</Label>
                        <Input
                          value={formData.beneficiario_cpf_cnpj}
                          onChange={(e) => setFormData({...formData, beneficiario_cpf_cnpj: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Endereço</Label>
                        <Input
                          value={formData.beneficiario_endereco}
                          onChange={(e) => setFormData({...formData, beneficiario_endereco: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cidade</Label>
                        <Input
                          value={formData.beneficiario_cidade}
                          onChange={(e) => setFormData({...formData, beneficiario_cidade: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>UF</Label>
                        <Input
                          value={formData.beneficiario_uf}
                          onChange={(e) => setFormData({...formData, beneficiario_uf: e.target.value})}
                          maxLength={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CEP</Label>
                        <Input
                          value={formData.beneficiario_cep}
                          onChange={(e) => setFormData({...formData, beneficiario_cep: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="autenticacao" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Tipo de Integração</Label>
                    <Select
                      value={formData.tipo_integracao}
                      onValueChange={(val) => setFormData({...formData, tipo_integracao: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {configAtual?.suporta_api && (
                          <SelectItem value="api">🔌 API (Recomendado)</SelectItem>
                        )}
                        {configAtual?.suporta_cnab && (
                          <SelectItem value="arquivo_remessa">📄 Arquivo Remessa CNAB</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.tipo_integracao === 'api' && (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Client ID</Label>
                          <Input
                            value={formData.client_id}
                            onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                            placeholder="seu_client_id"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Client Secret</Label>
                          <Input
                            type="password"
                            value={formData.client_secret}
                            onChange={(e) => setFormData({...formData, client_secret: e.target.value})}
                            placeholder="seu_client_secret"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>API Key {bancoSelecionado === 'caixa' && '(Obrigatório para Caixa)'}</Label>
                        <Input
                          value={formData.api_key}
                          onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Ambiente</Label>
                    <Select
                      value={formData.ambiente}
                      onValueChange={(val) => setFormData({...formData, ambiente: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homologacao">🧪 Homologação (Teste)</SelectItem>
                        <SelectItem value="producao">🚀 Produção (Real)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="configuracoes" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Layout de Remessa CNAB</Label>
                    <Select
                      value={formData.layout_remessa}
                      onValueChange={(val) => setFormData({...formData, layout_remessa: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cnab240">CNAB 240 (Moderno)</SelectItem>
                        <SelectItem value="cnab400">CNAB 400 (Legado)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Juros de Mora (% ao dia)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={formData.juros_mora_percentual}
                        onChange={(e) => setFormData({...formData, juros_mora_percentual: parseFloat(e.target.value)})}
                      />
                      <p className="text-xs text-gray-500">Padrão: 0.033% (1% ao mês)</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Multa por Atraso (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.multa_atraso_percentual}
                        onChange={(e) => setFormData({...formData, multa_atraso_percentual: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Dias para Protesto</Label>
                      <Input
                        type="number"
                        value={formData.dias_protesto}
                        onChange={(e) => setFormData({...formData, dias_protesto: parseInt(e.target.value) || 0})}
                      />
                      <p className="text-xs text-gray-500">0 = Não protestar</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Dias para Negativação</Label>
                      <Input
                        type="number"
                        value={formData.dias_negativacao}
                        onChange={(e) => setFormData({...formData, dias_negativacao: parseInt(e.target.value) || 0})}
                      />
                      <p className="text-xs text-gray-500">0 = Não negativar</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Dias Baixa Automática</Label>
                      <Input
                        type="number"
                        value={formData.dias_baixa_automatica}
                        onChange={(e) => setFormData({...formData, dias_baixa_automatica: parseInt(e.target.value) || 60})}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="opcoes" className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-base">Integração Ativa</Label>
                        <p className="text-sm text-gray-600">Habilitar esta integração</p>
                      </div>
                      <Switch
                        checked={formData.ativo}
                        onCheckedChange={(checked) => setFormData({...formData, ativo: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div>
                        <Label className="text-base">Integração Padrão</Label>
                        <p className="text-sm text-gray-600">Usar como padrão</p>
                      </div>
                      <Switch
                        checked={formData.padrao}
                        onCheckedChange={(checked) => setFormData({...formData, padrao: checked})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      rows={4}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog API Key */}
      {showApiKeyDialog && integracaoApiKey && (
        <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>🔑 API Key - {integracaoApiKey.nome_configuracao}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900 font-semibold mb-2">
                  ⚠️ Mantenha esta chave em segredo
                </p>
                <p className="text-xs text-amber-800">
                  Esta chave permite que sistemas externos registrem boletos. Não compartilhe publicamente.
                </p>
              </div>

              <div>
                <Label>API Key</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={integracaoApiKey.api_key}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copiarApiKey(integracaoApiKey.api_key)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">📘 Como usar:</p>
                <pre className="text-xs text-blue-800 overflow-x-auto p-2 bg-blue-100 rounded">
{`POST /api/functions/apiExternaRegistroBoleto
Headers:
  X-API-Key: ${integracaoApiKey.api_key}
  Content-Type: application/json

Body:
{
  "sacado": {
    "nome": "Cliente",
    "cpf_cnpj": "12345678900"
  },
  "valor_nominal": 1500.00,
  "data_vencimento": "2025-12-31",
  "integracao_id": "${integracaoApiKey.id}" // Optional: If you have multiple integrations, specify which one to use.
}`}
                </pre>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowApiKeyDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Contas Bancárias */}
      {showContasDialog && integracaoContas && (
        <Dialog open={showContasDialog} onOpenChange={setShowContasDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Contas Bancárias - {integracaoContas.nome_configuracao}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Lista de contas */}
              {contasBancarias
                .filter(c => c.integracao_bancaria_id === integracaoContas.id)
                .map((conta) => {
                  const bancoConfig = configBancos[integracaoContas.banco];
                  const caixa = caixas.find(cx => cx.id === conta.caixa_id);
                  
                  return (
                    <Card key={conta.id} className="bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{conta.nome_conta}</h4>
                              {conta.eh_padrao_cobranca && (
                                <Badge className="bg-purple-600">Padrão Cobrança</Badge>
                              )}
                              <Badge variant="outline">{conta.tipo_conta}</Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Banco: {bancoConfig?.nome || integracaoContas.banco}</p>
                              <p>Ag: {conta.agencia}-{conta.agencia_digito} | CC: {conta.conta}-{conta.conta_digito}</p>
                              <p>Finalidade: {conta.finalidade}</p>
                              {caixa && <p>Caixa vinculado: {caixa.nome}</p>}
                              <p className="font-semibold text-green-700">
                                Saldo: R$ {(conta.saldo_atual || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                              </p>
                            </div>
                          </div>
                          <Badge className={conta.ativa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {conta.ativa ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

              {/* Botão Nova Conta */}
              <Button
                variant="outline"
                className="w-full border-dashed border-2"
                onClick={() => {
                  const nomeConta = prompt('Nome da conta:');
                  if (!nomeConta) return;

                  criarContaMutation.mutate({
                    nome_conta: nomeConta,
                    integracao_bancaria_id: integracaoContas.id,
                    banco_id: integracaoContas.banco, // Assuming 'banco' field stores the config key like 'bradesco'
                    agencia: integracaoContas.agencia,
                    agencia_digito: integracaoContas.agencia_digito,
                    conta: integracaoContas.conta,
                    conta_digito: integracaoContas.conta_digito,
                    tipo_conta: 'corrente', // Default, can be edited later
                    finalidade: 'cobranca', // Default, can be edited later
                    titular: integracaoContas.beneficiario_nome,
                    cpf_cnpj_titular: integracaoContas.beneficiario_cpf_cnpj,
                    ativa: true,
                    saldo_atual: 0, // Initial balance
                    eh_padrao_cobranca: false, // Default
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Conta Bancária
              </Button>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowContasDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
