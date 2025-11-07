
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Mail, User, Briefcase, Phone, Shield, CheckCircle2, AlertCircle } from "lucide-react";

export default function ConvidarUsuarioDialog({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    tipo_acesso: "usuario",
    grupo_id: "",
    cliente_id: "",
    imobiliaria_id: "",
    telefone: "",
    cargo: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos_permissoes'],
    queryFn: () => base44.entities.GrupoUsuario.list(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
    enabled: formData.tipo_acesso === 'cliente',
  });

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
    enabled: formData.tipo_acesso === 'imobiliaria',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setIsLoading(true);

    try {
      const response = await base44.functions.invoke('enviarConvite', formData);

      if (response.data.success) {
        setSucesso(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          setSucesso(false); // Reset sucesso state for next open
          setFormData({ // Reset form data for next open
            email: "",
            full_name: "",
            tipo_acesso: "usuario",
            grupo_id: "",
            cliente_id: "",
            imobiliaria_id: "",
            telefone: "",
            cargo: ""
          });
        }, 2000);
      } else {
        setErro(response.data.error || "Erro ao enviar convite");
      }
    } catch (error) {
      console.error("Erro:", error);
      setErro(error.response?.data?.error || "Erro ao enviar convite. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setSucesso(false); // Reset success state when closing
        setErro(""); // Reset error state when closing
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Convidar Novo Usuário
          </DialogTitle>
          <DialogDescription>
            O usuário receberá um email com link para criar sua senha de acesso
          </DialogDescription>
        </DialogHeader>

        {sucesso ? (
          <div className="py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                <p className="font-semibold mb-2">✅ Convite enviado com sucesso!</p>
                <p className="text-sm">
                  O usuário receberá um email com instruções para criar sua senha.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {erro}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Nome completo do usuário"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="col-span-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tipo_acesso">Tipo de Acesso *</Label>
                <Select
                  value={formData.tipo_acesso}
                  onValueChange={(value) => setFormData({ ...formData, tipo_acesso: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-600" />
                        <span>Administrador</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="usuario">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span>Usuário</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cliente">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-green-600" />
                        <span>Cliente</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="imobiliaria">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-600" />
                        <span>Imobiliária</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="grupo_id">Grupo de Permissões</Label>
                <Select
                  value={formData.grupo_id}
                  onValueChange={(value) => setFormData({ ...formData, grupo_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
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

              {formData.tipo_acesso === 'cliente' && (
                <div className="col-span-2">
                  <Label htmlFor="cliente_id">Cliente *</Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.tipo_acesso === 'imobiliaria' && (
                <div className="col-span-2">
                  <Label htmlFor="imobiliaria_id">Imobiliária *</Label>
                  <Select
                    value={formData.imobiliaria_id}
                    onValueChange={(value) => setFormData({ ...formData, imobiliaria_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a imobiliária" />
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

              <div>
                <Label htmlFor="cargo">Cargo</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    placeholder="Ex: Gerente, Vendedor..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                Um email será enviado para <strong>{formData.email || '(email não informado)'}</strong> com um link exclusivo para criar a senha.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} type="button">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
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
