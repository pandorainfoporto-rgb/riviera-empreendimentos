
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Building2, MapPin, CreditCard, Plus, User, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function ImobiliariaForm({ item, corretores, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    nome: "",
    cnpj: "",
    creci: "",
    razao_social: "",
    telefone: "",
    email: "",
    site: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    responsavel_nome: "",
    responsavel_telefone: "",
    percentual_comissao_padrao: 6,
    banco: "",
    agencia: "",
    conta: "",
    pix: "",
    user_id: "",
    tem_acesso_portal: false,
    ativa: true,
    observacoes: "",
  });

  const navigate = useNavigate();

  // Buscar usuários do tipo imobiliaria
  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => base44.entities.User.list(),
  });

  const usuariosImobiliaria = usuarios.filter(u => u.tipo_acesso === 'imobiliaria' && !u.imobiliaria_id);
  const usuarioVinculado = item?.user_id ? usuarios.find(u => u.id === item.user_id) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleCadastrarCorretor = () => {
    navigate(createPageUrl('Corretores') + '?from=imobiliaria');
  };

  const handleConvidarUsuario = () => {
    navigate(createPageUrl('Usuarios') + '?tipo=imobiliaria&voltar=imobiliarias');
  };

  const corretoresVinculados = corretores.filter(c => c.imobiliaria_id === item?.id);

  return (
    <Card className="shadow-xl border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          {item ? "Editar Imobiliária" : "Nova Imobiliária"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="contato">Contato</TabsTrigger>
              <TabsTrigger value="pagamento">Comissões</TabsTrigger>
              <TabsTrigger value="usuario">Usuário</TabsTrigger>
              <TabsTrigger value="corretores">Corretores</TabsTrigger>
            </TabsList>

            {/* ABA DADOS GERAIS */}
            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Imobiliária *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creci">CRECI</Label>
                  <Input
                    id="creci"
                    value={formData.creci}
                    onChange={(e) => setFormData({ ...formData, creci: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razao_social">Razão Social</Label>
                  <Input
                    id="razao_social"
                    value={formData.razao_social}
                    onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ativa"
                  checked={formData.ativa}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativa: checked })}
                />
                <Label htmlFor="ativa" className="cursor-pointer">Imobiliária Ativa</Label>
              </div>
            </TabsContent>

            {/* ABA CONTATO */}
            <TabsContent value="contato" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site">Website</Label>
                <Input
                  id="site"
                  value={formData.site}
                  onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                  placeholder="https://www.exemplo.com.br"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Endereço
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço Completo</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado (UF)</Label>
                      <Input
                        id="estado"
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Responsável / Gerente</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_nome">Nome do Responsável</Label>
                    <Input
                      id="responsavel_nome"
                      value={formData.responsavel_nome}
                      onChange={(e) => setFormData({ ...formData, responsavel_nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_telefone">Telefone do Responsável</Label>
                    <Input
                      id="responsavel_telefone"
                      value={formData.responsavel_telefone}
                      onChange={(e) => setFormData({ ...formData, responsavel_telefone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ABA COMISSÕES E PAGAMENTO */}
            <TabsContent value="pagamento" className="space-y-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Importante:</strong> Defina o percentual padrão de comissão e dados para pagamento.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentual_comissao_padrao">Percentual de Comissão Padrão (%)</Label>
                <Input
                  id="percentual_comissao_padrao"
                  type="number"
                  step="0.01"
                  value={formData.percentual_comissao_padrao}
                  onChange={(e) => setFormData({ ...formData, percentual_comissao_padrao: parseFloat(e.target.value) || 0 })}
                  placeholder="Ex: 6"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Dados Bancários
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="banco">Banco</Label>
                    <Input
                      id="banco"
                      value={formData.banco}
                      onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agencia">Agência</Label>
                    <Input
                      id="agencia"
                      value={formData.agencia}
                      onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conta">Conta</Label>
                    <Input
                      id="conta"
                      value={formData.conta}
                      onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="pix">Chave PIX</Label>
                  <Input
                    id="pix"
                    value={formData.pix}
                    onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ABA USUÁRIO */}
            <TabsContent value="usuario" className="space-y-4 mt-4">
              <Alert className="bg-blue-50 border-blue-200">
                <User className="w-4 h-4 text-blue-600" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Acesso ao Portal da Imobiliária</p>
                  <p className="text-sm">
                    Vincule um usuário para que a imobiliária possa acessar o portal e visualizar lotes, 
                    cadastrar leads e enviar mensagens.
                  </p>
                </AlertDescription>
              </Alert>

              {usuarioVinculado && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-green-900">✓ Usuário Vinculado</p>
                        <p className="text-sm text-green-700 mt-1">{usuarioVinculado.full_name}</p>
                        <p className="text-sm text-green-600">{usuarioVinculado.email}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, user_id: "", tem_acesso_portal: false })}
                      >
                        Desvincular
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!formData.user_id && (
                <>
                  <div className="space-y-2">
                    <Label>Selecionar Usuário Existente</Label>
                    <Select 
                      value={formData.user_id || ""} 
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        user_id: value,
                        tem_acesso_portal: !!value 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um usuário..." />
                      </SelectTrigger>
                      <SelectContent>
                        {usuariosImobiliaria.length === 0 ? (
                          <div className="p-4 text-sm text-gray-500 text-center">
                            Nenhum usuário tipo "imobiliária" disponível
                          </div>
                        ) : (
                          usuariosImobiliaria.map(usuario => (
                            <SelectItem key={usuario.id} value={usuario.id}>
                              {usuario.full_name} ({usuario.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Ainda não tem um usuário para esta imobiliária?
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleConvidarUsuario}
                      className="w-full"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Convidar Novo Usuário
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Você será redirecionado para a página de Usuários onde poderá convidar um novo usuário 
                      do tipo "imobiliária". Depois volte aqui para vincular.
                    </p>
                  </div>

                  <Alert>
                    <AlertDescription className="text-sm">
                      <strong>Como funciona:</strong>
                      <ol className="list-decimal ml-4 mt-2 space-y-1">
                        <li>Convide um usuário pela página de Usuários</li>
                        <li>Defina o tipo como "imobiliária"</li>
                        <li>O usuário receberá um email para criar senha</li>
                        <li>Depois volte aqui e vincule o usuário à imobiliária</li>
                        <li>O usuário terá acesso ao Portal da Imobiliária</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {formData.tem_acesso_portal && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <p className="font-semibold text-green-900">Acesso ao Portal Habilitado</p>
                  </div>
                  <p className="text-sm text-green-700">
                    Esta imobiliária poderá acessar o portal em{' '}
                    <code className="bg-green-200 px-2 py-1 rounded text-xs">
                      /portal-imobiliaria
                    </code>
                  </p>
                </div>
              )}
            </TabsContent>

            {/* ABA CORRETORES */}
            <TabsContent value="corretores" className="space-y-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Corretores Vinculados</h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCadastrarCorretor}
                  className="bg-gradient-to-r from-blue-600 to-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Corretor
                </Button>
              </div>

              {item && corretoresVinculados.length > 0 ? (
                <div className="space-y-2">
                  {corretoresVinculados.map(corretor => (
                    <div key={corretor.id} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{corretor.nome}</p>
                          <p className="text-sm text-gray-600">CRECI: {corretor.creci}</p>
                          <p className="text-sm text-gray-600">Comissão: {corretor.percentual_comissao_padrao}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {item 
                    ? "Nenhum corretor vinculado a esta imobiliária"
                    : "Salve a imobiliária primeiro para vincular corretores"
                  }
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 bg-gray-50">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isProcessing}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
          >
            <Save className="w-4 h-4 mr-2" />
            {isProcessing ? "Salvando..." : "Salvar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
