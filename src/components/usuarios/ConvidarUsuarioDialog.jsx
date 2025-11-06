import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Mail, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [resultado, setResultado] = useState(null);

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
    setResultado(null);

    try {
      const response = await base44.functions.invoke('convidarUsuarioSistema', formData);

      if (response.data.success) {
        setResultado({
          tipo: 'sucesso',
          mensagem: response.data.message,
          detalhes: response.data.detalhes,
          usuario: response.data.usuario
        });
        toast.success('Usuário convidado com sucesso!');
        if (onSuccess) onSuccess();
      } else {
        setResultado({
          tipo: 'erro',
          mensagem: response.data.error || 'Erro ao convidar usuário'
        });
        toast.error(response.data.error || 'Erro ao convidar usuário');
      }
    } catch (error) {
      console.error('Erro ao convidar:', error);
      setResultado({
        tipo: 'erro',
        mensagem: 'Erro ao convidar usuário: ' + error.message
      });
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
    setResultado(null);
    onClose();
  };

  if (resultado?.tipo === 'sucesso') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-600 flex items-center gap-2">
              <Check className="w-6 h-6" />
              Convite Enviado!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <Mail className="w-5 h-5 text-green-600" />
              <AlertDescription className="text-green-800">
                <p className="font-semibold mb-2">{resultado.mensagem}</p>
                <p className="text-sm">{resultado.detalhes}</p>
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">📋 Dados do Usuário Criado</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nome:</span>
                  <span className="font-medium">{resultado.usuario.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{resultado.usuario.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium capitalize">{resultado.usuario.tipo_acesso}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">ℹ️ Próximos Passos</h3>
              <ol className="list-decimal list-inside text-sm text-amber-800 space-y-1">
                <li>O usuário recebeu um email do Base44</li>
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

        {resultado?.tipo === 'erro' && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <p className="font-semibold">Erro ao convidar usuário</p>
              <p className="text-sm mt-1">{resultado.mensagem}</p>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome Completo *</Label>
              <Input
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                placeholder="Nome completo do usuário"
                required
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
                disabled={loading}
              />
            </div>

            <div>
              <Label>Tipo de Acesso *</Label>
              <Select
                value={formData.tipo_acesso}
                onValueChange={(value) => setFormData({ ...formData, tipo_acesso: value })}
                disabled={loading}
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
                disabled={loading}
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
                  disabled={loading}
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
                disabled={loading}
              />
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Mail className="w-5 h-5 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              O Base44 enviará automaticamente um email para <strong>{formData.email || '(email)'}</strong> com instruções para criar senha e acessar o sistema.
            </AlertDescription>
          </Alert>

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
                  Convidando...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Convite
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}