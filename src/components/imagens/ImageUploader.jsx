import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ImageUploader({ 
  entidadeTipo, 
  entidadeId, 
  onImageUploaded,
  tiposPadrao = ["principal", "galeria", "fachada", "planta", "documentacao", "outros"],
  maxImages = 10
}) {
  const [uploading, setUploading] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("galeria");

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (!entidadeId) {
      toast.error("Salve o registro primeiro antes de adicionar imagens");
      return;
    }

    if (files.length === 0) return;

    setUploading(true);

    try {
      for (const file of files) {
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} não é uma imagem válida`);
          continue;
        }

        // Validar tamanho (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} excede o tamanho máximo de 10MB`);
          continue;
        }

        // Upload do arquivo
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        // Criar registro de imagem
        const imagem = await base44.entities.Imagem.create({
          entidade_tipo: entidadeTipo,
          entidade_id: entidadeId,
          arquivo_url: file_url,
          titulo: titulo || file.name,
          tipo: tipo,
          tamanho_bytes: file.size,
        });

        if (onImageUploaded) {
          onImageUploaded(imagem);
        }

        toast.success(`${file.name} enviado com sucesso!`);
      }

      // Limpar campos
      setTitulo("");
      e.target.value = null;

    } catch (error) {
      toast.error("Erro ao fazer upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-gray-300 hover:border-[var(--wine-600)] transition-colors">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Título da Imagem (opcional)</Label>
              <Input
                placeholder="Ex: Fachada principal, Vista aérea..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposPadrao.map(t => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading || !entidadeId}
              className="cursor-pointer"
            />
            {!entidadeId && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ Salve o registro primeiro para adicionar imagens
              </p>
            )}
          </div>

          {uploading && (
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Enviando imagens...</span>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center">
            Formatos: JPG, PNG, WEBP • Máximo: 10MB por imagem
          </p>
        </div>
      </CardContent>
    </Card>
  );
}