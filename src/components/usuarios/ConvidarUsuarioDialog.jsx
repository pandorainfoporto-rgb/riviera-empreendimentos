import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Loader2, CheckCircle2, UserPlus, AlertCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function ConvidarUsuarioDialog({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    nome_completo: '',
    tipo_acesso: 'usuario',
    grupo_id: '',
    imobiliaria_id: '',
    telefone: '',
    cargo: '',
  });
  const [resultadoCriacao, setResultadoCriacao] = useState(null);

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos_usuario'],
    queryFn: () => base44.entities.GrupoUsuario.list(),
  });

  const convidarMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('convidarUsuarioSistema', data);
    },
    onSuccess: (response) => {
      if (response.data.success) {
        setResultadoCriacao({
          sucesso: true,
          email: formData.email,
          nome: formData.nome_completo,
          senha_temporaria: response.data.senha_temporaria,
          email_enviado: response.data.email_enviado,
        });
      } else {
        setResultadoCriacao({
          sucesso: false,
          erro: response.data.error || 'Erro ao enviar convite'
        });
      }
    },
    onError: (error) => {
      setResultadoCriacao({
        sucesso: false,
        erro: error.message || 'Erro ao processar solicitação'
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.tipo_acesso === 'imobiliaria' && !formData.imobiliaria_id) {
      toast.error('Selecione uma imobiliária para vincular');
      return;
    }

    convidarMutation.mutate(formData);
  };

  const handleFechar = () => {
    setResultadoCriacao(null);
    setFormData({
      email: '',
      nome_completo: '',
      tipo_acesso: 'usuario',
      grupo_id: '',
      imobiliaria_id: '',
      telefone: '',
      cargo: '',
    });
    onSuccess?.();
    onClose();
  };

  const copiarSenha = () => {
    if (resultadoCriacao?.senha_temporaria) {
      navigator.clipboard.writeText(resultadoCriacao.senha_temporaria);
      toast.success('Senha copiada!');
    }
  };

  // Se já tem resultado, mostrar tela de resultado
  if (resultadoCriacao) {
    return (
      <Dialog open={open} onOpenChange={handleFechar}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {resultadoCriacao.sucesso ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <span className="text-green-700">Usuário Criado com Sucesso!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <span className="text-red-700">Erro ao Criar Usuário</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {resultadoCriacao.sucesso ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>✅ Usuário cadastrado com sucesso!</strong>
                </AlertDescription>
              </Alert>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 space-y-3 border-2 border-gray-200">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Nome</p>
                  <p className="font-semibold text-gray-900">{resultadoCriacao.nome}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Email de Login</p>
                  <p className="font-semibold text-gray-900">{resultadoCriacao.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Senha Temporária</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-2xl font-bold text-[var(--wine-600)] bg-white px-4 py-2 rounded border-2 border-[var(--wine-200)] flex-1">
                      {resultadoCriacao.senha_temporaria}
                    </p>
                    <Button
                      onClick={copiarSenha}
                      size="icon"
                      variant="outline"
                      className="flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {resultadoCriacao.email_enviado ? (
                <Alert className="bg-blue-50 border-blue-200">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>📧 Email enviado com sucesso!</strong><br />
                    O usuário receberá um email com as credenciais de acesso.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>⚠️ Email não enviado</strong><br />
                    Repasse as credenciais manualmente para o usuário.
                  </AlertDescription>
                </Alert>
              )}

              <Alert className="bg-orange-50 border-orange-200">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <AlertDescription className="text-orange-800 text-sm">
                  <strong>⚠️ Importante:</strong> Guarde esta senha! Ela não será exibida novamente.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Erro:</strong> {resultadoCriacao.erro}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button onClick={handleFechar} className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Formulário de criação
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Cadastrar Novo Usuário
          </DialogTitle>
        </DialogHeader>

        <Alert className="bg-green-50 border-green-200">
          <Mail className="w-4 h-4" />
          <AlertDescription>
            <strong>✅ Cadastro Direto:</strong> O usuário será criado imediatamente e receberá um email com as credenciais de acesso.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome Completo *</Label>
              <Input
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                placeholder="Ex: João da Silva"
                required
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@exemplo.com"
                required
              />
            </div>

            <div>
              <Label>Tipo de Acesso *</Label>
              <Select
                value={formData.tipo_acesso}
                onValueChange={(val) => {
                  setFormData({ ...formData, tipo_acesso: val });
                  const grupoCorrespondente = grupos.find(g => g.tipo === val);
                  if (grupoCorrespondente) {
                    setFormData(prev => ({ ...prev, grupo_id: grupoCorrespondente.id }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">👑 Administrador</SelectItem>
                  <SelectItem value="usuario">👤 Usuário Operacional</SelectItem>
                  <SelectItem value="imobiliaria">🏢 Portal Imobiliária</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Grupo de Permissões</Label>
              <Select
                value={formData.grupo_id}
                onValueChange={(val) => setFormData({ ...formData, grupo_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grupo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map(grupo => (
                    <SelectItem key={grupo.id} value={grupo.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: grupo.cor }}
                        />
                        {grupo.nome} {grupo.eh_sistema && '(Sistema)'}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Se não selecionado, usará as permissões padrão do tipo de acesso
              </p>
            </div>

            {formData.tipo_acesso === 'imobiliaria' && (
              <div className="col-span-2">
                <Label>Imobiliária Vinculada *</Label>
                <Select
                  value={formData.imobiliaria_id}
                  onValueChange={(val) => setFormData({ ...formData, imobiliaria_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a imobiliária" />
                  </SelectTrigger>
                  <SelectContent>
                    {imobiliarias.map(imob => (
                      <SelectItem key={imob.id} value={imob.id}>
                        {imob.nome} - {imob.cnpj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                placeholder="Ex: Gerente Comercial"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={convidarMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={convidarMutation.isPending}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              {convidarMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando Usuário...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar e Enviar Convite
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}