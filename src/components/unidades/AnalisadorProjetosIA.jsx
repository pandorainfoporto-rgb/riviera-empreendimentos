import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { 
  Brain, Loader2, CheckCircle2, AlertCircle, 
  FileText, Info, Sparkles 
} from "lucide-react";
import { toast } from "sonner";

export default function AnalisadorProjetosIA({ 
  unidadeId, 
  projetosArquitetonicos = [],
  onAnaliseCompleta 
}) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [analisando, setAnalisando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
      
      // Simular progresso baseado nas mensagens
      if (data.messages && data.messages.length > 0) {
        const lastMessage = data.messages[data.messages.length - 1];
        if (lastMessage.role === 'assistant') {
          setProgresso(prev => Math.min(prev + 20, 90));
        }
      }
    });

    return () => unsubscribe();
  }, [conversationId]);

  const iniciarAnalise = async () => {
    if (!unidadeId) {
      toast.error("Salve a unidade primeiro antes de analisar os projetos");
      return;
    }

    if (!projetosArquitetonicos || projetosArquitetonicos.length === 0) {
      toast.error("Adicione pelo menos um projeto arquitetônico antes de analisar");
      return;
    }

    try {
      setAnalisando(true);
      setProgresso(10);
      setResultado(null);

      // Criar conversa com o agente
      const conversation = await base44.agents.createConversation({
        agent_name: "analisador_projetos",
        metadata: {
          name: `Análise Unidade ${unidadeId}`,
          unidade_id: unidadeId,
        }
      });

      setConversationId(conversation.id);
      setProgresso(20);

      // Preparar URLs dos projetos
      const arquivosUrls = projetosArquitetonicos.map(p => p.arquivo_url);

      // Enviar mensagem ao agente com os arquivos
      const prompt = `Analise os projetos arquitetônicos anexados e extraia TODAS as informações possíveis sobre a unidade:

Unidade ID: ${unidadeId}

Por favor, retorne um JSON completo com a seguinte estrutura:

{
  "area_total": número,
  "area_construida": número,
  "quartos": número,
  "banheiros": número,
  "suites": número,
  "vagas_garagem": número,
  "quantidade_pavimentos": número,
  "tem_laje": boolean,
  "tipo_laje": "pre_moldada" | "convencional" | "nervurada" | "protendida",
  "pe_direito": número,
  "tipo_fundacao": "sapata" | "radier" | "estaca" | "tubulao",
  "tipo_estrutura": "alvenaria_estrutural" | "concreto_armado" | "metalica" | "madeira" | "mista",
  "padrao_obra": "medio_baixo" | "medio" | "alto" | "luxo",
  "detalhamento_pavimentos": {
    "pavimento_terreo": {
      "quartos": [{"nome": string, "area_m2": number, "eh_suite": boolean, "tem_closet": boolean, "tem_sacada": boolean}],
      "salas": [{"tipo": string, "area_m2": number, "tem_lareira": boolean}],
      "cozinha": {"tipo": string, "area_m2": number, "tem_ilha": boolean, "tem_copa": boolean},
      "banheiros_sociais": number,
      "lavabo": boolean,
      "area_gourmet": {"possui": boolean, "area_m2": number, "tem_churrasqueira": boolean},
      "area_servico": {"possui": boolean, "area_m2": number}
    },
    "pavimento_superior": {
      "possui": boolean,
      "quartos": [],
      "salas": [],
      "banheiros_sociais": number
    },
    "areas_externas": {
      "piscina": {"possui": boolean, "tipo": string, "tamanho_m2": number},
      "jardim": {"possui": boolean, "area_m2": number}
    }
  },
  "incluir_ar_condicionado": boolean,
  "incluir_energia_solar": boolean,
  "incluir_aquecimento_solar": boolean,
  "incluir_automacao": boolean,
  "incluir_sistema_seguranca": boolean,
  "incluir_paisagismo": boolean,
  "observacoes_projeto": string,
  "confianca_analise": número de 0 a 100
}

Após analisar, atualize a Unidade com ID ${unidadeId} com os dados extraídos.`;

      await base44.agents.addMessage(conversation, {
        role: "user",
        content: prompt,
        file_urls: arquivosUrls
      });

      setProgresso(30);

      // Aguardar a resposta do agente (polling)
      let tentativas = 0;
      const maxTentativas = 60; // 60 segundos

      const verificarResposta = setInterval(async () => {
        tentativas++;
        
        if (tentativas > maxTentativas) {
          clearInterval(verificarResposta);
          setAnalisando(false);
          toast.error("Timeout na análise. Tente novamente.");
          return;
        }

        const conv = await base44.agents.getConversation(conversation.id);
        const lastMsg = conv.messages[conv.messages.length - 1];

        if (lastMsg.role === 'assistant' && !lastMsg.tool_calls) {
          clearInterval(verificarResposta);
          setProgresso(100);
          
          // Extrair JSON da resposta
          try {
            const jsonMatch = lastMsg.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const dadosExtraidos = JSON.parse(jsonMatch[0]);
              setResultado(dadosExtraidos);
              
              toast.success("✅ Análise concluída! Dados extraídos com sucesso.");
              
              if (onAnaliseCompleta) {
                onAnaliseCompleta(dadosExtraidos);
              }
            }
          } catch (e) {
            console.error("Erro ao parsear JSON:", e);
          }
          
          setAnalisando(false);
        } else {
          setProgresso(prev => Math.min(prev + 2, 90));
        }
      }, 1000);

    } catch (error) {
      console.error("Erro na análise:", error);
      toast.error("Erro ao analisar projetos: " + error.message);
      setAnalisando(false);
    }
  };

  return (
    <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Brain className="w-6 h-6" />
          Análise Inteligente de Projetos
          <Badge className="bg-purple-600 text-white">IA</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analisando && !resultado && (
          <>
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                A IA irá analisar todos os projetos anexados e preencher automaticamente os dados da unidade.
                <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
                  <li>Lê plantas baixas, cortes e fachadas</li>
                  <li>Extrai medidas e áreas de ambientes</li>
                  <li>Identifica características e acabamentos</li>
                  <li>Detecta padrão construtivo</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-semibold">
                  {projetosArquitetonicos.length} projeto(s) anexado(s)
                </p>
                <p className="text-xs text-gray-500">
                  {projetosArquitetonicos.map(p => p.nome).join(", ")}
                </p>
              </div>
            </div>

            <Button
              onClick={iniciarAnalise}
              disabled={!unidadeId || projetosArquitetonicos.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Analisar Projetos com IA
            </Button>
          </>
        )}

        {analisando && (
          <div className="space-y-4">
            <Alert className="bg-purple-50 border-purple-200">
              <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
              <AlertDescription className="text-purple-800">
                <p className="font-semibold">Analisando projetos...</p>
                <p className="text-xs mt-1">
                  A IA está processando os arquivos. Isso pode levar 30-60 segundos.
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progresso da Análise</span>
                <span className="font-bold text-purple-700">{progresso}%</span>
              </div>
              <Progress value={progresso} className="h-3" />
            </div>

            {messages.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-2">
                {messages
                  .filter(m => m.role === 'assistant')
                  .slice(-3)
                  .map((msg, idx) => (
                    <p key={idx} className="text-xs text-gray-600 italic">
                      {msg.content?.substring(0, 100)}...
                    </p>
                  ))}
              </div>
            )}
          </div>
        )}

        {resultado && (
          <Alert className="bg-green-50 border-green-300">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <AlertDescription className="text-green-800">
              <p className="font-bold mb-2">✅ Análise Concluída!</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {resultado.quartos > 0 && (
                  <div className="p-2 bg-white rounded">
                    <p className="text-gray-600">Quartos</p>
                    <p className="font-bold text-lg">{resultado.quartos}</p>
                  </div>
                )}
                {resultado.suites > 0 && (
                  <div className="p-2 bg-white rounded">
                    <p className="text-gray-600">Suítes</p>
                    <p className="font-bold text-lg">{resultado.suites}</p>
                  </div>
                )}
                {resultado.banheiros > 0 && (
                  <div className="p-2 bg-white rounded">
                    <p className="text-gray-600">Banheiros</p>
                    <p className="font-bold text-lg">{resultado.banheiros}</p>
                  </div>
                )}
                {resultado.area_construida > 0 && (
                  <div className="p-2 bg-white rounded">
                    <p className="text-gray-600">Área</p>
                    <p className="font-bold text-lg">{resultado.area_construida}m²</p>
                  </div>
                )}
              </div>
              {resultado.confianca_analise && (
                <p className="text-xs mt-2">
                  Confiança: <strong>{resultado.confianca_analise}%</strong>
                </p>
              )}
              {resultado.observacoes_projeto && (
                <p className="text-xs mt-2 italic">{resultado.observacoes_projeto}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}