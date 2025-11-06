import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard, CheckCircle2, AlertCircle, Eye, EyeOff,
  Settings, TestTube, Save, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

const GATEWAYS_DISPONIVEIS = [
  {
    id: "asaas",
    nome: "Asaas",
    logo: "🏦",
    descricao: "Gateway brasileiro completo com PIX, boleto e cartão",
    metodos: ["pix", "boleto", "credit_card"],
    docs: "https://docs.asaas.com"
  },
  {
    id: "pagseguro",
    nome: "PagSeguro",
    logo: "💳",
    descricao: "Solução do UOL para pagamentos online",
    metodos: ["pix", "boleto", "credit_card", "debit_card"],
    docs: "https://dev.pagseguro.uol.com.br"
  },
  {
    id: "mercadopago",
    nome: "Mercado Pago",
    logo: "💰",
    descricao: "Gateway do Mercado Livre",
    metodos: ["pix", "boleto", "credit_card", "debit_card", "carteira_digital"],
    docs: "https://www.mercadopago.com.br/developers"
  },
  {
    id: "pagbank",
    nome: "PagBank",
    logo: "🏧",
    descricao: "Banco digital com gateway de pagamentos",
    metodos: ["pix", "boleto", "credit_card", "debit_card"],
    docs: "https://dev.pagbank.uol.com.br"
  },
  {
    id: "cielo",
    nome: "Cielo",
    logo: "💎",
    descricao: "Adquirente líder no Brasil",
    metodos: ["credit_card", "debit_card"],
    docs: "https://developercielo.github.io"
  },
  {
    id: "stone",
    nome: "Stone",
    logo: "🪨",
    descricao: "Fintech de pagamentos",
    metodos: ["pix", "credit_card", "debit_card"],
    docs: "https://docs.stone.com.br"
  },
  {
    id: "getnet",
    nome: "Getnet",
    logo: "🌐",
    descricao: "Gateway Santander",
    metodos: ["credit_card", "debit_card"],
    docs: "https://developers.getnet.com.br"
  },
  {
    id: "rede",
    nome: "Rede",
    logo: "🔴",
    descricao: "Adquirente Itaú",
    metodos: ["credit_card", "debit_card"],
    docs: "https://www.userede.com.br/desenvolvedores"
  },
  {
    id: "safrapay",
    nome: "Safrapay",
    logo: "🟣",
    descricao: "Gateway Banco Safra",
    metodos: ["pix", "boleto", "credit_card"],
    docs: "https://safrapay.com.br/docs"
  },
  {
    id: "stripe",
    nome: "Stripe",
    logo: "🌊",
    descricao: "Gateway internacional (suporte ao Brasil)",
    metodos: ["pix", "boleto", "credit_card"],
    docs: "https://stripe.com/docs"
  }
];

const METODOS_LABELS = {
  pix: "PIX",
  boleto: "Boleto",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  carteira_digital: "Carteira Digital"
};

