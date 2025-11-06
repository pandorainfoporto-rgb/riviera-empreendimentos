import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, TrendingUp, DollarSign } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LanceForm({ item, consorcios, clientes, empreendimentos, onSubmit, onCancel, isProcessing }) {
  const [grupoSelecionado, setGrupoSelecionado] = useState(item ? item.grupo : "");
  const [formData, setFormData] = useState(item || {
    consorcio_id: "",
    grupo: "",
    cota: "",
    tipo_lance: "percentual",
    percentual_lance: 0,
    valor_lance: 0,
    data_lance: new Date().toISOString().split('T')[0],
    data_assembleia_referencia: "",
    status: "ativo",
    observacoes: "",
  });

  const [consorcioSelecionado, setConsorcioSelecionado] = useState(null);

  // Quando selecionar um consórcio, preencher grupo e cota
  useEffect(() => {
    if (formData.consorcio_id) {
      const consorcio = consorcios.find(c => c.id === formData.consorcio_id);
      if (consorcio) {
        setConsorcioSelecionado(consorcio);
        setFormData({
          ...formData,
          grupo: consorcio.grupo,
          cota: consorcio.cota,
        });
      }
    }
  }, [formData.consorcio_id]);

  // Calcular valor do lance quando for percentual
  useEffect(() => {
    if (formData.tipo_lance === 'percentual' && consorcioSelecionado && formData.percentual_lance > 0) {
      const valorCalculado = (consorcioSelecionado.valor_carta * formData.percentual_lance) / 100;
      setFormData(prev => ({
        ...prev,
        valor_lance: valorCalculado,
      }));
    }
  }, [formData.tipo_lance, formData.percentual_lance, consorcioSelecionado]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Filtrar consórcios não contemplados
  const consorciosDisponiveis = consorcios.filter(c => !c.contemplado && !c.eh_investimento_caixa);

  // Obter grupos únicos
  const grupos = [...new Set(consorciosDisponiveis.map(c => c.grupo))].sort();

  // Filtrar cotas do grupo selecionado
  const cotasDoGrupo = grupoSelecionado 
    ? consorciosDisponiveis.filter(c => c.grupo === grupoSelecionado)
    : [];

  const handleGrupoChange = (grupo) => {
    setGrupoSelecionado(grupo);
    setFormData({
      ...formData,
      consorcio_id: "",
      grupo: "",
      cota: "",
    });
    setConsorcioSelecionado(null);
  };

  return (
    <Card className="shadow-xl border-t-4 border-blue-600">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          {item ? "Editar Lance" : "Ofertar Lance"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {!item && (
            <Alert className="border-blue-500 bg-blue-50">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Selecione primeiro o grupo e depois a cota. O valor será calculado automaticamente se escolher lance por percentual.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grupo">Selecionar Grupo *</Label>
              <Select
                value={grupoSelecionado}
                onValueChange={handleGrupoChange}
                required
                disabled={!!item}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grupo" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map(grupo => (
                    <SelectItem key={grupo} value={grupo}>
                      Grupo {grupo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consorcio_id">Selecionar Cota *</Label>
              <Select
                value={formData.consorcio_id}
                onValueChange={(value) => setFormData({ ...formData, consorcio_id: value })}
                required
                disabled={!grupoSelecionado || !!item}
              >
                <SelectTrigger>
                  <SelectValue placeholder={grupoSelecionado ? "Selecione a cota" : "Selecione o grupo primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {cotasDoGrupo.map(cons => {
                    const cliente = clientes.find(c => c.id === cons.cliente_id);
                    const emp = empreendimentos.find(e => e.id === cons.empreendimento_id);
                    return (
                      <SelectItem key={cons.id} value={cons.id}>
                        Cota {cons.cota} - {cliente?.nome} - R$ {cons.valor_carta?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {consorcioSelecionado && (
            <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-3">Informações da Cota</h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Grupo:</span>
                  <span className="font-semibold ml-2">{consorcioSelecionado.grupo}</span>
                </div>
                <div>
                  <span className="text-gray-600">Cota:</span>
                  <span className="font-semibold ml-2">{consorcioSelecionado.cota}</span>
                </div>
                <div>
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-semibold ml-2">
                    {clientes.find(c => c.id === consorcioSelecionado.cliente_id)?.nome}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Empreendimento:</span>
                  <span className="font-semibold ml-2">
                    {empreendimentos.find(e => e.id === consorcioSelecionado.empreendimento_id)?.nome}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Valor da Carta:</span>
                  <span className="font-semibold ml-2 text-[var(--wine-700)]">
                    R$ {consorcioSelecionado.valor_carta?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Parcelas:</span>
                  <span className="font-semibold ml-2">
                    {consorcioSelecionado.parcelas_pagas} / {consorcioSelecionado.parcelas_total}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tipo de Lance *</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={formData.tipo_lance === 'percentual' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, tipo_lance: 'percentual', valor_lance: 0 })}
                className={formData.tipo_lance === 'percentual' ? 'bg-blue-600' : ''}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Por Percentual (%)
              </Button>
              <Button
                type="button"
                variant={formData.tipo_lance === 'valor_fixo' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, tipo_lance: 'valor_fixo', percentual_lance: 0 })}
                className={formData.tipo_lance === 'valor_fixo' ? 'bg-green-600' : ''}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Valor Fixo (R$)
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {formData.tipo_lance === 'percentual' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="percentual_lance">Percentual do Lance (%) *</Label>
                  <Input
                    id="percentual_lance"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.percentual_lance}
                    onChange={(e) => setFormData({ ...formData, percentual_lance: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 25.50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor do Lance (Calculado)</Label>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-2xl font-bold text-green-700">
                      R$ {formData.valor_lance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="valor_lance">Valor do Lance (R$) *</Label>
                <Input
                  id="valor_lance"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_lance}
                  onChange={(e) => setFormData({ ...formData, valor_lance: parseFloat(e.target.value) || 0 })}
                  placeholder="Ex: 50000.00"
                  required
                />
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_lance">Data do Lance *</Label>
              <Input
                id="data_lance"
                type="date"
                value={formData.data_lance}
                onChange={(e) => setFormData({ ...formData, data_lance: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_assembleia_referencia">Data da Assembleia</Label>
              <Input
                id="data_assembleia_referencia"
                type="date"
                value={formData.data_assembleia_referencia}
                onChange={(e) => setFormData({ ...formData, data_assembleia_referencia: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Informações adicionais sobre o lance..."
              rows={3}
            />
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
            <Save className="w-4 h-4 mr-2" />
            {item ? "Atualizar" : "Ofertar Lance"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}