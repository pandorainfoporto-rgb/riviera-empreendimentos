
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, User, Home, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DialogCriarNegociacao({ cliente, unidades, onConfirm, onCancel }) {
  const unidade = unidades.find(u => u.id === cliente.unidade_id);

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <DialogTitle className="text-center text-2xl">Cliente Cadastrado!</DialogTitle>
          <DialogDescription className="text-center">
            Deseja criar uma negociação para este cliente?
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="p-4 bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)] rounded-lg border border-[var(--wine-200)]">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-5 h-5 text-[var(--wine-700)]" />
              <h3 className="font-semibold text-[var(--wine-900)]">Dados do Cliente</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-gray-600">Nome:</span>
                <span className="font-semibold text-gray-900">{cliente.nome}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">CPF/CNPJ:</span>
                <span className="font-semibold text-gray-900">{cliente.cpf_cnpj}</span>
              </p>
              {cliente.email && (
                <p className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold text-gray-900">{cliente.email}</span>
                </p>
              )}
            </div>
          </div>

          {unidade && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <Home className="w-5 h-5 text-blue-700" />
                <h3 className="font-semibold text-blue-900">Unidade</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between">
                  <span className="text-gray-600">Código:</span>
                  <span className="font-semibold text-gray-900">{unidade.codigo}</span>
                </p>
                {unidade.valor_venda > 0 && (
                  <p className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-semibold text-gray-900">
                      R$ {unidade.valor_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {cliente.tem_acesso_app && cliente.senha_temporaria && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-700" />
                <h3 className="font-semibold text-green-900">Acesso ao App Criado</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-green-800">
                  ✅ Email de boas-vindas enviado para <a href={`mailto:${cliente.email}`} className="font-bold text-green-800 underline hover:text-green-900">{cliente.email}</a>
                </p>
                <div className="p-2 bg-white rounded border border-green-300 mt-2">
                  <p className="text-xs text-gray-600">Senha temporária (para referência):</p>
                  <code className="font-mono font-bold text-green-700">{cliente.senha_temporaria}</code>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  ℹ️ O cliente receberá as credenciais por email e deverá alterá-las no primeiro acesso.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <FileText className="w-5 h-5 text-yellow-700" />
            <p className="text-sm text-yellow-800">
              Crie a negociação para faturar e gerar parcelas
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Agora Não
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
          >
            Criar Negociação
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
