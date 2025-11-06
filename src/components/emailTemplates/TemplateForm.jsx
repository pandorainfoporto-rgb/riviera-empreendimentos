import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ReactQuill from 'react-quill';
import { X, Plus, Code, Save, ArrowLeft, HelpCircle } from "lucide-react";

const PlaceholdersComuns = [
  { chave: "{{nome_cliente}}", descricao: "Nome do cliente", tipo: "texto", obrigatorio: true },
  { chave: "{{email_cliente}}", descricao: "Email do cliente", tipo: "texto", obrigatorio: true },
  { chave: "{{telefone_cliente}}", descricao: "Telefone do cliente", tipo: "texto", obrigatorio: false },
  { chave: "{{cpf_cliente}}", descricao: "CPF do cliente", tipo: "texto", obrigatorio: false },
  { chave: "{{nome_empresa}}", descricao: "Nome da empresa", tipo: "texto", obrigatorio: false },
  { chave: "{{data_hoje}}", descricao: "Data de hoje", tipo: "data", obrigatorio: false },
  { chave: "{{valor}}", descricao: "Valor monetário", tipo: "moeda", obrigatorio: false },
  { chave: "{{numero_pedido}}", descricao: "Número do pedido", tipo: "numero", obrigatorio: false },
  { chave: "{{link_portal}}", descricao: "Link para o portal do cliente", tipo: "texto", obrigatorio: false },
  { chave: "{{data_vencimento}}", descricao: "Data de vencimento", tipo: "data", obrigatorio: false },
];

