import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Book, CreditCard, Webhook, Shield, Code, 
  CheckCircle2, AlertCircle, Settings, ExternalLink,
  Zap, Database, Lock, FileJson, Terminal, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Documentacao() {
  const [activeTab, setActiveTab] = useState("gateway");

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Documentação Técnica</h1>
        <p className="text-gray-600 mt-1">Referência completa de integrações e APIs</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-gray-100">
          <TabsTrigger value="gateway">
            <CreditCard className="w-4 h-4 mr-2" />
            Gateway
          </TabsTrigger>
          <TabsTrigger value="webhook">
            <Webhook className="w-4 h-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="caixas">
            <Database className="w-4 h-4 mr-2" />
            Caixas
          </TabsTrigger>
          <TabsTrigger value="seguranca">
            <Shield className="w-4 h-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="api">
            <Code className="w-4 h-4 mr-2" />
            API
          </TabsTrigger>
        </TabsList>

        {/* TAB: GATEWAY DE PAGAMENTO */}
        <TabsContent value="gateway" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-green-600" />
                Integração com Gateway de Pagamento (Asaas)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">🎯 Visão Geral</h3>
                <p className="text-gray-700 leading-relaxed">
                  O sistema está integrado com o <strong>Asaas</strong>, uma plataforma completa de pagamentos que permite:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                  <li>Pagamentos via <strong>PIX</strong> (instantâneo)</li>
                  <li>Geração de <strong>Boletos Bancários</strong></li>
                  <li>Confirmação automática de pagamentos via webhooks</li>
                  <li>Gestão completa de clientes e cobranças</li>
                  <li>Lançamento automático em caixas vinculados</li>
                  <li>Registro automático de taxas operacionais</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">📋 Configuração Necessária</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-blue-900">1. ASAAS_API_KEY</p>
                    <p className="text-blue-700">Chave de API do Asaas</p>
                    <p className="text-blue-600 text-xs mt-1">
                      • Produção: https://www.asaas.com/config/apiKey<br/>
                      • Sandbox (testes): https://sandbox.asaas.com/config/apiKey
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">2. ASAAS_WEBHOOK_TOKEN</p>
                    <p className="text-blue-700">Token secreto para validar webhooks</p>
                    <p className="text-blue-600 text-xs mt-1">
                      Gere com: <code className="bg-blue-100 px-2 py-1 rounded">openssl rand -hex 32</code>
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">3. ASAAS_BASE_URL (opcional)</p>
                    <p className="text-blue-700">URL base da API</p>
                    <p className="text-blue-600 text-xs mt-1">
                      • Padrão: https://sandbox.asaas.com/api/v3<br/>
                      • Produção: https://api.asaas.com/v3
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">⚙️ Fluxo Completo</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700 font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Cliente solicita pagamento</h4>
                      <p className="text-sm text-gray-600">
                        No portal, cliente clica em "Pagar Online" e escolhe PIX ou Boleto
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Sistema gera cobrança no Asaas</h4>
                      <p className="text-sm text-gray-600">
                        Função <code className="bg-gray-100 px-2 py-1 rounded">asaasCreatePayment</code> cria cobrança e retorna QR Code ou boleto
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-700 font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Cliente realiza pagamento</h4>
                      <p className="text-sm text-gray-600">
                        Escaneia QR Code (PIX) ou paga boleto no banco
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-700 font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Webhook confirma pagamento</h4>
                      <p className="text-sm text-gray-600">
                        Asaas envia notificação automática com dados do pagamento
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                      <span className="text-cyan-700 font-bold">5</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Lançamentos automáticos no caixa</h4>
                      <p className="text-sm text-gray-600">
                        Sistema cria 2 movimentações: ENTRADA (valor líquido) e SAÍDA (taxa do gateway)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Status atualizado e email enviado</h4>
                      <p className="text-sm text-gray-600">
                        Pagamento marcado como "pago", saldo do caixa atualizado, email de confirmação enviado ao cliente
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">🔄 Campos nas Entidades</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold mb-2">PagamentoCliente / PagamentoFornecedor</h4>
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
                      <div>• <code>asaas_payment_id</code></div>
                      <div>• <code>asaas_status</code></div>
                      <div>• <code>asaas_confirmed</code></div>
                      <div>• <code>asaas_last_event</code></div>
                      <div>• <code>pix_qrcode</code></div>
                      <div>• <code>pix_copy_paste</code></div>
                      <div>• <code>boleto_url</code></div>
                      <div>• <code>boleto_barcode</code></div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold mb-2">Cliente / Fornecedor</h4>
                    <p className="text-sm text-gray-700">• <code>asaas_customer_id</code> - ID no Asaas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: WEBHOOKS */}
        <TabsContent value="webhook" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-6 h-6 text-purple-600" />
                Configuração de Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">🔗 URL do Webhook</h3>
                <div className="p-4 bg-gray-50 rounded-lg border font-mono text-sm">
                  https://[SEU-DOMINIO]/functions/asaasWebhook
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Configure esta URL no painel do Asaas em: Configurações → Integrações → Webhooks
                </p>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Header de Autenticação
                </h4>
                <p className="text-sm text-orange-700">
                  Configure no Asaas o header <code className="bg-orange-100 px-2 py-1 rounded">asaas-access-token</code> 
                  com o mesmo valor definido em <code className="bg-orange-100 px-2 py-1 rounded">ASAAS_WEBHOOK_TOKEN</code>.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">📡 Eventos Processados</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border-l-4 border-green-500">
                    <h4 className="font-semibold text-green-900">PAYMENT_RECEIVED</h4>
                    <p className="text-sm text-green-700 mb-2">Pagamento confirmado e recebido</p>
                    <ul className="text-xs text-green-700 ml-4 space-y-1">
                      <li>✓ Status → "pago"</li>
                      <li>✓ Cria movimentação ENTRADA no caixa</li>
                      <li>✓ Cria movimentação SAÍDA com taxa (se configurado)</li>
                      <li>✓ Atualiza saldo do caixa</li>
                      <li>✓ Envia email de confirmação</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500">
                    <h4 className="font-semibold text-yellow-900">PAYMENT_CONFIRMED</h4>
                    <p className="text-sm text-yellow-700">
                      Pagamento confirmado mas ainda não compensado (ex: boleto identificado)
                    </p>
                  </div>
                  
                  <div className="p-3 bg-red-50 border-l-4 border-red-500">
                    <h4 className="font-semibold text-red-900">PAYMENT_OVERDUE</h4>
                    <p className="text-sm text-red-700">
                      Pagamento vencido → Status "atrasado"
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 border-l-4 border-gray-500">
                    <h4 className="font-semibold text-gray-900">PAYMENT_DELETED</h4>
                    <p className="text-sm text-gray-700">
                      Pagamento cancelado → Status "cancelado"
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">🔄 Lógica de Processamento</h3>
                <div className="p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-xs overflow-x-auto">
                  <pre>{`1. Webhook recebe notificação do Asaas
2. Valida token de autenticação
3. Busca pagamento no sistema (PagamentoCliente ou PagamentoFornecedor)
4. Busca gateway configurado (Asaas)
5. Busca caixa vinculado ao gateway
6. Extrai valores:
   - valor_bruto = payment.value
   - valor_liquido = payment.netValue
   - taxa = valor_bruto - valor_liquido
7. Cria movimentações:
   a) ENTRADA (valor_liquido) - categoria: recebimento_cliente
   b) SAÍDA (taxa) - categoria: taxa_gateway, eh_taxa_gateway: true
8. Atualiza saldo do caixa
9. Atualiza status do pagamento
10. Envia email de confirmação ao cliente`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: CAIXAS */}
        <TabsContent value="caixas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-6 h-6 text-cyan-600" />
                Sistema de Caixas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">🎯 Conceito</h3>
                <p className="text-gray-700">
                  Caixas são "recipientes" que armazenam dinheiro. Podem ser físicos (dinheiro em espécie), 
                  virtuais (contas bancárias, corretoras) ou digitais (gateways de pagamento).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">🔧 Tipos de Caixa</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">💵 Dinheiro</h4>
                    <p className="text-sm text-green-800">
                      Controle de dinheiro físico. Útil para obras que trabalham com pagamentos em espécie.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">🏦 Conta Bancária</h4>
                    <p className="text-sm text-blue-800 mb-2">
                      Vinculado a contas cadastradas no sistema.
                    </p>
                    <p className="text-xs text-blue-700">
                      Campos: conta_id (obrigatório)
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">📈 Corretora</h4>
                    <p className="text-sm text-purple-800 mb-2">
                      Para investimentos em corretoras.
                    </p>
                    <p className="text-xs text-purple-700">
                      Campos: corretora_id (obrigatório)
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-2">💳 Gateway</h4>
                    <p className="text-sm text-orange-800 mb-2">
                      Vinculado a gateways de pagamento. Recebe lançamentos automáticos.
                    </p>
                    <p className="text-xs text-orange-700">
                      Campos: gateway_id, lancar_taxas_automaticamente
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">⚡ Automações para Caixas Gateway</h3>
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-3">Quando um pagamento é confirmado:</h4>
                  <div className="space-y-2 text-sm text-green-800">
                    <p className="font-semibold">1. Lançamento de Entrada</p>
                    <div className="ml-4 p-2 bg-white rounded border text-xs">
                      <p>Tipo: entrada</p>
                      <p>Categoria: recebimento_cliente</p>
                      <p>Valor: R$ 980,10 (líquido)</p>
                      <p>Descrição: "Recebimento via Asaas - PIX"</p>
                    </div>

                    <p className="font-semibold mt-3">2. Lançamento de Taxa (se habilitado)</p>
                    <div className="ml-4 p-2 bg-white rounded border text-xs">
                      <p>Tipo: saida</p>
                      <p>Categoria: taxa_gateway</p>
                      <p>Valor: R$ 19,90</p>
                      <p>eh_taxa_gateway: true</p>
                      <p>taxa_percentual: 1.99%</p>
                      <p>Descrição: "Taxa Asaas - Transação via PIX"</p>
                    </div>

                    <p className="font-semibold mt-3">3. Atualização de Saldo</p>
                    <div className="ml-4 p-2 bg-white rounded border text-xs">
                      <p>Saldo anterior: R$ 5.000,00</p>
                      <p>+ Entrada: R$ 980,10</p>
                      <p>- Taxa: R$ 19,90</p>
                      <p>= Saldo final: R$ 5.960,20</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">📊 Entidade MovimentacaoCaixa</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold mb-2 text-sm">Campos Principais:</p>
                  <div className="grid md:grid-cols-2 gap-2 text-xs text-gray-700 font-mono">
                    <div>caixa_id</div>
                    <div>tipo (entrada/saida)</div>
                    <div>categoria</div>
                    <div>valor</div>
                    <div>data_movimentacao</div>
                    <div>descricao</div>
                    <div>eh_taxa_gateway</div>
                    <div>gateway_id</div>
                    <div>taxa_percentual</div>
                    <div>taxa_fixa</div>
                    <div>valor_transacao_original</div>
                    <div>metodo_pagamento</div>
                    <div>automatico</div>
                    <div>saldo_anterior</div>
                    <div>saldo_posterior</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: SEGURANÇA */}
        <TabsContent value="seguranca" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                Segurança e Boas Práticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Criptografia End-to-End</h4>
                    <p className="text-sm text-gray-600">
                      Todas as comunicações com gateways usam HTTPS/TLS. Dados sensíveis nunca são armazenados.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Validação de Webhooks</h4>
                    <p className="text-sm text-gray-600">
                      Token secreto valida todas as requisições. Previne ataques de replay e requisições falsas.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">PCI Compliance</h4>
                    <p className="text-sm text-gray-600">
                      Asaas é certificado PCI-DSS. Dados de cartão nunca passam pelo seu servidor.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Autenticação Multinível</h4>
                    <p className="text-sm text-gray-600">
                      Clientes só veem seus próprios dados. Admins têm acesso total. RLS (Row Level Security) aplicado.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Senhas Criptografadas</h4>
                    <p className="text-sm text-gray-600">
                      Senhas nunca são armazenadas em texto puro. Hash bcrypt com salt.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Checklist de Segurança para Produção
                </h4>
                <ul className="text-sm text-red-700 space-y-1 ml-4">
                  <li>☑ Usar API Key de <strong>produção</strong> (não sandbox)</li>
                  <li>☑ Configurar <code className="bg-red-100 px-1 rounded">ASAAS_BASE_URL</code> para produção</li>
                  <li>☑ Gerar token webhook forte (32+ caracteres)</li>
                  <li>☑ Testar webhook em sandbox antes</li>
                  <li>☑ Nunca compartilhar chaves de API</li>
                  <li>☑ Usar HTTPS em produção</li>
                  <li>☑ Monitorar logs de webhook regularmente</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: API */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-6 h-6 text-indigo-600" />
                Referência das Funções Backend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">🔧 asaasCreatePayment</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm font-semibold mb-2">Parâmetros (JSON):</p>
                    <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">{`{
  "pagamento_id": "string",      // ID do pagamento no sistema
  "tipo": "cliente|fornecedor",  // Tipo de pagamento
  "forma_pagamento": "pix|boleto|credit_card"
}`}</pre>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm font-semibold mb-2">Resposta (Sucesso):</p>
                    <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">{`{
  "success": true,
  "payment_id": "pay_xxx",
  "status": "PENDING",
  "invoice_url": "https://...",
  "pix_qrcode": "base64...",     // Se PIX
  "pix_copy_paste": "00020...",  // Se PIX
  "boleto_url": "https://...",   // Se boleto
  "boleto_barcode": "12345..."   // Se boleto
}`}</pre>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-semibold mb-2 text-red-900">Resposta (Erro):</p>
                    <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">{`{
  "success": false,
  "error": "Descrição do erro"
}`}</pre>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">🔔 asaasWebhook</h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Função chamada automaticamente pelo Asaas quando status de pagamento muda.
                  </p>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm font-semibold mb-2">Headers Necessários:</p>
                    <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">{`asaas-access-token: [SEU_WEBHOOK_TOKEN]`}</pre>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm font-semibold mb-2">Payload do Webhook:</p>
                    <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">{`{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_xxx",
    "status": "RECEIVED",
    "value": 1000.00,
    "netValue": 980.10,
    "paymentDate": "2025-01-29",
    "billingType": "PIX",
    "externalReference": "pag_cliente_123"
  }
}`}</pre>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">📚 Documentação Asaas</h4>
                <Button 
                  variant="outline" 
                  className="border-blue-500 text-blue-700 hover:bg-blue-100"
                  onClick={() => window.open('https://docs.asaas.com', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Acessar Documentação Oficial
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}