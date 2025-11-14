import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ImageUploader({ entidadeTipo, entidadeId, tiposPadrao = ["galeria"], onImageUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState(tiposPadrao[0] || "galeria");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const queryClient = useQueryClient();

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (!entidadeId) {
      toast.error("Salve o registro primeiro antes de adicionar arquivos");
      return;
    }

    setUploading(true);
    setProgress({ current: 0, total: files.length });

    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length });

        try {
          // Validar tipo
          const validTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf'
          ];
          if (!validTypes.includes(file.type)) {
            toast.error(`❌ ${file.name}: formato não suportado`);
            errorCount++;
            continue;
          }

          // Validar tamanho (15MB)
          if (file.size > 15 * 1024 * 1024) {
            toast.error(`❌ ${file.name}: arquivo muito grande (máx 15MB)`);
            errorCount++;
            continue;
          }

          toast.info(`⏳ Enviando ${file.name}...`);

          const { file_url } = await base44.integrations.Core.UploadFile({ file });

          await base44.entities.Imagem.create({
            entidade_tipo: entidadeTipo,
            entidade_id: entidadeId,
            arquivo_url: file_url,
            titulo: titulo || file.name,
            tipo: tipo,
            tamanho_bytes: file.size,
          });

          successCount++;
          toast.success(`✅ ${file.name} enviado!`);

        } catch (error) {
          console.error(`Erro no upload de ${file.name}:`, error);
          toast.error(`❌ Erro: ${file.name} - ${error.message}`);
          errorCount++;
        }
      }

      // Invalidar query para atualizar galeria
      queryClient.invalidateQueries({ queryKey: ['imagens', entidadeTipo, entidadeId] });

      // Resumo final
      if (successCount > 0) {
        toast.success(`🎉 ${successCount} arquivo(s) enviado(s) com sucesso!`, {
          duration: 4000,
        });
      }
      
      if (errorCount > 0) {
        toast.error(`⚠️ ${errorCount} arquivo(s) com erro`, {
          duration: 4000,
        });
      }

      setTitulo("");
      e.target.value = "";
      
      if (onImageUploaded) {
        onImageUploaded();
      }

    } catch (error) {
      console.error("Erro geral no upload:", error);
      toast.error("Erro ao fazer upload: " + error.message);
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Card className="border-2 border-dashed border-gray-300 hover:border-[var(--wine-600)] transition-colors">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <h3 className="font-semibold text-lg mb-1">Upload de Arquivos</h3>
            <p className="text-sm text-gray-600">JPG, PNG, GIF, WEBP ou PDF (máx 15MB cada)</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título (Opcional)</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Nome para todos os arquivos"
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
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-[var(--wine-600)]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">
                  Enviando {progress.current} de {progress.total} arquivo(s)...
                </span>
              </div>
              
              {/* Barra de progresso */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-[var(--wine-600)] h-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {!entidadeId && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Salve a unidade primeiro para habilitar upload
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}