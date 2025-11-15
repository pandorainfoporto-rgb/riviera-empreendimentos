import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const VARIAVEIS_DISPONIVEIS = [
  { categoria: "Cliente", variaveis: [
    "{{NOME_CLIENTE}}", "{{CPF_CNPJ_CLIENTE}}", "{{TELEFONE_CLIENTE}}", "{{EMAIL_CLIENTE}}",
    "{{ENDERECO_CLIENTE}}", "{{NUMERO_CLIENTE}}", "{{BAIRRO_CLIENTE}}", "{{CIDADE_CLIENTE}}",
    "{{ESTADO_CLIENTE}}", "{{CEP_CLIENTE}}", "{{PROFISSAO_CLIENTE}}", "{{NACIONALIDADE_CLIENTE}}",
    "{{ESTADO_CIVIL_CLIENTE}}"
  ]},
  { categoria: "Unidade/Imóvel", variaveis: [
    "{{CODIGO_UNIDADE}}", "{{TIPO_IMOVEL}}", "{{AREA_TOTAL}}", "{{AREA_CONSTRUIDA}}",
    "{{QUARTOS}}", "{{BANHEIROS}}", "{{VAGAS_GARAGEM}}", "{{ENDERECO_IMOVEL}}",
    "{{NUMERO_IMOVEL}}", "{{BAIRRO_IMOVEL}}", "{{CIDADE_IMOVEL}}", "{{ESTADO_IMOVEL}}",
    "{{CEP_IMOVEL}}", "{{MATRICULA_IMOVEL}}", "{{CARTORIO_IMOVEL}}"
  ]},
  { categoria: "Loteamento", variaveis: [
    "{{NOME_LOTEAMENTO}}", "{{ENDERECO_LOTEAMENTO}}", "{{CIDADE_LOTEAMENTO}}",
    "{{ESTADO_LOTEAMENTO}}", "{{REGISTRO_LOTEAMENTO}}"
  ]},
  { categoria: "Negociação", variaveis: [
    "{{VALOR_TOTAL}}", "{{VALOR_TOTAL_EXTENSO}}", "{{VALOR_ENTRADA}}", "{{VALOR_ENTRADA_EXTENSO}}",
    "{{QUANTIDADE_PARCELAS_ENTRADA}}", "{{QUANTIDADE_PARCELAS_MENSAIS}}", "{{VALOR_PARCELA_MENSAL}}",
    "{{VALOR_PARCELA_MENSAL_EXTENSO}}", "{{SALDO_FINANCIAR}}", "{{SALDO_FINANCIAR_EXTENSO}}",
    "{{DATA_INICIO}}", "{{DATA_PRIMEIRA_PARCELA}}", "{{DIA_VENCIMENTO_PARCELAS}}",
    "{{INDICE_CORRECAO}}", "{{PERIODICIDADE_CORRECAO}}", "{{DATA_POSSE}}"
  ]},
  { categoria: "Vendedor", variaveis: [
    "{{NOME_VENDEDOR}}", "{{CPF_CNPJ_VENDEDOR}}", "{{ENDERECO_VENDEDOR}}",
    "{{NUMERO_VENDEDOR}}", "{{BAIRRO_VENDEDOR}}", "{{CIDADE_VENDEDOR}}",
    "{{ESTADO_VENDEDOR}}", "{{CEP_VENDEDOR}}", "{{NACIONALIDADE_VENDEDOR}}",
    "{{ESTADO_CIVIL_VENDEDOR}}", "{{PROFISSAO_VENDEDOR}}"
  ]},
  { categoria: "Testemunhas", variaveis: [
    "{{NOME_TESTEMUNHA_1}}", "{{CPF_TESTEMUNHA_1}}",
    "{{NOME_TESTEMUNHA_2}}", "{{CPF_TESTEMUNHA_2}}"
  ]},
  { categoria: "Documento", variaveis: [
    "{{DATA_ASSINATURA}}", "{{DIA_ASSINATURA}}", "{{MES_ASSINATURA}}", "{{ANO_ASSINATURA}}",
    "{{CIDADE_ASSINATURA}}", "{{QUANTIDADE_VIAS}}", "{{QUANTIDADE_VIAS_EXTENSO}}",
    "{{FORO_CIDADE}}", "{{FORO_ESTADO}}"
  ]}
];