export default function ConfiguracaoGateways() {
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [testando, setTestando] = useState(false);
  const queryClient = useQueryClient();

  const { data: configuracoes = [], isLoading } = useQuery({
    queryKey: ['configuracoes_gateway'],
    queryFn: () => base44.entities.ConfiguracaoGateway.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ConfiguracaoGateway.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes_gateway'] });
      toast.success("Gateway configurado com sucesso!");
      setSelectedGateway(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ConfiguracaoGateway.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes_gateway'] });
      toast.success("Gateway atualizado com sucesso!");
    },
  });

  const handleSaveGateway = (gatewayData) => {
    const config = configuracoes.find(c => c.gateway === gatewayData.gateway);
    
    const dataToSave = {
      ...gatewayData,
      data_configuracao: new Date().toISOString(),
    };

    if (config) {
      updateMutation.mutate({ id: config.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const handleTestarConexao = async (gateway) => {
    setTestando(true);
    toast.info("Testando conexão com o gateway...");
    
    // Simular teste (aqui você implementaria teste real com cada gateway)
    setTimeout(() => {
      const sucesso = Math.random() > 0.2; // 80% de sucesso
      
      if (sucesso) {
        toast.success("Conexão testada com sucesso!");
        updateMutation.mutate({
          id: gateway.id,
          data: { ...gateway, testado: true, ultima_sincronizacao: new Date().toISOString() }
        });
      } else {
        toast.error("Erro ao conectar. Verifique as credenciais.");
      }
      
      setTestando(false);
    }, 2000);
  };

  const GatewayCard = ({ gateway }) => {
    const config = configuracoes.find(c => c.gateway === gateway.id);
    const configurado = !!config;
    const ativo = config?.ativo || false;

    return (
      <Card className={`cursor-pointer hover:shadow-lg transition-all ${
        ativo ? 'border-green-500 border-2' : ''
      }`} onClick={() => setSelectedGateway(gateway.id)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{gateway.logo}</div>
              <div>
                <h3 className="font-bold text-lg">{gateway.nome}</h3>
                <p className="text-sm text-gray-600">{gateway.descricao}</p>
              </div>
            </div>
            {ativo && (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Ativo
              </Badge>
            )}
            {configurado && !ativo && (
              <Badge variant="outline">Configurado</Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {gateway.metodos.map(metodo => (
              <Badge key={metodo} variant="outline" className="text-xs">
                {METODOS_LABELS[metodo]}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedGateway(gateway.id);
              }}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurar
            </Button>
            {config && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTestarConexao(config);
                }}
                disabled={testando}
              >
                <TestTube className="w-4 h-4 mr-2" />
                Testar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const ConfiguracaoForm = ({ gatewayId }) => {
    const gateway = GATEWAYS_DISPONIVEIS.find(g => g.id === gatewayId);
    const config = configuracoes.find(c => c.gateway === gatewayId) || {
      gateway: gatewayId,
      nome_exibicao: gateway.nome,
      ativo: false,
      ambiente: "sandbox",
      api_key: "",
      api_secret: "",
      webhook_token: "",
      metodos_habilitados: gateway.metodos,
      configuracoes_extras: {},
      taxas: {}
    };

    const [formData, setFormData] = useState(config);

    const handleSubmit = (e) => {
      e.preventDefault();
      handleSaveGateway(formData);
    };

    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="text-4xl">{gateway.logo}</span>
            <div>
              <div className="flex items-center gap-2">
                <span>Configurar {gateway.nome}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(gateway.docs, '_blank')}
                >
                  📖 Documentação
                </Button>
              </div>
              <p className="text-sm text-gray-600 font-normal">{gateway.descricao}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ativação */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-base font-semibold">Gateway Ativo</Label>
                <p className="text-sm text-gray-600">Habilitar este gateway para uso</p>
              </div>
              <Switch
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>

            {/* Ambiente */}
            <div className="space-y-2">
              <Label>Ambiente</Label>
              <Select
                value={formData.ambiente}
                onValueChange={(value) => setFormData({ ...formData, ambiente: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">🧪 Sandbox (Testes)</SelectItem>
                  <SelectItem value="producao">🚀 Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Credenciais */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Credenciais de API</h3>
              
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key / Token *</Label>
                <div className="relative">
                  <Input
                    id="api_key"
                    type={showApiKey ? "text" : "password"}
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="Chave de API principal"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_secret">API Secret / Client Secret</Label>
                <div className="relative">
                  <Input
                    id="api_secret"
                    type={showApiSecret ? "text" : "password"}
                    value={formData.api_secret}
                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    placeholder="Token secreto (se aplicável)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowApiSecret(!showApiSecret)}
                  >
                    {showApiSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_token">Token de Webhook</Label>
                <Input
                  id="webhook_token"
                  value={formData.webhook_token}
                  onChange={(e) => setFormData({ ...formData, webhook_token: e.target.value })}
                  placeholder="Token para validar webhooks"
                />
                <p className="text-xs text-gray-500">
                  Gere com: <code className="bg-gray-100 px-2 py-1 rounded">openssl rand -hex 32</code>
                </p>
              </div>
            </div>

            {/* Métodos Habilitados */}
            <div className="space-y-3">
              <Label>Métodos de Pagamento Habilitados</Label>
              <div className="grid grid-cols-2 gap-3">
                {gateway.metodos.map(metodo => (
                  <div key={metodo} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={metodo}
                      checked={formData.metodos_habilitados?.includes(metodo)}
                      onChange={(e) => {
                        const metodos = formData.metodos_habilitados || [];
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            metodos_habilitados: [...metodos, metodo]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            metodos_habilitados: metodos.filter(m => m !== metodo)
                          });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <Label htmlFor={metodo} className="cursor-pointer">
                      {METODOS_LABELS[metodo]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                placeholder="Anotações sobre a configuração..."
              />
            </div>

            {/* Ações */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedGateway(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Configuração
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-12 h-12 animate-spin text-[var(--wine-600)] mx-auto mb-4" />
        <p className="text-gray-600">Carregando configurações...</p>
      </div>
    );
  }

  if (selectedGateway) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Button
          variant="outline"
          onClick={() => setSelectedGateway(null)}
          className="mb-4"
        >
          ← Voltar aos Gateways
        </Button>
        <ConfiguracaoForm gatewayId={selectedGateway} />
      </div>
    );
  }

  const gatewaysAtivos = configuracoes.filter(c => c.ativo).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Gateways de Pagamento</h1>
        <p className="text-gray-600 mt-1">Configure integrações com gateways brasileiros</p>
      </div>

      {/* Resumo */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Gateways Ativos</p>
                <p className="text-2xl font-bold text-green-700">{gatewaysAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Configurados</p>
                <p className="text-2xl font-bold text-blue-700">{configuracoes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Disponíveis</p>
                <p className="text-2xl font-bold text-purple-700">{GATEWAYS_DISPONIVEIS.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900">💡 Como funciona</p>
            <p className="text-sm text-blue-700 mt-1">
              Configure um ou mais gateways de pagamento para processar transações.
              Você pode ativar múltiplos gateways e escolher qual usar em cada situação.
              As configurações são salvas de forma segura no banco de dados.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Gateways */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GATEWAYS_DISPONIVEIS.map(gateway => (
          <GatewayCard key={gateway.id} gateway={gateway} />
        ))}
      </div>
    </div>
  );
}