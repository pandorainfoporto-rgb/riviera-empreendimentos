
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, Send, Sparkles, Lightbulb } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

export default function AssistenteRiviera({ currentPage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentPage && !isOpen) {
      const timer = setTimeout(() => {
        const suggestions = {
          'Dashboard': 'Vejo que você está no Dashboard! 📊 Posso te mostrar como interpretar os indicadores?',
          'Negociacoes': 'Olá! 🍷 Vejo que você está gerenciando negociações. Posso te ajudar com o fluxo de vendas?',
          'Pagar': 'Opa! 💰 Gerenciando pagamentos? Posso explicar como otimizar seu fluxo de contas a pagar!',
          'Receber': 'Buongiorno! 💵 Acompanhando recebimentos? Tenho dicas sobre gestão de contas a receber!',
          'PagamentosClientes': 'Ciao! 🏠 Vejo pagamentos de clientes. Precisa de ajuda com cobranças?',
          'Consorcios': 'Ei! 🎯 Gerenciando consórcios? Posso explicar todo o fluxo para você!',
          'CronogramaObra': 'Olá! 🏗️ Cronograma de obra! Posso te ajudar a otimizar o planejamento?',
          'Clientes': 'Buonasera! 👥 Cadastrando clientes? Tenho dicas de melhores práticas!',
          'Unidades': 'Salve! 🏘️ Gerenciando unidades? Posso te mostrar recursos avançados!',
        };

        const sugestao = suggestions[currentPage] || 'Ciao! 🍷 Sou o Bacco, seu assistente. Precisa de ajuda?';
        setSuggestion(sugestao);
        setShowSuggestion(true);

        setTimeout(() => {
          setShowSuggestion(false);
        }, 8000);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentPage, isOpen]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const initConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "assistente_riviera",
        metadata: {
          name: "Chat com Bacco",
          page_context: currentPage,
        }
      });
      setConversation(conv);
      
      const welcomeMessages = {
        'Negociacoes': 'Olá! 🍷 Sou o Bacco, seu assistente da Riviera. Vejo que você está na área de Negociações. Posso te ajudar a entender melhor como criar negociações, gerar parcelas ou calcular comissões. O que você gostaria de saber?',
        'Pagar': 'Buongiorno! 🍷 Estou aqui para te ajudar com as Contas a Pagar. Posso explicar como registrar pagamentos, organizar fornecedores ou acompanhar despesas. Como posso te auxiliar?',
        'Receber': 'Ciao! 🍷 Vejo que você está na área de Recebimentos. Posso te mostrar como registrar recebimentos de clientes, gerenciar aportes de sócios ou acompanhar contas a receber. No que posso te ajudar?',
        'PagamentosClientes': 'Ciao! 🍷 Vejo que você está gerenciando recebimentos de clientes. Posso te ajudar com o fluxo de cobranças, integração com Asaas ou qualquer dúvida sobre pagamentos. O que você precisa?',
        'Dashboard': 'Olá! 🍷 Bem-vindo ao Dashboard! Aqui você tem uma visão geral do negócio. Posso te explicar os indicadores, sugerir relatórios ou orientar sobre qualquer funcionalidade. O que você precisa?',
      };

      setMessages([{
        role: 'assistant',
        content: welcomeMessages[currentPage] || 'Ciao! 🍷 Sou o Bacco, seu assistente pessoal da Riviera Incorporadora. Estou aqui para te ajudar com qualquer dúvida sobre o sistema. Como posso te auxiliar hoje?'
      }]);

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages(data.messages);
        if (data.messages.length > 0 && data.messages[data.messages.length - 1].role === 'assistant') {
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      setIsLoading(false);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    setShowSuggestion(false);
    
    if (!conversation) {
      await initConversation();
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !conversation || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage,
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setIsLoading(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.'
      }]);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {showSuggestion && !isOpen && (
          <div className="absolute bottom-20 right-0 mb-2 animate-bounce">
            <Card className="p-3 shadow-xl max-w-xs bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5 animate-pulse" />
                <p className="text-sm text-gray-800">{suggestion}</p>
              </div>
            </Card>
          </div>
        )}

        <Button
          onClick={handleOpen}
          className="relative h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-[#722F37] via-[#8B4367] to-[#6B2F5E] hover:scale-110 transition-all duration-300 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30"></div>
          
          <svg viewBox="0 0 100 100" className="w-20 h-20"> {/* Changed w-10 h-10 to w-20 h-20 */}
            <ellipse cx="50" cy="35" rx="20" ry="22" fill="#F3E5F5" style={{ animation: 'float 3s ease-in-out infinite' }} />
            <circle cx="43" cy="32" r="3" fill="#722F37" style={{ animation: 'blink 4s ease-in-out infinite' }} />
            <circle cx="57" cy="32" r="3" fill="#722F37" style={{ animation: 'blink 4s ease-in-out infinite' }} />
            <path d="M 42 40 Q 50 45 58 40" stroke="#722F37" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <line x1="50" y1="13" x2="50" y2="8" stroke="#8B4367" strokeWidth="2" />
            <circle cx="50" cy="8" r="3" fill="#8B4367" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
            <circle cx="48" cy="6" r="2" fill="#9C5A7D" />
            <circle cx="52" cy="6" r="2" fill="#9C5A7D" />
            <rect x="35" y="50" width="30" height="25" rx="5" fill="#E1BEE7" />
            <path d="M 45 58 L 50 55 L 55 58 L 52 63 L 48 63 Z" fill="#8B4367" opacity="0.3" />
            <rect x="25" y="52" width="8" height="15" rx="3" fill="#F3E5F5" style={{ transformOrigin: 'top', animation: 'wave-left 2s ease-in-out infinite' }} />
            <rect x="67" y="52" width="8" height="15" rx="3" fill="#F3E5F5" style={{ transformOrigin: 'top', animation: 'wave-right 2s ease-in-out infinite' }} />
            <rect x="40" y="77" width="8" height="12" rx="3" fill="#F3E5F5" />
            <rect x="52" y="77" width="8" height="12" rx="3" fill="#F3E5F5" />
            <circle cx="70" cy="25" r="1.5" fill="#FFD700" style={{ animation: 'sparkle 2s ease-in-out infinite' }} />
            <circle cx="30" cy="30" r="1" fill="#FFD700" style={{ animation: 'sparkle 2s ease-in-out infinite 1s' }} />
          </svg>

          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-3px); }
            }
            @keyframes blink {
              0%, 90%, 100% { opacity: 1; }
              95% { opacity: 0; }
            }
            @keyframes wave-left {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(-10deg); }
            }
            @keyframes wave-right {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(10deg); }
            }
            @keyframes sparkle {
              0%, 100% { opacity: 0; transform: scale(0); }
              50% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </Button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] z-50 shadow-2xl rounded-2xl overflow-hidden border-2 border-[#722F37] bg-white">
          <div className="bg-gradient-to-r from-[#722F37] via-[#8B4367] to-[#6B2F5E] p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  🍷
                </div>
                <div>
                  <h3 className="font-bold">Bacco</h3>
                  <p className="text-xs text-purple-100">Seu assistente Riviera</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="h-[calc(100%-140px)] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-purple-50/30 to-white">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-[#722F37] to-[#8B4367] text-white'
                      : 'bg-white border-2 border-purple-100 text-gray-800'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🍷</span>
                      <span className="font-semibold text-sm text-purple-900">Bacco</span>
                    </div>
                  )}
                  
                  {msg.role === 'user' ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <ReactMarkdown 
                      className="text-sm prose prose-sm prose-purple max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="ml-4 list-disc mb-2">{children}</ul>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold text-purple-900">{children}</strong>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}

                  {msg.tool_calls?.map((tool, toolIdx) => (
                    <div key={toolIdx} className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-xs text-purple-700 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {tool.name}
                      </p>
                      {tool.status === 'completed' && (
                        <p className="text-xs text-green-600 mt-1">✓ Concluído</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-purple-100 rounded-2xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🍷</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t-2 border-purple-100">
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-gradient-to-r from-[#722F37] to-[#8B4367] hover:opacity-90"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes blink {
          0%, 90%, 100% { opacity: 1; }
          95% { opacity: 0; }
        }
        @keyframes wave-left {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-10deg); }
        }
        @keyframes wave-right {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(10deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
