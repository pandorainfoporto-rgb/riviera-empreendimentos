import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send, Star } from "lucide-react";

export default function NovaMensagemDialog({ open, onClose, clienteInicial }) {
  const [formData, setFormData] = useState({
    cliente_id: clienteInicial?.id || "",
    titulo: "",
    mensagem: "",
    assunto: "geral",
    prioridade: "normal",
    enviar_email: true,
  });

  const queryClient = useQueryClient();

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const enviarMutation = useMutation({
    mutationFn: async () => {
      const resultado = await base44.functions.invoke('enviarMensagemComEmail', formData);
      return resultado.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensagens_todas']);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    enviarMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Mensagem para Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Cliente *</Label>
            <Select
              value={formData.cliente_id}
              onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome} - {c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Assunto</Label>
              <Select
                value={formData.assunto}
                onValueChange={(v) => setFormData({ ...formData, assunto: v })}
              >
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

            <div>
              <Label>Prioridade</Label>
              <Select
                value={formData.prioridade}
                onValueChange={(v) => setFormData({ ...formData, prioridade: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Título *</Label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Documentação para assinatura"
              required
            />
          </div>

          <div>
            <Label>Mensagem *</Label>
            <Textarea
              value={formData.mensagem}
              onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
              placeholder="Digite sua mensagem aqui..."
              rows={6}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use: {`{{nome_cliente}}`}, {`{{email_cliente}}`}, {`{{data_hoje}}`}, {`{{atendente}}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="enviar-email-nova"
              checked={formData.enviar_email}
              onCheckedChange={(checked) => setFormData({ ...formData, enviar_email: checked })}
            />
            <Label htmlFor="enviar-email-nova" className="cursor-pointer">
              Enviar por email também
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={enviarMutation.isPending}
              className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
            >
              {enviarMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}