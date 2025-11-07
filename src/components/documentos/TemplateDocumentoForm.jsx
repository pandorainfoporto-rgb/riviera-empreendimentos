import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, Save, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TemplateDocumentoForm({ template, onClose }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    tipo: "contrato_venda",
    categoria: "comercial",
    descricao: "",
    conteudo_template: "",
    instrucoes_ia: "",
    requer_testemunhas: false,
    quantidade_testemunhas: 2,
    requer_reconhecimento_firma: false,
    eh_padrao: false,
    ativo: true,
    ...template
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      if (template) {
        await base44.entities.DocumentoTemplate.update(template.id, formData);
      } else {
        await base44.entities.DocumentoTemplate.create(formData);
      }
      
      queryClient.invalidateQueries(['templates_documentos']);
      onClose();
    } catch (error) {
      setErro(error.message || 'Erro ao salvar template');
    } finally {
      setLoading(false);
    }
  };

  const conteudoExemplo = `<div style="font-family: Arial, sans-serif; padding: 20px;">
  <h1 style="text-align: center;">{{TIPO_DOCUMENTO}}</h1>
  
  <p style="margin: 20px 0;">
    <strong>Local e Data:</strong> {{CIDADE}}, {{DATA_COMPLETA}}
  </p>

  <h3>CONTRATANTE:</h3>
  <p>
    Nome: {{NOME_CLIENTE}}<br/>
    CPF/CNPJ: {{CPF_CNPJ_CLIENTE}}<br/>
    Endereço: {{ENDERECO_CLIENTE}}<br/>
    Telefone: {{TELEFONE_CLIENTE}}
  </p>

  <h3>CONTRATADO / IMÓVEL:</h3>
  <p>
    Imóvel: {{CODIGO_UNIDADE}}<br/>
    Endereço: {{ENDERECO_IMOVEL}}<br/>
    Área: {{AREA_TOTAL}} m²<br/>
    Matrícula: {{MATRICULA}}
  </p>

  <h3>CLÁUSULAS:</h3>
  <p>Cláusula 1ª - ...</p>
  <p>Cláusula 2ª - ...</p>

  <div style="margin-top: 50px;">
    <p>_________________________________</p>
    <p>Assinatura do Contratante</p>
  </div>
</div>`;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={onClose} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">
          {template ? 'Editar Template' : 'Novo Template'}
        </h1>
      </div>

      {erro && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{erro}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Template *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Contrato de Compra e Venda Padrão"
                  required
                />
              </div>

              <div>
                <Label>Código *</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ex: CONTRATO_VENDA_V1"
                  required
                />
              </div>

              <div>
                <Label>Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contrato_venda">Contrato de Venda</SelectItem>
                    <SelectItem value="contrato_locacao">Contrato de Locação</SelectItem>
                    <SelectItem value="proposta_venda">Proposta de Venda</SelectItem>
                    <SelectItem value="ficha_cadastral">Ficha Cadastral</SelectItem>
                    <SelectItem value="escritura">Escritura</SelectItem>
                    <SelectItem value="distrato">Distrato</SelectItem>
                    <SelectItem value="recibo">Recibo</SelectItem>
                    <SelectItem value="procuracao">Procuração</SelectItem>
                    <SelectItem value="declaracao">Declaração</SelectItem>
                    <SelectItem value="termo_entrega">Termo de Entrega</SelectItem>
                    <SelectItem value="vistoria">Vistoria</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Categoria *</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="juridico">Jurídico</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o propósito deste template..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conteúdo do Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Conteúdo HTML/Texto *</Label>
              <Textarea
                value={formData.conteudo_template}
                onChange={(e) => setFormData({ ...formData, conteudo_template: e.target.value })}
                placeholder={conteudoExemplo}
                rows={15}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use placeholders como {`{{NOME_CLIENTE}}`}, {`{{ENDERECO_IMOVEL}}`}, etc. 
                A IA preencherá automaticamente com os dados disponíveis.
              </p>
            </div>

            <div>
              <Label>Instruções Especiais para a IA</Label>
              <Textarea
                value={formData.instrucoes_ia}
                onChange={(e) => setFormData({ ...formData, instrucoes_ia: e.target.value })}
                placeholder="Ex: Incluir cláusula de multa rescisória de 10%, usar linguagem formal, mencionar prazo de 30 dias..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="testemunhas"
                checked={formData.requer_testemunhas}
                onCheckedChange={(checked) => setFormData({ ...formData, requer_testemunhas: checked })}
              />
              <Label htmlFor="testemunhas">Requer testemunhas</Label>
            </div>

            {formData.requer_testemunhas && (
              <div className="ml-6">
                <Label>Quantidade de Testemunhas</Label>
                <Input
                  type="number"
                  value={formData.quantidade_testemunhas}
                  onChange={(e) => setFormData({ ...formData, quantidade_testemunhas: parseInt(e.target.value) })}
                  min={1}
                  max={5}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="firma"
                checked={formData.requer_reconhecimento_firma}
                onCheckedChange={(checked) => setFormData({ ...formData, requer_reconhecimento_firma: checked })}
              />
              <Label htmlFor="firma">Requer reconhecimento de firma</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="padrao"
                checked={formData.eh_padrao}
                onCheckedChange={(checked) => setFormData({ ...formData, eh_padrao: checked })}
              />
              <Label htmlFor="padrao">Definir como template padrão deste tipo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="ativo">Template ativo</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Template
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}