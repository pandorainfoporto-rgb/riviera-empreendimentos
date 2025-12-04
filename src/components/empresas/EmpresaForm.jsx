import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Building2, MapPin, Phone, Mail, Globe, CreditCard, FileText,
  Settings, Palette, Shield, Save, X, Upload
} from "lucide-react";

export default function EmpresaForm({ empresa, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(empresa || {
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    telefone: "",
    telefone_secundario: "",
    whatsapp: "",
    email: "",
    email_financeiro: "",
    email_juridico: "",
    site: "",
    logo_url: "",
    regime_tributario: "simples_nacional",
    aliquota_iss: "",
    aliquota_ir: "",
    aliquota_pis: "",
    aliquota_cofins: "",
    responsavel_legal: "",
    responsavel_legal_cpf: "",
    responsavel_legal_rg: "",
    responsavel_legal_cargo: "",
    responsavel_legal_endereco: "",
    responsavel_tecnico: "",
    responsavel_tecnico_crea: "",
    responsavel_tecnico_cpf: "",
    responsavel_tecnico_especialidade: "",
    banco_principal: "",
    agencia: "",
    conta: "",
    tipo_conta: "corrente",
    pix: "",
    tipo_pix: "cnpj",
    capital_social: "",
    data_constituicao: "",
    tipo_empresa: "incorporadora",
    creci: "",
    cnae_principal: "",
    termos_uso_url: "",
    politica_privacidade_url: "",
    cores_marca: {
      primaria: "#922B3E",
      secundaria: "#7D5999",
      destaque: "#3b82f6"
    },
    redes_sociais: {
      instagram: "",
      facebook: "",
      linkedin: "",
      youtube: ""
    },
    integracao_gateway: {
      asaas_api_key: "",
      asaas_wallet_id: ""
    },
    integracao_bancaria: {
      banco_codigo: "",
      convenio: "",
      carteira: "",
      cedente_codigo: ""
    },
    configuracoes_contrato: {
      juros_padrao: 0.1,
      multa_padrao: 2,
      correcao_monetaria_padrao: "igpm",
      prazo_entrega_padrao_meses: 18
    },
    eh_principal: false,
    ativa: true,
    observacoes: ""
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="shadow-2xl border-t-4 border-[var(--wine-600)]">
        <CardHeader>
          <CardTitle className="text-[var(--wine-700)] text-2xl flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            {empresa ? 'Editar Empresa' : 'Nova Empresa'}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="dados_basicos" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
              <TabsTrigger value="dados_basicos">
                <Building2 className="w-4 h-4 mr-1" />
                Básicos
              </TabsTrigger>
              <TabsTrigger value="endereco">
                <MapPin className="w-4 h-4 mr-1" />
                Endereço
              </TabsTrigger>
              <TabsTrigger value="contatos">
                <Phone className="w-4 h-4 mr-1" />
                Contatos
              </TabsTrigger>
              <TabsTrigger value="fiscal">
                <FileText className="w-4 h-4 mr-1" />
                Fiscal
              </TabsTrigger>
              <TabsTrigger value="responsaveis">
                <Shield className="w-4 h-4 mr-1" />
                Responsáveis
              </TabsTrigger>
              <TabsTrigger value="integracoes">
                <Settings className="w-4 h-4 mr-1" />
                Integrações
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px] mt-6">
              <div className="pr-4">
                {/* DADOS BÁSICOS */}
                <TabsContent value="dados_basicos" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Razão Social *</Label>
                      <Input
                        value={formData.razao_social}
                        onChange={(e) => handleChange('razao_social', e.target.value)}
                        placeholder="Ex: Riviera Incorporações Ltda"
                        required
                      />
                    </div>
                    <div>
                      <Label>Nome Fantasia</Label>
                      <Input
                        value={formData.nome_fantasia}
                        onChange={(e) => handleChange('nome_fantasia', e.target.value)}
                        placeholder="Ex: Riviera"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>CNPJ *</Label>
                      <Input
                        value={formData.cnpj}
                        onChange={(e) => handleChange('cnpj', e.target.value)}
                        placeholder="00.000.000/0000-00"
                        required
                      />
                    </div>
                    <div>
                      <Label>Inscrição Estadual</Label>
                      <Input
                        value={formData.inscricao_estadual}
                        onChange={(e) => handleChange('inscricao_estadual', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Inscrição Municipal</Label>
                      <Input
                        value={formData.inscricao_municipal}
                        onChange={(e) => handleChange('inscricao_municipal', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Tipo de Empresa</Label>
                      <Select
                        value={formData.tipo_empresa}
                        onValueChange={(value) => handleChange('tipo_empresa', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="incorporadora">Incorporadora</SelectItem>
                          <SelectItem value="construtora">Construtora</SelectItem>
                          <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                          <SelectItem value="administradora">Administradora</SelectItem>
                          <SelectItem value="mista">Mista</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>CNAE Principal</Label>
                      <Input
                        value={formData.cnae_principal}
                        onChange={(e) => handleChange('cnae_principal', e.target.value)}
                        placeholder="0000-0/00"
                      />
                    </div>
                    <div>
                      <Label>CRECI (Imobiliárias)</Label>
                      <Input
                        value={formData.creci}
                        onChange={(e) => handleChange('creci', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Capital Social</Label>
                      <Input
                        type="number"
                        value={formData.capital_social}
                        onChange={(e) => handleChange('capital_social', parseFloat(e.target.value) || '')}
                        placeholder="R$ 0,00"
                      />
                    </div>
                    <div>
                      <Label>Data de Constituição</Label>
                      <Input
                        type="date"
                        value={formData.data_constituicao}
                        onChange={(e) => handleChange('data_constituicao', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>URL do Logotipo</Label>
                    <Input
                      value={formData.logo_url}
                      onChange={(e) => handleChange('logo_url', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Switch
                      checked={formData.eh_principal}
                      onCheckedChange={(checked) => handleChange('eh_principal', checked)}
                    />
                    <div>
                      <Label>Empresa Principal</Label>
                      <p className="text-xs text-gray-600">Marque se esta é a empresa principal do sistema</p>
                    </div>
                  </div>
                </TabsContent>

                {/* ENDEREÇO */}
                <TabsContent value="endereco" className="space-y-4">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                      <Label>Logradouro</Label>
                      <Input
                        value={formData.logradouro}
                        onChange={(e) => handleChange('logradouro', e.target.value)}
                        placeholder="Rua, Avenida..."
                      />
                    </div>
                    <div>
                      <Label>Número</Label>
                      <Input
                        value={formData.numero}
                        onChange={(e) => handleChange('numero', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Complemento</Label>
                      <Input
                        value={formData.complemento}
                        onChange={(e) => handleChange('complemento', e.target.value)}
                        placeholder="Sala, Andar..."
                      />
                    </div>
                    <div>
                      <Label>Bairro</Label>
                      <Input
                        value={formData.bairro}
                        onChange={(e) => handleChange('bairro', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Cidade</Label>
                      <Input
                        value={formData.cidade}
                        onChange={(e) => handleChange('cidade', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Estado (UF)</Label>
                      <Input
                        value={formData.estado}
                        onChange={(e) => handleChange('estado', e.target.value.toUpperCase())}
                        maxLength={2}
                        placeholder="SP"
                      />
                    </div>
                    <div>
                      <Label>CEP</Label>
                      <Input
                        value={formData.cep}
                        onChange={(e) => handleChange('cep', e.target.value)}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* CONTATOS */}
                <TabsContent value="contatos" className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Telefone Principal
                      </Label>
                      <Input
                        value={formData.telefone}
                        onChange={(e) => handleChange('telefone', e.target.value)}
                        placeholder="(00) 0000-0000"
                      />
                    </div>
                    <div>
                      <Label>Telefone Secundário</Label>
                      <Input
                        value={formData.telefone_secundario}
                        onChange={(e) => handleChange('telefone_secundario', e.target.value)}
                        placeholder="(00) 0000-0000"
                      />
                    </div>
                    <div>
                      <Label>WhatsApp</Label>
                      <Input
                        value={formData.whatsapp}
                        onChange={(e) => handleChange('whatsapp', e.target.value)}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        E-mail Principal
                      </Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="contato@empresa.com"
                      />
                    </div>
                    <div>
                      <Label>E-mail Financeiro</Label>
                      <Input
                        type="email"
                        value={formData.email_financeiro}
                        onChange={(e) => handleChange('email_financeiro', e.target.value)}
                        placeholder="financeiro@empresa.com"
                      />
                    </div>
                    <div>
                      <Label>E-mail Jurídico</Label>
                      <Input
                        type="email"
                        value={formData.email_juridico}
                        onChange={(e) => handleChange('email_juridico', e.target.value)}
                        placeholder="juridico@empresa.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Website
                    </Label>
                    <Input
                      value={formData.site}
                      onChange={(e) => handleChange('site', e.target.value)}
                      placeholder="https://www.empresa.com.br"
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Redes Sociais</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Instagram</Label>
                        <Input
                          value={formData.redes_sociais?.instagram || ''}
                          onChange={(e) => handleNestedChange('redes_sociais', 'instagram', e.target.value)}
                          placeholder="@empresa"
                        />
                      </div>
                      <div>
                        <Label>Facebook</Label>
                        <Input
                          value={formData.redes_sociais?.facebook || ''}
                          onChange={(e) => handleNestedChange('redes_sociais', 'facebook', e.target.value)}
                          placeholder="facebook.com/empresa"
                        />
                      </div>
                      <div>
                        <Label>LinkedIn</Label>
                        <Input
                          value={formData.redes_sociais?.linkedin || ''}
                          onChange={(e) => handleNestedChange('redes_sociais', 'linkedin', e.target.value)}
                          placeholder="linkedin.com/company/empresa"
                        />
                      </div>
                      <div>
                        <Label>YouTube</Label>
                        <Input
                          value={formData.redes_sociais?.youtube || ''}
                          onChange={(e) => handleNestedChange('redes_sociais', 'youtube', e.target.value)}
                          placeholder="youtube.com/@empresa"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* FISCAL */}
                <TabsContent value="fiscal" className="space-y-4">
                  <div>
                    <Label>Regime Tributário</Label>
                    <Select
                      value={formData.regime_tributario}
                      onValueChange={(value) => handleChange('regime_tributario', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                        <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                        <SelectItem value="lucro_real">Lucro Real</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Alíquota ISS (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.aliquota_iss}
                        onChange={(e) => handleChange('aliquota_iss', parseFloat(e.target.value) || '')}
                        placeholder="Ex: 2.5"
                      />
                    </div>
                    <div>
                      <Label>Alíquota IR (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.aliquota_ir}
                        onChange={(e) => handleChange('aliquota_ir', parseFloat(e.target.value) || '')}
                        placeholder="Ex: 15"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Alíquota PIS (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.aliquota_pis}
                        onChange={(e) => handleChange('aliquota_pis', parseFloat(e.target.value) || '')}
                        placeholder="Ex: 0.65"
                      />
                    </div>
                    <div>
                      <Label>Alíquota COFINS (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.aliquota_cofins}
                        onChange={(e) => handleChange('aliquota_cofins', parseFloat(e.target.value) || '')}
                        placeholder="Ex: 3"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Configurações de Contrato</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Juros Padrão (% ao dia)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.configuracoes_contrato?.juros_padrao || ''}
                          onChange={(e) => handleNestedChange('configuracoes_contrato', 'juros_padrao', parseFloat(e.target.value) || 0)}
                          placeholder="0.1"
                        />
                      </div>
                      <div>
                        <Label>Multa Padrão (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.configuracoes_contrato?.multa_padrao || ''}
                          onChange={(e) => handleNestedChange('configuracoes_contrato', 'multa_padrao', parseFloat(e.target.value) || 0)}
                          placeholder="2"
                        />
                      </div>
                      <div>
                        <Label>Correção Monetária Padrão</Label>
                        <Select
                          value={formData.configuracoes_contrato?.correcao_monetaria_padrao || 'igpm'}
                          onValueChange={(value) => handleNestedChange('configuracoes_contrato', 'correcao_monetaria_padrao', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="igpm">IGP-M</SelectItem>
                            <SelectItem value="ipca">IPCA</SelectItem>
                            <SelectItem value="incc">INCC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Prazo Entrega Padrão (meses)</Label>
                        <Input
                          type="number"
                          value={formData.configuracoes_contrato?.prazo_entrega_padrao_meses || ''}
                          onChange={(e) => handleNestedChange('configuracoes_contrato', 'prazo_entrega_padrao_meses', parseInt(e.target.value) || 0)}
                          placeholder="18"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* RESPONSÁVEIS */}
                <TabsContent value="responsaveis" className="space-y-4">
                  <Card className="bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-base">Responsável Legal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nome Completo</Label>
                          <Input
                            value={formData.responsavel_legal}
                            onChange={(e) => handleChange('responsavel_legal', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Cargo</Label>
                          <Input
                            value={formData.responsavel_legal_cargo}
                            onChange={(e) => handleChange('responsavel_legal_cargo', e.target.value)}
                            placeholder="Diretor, Sócio..."
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>CPF</Label>
                          <Input
                            value={formData.responsavel_legal_cpf}
                            onChange={(e) => handleChange('responsavel_legal_cpf', e.target.value)}
                            placeholder="000.000.000-00"
                          />
                        </div>
                        <div>
                          <Label>RG</Label>
                          <Input
                            value={formData.responsavel_legal_rg}
                            onChange={(e) => handleChange('responsavel_legal_rg', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Endereço Residencial</Label>
                        <Input
                          value={formData.responsavel_legal_endereco}
                          onChange={(e) => handleChange('responsavel_legal_endereco', e.target.value)}
                          placeholder="Endereço completo..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-base">Responsável Técnico</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nome Completo</Label>
                          <Input
                            value={formData.responsavel_tecnico}
                            onChange={(e) => handleChange('responsavel_tecnico', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Especialidade</Label>
                          <Input
                            value={formData.responsavel_tecnico_especialidade}
                            onChange={(e) => handleChange('responsavel_tecnico_especialidade', e.target.value)}
                            placeholder="Engenheiro Civil, Arquiteto..."
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>CPF</Label>
                          <Input
                            value={formData.responsavel_tecnico_cpf}
                            onChange={(e) => handleChange('responsavel_tecnico_cpf', e.target.value)}
                            placeholder="000.000.000-00"
                          />
                        </div>
                        <div>
                          <Label>CREA</Label>
                          <Input
                            value={formData.responsavel_tecnico_crea}
                            onChange={(e) => handleChange('responsavel_tecnico_crea', e.target.value)}
                            placeholder="000000-0/SP"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* INTEGRAÇÕES */}
                <TabsContent value="integracoes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Dados Bancários
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <Label>Banco Principal</Label>
                          <Input
                            value={formData.banco_principal}
                            onChange={(e) => handleChange('banco_principal', e.target.value)}
                            placeholder="Banco do Brasil"
                          />
                        </div>
                        <div>
                          <Label>Agência</Label>
                          <Input
                            value={formData.agencia}
                            onChange={(e) => handleChange('agencia', e.target.value)}
                            placeholder="0000"
                          />
                        </div>
                        <div>
                          <Label>Conta</Label>
                          <Input
                            value={formData.conta}
                            onChange={(e) => handleChange('conta', e.target.value)}
                            placeholder="00000-0"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>Tipo de Conta</Label>
                          <Select
                            value={formData.tipo_conta}
                            onValueChange={(value) => handleChange('tipo_conta', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="corrente">Conta Corrente</SelectItem>
                              <SelectItem value="poupanca">Conta Poupança</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Tipo Chave PIX</Label>
                          <Select
                            value={formData.tipo_pix}
                            onValueChange={(value) => handleChange('tipo_pix', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cnpj">CNPJ</SelectItem>
                              <SelectItem value="email">E-mail</SelectItem>
                              <SelectItem value="telefone">Telefone</SelectItem>
                              <SelectItem value="chave_aleatoria">Chave Aleatória</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Chave PIX</Label>
                          <Input
                            value={formData.pix}
                            onChange={(e) => handleChange('pix', e.target.value)}
                            placeholder="00.000.000/0000-00"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Integração Bancária (Boletos/CNAB)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Código do Banco</Label>
                          <Input
                            value={formData.integracao_bancaria?.banco_codigo || ''}
                            onChange={(e) => handleNestedChange('integracao_bancaria', 'banco_codigo', e.target.value)}
                            placeholder="001, 033, 237..."
                          />
                        </div>
                        <div>
                          <Label>Convênio</Label>
                          <Input
                            value={formData.integracao_bancaria?.convenio || ''}
                            onChange={(e) => handleNestedChange('integracao_bancaria', 'convenio', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Carteira</Label>
                          <Input
                            value={formData.integracao_bancaria?.carteira || ''}
                            onChange={(e) => handleNestedChange('integracao_bancaria', 'carteira', e.target.value)}
                            placeholder="17, 18..."
                          />
                        </div>
                        <div>
                          <Label>Código Cedente</Label>
                          <Input
                            value={formData.integracao_bancaria?.cedente_codigo || ''}
                            onChange={(e) => handleNestedChange('integracao_bancaria', 'cedente_codigo', e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Gateway de Pagamento (Asaas)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>API Key</Label>
                          <Input
                            type="password"
                            value={formData.integracao_gateway?.asaas_api_key || ''}
                            onChange={(e) => handleNestedChange('integracao_gateway', 'asaas_api_key', e.target.value)}
                            placeholder="••••••••••••••••"
                          />
                        </div>
                        <div>
                          <Label>Wallet ID</Label>
                          <Input
                            value={formData.integracao_gateway?.asaas_wallet_id || ''}
                            onChange={(e) => handleNestedChange('integracao_gateway', 'asaas_wallet_id', e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Identidade Visual
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>Cor Primária</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={formData.cores_marca?.primaria || '#922B3E'}
                              onChange={(e) => handleNestedChange('cores_marca', 'primaria', e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={formData.cores_marca?.primaria || '#922B3E'}
                              onChange={(e) => handleNestedChange('cores_marca', 'primaria', e.target.value)}
                              placeholder="#922B3E"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Cor Secundária</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={formData.cores_marca?.secundaria || '#7D5999'}
                              onChange={(e) => handleNestedChange('cores_marca', 'secundaria', e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={formData.cores_marca?.secundaria || '#7D5999'}
                              onChange={(e) => handleNestedChange('cores_marca', 'secundaria', e.target.value)}
                              placeholder="#7D5999"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Cor de Destaque</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={formData.cores_marca?.destaque || '#3b82f6'}
                              onChange={(e) => handleNestedChange('cores_marca', 'destaque', e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={formData.cores_marca?.destaque || '#3b82f6'}
                              onChange={(e) => handleNestedChange('cores_marca', 'destaque', e.target.value)}
                              placeholder="#3b82f6"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>URL - Termos de Uso</Label>
                          <Input
                            value={formData.termos_uso_url}
                            onChange={(e) => handleChange('termos_uso_url', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <Label>URL - Política de Privacidade</Label>
                          <Input
                            value={formData.politica_privacidade_url}
                            onChange={(e) => handleChange('politica_privacidade_url', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>

          <div className="mt-4">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              rows={3}
              placeholder="Observações gerais sobre a empresa..."
            />
          </div>
        </CardContent>

        <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isProcessing}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            <Save className="w-4 h-4 mr-2" />
            {empresa ? 'Atualizar' : 'Salvar'} Empresa
          </Button>
        </div>
      </Card>
    </form>
  );
}