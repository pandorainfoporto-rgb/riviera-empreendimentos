import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Save, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FolhaPagamentoForm({ item, colaboradores, centrosCusto, mesReferencia, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    colaborador_id: "",
    centro_custo_id: "",
    mes_referencia: mesReferencia,
    tipo_folha: "mensal",
    dias_trabalhados: 30,
    horas_extras_50: 0,
    horas_extras_100: 0,
    adicional_noturno_horas: 0,
    faltas: 0,
    atrasos_horas: 0,
    salario_base: 0,
    valor_comissoes: 0,
    valor_bonus: 0,
    status: "calculada",
  });

  const [calculado, setCalculado] = useState(null);

  const colaboradorSelecionado = colaboradores.find(c => c.id === formData.colaborador_id);

  useEffect(() => {
    if (colaboradorSelecionado) {
      setFormData(prev => ({
        ...prev,
        salario_base: colaboradorSelecionado.salario_base || 0,
        centro_custo_id: colaboradorSelecionado.centro_custo_id || prev.centro_custo_id,
      }));
    }
  }, [colaboradorSelecionado]);

  const calcularFolha = () => {
    const salarioBase = parseFloat(formData.salario_base) || 0;
    const horasExtras50 = parseFloat(formData.horas_extras_50) || 0;
    const horasExtras100 = parseFloat(formData.horas_extras_100) || 0;
    const adicionalNoturno = parseFloat(formData.adicional_noturno_horas) || 0;
    const comissoes = parseFloat(formData.valor_comissoes) || 0;
    const bonus = parseFloat(formData.valor_bonus) || 0;

    // Valor hora
    const valorHora = salarioBase / 220; // 220 horas/mês padrão

    // Horas extras
    const valorHorasExtras50 = horasExtras50 * valorHora * 1.5;
    const valorHorasExtras100 = horasExtras100 * valorHora * 2;
    const valorAdicionalNoturno = adicionalNoturno * valorHora * 0.2;

    // Total proventos
    const totalProventos = salarioBase + valorHorasExtras50 + valorHorasExtras100 + valorAdicionalNoturno + comissoes + bonus;

    // INSS
    let inssAliquota = 0;
    if (totalProventos <= 1412) inssAliquota = 7.5;
    else if (totalProventos <= 2666.68) inssAliquota = 9;
    else if (totalProventos <= 4000.03) inssAliquota = 12;
    else inssAliquota = 14;

    const inssValor = (totalProventos * inssAliquota) / 100;

    // IRRF
    const dependentes = colaboradorSelecionado?.dependentes?.length || 0;
    const deducaoDependentes = dependentes * 189.59;
    const baseIRRF = totalProventos - inssValor - deducaoDependentes;
    
    let irrfAliquota = 0;
    let irrfDeducao = 0;
    
    if (baseIRRF > 4664.68) {
      irrfAliquota = 27.5;
      irrfDeducao = 869.36;
    } else if (baseIRRF > 3751.05) {
      irrfAliquota = 22.5;
      irrfDeducao = 636.13;
    } else if (baseIRRF > 2826.65) {
      irrfAliquota = 15;
      irrfDeducao = 354.80;
    } else if (baseIRRF > 2112) {
      irrfAliquota = 7.5;
      irrfDeducao = 158.40;
    }

    const irrfValor = baseIRRF > 0 ? Math.max((baseIRRF * irrfAliquota / 100) - irrfDeducao, 0) : 0;

    const totalDescontos = inssValor + irrfValor;
    const salarioLiquido = totalProventos - totalDescontos;

    // Encargos patronais
    const inssPatronal = salarioBase * 0.20;
    const fgts = salarioBase * 0.08;
    const rat = salarioBase * 0.03;
    const terceiros = salarioBase * 0.058;
    const totalEncargos = inssPatronal + fgts + rat + terceiros;

    const custoTotalEmpresa = totalProventos + totalEncargos;

    setCalculado({
      total_proventos: totalProventos,
      valor_hora_extra_50: valorHorasExtras50,
      valor_hora_extra_100: valorHorasExtras100,
      valor_adicional_noturno: valorAdicionalNoturno,
      inss_base_calculo: totalProventos,
      inss_aliquota: inssAliquota,
      inss_valor: inssValor,
      irrf_base_calculo: baseIRRF,
      irrf_aliquota: irrfAliquota,
      irrf_valor: irrfValor,
      irrf_dependentes: dependentes,
      irrf_deducao_dependentes: deducaoDependentes,
      fgts_valor: fgts,
      total_descontos: totalDescontos,
      salario_liquido: salarioLiquido,
      custo_total_empresa: custoTotalEmpresa,
      encargos_sociais: {
        inss_patronal: inssPatronal,
        fgts: fgts,
        rat: rat,
        terceiros: terceiros,
        total_encargos: totalEncargos,
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!calculado) {
      alert('Calcule a folha antes de salvar');
      return;
    }
    onSubmit({ ...formData, ...calculado });
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Editar" : "Novo"} Lançamento de Folha</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Colaborador *</Label>
                <Select
                  value={formData.colaborador_id}
                  onValueChange={(value) => setFormData({ ...formData, colaborador_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {colaboradores.filter(c => c.status === 'ativo').map(col => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.nome_completo} - {col.cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Folha</Label>
                <Select
                  value={formData.tipo_folha}
                  onValueChange={(value) => setFormData({ ...formData, tipo_folha: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="adiantamento">Adiantamento</SelectItem>
                    <SelectItem value="ferias">Férias</SelectItem>
                    <SelectItem value="decimo_terceiro">13º Salário</SelectItem>
                    <SelectItem value="rescisao">Rescisão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Horas Extras 50%</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.horas_extras_50}
                  onChange={(e) => setFormData({ ...formData, horas_extras_50: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Horas Extras 100%</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.horas_extras_100}
                  onChange={(e) => setFormData({ ...formData, horas_extras_100: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Adicional Noturno (h)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.adicional_noturno_horas}
                  onChange={(e) => setFormData({ ...formData, adicional_noturno_horas: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Faltas</Label>
                <Input
                  type="number"
                  value={formData.faltas}
                  onChange={(e) => setFormData({ ...formData, faltas: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Comissões (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_comissoes}
                  onChange={(e) => setFormData({ ...formData, valor_comissoes: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Bônus (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_bonus}
                  onChange={(e) => setFormData({ ...formData, valor_bonus: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={calcularFolha}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calcular Folha
            </Button>

            {calculado && (
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="text-lg">Resultado do Cálculo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded">
                      <p className="text-xs text-gray-600">Proventos</p>
                      <p className="text-xl font-bold text-green-700">
                        R$ {calculado.total_proventos.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-xs text-gray-600">Descontos</p>
                      <p className="text-xl font-bold text-red-700">
                        R$ {calculado.total_descontos.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Descontos Detalhados</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>INSS ({calculado.inss_aliquota}%)</span>
                        <span className="font-semibold">R$ {calculado.inss_valor.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IRRF ({calculado.irrf_aliquota}%)</span>
                        <span className="font-semibold">R$ {calculado.irrf_valor.toFixed(2)}</span>
                      </div>
                      {calculado.irrf_dependentes > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Dedução Dependentes ({calculado.irrf_dependentes})</span>
                          <span>-R$ {calculado.irrf_deducao_dependentes.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-lg text-white">
                    <p className="text-sm opacity-90 mb-1">Salário Líquido</p>
                    <p className="text-3xl font-bold">
                      R$ {calculado.salario_liquido.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-2 border-purple-300">
                    <p className="text-sm text-gray-600 mb-2">Encargos Patronais</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>INSS Patronal (20%)</span>
                        <span>R$ {calculado.encargos_sociais.inss_patronal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FGTS (8%)</span>
                        <span>R$ {calculado.encargos_sociais.fgts.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>RAT (3%)</span>
                        <span>R$ {calculado.encargos_sociais.rat.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Terceiros (5.8%)</span>
                        <span>R$ {calculado.encargos_sociais.terceiros.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t font-bold text-purple-700">
                        <span>Custo Total Empresa</span>
                        <span>R$ {calculado.custo_total_empresa.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isProcessing || !calculado}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}