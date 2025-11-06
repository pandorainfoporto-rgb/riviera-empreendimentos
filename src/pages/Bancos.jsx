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
  Landmark, Plus, Edit, Trash2, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, FileText, Info, Plug, Key, Copy, CreditCard
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
  },
  outro: {
    nome: "Outro Banco",
    codigo: "",
    suporta_api: false,
    suporta_cnab: false,
    carteiras: [],
    instrucoes: ["Banco sem integração automática"]
  }
};

export default function Bancos() {
  const [showForm, setShowForm] = useState(false);
  const [editingBanco, setEditingBanco] = useState(null);
  const [bancoPreSelecionado, setBancoPreSelecionado] = useState(null);
  const [showContasDialog, setShowContasDialog] = useState(false);
  const [bancoContas, setBancoContas] = useState(null);
  const queryClient = useQueryClient();

  const { data: bancos = [] } = useQuery({
    queryKey: ['bancos'],
    queryFn: () => base44.entities.Banco.list(),
  });

  const { data: integracoes = [] } = useQuery({
    queryKey: ['integracoes_bancarias'],
    queryFn: () => base44.entities.IntegracaoBancaria.list(),
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
    // Dados do Banco
    nome: "",
    codigo: "",
    tipo: "comercial",
    agencia: "",
    observacoes: "",
    
    // Dados de Integração
    habilitar_integracao: false,
    banco_chave: "",
    nome_configuracao: "",
    tipo_integracao: "api",
    ambiente: "homologacao",
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
    integracao_ativa: true,
    integracao_padrao: false,
    observacoes_integracao: "",
  });

  const createBancoMutation = useMutation({
    mutationFn: async (data) => {
      const banco = await base44.entities.Banco.create({
        nome: data.nome,
        codigo: data.codigo,
        agencia: data.agencia,
        tipo: data.tipo,
        observacoes: data.observacoes,
      });

      // Se habilitar integração, criar também
      if (data.habilitar_integracao) {
        await base44.entities.IntegracaoBancaria.create({
          banco_id: banco.id,
          nome_configuracao: data.nome_configuracao || data.nome,
          banco: data.banco_chave,
          tipo_integracao: data.tipo_integracao,
          ambiente: data.ambiente,
          agencia: data.agencia,
          agencia_digito: data.agencia_digito,
          conta: data.conta,
          conta_digito: data.conta_digito,
          convenio: data.convenio,
          carteira: data.carteira,
          variacao_carteira: data.variacao_carteira,
          beneficiario_nome: data.beneficiario_nome,
          beneficiario_cpf_cnpj: data.beneficiario_cpf_cnpj,
          beneficiario_endereco: data.beneficiario_endereco,
          beneficiario_cidade: data.beneficiario_cidade,
          beneficiario_uf: data.beneficiario_uf,
          beneficiario_cep: data.beneficiario_cep,
          client_id: data.client_id,
          client_secret: data.client_secret,
          api_key: data.api_key,
          layout_remessa: data.layout_remessa,
          juros_mora_percentual: data.juros_mora_percentual,
          multa_atraso_percentual: data.multa_atraso_percentual,
          dias_protesto: data.dias_protesto,
          dias_negativacao: data.dias_negativacao,
          dias_baixa_automatica: data.dias_baixa_automatica,
          ativo: data.integracao_ativa,
          padrao: data.integracao_padrao,
          observacoes: data.observacoes_integracao,
        });
      }

      return banco;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos'] });
      queryClient.invalidateQueries({ queryKey: ['integracoes_bancarias'] });
      setShowForm(false);
      setEditingBanco(null);
      setBancoPreSelecionado(null);
      toast.success("Banco cadastrado com sucesso!");
    },
  });

  const updateBancoMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const banco = await base44.entities.Banco.update(id, {
        nome: data.nome,
        codigo: data.codigo,
        agencia: data.agencia,
        tipo: data.tipo,
        observacoes: data.observacoes,
      });

      // Atualizar integração existente ou criar nova
      const integracaoExistente = integracoes.find(i => i.banco_id === id);
      
      if (data.habilitar_integracao) {
        const integracaoData = {
          banco_id: banco.id,
          nome_configuracao: data.nome_configuracao || data.nome,
          banco: data.banco_chave,
          tipo_integracao: data.tipo_integracao,
          ambiente: data.ambiente,
          agencia: data.agencia,
          agencia_digito: data.agencia_digito,
          conta: data.conta,
          conta_digito: data.conta_digito,
          convenio: data.convenio,
          carteira: data.carteira,
          variacao_carteira: data.variacao_carteira,
          beneficiario_nome: data.beneficiario_nome,
          beneficiario_cpf_cnpj: data.beneficiario_cpf_cnpj,
          beneficiario_endereco: data.beneficiario_endereco,
          beneficiario_cidade: data.beneficiario_cidade,
          beneficiario_uf: data.beneficiario_uf,
          beneficiario_cep: data.beneficiario_cep,
          client_id: data.client_id,
          client_secret: data.client_secret,
          api_key: data.api_key,
          layout_remessa: data.layout_remessa,
          juros_mora_percentual: data.juros_mora_percentual,
          multa_atraso_percentual: data.multa_atraso_percentual,
          dias_protesto: data.dias_protesto,
          dias_negativacao: data.dias_negativacao,
          dias_baixa_automatica: data.dias_baixa_automatica,
          ativo: data.integracao_ativa,
          padrao: data.integracao_padrao,
          observacoes: data.observacoes_integracao,
        };

        if (integracaoExistente) {
          await base44.entities.IntegracaoBancaria.update(integracaoExistente.id, integracaoData);
        } else {
          await base44.entities.IntegracaoBancaria.create(integracaoData);
        }
      }

      return banco;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos'] });
      queryClient.invalidateQueries({ queryKey: ['integracoes_bancarias'] });
      setShowForm(false);
      setEditingBanco(null);
      setBancoPreSelecionado(null);
      toast.success("Banco atualizado!");
    },
  });

  const deleteBancoMutation = useMutation({
    mutationFn: async (id) => {
      // Excluir integrações vinculadas
      const integracoesVinculadas = integracoes.filter(i => i.banco_id === id);
      for (const integracao of integracoesVinculadas) {
        await base44.entities.IntegracaoBancaria.delete(integracao.id);
      }
      
      await base44.entities.Banco.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos'] });
      queryClient.invalidateQueries({ queryKey: ['integracoes_bancarias'] });
      toast.success("Banco excluído!");
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

  const handleOpenForm = (banco = null) => {
    if (banco) {
      setEditingBanco(banco);
      const integracaoBanco = integracoes.find(i => i.banco_id === banco.id);
      
      setFormData({
        nome: banco.nome,
        codigo: banco.codigo,
        tipo: banco.tipo,
        agencia: banco.agencia || "",
        observacoes: banco.observacoes || "",
        
        habilitar_integracao: !!integracaoBanco,
        banco_chave: integracaoBanco?.banco || "",
        nome_configuracao: integracaoBanco?.nome_configuracao || "",
        tipo_integracao: integracaoBanco?.tipo_integracao || "api",
        ambiente: integracaoBanco?.ambiente || "homologacao",
        agencia_digito: integracaoBanco?.agencia_digito || "",
        conta: integracaoBanco?.conta || "",
        conta_digito: integracaoBanco?.conta_digito || "",
        convenio: integracaoBanco?.convenio || "",
        carteira: integracaoBanco?.carteira || "",
        variacao_carteira: integracaoBanco?.variacao_carteira || "",
        beneficiario_nome: integracaoBanco?.beneficiario_nome || "",
        beneficiario_cpf_cnpj: integracaoBanco?.beneficiario_cpf_cnpj || "",
        beneficiario_endereco: integracaoBanco?.beneficiario_endereco || "",
        beneficiario_cidade: integracaoBanco?.beneficiario_cidade || "",
        beneficiario_uf: integracaoBanco?.beneficiario_uf || "",
        beneficiario_cep: integracaoBanco?.beneficiario_cep || "",
        client_id: integracaoBanco?.client_id || "",
        client_secret: integracaoBanco?.client_secret || "",
        api_key: integracaoBanco?.api_key || "",
        layout_remessa: integracaoBanco?.layout_remessa || "cnab240",
        juros_mora_percentual: integracaoBanco?.juros_mora_percentual || 0.033,
        multa_atraso_percentual: integracaoBanco?.multa_atraso_percentual || 2,
        dias_protesto: integracaoBanco?.dias_protesto || 0,
        dias_negativacao: integracaoBanco?.dias_negativacao || 0,
        dias_baixa_automatica: integracaoBanco?.dias_baixa_automatica || 60,
        integracao_ativa: integracaoBanco?.ativo ?? true,
        integracao_padrao: integracaoBanco?.padrao ?? false,
        observacoes_integracao: integracaoBanco?.observacoes || "",
      });

      setBancoPreSelecionado(integracaoBanco?.banco || null);
    } else {
      setEditingBanco(null);
      setBancoPreSelecionado(null);
      setFormData({
        nome: "",
        codigo: "",
        tipo: "comercial",
        agencia: "",
        observacoes: "",
        habilitar_integracao: false,
        banco_chave: "",
        nome_configuracao: "",
        tipo_integracao: "api",
        ambiente: "homologacao",
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
        integracao_ativa: true,
        integracao_padrao: false,
        observacoes_integracao: "",
      });
    }
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBanco) {
      updateBancoMutation.mutate({ id: editingBanco.id, data: formData });
    } else {
      createBancoMutation.mutate(formData);
    }
  };

  const handleSelecionarBancoPadrao = (chaveBanco) => {
    const config = configBancos[chaveBanco];
    if (config) {
      setFormData({
        ...formData,
        banco_chave: chaveBanco,
        nome: config.nome,
        codigo: config.codigo,
        nome_configuracao: `${config.nome} Principal`,
        carteira: config.carteiras[0] || "",
        layout_remessa: chaveBanco === 'cresol' ? 'cnab400' : 'cnab240',
      });
      setBancoPreSelecionado(chaveBanco);
    }
  };

  const mostrarContas = (banco) => {
    setBancoContas(banco);
    setShowContasDialog(true);
  };

  const configAtual = bancoPreSelecionado ? configBancos[bancoPreSelecionado] : null;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Bancos e Integrações</h1>
          <p className="text-gray-600 mt-1">Gerencie bancos, contas e integrações para boletos</p>
        </div>
        <Button
          onClick={() => handleOpenForm()}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Banco
        </Button>
      </div>

      {/* Cards de Bancos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bancos.map((banco) => {
          const integracao = integracoes.find(i => i.banco_id === banco.id);
          const configBanco = integracao ? configBancos[integracao.banco] : null;
          const contasVinculadas = contasBancarias.filter(c => c.banco_id === banco.id);
          
          return (
            <Card key={banco.id} className={`hover:shadow-xl transition-shadow ${integracao?.padrao ? 'border-2 border-[var(--wine-600)]' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-bold text-lg text-gray-900">{banco.nome}</h3>
                      {integracao?.padrao && <Badge className="bg-[var(--wine-600)]">Padrão</Badge>}
                      {integracao?.ativo && <Badge className="bg-green-100 text-green-700">Integrado</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Landmark className="w-4 h-4" />
                      Código: {banco.codigo} | Tipo: {banco.tipo}
                    </p>
                    {integracao && (
                      <>
                        <p className="text-xs text-gray-500 mt-2">
                          Ag: {integracao.agencia}-{integracao.agencia_digito || '0'} | 
                          CC: {integracao.conta}-{integracao.conta_digito || '0'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Carteira: {integracao.carteira}
                          {integracao.convenio && ` | Convênio: ${integracao.convenio}`}
                        </p>
                      </>
                    )}
                    {contasVinculadas.length > 0 && (
                      <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {contasVinculadas.length} conta(s) bancária(s)
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleOpenForm(banco)}
                      variant="ghost"
                      size="icon"
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm(`Deseja excluir "${banco.nome}"?`)) {
                          deleteBancoMutation.mutate(banco.id);
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

                {integracao && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Integração:</span>
                      <Badge variant="outline">
                        {integracao.tipo_integracao === 'api' ? '🔌 API' : '📄 CNAB'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Ambiente:</span>
                      <Badge className={integracao.ambiente === 'producao' ? 'bg-green-600' : 'bg-orange-600'}>
                        {integracao.ambiente === 'producao' ? 'Produção' : 'Homologação'}
                      </Badge>
                    </div>

                    {integracao.status_conexao && (
                      <div className="mt-3 pt-3 border-t">
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
                        onClick={() => mostrarContas(banco)}
                      >
                        <CreditCard className="w-3 h-3 mr-1" />
                        Contas
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {bancos.length === 0 && (
          <Card className="col-span-full border-dashed border-2">
            <CardContent className="p-12 text-center">
              <Landmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Nenhum banco cadastrado</p>
              <p className="text-sm text-gray-400 mb-4">
                Cadastre um banco para gerenciar contas e integrações
              </p>
              <Button onClick={() => handleOpenForm()} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Banco
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Formulário */}
      {showForm && (
        <Dialog open onOpenChange={setShowForm}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingBanco ? 'Editar Banco' : 'Novo Banco'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seleção de Banco (apenas na criação) */}
              {!editingBanco && (
                <div className="space-y-3">
                  <Label>Selecione o Banco *</Label>
                  <Select
                    value={bancoPreSelecionado || ""}
                    onValueChange={handleSelecionarBancoPadrao}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha o banco..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(configBancos).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.nome} {config.codigo && `(${config.codigo})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {configAtual && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          📌 {configAtual.nome}
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
                </div>
              )}

              <Tabs defaultValue="dados_basicos">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="dados_basicos">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="integracao" disabled={!formData.habilitar_integracao && !editingBanco}>
                    Integração
                  </TabsTrigger>
                  <TabsTrigger value="autenticacao" disabled={!formData.habilitar_integracao}>
                    Autenticação
                  </TabsTrigger>
                  <TabsTrigger value="configuracoes" disabled={!formData.habilitar_integracao}>
                    Boletos
                  </TabsTrigger>
                  <TabsTrigger value="contas">Contas</TabsTrigger>
                </TabsList>

                <TabsContent value="dados_basicos" className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Banco *</Label>
                      <Input
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        placeholder="Ex: Bradesco"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Código do Banco</Label>
                      <Input
                        value={formData.codigo}
                        onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                        placeholder="Ex: 237"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Banco</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(val) => setFormData({...formData, tipo: val})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comercial">Comercial</SelectItem>
                          <SelectItem value="digital">Digital</SelectItem>
                          <SelectItem value="cooperativa">Cooperativa</SelectItem>
                          <SelectItem value="investimento">Investimento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Agência Padrão</Label>
                    <Input
                      value={formData.agencia}
                      onChange={(e) => setFormData({...formData, agencia: e.target.value})}
                      placeholder="0001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                      <Label className="text-base font-semibold">🔌 Habilitar Integração Bancária</Label>
                      <p className="text-sm text-gray-600">Ativar integração para boletos registrados e conciliação automática</p>
                    </div>
                    <Switch
                      checked={formData.habilitar_integracao}
                      onCheckedChange={(checked) => setFormData({...formData, habilitar_integracao: checked})}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="integracao" className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Configuração *</Label>
                      <Input
                        value={formData.nome_configuracao}
                        onChange={(e) => setFormData({...formData, nome_configuracao: e.target.value})}
                        placeholder="Ex: Bradesco Principal"
                        required={formData.habilitar_integracao}
                      />
                    </div>

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
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Agência *</Label>
                      <Input
                        value={formData.agencia}
                        onChange={(e) => setFormData({...formData, agencia: e.target.value})}
                        placeholder="0001"
                        required={formData.habilitar_integracao}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dígito Ag.</Label>
                      <Input
                        value={formData.agencia_digito}
                        onChange={(e) => setFormData({...formData, agencia_digito: e.target.value})}
                        placeholder="0"
                        maxLength={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Conta *</Label>
                      <Input
                        value={formData.conta}
                        onChange={(e) => setFormData({...formData, conta: e.target.value})}
                        placeholder="12345"
                        required={formData.habilitar_integracao}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dígito Conta *</Label>
                      <Input
                        value={formData.conta_digito}
                        onChange={(e) => setFormData({...formData, conta_digito: e.target.value})}
                        placeholder="6"
                        maxLength={2}
                        required={formData.habilitar_integracao}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
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

                    {(bancoPreSelecionado === 'banco_brasil' || bancoPreSelecionado === 'caixa' || bancoPreSelecionado === 'sicoob') && (
                      <div className="space-y-2">
                        <Label>Convênio {(bancoPreSelecionado === 'banco_brasil' || bancoPreSelecionado === 'caixa') && '*'}</Label>
                        <Input
                          value={formData.convenio}
                          onChange={(e) => setFormData({...formData, convenio: e.target.value})}
                          placeholder="1234567"
                          required={(bancoPreSelecionado === 'banco_brasil' || bancoPreSelecionado === 'caixa') && formData.habilitar_integracao}
                        />
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Dados do Beneficiário (Cedente)</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome/Razão Social *</Label>
                        <Input
                          value={formData.beneficiario_nome}
                          onChange={(e) => setFormData({...formData, beneficiario_nome: e.target.value})}
                          required={formData.habilitar_integracao}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CPF/CNPJ *</Label>
                        <Input
                          value={formData.beneficiario_cpf_cnpj}
                          onChange={(e) => setFormData({...formData, beneficiario_cpf_cnpj: e.target.value})}
                          required={formData.habilitar_integracao}
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
                        <Label>API Key {bancoPreSelecionado === 'caixa' && '(Obrigatório para Caixa)'}</Label>
                        <Input
                          value={formData.api_key}
                          onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                          placeholder="Chave de API do banco"
                        />
                      </div>
                    </div>
                  )}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-base">Integração Ativa</Label>
                        <p className="text-sm text-gray-600">Habilitar boletos</p>
                      </div>
                      <Switch
                        checked={formData.integracao_ativa}
                        onCheckedChange={(checked) => setFormData({...formData, integracao_ativa: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div>
                        <Label className="text-base">Integração Padrão</Label>
                        <p className="text-sm text-gray-600">Usar como padrão</p>
                      </div>
                      <Switch
                        checked={formData.integracao_padrao}
                        onCheckedChange={(checked) => setFormData({...formData, integracao_padrao: checked})}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contas" className="space-y-4 mt-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      💡 As contas bancárias serão gerenciadas após salvar o banco.
                      Clique no botão "Contas" no card do banco para adicionar contas.
                    </p>
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
                  disabled={createBancoMutation.isPending || updateBancoMutation.isPending}
                >
                  {createBancoMutation.isPending || updateBancoMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Contas Bancárias */}
      {showContasDialog && bancoContas && (
        <Dialog open={showContasDialog} onOpenChange={setShowContasDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Contas Bancárias - {bancoContas.nome}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {contasBancarias
                .filter(c => c.banco_id === bancoContas.id)
                .map((conta) => {
                  const caixa = caixas.find(cx => cx.id === conta.caixa_id);
                  const integracao = integracoes.find(i => i.banco_id === bancoContas.id);
                  
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
                              <p>Banco: {bancoContas.nome} ({bancoContas.codigo})</p>
                              <p>Ag: {conta.agencia}-{conta.agencia_digito} | CC: {conta.conta}-{conta.conta_digito}</p>
                              <p>Finalidade: {conta.finalidade}</p>
                              {caixa && <p>Caixa: {caixa.nome}</p>}
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

              {contasBancarias.filter(c => c.banco_id === bancoContas.id).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma conta cadastrada para este banco</p>
                </div>
              )}

              {/* Formulário Nova Conta */}
              <Card className="border-2 border-dashed">
                <CardHeader>
                  <CardTitle className="text-base">➕ Nova Conta Bancária</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Conta *</Label>
                      <Input id="nova-conta-nome" placeholder="Ex: Conta Corrente Principal" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Conta *</Label>
                      <Select id="nova-conta-tipo" defaultValue="corrente">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corrente">Conta Corrente</SelectItem>
                          <SelectItem value="poupanca">Poupança</SelectItem>
                          <SelectItem value="conta_cobranca">Conta Cobrança</SelectItem>
                          <SelectItem value="conta_investimento">Conta Investimento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Finalidade *</Label>
                      <Select id="nova-conta-finalidade" defaultValue="operacional">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operacional">Operacional</SelectItem>
                          <SelectItem value="cobranca">Cobrança</SelectItem>
                          <SelectItem value="investimento">Investimento</SelectItem>
                          <SelectItem value="pagamentos">Pagamentos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Caixa Vinculado *</Label>
                      <Select id="nova-conta-caixa">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um caixa" />
                        </SelectTrigger>
                        <SelectContent>
                          {caixas.map((caixa) => (
                            <SelectItem key={caixa.id} value={caixa.id}>
                              {caixa.nome} ({caixa.tipo})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      const nome = document.getElementById('nova-conta-nome').value;
                      const tipo = document.getElementById('nova-conta-tipo').value;
                      const finalidade = document.getElementById('nova-conta-finalidade').value;
                      const caixaId = document.getElementById('nova-conta-caixa').value;

                      if (!nome || !tipo || !finalidade || !caixaId) {
                        toast.error('Preencha todos os campos obrigatórios');
                        return;
                      }

                      const integracao = integracoes.find(i => i.banco_id === bancoContas.id);

                      criarContaMutation.mutate({
                        nome_conta: nome,
                        banco_id: bancoContas.id,
                        integracao_bancaria_id: integracao?.id || null,
                        caixa_id: caixaId,
                        agencia: integracao?.agencia || formData.agencia || "",
                        agencia_digito: integracao?.agencia_digito || "",
                        conta: integracao?.conta || "",
                        conta_digito: integracao?.conta_digito || "",
                        tipo_conta: tipo,
                        finalidade,
                        titular: integracao?.beneficiario_nome || "",
                        cpf_cnpj_titular: integracao?.beneficiario_cpf_cnpj || "",
                        ativa: true,
                        saldo_atual: 0,
                        eh_padrao_cobranca: false,
                      });

                      // Limpar campos
                      document.getElementById('nova-conta-nome').value = '';
                    }}
                    disabled={criarContaMutation.isPending}
                  >
                    {criarContaMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Conta Bancária
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
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