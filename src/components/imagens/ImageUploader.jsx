import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

export default function ImageUploader({ entidadeTipo, entidadeId, tiposPadrao = ["galeria"], onImageUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState(tiposPadrao[0] || "galeria");

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (!entidadeId) {
      toast.error("Salve o registro primeiro antes de adicionar arquivos");
      return;
    }

    setUploading(true);

    try {
      for (const file of files) {
        // Validar tipo
        const validTypes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf'
        ];
        if (!validTypes.includes(file.type)) {
          toast.error(`Arquivo ${file.name} não suportado. Use JPG, PNG, GIF, WEBP ou PDF`);
          continue;
        }

        // Validar tamanho (15MB)
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`Arquivo ${file.name} muito grande. Máximo 15MB`);
          continue;
        }

        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        await base44.entities.Imagem.create({
          entidade_tipo: entidadeTipo,
          entidade_id: entidadeId,
          arquivo_url: file_url,
          titulo: titulo || file.name,
          tipo: tipo,
          tamanho_bytes: file.size,
        });
      }

      toast.success(`${files.length} arquivo(s) enviado(s)!`);
      setTitulo("");
      e.target.value = "";
      if (onImageUploaded) onImageUploaded();

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
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <h3 className="font-semibold text-lg mb-1">Upload de Arquivos</h3>
            <p className="text-sm text-gray-600">JPG, PNG, GIF, WEBP ou PDF (máx 15MB)</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título (Opcional)</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Nome do arquivo"
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
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
              onChange={handleFileUpload}
              disabled={uploading || !entidadeId}
              multiple
              className="cursor-pointer"
            />
          </div>

          {uploading && (
            <div className="flex items-center justify-center gap-2 text-[var(--wine-600)]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Enviando...</span>
            </div>
          )}

          {!entidadeId && (
            <p className="text-xs text-amber-600 text-center">
              ⚠️ Salve o registro primeiro para habilitar upload
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}