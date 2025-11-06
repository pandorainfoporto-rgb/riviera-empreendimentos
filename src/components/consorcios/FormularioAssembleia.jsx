import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Award, TrendingUp, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function FormularioAssembleia({ grupos = [], loteamentos = [], onClose, onSubmit, isProcessing }) {
  const [formData, setFormData] = useState({
    grupo: "",
    loteamento_id: "",
    data_assembleia: new Date().toISOString().split('T')[0],
    cotas_contempladas: [],
    observacoes: "",
  });

  const [novaCota, setNovaCota] = useState({
    numero_cota: "",
    tipo: "sorteio",
    percentual_lance: 0,
  });

  const handleAdicionarCota = () => {
    if (!novaCota.numero_cota) {
      alert("Digite o número da cota");
      return;
    }

    if (novaCota.tipo === "lance" && (!novaCota.percentual_lance || novaCota.percentual_lance <= 0)) {
      alert("Digite o percentual do lance");
      return;
    }

    if ((formData.cotas_contempladas || []).find(c => c.numero_cota === novaCota.numero_cota)) {
      alert("Esta cota já foi adicionada");
      return;
    }

    setFormData({
      ...formData,
      cotas_contempladas: [...(formData.cotas_contempladas || []), { ...novaCota }],
    });

    setNovaCota({
      numero_cota: "",
      tipo: "sorteio",
      percentual_lance: 0,
    });
  };

  const handleRemoverCota = (numeroCota) => {
    setFormData({
      ...formData,
      cotas_contempladas: (formData.cotas_contempladas || []).filter(c => c.numero_cota !== numeroCota),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.cotas_contempladas || formData.cotas_contempladas.length === 0) {
      alert("Adicione pelo menos uma cota contemplada");
      return;
    }

    onSubmit(formData);
  };

  const gruposArray = Array.isArray(grupos) ? grupos : [];
  const loteamentosArray = Array.isArray(loteamentos) ? loteamentos : [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--wine-700)]">
            Registrar Resultado da Assembleia
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grupo">Grupo *</Label>
                <Select
                  value={formData.grupo}
                  onValueChange={(value) => setFormData({ ...formData, grupo: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {gruposArray.length > 0 ? (
                      gruposArray.map(grupo => (
                        <SelectItem key={grupo} value={grupo}>
                          Grupo {grupo}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value={null} disabled>Nenhum grupo disponível</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_assembleia">Data da Assembleia *</Label>
                <Input
                  id="data_assembleia"
                  type="date"
                  value={formData.data_assembleia}
                  onChange={(e) => setFormData({ ...formData, data_assembleia: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loteamento_id">Loteamento (Opcional)</Label>
              <Select
                value={formData.loteamento_id}
                onValueChange={(value) => setFormData({ ...formData, loteamento_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {loteamentosArray.length > 0 ? (
                    loteamentosArray.map(lot => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.nome}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={null} disabled>Nenhum loteamento disponível</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-[var(--wine-700)] mb-4">
                Cotas Contempladas
              </h3>

              <div className="grid md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="numero_cota">Número da Cota</Label>
                  <Input
                    id="numero_cota"
                    value={novaCota.numero_cota}
                    onChange={(e) => setNovaCota({ ...novaCota, numero_cota: e.target.value })}
                    placeholder="Ex: 001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Contemplação</Label>
                  <Select
                    value={novaCota.tipo}
                    onValueChange={(value) => setNovaCota({ ...novaCota, tipo: value, percentual_lance: value === 'sorteio' ? 0 : novaCota.percentual_lance })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sorteio">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          Sorteio
                        </div>
                      </SelectItem>
                      <SelectItem value="lance">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Lance
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {novaCota.tipo === 'lance' && (
                  <div className="space-y-2">
                    <Label htmlFor="percentual_lance">Percentual do Lance (%)</Label>
                    <Input
                      id="percentual_lance"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={novaCota.percentual_lance}
                      onChange={(e) => setNovaCota({ ...novaCota, percentual_lance: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                )}

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAdicionarCota}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {(formData.cotas_contempladas || []).map((cota, index) => (
                  <Card key={index} className="bg-white border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {cota.tipo === 'sorteio' ? (
                            <div className="flex items-center gap-2 text-blue-700">
                              <Award className="w-5 h-5" />
                              <span className="font-semibold">Cota {cota.numero_cota}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-purple-700">
                              <TrendingUp className="w-5 h-5" />
                              <span className="font-semibold">Cota {cota.numero_cota}</span>
                            </div>
                          )}
                          
                          <Badge className={cota.tipo === 'sorteio' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                            {cota.tipo === 'sorteio' ? 'Sorteio' : `Lance ${cota.percentual_lance}%`}
                          </Badge>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoverCota(cota.numero_cota)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {(!formData.cotas_contempladas || formData.cotas_contempladas.length === 0) && (
                  <p className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                    Nenhuma cota contemplada adicionada ainda
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações sobre a assembleia..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
              disabled={isProcessing}
            >
              <Save className="w-4 h-4 mr-2" />
              {isProcessing ? "Salvando..." : "Salvar Resultado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}