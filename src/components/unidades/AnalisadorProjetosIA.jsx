import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { 
  Brain, Loader2, CheckCircle2, AlertCircle, 
  FileText, Info, Sparkles, RefreshCw 
} from "lucide-react";
import { toast } from "sonner";
import DialogResultadoAnalise from "./DialogResultadoAnalise";

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
  const [logs, setLogs] = useState([]);
  const [showDialog, setShowDialog] = useState(false);

  const addLog = (msg) => {
    console.log("[IA Análise]", msg);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
      addLog(`Mensagens: ${data.messages?.length || 0}`);
      
      if (data.messages && data.messages.length > 0) {
        const lastMessage = data.messages[data.messages.length - 1];
        
        if (lastMessage.role === 'assistant') {
          setProgresso(prev => Math.min(prev + 10, 95));
        }
      }
    });

    return () => unsubscribe();
  }, [conversationId]);

  const processarResposta = (mensagemAssistente) => {
    try {
      addLog("Processando resposta...");
      
      const content = mensagemAssistente.content || "";
      addLog(`Tamanho: ${content.length} chars`);
      
      // Tentar extrair JSON com múltiplos padrões
      let dadosExtraidos = null;
      
      // Padrão 1: JSON direto
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          dadosExtraidos = JSON.parse(jsonMatch[0]);
          addLog("✅ JSON extraído!");
        } catch (e) {
          addLog("❌ Erro ao parsear JSON: " + e.message);
        }
      }
      
      if (dadosExtraidos) {
        setResultado(dadosExtraidos);
        setProgresso(100);
        setShowDialog(true);
        return true;
      } else {
        // Fallback: mostrar resposta como texto
        addLog("⚠️ Nenhum JSON válido. Mostrando texto.");
        setResultado({ 
          resposta_texto: content,
          erro: "Não foi possível extrair dados estruturados. A IA não conseguiu ler o projeto corretamente." 
        });
        setProgresso(100);
        setShowDialog(true);
        return true;
      }
    } catch (e) {
      addLog(`❌ Erro fatal: ${e.message}`);
      return false;
    }
  };

  const iniciarAnalise = async () => {
    if (!unidadeId) {
      toast.error("Salve a unidade primeiro");
      return;
    }

    if (!projetosArquitetonicos || projetosArquitetonicos.length === 0) {
      toast.error("Adicione pelo menos um projeto");
      return;
    }

    try {
      setAnalisando(true);
      setProgresso(10);
      setResultado(null);
      setLogs([]);
      setShowDialog(false);
      addLog("🚀 Iniciando análise...");

      const conversation = await base44.agents.createConversation({
        agent_name: "analisador_projetos",
        metadata: {
          name: `Análise Unidade ${unidadeId}`,
          unidade_id: unidadeId,
        }
      });

      setConversationId(conversation.id);
      setProgresso(20);
      addLog(`✅ Conversa: ${conversation.id}`);

      const arquivosUrls = (projetosArquitetonicos || [])
        .filter(p => p && p.arquivo_url)
        .map(p => p.arquivo_url);
      
      addLog(`📁 ${arquivosUrls.length} arquivo(s)`);

      const prompt = `VOCÊ É UM ARQUITETO ESPECIALISTA. Analise DETALHADAMENTE o(s) projeto(s) arquitetônico(s) em PDF anexado(s).

INSTRUÇÕES:
1. Leia TODAS as páginas do PDF
2. Identifique plantas baixas, cortes, fachadas
3. Extraia TODAS as medidas e cotas visíveis
4. Conte TODOS os ambientes

RETORNE APENAS UM JSON VÁLIDO (SEM TEXTO ADICIONAL) com esta estrutura:

{
  "area_total": [número],
  "area_construida": [número],
  "quartos": [número total de quartos],
  "suites": [número de suítes],
  "banheiros": [número total],
  "vagas_garagem": [número],
  "quantidade_pavimentos": [número],
  "pe_direito": [número em metros],
  "tipo_laje": "convencional",
  "tipo_fundacao": "radier",
  "tipo_estrutura": "concreto_armado",
  "padrao_obra": "medio",
  "detalhamento_pavimentos": {
    "pavimento_terreo": {
      "quartos": [{"nome": "string", "area_m2": 0, "eh_suite": false, "tem_closet": false}],
      "salas": [{"tipo": "estar", "area_m2": 0}],
      "cozinha": {"tipo": "americana", "area_m2": 0, "tem_ilha": false},
      "banheiros_sociais": 0,
      "lavabo": false
    }
  },
  "incluir_ar_condicionado": false,
  "incluir_energia_solar": false,
  "observacoes_projeto": "descrição detalhada do que foi encontrado no projeto",
  "confianca_analise": 80
}`;

      addLog("📤 Enviando para IA...");
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: prompt,
        file_urls: arquivosUrls
      });

      setProgresso(40);
      addLog("✅ Enviado! Aguardando...");

      // Polling
      let tentativas = 0;
      const maxTentativas = 120;

      const verificar = async () => {
        try {
          tentativas++;
          
          if (tentativas > maxTentativas) {
            setAnalisando(false);
            toast.error("Timeout - A análise demorou muito");
            addLog("⏱️ Timeout");
            return;
          }

          const conv = await base44.agents.getConversation(conversation.id);
          const msgs = conv.messages || [];
          
          if (msgs.length > 1) {
            const lastMsg = msgs[msgs.length - 1];
            
            if (lastMsg.role === 'assistant' && lastMsg.content) {
              const pendentes = lastMsg.tool_calls?.some(
                tc => !tc.results || tc.status === 'running' || tc.status === 'in_progress'
              );
              
              if (!pendentes) {
                addLog("✅ Resposta completa!");
                processarResposta(lastMsg);
                setAnalisando(false);
                return;
              }
            }
          }

          setProgresso(prev => Math.min(prev + 0.5, 95));
          setTimeout(verificar, 1000);
          
        } catch (error) {
          addLog(`❌ ${error.message}`);
          setTimeout(verificar, 2000);
        }
      };

      setTimeout(verificar, 3000);

    } catch (error) {
      addLog(`❌ Erro: ${error.message}`);
      toast.error("Erro: " + error.message);
      setAnalisando(false);
    }
  };

  const reiniciarAnalise = () => {
    setConversationId(null);
    setMessages([]);
    setAnalisando(false);
    setProgresso(0);
    setResultado(null);
    setLogs([]);
    setShowDialog(false);
  };

  return (
    <>
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
                  A IA lerá o PDF do projeto e extrairá automaticamente:
                  <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
                    <li>Quantidade de quartos, suítes, salas e banheiros</li>
                    <li>Áreas de cada ambiente em m²</li>
                    <li>Características (closets, sacadas, lavabo, etc)</li>
                    <li>Vagas de garagem e itens especiais</li>
                    <li>Padrão construtivo e estrutural</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <FileText className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-semibold">
                    {projetosArquitetonicos.length} projeto(s) para análise
                  </p>
                  {projetosArquitetonicos.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {projetosArquitetonicos.map(p => p.nome).join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={iniciarAnalise}
                disabled={!unidadeId || projetosArquitetonicos.length === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 h-14 text-lg"
              >
                <Sparkles className="w-6 h-6 mr-2" />
                Iniciar Análise com IA
              </Button>
            </>
          )}

          {analisando && (
            <div className="space-y-4">
              <Alert className="bg-purple-50 border-purple-200">
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                <AlertDescription className="text-purple-800">
                  <p className="font-semibold">🧠 IA Analisando Projeto...</p>
                  <p className="text-xs mt-1">
                    Lendo PDF, extraindo dados, identificando ambientes...
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progresso</span>
                  <span className="font-bold text-purple-700">{progresso.toFixed(0)}%</span>
                </div>
                <Progress value={progresso} className="h-3" />
              </div>

              <div className="p-3 bg-gray-900 text-green-400 rounded border font-mono text-xs max-h-40 overflow-y-auto">
                {logs.slice(-8).map((log, idx) => (
                  <p key={idx}>{log}</p>
                ))}
              </div>
            </div>
          )}

          {resultado && !analisando && (
            <Alert className="bg-green-50 border-green-300">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <AlertDescription className="text-green-800">
                <p className="font-bold">✅ Análise Concluída!</p>
                <p className="text-sm mt-1">Clique no botão abaixo para revisar os dados extraídos</p>
                <Button
                  onClick={() => setShowDialog(true)}
                  className="w-full mt-3 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  Ver Resultados e Aplicar
                </Button>
                <Button
                  onClick={reiniciarAnalise}
                  variant="outline"
                  className="w-full mt-2"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Analisar Novamente
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <DialogResultadoAnalise
        open={showDialog}
        onClose={() => setShowDialog(false)}
        resultado={resultado}
        onAceitar={(dados) => {
          if (onAnaliseCompleta) {
            onAnaliseCompleta(dados);
          }
          toast.success("✅ Dados aplicados ao formulário!");
        }}
      />
    </>
  );
}