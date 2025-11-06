import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoteamentoForm({ open, onClose, onSave, loteamento }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [formData, setFormData] = useState({
    nome: loteamento?.nome || "",
    descricao: loteamento?.descricao || "",
    endereco: loteamento?.endereco || "",
    cidade: loteamento?.cidade || "",
    estado: loteamento?.estado || "",
    area_total: loteamento?.area_total || "",
    quantidade_lotes: loteamento?.quantidade_lotes || "",
    data_aprovacao: loteamento?.data_aprovacao || "",
    numero_registro: loteamento?.numero_registro || "",
    status: loteamento?.status || "planejamento",
    observacoes: loteamento?.observacoes || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    
    // Validação básica
    if (!formData.nome || !formData.nome.trim()) {
      setErro("O nome do loteamento é obrigatório");
      toast.error("O nome do loteamento é obrigatório");
      return;
    }

    setLoading(true);

    try {
      const dadosParaSalvar = {
        ...formData,
        area_total: formData.area_total ? Number(formData.area_total) : 0,
        quantidade_lotes: formData.quantidade_lotes ? Number(formData.quantidade_lotes) : 0,
      };

      console.log('Salvando loteamento:', dadosParaSalvar);
      
      await onSave(dadosParaSalvar);
      
      toast.success(loteamento ? 'Loteamento atualizado!' : 'Loteamento criado!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar loteamento:', error);
      const mensagemErro = error.response?.data?.message || error.message || 'Erro ao salvar loteamento';
      setErro(mensagemErro);
      toast.error(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErro(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {loteamento ? "Editar Loteamento" : "Novo Loteamento"}
          </DialogTitle>
        </DialogHeader>

        {erro && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <p className="font-semibold">Erro ao salvar</p>
              <p className="text-sm mt-1">{erro}</p>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome do Loteamento *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do loteamento"
                required
                disabled={loading}
              />
            </div>

            <div className="col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do loteamento"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="col-span-2">
              <Label>Endereço</Label>
              <Input
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Endereço completo"
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

            <div>
              <Label>Área Total (m²)</Label>
              <Input
                type="number"
                value={formData.area_total}
                onChange={(e) => setFormData({ ...formData, area_total: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
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
                min="0"
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
                placeholder="Nº do registro em cartório"
                disabled={loading}
              />
            </div>

            <div className="col-span-2">
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

            <div className="col-span-2">
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
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
                loteamento ? "Atualizar" : "Criar Loteamento"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}