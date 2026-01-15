import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, User, Building2, Search } from "lucide-react";
import SearchClienteDialog from "../../shared/SearchClienteDialog";
import SearchLoteamentoDialog from "../../shared/SearchLoteamentoDialog";

const padraoOptions = [
  { value: "economico", label: "Econômico" },
  { value: "medio_baixo", label: "Médio Baixo" },
  { value: "medio", label: "Médio" },
  { value: "medio_alto", label: "Médio Alto" },
  { value: "alto", label: "Alto Padrão" },
  { value: "luxo", label: "Luxo" },
];

export default function ClienteLoteamentoStep({ data, clientes, loteamentos, onChange, onNext, onCancel }) {
  const [showClienteDialog, setShowClienteDialog] = useState(false);
  const [showLoteamentoDialog, setShowLoteamentoDialog] = useState(false);

  const clienteSelecionado = clientes.find(c => c.id === data.cliente_id);
  const loteamentoSelecionado = loteamentos.find(l => l.id === data.loteamento_id);

  const handleNext = () => {
    if (!data.cliente_id) {
      alert("Selecione um cliente");
      return;
    }
    if (!data.loteamento_id) {
      alert("Selecione um loteamento");
      return;
    }
    onNext();
  };

  return (
    <>
      <div className="space-y-4 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Cliente *</Label>
              <div className="flex gap-2">
                <Input
                  value={clienteSelecionado?.nome || ""}
                  placeholder="Selecione um cliente"
                  readOnly
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={() => setShowClienteDialog(true)}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {clienteSelecionado && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm"><strong>CPF/CNPJ:</strong> {clienteSelecionado.cpf_cnpj}</p>
                <p className="text-sm"><strong>Email:</strong> {clienteSelecionado.email}</p>
                <p className="text-sm"><strong>Telefone:</strong> {clienteSelecionado.telefone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Loteamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Loteamento *</Label>
              <div className="flex gap-2">
                <Input
                  value={loteamentoSelecionado?.nome || ""}
                  placeholder="Selecione um loteamento"
                  readOnly
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={() => setShowLoteamentoDialog(true)}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {loteamentoSelecionado && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm"><strong>Localização:</strong> {loteamentoSelecionado.cidade}/{loteamentoSelecionado.estado}</p>
                <p className="text-sm"><strong>Lotes disponíveis:</strong> {loteamentoSelecionado.quantidade_lotes || 0}</p>
              </div>
            )}

            <div>
              <Label>Padrão do Imóvel *</Label>
              <Select
                value={data.padrao_imovel}
                onValueChange={(value) => onChange({ padrao_imovel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o padrão" />
                </SelectTrigger>
                <SelectContent>
                  {padraoOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Orçamento Mínimo</Label>
                <Input
                  type="number"
                  value={data.orcamento_minimo}
                  onChange={(e) => onChange({ orcamento_minimo: parseFloat(e.target.value) || "" })}
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <Label>Orçamento Máximo</Label>
                <Input
                  type="number"
                  value={data.orcamento_maximo}
                  onChange={(e) => onChange({ orcamento_maximo: parseFloat(e.target.value) || "" })}
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleNext}
            disabled={!data.cliente_id || !data.loteamento_id}
            className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
          >
            Próximo
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {showClienteDialog && (
        <SearchClienteDialog
          open={showClienteDialog}
          onClose={() => setShowClienteDialog(false)}
          clientes={clientes}
          onSelect={(cliente) => {
            onChange({ cliente_id: cliente.id });
            setShowClienteDialog(false);
          }}
        />
      )}

      {showLoteamentoDialog && (
        <SearchLoteamentoDialog
          open={showLoteamentoDialog}
          onClose={() => setShowLoteamentoDialog(false)}
          loteamentos={loteamentos}
          onSelect={(loteamento) => {
            onChange({ loteamento_id: loteamento.id, lote_id: "" }); // Limpar lote ao mudar loteamento
            setShowLoteamentoDialog(false);
          }}
        />
      )}
    </>
  );
}