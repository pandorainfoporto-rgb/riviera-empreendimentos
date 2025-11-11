import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Workflow, 
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink
} from "lucide-react";

export default function ConfiguracaoIntegracoes() {
  const queryClient = useQueryClient();
  const [testandoIntegracao, setTestandoIntegracao] = useState(null);
  const [resultadoTeste, setResultadoTeste] = useState(null);

  // RECEITA FEDERAL (CNPJ)
  const [cnpjTeste, setCnpjTeste] = useState("");
  
  // CEP
  const [cepTeste, setCepTeste] = useState("");
  
  // RD STATION
  const [rdAccessToken, setRdAccessToken] = useState("");
  const [rdRefreshToken, setRdRefreshToken] = useState("");
  
  // PIPEFY
  const [pipefyToken, setPipefyToken] = useState("");
  const [pipefyPipeId, setPipefyPipeId] = useState("");
  
  // WHATSAPP
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  
  // SERPRO
  const [serproKey, setSerproKey] = useState("");
  const [serproSecret, setSerproSecret] = useState("");

  const testarReceitaFederal = async () => {
    try {
      setTestandoIntegracao('receita');
      setResultadoTeste(null);

      const response = await base44.functions.invoke('consultaReceitaFederal', {
        cnpj: cnpjTeste
      });

      setResultadoTeste({
        sucesso: response.data.success,
        dados: response.data,
      });
    } catch (error) {
      setResultadoTeste({
        sucesso: false,
        erro: error.message,
      });
    } finally {
      setTestandoIntegracao(null);
    }
  };

  const testarCEP = async () => {
    try {
      setTestandoIntegracao('cep');
      setResultadoTeste(null);

      const response = await base44.functions.invoke('consultaCEP', {
        cep: cepTeste
      });

      setResultadoTeste({
        sucesso: response.data.success,
        dados: response.data,
      });
    } catch (error) {
      setResultadoTeste({
        sucesso: false,
        erro: error.message,
      });
    } finally {
      setTestandoIntegracao(null);
    }
  };

  const testarRDStation = async () => {
    try {
      setTestandoIntegracao('rdstation');
      setResultadoTeste(null);

      const response = await base44.functions.invoke('integracaoRDStation', {
        action: 'buscarLeads',
        access_token: rdAccessToken,
        lead_data: { email: 'teste@teste.com' }
      });

      setResultadoTeste({
        sucesso: response.data.success,
        dados: response.data,
      });
    } catch (error) {
      setResultadoTeste({
        sucesso: false,
        erro: error.message,
      });
    } finally {
      setTestandoIntegracao(null);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Integrações Externas</h1>
        <p className="text-gray-600 mt-1">Configure e teste as integrações com APIs externas</p>
      </div>

      <Tabs defaultValue="governo" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="governo">🏛️ Governo</TabsTrigger>
          <TabsTrigger value="crm">🎯 CRM</TabsTrigger>
          <TabsTrigger value="comunicacao">💬 Comunicação</TabsTrigger>
          <TabsTrigger value="validacao">✅ Validação</TabsTrigger>
        </TabsList>

        {/* GOVERNO */}
        <TabsContent value="governo" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <CardTitle>Receita Federal - Consulta CNPJ</CardTitle>
              </div>
              <CardDescription>
                Valida e busca dados de empresas automaticamente via BrasilAPI e ReceitaWS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  ✅ <strong>Integração automática!</strong> Não requer configuração. 
                  Use diretamente em formulários de cadastro.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Label>Testar Consulta de CNPJ</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={cnpjTeste}
                    onChange={(e) => setCnpjTeste(e.target.value)}
                  />
                  <Button
                    onClick={testarReceitaFederal}
                    disabled={testandoIntegracao === 'receita'}
                  >
                    {testandoIntegracao === 'receita' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Testar'
                    )}
                  </Button>
                </div>
              </div>

              {resultadoTeste && (
                <Alert className={resultadoTeste.sucesso ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                  <AlertDescription>
                    {resultadoTeste.sucesso ? (
                      <div>
                        <p className="font-semibold text-green-800 mb-2">✅ Consulta realizada com sucesso!</p>
                        <div className="text-sm text-green-700 space-y-1">
                          <p><strong>Fonte:</strong> {resultadoTeste.dados.fonte}</p>
                          <p><strong>Razão Social:</strong> {resultadoTeste.dados.dados.razao_social}</p>
                          <p><strong>Nome Fantasia:</strong> {resultadoTeste.dados.dados.nome_fantasia}</p>
                          <p><strong>Situação:</strong> {resultadoTeste.dados.dados.situacao}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-red-800">❌ Erro: {resultadoTeste.erro}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <CardTitle>Consulta de CEP</CardTitle>
              </div>
              <CardDescription>
                Busca endereço completo via ViaCEP e BrasilAPI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  ✅ <strong>Integração automática!</strong> Preenche endereços automaticamente.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Label>Testar Consulta de CEP</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="00000-000"
                    value={cepTeste}
                    onChange={(e) => setCepTeste(e.target.value)}
                  />
                  <Button
                    onClick={testarCEP}
                    disabled={testandoIntegracao === 'cep'}
                  >
                    {testandoIntegracao === 'cep' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Testar'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRM */}
        <TabsContent value="crm" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-purple-600" />
                <CardTitle>RD Station CRM</CardTitle>
              </div>
              <CardDescription>
                Sincroniza leads, oportunidades e vendas automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Access Token</Label>
                <Input
                  type="password"
                  placeholder="Seu token de acesso..."
                  value={rdAccessToken}
                  onChange={(e) => setRdAccessToken(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Refresh Token</Label>
                <Input
                  type="password"
                  placeholder="Seu refresh token..."
                  value={rdRefreshToken}
                  onChange={(e) => setRdRefreshToken(e.target.value)}
                />
              </div>

              <Button onClick={testarRDStation} disabled={testandoIntegracao === 'rdstation'}>
                {testandoIntegracao === 'rdstation' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Testar Conexão
              </Button>

              <Alert>
                <AlertDescription>
                  <p className="text-sm">
                    📚 <strong>Como obter:</strong> Acesse RD Station → Configurações → Integrações → API
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-indigo-600" />
                <CardTitle>Pipefy</CardTitle>
              </div>
              <CardDescription>
                Automatiza processos de obras, vendas e contratos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>API Token</Label>
                <Input
                  type="password"
                  placeholder="Seu token Pipefy..."
                  value={pipefyToken}
                  onChange={(e) => setPipefyToken(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Pipe ID (Processo Principal)</Label>
                <Input
                  placeholder="ID do pipe..."
                  value={pipefyPipeId}
                  onChange={(e) => setPipefyPipeId(e.target.value)}
                />
              </div>

              <Alert>
                <AlertDescription>
                  <p className="text-sm">
                    📚 <strong>Como obter:</strong> Pipefy → Configurações → Developer → Personal Tokens
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMUNICAÇÃO */}
        <TabsContent value="comunicacao" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" />
                <CardTitle>WhatsApp Business API</CardTitle>
              </div>
              <CardDescription>
                Envia mensagens, templates e boletos via WhatsApp oficial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Phone Number ID</Label>
                <Input
                  placeholder="ID do número..."
                  value={whatsappPhoneId}
                  onChange={(e) => setWhatsappPhoneId(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Access Token</Label>
                <Input
                  type="password"
                  placeholder="Token de acesso..."
                  value={whatsappToken}
                  onChange={(e) => setWhatsappToken(e.target.value)}
                />
              </div>

              <Alert>
                <AlertDescription>
                  <p className="text-sm">
                    📚 <strong>Como obter:</strong> Meta Business → WhatsApp → API Setup → Access Tokens
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VALIDAÇÃO */}
        <TabsContent value="validacao" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-600" />
                <CardTitle>SERPRO Datavalid</CardTitle>
              </div>
              <CardDescription>
                Valida CPF, biometria facial e situação fiscal (Governo Federal)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Consumer Key</Label>
                <Input
                  type="password"
                  placeholder="Consumer Key..."
                  value={serproKey}
                  onChange={(e) => setSerproKey(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Consumer Secret</Label>
                <Input
                  type="password"
                  placeholder="Consumer Secret..."
                  value={serproSecret}
                  onChange={(e) => setSerproSecret(e.target.value)}
                />
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertDescription>
                  <p className="text-sm text-yellow-900">
                    ⚠️ <strong>Contratação necessária:</strong> Acesse serpro.gov.br para contratar o serviço
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}