import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowLeftRight, Download, CheckCircle2, XCircle, Award, TrendingDown, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function ComparacaoUnidades({ unidades, open, onClose }) {
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState([]);

  const toggleUnidade = (unidadeId) => {
    if (unidadesSelecionadas.includes(unidadeId)) {
      setUnidadesSelecionadas(unidadesSelecionadas.filter(id => id !== unidadeId));
    } else {
      if (unidadesSelecionadas.length >= 4) {
        alert('Máximo de 4 unidades para comparação');
        return;
      }
      setUnidadesSelecionadas([...unidadesSelecionadas, unidadeId]);
    }
  };

  const unidadesParaComparar = unidades.filter(u => unidadesSelecionadas.includes(u.id));

  const contarQuartos = (unidade) => {
    const terreo = unidade.detalhamento_pavimentos?.pavimento_terreo?.quartos?.length || 0;
    const superior = unidade.detalhamento_pavimentos?.pavimento_superior?.quartos?.length || 0;
    return terreo + superior;
  };

  const contarSuites = (unidade) => {
    const terreo = unidade.detalhamento_pavimentos?.pavimento_terreo?.quartos?.filter(q => q.eh_suite).length || 0;
    const superior = unidade.detalhamento_pavimentos?.pavimento_superior?.quartos?.filter(q => q.eh_suite).length || 0;
    return terreo + superior;
  };

  const contarBanheiros = (unidade) => {
    const terreo = unidade.detalhamento_pavimentos?.pavimento_terreo?.banheiros_sociais || 0;
    const superior = unidade.detalhamento_pavimentos?.pavimento_superior?.banheiros_sociais || 0;
    const suites = contarSuites(unidade);
    const lavabo = unidade.detalhamento_pavimentos?.pavimento_terreo?.lavabo ? 0.5 : 0;
    return terreo + superior + suites + lavabo;
  };

  const temCaracteristica = (unidade, caracteristica) => {
    switch (caracteristica) {
      case 'area_gourmet':
        return unidade.detalhamento_pavimentos?.pavimento_terreo?.area_gourmet?.possui || false;
      case 'churrasqueira':
        return unidade.detalhamento_pavimentos?.pavimento_terreo?.area_gourmet?.tem_churrasqueira || false;
      case 'piscina':
        return unidade.detalhamento_pavimentos?.areas_externas?.piscina?.possui || false;
      case 'adega':
        return unidade.detalhamento_pavimentos?.pavimento_terreo?.adega?.possui || false;
      case 'adega_climatizada':
        return unidade.detalhamento_pavimentos?.pavimento_terreo?.adega?.climatizada || false;
      case 'escritorio':
        return unidade.detalhamento_pavimentos?.pavimento_terreo?.escritorio?.possui || 
               unidade.detalhamento_pavimentos?.pavimento_superior?.escritorio?.possui || false;
      case 'biblioteca':
        return unidade.detalhamento_pavimentos?.pavimento_superior?.biblioteca?.possui || false;
      case 'segundo_pavimento':
        return unidade.detalhamento_pavimentos?.pavimento_superior?.possui || false;
      case 'subsolo':
        return unidade.detalhamento_pavimentos?.pavimento_subsolo?.possui || false;
      case 'jardim':
        return unidade.detalhamento_pavimentos?.areas_externas?.jardim?.possui || false;
      case 'deck':
        return unidade.detalhamento_pavimentos?.areas_externas?.deck?.possui || false;
      default:
        return false;
    }
  };

  // Função para determinar o melhor valor em cada característica
  const getMelhorValor = (valores, tipo) => {
    const numericos = valores.filter(v => typeof v === 'number' && v > 0);
    if (numericos.length === 0) return null;

    switch (tipo) {
      case 'maior': // Maior é melhor (área, quartos, etc)
        return Math.max(...numericos);
      case 'menor': // Menor é melhor (preço)
        return Math.min(...numericos);
      case 'boolean': // Tem é melhor
        return valores.some(v => v === true);
      default:
        return null;
    }
  };

  const exportarComparacao = () => {
    const csvContent = [
      ['Característica', ...unidadesParaComparar.map(u => u.codigo)],
      ['Status', ...unidadesParaComparar.map(u => u.status)],
      ['Área Total (m²)', ...unidadesParaComparar.map(u => u.area_total || 0)],
      ['Área Construída (m²)', ...unidadesParaComparar.map(u => u.area_construida || 0)],
      ['Quartos', ...unidadesParaComparar.map(u => contarQuartos(u))],
      ['Suítes', ...unidadesParaComparar.map(u => contarSuites(u))],
      ['Banheiros', ...unidadesParaComparar.map(u => contarBanheiros(u))],
      ['Vagas Garagem', ...unidadesParaComparar.map(u => u.vagas_garagem || 0)],
      ['Valor Venda (R$)', ...unidadesParaComparar.map(u => u.valor_venda || 0)],
      ['Valor Custo (R$)', ...unidadesParaComparar.map(u => u.valor_custo || 0)],
      ['Área Gourmet', ...unidadesParaComparar.map(u => temCaracteristica(u, 'area_gourmet') ? 'Sim' : 'Não')],
      ['Piscina', ...unidadesParaComparar.map(u => temCaracteristica(u, 'piscina') ? 'Sim' : 'Não')],
      ['Subsolo', ...unidadesParaComparar.map(u => temCaracteristica(u, 'subsolo') ? 'Sim' : 'Não')],
      ['Escritório', ...unidadesParaComparar.map(u => temCaracteristica(u, 'escritorio') ? 'Sim' : 'Não')],
      ['Biblioteca', ...unidadesParaComparar.map(u => temCaracteristica(u, 'biblioteca') ? 'Sim' : 'Não')],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'comparacao_unidades.csv';
    link.click();
  };

  const statusColors = {
    disponivel: "bg-green-100 text-green-800",
    reservada: "bg-yellow-100 text-yellow-800",
    vendida: "bg-blue-100 text-blue-800",
    escriturada: "bg-purple-100 text-purple-800",
    em_construcao: "bg-orange-100 text-orange-800",
  };

  const statusLabels = {
    disponivel: "Disponível",
    reservada: "Reservada",
    vendida: "Vendida",
    escriturada: "Escriturada",
    em_construcao: "Em Construção",
  };

  // Calcular melhores valores
  const melhorAreaTotal = getMelhorValor(unidadesParaComparar.map(u => u.area_total), 'maior');
  const melhorAreaConstruida = getMelhorValor(unidadesParaComparar.map(u => u.area_construida), 'maior');
  const maisQuartos = getMelhorValor(unidadesParaComparar.map(u => contarQuartos(u)), 'maior');
  const maisSuites = getMelhorValor(unidadesParaComparar.map(u => contarSuites(u)), 'maior');
  const maisVagas = getMelhorValor(unidadesParaComparar.map(u => u.vagas_garagem), 'maior');
  const menorPreco = getMelhorValor(unidadesParaComparar.map(u => u.valor_venda).filter(v => v > 0), 'menor');
  const menorPrecoM2 = getMelhorValor(
    unidadesParaComparar.map(u => u.area_construida > 0 ? u.valor_venda / u.area_construida : 0).filter(v => v > 0),
    'menor'
  );
  const maiorMargem = getMelhorValor(
    unidadesParaComparar.map(u => (u.valor_venda || 0) - (u.valor_custo || 0)),
    'maior'
  );

  // Renderizar célula com highlight
  const CelulaComparacao = ({ valor, melhorValor, tipo = 'numero', unidade = '' }) => {
    const ehMelhor = valor === melhorValor && melhorValor !== null && melhorValor !== 0;
    
    let displayValue = valor;
    if (tipo === 'numero' && typeof valor === 'number') {
      displayValue = valor.toLocaleString('pt-BR', { minimumFractionDigits: unidade === 'R$' ? 2 : 0 });
    }

    return (
      <td className={`p-3 text-center font-semibold relative ${ehMelhor ? 'bg-green-50' : ''}`}>
        {ehMelhor && (
          <Award className="w-4 h-4 text-green-600 absolute top-1 right-1" />
        )}
        <span className={ehMelhor ? 'text-green-700' : ''}>{unidade} {displayValue}</span>
      </td>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5" />
              Comparação Detalhada de Unidades
            </DialogTitle>
            {unidadesParaComparar.length > 0 && (
              <Button size="sm" variant="outline" onClick={exportarComparacao}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            )}
          </div>
        </DialogHeader>

        {unidadesSelecionadas.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Selecione até 4 unidades para comparar (mínimo 2):
            </p>

            <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {unidades.map(unidade => (
                <div
                  key={unidade.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    unidadesSelecionadas.includes(unidade.id)
                      ? 'border-[var(--wine-600)] bg-[var(--wine-50)]'
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => toggleUnidade(unidade.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={unidadesSelecionadas.includes(unidade.id)}
                          onCheckedChange={() => toggleUnidade(unidade.id)}
                        />
                        <h4 className="font-semibold">{unidade.codigo}</h4>
                        <Badge className={statusColors[unidade.status]}>
                          {statusLabels[unidade.status]}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>📐 {unidade.area_total}m² total</p>
                        <p>🏗️ {unidade.area_construida || 0}m² construída</p>
                        <p>🛏️ {contarQuartos(unidade)} quartos ({contarSuites(unidade)} suítes)</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (unidadesSelecionadas.length < 2) {
                    alert('Selecione pelo menos 2 unidades');
                  }
                }}
                disabled={unidadesSelecionadas.length < 2}
                className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
              >
                Comparar ({unidadesSelecionadas.length})
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)] p-3 rounded-lg border border-[var(--wine-300)]">
              <p className="text-sm font-medium text-[var(--wine-900)]">
                🏆 Comparando {unidadesParaComparar.length} unidades • Verde = Melhor opção
              </p>
              <Button size="sm" variant="ghost" onClick={() => setUnidadesSelecionadas([])}>
                <X className="w-4 h-4 mr-1" />
                Alterar Seleção
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white">
                    <th className="p-3 text-left font-semibold sticky left-0 bg-[var(--wine-600)]">
                      Característica
                    </th>
                    {unidadesParaComparar.map(unidade => (
                      <th key={unidade.id} className="p-3 text-center font-semibold min-w-[150px]">
                        {unidade.codigo}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* STATUS */}
                  <tr className="border-b bg-white hover:bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-white">Status</td>
                    {unidadesParaComparar.map(unidade => (
                      <td key={unidade.id} className="p-3 text-center">
                        <Badge className={statusColors[unidade.status]}>
                          {statusLabels[unidade.status]}
                        </Badge>
                      </td>
                    ))}
                  </tr>

                  {/* TIPO */}
                  <tr className="border-b bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-gray-50">Tipo</td>
                    {unidadesParaComparar.map(unidade => (
                      <td key={unidade.id} className="p-3 text-center capitalize">
                        {unidade.tipo}
                      </td>
                    ))}
                  </tr>

                  {/* SEÇÃO: ÁREAS */}
                  <tr className="bg-[var(--wine-100)]">
                    <td colSpan={unidadesParaComparar.length + 1} className="p-2 font-bold text-[var(--wine-700)]">
                      📐 ÁREAS
                    </td>
                  </tr>

                  <tr className="border-b bg-white hover:bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-white">Área Total</td>
                    {unidadesParaComparar.map(unidade => (
                      <CelulaComparacao
                        key={unidade.id}
                        valor={unidade.area_total || 0}
                        melhorValor={melhorAreaTotal}
                        unidade="m²"
                      />
                    ))}
                  </tr>

                  <tr className="border-b bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-gray-50">Área Construída</td>
                    {unidadesParaComparar.map(unidade => (
                      <CelulaComparacao
                        key={unidade.id}
                        valor={unidade.area_construida || 0}
                        melhorValor={melhorAreaConstruida}
                        unidade="m²"
                      />
                    ))}
                  </tr>

                  {/* SEÇÃO: CÔMODOS */}
                  <tr className="bg-[var(--wine-100)]">
                    <td colSpan={unidadesParaComparar.length + 1} className="p-2 font-bold text-[var(--wine-700)]">
                      🏠 CÔMODOS
                    </td>
                  </tr>

                  <tr className="border-b bg-white hover:bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-white">Quartos</td>
                    {unidadesParaComparar.map(unidade => (
                      <CelulaComparacao
                        key={unidade.id}
                        valor={contarQuartos(unidade)}
                        melhorValor={maisQuartos}
                      />
                    ))}
                  </tr>

                  <tr className="border-b bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-gray-50">Suítes</td>
                    {unidadesParaComparar.map(unidade => (
                      <CelulaComparacao
                        key={unidade.id}
                        valor={contarSuites(unidade)}
                        melhorValor={maisSuites}
                      />
                    ))}
                  </tr>

                  <tr className="border-b bg-white hover:bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-white">Banheiros</td>
                    {unidadesParaComparar.map(unidade => {
                      const total = contarBanheiros(unidade);
                      return (
                        <td key={unidade.id} className="p-3 text-center font-semibold">
                          {total}
                        </td>
                      );
                    })}
                  </tr>

                  <tr className="border-b bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-gray-50">Vagas Garagem</td>
                    {unidadesParaComparar.map(unidade => (
                      <CelulaComparacao
                        key={unidade.id}
                        valor={unidade.vagas_garagem || 0}
                        melhorValor={maisVagas}
                      />
                    ))}
                  </tr>

                  {/* SEÇÃO: CARACTERÍSTICAS ESPECIAIS */}
                  <tr className="bg-[var(--wine-100)]">
                    <td colSpan={unidadesParaComparar.length + 1} className="p-2 font-bold text-[var(--wine-700)]">
                      ⭐ CARACTERÍSTICAS ESPECIAIS
                    </td>
                  </tr>

                  <tr className="border-b bg-white hover:bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-white">Segundo Pavimento</td>
                    {unidadesParaComparar.map(unidade => (
                      <td key={unidade.id} className="p-3 text-center">
                        {temCaracteristica(unidade, 'segundo_pavimento') ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-gray-50">Subsolo</td>
                    {unidadesParaComparar.map(unidade => (
                      <td key={unidade.id} className="p-3 text-center">
                        {temCaracteristica(unidade, 'subsolo') ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b bg-white hover:bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-white">Área Gourmet</td>
                    {unidadesParaComparar.map(unidade => (
                      <td key={unidade.id} className="p-3 text-center">
                        {temCaracteristica(unidade, 'area_gourmet') ? (
                          <div className="flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            {temCaracteristica(unidade, 'churrasqueira') && (
                              <span className="ml-1 text-xs">🔥</span>
                            )}
                          </div>
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-gray-50">Piscina</td>
                    {unidadesParaComparar.map(unidade => (
                      <td key={unidade.id} className="p-3 text-center">
                        {temCaracteristica(unidade, 'piscina') ? (
                          <div>
                            <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                            <div className="text-xs text-gray-600 mt-1">
                              {unidade.detalhamento_pavimentos?.areas_externas?.piscina?.tipo} • 
                              {unidade.detalhamento_pavimentos?.areas_externas?.piscina?.tamanho_m2}m²
                            </div>
                          </div>
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b bg-white hover:bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-white">Adega</td>
                    {unidadesParaComparar.map(unidade => (
                      <td key={unidade.id} className="p-3 text-center">
                        {temCaracteristica(unidade, 'adega') ? (
                          <div className="flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            {temCaracteristica(unidade, 'adega_climatizada') && (
                              <Badge className="ml-1 text-xs bg-blue-500 text-white">Climatizada</Badge>
                            )}
                          </div>
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-gray-50">Escritório</td>
                    {unidadesParaComparar.map(unidade => (
                      <td key={unidade.id} className="p-3 text-center">
                        {temCaracteristica(unidade, 'escritorio') ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b bg-white hover:bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-white">Biblioteca</td>
                    {unidadesParaComparar.map(unidade => (
                      <td key={unidade.id} className="p-3 text-center">
                        {temCaracteristica(unidade, 'biblioteca') ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-gray-50">Jardim</td>
                    {unidadesParaComparar.map(unidade => (
                      <td key={unidade.id} className="p-3 text-center">
                        {temCaracteristica(unidade, 'jardim') ? (
                          <div>
                            <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                            <div className="text-xs text-gray-600 mt-1">
                              {unidade.detalhamento_pavimentos?.areas_externas?.jardim?.area_m2}m²
                            </div>
                          </div>
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b bg-white hover:bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-white">Deck</td>
                    {unidadesParaComparar.map(unidade => (
                      <td key={unidade.id} className="p-3 text-center">
                        {temCaracteristica(unidade, 'deck') ? (
                          <div>
                            <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                            <div className="text-xs text-gray-600 mt-1 capitalize">
                              {unidade.detalhamento_pavimentos?.areas_externas?.deck?.material}
                            </div>
                          </div>
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* SEÇÃO: FINANCEIRO */}
                  <tr className="bg-[var(--wine-100)]">
                    <td colSpan={unidadesParaComparar.length + 1} className="p-2 font-bold text-[var(--wine-700)]">
                      💰 ANÁLISE FINANCEIRA
                    </td>
                  </tr>

                  <tr className="border-b bg-white hover:bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-white">Valor de Venda</td>
                    {unidadesParaComparar.map(unidade => (
                      <td key={unidade.id} className="p-3 text-center font-semibold text-green-700">
                        {unidade.valor_venda 
                          ? `R$ ${unidade.valor_venda.toLocaleString('pt-BR')}` 
                          : '-'}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-gray-50">Valor de Custo</td>
                    {unidadesParaComparar.map(unidade => (
                      <td key={unidade.id} className="p-3 text-center font-semibold text-red-700">
                        {unidade.valor_custo 
                          ? `R$ ${unidade.valor_custo.toLocaleString('pt-BR')}` 
                          : '-'}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b bg-white hover:bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-white">Margem (Lucro)</td>
                    {unidadesParaComparar.map(unidade => {
                      const margem = (unidade.valor_venda || 0) - (unidade.valor_custo || 0);
                      const percentual = unidade.valor_custo 
                        ? ((margem / unidade.valor_custo) * 100).toFixed(1) 
                        : 0;
                      const ehMelhor = margem === maiorMargem && maiorMargem > 0;
                      
                      return (
                        <td key={unidade.id} className={`p-3 text-center relative ${ehMelhor ? 'bg-green-50' : ''}`}>
                          {ehMelhor && (
                            <Award className="w-4 h-4 text-green-600 absolute top-1 right-1" />
                          )}
                          <div className={`font-semibold ${ehMelhor ? 'text-green-700' : 'text-blue-700'}`}>
                            R$ {margem.toLocaleString('pt-BR')}
                          </div>
                          <div className="text-xs text-gray-600">
                            ({percentual}%)
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  <tr className="border-b bg-gray-50">
                    <td className="p-3 font-medium sticky left-0 bg-gray-50 flex items-center gap-2">
                      Valor por m²
                      <TrendingDown className="w-4 h-4 text-green-600" title="Menor é melhor" />
                    </td>
                    {unidadesParaComparar.map(unidade => {
                      const valorM2 = unidade.area_construida 
                        ? (unidade.valor_venda / unidade.area_construida)
                        : 0;
                      const ehMelhor = valorM2 === menorPrecoM2 && menorPrecoM2 > 0;
                      
                      return (
                        <td key={unidade.id} className={`p-3 text-center font-semibold relative ${ehMelhor ? 'bg-green-50' : ''}`}>
                          {ehMelhor && (
                            <Award className="w-4 h-4 text-green-600 absolute top-1 right-1" />
                          )}
                          <span className={ehMelhor ? 'text-green-700' : ''}>
                            R$ {valorM2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* SEÇÃO: SCORE GERAL */}
                  <tr className="bg-gradient-to-r from-purple-100 to-pink-100">
                    <td colSpan={unidadesParaComparar.length + 1} className="p-2 font-bold text-purple-900">
                      🎯 SCORE GERAL (Características + Custo-Benefício)
                    </td>
                  </tr>

                  <tr className="border-b bg-white">
                    <td className="p-3 font-medium sticky left-0 bg-white">Pontuação Total</td>
                    {unidadesParaComparar.map(unidade => {
                      // Calcular score baseado em múltiplos fatores
                      let score = 0;
                      
                      // Área (até 20 pontos)
                      const areaScore = ((unidade.area_total || 0) / melhorAreaTotal) * 20;
                      score += areaScore;
                      
                      // Quartos e suítes (até 25 pontos)
                      const quartosScore = ((contarQuartos(unidade)) / maisQuartos) * 15;
                      const suitesScore = ((contarSuites(unidade)) / (maisSuites || 1)) * 10;
                      score += quartosScore + suitesScore;
                      
                      // Características especiais (até 30 pontos - 5 por característica)
                      if (temCaracteristica(unidade, 'segundo_pavimento')) score += 5;
                      if (temCaracteristica(unidade, 'subsolo')) score += 5;
                      if (temCaracteristica(unidade, 'area_gourmet')) score += 5;
                      if (temCaracteristica(unidade, 'piscina')) score += 5;
                      if (temCaracteristica(unidade, 'escritorio')) score += 3;
                      if (temCaracteristica(unidade, 'biblioteca')) score += 2;
                      
                      // Custo-benefício (até 25 pontos - inverso do preço/m²)
                      const valorM2 = unidade.area_construida > 0 ? unidade.valor_venda / unidade.area_construida : 0;
                      if (valorM2 > 0 && menorPrecoM2 > 0) {
                        const custoScore = (menorPrecoM2 / valorM2) * 25;
                        score += custoScore;
                      }
                      
                      const scoreTotal = Math.round(score);
                      const ehMelhor = scoreTotal === Math.max(...unidadesParaComparar.map(u => {
                        let s = 0;
                        s += ((u.area_total || 0) / melhorAreaTotal) * 20;
                        s += ((contarQuartos(u)) / maisQuartos) * 15;
                        s += ((contarSuites(u)) / (maisSuites || 1)) * 10;
                        if (temCaracteristica(u, 'segundo_pavimento')) s += 5;
                        if (temCaracteristica(u, 'subsolo')) s += 5;
                        if (temCaracteristica(u, 'area_gourmet')) s += 5;
                        if (temCaracteristica(u, 'piscina')) s += 5;
                        if (temCaracteristica(u, 'escritorio')) s += 3;
                        if (temCaracteristica(u, 'biblioteca')) s += 2;
                        const vm2 = u.area_construida > 0 ? u.valor_venda / u.area_construida : 0;
                        if (vm2 > 0 && menorPrecoM2 > 0) s += (menorPrecoM2 / vm2) * 25;
                        return Math.round(s);
                      }));
                      
                      return (
                        <td key={unidade.id} className={`p-3 text-center relative ${ehMelhor ? 'bg-gradient-to-br from-yellow-100 to-amber-100' : ''}`}>
                          {ehMelhor && (
                            <div className="absolute -top-2 -right-2">
                              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
                                🏆
                              </div>
                            </div>
                          )}
                          <div className={`text-3xl font-bold ${ehMelhor ? 'text-amber-700' : 'text-gray-700'}`}>
                            {scoreTotal}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            de 100 pontos
                          </div>
                          {ehMelhor && (
                            <Badge className="mt-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white">
                              Melhor Opção
                            </Badge>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">📊 Metodologia de Pontuação</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• <strong>Área:</strong> até 20 pontos (proporcional à maior área)</p>
                <p>• <strong>Quartos:</strong> até 15 pontos (proporcional ao maior nº)</p>
                <p>• <strong>Suítes:</strong> até 10 pontos (proporcional ao maior nº)</p>
                <p>• <strong>Características:</strong> até 30 pontos (2º pav=5, subsolo=5, área gourmet=5, piscina=5, etc)</p>
                <p>• <strong>Custo-Benefício:</strong> até 25 pontos (menor preço/m² = mais pontos)</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setUnidadesSelecionadas([])}>
                Nova Comparação
              </Button>
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}