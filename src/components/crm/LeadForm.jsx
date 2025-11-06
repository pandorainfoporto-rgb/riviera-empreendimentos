import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

export default function LeadForm({ lead, onSave, onCancel, imobiliarias, corretores }) {
  const [form, setForm] = useState({
    nome_cliente: "",
    email: "",
    telefone: "",
    telefone_secundario: "",
    cpf: "",
    profissao: "",
    renda_mensal: 0,
    valor_entrada: 0,
    forma_pagamento_pretendida: "financiamento",
    fonte_lead: "site",
    campanha: "",
    interesse_nivel: "medio",
    temperatura_lead: "morno",
    estagio_funil: "prospeccao",
    status: "novo",
    imobiliaria_id: "",
    corretor_id: "",
    observacoes_imobiliaria: "",
    tags: [],
    ...lead
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white z-10 border-b">
          <div className="flex justify-between items-center">
            <CardTitle>{lead ? 'Editar Lead' : 'Novo Lead'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nome Completo *</Label>
                <Input
                  value={form.nome_cliente}
                  onChange={(e) => setForm({...form, nome_cliente: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>CPF</Label>
                <Input
                  value={form.cpf}
                  onChange={(e) => setForm({...form, cpf: e.target.value})}
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Telefone *</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({...form, telefone: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Fonte do Lead</Label>
                <Select value={form.fonte_lead} onValueChange={(val) => setForm({...form, fonte_lead: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="telefone">Telefone</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="visita_stand">Visita Stand</SelectItem>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                    <SelectItem value="redes_sociais">Redes Sociais</SelectItem>
                    <SelectItem value="google_ads">Google Ads</SelectItem>
                    <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Temperatura</Label>
                <Select value={form.temperatura_lead} onValueChange={(val) => setForm({...form, temperatura_lead: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frio">❄️ Frio</SelectItem>
                    <SelectItem value="morno">☁️ Morno</SelectItem>
                    <SelectItem value="quente">🔥 Quente</SelectItem>
                    <SelectItem value="muito_quente">🔥🔥 Muito Quente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estágio no Funil</Label>
                <Select value={form.estagio_funil} onValueChange={(val) => setForm({...form, estagio_funil: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospeccao">Prospecção</SelectItem>
                    <SelectItem value="qualificacao">Qualificação</SelectItem>
                    <SelectItem value="proposta">Proposta</SelectItem>
                    <SelectItem value="negociacao">Negociação</SelectItem>
                    <SelectItem value="fechamento">Fechamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(val) => setForm({...form, status: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="contatado">Contatado</SelectItem>
                    <SelectItem value="qualificado">Qualificado</SelectItem>
                    <SelectItem value="em_negociacao">Em Negociação</SelectItem>
                    <SelectItem value="proposta_enviada">Proposta Enviada</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="convertido">Convertido</SelectItem>
                    <SelectItem value="perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Imobiliária</Label>
                <Select value={form.imobiliaria_id} onValueChange={(val) => setForm({...form, imobiliaria_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {imobiliarias.map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Corretor</Label>
                <Select value={form.corretor_id} onValueChange={(val) => setForm({...form, corretor_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {corretores.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Renda Mensal</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.renda_mensal}
                  onChange={(e) => setForm({...form, renda_mensal: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Valor Entrada</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor_entrada}
                  onChange={(e) => setForm({...form, valor_entrada: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes_imobiliaria}
                onChange={(e) => setForm({...form, observacoes_imobiliaria: e.target.value})}
                rows={3}
              />
            </div>
          </CardContent>
          <div className="p-6 border-t flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[var(--wine-600)]">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}