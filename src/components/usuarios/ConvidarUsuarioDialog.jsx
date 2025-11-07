
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
  const [linkConvite, setLinkConvite] = useState("");
  const [emailEnviado, setEmailEnviado] = useState(false);

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
        setLinkConvite(response.data.convite_url || "");
        const emailSentSuccessfully = response.data.email_enviado || false;
        setEmailEnviado(emailSentSuccessfully);
        
        setTimeout(() => {
          onSuccess();
          onClose();
          setSucesso(false);
          setLinkConvite("");
          setEmailEnviado(false);
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
        }, emailSentSuccessfully ? 2000 : 5000); // Adjust timeout based on email delivery status
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
        setLinkConvite(""); // Reset link state
        setEmailEnviado(false); // Reset email status
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
            O usuário receberá um link para criar sua senha de acesso
          </DialogDescription>
        </DialogHeader>

        {sucesso ? (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            
            {emailEnviado ? (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  <p className="font-semibold mb-2">✅ Convite enviado com sucesso!</p>
                  <p className="text-sm">
                    O usuário receberá um email com instruções para criar sua senha.
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <p className="font-semibold mb-2">⚠️ Email não enviado automaticamente</p>
                    <p className="text-sm">
                      Copie o link abaixo e envie manualmente para: <strong>{formData.email}</strong>
                    </p>
                  </AlertDescription>
                </Alert>
                
                {linkConvite && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <Label className="text-sm font-semibold mb-2 block">🔗 Link do Convite:</Label>
                    <div className="flex gap-2">
                      <Input
                        value={linkConvite}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(linkConvite);
                          alert('Link copiado!');
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Envie este link via WhatsApp, SMS ou outro canal para o usuário
                    </p>
                  </div>
                )}
              </>
            )}
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
                <p className="mb-1">
                  Um link de convite será gerado para <strong>{formData.email || '(email não informado)'}</strong>.
                </p>
                <p className="text-xs text-blue-700">
                  ℹ️ Se o email não puder ser enviado automaticamente, você receberá o link para enviar manualmente.
                </p>
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
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar Convite
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
