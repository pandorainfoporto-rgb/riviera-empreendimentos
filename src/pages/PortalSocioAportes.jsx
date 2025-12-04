import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, Calendar, AlertCircle, CheckCircle, Clock, 
  CreditCard, Building, Wallet, Copy, ExternalLink, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import LayoutSocio from "../components/LayoutSocio";

export default function PortalSocioAportes() {
  const [statusFilter, setStatusFilter] = useState("todos");
  const [showPagarDialog, setShowPagarDialog] = useState(false);
  const [selectedAporte, setSelectedAporte] = useState(null);
  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [processando, setProcessando] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: socio } = useQuery({
    queryKey: ['meu_socio', user?.socio_id],
    queryFn: async () => {
      if (!user?.socio_id) return null;
      return await base44.entities.Socio.get(user.socio_id);
    },
    enabled: !!user?.socio_id,
  });

  const { data: aportes = [], isLoading } = useQuery({
    queryKey: ['meus_aportes', user?.socio_id],
    queryFn: async () => {
      if (!user?.socio_id) return [];
      return await base44.entities.AporteSocio.filter({ socio_id: user.socio_id }, '-data_vencimento');
    },
    enabled: !!user?.socio_id,
  });

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
  });

  const { data: contasBancarias = [] } = useQuery({
    queryKey: ['contasBancarias'],
    queryFn: () => base44.entities.ContaBancaria.list(),
  });

  const hoje = new Date().toISOString().split('T')[0];

  const filteredAportes = aportes.filter(a => {
    if (statusFilter === "todos") return true;
    if (statusFilter === "pendente") return a.status === 'pendente';
    if (statusFilter === "atrasado") return a.status === 'pendente' && a.data_vencimento < hoje;
    if (statusFilter === "pago") return a.status === 'pago';
    return true;
  });

  const totalPendente = aportes
    .filter(a => a.status === 'pendente')
    .reduce((sum, a) => sum + (a.valor || 0), 0);

  const totalPago = aportes
    .filter(a => a.status === 'pago')
    .reduce((sum, a) => sum + (a.valor || 0), 0);

  const handlePagar = (aporte) => {
    setSelectedAporte(aporte);
    setShowPagarDialog(true);
  };

  const handleConfirmarPagamento = async () => {
    if (!selectedAporte) return;

    setProcessando(true);

    try {
      // Registrar log de pagamento
      await base44.entities.LogAcessoSocio.create({
        socio_id: user.socio_id,
        user_id: user.id,
        nome_socio: socio?.nome,
        email: user.email,
        acao: 'pagou_aporte',
        descricao: `Iniciou pagamento do aporte de R$ ${selectedAporte.valor} via ${formaPagamento}`,
        data_hora: new Date().toISOString(),
        dados_adicionais: { aporte_id: selectedAporte.id, forma_pagamento: formaPagamento }
      });

      // Aqui poderia integrar com gateway de pagamento
      // Por enquanto, apenas simula o processo
      
      if (formaPagamento === 'pix') {
        toast.success("PIX gerado! Use o código abaixo para pagar.");
      } else if (formaPagamento === 'boleto') {
        toast.success("Boleto gerado! Clique para visualizar.");
      } else {
        toast.success("Redirecionando para pagamento...");
      }

      setShowPagarDialog(false);
      setSelectedAporte(null);
    } catch (error) {
      toast.error("Erro ao processar pagamento: " + error.message);
    } finally {
      setProcessando(false);
    }
  };

  const getStatusConfig = (aporte) => {
    if (aporte.status === 'pago') {
      return { label: 'Pago', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    }
    if (aporte.data_vencimento < hoje) {
      return { label: 'Atrasado', color: 'bg-red-100 text-red-800', icon: AlertCircle };
    }
    return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
  };

  return (
    <LayoutSocio>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Meus Aportes</h1>
          <p className="text-gray-600 mt-1">Gerencie seus aportes e pagamentos</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">A Pagar</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pago</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Aportes</p>
                  <p className="text-2xl font-bold text-blue-600">{aportes.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pendente">Pendentes</TabsTrigger>
            <TabsTrigger value="atrasado">Atrasados</TabsTrigger>
            <TabsTrigger value="pago">Pagos</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Lista de Aportes */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            </div>
          ) : filteredAportes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum aporte encontrado
            </div>
          ) : (
            filteredAportes.map(aporte => {
              const statusConfig = getStatusConfig(aporte);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={aporte.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${statusConfig.color.replace('text-', 'bg-').replace('800', '100')}`}>
                          <StatusIcon className={`w-6 h-6 ${statusConfig.color.split(' ')[1]}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {aporte.descricao || 'Aporte Mensal'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Vencimento: {format(new Date(aporte.data_vencimento), 'dd/MM/yyyy')}
                          </p>
                          {aporte.data_pagamento && (
                            <p className="text-sm text-green-600">
                              Pago em: {format(new Date(aporte.data_pagamento), 'dd/MM/yyyy')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[var(--wine-700)]">
                            R$ {(aporte.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <Badge className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                        </div>

                        {aporte.status === 'pendente' && (
                          <Button 
                            onClick={() => handlePagar(aporte)}
                            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Pagar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Dialog de Pagamento */}
        <Dialog open={showPagarDialog} onOpenChange={setShowPagarDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[var(--wine-700)]">Realizar Pagamento</DialogTitle>
            </DialogHeader>

            {selectedAporte && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Valor do Aporte</p>
                  <p className="text-2xl font-bold text-[var(--wine-700)]">
                    R$ {(selectedAporte.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Vencimento: {format(new Date(selectedAporte.data_vencimento), 'dd/MM/yyyy')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          PIX
                        </div>
                      </SelectItem>
                      <SelectItem value="boleto">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          Boleto Bancário
                        </div>
                      </SelectItem>
                      <SelectItem value="cartao">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Cartão de Crédito
                        </div>
                      </SelectItem>
                      <SelectItem value="transferencia">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          Transferência Bancária
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formaPagamento === 'pix' && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-blue-900">Chave PIX</p>
                    <div className="flex items-center gap-2">
                      <Input 
                        value="00.000.000/0001-00" 
                        readOnly 
                        className="bg-white"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText('00.000.000/0001-00');
                          toast.success('Chave copiada!');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {formaPagamento === 'transferencia' && contasBancarias.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-medium text-gray-900">Dados Bancários</p>
                    <p className="text-sm text-gray-600">Banco: {contasBancarias[0]?.banco}</p>
                    <p className="text-sm text-gray-600">Agência: {contasBancarias[0]?.agencia}</p>
                    <p className="text-sm text-gray-600">Conta: {contasBancarias[0]?.numero_conta}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPagarDialog(false)} disabled={processando}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmarPagamento}
                disabled={processando}
                className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
              >
                {processando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Confirmar Pagamento
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutSocio>
  );
}