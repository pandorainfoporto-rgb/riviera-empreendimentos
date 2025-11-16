import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AprovarContratoDialog({ open, onClose, negociacao, cliente, unidade, onAprovar }) {
  const [dataAssinatura, setDataAssinatura] = useState(new Date());
  const [dataEntrega, setDataEntrega] = useState(addYears(new Date(), 2));
  const [dataVencimentoEntrada, setDataVencimentoEntrada] = useState(
    negociacao.data_vencimento_entrada ? new Date(negociacao.data_vencimento_entrada) : new Date()
  );
  const [aprovando, setAprovando] = useState(false);

  useEffect(() => {
    setDataEntrega(addYears(dataAssinatura, 2));
  }, [dataAssinatura]);

  const handleAprovar = async () => {
    setAprovando(true);
    try {
      await onAprovar({
        data_assinatura: format(dataAssinatura, 'yyyy-MM-dd'),
        data_prevista_entrega: format(dataEntrega, 'yyyy-MM-dd'),
        data_vencimento_entrada: format(dataVencimentoEntrada, 'yyyy-MM-dd'),
      });
    } finally {
      setAprovando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            Aprovar Contrato de Venda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Dados da Negociação</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Cliente</p>
                <p className="font-semibold text-gray-900">{cliente?.nome}</p>
              </div>
              <div>
                <p className="text-gray-600">Unidade</p>
                <p className="font-semibold text-gray-900">{unidade?.codigo}</p>
              </div>
              <div>
                <p className="text-gray-600">Valor Total</p>
                <p className="font-bold text-green-700">
                  R$ {(negociacao.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Entrada</p>
                <p className="font-semibold text-gray-900">
                  R$ {(negociacao.valor_entrada || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Data de Assinatura do Contrato *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataAssinatura, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataAssinatura}
                    onSelect={(date) => date && setDataAssinatura(date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Data de Vencimento da Entrada *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataVencimentoEntrada, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataVencimentoEntrada}
                    onSelect={(date) => date && setDataVencimentoEntrada(date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Data Prevista de Entrega *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataEntrega, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataEntrega}
                    onSelect={(date) => date && setDataEntrega(date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500 mt-1">
                Padrão: 2 anos após assinatura ({format(addYears(dataAssinatura, 2), "dd/MM/yyyy")})
              </p>
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Ações que serão realizadas:
            </h4>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Atualizar status da negociação para <Badge className="bg-blue-500 text-white">Contrato Assinado</Badge></span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Atualizar status da unidade para <Badge className="bg-orange-100 text-orange-800">Vendida</Badge></span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Registrar data de assinatura e entrega prevista</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Atualizar data de vencimento da entrada</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={aprovando}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAprovar} 
            disabled={aprovando}
            className="bg-gradient-to-r from-green-600 to-emerald-600"
          >
            {aprovando ? "Aprovando..." : "Aprovar Contrato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}