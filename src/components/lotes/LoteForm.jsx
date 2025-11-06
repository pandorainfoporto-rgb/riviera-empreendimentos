
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X, Save, Ruler, MapPin } from "lucide-react";

import LoteVisualizacao from "../unidades/LoteVisualizacao";
import MapaLote from "../unidades/MapaLote";

export default function LoteForm({ item, loteamentos, fornecedores, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    codigo: "",
    loteamento_id: "",
    area_total: 0,
    valor_venda: 0,
    status: "disponivel",
    observacoes: "",
    criar_produto: false,
    fornecedor_padrao_id: "",
    medidas_lote: {
      frente: 0,
      fundo: 0,
      lateral_direita: 0,
      lateral_esquerda: 0,
    },
    orientacao_solar: {
      graus_norte: 0,
      face_principal: "norte",
    },
    localizacao: {
      latitude: 0,
      longitude: 0,
      altitude: 0,
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleLocationChange = (newLocation) => {
    setFormData({
      ...formData,
      localizacao: {
        ...formData.localizacao,
        ...newLocation,
      }
    });
  };

  return (
    <Card className="shadow-xl border-t-4 border-[var(--grape-600)]">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)]">
          {item ? "Editar Lote" : "Novo Lote"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100">
              <TabsTrigger value="basico">Básico</TabsTrigger>
              <TabsTrigger value="medidas">Medidas</TabsTrigger>
              <TabsTrigger value="localizacao">Localização</TabsTrigger>
              <TabsTrigger value="produto">Produto</TabsTrigger>
            </TabsList>

            <TabsContent value="basico" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código do Lote *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: Lote 15"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loteamento_id">Loteamento *</Label>
                  <Select
                    value={formData.loteamento_id}
                    onValueChange={(value) => setFormData({ ...formData, loteamento_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loteamentos.map(lot => (
                        <SelectItem key={lot.id} value={lot.id}>
                          {lot.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area_total">Área Total (m²) *</Label>
                  <Input
                    id="area_total"
                    type="number"
                    step="0.01"
                    value={formData.area_total}
                    onChange={(e) => setFormData({ ...formData, area_total: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_venda">Valor de Venda *</Label>
                  <Input
                    id="valor_venda"
                    type="number"
                    step="0.01"
                    value={formData.valor_venda}
                    onChange={(e) => setFormData({ ...formData, valor_venda: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  required
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

            <TabsContent value="medidas" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Ruler className="w-5 h-5" />
                    Medidas do Lote
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frente (m)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.medidas_lote?.frente || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          medidas_lote: {
                            ...formData.medidas_lote,
                            frente: parseFloat(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fundo (m)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.medidas_lote?.fundo || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          medidas_lote: {
                            ...formData.medidas_lote,
                            fundo: parseFloat(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lateral Direita (m)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.medidas_lote?.lateral_direita || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          medidas_lote: {
                            ...formData.medidas_lote,
                            lateral_direita: parseFloat(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lateral Esquerda (m)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.medidas_lote?.lateral_esquerda || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          medidas_lote: {
                            ...formData.medidas_lote,
                            lateral_esquerda: parseFloat(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">☀️ Orientação Solar</h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Graus em Relação ao Norte (0-360°)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="360"
                          value={formData.orientacao_solar?.graus_norte || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            orientacao_solar: {
                              ...formData.orientacao_solar,
                              graus_norte: parseFloat(e.target.value) || 0
                            }
                          })}
                        />
                        <p className="text-xs text-blue-700">
                          0° = Norte, 90° = Leste, 180° = Sul, 270° = Oeste
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Face Principal</Label>
                        <Select
                          value={formData.orientacao_solar?.face_principal || "norte"}
                          onValueChange={(val) => setFormData({
                            ...formData,
                            orientacao_solar: {
                              ...formData.orientacao_solar,
                              face_principal: val
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="norte">Norte (N)</SelectItem>
                            <SelectItem value="nordeste">Nordeste (NE)</SelectItem>
                            <SelectItem value="leste">Leste (L)</SelectItem>
                            <SelectItem value="sudeste">Sudeste (SE)</SelectItem>
                            <SelectItem value="sul">Sul (S)</SelectItem>
                            <SelectItem value="sudoeste">Sudoeste (SO)</SelectItem>
                            <SelectItem value="oeste">Oeste (O)</SelectItem>
                            <SelectItem value="noroeste">Noroeste (NO)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <LoteVisualizacao 
                    medidas={formData.medidas_lote}
                    orientacao={formData.orientacao_solar}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="localizacao" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="0.0000001"
                    value={formData.localizacao?.latitude || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      localizacao: {
                        ...formData.localizacao,
                        latitude: parseFloat(e.target.value) || 0
                      }
                    })}
                    placeholder="-25.4284"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="0.0000001"
                    value={formData.localizacao?.longitude || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      localizacao: {
                        ...formData.localizacao,
                        longitude: parseFloat(e.target.value) || 0
                      }
                    })}
                    placeholder="-49.2733"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Altitude (m)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.localizacao?.altitude || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      localizacao: {
                        ...formData.localizacao,
                        altitude: parseFloat(e.target.value) || 0
                      }
                    })}
                  />
                </div>
              </div>

              <MapaLote 
                localizacao={formData.localizacao} 
                codigo={formData.codigo}
                onLocationChange={handleLocationChange}
              />

              {formData.localizacao?.latitude !== 0 && formData.localizacao?.longitude !== 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${formData.localizacao.latitude},${formData.localizacao.longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Google Maps
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const url = `https://www.waze.com/ul?ll=${formData.localizacao.latitude},${formData.localizacao.longitude}&navigate=yes`;
                      window.open(url, '_blank');
                    }}
                  >
                    🚗 Waze
                  </Button>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  💡 <strong>Dica:</strong> Clique no mapa para definir a localização automaticamente.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="produto" className="space-y-4 mt-4">
              {!item && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="criar_produto"
                      checked={formData.criar_produto}
                      onCheckedChange={(checked) => setFormData({ ...formData, criar_produto: checked })}
                    />
                    <Label htmlFor="criar_produto" className="cursor-pointer">
                      Criar produto correspondente no cadastro de produtos
                    </Label>
                  </div>

                  {formData.criar_produto && (
                    <div className="space-y-2 pl-6">
                      <Label htmlFor="fornecedor_padrao_id">Fornecedor Padrão (Opcional)</Label>
                      <Select
                        value={formData.fornecedor_padrao_id}
                        onValueChange={(value) => setFormData({ ...formData, fornecedor_padrao_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Nenhum</SelectItem>
                          {fornecedores.map(forn => (
                            <SelectItem key={forn.id} value={forn.id}>
                              {forn.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isProcessing}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
          >
            <Save className="w-4 h-4 mr-2" />
            {item ? "Atualizar" : "Criar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
