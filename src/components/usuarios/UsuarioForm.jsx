import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function UsuarioForm({ usuario, clientes, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    confirmar_senha: "",
    nome: "",
    tipo_acesso: "colaborador",
    cliente_id: "",
    cargo: "",
    telefone: "",
    observacoes: "",
  });

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    if (usuario) {
      setFormData({
        email: usuario.email || "",
        senha: "",
        confirmar_senha: "",
        nome: usuario.nome || "",
        tipo_acesso: usuario.tipo_acesso || "colaborador",
        cliente_id: usuario.cliente_id || "",
        cargo: usuario.cargo || "",
        telefone: usuario.telefone || "",
        observacoes: usuario.observacoes || "",
      });
    }
  }, [usuario]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    // Validações
    if (!formData.email || !formData.nome || !formData.tipo_acesso) {
      setErro("Email, nome e tipo de acesso são obrigatórios");
      return;
    }

    if (!usuario) {
      // Criar novo usuário - senha obrigatória
      if (!formData.senha) {
        setErro("Senha é obrigatória para novo usuário");
        return;
      }
      if (formData.senha.length < 6) {
        setErro("Senha deve ter no mínimo 6 caracteres");
        return;
      }
      if (formData.senha !== formData.confirmar_senha) {
        setErro("As senhas não coincidem");
        return;
      }
    } else {
      // Editar usuário - senha opcional
      if (formData.senha && formData.senha !== formData.confirmar_senha) {
        setErro("As senhas não coincidem");
        return;
      }
      if (formData.senha && formData.senha.length < 6) {
        setErro("Senha deve ter no mínimo 6 caracteres");
        return;
      }
    }

    if (formData.tipo_acesso === 'cliente' && !formData.cliente_id) {
      setErro("Selecione um cliente");
      return;
    }

    setLoading(true);

    try {
      if (usuario) {
        // Editar usuário existente
        const updateData = {
          nome: formData.nome,
          tipo_acesso: formData.tipo_acesso,
          cliente_id: formData.tipo_acesso === 'cliente' ? formData.cliente_id : null,
          cargo: formData.cargo,
          telefone: formData.telefone,
          observacoes: formData.observacoes,
        };

        // Se forneceu nova senha, chamar function para atualizar
        if (formData.senha) {
          // Atualizar senha via function (que faz hash no backend)
          const senhaResponse = await base44.functions.invoke('alterarSenhaCustom', {
            usuario_id: usuario.id,
            senha_atual: formData.senha, // Temporário - vai precisar ajustar depois
            senha_nova: formData.senha
          });

          if (!senhaResponse.data.success) {
            setErro("Erro ao atualizar senha: " + senhaResponse.data.error);
            setLoading(false);
            return;
          }
        }

        await base44.entities.UsuarioCustom.update(usuario.id, updateData);
        setSucesso("Usuário atualizado com sucesso!");
      } else {
        // Criar novo usuário via function (hash no backend)
        const response = await base44.functions.invoke('criarUsuarioCustom', {
          email: formData.email.toLowerCase().trim(),
          senha: formData.senha, // Enviando em texto plano - function faz hash
          nome: formData.nome,
          tipo_acesso: formData.tipo_acesso,
          cliente_id: formData.tipo_acesso === 'cliente' ? formData.cliente_id : null,
          cargo: formData.cargo,
          telefone: formData.telefone,
        });

        if (!response.data.success) {
          setErro(response.data.error || "Erro ao criar usuário");
          setLoading(false);
          return;
        }

        setSucesso("Usuário criado com sucesso!");
      }

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      setErro("Erro ao salvar usuário: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {usuario ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
        </DialogHeader>

        {erro && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">{erro}</AlertDescription>
          </Alert>
        )}

        {sucesso && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{sucesso}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!usuario}
                required
              />
              {usuario && (
                <p className="text-xs text-gray-500">Email não pode ser alterado</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senha">
                {usuario ? "Nova Senha (opcional)" : "Senha *"}
              </Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  required={!usuario}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmar_senha">
                {usuario ? "Confirmar Nova Senha" : "Confirmar Senha *"}
              </Label>
              <div className="relative">
                <Input
                  id="confirmar_senha"
                  type={mostrarConfirmarSenha ? "text" : "password"}
                  value={formData.confirmar_senha}
                  onChange={(e) => setFormData({ ...formData, confirmar_senha: e.target.value })}
                  required={!usuario || !!formData.senha}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {mostrarConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_acesso">Tipo de Acesso *</Label>
              <Select 
                value={formData.tipo_acesso} 
                onValueChange={(value) => setFormData({ ...formData, tipo_acesso: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">🔴 Administrador</SelectItem>
                  <SelectItem value="colaborador">🔵 Colaborador</SelectItem>
                  <SelectItem value="cliente">🟢 Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipo_acesso === 'cliente' && (
              <div className="space-y-2">
                <Label htmlFor="cliente_id">Cliente Vinculado *</Label>
                <Select 
                  value={formData.cliente_id} 
                  onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.tipo_acesso === 'colaborador' && (
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  placeholder="Ex: Gerente de Projetos"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
            >
              {loading ? "Salvando..." : usuario ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}