export default function TemplateDocumentoForm({ template, onSave, onClose }) {
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    tipo: "contrato",
    categoria: "venda",
    descricao: "",
    conteudo_template: "",
    instrucoes_ia: "",
    requer_testemunhas: true,
    reconhecimento_assinaturas: false,
    status_padrao: "rascunho",
    ativo: true,
  });

  const [copiedVar, setCopiedVar] = useState(null);

  useEffect(() => {
    if (template) {
      setFormData(template);
    }
  }, [template]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const copiarVariavel = (variavel) => {
    navigator.clipboard.writeText(variavel);
    setCopiedVar(variavel);
    toast.success(`Copiado: ${variavel}`);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Editar Template" : "Novo Template"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna Esquerda - Formulário */}
            <div className="space-y-4">
              <div>
                <Label>Nome do Template *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Código Identificador</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ex: CONT-001"
                />
              </div>

              <div>
                <Label>Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="procuracao">Procuração</SelectItem>
                    <SelectItem value="declaracao">Declaração</SelectItem>
                    <SelectItem value="recibo">Recibo</SelectItem>
                    <SelectItem value="termo">Termo</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Categoria</Label>
                <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="locacao">Locação</SelectItem>
                    <SelectItem value="permuta">Permuta</SelectItem>
                    <SelectItem value="cessao">Cessão de Direitos</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Instruções para IA</Label>
                <Textarea
                  value={formData.instrucoes_ia}
                  onChange={(e) => setFormData({ ...formData, instrucoes_ia: e.target.value })}
                  placeholder="Instruções específicas para a IA ao gerar o documento..."
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Requer Testemunhas</Label>
                  <Switch
                    checked={formData.requer_testemunhas}
                    onCheckedChange={(checked) => setFormData({ ...formData, requer_testemunhas: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Reconhecimento de Assinaturas</Label>
                  <Switch
                    checked={formData.reconhecimento_assinaturas}
                    onCheckedChange={(checked) => setFormData({ ...formData, reconhecimento_assinaturas: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Template Ativo</Label>
                  <Switch
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Coluna Direita - Variáveis Disponíveis */}
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
                <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  Variáveis Disponíveis
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Clique nas variáveis para copiar e use no conteúdo do template:
                </p>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {VARIAVEIS_DISPONIVEIS.map((grupo, idx) => (
                    <div key={idx} className="space-y-2">
                      <h4 className="font-semibold text-sm text-purple-800 border-b border-purple-200 pb-1">
                        {grupo.categoria}
                      </h4>
                      <div className="grid grid-cols-1 gap-1">
                        {grupo.variaveis.map((variavel, vIdx) => (
                          <button
                            key={vIdx}
                            type="button"
                            onClick={() => copiarVariavel(variavel)}
                            className="text-left px-2 py-1 text-xs bg-white hover:bg-purple-100 border border-purple-200 rounded flex items-center justify-between group transition-all"
                          >
                            <span className="font-mono text-purple-700">{variavel}</span>
                            {copiedVar === variavel ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo Template - Largura Total */}
          <div>
            <Label>Conteúdo do Template (HTML) *</Label>
            <Textarea
              value={formData.conteudo_template}
              onChange={(e) => setFormData({ ...formData, conteudo_template: e.target.value })}
              placeholder="Cole aqui o HTML do template do contrato..."
              rows={12}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use as variáveis acima no formato {{"{{"}}VARIAVEL{{"}}"}} para serem substituídas automaticamente.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]">
              Salvar Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}