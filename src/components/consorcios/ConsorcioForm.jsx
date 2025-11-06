
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Eye, PiggyBank } from "lucide-react";
import { addMonths, format, setDate } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

import ConfirmarFaturasDialog from "./ConfirmarFaturasDialog";
import TabelaEncargosConsorcio from "./TabelaEncargosConsorcio";

export default function ConsorcioForm({ item, clientes, unidades, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    eh_investimento_caixa: false,
    administradora_id: "",
    cliente_id: "",
    unidade_id: "",
    grupo: "",
    cota: "",
    quantidade_cotas_grupo: 0,
    dia_assembleia: 1,
    valor_carta: 0,
    parcelas_pagas: 0,
    parcelas_total: 0,
    valor_parcela: 0,
    fundo_reserva_percentual: 0,
    fundo_comum_percentual: 0,
    taxa_administracao_percentual: 0,
    data_inicio: "",
  });

  const [showPreviewFaturas, setShowPreviewFaturas] = useState(false);
  const [faturas, setFaturas] = useState([]);

  // Buscar administradoras
  const { data: administradoras = [] } = useQuery({
    queryKey: ['administradoras'],
    queryFn: () => base44.entities.AdministradoraConsorcio.list(),
  });

  const gerarFaturas = () => {
    if (!formData.data_inicio || !formData.parcelas_total || !formData.valor_parcela) {
      alert("Preencha a data de início, total de parcelas e valor da parcela");
      return;
    }

    const faturasGeradas = [];
    const dataInicio = new Date(formData.data_inicio);
    const diaVencimento = formData.dia_assembleia || 1;

    for (let i = 0; i < formData.parcelas_total; i++) {
      const dataVencimento = setDate(addMonths(dataInicio, i), diaVencimento);
      
      const valorFundoReserva = (formData.valor_parcela * formData.fundo_reserva_percentual) / 100;
      const valorFundoComum = (formData.valor_parcela * formData.fundo_comum_percentual) / 100;
      const valorTaxaAdmin = (formData.valor_parcela * formData.taxa_administracao_percentual) / 100;

      faturasGeradas.push({
        numero_parcela: i + 1,
        valor_parcela: formData.valor_parcela,
        valor_fundo_reserva: valorFundoReserva,
        valor_fundo_comum: valorFundoComum,
        valor_taxa_administracao: valorTaxaAdmin,
        valor_total: formData.valor_parcela,
        data_vencimento: format(dataVencimento, 'yyyy-MM-dd'),
        status: 'pendente',
      });
    }

    setFaturas(faturasGeradas);
    setShowPreviewFaturas(true);
  };

  const handleConfirmarFaturas = () => {
    onSubmit({
      ...formData,
      faturas: faturas,
      faturas_geradas: true,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (item) {
      onSubmit(formData);
    } else {
      gerarFaturas();
    }
  };

  const valorFundoReserva = (formData.valor_parcela * formData.fundo_reserva_percentual) / 100;
  const valorFundoComum = (formData.valor_parcela * formData.fundo_comum_percentual) / 100;
  const valorTaxaAdmin = (formData.valor_parcela * formData.taxa_administracao_percentual) / 100;

  return (
    <>
      <Card className="shadow-xl border-t-4 border-[var(--grape-600)]">
        <CardHeader>
          <CardTitle className="text-[var(--wine-700)]">
            {item ? "Editar Consórcio" : "Nova Cota de Consórcio"}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="eh_investimento_caixa"
                checked={formData.eh_investimento_caixa}
                onCheckedChange={(checked) => setFormData({ 
                  ...formData, 
                  eh_investimento_caixa: checked,
                  cliente_id: checked ? "" : formData.cliente_id,
                  unidade_id: checked ? "" : formData.unidade_id,
                })}
              />
              <Label htmlFor="eh_investimento_caixa" className="flex items-center gap-2 cursor-pointer">
                <PiggyBank className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">Cota de Investimento (Caixa)</p>
                  <p className="text-xs text-blue-700">Cota sem vinculação a cliente ou unidade específica</p>
                </div>
              </Label>
            </div>

            {formData.eh_investimento_caixa && (
              <Alert className="border-blue-500 bg-blue-50">
                <PiggyBank className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Esta cota será cadastrada como investimento em carteira, sem vinculação a cliente ou unidade.
                </AlertDescription>
              </Alert>
            )}

            {/* CAMPO ADMINISTRADORA */}
            <div className="space-y-2">
              <Label htmlFor="administradora_id">Administradora do Consórcio *</Label>
              <Select
                value={formData.administradora_id}
                onValueChange={(value) => setFormData({ ...formData, administradora_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a administradora" />
                </SelectTrigger>
                <SelectContent>
                  {administradoras.filter(a => a.ativa).map(adm => (
                    <SelectItem key={adm.id} value={adm.id}>
                      {adm.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!formData.eh_investimento_caixa && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente_id">Cliente *</Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                    required={!formData.eh_investimento_caixa}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(cliente => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unidade_id">Unidade *</Label>
                  <Select
                    value={formData.unidade_id}
                    onValueChange={(value) => setFormData({ ...formData, unidade_id: value })}
                    required={!formData.eh_investimento_caixa}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map(uni => (
                        <SelectItem key={uni.id} value={uni.id}>
                          {uni.codigo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grupo">Grupo *</Label>
                <Input
                  id="grupo"
                  value={formData.grupo}
                  onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cota">Cota *</Label>
                <Input
                  id="cota"
                  value={formData.cota}
                  onChange={(e) => setFormData({ ...formData, cota: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidade_cotas_grupo">Cotas no Grupo</Label>
                <Input
                  id="quantidade_cotas_grupo"
                  type="number"
                  value={formData.quantidade_cotas_grupo}
                  onChange={(e) => setFormData({ ...formData, quantidade_cotas_grupo: parseInt(e.target.value) })}
                  placeholder="Ex: 200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dia_assembleia">Dia Assembleia</Label>
                <Input
                  id="dia_assembleia"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dia_assembleia}
                  onChange={(e) => setFormData({ ...formData, dia_assembleia: parseInt(e.target.value) })}
                  placeholder="Ex: 15"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor_carta">Valor da Carta *</Label>
                <Input
                  id="valor_carta"
                  type="number"
                  step="0.01"
                  value={formData.valor_carta}
                  onChange={(e) => setFormData({ ...formData, valor_carta: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parcelas_total">Total de Parcelas *</Label>
                <Input
                  id="parcelas_total"
                  type="number"
                  value={formData.parcelas_total}
                  onChange={(e) => setFormData({ ...formData, parcelas_total: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_parcela">Valor da Parcela *</Label>
                <Input
                  id="valor_parcela"
                  type="number"
                  step="0.01"
                  value={formData.valor_parcela}
                  onChange={(e) => setFormData({ ...formData, valor_parcela: parseFloat(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fundo_reserva_percentual">Fundo de Reserva (%)</Label>
                <Input
                  id="fundo_reserva_percentual"
                  type="number"
                  step="0.01"
                  value={formData.fundo_reserva_percentual}
                  onChange={(e) => setFormData({ ...formData, fundo_reserva_percentual: parseFloat(e.target.value) })}
                  placeholder="Ex: 2.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fundo_comum_percentual">Fundo Comum (%)</Label>
                <Input
                  id="fundo_comum_percentual"
                  type="number"
                  step="0.01"
                  value={formData.fundo_comum_percentual}
                  onChange={(e) => setFormData({ ...formData, fundo_comum_percentual: parseFloat(e.target.value) })}
                  placeholder="Ex: 1.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxa_administracao_percentual">Taxa de Administração (%)</Label>
                <Input
                  id="taxa_administracao_percentual"
                  type="number"
                  step="0.01"
                  value={formData.taxa_administracao_percentual}
                  onChange={(e) => setFormData({ ...formData, taxa_administracao_percentual: parseFloat(e.target.value) })}
                  placeholder="Ex: 15"
                />
              </div>
            </div>

            {/* Tabela de Resumo dos Encargos */}
            {formData.valor_parcela > 0 && (
              <TabelaEncargosConsorcio
                valorParcela={formData.valor_parcela}
                fundoReserva={valorFundoReserva}
                fundoComum={valorFundoComum}
                taxaAdministracao={valorTaxaAdmin}
                parcelasTotal={formData.parcelas_total}
              />
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parcelas_pagas">Parcelas Pagas</Label>
                <Input
                  id="parcelas_pagas"
                  type="number"
                  value={formData.parcelas_pagas}
                  onChange={(e) => setFormData({ ...formData, parcelas_pagas: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data de Início *</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isProcessing}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
            >
              {item ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Atualizar
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar Faturas
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {showPreviewFaturas && (
        <ConfirmarFaturasDialog
          formData={formData}
          faturas={faturas}
          cliente={formData.eh_investimento_caixa ? null : clientes.find(c => c.id === formData.cliente_id)}
          unidade={formData.eh_investimento_caixa ? null : unidades.find(u => u.id === formData.unidade_id)}
          onConfirm={handleConfirmarFaturas}
          onCancel={() => setShowPreviewFaturas(false)}
          isProcessing={isProcessing}
        />
      )}
    </>
  );
}
