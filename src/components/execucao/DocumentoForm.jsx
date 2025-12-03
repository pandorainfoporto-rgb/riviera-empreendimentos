import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Upload, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import SearchUnidadeDialog from "../shared/SearchUnidadeDialog";

export default function DocumentoForm({ 
  item, 
  tipoDocumento, 
  unidades, 
  fornecedores, 
  cronogramasObra, 
  onSubmit, 
  onCancel, 
  isProcessing 
}) {
  const [formData, setFormData] = useState(item || {
    unidade_id: "",
    cronograma_obra_id: "",
    tipo: tipoDocumento,
    titulo: "",
    descricao: "",
    arquivo_url: "",
    data_documento: new Date().toISOString().split('T')[0],
    fornecedor_id: "",
    valor: 0,
    numero_documento: "",
    status: "pendente",
    observacoes: "",
  });

  const [uploading, setUploading] = useState(false);
  const [showUnidadeSearch, setShowUnidadeSearch] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, arquivo_url: file_url });
      toast.success('Arquivo enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar arquivo');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.arquivo_url) {
      toast.error('Por favor, faça upload do arquivo');
      return;
    }
    onSubmit(formData);
  };

  const tiposDocumento = {
    foto: "Foto",
    projeto: "Projeto",
    nota_fiscal: "Nota Fiscal",
    recibo: "Recibo",
    contrato: "Contrato",
    documento_geral: "Documento Geral",
    pagamento: "Comprovante de Pagamento",
    negociacao: "Documento de Negociação",
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar" : "Novo"} {tiposDocumento[tipoDocumento]}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  Unidade *
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => setShowUnidadeSearch(true)}
                  >
                    <Search className="w-3 h-3" />
                  </Button>
                </Label>
                <Input
                  value={unidades.find(u => u.id === formData.unidade_id)?.codigo || ""}
                  disabled
                  className="bg-gray-100"
                  placeholder="Clique na lupa para selecionar..."
                />
              </div>

              <div>
                <Label>Etapa do Cronograma</Label>
                <Select
                  value={formData.cronograma_obra_id}
                  onValueChange={(value) => setFormData({ ...formData, cronograma_obra_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhuma</SelectItem>
                    {cronogramasObra
                      .filter(c => c.unidade_id === formData.unidade_id)
                      .map(crono => (
                        <SelectItem key={crono.id} value={crono.id}>
                          {crono.wbs ? `${crono.wbs} - ` : ''}{crono.etapa}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder={`Ex: ${tiposDocumento[tipoDocumento]} da etapa...`}
                required
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={2}
                placeholder="Descrição detalhada..."
              />
            </div>

            <div>
              <Label>Upload do Arquivo *</Label>
              <div className="mt-2">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[var(--wine-100)] file:text-[var(--wine-700)]
                    hover:file:bg-[var(--wine-200)]"
                  accept={tipoDocumento === 'foto' ? 'image/*' : '*'}
                />
                {uploading && <p className="text-sm text-blue-600 mt-2">Enviando arquivo...</p>}
                {formData.arquivo_url && (
                  <p className="text-sm text-green-600 mt-2">✓ Arquivo enviado com sucesso</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Data do Documento *</Label>
                <Input
                  type="date"
                  value={formData.data_documento}
                  onChange={(e) => setFormData({ ...formData, data_documento: e.target.value })}
                  required
                />
              </div>

              {['nota_fiscal', 'recibo', 'pagamento'].includes(tipoDocumento) && (
                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
            </div>

            {['nota_fiscal', 'recibo', 'pagamento'].includes(tipoDocumento) && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Fornecedor</Label>
                  <Select
                    value={formData.fornecedor_id}
                    onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map(forn => (
                        <SelectItem key={forn.id} value={forn.id}>
                          {forn.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Número do Documento</Label>
                  <Input
                    value={formData.numero_documento}
                    onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                    placeholder="Ex: NF 12345"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isProcessing || uploading}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </form>

        <SearchUnidadeDialog
          open={showUnidadeSearch}
          onClose={() => setShowUnidadeSearch(false)}
          unidades={unidades}
          onSelect={(unidade) => {
            setFormData({ ...formData, unidade_id: unidade.id });
            setShowUnidadeSearch(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}