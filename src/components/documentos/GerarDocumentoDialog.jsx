import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function GerarDocumentoDialog({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    template_id: "",
    cliente_id: "",
    unidade_id: "",
    negociacao_id: "",
    locacao_id: ""
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates_ativos'],
    queryFn: () => base44.entities.DocumentoTemplate.filter({ ativo: true }),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes_select'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades_select'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: negociacoes = [] } = useQuery({
    queryKey: ['negociacoes_select'],
    queryFn: () => base44.entities.Negociacao.filter({ status: 'ativa' }),
    enabled: !!formData.cliente_id,
  });

  const handleGerar = async () => {
    setErro(null);
    
    if (!formData.template_id) {
      setErro('Selecione um template');
      return;
    }

    setLoading(true);

    try {
      const resultado = await base44.functions.invoke('gerarDocumentoIA', formData);
      
      if (resultado.data.sucesso) {
        navigate(createPageUrl('DocumentosGerados'));
        onClose();
      } else {
        setErro(resultado.data.error || 'Erro ao gerar documento');
      }
    } catch (error) {
      setErro(error.message || 'Erro ao gerar documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--wine-600)]" />
            Gerar Documento com IA
          </DialogTitle>
        </DialogHeader>

        {erro && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{erro}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label>Template *</Label>
            <Select value={formData.template_id} onValueChange={(v) => setFormData({ ...formData, template_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome} ({t.tipo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Cliente</Label>
            <Select value={formData.cliente_id} onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome} - {c.cpf_cnpj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Unidade/Imóvel</Label>
            <Select value={formData.unidade_id} onValueChange={(v) => setFormData({ ...formData, unidade_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {unidades.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.codigo} - {u.tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.cliente_id && negociacoes.length > 0 && (
            <div>
              <Label>Negociação</Label>
              <Select value={formData.negociacao_id} onValueChange={(v) => setFormData({ ...formData, negociacao_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a negociação (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {negociacoes.map(n => (
                    <SelectItem key={n.id} value={n.id}>
                      Negociação - R$ {(n.valor_total || 0).toLocaleString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGerar} 
            disabled={loading}
            className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar com IA
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}