import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, BookOpen, Users, DollarSign, HardHat, 
  MessageSquare, Package, FileText, Settings, ChevronRight,
  BarChart, Shield, Lightbulb, AlertCircle
} from "lucide-react";

export default function Wiki() {
  const [searchTerm, setSearchTerm] = useState("");

  const sections = [
    {
      id: "inicio",
      title: "🚀 Começando",
      icon: Lightbulb,
      color: "blue",
      items: [
        {
          title: "Visão Geral do Sistema",
          content: `O Sistema Riviera é uma plataforma completa de gestão para incorporadoras, oferecendo:
          
• Gestão de Loteamentos e Unidades
• Controle Financeiro Completo
• Gestão de Obras e Cronogramas
• Portal do Cliente com acompanhamento em tempo real
• Sistema de Consórcios
• Relatórios Gerenciais Avançados
• Sistema de Mensagens Bidirecional

O sistema é dividido em módulos integrados que se comunicam entre si, proporcionando uma visão 360° do negócio.`
        },
        {
          title: "Primeiro Acesso",
          content: `1. Acesse o sistema através do link fornecido
2. Entre com suas credenciais de acesso
3. No primeiro acesso, você será solicitado a alterar sua senha
4. Explore o menu lateral organizado por áreas: Gestão, Relatórios, Configurações
5. Use os atalhos do Dashboard para acesso rápido às funcionalidades principais`
        },
        {
          title: "Navegação e Interface",
          content: `**Menu Lateral:**
O menu está organizado em 4 abas principais:
• 📊 Gestão: Cadastros e operações do dia-a-dia
• 📈 Relatórios: Análises e indicadores
• ⚙️ Configurações: Parametrizações do sistema
• 📚 Sobre: Wiki, documentação e changelog

**Dashboard:**
Acesso rápido aos principais indicadores e ações frequentes.

**Mobile:**
Interface completamente responsiva com zoom ajustável para melhor visualização.`
        }
      ]
    },
    {
      id: "cadastros",
      title: "📋 Cadastros",
      icon: FileText,
      color: "green",
      items: [
        {
          title: "Loteamentos",
          content: `Cadastro base para organização do sistema. Cada loteamento pode conter múltiplas unidades.

**Campos principais:**
• Nome e descrição
• Localização completa
• Área total
• Quantidade de lotes
• Status (planejamento, aprovação, aprovado, em comercialização, concluído)
• Documentação (matrícula, aprovações)

**Dica:** Organize por fase/etapa do empreendimento para melhor controle.`
        },
        {
          title: "Unidades",
          content: `Unidades são os produtos comercializados (lotes, apartamentos, casas).

**Informações principais:**
• Código único
• Tipo (apartamento, casa, lote, terreno)
• Áreas (total, construída)
• Medidas do lote (frente, fundo, laterais)
• Orientação solar
• Detalhamento completo (quartos, banheiros, ambientes)
• Status (disponível, reservada, vendida, escriturada)
• Valores (venda, custo)

**Novo:** Detalhamento por pavimentos com especificações completas de cada ambiente.`
        },
        {
          title: "Clientes",
          content: `Cadastro completo dos clientes compradores.

**Dados principais:**
• Identificação (nome, CPF, documentos)
• Contatos (telefone, email)
• Endereço completo
• Unidade adquirida
• Valor do contrato
• Acesso ao Portal do Cliente

**Portal do Cliente:**
• Envie convites automaticamente pelo sistema
• Cliente pode acompanhar obra, financeiro e documentos
• Sistema de mensagens integrado

**Importante:** Clientes com acesso ao portal recebem notificações automáticas.`
        },
        {
          title: "Fornecedores",
          content: `Cadastro de fornecedores de materiais e serviços.

**Informações principais:**
• Dados da empresa (CNPJ, razão social)
• Contatos (vendedor, telefone, email)
• Endereço e localização
• Tipos de serviço/produtos fornecidos
• Condições de pagamento
• Prazo de entrega padrão
• Dados bancários e PIX

**Dica:** Mantenha múltiplos fornecedores por categoria para comparação de preços.`
        },
        {
          title: "Sócios",
          content: `Gestão dos sócios/investidores do empreendimento.

**Informações:**
• Dados pessoais completos
• Participação por unidade (percentual e valor)
• Se atua também como fornecedor
• Histórico de aportes

**Importante:** Um sócio pode ter participações diferentes em múltiplas unidades.`
        }
      ]
    },
    {
      id: "financeiro",
      title: "💰 Financeiro",
      icon: DollarSign,
      color: "purple",
      items: [
        {
          title: "Fluxo de Caixa",
          content: `Controle centralizado de todas as movimentações financeiras.

**Tipos de Caixas:**
• Dinheiro físico
• Conta bancária
• Corretora de investimentos
• Gateway de pagamento

**Movimentações:**
• Entradas: recebimentos de clientes, aportes de sócios
• Saídas: pagamentos a fornecedores, despesas operacionais
• Transferências entre caixas
• Taxas de gateways (lançamento automático)

**Novo:** Dashboard financeiro com análise em tempo real e projeções.`
        },
        {
          title: "Negociações e Parcelas",
          content: `Sistema completo de negociação e parcelamento.

**Configurações:**
• Valor total
• Percentual e parcelas de entrada
• Quantidade de parcelas mensais
• Dia de vencimento
• Correção (mensal/anual por IGPM, IPCA, INCC)
• Comissões (imobiliária/corretor)

**Geração Automática:**
O sistema gera automaticamente todas as parcelas com:
• Datas de vencimento calculadas
• Valores corrigidos quando aplicável
• Juros e multa por atraso
• Status atualizado automaticamente

**Novo:** Simulador de financiamento integrado.`
        },
        {
          title: "Pagamentos de Clientes",
          content: `Gestão de recebimentos.

**Funcionalidades:**
• Listagem com filtros avançados
• Status: pendente, pago, atrasado
• Cálculo automático de juros e multa
• Múltiplas formas de pagamento
• Registro de comprovantes
• Baixa automática via gateway
• **Novo:** Pagamento online pelo portal do cliente

**Integrações:**
• Asaas (PIX, boleto, cartão)
• Notificações automáticas de vencimento
• Envio de links de pagamento`
        },
        {
          title: "Orçamentos",
          content: `Controle orçamentário por categoria e período.

**Recursos:**
• Definição de valor orçado por categoria/mês
• Comparação orçado vs realizado
• Alertas automáticos ao atingir % do orçamento
• Análise de desvios
• Projeções de gastos

**Novo Dashboard:**
• Gráficos comparativos
• Alertas visuais
• Recomendações de ajustes`
        },
        {
          title: "Investimentos",
          content: `Gestão de aplicações financeiras.

**Tipos de ativos:**
• Renda fixa (CDB, LCI, LCA)
• Renda variável (ações, fundos)
• Tesouro Direto
• Outros investimentos

**Controles:**
• Valor aplicado e data
• Rentabilidade (mensal/anual)
• Cálculo automático de rendimento
• Data de vencimento/resgate
• Impostos (IR)

**Relatórios:**
• Performance do portfólio
• Rentabilidade acumulada
• Comparativo entre investimentos`
        }
      ]
    },
    {
      id: "obras",
      title: "🏗️ Obras",
      icon: HardHat,
      color: "orange",
      items: [
        {
          title: "Cronograma de Obra",
          content: `Planejamento e acompanhamento de obras com Gantt Chart.

**Estrutura WBS:**
• Hierarquia de tarefas (tarefas pai e subtarefas)
• Marcos do projeto (milestones)
• Dependências entre tarefas
• Caminho crítico
• Folgas (total e livre)

**Gestão Avançada:**
• Alocação de recursos (equipe, materiais, equipamentos)
• Análise de valor agregado (EVM)
• Índices CPI e SPI
• Restrições de data
• Gestão de riscos

**Novo:** Visualização em Gantt Chart interativo.`
        },
        {
          title: "Custos de Obra",
          content: `Orçamentação detalhada por padrão de acabamento.

**Padrões disponíveis:**
• Médio/Baixo
• Médio
• Alto
• Luxo

**Cálculo automático:**
O sistema calcula automaticamente baseado em:
• Área total da construção
• Quantidade de cômodos
• Pavimentos
• Acabamentos especiais (piscina, área gourmet, etc.)

**Etapas orçadas:**
• Preparação do terreno
• Fundação e estrutura
• Alvenaria e cobertura
• Instalações (elétrica, hidráulica, gás)
• Revestimentos e acabamentos
• Sistemas especiais (solar, ar-condicionado, automação)
• Mobília e paisagismo

**Novo:** IA para sugestão de materiais e pesquisa automática de preços.`
        },
        {
          title: "Execução de Obra",
          content: `Acompanhamento da execução e registro de evidências.

**Documentação:**
• Fotos por etapa (antes/durante/depois)
• Upload de notas fiscais
• Contratos e recibos
• Projetos e plantas
• Documentação legal

**Checklist:**
• Itens de verificação por etapa
• Responsáveis
• Status de conclusão
• Prazos e alertas

**Integração:**
• Lançamento automático de despesas
• Atualização de percentual do cronograma
• Notificações ao cliente (portal)

**Novo:** Galeria de fotos organizada por etapa com timeline.`
        }
      ]
    },
    {
      id: "consorcios",
      title: "🎯 Consórcios",
      icon: Package,
      color: "cyan",
      items: [
        {
          title: "Gestão de Cotas",
          content: `Controle completo de cotas de consórcio.

**Tipos de cota:**
• Cota vinculada a cliente/unidade
• Cota de investimento (sem cliente)

**Informações:**
• Administradora
• Grupo e número da cota
• Valor da carta
• Parcelas (pagas/total)
• Encargos (fundo reserva, comum, taxa admin)
• Status de contemplação

**Novo:** Grid visual de cotas contempladas e disponíveis.`
        },
        {
          title: "Lances",
          content: `Gestão de lances para contemplação.

**Tipos de lance:**
• Percentual (% sobre valor da carta)
• Valor fixo

**Controles:**
• Registro de lances ofertados
• Data da assembleia
• Status (ativo, contemplado, perdido)
• Geração automática de pagamento quando contemplado

**Dica:** Acompanhe os resultados de assembleias para avaliar estratégia de lances.`
        },
        {
          title: "Contemplações e Comercialização",
          content: `Registro de contemplações e comercialização de cartas.

**Contemplação:**
• Registro de data e tipo (lance/sorteio)
• Cálculo e geração de pagamento de lance
• Atualização automática do status

**Comercialização:**
• Venda de carta contemplada
• Cálculo de lucro (R$ e %)
• Vinculação a novo cliente
• Documentação da transação

**Novo:** Relatório de rentabilidade por cota.`
        }
      ]
    },
    {
      id: "mensagens",
      title: "💬 Sistema de Mensagens",
      icon: MessageSquare,
      color: "pink",
      items: [
        {
          title: "Mensagens Cliente-Admin",
          content: `Sistema completo de comunicação bidirecional.

**Recursos:**
• Conversas agrupadas por assunto
• Status (aberto, em andamento, resolvido, fechado)
• Prioridades (baixa, normal, alta, urgente)
• Anexos de arquivos
• Notificações em tempo real
• Marcação de lidas/não lidas

**Assuntos disponíveis:**
• Geral
• Negociação
• Pagamento
• Documento
• Obra
• Financeiro
• Suporte

**Admin:**
• Filtros avançados (status, prioridade, assunto)
• Busca por cliente ou conteúdo
• Alteração de status da conversa
• Resposta rápida

**Cliente (Portal):**
• Iniciar nova conversa
• Ver histórico completo
• Receber notificações
• Anexar documentos

**Novo em v2.9.0:** Sistema completamente reformulado com melhor UX.`
        },
        {
          title: "Notificações",
          content: `Sistema de notificações inteligente.

**Tipos de notificação:**
• Nova mensagem
• Pagamento vencendo
• Pagamento vencido
• Documento disponível
• Atualização de obra
• Eventos do sistema

**Configurações:**
• Notificações no sistema (bell icon)
• Envio de email automático
• Prioridades
• Links diretos para conteúdo

**Importante:** Notificações não lidas aparecem com badge no header.`
        }
      ]
    },
    {
      id: "portal",
      title: "👤 Portal do Cliente",
      icon: Users,
      color: "indigo",
      items: [
        {
          title: "Configuração de Acesso",
          content: `Fornecendo acesso ao portal para clientes.

**Passo a passo:**
1. Cadastre o cliente normalmente
2. Na tela de Clientes, clique em "Gerenciar Acessos"
3. Envie convite por email
4. Cliente recebe link único
5. No primeiro acesso, cliente define sua senha
6. Acesso liberado ao portal

**Segurança:**
• Token único por convite
• Senha definida pelo próprio cliente
• Pode redefinir senha a qualquer momento
• Dados isolados por RLS (Row Level Security)

**Novo:** Interface de convites simplificada com envio automático.`
        },
        {
          title: "Funcionalidades do Portal",
          content: `O que o cliente pode fazer no portal:

**Dashboard:**
• Resumo da unidade
• Status de obra
• Pagamentos pendentes
• Últimas atualizações

**Minha Unidade:**
• Detalhes completos
• Documentação
• Medidas e características

**Cronograma:**
• Acompanhamento de obra
• Fotos por etapa
• Percentual de conclusão
• Próximas etapas

**Financeiro:**
• Parcelas pendentes e pagas
• **Novo:** Pagamento online (PIX, boleto, cartão)
• Histórico completo
• Download de comprovantes

**Documentos:**
• Contratos
• Plantas
• Aprovações
• Documentação legal

**Mensagens:**
• Conversar com a administração
• Histórico de conversas
• Anexar arquivos
• Receber notificações`
        }
      ]
    },
    {
      id: "relatorios",
      title: "📊 Relatórios",
      icon: BarChart,
      color: "red",
      items: [
        {
          title: "Relatórios Financeiros",
          content: `Análises financeiras completas.

**DRE (Demonstração de Resultado):**
• Receitas operacionais
• Custos e despesas
• Resultado líquido
• Comparativo por período
• Por loteamento ou consolidado

**Fluxo de Caixa:**
• Entradas e saídas
• Saldo por período
• Projeções futuras
• Análise de tendências

**Receitas x Despesas:**
• Comparativo mensal
• Gráficos evolutivos
• Categorização
• Desvios orçamentários

**Novo:** Relatórios com exportação para Excel/PDF.`
        },
        {
          title: "Relatórios de Obras",
          content: `Acompanhamento técnico e financeiro de obras.

**Cronograma:**
• Status por etapa
• Percentual de conclusão
• Atrasos e desvios
• Caminho crítico

**Execução:**
• Custos realizados vs orçados
• Produtividade
• Consumo de materiais
• Indicadores de qualidade

**Novo:** Análise de valor agregado (EVM) com CPI e SPI.`
        },
        {
          title: "Relatórios Gerenciais",
          content: `Visão estratégica do negócio.

**Unidades:**
• Status de comercialização
• Velocidade de vendas
• Ticket médio
• Unidades disponíveis por tipo

**Clientes:**
• Perfil de clientes
• Inadimplência
• Origem de captação
• CLV (Customer Lifetime Value)

**Fornecedores:**
• Principais fornecedores
• Volume de compras
• Performance (prazo, qualidade)
• Análise de preços

**Consórcios:**
• Rentabilidade
• Taxa de contemplação
• Lucro por comercialização
• Performance por administradora`
        },
        {
          title: "Relatório Consolidado",
          content: `Dashboard executivo com principais indicadores.

**KPIs principais:**
• Faturamento
• Margem de lucro
• ROI por empreendimento
• Inadimplência
• Velocidade de obra
• Cash flow

**Análises:**
• Comparativo mês a mês
• Tendências
• Projeções
• Alertas e recomendações

**Novo:** Dashboard interativo com drill-down.`
        }
      ]
    },
    {
      id: "configuracoes",
      title: "⚙️ Configurações",
      icon: Settings,
      color: "gray",
      items: [
        {
          title: "Gateways de Pagamento",
          content: `Configuração de meios de pagamento online.

**Gateways suportados:**
• Asaas (PIX, boleto, cartão)
• PagSeguro/PagBank
• Mercado Pago
• Stripe
• Cielo, Stone, Getnet, Rede

**Configuração:**
• Ambiente (sandbox/produção)
• Chaves de API
• Webhook para recebimento automático
• Taxas por método de pagamento
• Métodos habilitados

**Uso:**
• Geração automática de cobranças
• Baixa automática via webhook
• Lançamento de taxas no caixa
• Envio de links de pagamento

**Importante:** Configure o webhook para baixa automática de pagamentos.`
        },
        {
          title: "Centros de Custo e Tipos de Despesa",
          content: `Organização contábil.

**Centros de Custo:**
• Vinculados a níveis da DRE
• Por loteamento/unidade
• Orçamento mensal
• Responsável definido

**Tipos de Despesa:**
• Categoria contábil
• Rateável ou não
• Critérios de rateio
• Gera obrigação tributária

**Uso:**
• Lançamentos financeiros
• Relatórios analíticos
• Controle orçamentário
• DRE estruturada`
        },
        {
          title: "Backup e Recuperação",
          content: `Proteção de dados.

**Plataformas suportadas:**
• Google Drive
• OneDrive
• MEGA
• MagaluCloud
• Armazenamento local

**Configurações:**
• Backup automático (diário, semanal, mensal)
• Horário de execução
• Entidades incluídas
• Compactação e criptografia
• Retenção (quantidade de backups mantidos)
• Notificações por email

**Novo:** Agendamento inteligente e upload automático na nuvem.`
        },
        {
          title: "Grupos e Permissões",
          content: `Controle de acesso granular.

**Grupos padrão:**
• Admin (acesso total)
• Usuário (operacional)
• Cliente (portal)
• Imobiliária (portal)

**Permissões por módulo:**
• Visualizar, criar, editar, excluir
• Por funcionalidade específica
• Acesso a relatórios
• Configurações

**Uso:**
• Crie grupos personalizados
• Atribua usuários aos grupos
• Defina permissões granulares
• Controle por área de atuação

**Segurança:** Permissões aplicadas via RLS no banco de dados.`
        },
        {
          title: "SMTP e Emails",
          content: `Configuração de envio de emails.

**Configurações:**
• Servidor SMTP
• Porta e segurança (TLS/SSL)
• Credenciais
• Email remetente
• Nome de exibição

**Uso do sistema:**
• Notificações automáticas
• Convites de acesso
• Links de pagamento
• Alertas de vencimento
• Comunicados

**Múltiplas contas:**
• Configure múltiplas contas SMTP
• Defina uma como padrão
• Sistema escolhe melhor conta automaticamente

**Teste:** Funcionalidade de teste de conexão antes de ativar.`
        }
      ]
    },
    {
      id: "dicas",
      title: "💡 Dicas e Boas Práticas",
      icon: Lightbulb,
      color: "yellow",
      items: [
        {
          title: "Organização de Dados",
          content: `**Estrutura recomendada:**

1. **Comece pelos Loteamentos**
   - Cadastre primeiro os empreendimentos
   - Defina status e documentação

2. **Cadastre as Unidades**
   - Organize por loteamento
   - Use código único e significativo
   - Preencha detalhamento completo

3. **Configure Centros de Custo**
   - Antes de lançar despesas
   - Organize por área/projeto

4. **Cadastre Fornecedores**
   - Antes de compras e pagamentos
   - Mantenha dados atualizados

5. **Defina Orçamentos**
   - No início de cada mês
   - Por categoria de despesa`
        },
        {
          title: "Fluxo de Vendas",
          content: `**Passo a passo ideal:**

1. Cliente manifesta interesse
2. Cadastre o cliente
3. Crie a negociação
4. Gere as parcelas automaticamente
5. Configure pagamento online (se usar)
6. Envie convite para portal
7. Cliente acompanha tudo online

**Comissões:**
• Configure imobiliária e corretor na negociação
• Sistema gera pagamentos automaticamente
• Acompanhe performance no relatório de conversões`
        },
        {
          title: "Gestão de Obra Eficiente",
          content: `**Cronograma:**
• Detalhe todas as etapas no início
• Configure dependências
• Identifique caminho crítico
• Atualize semanalmente

**Custos:**
• Use o sistema de custo de obra para orçamento inicial
• Pesquise preços com IA
• Compare fornecedores
• Lance despesas reais à medida que acontecem
• Compare orçado vs realizado

**Documentação:**
• Tire fotos antes, durante e depois
• Organize por etapa
• Upload de NFs e comprovantes
• Cliente vê tudo no portal`
        },
        {
          title: "Controle Financeiro",
          content: `**Diário:**
• Lance todas as movimentações
• Classifique corretamente
• Anexe comprovantes

**Semanal:**
• Revise pagamentos pendentes
• Acompanhe inadimplência
• Faça transferências entre caixas

**Mensal:**
• Feche o mês
• Analise DRE
• Compare orçamento vs realizado
• Ajuste projeções
• Faça backup dos dados`
        },
        {
          title: "Comunicação com Clientes",
          content: `**Proatividade:**
• Responda mensagens rapidamente
• Atualize cronograma semanalmente
• Publique fotos de evolução
• Notifique vencimentos com antecedência

**Portal:**
• Incentive uso do portal
• Mantenha informações atualizadas
• Disponibilize documentos importantes
• Facilite pagamento online

**Transparência:**
• Compartilhe evolução de obra
• Seja claro sobre prazos
• Explique eventuais atrasos
• Mantenha canal aberto (mensagens)`
        },
        {
          title: "Performance e Otimização",
          content: `**Navegação:**
• Use o campo de busca global
• Favorito acesso rápido (Dashboard)
• Atalhos de teclado quando disponível

**Filtros:**
• Use filtros avançados em listagens
• Salve filtros frequentes
• Exporte apenas dados necessários

**Mobile:**
• Interface otimizada para celular
• Use zoom ajustável (0.8x desktop)
• Menu colapsável para melhor visualização

**Cache:**
• Sistema usa React Query para cache inteligente
• Dados atualizados automaticamente
• Sincronização em tempo real`
        }
      ]
    },
    {
      id: "faq",
      title: "❓ Perguntas Frequentes",
      icon: AlertCircle,
      color: "teal",
      items: [
        {
          title: "Como funciona o sistema de mensagens?",
          content: `O sistema permite comunicação bidirecional entre cliente e administração.

**Cliente pode:**
• Iniciar conversas sobre diversos assuntos
• Anexar arquivos
• Ver histórico completo
• Receber notificações

**Admin pode:**
• Responder às mensagens
• Alterar status (aberto, em andamento, resolvido)
• Definir prioridades
• Filtrar por diversos critérios
• Ver conversas não lidas

**Notificações:**
• Tempo real no sistema
• Email automático (configurável)
• Badge com contador no menu`
        },
        {
          title: "Como configurar pagamento online?",
          content: `**Requisitos:**
1. Conta em gateway de pagamento (Asaas recomendado)
2. Chaves de API do gateway
3. Configuração do webhook

**Passo a passo:**
1. Vá em Configurações → Gateways de Pagamento
2. Adicione novo gateway
3. Preencha credenciais
4. Configure webhook (URL fornecida pelo sistema)
5. Ative métodos de pagamento (PIX, boleto, cartão)
6. Salve e teste

**Uso:**
• Cliente vê botão "Pagar Online" no portal
• Escolhe método de pagamento
• Sistema gera cobrança no gateway
• Baixa automática via webhook
• Comprovante disponível automaticamente`
        },
        {
          title: "Como funciona o cálculo de juros e multa?",
          content: `**Configuração padrão:**
• Juros: 0.1% ao dia (personaliz��vel)
• Multa: 2% (personalizável)

**Cálculo automático:**
• Sistema verifica pagamentos vencidos diariamente
• Calcula dias de atraso
• Aplica juros e multa
• Atualiza valor total
• Muda status para "atrasado"

**No recebimento:**
• Valor com juros/multa já calculado
• Pode ajustar manualmente se negociado
• Registra valor efetivamente recebido

**Relatórios:**
• Juros e multas aparecem separados
• Impacto na receita
• Análise de inadimplência`
        },
        {
          title: "Posso ter múltiplos loteamentos?",
          content: `Sim! O sistema foi projetado para múltiplos empreendimentos.

**Recursos:**
• Cadastro ilimitado de loteamentos
• Unidades vinculadas a cada loteamento
• Custos separados por loteamento
• Relatórios consolidados ou por loteamento
• Equipes diferentes por projeto
• Orçamentos independentes

**Organização:**
• Use filtro de loteamento no dashboard
• Relatórios podem ser por loteamento ou consolidado
• Centro de custos pode ser por loteamento
• Caixas podem ser compartilhados ou separados`
        },
        {
          title: "Como faço backup dos dados?",
          content: `**Backup Manual:**
1. Configurações → Backup e Recuperação
2. Clique em "Executar Backup Agora"
3. Escolha entidades para incluir
4. Aguarde conclusão
5. Download ou upload na nuvem

**Backup Automático:**
1. Configure plataforma de nuvem (Google Drive, etc)
2. Defina frequência (diário, semanal, mensal)
3. Escolha horário
4. Sistema executa automaticamente
5. Notificação por email

**Recomendação:**
• Backup automático semanal
• Mantenha últimos 10 backups
• Use criptografia para segurança
• Configure notificação para saber se falhou`
        },
        {
          title: "Posso personalizar o sistema?",
          content: `**Personalizações disponíveis:**

**Campos customizados:**
• Muitas entidades aceitam campos adicionais
• Configure conforme necessidade

**Permissões:**
• Crie grupos personalizados
• Defina permissões granulares
• Controle por usuário/área

**Relatórios:**
• Filtros avançados
• Exportação para análise externa
• Dashboards configuráveis

**Processos:**
• Configure workflows próprios
• Automações via notificações
• Integrações via API

**Limitações:**
• Estrutura de dados padrão (não altera schema)
• Interface padrão do sistema
• Regras de negócio core

Para customizações mais profundas, contate o suporte.`
        }
      ]
    }
  ];

  const filteredSections = sections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-[var(--wine-700)]">Wiki do Sistema</h1>
              <p className="text-gray-600">Guia completo de uso - v2.9.0</p>
            </div>
          </div>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto mt-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar na wiki..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-lg shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <Tabs defaultValue="inicio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 h-auto p-2 bg-white shadow-lg">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <TabsTrigger 
                  key={section.id} 
                  value={section.id}
                  className="flex flex-col items-center gap-2 p-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-[var(--wine-600)] data-[state=active]:to-[var(--grape-600)] data-[state=active]:text-white"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{section.title.split(' ')[1]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {filteredSections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="space-y-4">
              {section.items.map((item, idx) => (
                <Card key={idx} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)]">
                    <CardTitle className="flex items-center gap-3 text-[var(--wine-700)]">
                      <ChevronRight className="w-5 h-5" />
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                        {item.content}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer */}
        <Card className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Precisa de ajuda?</h3>
              <p className="text-white/90 mb-4">
                Esta wiki está em constante atualização. Caso não encontre o que procura, entre em contato com o suporte.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                  📧 suporte@riviera.com.br
                </Badge>
                <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                  📱 (41) 99999-9999
                </Badge>
                <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                  🕐 Seg-Sex: 8h-18h
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}