import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Loader2, CheckCircle2, Image } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUploader from "../imagens/ImageUploader";
import ImageGallery from "../imagens/ImageGallery";

export default function LoteamentoForm({ open, loteamento, onSave, onClose }) {
  const [formData, setFormData] = useState(loteamento || {
    nome: "",
    descricao: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    area_total: 0,
    quantidade_lotes: 0,
    valor_total: 0,
    observacoes: "",
  });

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
                <div className="space-y-2">
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
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado (UF) *</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                    maxLength={2}
                    required
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

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
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

              <div className="grid md:grid-cols-3 gap-4">
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
                  />
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

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="imagens" className="space-y-6 mt-4">
              <ImageUploader
                entidadeTipo="Loteamento"
                entidadeId={loteamento?.id}
                onImageUploaded={() => {
                  // A galeria se atualizará automaticamente via React Query
                }}
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