import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";

export default function UploadDWGStep({ loteamentoId, data, onNext, onBack }) {
  const [uploading, setUploading] = useState(false);
  const [convertendo, setConvertendo] = useState(false);
  const [erro, setErro] = useState(null);
  const [dwgUrl, setDwgUrl] = useState(data.arquivo_dwg_url || "");
  const [plantaUrl, setPlantaUrl] = useState(data.arquivo_planta_url || "");

  const handleDWGUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.dwg')) {
      setErro("Por favor, selecione um arquivo .dwg");
      return;
    }

    setUploading(true);
    setErro(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDwgUrl(file_url);
      
      // Atualizar loteamento com URL do DWG
      if (loteamentoId) {
        await base44.entities.Loteamento.update(loteamentoId, {
          arquivo_dwg_url: file_url
        });
      }
    } catch (error) {
      setErro("Erro ao fazer upload do arquivo DWG");
    } finally {
      setUploading(false);
    }
  };

  const handlePlantaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validFormats.includes(file.type)) {
      setErro("Por favor, selecione uma imagem PNG, JPG ou SVG");
      return;
    }

    setConvertendo(true);
    setErro(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPlantaUrl(file_url);
      
      // Atualizar loteamento com URL da planta
      if (loteamentoId) {
        await base44.entities.Loteamento.update(loteamentoId, {
          arquivo_planta_url: file_url
        });
      }
    } catch (error) {
      setErro("Erro ao fazer upload da imagem da planta");
    } finally {
      setConvertendo(false);
    }
  };

  const handleNext = () => {
    if (!plantaUrl) {
      setErro("Por favor, faça upload da imagem da planta do loteamento");
      return;
    }

    onNext({
      arquivo_dwg_url: dwgUrl,
      arquivo_planta_url: plantaUrl
    });
  };

  return (
    <div className="space-y-6">
      {erro && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-800">{erro}</AlertDescription>
        </Alert>
      )}

      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-2 block">
                📐 Arquivo DWG Original (Opcional)
              </Label>
              <p className="text-sm text-gray-600 mb-4">
                Faça upload do arquivo DWG do loteamento para manter como referência.
              </p>
              
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".dwg"
                  onChange={handleDWGUpload}
                  className="hidden"
                  id="dwg-upload"
                  disabled={uploading}
                />
                <label htmlFor="dwg-upload">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => document.getElementById('dwg-upload').click()}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Selecionar DWG
                      </>
                    )}
                  </Button>
                </label>
                
                {dwgUrl && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">DWG enviado</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-2 block">
                🗺️ Imagem da Planta do Loteamento *
              </Label>
              <p className="text-sm text-gray-600 mb-4">
                Faça upload de uma imagem (PNG, JPG ou SVG) da planta do loteamento. 
                Esta imagem será usada para mapear e delimitar os lotes.
              </p>
              <p className="text-xs text-orange-700 bg-orange-50 p-3 rounded mb-4">
                💡 <strong>Dica:</strong> Converta seu arquivo DWG para PNG/JPG usando um software como AutoCAD, 
                LibreCAD ou um conversor online. <strong>A imagem DEVE mostrar claramente as linhas de separação 
                entre os lotes</strong> para facilitar o mapeamento no próximo passo.
              </p>
              <p className="text-xs text-blue-700 bg-blue-50 p-3 rounded mb-4">
                ⚠️ <strong>IMPORTANTE:</strong> Certifique-se de que a imagem da planta inclui todas as linhas 
                delimitadoras dos lotes. Sem essas linhas visíveis, será difícil mapear corretamente cada lote.
              </p>
              
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handlePlantaUpload}
                  className="hidden"
                  id="planta-upload"
                  disabled={convertendo}
                />
                <label htmlFor="planta-upload">
                  <Button
                    type="button"
                    variant="default"
                    className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
                    disabled={convertendo}
                    onClick={() => document.getElementById('planta-upload').click()}
                  >
                    {convertendo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Selecionar Imagem da Planta
                      </>
                    )}
                  </Button>
                </label>
                
                {plantaUrl && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Planta enviada</span>
                  </div>
                )}
              </div>

              {plantaUrl && (
                <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium mb-2">Preview da Planta:</p>
                  <img 
                    src={plantaUrl} 
                    alt="Planta do loteamento"
                    className="w-full h-auto max-h-96 object-contain rounded border"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button 
          type="button" 
          onClick={handleNext}
          className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
          disabled={!plantaUrl}
        >
          Próximo: Mapear Lotes
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}