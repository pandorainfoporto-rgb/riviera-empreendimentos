import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Home, DollarSign, Ruler, User, Phone, Mail, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import LayoutImobiliaria from "../components/LayoutImobiliaria";

export default function PortalImobiliariaLotes() {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [leadForm, setLeadForm] = useState({
    nome_cliente: '',
    cpf: '',
    email: '',
    telefone: '',
    telefone_secundario: '',
    profissao: '',
    renda_mensal: 0,
    valor_entrada: 0,
    forma_pagamento_pretendida: 'financiamento',
    observacoes_imobiliaria: '',
    interesse_nivel: 'medio',
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: lotes = [] } = useQuery({
    queryKey: ['lotes'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ['documentos_lotes'],
    queryFn: () => base44.entities.DocumentoObra.filter({ tipo: 'foto' }),
  });

  const createLeadMutation = useMutation({
    mutationFn: (data) => base44.entities.LeadPreVenda.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meus_leads'] });
      toast.success('Lead cadastrado com sucesso!');
      setShowLeadForm(false);
      setLeadForm({
        nome_cliente: '',
        cpf: '',
        email: '',
        telefone: '',
        telefone_secundario: '',
        profissao: '',
        renda_mensal: 0,
        valor_entrada: 0,
        forma_pagamento_pretendida: 'financiamento',
        observacoes_imobiliaria: '',
        interesse_nivel: 'medio',
      });
    },
    onError: () => {
      toast.error('Erro ao cadastrar lead');
    },
  });

  const handleSubmitLead = (e) => {
    e.preventDefault();
    createLeadMutation.mutate({
      ...leadForm,
      imobiliaria_id: user.imobiliaria_id,
      unidade_id: selectedLote?.id,
      status: 'novo',
    });
  };

  const lotesFiltrados = lotes.filter(lote => {
    const matchBusca = !busca || 
      lote.codigo?.toLowerCase().includes(busca.toLowerCase()) ||
      loteamentos.find(l => l.id === lote.loteamento_id)?.nome?.toLowerCase().includes(busca.toLowerCase());
    
    const matchStatus = filtroStatus === 'todos' || lote.status === filtroStatus;
    
    return matchBusca && matchStatus;
  });

  return (
    <LayoutImobiliaria>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--wine-700)]">Lotes Disponíveis</h1>
            <p className="text-gray-600 mt-1">Explore os empreendimentos e cadastre leads</p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por código ou loteamento..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="reservada">Reservada</SelectItem>
                    <SelectItem value="vendida">Vendida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Lotes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lotesFiltrados.map((lote) => {
            const loteamento = loteamentos.find(l => l.id === lote.loteamento_id);
            const fotosLote = documentos.filter(d => d.unidade_id === lote.id);
            const fotoDestaque = fotosLote[0]?.arquivo_url;

            const statusColors = {
              disponivel: 'bg-green-100 text-green-800 border-green-300',
              reservada: 'bg-yellow-100 text-yellow-800 border-yellow-300',
              vendida: 'bg-gray-100 text-gray-800 border-gray-300',
              em_construcao: 'bg-blue-100 text-blue-800 border-blue-300',
            };

            return (
              <Card key={lote.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                {fotoDestaque && (
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    <img 
                      src={fotoDestaque} 
                      alt={lote.codigo}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{lote.codigo}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {loteamento?.nome || 'N/A'}
                      </p>
                    </div>
                    <Badge className={statusColors[lote.status]}>
                      {lote.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    {lote.area_total && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Ruler className="w-4 h-4" />
                        <span>{lote.area_total} m²</span>
                      </div>
                    )}
                    {lote.valor_venda && (
                      <div className="flex items-center gap-2 text-gray-900 font-semibold">
                        <DollarSign className="w-4 h-4" />
                        <span>R$ {lote.valor_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {lote.quartos && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Home className="w-4 h-4" />
                        <span>{lote.quartos} quartos • {lote.banheiros} banheiros</span>
                      </div>
                    )}
                  </div>

                  {lote.status === 'disponivel' && (
                    <Button
                      onClick={() => {
                        setSelectedLote(lote);
                        setShowLeadForm(true);
                      }}
                      className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Cadastrar Lead
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {lotesFiltrados.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum lote encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Cadastrar Lead */}
      <Dialog open={showLeadForm} onOpenChange={setShowLeadForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Lead - {selectedLote?.codigo}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitLead} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={leadForm.nome_cliente}
                  onChange={(e) => setLeadForm({...leadForm, nome_cliente: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label>CPF *</Label>
                <Input
                  value={leadForm.cpf}
                  onChange={(e) => setLeadForm({...leadForm, cpf: e.target.value})}
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label>Telefone *</Label>
                <Input
                  value={leadForm.telefone}
                  onChange={(e) => setLeadForm({...leadForm, telefone: e.target.value})}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <div>
                <Label>Telefone Secundário</Label>
                <Input
                  value={leadForm.telefone_secundario}
                  onChange={(e) => setLeadForm({...leadForm, telefone_secundario: e.target.value})}
                />
              </div>

              <div>
                <Label>Profissão</Label>
                <Input
                  value={leadForm.profissao}
                  onChange={(e) => setLeadForm({...leadForm, profissao: e.target.value})}
                />
              </div>

              <div>
                <Label>Renda Mensal (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={leadForm.renda_mensal}
                  onChange={(e) => setLeadForm({...leadForm, renda_mensal: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div>
                <Label>Valor de Entrada (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={leadForm.valor_entrada}
                  onChange={(e) => setLeadForm({...leadForm, valor_entrada: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div>
                <Label>Forma de Pagamento</Label>
                <Select
                  value={leadForm.forma_pagamento_pretendida}
                  onValueChange={(val) => setLeadForm({...leadForm, forma_pagamento_pretendida: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_vista">À Vista</SelectItem>
                    <SelectItem value="parcelado">Parcelado</SelectItem>
                    <SelectItem value="financiamento">Financiamento</SelectItem>
                    <SelectItem value="consorcio">Consórcio</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Nível de Interesse</Label>
                <Select
                  value={leadForm.interesse_nivel}
                  onValueChange={(val) => setLeadForm({...leadForm, interesse_nivel: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixo">Baixo</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>Observações</Label>
                <Textarea
                  value={leadForm.observacoes_imobiliaria}
                  onChange={(e) => setLeadForm({...leadForm, observacoes_imobiliaria: e.target.value})}
                  rows={3}
                  placeholder="Informações adicionais sobre o cliente..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowLeadForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]">
                Cadastrar Lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </LayoutImobiliaria>
  );
}