export default function TemplateForm(props) {
  const { template, onSave, onCancel, isSaving } = props;
  
  const [form, setForm] = useState({
    nome: "",
    assunto: "",
    codigo: "",
    categoria: "transacional",
    descricao: "",
    conteudo_html: "",
    conteudo_texto: "",
    placeholders_disponiveis: [],
    ativo: true,
    eh_padrao: false,
    tags: [],
    configuracoes: {
      remetente_nome: "Riviera Incorporadora",
      remetente_email: "contato@riviera-empreendimentos.com",
      reply_to: "",
      incluir_logo: true,
      incluir_rodape: true,
      cor_principal: "#922B3E"
    }
  });

  const [novaTag, setNovaTag] = useState("");
  const [modoVisualizacao, setModoVisualizacao] = useState("editor");

  useEffect(() => {
    if (template) {
      setForm({
        ...template,
        configuracoes: template.configuracoes || {
          remetente_nome: "Riviera Incorporadora",
          remetente_email: "contato@riviera-empreendimentos.com",
          reply_to: "",
          incluir_logo: true,
          incluir_rodape: true,
          cor_principal: "#922B3E"
        },
        placeholders_disponiveis: template.placeholders_disponiveis || [],
        tags: template.tags || []
      });
    }
  }, [template]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!form.nome || !form.assunto || !form.codigo || !form.conteudo_html) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    onSave(form);
  };

  const adicionarPlaceholder = (placeholder) => {
    if (form.placeholders_disponiveis.some(p => p.chave === placeholder.chave)) {
      return;
    }
    
    setForm({
      ...form,
      placeholders_disponiveis: [...form.placeholders_disponiveis, placeholder]
    });
  };

  const removerPlaceholder = (chave) => {
    setForm({
      ...form,
      placeholders_disponiveis: form.placeholders_disponiveis.filter(p => p.chave !== chave)
    });
  };

  const inserirPlaceholderNoEditor = (chave) => {
    const novoConteudo = form.conteudo_html + " " + chave + " ";
    setForm({ ...form, conteudo_html: novoConteudo });
  };

  const adicionarTag = () => {
    if (novaTag && !form.tags.includes(novaTag)) {
      setForm({ ...form, tags: [...form.tags, novaTag] });
      setNovaTag("");
    }
  };

  const removerTag = (tag) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) });
  };

  const gerarCodigo = () => {
    const codigo = form.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_');
    setForm({ ...form, codigo });
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">
            {template ? 'Editar Template' : 'Novo Template'}
          </h1>
          <p className="text-gray-600 mt-1">Configure todos os detalhes do template de email</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basico" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basico">Básico</TabsTrigger>
            <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
            <TabsTrigger value="placeholders">Placeholders</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="basico">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Template *</Label>
                    <Input
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Ex: Boas-vindas Cliente"
                    />
                  </div>

                  <div>
                    <Label>Código Único *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.codigo}
                        onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                        placeholder="Ex: boas_vindas_cliente"
                      />
                      <Button type="button" variant="outline" onClick={gerarCodigo}>
                        <Code className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Assunto do Email *</Label>
                  <Input
                    value={form.assunto}
                    onChange={(e) => setForm({ ...form, assunto: e.target.value })}
                    placeholder="Ex: Bem-vindo(a) à Riviera Incorporadora"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Categoria</Label>
                    <Select value={form.categoria} onValueChange={(value) => setForm({ ...form, categoria: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transacional">Transacional</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="notificacao">Notificação</SelectItem>
                        <SelectItem value="boas_vindas">Boas-vindas</SelectItem>
                        <SelectItem value="confirmacao">Confirmação</SelectItem>
                        <SelectItem value="lembrete">Lembrete</SelectItem>
                        <SelectItem value="cobranca">Cobrança</SelectItem>
                        <SelectItem value="financeiro">Financeiro</SelectItem>
                        <SelectItem value="obra">Obra</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4 pt-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={form.ativo}
                        onCheckedChange={(checked) => setForm({ ...form, ativo: checked })}
                      />
                      <Label>Ativo</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={form.eh_padrao}
                        onCheckedChange={(checked) => setForm({ ...form, eh_padrao: checked })}
                      />
                      <Label>Padrão</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={form.descricao || ''}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    placeholder="Descreva o propósito e quando usar este template..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={novaTag}
                      onChange={(e) => setNovaTag(e.target.value)}
                      placeholder="Digite uma tag..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          adicionarTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={adicionarTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="gap-1">
                        {tag}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removerTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conteudo">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Conteúdo do Email</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={modoVisualizacao === "editor" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setModoVisualizacao("editor")}
                    >
                      Editor
                    </Button>
                    <Button
                      type="button"
                      variant={modoVisualizacao === "codigo" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setModoVisualizacao("codigo")}
                    >
                      <Code className="w-4 h-4 mr-2" />
                      HTML
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {modoVisualizacao === "editor" && (
                  <div>
                    <Label>Conteúdo HTML *</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <ReactQuill
                        theme="snow"
                        value={form.conteudo_html}
                        onChange={(value) => setForm({ ...form, conteudo_html: value })}
                        modules={modules}
                        style={{ minHeight: '400px' }}
                      />
                    </div>
                  </div>
                )}

                {modoVisualizacao === "codigo" && (
                  <div>
                    <Label>Código HTML *</Label>
                    <Textarea
                      value={form.conteudo_html}
                      onChange={(e) => setForm({ ...form, conteudo_html: e.target.value })}
                      rows={20}
                      className="font-mono text-sm"
                      placeholder="<html>...</html>"
                    />
                  </div>
                )}

                <div>
                  <Label>Versão Texto Puro</Label>
                  <Textarea
                    value={form.conteudo_texto || ''}
                    onChange={(e) => setForm({ ...form, conteudo_texto: e.target.value })}
                    rows={8}
                    placeholder="Versão em texto simples..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="placeholders">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    Placeholders Comuns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {PlaceholdersComuns.map((ph, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <code className="text-sm font-mono">{ph.chave}</code>
                          <p className="text-xs text-gray-600">{ph.descricao}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => adicionarPlaceholder(ph)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => inserirPlaceholderNoEditor(ph.chave)}
                          >
                            Inserir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Placeholders do Template</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.placeholders_disponiveis.length > 0 ? (
                    <div className="space-y-2">
                      {form.placeholders_disponiveis.map((ph, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <code className="text-sm font-mono">{ph.chave}</code>
                            <p className="text-xs text-gray-600">{ph.descricao}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{ph.tipo}</Badge>
                              {ph.obrigatorio && <Badge className="text-xs bg-red-100 text-red-800">Obrigatório</Badge>}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removerPlaceholder(ph.chave)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Nenhum placeholder adicionado
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="configuracoes">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Envio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Remetente</Label>
                    <Input
                      value={form.configuracoes.remetente_nome}
                      onChange={(e) => setForm({
                        ...form,
                        configuracoes: { ...form.configuracoes, remetente_nome: e.target.value }
                      })}
                    />
                  </div>

                  <div>
                    <Label>Email do Remetente</Label>
                    <Input
                      type="email"
                      value={form.configuracoes.remetente_email}
                      onChange={(e) => setForm({
                        ...form,
                        configuracoes: { ...form.configuracoes, remetente_email: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Reply To</Label>
                  <Input
                    type="email"
                    value={form.configuracoes.reply_to || ''}
                    onChange={(e) => setForm({
                      ...form,
                      configuracoes: { ...form.configuracoes, reply_to: e.target.value }
                    })}
                    placeholder="Email de resposta"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.configuracoes.incluir_logo}
                      onCheckedChange={(checked) => setForm({
                        ...form,
                        configuracoes: { ...form.configuracoes, incluir_logo: checked }
                      })}
                    />
                    <Label>Incluir Logo</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.configuracoes.incluir_rodape}
                      onCheckedChange={(checked) => setForm({
                        ...form,
                        configuracoes: { ...form.configuracoes, incluir_rodape: checked }
                      })}
                    />
                    <Label>Incluir Rodapé</Label>
                  </div>

                  <div>
                    <Label>Cor Principal</Label>
                    <Input
                      type="color"
                      value={form.configuracoes.cor_principal}
                      onChange={(e) => setForm({
                        ...form,
                        configuracoes: { ...form.configuracoes, cor_principal: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving} className="bg-[var(--wine-600)]">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Template'}
          </Button>
        </div>
      </form>
    </div>
  );
}