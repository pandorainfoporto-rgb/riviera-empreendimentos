import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputMask, buscarCEP, removeMask } from "@/components/ui/input-mask";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function LoteamentoForm({ open, onClose, onSave, loteamento }) {
  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    area_total: "",
    quantidade_lotes: "",
    data_aprovacao: "",
    numero_registro: "",
    status: "planejamento",
    observacoes: "",
  });

  useEffect(() => {
    if (loteamento) {
      setFormData(loteamento);
    } else {
      setFormData({
        nome: "",
        descricao: "",
        endereco: "",
        cidade: "",
        estado: "",
        cep: "",
        area_total: "",
        quantidade_lotes: "",
        data_aprovacao: "",
        numero_registro: "",
        status: "planejamento",
        observacoes: "",
      });
    }
  }, [loteamento, open]);

  const handleBuscarCEP = async (cep) => {
    if (removeMask(cep).length === 8) {
      setBuscandoCep(true);
      const resultado = await buscarCEP(cep);
      setBuscandoCep(false);

      if (!resultado.erro) {
        setFormData({
          ...formData,
          cep,
          endereco: resultado.logradouro,
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
      console.error('Erro ao salvar loteamento:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {loteamento ? "Editar Loteamento" : "Novo Loteamento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do loteamento"
                required
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do loteamento"
                rows={3}
                disabled={loading}
              />
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

            <div className="md:col-span-2">
              <Label>Endereço/Localização</Label>
              <Input
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Endereço ou localização do loteamento"
                disabled={loading}
              />
            </div>

            <div>
              <Label>Área Total (m²)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.area_total}
                onChange={(e) => setFormData({ ...formData, area_total: e.target.value })}
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            <div>
              <Label>Quantidade de Lotes</Label>
              <Input
                type="number"
                value={formData.quantidade_lotes}
                onChange={(e) => setFormData({ ...formData, quantidade_lotes: e.target.value })}
                placeholder="0"
                disabled={loading}
              />
            </div>

            <div>
              <Label>Data de Aprovação</Label>
              <Input
                type="date"
                value={formData.data_aprovacao}
                onChange={(e) => setFormData({ ...formData, data_aprovacao: e.target.value })}
                disabled={loading}
              />
            </div>

            <div>
              <Label>Número de Registro</Label>
              <Input
                value={formData.numero_registro}
                onChange={(e) => setFormData({ ...formData, numero_registro: e.target.value })}
                placeholder="Número do registro em cartório"
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
                  <SelectItem value="planejamento">Planejamento</SelectItem>
                  <SelectItem value="aprovacao">Em Aprovação</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="em_comercializacao">Em Comercialização</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais"
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
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
                loteamento ? "Atualizar" : "Criar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}