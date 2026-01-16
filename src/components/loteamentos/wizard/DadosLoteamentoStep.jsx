import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, AlertCircle, Upload, X, Image as ImageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EnderecoForm from "../../endereco/EnderecoForm";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function DadosLoteamentoStep({ data, onNext, onCancel }) {
  const [formData, setFormData] = useState(data);
  const [erro, setErro] = useState(null);
  const [uploadingPrincipal, setUploadingPrincipal] = useState(false);
  const [uploadingPropaganda, setUploadingPropaganda] = useState(false);

  useEffect(() => {
    setFormData(data);
  }, [data]);

  const handleUploadImagemPrincipal = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPrincipal(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, imagem_principal_url: file_url });
      toast.success("Imagem principal enviada!");
    } catch (error) {
      toast.error("Erro ao enviar imagem: " + error.message);
    } finally {
      setUploadingPrincipal(false);
    }
  };

  const handleUploadImagensPropaganda = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPropaganda(true);
    try {
      const urls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      }
      const imagensAtuais = formData.imagens_propaganda || [];
      setFormData({ ...formData, imagens_propaganda: [...imagensAtuais, ...urls] });
      toast.success(`${urls.length} imagem(ns) adicionada(s)!`);
    } catch (error) {
      toast.error("Erro ao enviar imagens: " + error.message);
    } finally {
      setUploadingPropaganda(false);
    }
  };

  const handleRemoverImagemPropaganda = (index) => {
    const novasImagens = [...(formData.imagens_propaganda || [])];
    novasImagens.splice(index, 1);
    setFormData({ ...formData, imagens_propaganda: novasImagens });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro(null);

    if (!formData.nome || !formData.nome.trim()) {
      setErro("Nome do loteamento é obrigatório");
      return;
    }

    if (!formData.cidade || !formData.estado) {
      setErro("Cidade e Estado são obrigatórios");
      return;
    }

    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {erro && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-800">{erro}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>Nome do Loteamento *</Label>
          <Input
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Ex: Jardim das Flores"
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label>Descrição</Label>
          <Textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Descreva o loteamento..."
            rows={3}
          />
        </div>

        <div>
          <Label>Área Total (m²)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.area_total}
            onChange={(e) => setFormData({ ...formData, area_total: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
          />
        </div>

        <div>
          <Label>Quantidade de Lotes</Label>
          <Input
            type="number"
            value={formData.quantidade_lotes}
            onChange={(e) => setFormData({ ...formData, quantidade_lotes: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>

        <div className="md:col-span-2 pt-4 border-t">
          <h3 className="font-semibold text-gray-900 mb-4">📍 Endereço do Loteamento</h3>
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

        <div className="md:col-span-2 pt-4 border-t">
          <h3 className="font-semibold text-gray-900 mb-4">🖼️ Imagens do Loteamento</h3>
        </div>

        <div className="md:col-span-2">
          <Label>Imagem Principal</Label>
          <div className="mt-2">
            {formData.imagem_principal_url ? (
              <div className="relative inline-block">
                <img 
                  src={formData.imagem_principal_url} 
                  alt="Imagem principal" 
                  className="w-48 h-32 object-cover rounded-lg border-2 border-gray-300"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => setFormData({ ...formData, imagem_principal_url: "" })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[var(--wine-600)] hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploadingPrincipal ? (
                    <div className="text-sm text-gray-500">Enviando...</div>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Clique para enviar imagem principal</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleUploadImagemPrincipal}
                  disabled={uploadingPrincipal}
                />
              </label>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <Label>Imagens para Propaganda</Label>
          <div className="mt-2 space-y-3">
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[var(--wine-600)] hover:bg-gray-50 transition-colors">
              <div className="flex flex-col items-center justify-center">
                {uploadingPropaganda ? (
                  <div className="text-sm text-gray-500">Enviando...</div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <p className="text-xs text-gray-500">Clique para adicionar imagens (múltiplas)</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleUploadImagensPropaganda}
                disabled={uploadingPropaganda}
              />
            </label>

            {formData.imagens_propaganda && formData.imagens_propaganda.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {formData.imagens_propaganda.map((url, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={url} 
                      alt={`Propaganda ${index + 1}`} 
                      className="w-full h-24 object-cover rounded-lg border border-gray-300"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoverImagemPropaganda(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <Label>Observações</Label>
          <Textarea
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]">
          Próximo: Selecionar Coordenadas
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}