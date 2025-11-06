import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Loader2 } from "lucide-react";

export default function GerarAportesDialog({ socios, empreendimentos, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    empreendimento_id: "",
    mes_referencia: "",
    dia_vencimento: "10",
    valor_padrao: 0,
    socios_selecionados: [],
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSocioToggle = (socioId) => {
    setFormData(prev => ({
      ...prev,
      socios_selecionados: prev.socios_selecionados.includes(socioId)
        ? prev.socios_selecionados.filter(id => id !== socioId)
        : [...prev.socios_selecionados, socioId]
    }));
  };

  const handleSelectAll = () => {
    const sociosDoEmp = socios.filter(s => 
      s.empreendimentos?.some(e => e.empreendimento_id === formData.empreendimento_id)
    );
    setFormData(prev => ({
      ...prev,
      socios_selecionados: sociosDoEmp.map(s => s.id)
    }));
  };

  const handleGerarAportes = async () => {
    if (!formData.empreendimento_id || !formData.mes_referencia || formData.socios_selecionados.length === 0) {
      alert("Preencha todos os campos e selecione ao menos um sócio");
      return;
    }

    setIsProcessing(true);
    try {
      const [ano, mes] = formData.mes_referencia.split('-');
      const dataVencimento = `${ano}-${mes}-${formData.dia_vencimento.padStart(2, '0')}`;

      const aportes = formData.socios_selecionados.map(socioId => ({
        socio_id: socioId,
        empreendimento_id: formData.empreendimento_id,
        valor: formData.valor_padrao,
        mes_referencia: formData.mes_referencia,
        data_vencimento: dataVencimento,
        status: "pendente",
      }));

      await base44.entities.AporteSocio.bulkCreate(aportes);
      onSuccess();
    } catch (error) {
      console.error("Erro ao gerar aportes:", error);
      alert("Erro ao gerar aportes");
    }
    setIsProcessing(false);
  };

  const sociosDoEmpreendimento = socios.filter(s => 
    s.empreendimentos?.some(e => e.empreendimento_id === formData.empreendimento_id)
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--wine-700)]">Gerar Aportes em Lote</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Empreendimento *</Label>
            <Select
              value={formData.empreendimento_id}
              onValueChange={(value) => setFormData({ ...formData, empreendimento_id: value, socios_selecionados: [] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um empreendimento" />
              </SelectTrigger>
              <SelectContent>
                {empreendimentos.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mês de Referência *</Label>
              <Input
                type="month"
                value={formData.mes_referencia}
                onChange={(e) => setFormData({ ...formData, mes_referencia: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Dia de Vencimento *</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={formData.dia_vencimento}
                onChange={(e) => setFormData({ ...formData, dia_vencimento: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Valor Padrão (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.valor_padrao}
              onChange={(e) => setFormData({ ...formData, valor_padrao: parseFloat(e.target.value) })}
            />
          </div>

          {formData.empreendimento_id && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Sócios do Empreendimento *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Selecionar Todos
                </Button>
              </div>
              
              {sociosDoEmpreendimento.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum sócio vinculado a este empreendimento</p>
              ) : (
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                  {sociosDoEmpreendimento.map(socio => (
                    <div key={socio.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        id={socio.id}
                        checked={formData.socios_selecionados.includes(socio.id)}
                        onCheckedChange={() => handleSocioToggle(socio.id)}
                      />
                      <Label htmlFor={socio.id} className="cursor-pointer flex-1">
                        {socio.nome}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGerarAportes}
            disabled={isProcessing}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Gerar Aportes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}