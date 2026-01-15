import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Loader2, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUploader from "../imagens/ImageUploader";
import ImageGallery from "../imagens/ImageGallery";
import EnderecoForm from "../endereco/EnderecoForm";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const initialFormData = {
  nome: "",
  descricao: "",
  tipo_logradouro: "Rua",
  logradouro: "",
  numero: "",
  complemento: "",
  referencia: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  area_total: 0,
  quantidade_lotes: 0,
  valor_total: 0,
  observacoes: "",
};

export default function LoteamentoForm({ open, loteamento, onSave, onClose }) {
  const [formData, setFormData] = useState(initialFormData);

  const { data: lotesCount = 0 } = useQuery({
    queryKey: ['lotes-count', loteamento?.id],
    queryFn: async () => {
      if (!loteamento?.id) return 0;
      const lotes = await base44.entities.Lote.filter({ loteamento_id: loteamento.id });
      return lotes.length;
    },
    enabled: !!loteamento?.id
  });

  useEffect(() => {
    if (open) {
      if (loteamento) {
        setFormData({
          ...loteamento,
          quantidade_lotes: lotesCount || loteamento.quantidade_lotes || 0
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [loteamento, open, lotesCount]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      // Erro já tratado pelo componente pai
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3 text-[var(--wine-700)]">
            <Building2 className="w-7 h-7" />
            {loteamento ? "Editar Loteamento" : "Novo Loteamento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">📋 Dados</TabsTrigger>
              <TabsTrigger value="imagens" disabled={!loteamento?.id}>
                🖼️ Imagens {!loteamento?.id && "(Salve primeiro)"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="nome">Nome do Loteamento *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    placeholder="Ex: Jardim das Flores"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area_total">Área Total (m²)</Label>
                    <Input
                      id="area_total"
                      type="number"
                      step="0.01"
                      value={formData.area_total}
                      onChange={(e) => setFormData({ ...formData, area_total: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantidade_lotes">Qtd. Lotes</Label>
                    <Input
                      id="quantidade_lotes"
                      type="number"
                      value={formData.quantidade_lotes}
                      onChange={(e) => setFormData({ ...formData, quantidade_lotes: parseInt(e.target.value) || 0 })}
                      disabled={!!loteamento?.id}
                      className={loteamento?.id ? "bg-gray-100" : ""}
                    />
                    {loteamento?.id && (
                      <p className="text-xs text-gray-500">
                        Quantidade calculada automaticamente: {lotesCount} lotes
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor_total">Valor Total (R$)</Label>
                    <Input
                      id="valor_total"
                      type="number"
                      step="0.01"
                      value={formData.valor_total}
                      onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">📍 Endereço</h3>
                </div>

                <div className="md:col-span-2">
                  <EnderecoForm
                    endereco={{
                      tipo_logradouro: formData.tipo_logradouro,
                      logradouro: formData.logradouro,
                      numero: formData.numero,
                      complemento: formData.complemento,
                      referencia: formData.referencia,
                      bairro: formData.bairro,
                      cidade: formData.cidade,
                      estado: formData.estado,
                      cep: formData.cep,
                    }}
                    onChange={(enderecoData) => setFormData({ ...formData, ...enderecoData })}
                    prefix="loteamento_"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="imagens" className="space-y-6 mt-4">
              <ImageUploader
                entidadeTipo="Loteamento"
                entidadeId={loteamento?.id}
                onImageUploaded={() => {}}
              />

              <ImageGallery
                entidadeTipo="Loteamento"
                entidadeId={loteamento?.id}
                allowDelete={true}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {loteamento ? "Atualizar" : "Criar"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}