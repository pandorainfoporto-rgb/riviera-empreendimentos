import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, AlertCircle, Loader2, Copy, ExternalLink } from "lucide-react";
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
      console.log('Enviando dados:', formData);
      const response = await base44.functions.invoke('convidarUsuarioSistema', formData);
      console.log('Resposta:', response);

      if (response.data.success) {
        setResultado({
          tipo: 'sucesso',
          mensagem: response.data.message,
          detalhes: response.data.detalhes,
          usuario: response.data.usuario,
          requer_convite: response.data.requer_convite_dashboard
        });
        toast.success('Usuário pré-cadastrado!');
        if (onSuccess) onSuccess();
      } else {
        setResultado({
          tipo: 'erro',
          mensagem: response.data.error || 'Erro ao processar convite'
        });
        toast.error(response.data.error || 'Erro ao processar convite');
      }
    } catch (error) {
      console.error('Erro ao convidar:', error);
      setResultado({
        tipo: 'erro',
        mensagem: 'Erro: ' + (error.response?.data?.error || error.message)
      });
      toast.error('Erro: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const copiarEmail = () => {
    if (resultado?.usuario?.email) {
      navigator.clipboard.writeText(resultado.usuario.email);
      toast.success('Email copiado!');
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-600 flex items-center gap-2">
              <Check className="w-6 h-6" />
              Pré-Cadastro Realizado!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <Check className="w-5 h-5 text-green-600" />
              <AlertDescription className="text-green-800">
                <p className="font-semibold mb-2">{resultado.mensagem}</p>
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">👤 Dados do Usuário</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Nome:</span>
                  <span className="font-medium">{resultado.usuario.nome}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-600">Email:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{resultado.usuario.email}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copiarEmail}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium capitalize">{resultado.usuario.tipo_acesso}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Senha temporária:</span>
                  <span className="font-mono font-bold text-blue-600">{resultado.usuario.senha_temporaria}</span>
                </div>
              </div>
            </div>

            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <div className="space-y-2">
                  <p className="font-semibold">⚠️ AÇÃO NECESSÁRIA:</p>
                  <pre className="text-xs whitespace-pre-wrap bg-white p-3 rounded border border-amber-300 mt-2">
                    {resultado.detalhes}
                  </pre>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={() => window.open('https://base44.app/dashboard', '_blank')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Dashboard Base44
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
              >
                Fechar
              </Button>
            </div>
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
              <p className="font-semibold">Erro ao processar</p>
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

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              <p className="font-semibold mb-1">⚠️ Processo em 2 etapas:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Este formulário faz o pré-cadastro</li>
                <li>Você precisará convidar o usuário através do Dashboard do Base44</li>
                <li>Receberá instruções detalhadas após o cadastro</li>
              </ol>
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
                  Processando...
                </>
              ) : (
                'Cadastrar Usuário'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}