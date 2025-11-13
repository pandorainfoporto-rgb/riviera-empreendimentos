import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, Search, Building2, Wallet, HardHat, CircleDollarSign, 
  Users, FileText, MessageSquare, TrendingUp, Package, ShoppingCart,
  Database, Zap, Shield, Mail, Store, Award, CheckCircle2,
  ArrowRight, AlertCircle, Calendar, Receipt, Landmark, RefreshCw
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Wiki() {
  const [busca, setBusca] = useState("");

  const modulos = {
    cadastros: {
      titulo: "Cadastros Básicos",
      icon: Building2,
      color: "blue",
      itens: [
        {
          titulo: "Loteamentos",
          descricao: "Cadastre seus empreendimentos e loteamentos",
          conteudo: `
            <h3>Como cadastrar um Loteamento</h3>
            <ol>
              <li>Acesse <strong>Cadastros > Loteamentos</strong></li>
              <li>Clique em "Novo Loteamento"</li>
              <li>Preencha: Nome, Localização, Área Total, Quantidade de Lotes</li>
              <li>Adicione informações como Matrícula e Data de Aprovação</li>
              <li>Salve e comece a cadastrar as unidades</li>
            </ol>
            <h4>Dicas:</h4>
            <ul>
              <li>Use nomes descritivos para facilitar a busca</li>
              <li>Mantenha os dados de aprovação atualizados</li>
              <li>Vincule documentos importantes ao loteamento</li>
            </ul>
          `
        },
        {
          titulo: "Unidades",
          descricao: "Gerencie casas, apartamentos e lotes",
          conteudo: `
            <h3>Gestão de Unidades</h3>
            <p>As unidades representam os imóveis individuais dentro de cada loteamento.</p>
            <h4>Tipos de Unidade:</h4>
            <ul>
              <li><strong>Apartamento:</strong> Unidades em condomínios verticais</li>
              <li><strong>Casa:</strong> Casas térreas ou sobrados</li>
              <li><strong>Lote:</strong> Terrenos para construção</li>
              <li><strong>Sala Comercial:</strong> Unidades comerciais</li>
            </ul>
            <h4>Status Possíveis:</h4>
            <ul>
              <li>Disponível - Pronta para venda</li>
              <li>Reservada - Com proposta em análise</li>
              <li>Vendida - Contrato assinado</li>
              <li>Em Construção - Obra em andamento</li>
              <li>Alugada - Locação ativa</li>
            </ul>
          `
        },
        {
          titulo: "Clientes",
          descricao: "Cadastro completo de clientes e inquilinos",
          conteudo: `
            <h3>Gestão de Clientes</h3>
            <p>Mantenha um cadastro completo de seus clientes e prospects.</p>
            <h4>Informações Importantes:</h4>
            <ul>
              <li>Dados pessoais (CPF, RG, Estado Civil)</li>
              <li>Contatos (Telefone, Email, WhatsApp)</li>
              <li>Endereço completo</li>
              <li>Dados profissionais e financeiros</li>
              <li>Referências pessoais (para inquilinos)</li>
            </ul>
            <h4>Portal do Cliente:</h4>
            <p>Você pode dar acesso ao portal para que o cliente acompanhe:</p>
            <ul>
              <li>Evolução da obra</li>
              <li>Boletos e pagamentos</li>
              <li>Documentos do contrato</li>
              <li>Mensagens e notificações</li>
            </ul>
          `
        },
        {
          titulo: "Fornecedores",
          descricao: "Cadastro de fornecedores e prestadores",
          conteudo: `
            <h3>Cadastro de Fornecedores</h3>
            <p>Mantenha uma base organizada de fornecedores de materiais e serviços.</p>
            <h4>Dados do Fornecedor:</h4>
            <ul>
              <li>Razão Social e Nome Fantasia</li>
              <li>CNPJ, Inscrição Estadual/Municipal</li>
              <li>Contatos (Telefone, Email, Vendedor)</li>
              <li>Endereço completo</li>
              <li>Dados bancários (para pagamentos)</li>
              <li>Condições de pagamento preferencial</li>
            </ul>
            <h4>Integração:</h4>
            <p>Fornecedores cadastrados são usados em:</p>
            <ul>
              <li>Pagamentos de fornecedores</li>
              <li>Compras e notas fiscais</li>
              <li>Orçamentos de compra</li>
              <li>Custos de obra</li>
            </ul>
          `
        }
      ]
    },
    financeiro: {
      titulo: "Gestão Financeira",
      icon: Wallet,
      color: "green",
      itens: [
        {
          titulo: "Fluxo de Caixa",
          descricao: "Controle completo de entradas e saídas",
          conteudo: `
            <h3>Fluxo de Caixa</h3>
            <p>O sistema oferece visão completa do fluxo financeiro da empresa.</p>
            <h4>Múltiplos Caixas:</h4>
            <ul>
              <li>Caixas em Dinheiro</li>
              <li>Contas Bancárias</li>
              <li>Corretoras de Valores</li>
              <li>Gateways de Pagamento</li>
            </ul>
            <h4>Movimentações:</h4>
            <p>Todas as entradas e saídas são registradas automaticamente:</p>
            <ul>
              <li>Recebimentos de clientes</li>
              <li>Pagamentos a fornecedores</li>
              <li>Aportes de sócios</li>
              <li>Transferências entre caixas</li>
              <li>Taxas de gateways</li>
            </ul>
            <h4>Relatórios:</h4>
            <ul>
              <li>Posição consolidada de caixas</li>
              <li>Fluxo mensal detalhado</li>
              <li>Projeções futuras</li>
              <li>DRE e Análise de Custos</li>
            </ul>
          `
        },
        {
          titulo: "Integração Bancária",
          descricao: "Conecte-se aos principais bancos do Brasil",
          conteudo: `
            <h3>Integração Bancária</h3>
            <p>Sistema integrado com os principais bancos para emissão de boletos e conciliação.</p>
            <h4>Bancos Suportados:</h4>
            <ul>
              <li>Banco do Brasil (API Open Banking)</li>
              <li>Bradesco (API OAuth)</li>
              <li>Itaú (CNAB 240/400)</li>
              <li>Santander (API REST)</li>
              <li>Caixa Econômica (CNAB)</li>
              <li>Sicoob e Sicredi</li>
            </ul>
            <h4>Funcionalidades:</h4>
            <ul>
              <li><strong>Emissão de Boletos:</strong> Gere boletos diretamente pela API</li>
              <li><strong>Consulta de Status:</strong> Acompanhe pagamentos em tempo real</li>
              <li><strong>Conciliação Automática:</strong> IA identifica pagamentos</li>
              <li><strong>Arquivos CNAB:</strong> Importação de remessa e retorno</li>
            </ul>
            <h4>Configuração:</h4>
            <ol>
              <li>Acesse Financeiro > Bancos e Integrações</li>
              <li>Adicione nova integração</li>
              <li>Configure credenciais (Client ID, Secret, Certificados)</li>
              <li>Teste a conexão</li>
              <li>Ative e comece a usar</li>
            </ol>
          `
        },
        {
          titulo: "Conciliação Bancária",
          descricao: "Matching inteligente de pagamentos",
          conteudo: `
            <h3>Conciliação Bancária Inteligente</h3>
            <p>Sistema de IA que identifica automaticamente pagamentos no extrato bancário.</p>
            <h4>Como Funciona:</h4>
            <ol>
              <li>Importe arquivo CNAB ou sincronize via API</li>
              <li>Sistema analisa cada movimento bancário</li>
              <li>IA busca correspondência com boletos pendentes</li>
              <li>Matching por: Nosso Número, Valor, Data, CPF</li>
              <li>Score de confiança para cada match</li>
              <li>Aprovação manual de sugestões</li>
            </ol>
            <h4>Níveis de Match:</h4>
            <ul>
              <li><strong>Match Exato:</strong> 100% de confiança (Nosso Número + Valor)</li>
              <li><strong>Match Fuzzy:</strong> 80-99% de confiança (Tolerância de valor/data)</li>
              <li><strong>Sugestões:</strong> 50-79% de confiança (Precisa revisão)</li>
              <li><strong>Sem Match:</strong> Movimento não identificado</li>
            </ul>
            <h4>Conciliação Manual:</h4>
            <p>Para movimentos não identificados:</p>
            <ul>
              <li>Visualize detalhes do movimento</li>
              <li>Busque boletos por filtros</li>
              <li>Vincule manualmente</li>
              <li>Ou crie nova movimentação</li>
            </ul>
          `
        },
        {
          titulo: "Boletos",
          descricao: "Gestão completa de boletos bancários",
          conteudo: `
            <h3>Sistema de Boletos</h3>
            <p>Emissão, acompanhamento e gestão de boletos bancários.</p>
            <h4>Tipos de Boleto:</h4>
            <ul>
              <li><strong>Com Registro:</strong> Enviado ao banco via API/CNAB</li>
              <li><strong>Sem Registro:</strong> Apenas geração local</li>
            </ul>
            <h4>Geração Automática:</h4>
            <p>Boletos são criados automaticamente em:</p>
            <ul>
              <li>Parcelas de negociações</li>
              <li>Parcelas de consórcios</li>
              <li>Aluguéis mensais</li>
              <li>Cobranças avulsas</li>
            </ul>
            <h4>Configurações:</h4>
            <ul>
              <li>Juros e Multa automáticos</li>
              <li>Dias para protesto</li>
              <li>Dias para baixa automática</li>
              <li>Instruções personalizadas</li>
              <li>PIX Copia e Cola integrado</li>
            </ul>
            <h4>Status do Boleto:</h4>
            <ul>
              <li>Emitido - Criado no sistema</li>
              <li>Registrado - Enviado ao banco</li>
              <li>Pago Parcial - Pagamento parcial recebido</li>
              <li>Pago - Totalmente quitado</li>
              <li>Cancelado - Cancelado manualmente</li>
              <li>Baixado - Baixado automaticamente</li>
            </ul>
          `
        }
      ]
    },
    obras: {
      titulo: "Gestão de Obras",
      icon: HardHat,
      color: "orange",
      itens: [
        {
          titulo: "Custos de Obra",
          descricao: "Orçamento detalhado por unidade",
          conteudo: `
            <h3>Custos de Obra Avançado</h3>
            <p>Sistema completo de orçamento e controle de custos de construção.</p>
            <h4>Estrutura:</h4>
            <ul>
              <li>Orçamento por Unidade</li>
              <li>Divisão por Etapas (Fundação, Estrutura, Acabamento, etc)</li>
              <li>Detalhamento por Material e Serviço</li>
              <li>Quantidades e Valores</li>
            </ul>
            <h4>Funcionalidades:</h4>
            <ul>
              <li><strong>Dashboard Financeiro:</strong> Estimado vs Realizado</li>
              <li><strong>Gerenciar Despesas:</strong> Vincule compras e pagamentos</li>
              <li><strong>Orçamentos de Compra:</strong> Envie cotações para fornecedores</li>
              <li><strong>Pesquisa de Preços:</strong> Busque preços online</li>
              <li><strong>Sugestões IA:</strong> Inteligência artificial sugere materiais</li>
            </ul>
            <h4>Workflow:</h4>
            <ol>
              <li>Crie o Custo de Obra para a unidade</li>
              <li>Adicione etapas e itens</li>
              <li>Gere orçamentos de compra</li>
              <li>Envie para fornecedores</li>
              <li>Receba cotações</li>
              <li>Realize compras</li>
              <li>Acompanhe execução no dashboard</li>
            </ol>
          `
        },
        {
          titulo: "Orçamentos de Compra",
          descricao: "Cotações automáticas para fornecedores",
          conteudo: `
            <h3>Orçamentos de Compra</h3>
            <p>Envie orçamentos automaticamente para múltiplos fornecedores.</p>
            <h4>Como Funciona:</h4>
            <ol>
              <li>No Custo de Obra, clique em "Criar Orçamento de Compra"</li>
              <li>Selecione as etapas a orçar</li>
              <li>Escolha os fornecedores destinatários</li>
              <li>Configure prazo de validade</li>
              <li>Sistema envia emails automáticos</li>
              <li>Acompanhe respostas</li>
            </ol>
            <h4>Email Automático:</h4>
            <p>O sistema envia email com:</p>
            <ul>
              <li>Lista detalhada de materiais/serviços</li>
              <li>Quantidades necessárias</li>
              <li>Prazo para resposta</li>
              <li>Dados da obra</li>
              <li>Contato para dúvidas</li>
            </ul>
            <h4>Acompanhamento:</h4>
            <ul>
              <li>Status: Enviado, Em Análise, Aprovado</li>
              <li>Fornecedores que responderam</li>
              <li>Valores cotados</li>
              <li>Comparativo entre fornecedores</li>
            </ul>
            <h4>Aprovação:</h4>
            <p>Após receber cotações:</p>
            <ul>
              <li>Compare valores</li>
              <li>Aprove o melhor orçamento</li>
              <li>Gere ordem de compra</li>
              <li>Crie pagamentos automaticamente</li>
            </ul>
          `
        },
        {
          titulo: "Cronograma de Obra",
          descricao: "Planejamento e controle de prazos",
          conteudo: `
            <h3>Cronograma de Obra</h3>
            <p>Planeje e acompanhe todas as etapas da construção.</p>
            <h4>Estrutura WBS:</h4>
            <p>Work Breakdown Structure - Divisão hierárquica:</p>
            <ul>
              <li>Nível 1: Fases principais</li>
              <li>Nível 2: Etapas</li>
              <li>Nível 3: Tarefas detalhadas</li>
            </ul>
            <h4>Informações por Tarefa:</h4>
            <ul>
              <li>Data Início/Fim Prevista e Real</li>
              <li>Duração em dias úteis</li>
              <li>Responsável e equipe</li>
              <li>Predecessoras e sucessoras</li>
              <li>Recursos alocados</li>
              <li>Percentual de conclusão</li>
            </ul>
            <h4>Análise de Caminho Crítico:</h4>
            <ul>
              <li>Identifica tarefas críticas</li>
              <li>Calcula folgas (slack)</li>
              <li>Detecta atrasos que impactam prazo final</li>
            </ul>
            <h4>Visualizações:</h4>
            <ul>
              <li>Lista hierárquica</li>
              <li>Gráfico de Gantt</li>
              <li>Timeline visual</li>
              <li>Dashboard de progresso</li>
            </ul>
          `
        },
        {
          titulo: "Execução de Obra",
          descricao: "Acompanhamento diário da construção",
          conteudo: `
            <h3>Execução de Obra</h3>
            <p>Registro diário de atividades, fotos e documentos.</p>
            <h4>Diário de Obra:</h4>
            <ul>
              <li>Registro de atividades realizadas</li>
              <li>Mão de obra presente</li>
              <li>Equipamentos utilizados</li>
              <li>Materiais consumidos</li>
              <li>Condições climáticas</li>
              <li>Observações e problemas</li>
            </ul>
            <h4>Galeria de Fotos:</h4>
            <ul>
              <li>Upload de fotos de progresso</li>
              <li>Organização por data e etapa</li>
              <li>Comparação antes/depois</li>
              <li>Compartilhamento com cliente</li>
            </ul>
            <h4>Documentos:</h4>
            <ul>
              <li>Projetos executivos</li>
              <li>Aprovações</li>
              <li>ARTs e RRTs</li>
              <li>Notas fiscais</li>
              <li>Recibos e comprovantes</li>
            </ul>
            <h4>Checklist de Qualidade:</h4>
            <ul>
              <li>Crie checklists personalizados</li>
              <li>Acompanhe conformidade</li>
              <li>Registre não conformidades</li>
              <li>Planos de ação</li>
            </ul>
          `
        },
        {
          titulo: "Compras e NF-e",
          descricao: "Importação de XML e gestão de compras",
          conteudo: `
            <h3>Sistema de Compras</h3>
            <p>Gestão completa de compras e notas fiscais eletrônicas.</p>
            <h4>Importação de XML:</h4>
            <ol>
              <li>Faça upload do arquivo XML da NF-e</li>
              <li>Sistema extrai dados automaticamente</li>
              <li>Vincula fornecedor (cria se não existir)</li>
              <li>Importa produtos (atualiza estoque)</li>
              <li>Gera pagamentos automaticamente</li>
              <li>Vincula à unidade/obra</li>
            </ol>
            <h4>Compra Manual:</h4>
            <p>Para compras sem NF-e:</p>
            <ul>
              <li>Informe fornecedor e data</li>
              <li>Adicione produtos manualmente</li>
              <li>Sistema calcula totais</li>
              <li>Gera pagamentos</li>
            </ul>
            <h4>Importação de Orçamento:</h4>
            <p>Transforme um orçamento aprovado em compra:</p>
            <ul>
              <li>Selecione o orçamento</li>
              <li>Escolha o fornecedor</li>
              <li>Sistema cria compra com todos os itens</li>
              <li>Gera pagamentos conforme condições</li>
            </ul>
            <h4>Gestão de Estoque:</h4>
            <ul>
              <li>Produtos são automaticamente adicionados ao estoque</li>
              <li>Controle de entrada/saída</li>
              <li>Custo médio ponderado</li>
              <li>Alertas de estoque mínimo</li>
            </ul>
          `
        }
      ]
    },
    consorcios: {
      titulo: "Gestão de Consórcios",
      icon: CircleDollarSign,
      color: "purple",
      itens: [
        {
          titulo: "Cadastro de Cotas",
          descricao: "Gerencie suas cotas de consórcio",
          conteudo: `
            <h3>Gestão de Cotas de Consórcio</h3>
            <p>Sistema completo para controle de cotas contempladas e não contempladas.</p>
            <h4>Tipos de Cota:</h4>
            <ul>
              <li><strong>Com Cliente:</strong> Cota vendida para cliente específico</li>
              <li><strong>Investimento:</strong> Cota própria para investimento</li>
            </ul>
            <h4>Informações Principais:</h4>
            <ul>
              <li>Administradora do consórcio</li>
              <li>Grupo e Cota</li>
              <li>Valor da carta</li>
              <li>Quantidade de parcelas (pagas e total)</li>
              <li>Dia da assembleia</li>
              <li>Taxas (Fundo Reserva, Comum, Administração)</li>
            </ul>
            <h4>Workflow:</h4>
            <ol>
              <li>Cadastre a cota</li>
              <li>Vincule cliente (se for venda)</li>
              <li>Sistema gera parcelas automaticamente</li>
              <li>Acompanhe assembleias</li>
              <li>Registre lances</li>
              <li>Contemple quando sorteado/lanceado</li>
              <li>Gere carta de crédito</li>
            </ol>
          `
        },
        {
          titulo: "Assembleias e Lances",
          descricao: "Controle de assembleias e lances",
          conteudo: `
            <h3>Assembleias de Consórcio</h3>
            <p>Acompanhe assembleias mensais e resultados de contemplação.</p>
            <h4>Dia da Assembleia:</h4>
            <ul>
              <li>Configure dia da assembleia (1-31)</li>
              <li>Sistema cria alertas automáticos</li>
              <li>Dashboard mostra próximas assembleias</li>
            </ul>
            <h4>Lances:</h4>
            <p>Tipos de lance:</p>
            <ul>
              <li><strong>Lance Livre:</strong> Percentual sobre o valor da carta</li>
              <li><strong>Lance Fixo:</strong> Valor específico em reais</li>
              <li><strong>Lance Embutido:</strong> Já incluído nas parcelas</li>
            </ul>
            <h4>Registro de Lance:</h4>
            <ol>
              <li>Acesse a cota</li>
              <li>Clique em "Registrar Lance"</li>
              <li>Informe tipo e percentual/valor</li>
              <li>Sistema calcula valor do lance</li>
              <li>Gera pagamento automaticamente</li>
            </ol>
            <h4>Contemplação:</h4>
            <p>Quando contemplado por lance ou sorteio:</p>
            <ul>
              <li>Registre a contemplação</li>
              <li>Informe tipo e data</li>
              <li>Sistema marca cota como contemplada</li>
              <li>Gera carta de crédito</li>
              <li>Permite vincular à unidade (se for para compra)</li>
            </ul>
          `
        },
        {
          titulo: "Comercialização",
          descricao: "Venda e transferência de cotas",
          conteudo: `
            <h3>Comercialização de Cotas</h3>
            <p>Gerencie vendas e transferências de cotas contempladas.</p>
            <h4>Venda de Cota:</h4>
            <ol>
              <li>Cadastre o cliente comprador</li>
              <li>Registre a comercialização</li>
              <li>Informe valor de venda</li>
              <li>Configure forma de pagamento</li>
              <li>Sistema gera boletos/parcelas</li>
            </ol>
            <h4>Transferência:</h4>
            <p>Para transferir cota entre clientes:</p>
            <ul>
              <li>Informe cliente atual e novo cliente</li>
              <li>Registre data da transferência</li>
              <li>Sistema atualiza responsável</li>
              <li>Mantém histórico completo</li>
            </ul>
            <h4>Documentos:</h4>
            <ul>
              <li>Contrato de compra e venda</li>
              <li>Termo de transferência</li>
              <li>Carta de contemplação</li>
              <li>Comprovantes de pagamento</li>
            </ul>
          `
        }
      ]
    },
    crm: {
      titulo: "CRM e Comunicação",
      icon: Users,
      color: "pink",
      itens: [
        {
          titulo: "Sistema CRM",
          descricao: "Gestão de leads e oportunidades",
          conteudo: `
            <h3>CRM - Customer Relationship Management</h3>
            <p>Sistema completo para gestão de relacionamento com clientes.</p>
            <h4>Funil de Vendas:</h4>
            <ul>
              <li>Prospecção - Primeiro contato</li>
              <li>Qualificação - Análise de fit</li>
              <li>Proposta - Envio de proposta comercial</li>
              <li>Negociação - Ajustes e negociação</li>
              <li>Fechamento - Conversão ou perda</li>
            </ul>
            <h4>Visão Kanban:</h4>
            <p>Arraste e solte leads entre etapas do funil</p>
            <ul>
              <li>Visualização clara do pipeline</li>
              <li>Identificação de gargalos</li>
              <li>Previsão de vendas</li>
            </ul>
            <h4>Histórico de Atividades:</h4>
            <ul>
              <li>Ligações realizadas</li>
              <li>Emails enviados/recebidos</li>
              <li>Reuniões e visitas</li>
              <li>Propostas enviadas</li>
              <li>Tarefas e follow-ups</li>
            </ul>
            <h4>Pontuação (Lead Scoring):</h4>
            <p>Sistema pontua leads automaticamente baseado em:</p>
            <ul>
              <li>Origem do lead</li>
              <li>Engajamento</li>
              <li>Perfil (renda, profissão)</li>
              <li>Interesse demonstrado</li>
            </ul>
          `
        },
        {
          titulo: "Portal Imobiliárias",
          descricao: "Gestão de leads de parceiros",
          conteudo: `
            <h3>Portal para Imobiliárias Parceiras</h3>
            <p>Sistema exclusivo para imobiliárias cadastrarem leads.</p>
            <h4>Acesso da Imobiliária:</h4>
            <ul>
              <li>Login dedicado para cada imobiliária</li>
              <li>Visualização apenas dos próprios leads</li>
              <li>Cadastro rápido de interessados</li>
              <li>Acompanhamento de aprovações</li>
            </ul>
            <h4>Workflow do Lead:</h4>
            <ol>
              <li>Imobiliária cadastra lead com dados do interessado</li>
              <li>Lead entra como "Novo" no sistema</li>
              <li>Incorporadora analisa e aprova/rejeita</li>
              <li>Lead aprovado vira oportunidade</li>
              <li>Venda concluída gera comissão automática</li>
            </ol>
            <h4>Comissionamento:</h4>
            <ul>
              <li>Configure % de comissão por imobiliária</li>
              <li>Sistema calcula automaticamente na venda</li>
              <li>Gera conta a pagar de comissão</li>
              <li>Relatório de conversões e comissões</li>
            </ul>
          `
        },
        {
          titulo: "Mensagens e Notificações",
          descricao: "Comunicação com clientes",
          conteudo: `
            <h3>Sistema de Mensagens</h3>
            <p>Comunicação interna e com clientes de forma organizada.</p>
            <h4>Tipos de Mensagem:</h4>
            <ul>
              <li><strong>Geral:</strong> Mensagens administrativas</li>
              <li><strong>Negociação:</strong> Sobre contratos e vendas</li>
              <li><strong>Pagamento:</strong> Cobranças e boletos</li>
              <li><strong>Documento:</strong> Envio de contratos</li>
              <li><strong>Obra:</strong> Atualizações de construção</li>
            </ul>
            <h4>Funcionalidades:</h4>
            <ul>
              <li>Threads de conversa organizadas</li>
              <li>Anexos de arquivos</li>
              <li>Notificações por email</li>
              <li>Respostas rápidas (templates)</li>
              <li>Priorização de mensagens</li>
              <li>Análise de sentimento (IA)</li>
            </ul>
            <h4>Templates de Email:</h4>
            <p>Crie templates para situações comuns:</p>
            <ul>
              <li>Boas-vindas ao cliente</li>
              <li>Lembrete de vencimento</li>
              <li>Atualização de obra</li>
              <li>Solicitação de documentos</li>
              <li>Convite para vistoria</li>
            </ul>
          `
        },
        {
          titulo: "Documentação IA",
          descricao: "Geração automática de documentos",
          conteudo: `
            <h3>Geração de Documentos com IA</h3>
            <p>Crie contratos e documentos automaticamente usando templates.</p>
            <h4>Templates Disponíveis:</h4>
            <ul>
              <li>Contrato de Compra e Venda</li>
              <li>Contrato de Locação</li>
              <li>Proposta Comercial</li>
              <li>Ficha Cadastral</li>
              <li>Termo de Entrega</li>
              <li>Distrato</li>
              <li>Aditivo Contratual</li>
            </ul>
            <h4>Como Funciona:</h4>
            <ol>
              <li>Escolha o template desejado</li>
              <li>Selecione cliente, unidade, negociação</li>
              <li>IA preenche automaticamente com dados do sistema</li>
              <li>Revise e edite se necessário</li>
              <li>Gere PDF para impressão/assinatura</li>
            </ol>
            <h4>Assinaturas Digitais:</h4>
            <ul>
              <li>Envie para assinatura eletrônica</li>
              <li>Acompanhe status de assinaturas</li>
              <li>Armazene documentos assinados</li>
              <li>Validade jurídica</li>
            </ul>
          `
        }
      ]
    },
    relatorios: {
      titulo: "Relatórios e Dashboards",
      icon: TrendingUp,
      color: "indigo",
      itens: [
        {
          titulo: "Dashboard Financeiro",
          descricao: "Visão 360° do financeiro",
          conteudo: `
            <h3>Dashboard Financeiro Consolidado</h3>
            <p>Análise completa da saúde financeira da empresa.</p>
            <h4>Indicadores Principais:</h4>
            <ul>
              <li>Saldo Total de Caixas</li>
              <li>Receitas do Mês</li>
              <li>Despesas do Mês</li>
              <li>Lucro/Prejuízo</li>
              <li>Contas a Receber</li>
              <li>Contas a Pagar</li>
            </ul>
            <h4>Gráficos Interativos:</h4>
            <ul>
              <li>Fluxo de Caixa Mensal (12 meses)</li>
              <li>Receitas vs Despesas</li>
              <li>Distribuição por Categoria</li>
              <li>Evolução de Saldos</li>
              <li>Performance por Unidade</li>
            </ul>
            <h4>Análises Avançadas:</h4>
            <ul>
              <li>DRE (Demonstração do Resultado)</li>
              <li>Margem de Lucro por Projeto</li>
              <li>ROI de Investimentos</li>
              <li>Análise de Custos de Obra</li>
              <li>Projeções Futuras</li>
            </ul>
          `
        },
        {
          titulo: "Relatórios Financeiros",
          descricao: "Relatórios detalhados de finanças",
          conteudo: `
            <h3>Relatórios Financeiros</h3>
            <p>Suite completa de relatórios para análise financeira.</p>
            <h4>DRE - Demonstração do Resultado:</h4>
            <ul>
              <li>Receitas Operacionais</li>
              <li>(-) Custos Diretos</li>
              <li>(=) Lucro Bruto</li>
              <li>(-) Despesas Operacionais</li>
              <li>(=) Lucro Operacional</li>
              <li>(-) Despesas Financeiras</li>
              <li>(=) Lucro Líquido</li>
            </ul>
            <h4>Fluxo de Caixa:</h4>
            <ul>
              <li>Entradas detalhadas por categoria</li>
              <li>Saídas detalhadas por categoria</li>
              <li>Saldo inicial, movimentações e saldo final</li>
              <li>Comparativo mensal</li>
            </ul>
            <h4>Análise de Custos:</h4>
            <ul>
              <li>Custos por obra/unidade</li>
              <li>Custos por etapa de construção</li>
              <li>Custos por fornecedor</li>
              <li>Análise de desvios orçamentários</li>
            </ul>
            <h4>Contas a Receber/Pagar:</h4>
            <ul>
              <li>Listagem detalhada de pendências</li>
              <li>Aging (vencimentos por período)</li>
              <li>Inadimplência</li>
              <li>Previsão de caixa</li>
            </ul>
          `
        },
        {
          titulo: "Relatórios de Vendas",
          descricao: "Performance comercial",
          conteudo: `
            <h3>Relatórios de Vendas</h3>
            <p>Análise completa da performance de vendas.</p>
            <h4>Principais Métricas:</h4>
            <ul>
              <li>Total de Vendas (quantidade e valor)</li>
              <li>Ticket Médio</li>
              <li>Taxa de Conversão</li>
              <li>Tempo Médio de Venda</li>
              <li>Vendas por Origem (imobiliária, direto, indicação)</li>
            </ul>
            <h4>Análise por Produto:</h4>
            <ul>
              <li>Unidades mais vendidas</li>
              <li>Loteamentos com melhor performance</li>
              <li>Tipos de imóvel preferidos</li>
              <li>Faixa de preço com mais procura</li>
            </ul>
            <h4>Funil de Vendas:</h4>
            <ul>
              <li>Leads por etapa</li>
              <li>Taxa de conversão entre etapas</li>
              <li>Tempo médio por etapa</li>
              <li>Motivos de perda</li>
            </ul>
            <h4>Performance de Parceiros:</h4>
            <ul>
              <li>Vendas por imobiliária</li>
              <li>Vendas por corretor</li>
              <li>Comissões pagas</li>
              <li>ROI de parcerias</li>
            </ul>
          `
        }
      ]
    }
  };

  const todosConteudos = Object.values(modulos).flatMap(mod => 
    mod.itens.map(item => ({
      ...item,
      modulo: mod.titulo,
      color: mod.color
    }))
  );

  const resultadosBusca = busca.trim() 
    ? todosConteudos.filter(item => 
        item.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        item.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        item.conteudo.toLowerCase().includes(busca.toLowerCase())
      )
    : [];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)] flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            Wiki & Documentação
          </h1>
          <p className="text-gray-600 mt-1">Guia completo do sistema Riviera</p>
        </div>
        <Badge className="bg-[var(--wine-600)] text-white px-4 py-2">
          v3.8.3 • 2024
        </Badge>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar na documentação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 text-lg"
            />
          </div>
          {busca && resultadosBusca.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">{resultadosBusca.length} resultado(s) encontrado(s)</p>
              {resultadosBusca.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => setBusca("")}>
                  <Badge className={`bg-${item.color}-100 text-${item.color}-800 mb-2`}>
                    {item.modulo}
                  </Badge>
                  <h4 className="font-semibold text-gray-900">{item.titulo}</h4>
                  <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!busca && (
        <Tabs defaultValue="cadastros" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {Object.entries(modulos).map(([key, mod]) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <mod.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{mod.titulo}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(modulos).map(([key, mod]) => (
            <TabsContent key={key} value={key} className="mt-6">
              <Card className={`border-t-4 border-${mod.color}-500`}>
                <CardHeader className={`bg-${mod.color}-50`}>
                  <CardTitle className="flex items-center gap-3">
                    <mod.icon className={`w-6 h-6 text-${mod.color}-600`} />
                    {mod.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Accordion type="single" collapsible className="w-full">
                    {mod.itens.map((item, idx) => (
                      <AccordionItem key={idx} value={`item-${idx}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-start gap-3 text-left">
                            <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">{item.titulo}</h3>
                              <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div 
                            className="prose max-w-none mt-4 pl-8"
                            dangerouslySetInnerHTML={{ __html: item.conteudo }}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}