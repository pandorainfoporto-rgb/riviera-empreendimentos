
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, CheckCircle2, Shield, User } from "lucide-react";

export default function ConvidarUsuarioDialog({ open, onClose }) {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    tipo_acesso: "usuario",
    cliente_id: "",
    imobiliaria_id: "",
    telefone: "",
    cargo: ""
  });

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const queryClient = useQueryClient();

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  const convidarMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('convidarUsuario', data);
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['usuarios']);
      setSucesso(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    },
    onError: (error) => {
      setErro(error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro("");

    // Validações
    if (!formData.email || !formData.full_name || !formData.tipo_acesso) {
      setErro("Preencha os campos obrigatórios");
      return;
    }

    if (formData.tipo_acesso === 'cliente' && !formData.cliente_id) {
      setErro("Selecione um cliente");
      return;
    }

    if (formData.tipo_acesso === 'imobiliaria' && !formData.imobiliaria_id) {
      setErro("Selecione uma imobiliária");
      return;
    }

    convidarMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Convidar Novo Usuário</DialogTitle>
        </DialogHeader>

        {sucesso ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">Convite enviado com sucesso!</h3>
            <p className="text-gray-600">
              Um email foi enviado com as instruções de acesso.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">{erro}</AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nome Completo *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nome completo do usuário"
                  required
                />
              </div>

              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Tipo de Acesso *</Label>
              <Select
                value={formData.tipo_acesso}
                onValueChange={(v) => setFormData({ 
                  ...formData, 
                  tipo_acesso: v,
                  cliente_id: "",
                  imobiliaria_id: ""
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-600" />
                      Administrador (Acesso Total)
                    </div>
                  </SelectItem>
                  <SelectItem value="usuario">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      Usuário (Operacional)
                    </div>
                  </SelectItem>
                  <SelectItem value="cliente">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-green-600" />
                      Cliente (Portal do Cliente)
                    </div>
                  </SelectItem>
                  <SelectItem value="imobiliaria">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-600" />
                      Imobiliária (Portal Imobiliária)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipo_acesso === 'cliente' && (
              <div>
                <Label>Cliente *</Label>
                <Select
                  value={formData.cliente_id}
                  onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} - {c.email || c.cpf_cnpj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.tipo_acesso === 'imobiliaria' && (
              <div>
                <Label>Imobiliária *</Label>
                <Select
                  value={formData.imobiliaria_id}
                  onValueChange={(v) => setFormData({ ...formData, imobiliaria_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a imobiliária" />
                  </SelectTrigger>
                  <SelectContent>
                    {imobiliarias.map(i => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.nome} - {i.email || i.cnpj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <Label>Cargo/Função</Label>
                <Input
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  placeholder="Ex: Gerente Financeiro"
                />
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-900 text-sm">
                <strong>📧 Email automático:</strong> O usuário receberá um email com uma senha temporária e instruções de acesso.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={convidarMutation.isPending}
                className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
              >
                {convidarMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Enviar Convite
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
