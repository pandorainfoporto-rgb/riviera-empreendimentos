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

  const addLog = (msg) => {
    console.log("[IA Análise]", msg);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
      addLog(`Mensagens atualizadas: ${data.messages?.length || 0}`);
      
      if (data.messages && data.messages.length > 0) {
        const lastMessage = data.messages[data.messages.length - 1];
        addLog(`Última mensagem: ${lastMessage.role} - ${lastMessage.content?.substring(0, 50)}...`);
        
        if (lastMessage.role === 'assistant') {
          setProgresso(prev => Math.min(prev + 15, 95));
        }
      }
    });

    return () => unsubscribe();
  }, [conversationId]);

  const processarResposta = (mensagemAssistente) => {
    try {
      addLog("Processando resposta do assistente...");
      
      const content = mensagemAssistente.content || "";
      addLog(`Conteúdo: ${content.substring(0, 100)}...`);
      
      // Tentar extrair JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const dadosExtraidos = JSON.parse(jsonMatch[0]);
        addLog("JSON extraído com sucesso!");
        setResultado(dadosExtraidos);
        setProgresso(100);
        toast.success("✅ Análise concluída! Dados extraídos com sucesso.");
        
        if (onAnaliseCompleta) {
          onAnaliseCompleta(dadosExtraidos);
        }
        return true;
      } else {
        addLog("Nenhum JSON encontrado na resposta");
        // Mostrar a resposta mesmo sem JSON estruturado
        setResultado({ 
          resposta_texto: content,
          erro: "Não foi possível extrair dados estruturados" 
        });
        setProgresso(100);
        toast.warning("Análise concluída, mas não foi possível extrair dados estruturados.");
        return true;
      }
    } catch (e) {
      addLog(`Erro ao processar: ${e.message}`);
      console.error("Erro ao parsear resposta:", e);
      return false;
    }
  };

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
      setLogs([]);
      addLog("Iniciando análise...");

      // Criar conversa com o agente
      addLog("Criando conversa com agente...");
      const conversation = await base44.agents.createConversation({
        agent_name: "analisador_projetos",
        metadata: {
          name: `Análise Unidade ${unidadeId}`,
          unidade_id: unidadeId,
        }
      });

      setConversationId(conversation.id);
      setProgresso(20);
      addLog(`Conversa criada: ${conversation.id}`);

      // Preparar URLs dos projetos
      const arquivosUrls = projetosArquitetonicos.map(p => p.arquivo_url);
      addLog(`${arquivosUrls.length} arquivo(s) para análise`);

      // Enviar mensagem ao agente com os arquivos
      const prompt = `Analise detalhadamente os projetos arquitetônicos anexados.

Para cada projeto, extraia:
- Áreas de todos os ambientes (m²)
- Quantidade de quartos, suítes, banheiros
- Características especiais (closet, sacada, lavabo, etc)
- Vagas de garagem
- Tipo de laje, fundação e estrutura
- Padrão de acabamento
- Itens especiais (piscina, churrasqueira, automação, etc)

Retorne um JSON válido com TODOS os dados encontrados seguindo esta estrutura:
{
  "area_total": 0,
  "area_construida": 0,
  "quartos": 0,
  "banheiros": 0,
  "vagas_garagem": 0,
  "detalhamento_pavimentos": {},
  "observacoes_projeto": "descrição do que foi encontrado",
  "confianca_analise": 85
}`;

      addLog("Enviando mensagem ao agente...");
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: prompt,
        file_urls: arquivosUrls
      });

      setProgresso(30);
      addLog("Mensagem enviada. Aguardando resposta...");

      // Aguardar resposta (polling)
      let tentativas = 0;
      const maxTentativas = 90; // 90 segundos

      const verificarResposta = async () => {
        try {
          tentativas++;
          addLog(`Tentativa ${tentativas}/${maxTentativas}`);
          
          if (tentativas > maxTentativas) {
            setAnalisando(false);
            setProgresso(0);
            toast.error("Timeout na análise. Tente novamente.");
            addLog("Timeout atingido");
            return;
          }

          const conv = await base44.agents.getConversation(conversation.id);
          const msgs = conv.messages || [];
          
          if (msgs.length > 1) {
            const lastMsg = msgs[msgs.length - 1];
            
            // Verificar se é uma resposta do assistente sem tool_calls pendentes
            if (lastMsg.role === 'assistant' && lastMsg.content) {
              addLog("Resposta do assistente recebida!");
              
              // Verificar se ainda há tool_calls em execução
              const temToolCallsPendentes = lastMsg.tool_calls?.some(
                tc => !tc.results || tc.status === 'running' || tc.status === 'in_progress'
              );
              
              if (!temToolCallsPendentes) {
                addLog("Nenhum tool_call pendente. Processando resposta...");
                const sucesso = processarResposta(lastMsg);
                if (sucesso) {
                  setAnalisando(false);
                  return;
                }
              } else {
                addLog("Tool calls ainda em execução...");
              }
            }
          }

          setProgresso(prev => Math.min(prev + 1, 90));
          
          // Continuar polling
          setTimeout(verificarResposta, 1000);
          
        } catch (error) {
          addLog(`Erro no polling: ${error.message}`);
          console.error("Erro ao verificar resposta:", error);
          setTimeout(verificarResposta, 2000);
        }
      };

      // Iniciar polling
      setTimeout(verificarResposta, 2000);

    } catch (error) {
      addLog(`Erro fatal: ${error.message}`);
      console.error("Erro na análise:", error);
      toast.error("Erro ao analisar projetos: " + error.message);
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
                  A IA está processando os arquivos. Isso pode levar 30-90 segundos.
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

            {logs.length > 0 && (
              <div className="p-3 bg-gray-50 rounded border max-h-32 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-700 mb-2">Log de Execução:</p>
                {logs.slice(-5).map((log, idx) => (
                  <p key={idx} className="text-xs text-gray-600 font-mono">{log}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {resultado && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-300">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <AlertDescription className="text-green-800">
                <p className="font-bold mb-2">✅ Análise Concluída!</p>
                
                {resultado.resposta_texto ? (
                  <div className="space-y-2">
                    <p className="text-sm whitespace-pre-wrap">{resultado.resposta_texto}</p>
                    {resultado.erro && (
                      <p className="text-xs text-amber-700 mt-2">⚠️ {resultado.erro}</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mt-3">
                      {resultado.quartos > 0 && (
                        <div className="p-2 bg-white rounded">
                          <p className="text-gray-600">Quartos</p>
                          <p className="font-bold text-lg">{resultado.quartos}</p>
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
                      {resultado.vagas_garagem > 0 && (
                        <div className="p-2 bg-white rounded">
                          <p className="text-gray-600">Garagem</p>
                          <p className="font-bold text-lg">{resultado.vagas_garagem}</p>
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
                  </>
                )}
              </AlertDescription>
            </Alert>

            <Button
              onClick={reiniciarAnalise}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Analisar Novamente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}