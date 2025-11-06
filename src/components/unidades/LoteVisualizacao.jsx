import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Compass, Sun, Sunrise, Sunset } from "lucide-react";

export default function LoteVisualizacao({ medidas, orientacao }) {
  const { frente = 0, fundo = 0, lateral_direita = 0, lateral_esquerda = 0 } = medidas || {};
  const { graus_norte = 0, face_principal = "norte" } = orientacao || {};

  // Calcular escala para visualização
  const maxDimensao = Math.max(frente, fundo, lateral_direita, lateral_esquerda);
  const escala = maxDimensao > 0 ? 300 / maxDimensao : 1;

  // Dimensões em pixels
  const frentePixels = frente * escala;
  const fundoPixels = fundo * escala;
  const lateralDireitaPixels = lateral_direita * escala;
  const lateralEsquerdaPixels = lateral_esquerda * escala;

  // Média das laterais para desenhar forma
  const alturaMedia = (lateralDireitaPixels + lateralEsquerdaPixels) / 2;
  const larguraMedia = (frentePixels + fundoPixels) / 2;

  // Calcular posição do sol baseado nos graus
  const calcularPosicaoSol = () => {
    const horarioAtual = new Date().getHours();
    
    // Ajustar ângulo do sol ao longo do dia (simplificado)
    // 6h = Leste (90°), 12h = Norte (0°/360°), 18h = Oeste (270°)
    let anguloSolDia = 0;
    if (horarioAtual >= 6 && horarioAtual <= 18) {
      // Interpolação de 6h a 18h
      const progresso = (horarioAtual - 6) / 12;
      anguloSolDia = 90 + (progresso * 180); // De 90° (leste) para 270° (oeste)
    }

    // Calcular diferença entre orientação do lote e posição do sol
    const diferencaAngulo = (anguloSolDia - graus_norte + 360) % 360;
    
    // Converter para radianos
    const radianos = (diferencaAngulo * Math.PI) / 180;
    
    // Posição do sol em relação ao centro do lote
    const raio = 180;
    const x = Math.sin(radianos) * raio;
    const y = -Math.cos(radianos) * raio;

    return { x, y, angulo: diferencaAngulo };
  };

  const posicaoSol = calcularPosicaoSol();

  // Determinar período do dia
  const horarioAtual = new Date().getHours();
  const periodoDia = horarioAtual >= 6 && horarioAtual < 12 ? 'manha' : 
                     horarioAtual >= 12 && horarioAtual < 18 ? 'tarde' : 'noite';

  const corSol = periodoDia === 'manha' ? '#FDB813' : 
                 periodoDia === 'tarde' ? '#FF6B35' : '#4A5568';

  const IconeSol = periodoDia === 'manha' ? Sunrise : periodoDia === 'tarde' ? Sunset : Sun;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Compass className="w-5 h-5" />
          Visualização em Escala
        </CardTitle>
        {maxDimensao > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge variant="outline">Escala 1:{Math.round(1/escala)}</Badge>
            <Badge className="bg-yellow-100 text-yellow-800">
              <Sun className="w-3 h-3 mr-1" />
              {graus_norte}° Norte
            </Badge>
            <Badge className="bg-orange-100 text-orange-800">
              <IconeSol className="w-3 h-3 mr-1" />
              {periodoDia === 'manha' ? 'Manhã' : periodoDia === 'tarde' ? 'Tarde' : 'Noite'}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {maxDimensao === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Compass className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Preencha as medidas para ver a visualização</p>
          </div>
        ) : (
          <div className="relative">
            <svg 
              width="100%" 
              height="400" 
              viewBox="0 0 400 400" 
              className="border border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-blue-50"
            >
              {/* Rosa dos Ventos */}
              <g transform={`translate(200, 200) rotate(${-graus_norte})`}>
                <circle cx="0" cy="0" r="170" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="5,5" />
                
                {/* Norte */}
                <g>
                  <line x1="0" y1="-180" x2="0" y2="-160" stroke="#EF4444" strokeWidth="3" />
                  <text x="0" y="-190" textAnchor="middle" className="fill-red-600 font-bold" fontSize="14">N</text>
                </g>
                
                {/* Sul */}
                <g>
                  <line x1="0" y1="180" x2="0" y2="160" stroke="#3B82F6" strokeWidth="2" />
                  <text x="0" y="200" textAnchor="middle" className="fill-blue-600" fontSize="12">S</text>
                </g>
                
                {/* Leste */}
                <g>
                  <line x1="180" y1="0" x2="160" y2="0" stroke="#64748B" strokeWidth="2" />
                  <text x="195" y="5" textAnchor="middle" className="fill-gray-600" fontSize="12">L</text>
                </g>
                
                {/* Oeste */}
                <g>
                  <line x1="-180" y1="0" x2="-160" y2="0" stroke="#64748B" strokeWidth="2" />
                  <text x="-195" y="5" textAnchor="middle" className="fill-gray-600" fontSize="12">O</text>
                </g>

                {/* Sol */}
                {periodoDia !== 'noite' && (
                  <g transform={`translate(${posicaoSol.x}, ${posicaoSol.y})`}>
                    <circle cx="0" cy="0" r="20" fill={corSol} opacity="0.8" />
                    <circle cx="0" cy="0" r="25" fill={corSol} opacity="0.3" />
                    <circle cx="0" cy="0" r="30" fill={corSol} opacity="0.1" />
                    <text x="0" y="45" textAnchor="middle" className="fill-orange-700 font-bold" fontSize="10">
                      {periodoDia === 'manha' ? '🌅' : '🌇'}
                    </text>
                  </g>
                )}

                {/* Lote (retângulo no centro) */}
                <g>
                  {/* Forma do lote */}
                  <path
                    d={`
                      M ${-larguraMedia/2} ${-alturaMedia/2}
                      L ${larguraMedia/2} ${-alturaMedia/2}
                      L ${larguraMedia/2} ${alturaMedia/2}
                      L ${-larguraMedia/2} ${alturaMedia/2}
                      Z
                    `}
                    fill="#10B981"
                    fillOpacity="0.3"
                    stroke="#059669"
                    strokeWidth="3"
                  />

                  {/* Sombra (aproximação baseada na posição do sol) */}
                  {periodoDia !== 'noite' && (
                    <path
                      d={`
                        M ${-larguraMedia/2} ${-alturaMedia/2}
                        L ${larguraMedia/2} ${-alturaMedia/2}
                        L ${larguraMedia/2} ${alturaMedia/2}
                        L ${-larguraMedia/2} ${alturaMedia/2}
                        Z
                      `}
                      fill="#000000"
                      fillOpacity="0.15"
                      transform={`translate(${posicaoSol.x * 0.1}, ${posicaoSol.y * 0.1})`}
                    />
                  )}

                  {/* Medidas - Frente (superior) */}
                  <text 
                    x="0" 
                    y={-alturaMedia/2 - 10} 
                    textAnchor="middle" 
                    className="fill-gray-700 font-semibold"
                    fontSize="12"
                  >
                    ↔ {frente.toFixed(2)}m
                  </text>

                  {/* Medidas - Fundo (inferior) */}
                  <text 
                    x="0" 
                    y={alturaMedia/2 + 20} 
                    textAnchor="middle" 
                    className="fill-gray-700 font-semibold"
                    fontSize="12"
                  >
                    ↔ {fundo.toFixed(2)}m
                  </text>

                  {/* Medidas - Lateral Direita */}
                  <text 
                    x={larguraMedia/2 + 10} 
                    y="5" 
                    textAnchor="start" 
                    className="fill-gray-700 font-semibold"
                    fontSize="12"
                  >
                    ↕ {lateral_direita.toFixed(2)}m
                  </text>

                  {/* Medidas - Lateral Esquerda */}
                  <text 
                    x={-larguraMedia/2 - 10} 
                    y="5" 
                    textAnchor="end" 
                    className="fill-gray-700 font-semibold"
                    fontSize="12"
                  >
                    ↕ {lateral_esquerda.toFixed(2)}m
                  </text>

                  {/* Marcador de frente */}
                  <polygon
                    points={`0,${-alturaMedia/2 - 5} -5,${-alturaMedia/2 + 5} 5,${-alturaMedia/2 + 5}`}
                    fill="#059669"
                  />
                </g>
              </g>
            </svg>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 font-semibold mb-1">Área Aproximada</p>
                <p className="text-lg font-bold text-green-900">
                  {((frente * lateral_direita + frente * lateral_esquerda + fundo * lateral_direita + fundo * lateral_esquerda) / 4).toFixed(2)} m²
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 font-semibold mb-1">Perímetro</p>
                <p className="text-lg font-bold text-blue-900">
                  {(frente + fundo + lateral_direita + lateral_esquerda).toFixed(2)} m
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-4 h-4 text-yellow-600" />
                <p className="text-sm font-semibold text-yellow-900">Análise de Insolação</p>
              </div>
              <div className="text-xs text-yellow-800 space-y-1">
                <p>• <strong>Manhã (6h-12h):</strong> {getInsolacaoPeriodo(graus_norte, 'manha')}</p>
                <p>• <strong>Tarde (12h-18h):</strong> {getInsolacaoPeriodo(graus_norte, 'tarde')}</p>
                <p>• <strong>Agora ({new Date().getHours()}h):</strong> {getInsolacaoPeriodo(graus_norte, periodoDia)}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getInsolacaoPeriodo(graus_norte, periodo) {
  // Manhã: Sol vem do Leste (90°)
  // Tarde: Sol vem do Oeste (270°)
  
  if (periodo === 'manha') {
    const diff = Math.abs(graus_norte - 90);
    if (diff < 45) return "Sol direto na frente ☀️☀️☀️";
    if (diff < 90) return "Sol lateral forte 🌤️🌤️";
    if (diff < 135) return "Sol lateral fraco 🌤️";
    return "Sombreado 🌥️";
  } else if (periodo === 'tarde') {
    const diff = Math.abs(graus_norte - 270);
    if (diff < 45) return "Sol direto na frente ☀️☀️☀️";
    if (diff < 90) return "Sol lateral forte 🌤️🌤️";
    if (diff < 135) return "Sol lateral fraco 🌤️";
    return "Sombreado 🌥️";
  }
  
  return "Sem sol 🌙";
}