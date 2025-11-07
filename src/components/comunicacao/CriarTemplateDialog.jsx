import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save } from "lucide-react";

export default function CriarTemplateDialog({ open, onClose, template }) {
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    categoria: "geral",
    assunto_sugerido: "",
    conteudo: "",
    enviar_email_automatico: false,
    criar_tarefa_followup: false,
    dias_followup: 3,
    favorito: false,
    ativo: true,
    ...template
  });

  const queryClient = useQueryClient();

  const salvarMutation = useMutation({
    mutationFn: async () => {
      if (template) {
        return base44.entities.RespostaTemplate.update(template.id, formData);
      } else {
        return base44.entities.RespostaTemplate.create(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['respostas_template']);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    salvarMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template ? 'Editar' : 'Criar'} Template de Resposta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Confirmação de Pagamento"
                required
              />
            </div>

            <div>
              <Label>Código *</Label>
              <Input
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: CONF_PAGAMENTO"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(v) => setFormData({ ...formData, categoria: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="obra">Obra</SelectItem>
                  <SelectItem value="documentacao">Documentação</SelectItem>
                  <SelectItem value="agendamento">Agendamento</SelectItem>
                  <SelectItem value="suporte">Suporte</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="boas_vindas">Boas-vindas</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assunto Sugerido</Label>
              <Input
                value={formData.assunto_sugerido}
                onChange={(e) => setFormData({ ...formData, assunto_sugerido: e.target.value })}
                placeholder="Assunto do email"
              />
            </div>
          </div>

          <div>
            <Label>Conteúdo da Mensagem *</Label>
            <Textarea
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              placeholder="Digite o conteúdo do template..."
              rows={8}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use: {`{{nome_cliente}}`}, {`{{email_cliente}}`}, {`{{telefone_cliente}}`}, {`{{data_hoje}}`}, {`{{atendente}}`}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="enviar-email"
                checked={formData.enviar_email_automatico}
                onCheckedChange={(c) => setFormData({ ...formData, enviar_email_automatico: c })}
              />
              <Label htmlFor="enviar-email" className="cursor-pointer">
                Enviar email automaticamente ao usar
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="favorito"
                checked={formData.favorito}
                onCheckedChange={(c) => setFormData({ ...formData, favorito: c })}
              />
              <Label htmlFor="favorito" className="cursor-pointer">
                Marcar como favorito
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="followup"
                checked={formData.criar_tarefa_followup}
                onCheckedChange={(c) => setFormData({ ...formData, criar_tarefa_followup: c })}
              />
              <Label htmlFor="followup" className="cursor-pointer">
                Criar tarefa de follow-up automaticamente
              </Label>
            </div>

            {formData.criar_tarefa_followup && (
              <div className="ml-6">
                <Label>Dias para Follow-up</Label>
                <Input
                  type="number"
                  value={formData.dias_followup}
                  onChange={(e) => setFormData({ ...formData, dias_followup: parseInt(e.target.value) })}
                  min={1}
                  max={30}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
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
                  Salvar Template
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}