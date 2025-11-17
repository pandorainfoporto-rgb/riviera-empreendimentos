import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function DialogAlterarSenha({ onClose }) {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const alterarSenhaMutation = useMutation({
    mutationFn: async (data) => {
      // Validate passwords match
      if (data.novaSenha !== data.confirmarSenha) {
        throw new Error("As senhas não coincidem");
      }

      if (data.novaSenha.length < 6) {
        throw new Error("A nova senha deve ter pelo menos 6 caracteres");
      }

      // Call password change function
      return await base44.functions.invoke('alterarSenhaCustom', {
        senhaAtual: data.senhaAtual,
        novaSenha: data.novaSenha,
      });
    },
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao alterar senha");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast.error("Preencha todos os campos");
      return;
    }

    alterarSenhaMutation.mutate({
      senhaAtual,
      novaSenha,
      confirmarSenha,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alterar Senha
          </DialogTitle>
          <DialogDescription>
            Digite sua senha atual e escolha uma nova senha
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senhaAtual">Senha Atual</Label>
            <div className="relative">
              <Input
                id="senhaAtual"
                type={showSenhaAtual ? "text" : "password"}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showSenhaAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="novaSenha">Nova Senha</Label>
            <div className="relative">
              <Input
                id="novaSenha"
                type={showNovaSenha ? "text" : "password"}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite a nova senha (mín. 6 caracteres)"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNovaSenha(!showNovaSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmarSenha"
                type={showConfirmarSenha ? "text" : "password"}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme a nova senha"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {novaSenha && confirmarSenha && novaSenha !== confirmarSenha && (
            <p className="text-sm text-red-600">As senhas não coincidem</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={alterarSenhaMutation.isPending}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              {alterarSenhaMutation.isPending ? "Alterando..." : "Alterar Senha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}