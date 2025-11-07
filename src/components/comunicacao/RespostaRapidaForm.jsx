
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RespostaRapidaForm({ resposta, open, onClose }) {
  const [erro, setErro] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    titulo: "",
    codigo: "",
    categoria: "geral",
    assunto: "geral",
    conteudo: "",
    placeholders_disponiveis: ["{{nome_cliente}}", "{{email_cliente}}", "{{telefone_cliente}}"],
    enviar_email: false,
    email_template_id: "",
    criar_tarefa_followup: false,
    dias_followup: 3,
    ativa: true,
    ...resposta
  });

  const { data: emailTemplates = [] } = useQuery({
    queryKey: ['email_templates'],
    queryFn: () => base44.entities.EmailTemplate.filter({ ativo: true }),
  });

  const salvarMutation = useMutation({
    mutationFn: async (data) => {
      if (resposta) {
        return base44.entities.RespostaRapida.update(resposta.id, data);
      } else {
        return base44.entities.RespostaRapida.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['respostas_rapidas_all']);
      queryClient.invalidateQueries(['respostas_rapidas']);
      onClose();
    },
    onError: (error) => {
      setErro(error.message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {resposta ? 'Editar Resposta Rápida' : 'Nova Resposta Rápida'}
          </DialogTitle>
        </DialogHeader>

        {erro && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{erro}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Informações sobre pagamento"
              />
            </div>
            <div>
              <Label>Código de Atalho *</Label>
              <Input
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: /pagamento"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="obra">Obra</SelectItem>
                  <SelectItem value="documentacao">Documentação</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="juridico">Jurídico</SelectItem>
                  <SelectItem value="pos_venda">Pós-Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assunto Padrão</Label>
              <Select value={formData.assunto} onValueChange={(v) => setFormData({ ...formData, assunto: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="negociacao">Negociação</SelectItem>
                  <SelectItem value="pagamento">Pagamento</SelectItem>
                  <SelectItem value="documento">Documento</SelectItem>
                  <SelectItem value="obra">Obra</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="suporte">Suporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Conteúdo da Mensagem *</Label>
            <Textarea
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              placeholder="Digite o conteúdo da resposta..."
              rows={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              Use placeholders como: {"{"}{"{"} nome_cliente {"}"}{"}"},  {"{"}{"{"} email_cliente {"}"}{"}"},  {"{"}{"{"} telefone_cliente {"}"}{"}"} 
            </p>
          </div>

          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                id="enviar_email"
                checked={formData.enviar_email}
                onCheckedChange={(checked) => setFormData({ ...formData, enviar_email: checked })}
              />
              <Label htmlFor="enviar_email">Enviar também por email</Label>
            </div>

            {formData.enviar_email && (
              <div>
                <Label>Template de Email</Label>
                <Select 
                  value={formData.email_template_id} 
                  onValueChange={(v) => setFormData({ ...formData, email_template_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {emailTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="followup"
                checked={formData.criar_tarefa_followup}
                onCheckedChange={(checked) => setFormData({ ...formData, criar_tarefa_followup: checked })}
              />
              <Label htmlFor="followup">Criar tarefa de follow-up</Label>
            </div>

            {formData.criar_tarefa_followup && (
              <div>
                <Label>Dias para Follow-up</Label>
                <Input
                  type="number"
                  value={formData.dias_followup}
                  onChange={(e) => setFormData({ ...formData, dias_followup: parseInt(e.target.value) })}
                  min={1}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => salvarMutation.mutate(formData)}
            disabled={salvarMutation.isPending}
            className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
          >
            {salvarMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
