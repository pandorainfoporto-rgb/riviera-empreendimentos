import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Check, Mail, MessageSquare } from "lucide-react";

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
  const [senhaGerada, setSenhaGerada] = useState(null);
  const [copiado, setCopiado] = useState(false);

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
        setSenhaGerada(response.data);
        toast.success('Usuário cadastrado com sucesso!');
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

  const copiarCredenciais = () => {
    if (!senhaGerada) return;
    
    const texto = senhaGerada.instrucoes;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    toast.success('Credenciais copiadas!');
    setTimeout(() => setCopiado(false), 2000);
  };

  const enviarWhatsApp = () => {
    if (!senhaGerada) return;
    
    const texto = encodeURIComponent(senhaGerada.instrucoes);
    const telefone = senhaGerada.usuario.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${telefone}?text=${texto}`, '_blank');
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
    setSenhaGerada(null);
    setCopiado(false);
    onClose();
  };

  if (senhaGerada) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-600 flex items-center gap-2">
              <Check className="w-6 h-6" />
              Usuário Cadastrado com Sucesso!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Dados do Usuário:</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Nome:</strong> {senhaGerada.usuario.nome}</p>
                <p><strong>Email:</strong> {senhaGerada.usuario.email}</p>
                <p className="flex items-center gap-2">
                  <strong>Senha Temporária:</strong> 
                  <code className="bg-green-100 px-2 py-1 rounded font-mono text-lg">
                    {senhaGerada.usuario.senha_temporaria}
                  </code>
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Importante:</h3>
              <p className="text-sm text-yellow-800">
                Copie as credenciais abaixo e envie ao novo usuário por WhatsApp, email ou outro meio seguro.
              </p>
            </div>

            <div className="bg-gray-50 border rounded-lg p-4">
              <pre className="text-sm whitespace-pre-wrap">{senhaGerada.instrucoes}</pre>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={copiarCredenciais}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {copiado ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Credenciais
                  </>
                )}
              </Button>

              {senhaGerada.usuario.telefone && (
                <Button
                  onClick={enviarWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Enviar por WhatsApp
                </Button>
              )}
            </div>

            <Button
              onClick={handleClose}
              variant="outline"
              className="w-full"
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
              <Label>Telefone (WhatsApp)</Label>
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}