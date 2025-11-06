import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Mail } from "lucide-react";

export default function ConvidarUsuarioDialog({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    nome_completo: "",
    tipo_acesso: "usuario",
    grupo_id: "",
    imobiliaria_id: "",
    telefone: "",
    cargo: "",
  });

  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(null);

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos_usuario'],
    queryFn: () => base44.entities.GrupoUsuario.list(),
  });

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await base44.functions.invoke('convidarUsuarioSistema', formData);

      if (response.data.success) {
        setSucesso(response.data);
        toast.success('Usuário convidado com sucesso!');
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.data.error || 'Erro ao convidar usuário');
      }
    } catch (error) {
      console.error('Erro ao convidar:', error);
      toast.error('Erro ao convidar usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: "",
      nome_completo: "",
      tipo_acesso: "usuario",
      grupo_id: "",
      imobiliaria_id: "",
      telefone: "",
      cargo: "",
    });
    setSucesso(null);
    onClose();
  };

  if (sucesso) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-600 flex items-center gap-2">
              <Check className="w-6 h-6" />
              Convite Enviado com Sucesso!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-2">Email de Convite Enviado</h3>
                  <p className="text-sm text-green-800">
                    Um email foi enviado para <strong>{sucesso.usuario.email}</strong> com instruções para criar a senha e acessar o sistema.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📋 Dados do Usuário</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Nome:</strong> {sucesso.usuario.nome}</p>
                <p><strong>Email:</strong> {sucesso.usuario.email}</p>
                <p><strong>Tipo:</strong> {sucesso.usuario.tipo_acesso}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">ℹ️ Próximos Passos</h3>
              <ol className="list-decimal list-inside text-sm text-yellow-800 space-y-1">
                <li>O usuário receberá um email do Base44</li>
                <li>Ele deve clicar no link do email</li>
                <li>Criar uma senha de acesso</li>
                <li>Fazer login no sistema</li>
              </ol>
            </div>

            <Button
              onClick={handleClose}
              className="w-full bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convidar Novo Usuário</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome Completo *</Label>
              <Input
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
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

            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <Label>Tipo de Acesso *</Label>
              <Select
                value={formData.tipo_acesso}
                onValueChange={(value) => setFormData({ ...formData, tipo_acesso: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="usuario">Usuário</SelectItem>
                  <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Grupo de Permissões</Label>
              <Select
                value={formData.grupo_id}
                onValueChange={(value) => setFormData({ ...formData, grupo_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map((grupo) => (
                    <SelectItem key={grupo.id} value={grupo.id}>
                      {grupo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.tipo_acesso === 'imobiliaria' && (
              <div className="col-span-2">
                <Label>Imobiliária *</Label>
                <Select
                  value={formData.imobiliaria_id}
                  onValueChange={(value) => setFormData({ ...formData, imobiliaria_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a imobiliária..." />
                  </SelectTrigger>
                  <SelectContent>
                    {imobiliarias.map((imob) => (
                      <SelectItem key={imob.id} value={imob.id}>
                        {imob.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="col-span-2">
              <Label>Cargo</Label>
              <Input
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                placeholder="Ex: Gerente de Vendas"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ℹ️ Um email será enviado automaticamente para <strong>{formData.email || '(email)'}</strong> com instruções para criar senha e acessar o sistema.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
            >
              {loading ? 'Enviando Convite...' : 'Enviar Convite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}