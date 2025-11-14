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
      const msgs = data?.messages || [];
      setMessages(msgs);
      addLog(`📨 ${msgs.length} mensagem(ns)`);
      
      if (msgs.length > 0) {
        const lastMessage = msgs[msgs.length - 1];
        if (lastMessage?.role === 'assistant') {
          setProgresso(prev => Math.min(prev + 10, 95));
        }
      }
    });

    return () => unsubscribe();
  }, [conversationId]);

  const processarResposta = (mensagemAssistente) => {
    try {
      addLog("🔍 Processando resposta...");
      
      const content = mensagemAssistente?.content || "";
      addLog(`📏 ${content.length} caracteres`);
      
      let dadosExtraidos = null;
      
      // Tentar extrair JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          dadosExtraidos = JSON.parse(jsonMatch[0]);
          addLog("✅ JSON válido extraído!");
        } catch (e) {
          addLog("❌ JSON inválido: " + e.message);
        }
      }
      
      if (dadosExtraidos && Object.keys(dadosExtraidos).length > 0) {
        setResultado(dadosExtraidos);
        setProgresso(100);
        setShowDialog(true);
        return true;
      } else {
        addLog("⚠️ Sem JSON. Mostrando texto bruto.");
        setResultado({ 
          resposta_texto: content,
          erro: "A IA não conseguiu ler o PDF. Pode ser um arquivo de imagem (JPG/PNG) ou PDF escaneado sem OCR." 
        });
        setProgresso(100);
        setShowDialog(true);
        return true;
      }
    } catch (e) {
      addLog(`❌ Erro fatal: ${e.message}`);
      toast.error("Erro ao processar: " + e.message);
      return false;
    }
  };

  const iniciarAnalise = async () => {
    if (!unidadeId) {
      toast.error("❌ Salve a unidade primeiro");
      return;
    }

    if (!Array.isArray(projetosArquitetonicos) || projetosArquitetonicos.length === 0) {
      toast.error("❌ Adicione pelo menos um projeto na aba 'Projetos'");
      return;
    }

    try {
      setAnalisando(true);
      setProgresso(10);
      setResultado(null);
      setLogs([]);
      setShowDialog(false);
      addLog("🚀 Iniciando análise IA...");

      const conversation = await base44.agents.createConversation({
        agent_name: "analisador_projetos",
        metadata: {
          name: `Análise Unidade ${unidadeId}`,
          unidade_id: unidadeId,
        }
      });

      setConversationId(conversation.id);
      setProgresso(20);
      addLog(`✅ Conversa criada: ${conversation.id}`);

      const arquivosUrls = projetosArquitetonicos
        .filter(p => p?.arquivo_url)
        .map(p => p.arquivo_url);
      
      addLog(`📁 ${arquivosUrls.length} arquivo(s) anexado(s)`);
      arquivosUrls.forEach((url, i) => addLog(`  ${i+1}. ${url.split('/').pop()}`));

      if (arquivosUrls.length === 0) {
        throw new Error("Nenhum arquivo válido encontrado");
      }

      const prompt = `Analise o projeto arquitetônico anexado em PDF.

LEIA TODO O PDF e EXTRAIA:
- Quantidade de quartos (total e quais são suítes)
- Quantidade de salas (estar, jantar, tv, etc)
- Cozinha (tipo, área)
- Banheiros (quantos, se tem lavabo)
- Garagem (quantas vagas)
- Áreas de cada ambiente em m²
- Altura (pé-direito)
- Quantidade de pavimentos
- Tipo de laje e estrutura
- Itens especiais (ar condicionado, piscina, churrasqueira, etc)

RETORNE APENAS JSON VÁLIDO (sem texto antes ou depois):

{
  "area_construida": 120.0,
  "quartos": 3,
  "suites": 1,
  "banheiros": 2,
  "vagas_garagem": 2,
  "quantidade_pavimentos": 1,
  "pe_direito": 2.8,
  "tipo_laje": "convencional",
  "padrao_obra": "medio",
  "detalhamento_pavimentos": {
    "pavimento_terreo": {
      "quartos": [{"nome": "Suíte Master", "area_m2": 18.5, "eh_suite": true, "tem_closet": true}],
      "salas": [{"tipo": "estar", "area_m2": 25.0}],
      "cozinha": {"tipo": "americana", "area_m2": 12.0},
      "banheiros_sociais": 1,
      "lavabo": true
    }
  },
  "observacoes_projeto": "descrição do que encontrou",
  "confianca_analise": 85
}`;

      addLog("📤 Enviando para agente IA...");
      
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: prompt,
        file_urls: arquivosUrls
      });

      setProgresso(40);
      addLog("✅ Mensagem enviada! Aguardando IA...");

      // Polling melhorado
      let tentativas = 0;
      const maxTentativas = 120;

      const verificar = async () => {
        try {
          tentativas++;
          
          if (tentativas > maxTentativas) {
            setAnalisando(false);
            toast.error("⏱️ Timeout - demorou muito (2min)");
            addLog("⏱️ Timeout alcançado");
            return;
          }

          const conv = await base44.agents.getConversation(conversation.id);
          const msgs = conv?.messages || [];
          
          if (msgs.length > 1) {
            const lastMsg = msgs[msgs.length - 1];
            
            if (lastMsg?.role === 'assistant' && lastMsg?.content) {
              const toolsPendentes = (lastMsg.tool_calls || []).some(
                tc => tc.status === 'running' || tc.status === 'in_progress'
              );
              
              if (!toolsPendentes) {
                addLog("✅ IA terminou! Processando...");
                processarResposta(lastMsg);
                setAnalisando(false);
                return;
              } else {
                addLog(`⏳ Aguardando tools... (${tentativas}s)`);
              }
            }
          }

          setProgresso(prev => Math.min(prev + 0.5, 95));
          setTimeout(verificar, 1000);
          
        } catch (error) {
          addLog(`❌ Erro polling: ${error.message}`);
          setTimeout(verificar, 2000);
        }
      };

      setTimeout(verificar, 3000);

    } catch (error) {
      addLog(`❌ Erro fatal: ${error.message}`);
      toast.error("Erro: " + error.message);
      setAnalisando(false);
      setProgresso(0);
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

  const projetosValidos = Array.isArray(projetosArquitetonicos) ? projetosArquitetonicos : [];

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
                  <p className="mt-2 font-semibold text-xs text-blue-900">
                    ⚠️ Funciona melhor com PDFs vetoriais (não escaneados)
                  </p>
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <FileText className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {projetosValidos.length} projeto(s) para análise
                  </p>
                  {projetosValidos.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {projetosValidos.map(p => p?.nome || 'Sem nome').join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={iniciarAnalise}
                disabled={!unidadeId || projetosValidos.length === 0}
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

              <div className="p-3 bg-gray-900 text-green-400 rounded border font-mono text-xs max-h-48 overflow-y-auto">
                {logs.slice(-12).map((log, idx) => (
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
                <p className="text-sm mt-1">Revise os dados extraídos antes de aplicar</p>
                <Button
                  onClick={() => setShowDialog(true)}
                  className="w-full mt-3 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  📊 Ver Resultados e Aplicar
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