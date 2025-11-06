import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRightLeft, User, Building2, AlertCircle, PiggyBank } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

export default function TransferirCotaDialog({ consorcio, clientes, unidades, onClose, onConfirm, isProcessing }) {
  const [tipoTransferencia, setTipoTransferencia] = useState(
    consorcio.eh_investimento_caixa ? "para_cliente" : "para_investimento"
  );
  const [formData, setFormData] = useState({
    cliente_id: "",
    unidade_id: "",
    observacoes: "",
  });

  const clienteAtual = clientes.find(c => c.id === consorcio.cliente_id);
  const unidadeAtual = unidades.find(u => u.id === consorcio.unidade_id);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (tipoTransferencia === "para_investimento") {
      // Transferir para investimento (caixa)
      onConfirm({
        eh_investimento_caixa: true,
        cliente_id: "",
        unidade_id: "",
        observacoes: formData.observacoes,
      });
    } else {
      // Transferir para cliente
      if (!formData.cliente_id || !formData.unidade_id) {
        alert("Selecione o cliente e a unidade de destino");
        return;
      }
      onConfirm({
        eh_investimento_caixa: false,
        cliente_id: formData.cliente_id,
        unidade_id: formData.unidade_id,
        observacoes: formData.observacoes,
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--wine-700)] flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Transferir Cota de Consórcio
          </DialogTitle>
          <DialogDescription>
            Grupo {consorcio.grupo} - Cota {consorcio.cota}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Informações Atuais */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-3">Situação Atual</h4>
              {consorcio.eh_investimento_caixa ? (
                <div className="flex items-center gap-2 text-blue-700">
                  <PiggyBank className="w-5 h-5" />
                  <span className="font-semibold">Cota de Investimento (Caixa)</span>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-semibold text-gray-900">{clienteAtual?.nome || "Não definido"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-600">Unidade:</span>
                    <span className="font-semibold text-gray-900">{unidadeAtual?.codigo || "Não definida"}</span>
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Valor da Carta:</span>
                  <p className="font-semibold text-[var(--wine-700)]">
                    R$ {consorcio.valor_carta?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Parcelas:</span>
                  <p className="font-semibold">
                    {consorcio.parcelas_pagas} / {consorcio.parcelas_total}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className="font-semibold">
                    {consorcio.contemplado ? "✓ Contemplado" : "Ativo"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tipo de Transferência */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Tipo de Transferência</Label>
              
              <div className="space-y-2">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    tipoTransferencia === "para_cliente" 
                      ? "border-[var(--wine-600)] bg-[var(--wine-50)]" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setTipoTransferencia("para_cliente")}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        tipoTransferencia === "para_cliente" 
                          ? "border-[var(--wine-600)] bg-[var(--wine-600)]" 
                          : "border-gray-300"
                      }`}>
                        {tipoTransferencia === "para_cliente" && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-5 h-5 text-[var(--wine-600)]" />
                        <p className="font-semibold text-gray-900">Transferir para Cliente</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {consorcio.eh_investimento_caixa 
                          ? "Vincular esta cota de investimento a um cliente e unidade específica"
                          : "Transferir a titularidade desta cota para outro cliente"}
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    tipoTransferencia === "para_investimento" 
                      ? "border-blue-600 bg-blue-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setTipoTransferencia("para_investimento")}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        tipoTransferencia === "para_investimento" 
                          ? "border-blue-600 bg-blue-600" 
                          : "border-gray-300"
                      }`}>
                        {tipoTransferencia === "para_investimento" && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <PiggyBank className="w-5 h-5 text-blue-600" />
                        <p className="font-semibold text-gray-900">Transferir para Investimento (Caixa)</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {consorcio.eh_investimento_caixa 
                          ? "Manter como cota de investimento (sem cliente vinculado)"
                          : "Desvincular do cliente e marcar como cota de investimento da empresa"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulário de Destino */}
            {tipoTransferencia === "para_cliente" && (
              <div className="space-y-4 p-4 bg-[var(--wine-50)] rounded-lg border border-[var(--wine-200)]">
                <h4 className="font-semibold text-[var(--wine-900)]">Dados do Destino</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="cliente_id" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Cliente Destino *
                  </Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes
                        .filter(c => !consorcio.eh_investimento_caixa || c.id !== consorcio.cliente_id)
                        .map(cliente => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nome} - {cliente.cpf_cnpj}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidade_id" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Unidade Destino *
                  </Label>
                  <Select
                    value={formData.unidade_id}
                    onValueChange={(value) => setFormData({ ...formData, unidade_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades
                        .filter(u => !consorcio.eh_investimento_caixa || u.id !== consorcio.unidade_id)
                        .map(uni => (
                          <SelectItem key={uni.id} value={uni.id}>
                            {uni.codigo}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {tipoTransferencia === "para_investimento" && (
              <Alert className="border-blue-500 bg-blue-50">
                <PiggyBank className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Esta cota será marcada como investimento da empresa, sem vinculação a cliente ou unidade específica.
                  Você poderá transferí-la para um cliente posteriormente.
                </AlertDescription>
              </Alert>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Motivo da transferência, valores acordados, etc..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Alerta de Confirmação */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Esta operação irá alterar a titularidade da cota de consórcio. 
                Certifique-se de que todos os detalhes estão corretos antes de confirmar.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isProcessing || (tipoTransferencia === "para_cliente" && (!formData.cliente_id || !formData.unidade_id))}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Confirmar Transferência
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}