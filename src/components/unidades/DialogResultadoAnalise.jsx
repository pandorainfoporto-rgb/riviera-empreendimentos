import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X, Home, Ruler, Bath, Car, Layers, ArrowUp } from "lucide-react";

export default function DialogResultadoAnalise({ open, onClose, resultado, onAceitar }) {
  if (!resultado) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
            Resultado da Análise de IA
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Revise os dados extraídos do projeto arquitetônico
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Dados Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {resultado.area_construida > 0 && (
              <Card className="border-blue-200">
                <CardContent className="p-4 text-center">
                  <Ruler className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-700">{resultado.area_construida}m²</p>
                  <p className="text-xs text-gray-600">Área Construída</p>
                </CardContent>
              </Card>
            )}

            {resultado.quartos > 0 && (
              <Card className="border-purple-200">
                <CardContent className="p-4 text-center">
                  <Home className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-700">{resultado.quartos}</p>
                  <p className="text-xs text-gray-600">Quartos</p>
                  {resultado.suites > 0 && (
                    <Badge className="mt-1 bg-purple-100 text-purple-700">
                      {resultado.suites} suíte(s)
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {resultado.banheiros > 0 && (
              <Card className="border-cyan-200">
                <CardContent className="p-4 text-center">
                  <Bath className="w-8 h-8 mx-auto mb-2 text-cyan-600" />
                  <p className="text-2xl font-bold text-cyan-700">{resultado.banheiros}</p>
                  <p className="text-xs text-gray-600">Banheiros</p>
                </CardContent>
              </Card>
            )}

            {resultado.vagas_garagem > 0 && (
              <Card className="border-orange-200">
                <CardContent className="p-4 text-center">
                  <Car className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold text-orange-700">{resultado.vagas_garagem}</p>
                  <p className="text-xs text-gray-600">Vagas Garagem</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Características Construtivas */}
          {(resultado.quantidade_pavimentos || resultado.pe_direito || resultado.tipo_laje || resultado.padrao_obra) && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Características Construtivas
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {resultado.quantidade_pavimentos && (
                    <div>
                      <p className="text-sm text-gray-600">Pavimentos</p>
                      <p className="font-bold">{resultado.quantidade_pavimentos}</p>
                    </div>
                  )}
                  {resultado.pe_direito && (
                    <div>
                      <p className="text-sm text-gray-600">Pé-direito</p>
                      <p className="font-bold">{resultado.pe_direito}m</p>
                    </div>
                  )}
                  {resultado.tipo_laje && (
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Laje</p>
                      <p className="font-bold capitalize">{resultado.tipo_laje.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {resultado.padrao_obra && (
                    <div>
                      <p className="text-sm text-gray-600">Padrão</p>
                      <Badge className="bg-purple-600 text-white">
                        {resultado.padrao_obra.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ambientes Detalhados */}
          {resultado.detalhamento_pavimentos && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-4">📐 Ambientes Detalhados</h3>
                
                {/* Térreo */}
                {resultado.detalhamento_pavimentos.pavimento_terreo && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">Pavimento Térreo</h4>
                    <div className="space-y-2 text-sm">
                      {resultado.detalhamento_pavimentos.pavimento_terreo.quartos?.length > 0 && (
                        <div>
                          <strong>Quartos:</strong> {resultado.detalhamento_pavimentos.pavimento_terreo.quartos.length}
                          <ul className="ml-4 mt-1 text-xs text-gray-700">
                            {resultado.detalhamento_pavimentos.pavimento_terreo.quartos.map((q, i) => (
                              <li key={i}>
                                {q.nome || `Quarto ${i+1}`} - {q.area_m2}m²
                                {q.eh_suite && " (Suíte)"}
                                {q.tem_closet && " + Closet"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {resultado.detalhamento_pavimentos.pavimento_terreo.salas?.length > 0 && (
                        <div>
                          <strong>Salas:</strong> {resultado.detalhamento_pavimentos.pavimento_terreo.salas.length}
                          <ul className="ml-4 mt-1 text-xs text-gray-700">
                            {resultado.detalhamento_pavimentos.pavimento_terreo.salas.map((s, i) => (
                              <li key={i}>{s.tipo} - {s.area_m2}m²</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {resultado.detalhamento_pavimentos.pavimento_terreo.cozinha?.area_m2 > 0 && (
                        <div>
                          <strong>Cozinha:</strong> {resultado.detalhamento_pavimentos.pavimento_terreo.cozinha.tipo || 'Tipo não especificado'} - {resultado.detalhamento_pavimentos.pavimento_terreo.cozinha.area_m2}m²
                        </div>
                      )}
                      {resultado.detalhamento_pavimentos.pavimento_terreo.banheiros_sociais > 0 && (
                        <div>
                          <strong>Banheiros Sociais:</strong> {resultado.detalhamento_pavimentos.pavimento_terreo.banheiros_sociais}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Superior */}
                {resultado.detalhamento_pavimentos.pavimento_superior?.possui && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-3">Pavimento Superior</h4>
                    <div className="space-y-2 text-sm">
                      {resultado.detalhamento_pavimentos.pavimento_superior.quartos?.length > 0 && (
                        <div>
                          <strong>Quartos:</strong> {resultado.detalhamento_pavimentos.pavimento_superior.quartos.length}
                        </div>
                      )}
                      {resultado.detalhamento_pavimentos.pavimento_superior.salas?.length > 0 && (
                        <div>
                          <strong>Salas:</strong> {resultado.detalhamento_pavimentos.pavimento_superior.salas.length}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Itens Especiais */}
          {(resultado.incluir_ar_condicionado || resultado.incluir_energia_solar || resultado.incluir_automacao || resultado.incluir_aquecimento_solar || resultado.incluir_sistema_seguranca || resultado.incluir_paisagismo) && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-3">✨ Itens Especiais</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {resultado.incluir_ar_condicionado && <Badge className="bg-blue-100 text-blue-700">❄️ Ar Condicionado</Badge>}
                  {resultado.incluir_energia_solar && <Badge className="bg-yellow-100 text-yellow-700">☀️ Energia Solar</Badge>}
                  {resultado.incluir_automacao && <Badge className="bg-purple-100 text-purple-700">🤖 Automação</Badge>}
                  {resultado.incluir_aquecimento_solar && <Badge className="bg-orange-100 text-orange-700">🔥 Aquecimento Solar</Badge>}
                  {resultado.incluir_sistema_seguranca && <Badge className="bg-red-100 text-red-700">🔒 Sistema Segurança</Badge>}
                  {resultado.incluir_paisagismo && <Badge className="bg-green-100 text-green-700">🌿 Paisagismo</Badge>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {resultado.observacoes_projeto && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h3 className="font-bold text-sm mb-2">📝 Observações da Análise</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{resultado.observacoes_projeto}</p>
              </CardContent>
            </Card>
          )}

          {/* Confiança */}
          {resultado.confianca_analise && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Confiança da Análise: <strong className="text-blue-700">{resultado.confianca_analise}%</strong>
              </p>
            </div>
          )}

          {/* Resposta em Texto (fallback) */}
          {resultado.resposta_texto && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <h3 className="font-bold text-sm mb-2">💬 Resposta do Agente</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{resultado.resposta_texto}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              onAceitar(resultado);
              onClose();
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Aceitar e Preencher Formulário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}