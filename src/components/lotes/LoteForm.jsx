import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin } from "lucide-react";
import InputCurrency from "@/components/ui/input-currency";

export default function LoteForm({ open, onClose, onSave, lote, loteamentos }) {
  const [formData, setFormData] = useState({
    loteamento_id: "",
    numero: "",
    quadra: "",
    matricula: "",
    area: "",
    frente: "",
    fundo: "",
    lado_esquerdo: "",
    lado_direito: "",
    valor_m2: "",
    valor_total: "",
    status: "disponivel",
    observacoes: "",
  });

  useEffect(() => {
    if (lote) {
      setFormData({
        loteamento_id: lote.loteamento_id || "",
        numero: lote.numero || "",
        quadra: lote.quadra || "",
        matricula: lote.matricula || "",
        area: lote.area || "",
        frente: lote.frente || "",
        fundo: lote.fundo || "",
        lado_esquerdo: lote.lado_esquerdo || "",
        lado_direito: lote.lado_direito || "",
        valor_m2: lote.valor_m2 || "",
        valor_total: lote.valor_total || "",
        status: lote.status || "disponivel",
        observacoes: lote.observacoes || "",
      });
    } else {
      setFormData({
        loteamento_id: "",
        numero: "",
        quadra: "",
        matricula: "",
        area: "",
        frente: "",
        fundo: "",
        lado_esquerdo: "",
        lado_direito: "",
        valor_m2: "",
        valor_total: "",
        status: "disponivel",
        observacoes: "",
      });
    }
  }, [lote, open]);

  // Calcular valor total automaticamente
  useEffect(() => {
    if (formData.area && formData.valor_m2) {
      const valorCalculado = parseFloat(formData.area) * parseFloat(formData.valor_m2);
      setFormData(prev => ({ ...prev, valor_total: valorCalculado }));
    }
  }, [formData.area, formData.valor_m2]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[var(--wine-700)]" />
            {lote ? "Editar Lote" : "Novo Lote"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Loteamento *</Label>
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

            <div>
              <Label>Número do Lote *</Label>
              <Input
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="Ex: 01, A-15"
                required
              />
            </div>

            <div>
              <Label>Quadra</Label>
              <Input
                value={formData.quadra}
                onChange={(e) => setFormData({ ...formData, quadra: e.target.value })}
                placeholder="Ex: A, 1"
              />
            </div>

            <div>
              <Label>Matrícula</Label>
              <Input
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                placeholder="Nº da matrícula"
              />
            </div>

            <div className="col-span-2">
              <Label>Área (m²) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="250.00"
                required
              />
            </div>

            <div className="col-span-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="em_negociacao">Em Negociação</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Frente (m)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.frente}
                onChange={(e) => setFormData({ ...formData, frente: e.target.value })}
                placeholder="10.00"
              />
            </div>

            <div>
              <Label>Fundo (m)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.fundo}
                onChange={(e) => setFormData({ ...formData, fundo: e.target.value })}
                placeholder="10.00"
              />
            </div>

            <div>
              <Label>Lado Esquerdo (m)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.lado_esquerdo}
                onChange={(e) => setFormData({ ...formData, lado_esquerdo: e.target.value })}
                placeholder="25.00"
              />
            </div>

            <div>
              <Label>Lado Direito (m)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.lado_direito}
                onChange={(e) => setFormData({ ...formData, lado_direito: e.target.value })}
                placeholder="25.00"
              />
            </div>

            <div>
              <Label>Valor/m² (R$)</Label>
              <InputCurrency
                value={formData.valor_m2}
                onChange={(value) => setFormData({ ...formData, valor_m2: value })}
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <Label>Valor Total (R$)</Label>
              <InputCurrency
                value={formData.valor_total}
                onChange={(value) => setFormData({ ...formData, valor_total: value })}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                placeholder="Informações adicionais sobre o lote..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              {lote ? "Atualizar" : "Criar"} Lote
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}