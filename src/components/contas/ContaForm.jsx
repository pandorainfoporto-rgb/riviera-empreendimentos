import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Landmark } from "lucide-react";

export default function ContaForm({ conta, onClose }) {
  const [formData, setFormData] = useState({
    banco_id: conta?.banco_id || '',
    numero_conta: conta?.numero_conta || '',
    tipo_conta: conta?.tipo_conta || 'corrente',
    titular: conta?.titular || '',
    saldo_inicial: conta?.saldo_inicial || 0,
    ativa: conta?.ativa !== undefined ? conta.ativa : true,
    observacoes: conta?.observacoes || '',
  });

  const queryClient = useQueryClient();

  const { data: bancos = [] } = useQuery({
    queryKey: ['bancos'],
    queryFn: () => base44.entities.Banco.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (conta) {
        return base44.entities.Conta.update(conta.id, data);
      } else {
        return base44.entities.Conta.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas'] });
      toast.success(conta ? 'Conta atualizada!' : 'Conta criada!');
      onClose();
    },
    onError: (error) => {
      toast.error('Erro ao salvar conta');
      console.error(error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--wine-700)]">
          <Landmark className="w-5 h-5" />
          {conta ? 'Editar Conta' : 'Nova Conta'}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Banco *</Label>
              <Select
                value={formData.banco_id}
                onValueChange={(value) => setFormData({ ...formData, banco_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {bancos.map(banco => (
                    <SelectItem key={banco.id} value={banco.id}>
                      {banco.nome} {banco.codigo && `(${banco.codigo})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Conta *</Label>
              <Select
                value={formData.tipo_conta}
                onValueChange={(value) => setFormData({ ...formData, tipo_conta: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Conta Corrente</SelectItem>
                  <SelectItem value="poupanca">Poupança</SelectItem>
                  <SelectItem value="investimento">Investimento</SelectItem>
                  <SelectItem value="aplicacao">Aplicação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número da Conta *</Label>
              <Input
                value={formData.numero_conta}
                onChange={(e) => setFormData({ ...formData, numero_conta: e.target.value })}
                placeholder="Ex: 12345-6"
                required
              />
            </div>

            <div>
              <Label>Titular</Label>
              <Input
                value={formData.titular}
                onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                placeholder="Nome do titular"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Saldo Inicial (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.saldo_inicial}
                onChange={(e) => setFormData({ ...formData, saldo_inicial: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData.ativa ? 'ativa' : 'inativa'}
                onValueChange={(value) => setFormData({ ...formData, ativa: value === 'ativa' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações sobre a conta..."
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]">
            {conta ? 'Atualizar' : 'Criar'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}