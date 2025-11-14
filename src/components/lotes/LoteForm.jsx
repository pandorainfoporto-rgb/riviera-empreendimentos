import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputMask, buscarCEP, removeMask } from "@/components/ui/input-mask";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Info, Image as ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUploader from "../imagens/ImageUploader";
import ImageGallery from "../imagens/ImageGallery";

export default function LoteForm({ open, onClose, onSave, lote, loteamentos = [] }) {
  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [formData, setFormData] = useState({
    codigo: "",
    loteamento_id: "",
    area_total: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    coordenadas: { latitude: "", longitude: "" },
    valor_venda: "",
    valor_custo: "",
    matricula: "",
    status: "disponivel",
    observacoes: "",
  });

  useEffect(() => {
    if (lote) {
      setFormData({
        ...lote,
        coordenadas: lote.coordenadas || { latitude: "", longitude: "" }
      });
    } else {
      setFormData({
        codigo: "",
        loteamento_id: "",
        area_total: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
        coordenadas: { latitude: "", longitude: "" },
        valor_venda: "",
        valor_custo: "",
        matricula: "",
        status: "disponivel",
        observacoes: "",
      });
    }
  }, [lote, open]);

  const handleBuscarCEP = async (cep) => {
    if (removeMask(cep).length === 8) {
      setBuscandoCep(true);
      const resultado = await buscarCEP(cep);
      setBuscandoCep(false);

      if (!resultado.erro) {
        setFormData({
          ...formData,
          cep,
          logradouro: resultado.logradouro,
          bairro: resultado.bairro,
          cidade: resultado.cidade,
          estado: resultado.estado,
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar lote:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lote ? "Editar Lote" : "Novo Lote"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">Dados do Lote</TabsTrigger>
              <TabsTrigger value="imagens" disabled={!lote?.id}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Imagens
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Código *</Label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: L-001, Lote 01, Quadra A Lote 5"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Loteamento *</Label>
                  <Select
                    value={formData.loteamento_id}
                    onValueChange={(value) => setFormData({ ...formData, loteamento_id: value })}
                    disabled={loading}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o loteamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {loteamentos.map((lot) => (
                        <SelectItem key={lot.id} value={lot.id}>
                          {lot.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Área Total (m²) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.area_total}
                    onChange={(e) => setFormData({ ...formData, area_total: e.target.value })}
                    placeholder="0.00"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Matrícula</Label>
                  <Input
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                    placeholder="Número da matrícula"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">Endereço</h3>
                </div>

                <div>
                  <Label>CEP</Label>
                  <InputMask
                    mask="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    onBlur={(e) => handleBuscarCEP(e.target.value)}
                    placeholder="00000-000"
                    disabled={loading || buscandoCep}
                  />
                  {buscandoCep && (
                    <p className="text-xs text-blue-600 mt-1">Buscando CEP...</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label>Logradouro</Label>
                  <Input
                    value={formData.logradouro}
                    onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                    placeholder="Rua, Avenida, etc"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Número</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="Nº"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Complemento</Label>
                  <Input
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    placeholder="Complemento"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Bairro</Label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    placeholder="Bairro"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Cidade"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Estado (UF)</Label>
                  <Input
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                    placeholder="UF"
                    maxLength={2}
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">Coordenadas Geográficas</h3>
                </div>

                <div>
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.coordenadas?.latitude || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      coordenadas: { ...formData.coordenadas, latitude: e.target.value }
                    })}
                    placeholder="-23.550520"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.coordenadas?.longitude || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      coordenadas: { ...formData.coordenadas, longitude: e.target.value }
                    })}
                    placeholder="-46.633308"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">Valores</h3>
                </div>

                <div>
                  <Label>Valor de Venda (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_venda}
                    onChange={(e) => setFormData({ ...formData, valor_venda: e.target.value })}
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label>Valor de Custo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_custo}
                    onChange={(e) => setFormData({ ...formData, valor_custo: e.target.value })}
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="reservada">Reservado</SelectItem>
                      <SelectItem value="vendida">Vendido</SelectItem>
                      <SelectItem value="escriturada">Escriturado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações sobre o lote"
                    rows={3}
                    disabled={loading}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="imagens" className="space-y-4 mt-4">
              {!lote?.id ? (
                <div className="p-8 text-center bg-amber-50 rounded-lg border-2 border-dashed border-amber-300">
                  <Info className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                  <p className="text-amber-700 font-semibold">Salve o lote primeiro</p>
                  <p className="text-sm text-amber-600 mt-1">
                    Para adicionar imagens, primeiro salve as informações básicas do lote
                  </p>
                </div>
              ) : (
                <>
                  <ImageUploader
                    entidadeTipo="Unidade"
                    entidadeId={lote?.id}
                    tiposPadrao={["principal", "galeria", "planta", "outros"]}
                    onImageUploaded={() => {}}
                  />

                  <ImageGallery
                    entidadeTipo="Unidade"
                    entidadeId={lote?.id}
                    allowDelete={true}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                lote ? "Atualizar" : "Criar Lote"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}