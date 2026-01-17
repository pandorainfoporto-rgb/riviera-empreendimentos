import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TutoriaisDisponiveis from "../components/wiki/TutoriaisDisponiveis";
import { 
  BookOpen, Search, Building2, Wallet, HardHat, CircleDollarSign, 
  Users, FileText, TrendingUp,
  ArrowRight, Video
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
          titulo: "Lotes",
          descricao: "Mapeamento visual de lotes em loteamentos",
          conteudo: `
            <h3>Sistema de Mapeamento de Lotes (v4.6)</h3>
            <p>Sistema visual completo de cadastro e gestão de lotes usando plantas DWG com filtros avançados.</p>
            <h4>Wizard de Cadastro:</h4>
            <ol>
              <li><strong>Passo 1 - Dados do Loteamento:</strong> Nome, endereço, área total</li>
              <li><strong>Passo 2 - Upload DWG:</strong> Envie o arquivo DWG original e a imagem da planta (PNG/JPG/SVG)</li>
              <li><strong>Passo 3 - Mapeamento Visual:</strong> Clique nos pontos para delimitar cada lote na planta</li>
            </ol>
            <h4>Como Mapear Lotes:</h4>
            <ul>
              <li>Clique em "Adicionar Lote"</li>
              <li>Clique nos cantos do lote na imagem para criar o polígono</li>
              <li>Finalize o polígono quando marcar todos os pontos</li>
              <li>Preencha: número, quadra, área real, valor</li>
              <li>Repita para todos os lotes do loteamento</li>
            </ul>
            <h4>Filtros Avançados (v4.6 - NOVO):</h4>
            <p>No wizard de Intenção de Compra, ao selecionar lote, você pode filtrar por:</p>
            <ul>
              <li><strong>Status:</strong> Disponível, Reservado, Em Negociação, Vendido</li>
              <li><strong>Preço:</strong> Faixa de preço mínimo e máximo</li>
              <li><strong>Área:</strong> Faixa de área mínima e máxima em m²</li>
              <li><strong>Busca:</strong> Pesquise por número do lote ou quadra</li>
            </ul>
            <h4>Como Usar os Filtros:</h4>
            <ol>
              <li>Clique no botão "Filtros" no topo do mapa</li>
              <li>Configure os filtros desejados</li>
              <li>Mapa atualiza automaticamente mostrando apenas lotes filtrados</li>
              <li>Contador mostra quantos lotes foram encontrados</li>
              <li>Clique em "Limpar Filtros" para resetar</li>
            </ol>
            <h4>Visualização do Mapa:</h4>
            <p>O mapa mostra lotes com cores por status:</p>
            <ul>
              <li>🟢 Verde: Disponível</li>
              <li>🟡 Amarelo: Reservado</li>
              <li>🔵 Azul: Em Negociação</li>
              <li>🔴 Vermelho: Vendido</li>
            </ul>
            <h4>Integração com Negociações:</h4>
            <ul>
              <li>Mapa aparece automaticamente ao criar intenção de compra</li>
              <li>Status dos lotes atualiza automaticamente nas vendas</li>
              <li>Clique em lotes para ver detalhes completos</li>
              <li>Filtros facilitam encontrar lote ideal para o cliente</li>
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
            <h3>Gestão de Clientes (v4.4)</h3>
            <p>Cadastro completo organizado em abas para fácil navegação.</p>
            <h4>Abas do Cadastro:</h4>
            <ul>
              <li><strong>Dados:</strong> Nome, CPF/CNPJ, RG, telefone, email, profissão</li>
              <li><strong>Endereço:</strong> Pesquisa Estado → Cidade → CEP automático</li>
              <li><strong>Filiação:</strong> Nome do pai e da mãe</li>
              <li><strong>Bancário:</strong> Banco, agência, conta, tipo PIX</li>
              <li><strong>Fotos:</strong> Upload de documentos e imagens</li>
            </ul>
            <h4>Novos Campos (v4.4):</h4>
            <ul>
              <li>RG do cliente</li>
              <li>Filiação (nome do pai e mãe)</li>
              <li>Profissão</li>
              <li>Dados bancários completos</li>
              <li>Chave PIX com tipos</li>
            </ul>
            <h4>Portal do Cliente:</h4>
            <p>Você pode dar acesso ao portal para que o cliente acompanhe:</p>
            <ul>
              <li>Evolução da obra com fotos</li>
              <li>Boletos e pagamentos online</li>
              <li>Documentos e contratos</li>
              <li>Mensagens diretas</li>
              <li>Notificações em tempo real</li>
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
        },
        {
          titulo: "Negociações",
          descricao: "Gestão completa de vendas e contratos",
          conteudo: `
            <h3>Sistema de Negociações</h3>
            <p>Controle completo do processo de venda, desde a proposta até a assinatura do contrato.</p>
            <h4>Workflow da Negociação:</h4>
            <ol>
              <li><strong>Criação:</strong> Selecione cliente e unidade, defina valores e condições</li>
              <li><strong>Configuração Financeira:</strong> Entrada, parcelas mensais, correção monetária</li>
              <li><strong>Comissões:</strong> Configure comissões de imobiliárias e corretores</li>
              <li><strong>Geração de Parcelas:</strong> Sistema cria automaticamente todos os pagamentos</li>
              <li><strong>Geração de Contrato:</strong> IA cria contrato completo baseado em templates</li>
              <li><strong>Assinatura:</strong> Aprove contrato e registre data de assinatura e entrega</li>
              <li><strong>Finalização:</strong> Marque como finalizada quando escriturada</li>
            </ol>
            <h4>Status da Negociação:</h4>
            <ul>
              <li><strong>Ativa:</strong> Negociação em amdaamento, permite editar</li>
              <li><strong>Aguardando Assinatura:</strong> Contrato gerado, aguardando assinatura</li>
              <li><strong>Contrato Assinado:</strong> Contrato assinado, unidade vendida</li>
              <li><strong>Finalizada:</strong> Totalmente concluída, unidade escriturada</li>
              <li><strong>Cancelada:</strong> Negociação cancelada, unidade volta a disponível</li>
            </ul>
            <h4>Correção Monetária:</h4>
            <p>Configure correção mensal ou anual com índices:</p>
            <ul>
              <li>IGP-M (busca automática do valor atual)</li>
              <li>IPCA (busca automática do valor atual)</li>
              <li>INCC (busca automática do valor atual)</li>
              <li>Personalizada (defina o percentual manualmente)</li>
            </ul>
            <h4>Automações:</h4>
            <ul>
              <li>Atualização automática do status da unidade</li>
              <li>Geração de parcelas com juros e correção</li>
              <li>Criação de pagamentos de comissão para fornecedores</li>
              <li>Limpeza automática ao cancelar (libera unidade)</li>
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
        },
        {
          titulo: "Pagamentos de Clientes",
          descricao: "Recebimentos e controle de inadimplência",
          conteudo: `
            <h3>Gestão de Pagamentos de Clientes</h3>
            <p>Controle completo de recebimentos, juros, multas e formas de pagamento.</p>
            <h4>Geração Automática:</h4>
            <p>Parcelas são criadas automaticamente ao:</p>
            <ul>
              <li>Gerar parcelas de uma negociação</li>
              <li>Confirmar faturas de consórcios</li>
              <li>Registrar aluguéis mensais</li>
            </ul>
            <h4>Recebimento:</h4>
            <ul>
              <li><strong>Múltiplas Formas:</strong> PIX, Boleto, Cartão, Dinheiro, Transferência</li>
              <li><strong>Pagamento Parcial:</strong> Registre pagamentos parciais com saldo restante</li>
              <li><strong>Múltiplos Caixas:</strong> Divida um pagamento em vários caixas</li>
              <li><strong>Juros e Multa:</strong> Cálculo automático para pagamentos em atraso</li>
            </ul>
            <h4>Integração com Gateway:</h4>
            <ul>
              <li>Pagamento online via PIX ou Cartão</li>
              <li>Confirmação automática via webhook</li>
              <li>Lançamento automático em caixa vinculado</li>
              <li>Registro de taxas do gateway</li>
            </ul>
            <h4>Status:</h4>
            <ul>
              <li>Pendente - Aguardando pagamento</li>
              <li>Pago - Totalmente quitado</li>
              <li>Parcial - Pagamento parcial recebido</li>
              <li>Atrasado - Vencido e não pago</li>
              <li>Cancelado - Parcela cancelada</li>
            </ul>
          `
        },
        {
          titulo: "Pagamentos a Fornecedores",
          descricao: "Controle de contas a pagar",
          conteudo: `
            <h3>Gestão de Pagamentos a Fornecedores</h3>
            <p>Organize e controle todos os pagamentos a fornecedores e prestadores.</p>
            <h4>Tipos de Pagamento:</h4>
            <ul>
              <li><strong>Serviço:</strong> Pagamento por serviços prestados</li>
              <li><strong>Produto:</strong> Compra de materiais</li>
              <li><strong>Lance Consórcio:</strong> Pagamento de lance contemplado</li>
              <li><strong>Comissão Imobiliária:</strong> Gerado automaticamente em vendas</li>
              <li><strong>Comissão Corretor:</strong> Gerado automaticamente em vendas</li>
            </ul>
            <h4>Origem Automática:</h4>
            <p>Pagamentos são criados automaticamente ao:</p>
            <ul>
              <li>Importar nota fiscal XML</li>
              <li>Registrar compra manual</li>
              <li>Aprovar orçamento de compra</li>
              <li>Criar negociação com comissões</li>
              <li>Contemplar cota de consórcio com lance</li>
            </ul>
            <h4>Vinculação:</h4>
            <ul>
              <li>Centro de Custo</li>
              <li>Tipo de Despesa</li>
              <li>Unidade (obra)</li>
              <li>Cronograma de Obra (etapa)</li>
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
          titulo: "Intenções de Compra",
          descricao: "Captação detalhada de requisitos do cliente",
          conteudo: `
            <h3>Sistema de Intenções de Compra (v4.6)</h3>
            <p>Capture todos os requisitos e preferências do cliente através de wizard interativo com seleção visual de lotes.</p>
            <h4>Wizard em 4 Passos:</h4>
            <ol>
              <li><strong>Cliente e Loteamento:</strong> Selecione cliente e loteamento de interesse</li>
              <li><strong>Selecionar Lote (NOVO v4.6):</strong> Escolha lote visualmente no mapa com filtros avançados</li>
              <li><strong>Detalhes do Imóvel:</strong> Especifique estrutura, cômodos e acabamentos</li>
              <li><strong>Financeiro:</strong> Defina orçamento e condições de pagamento</li>
            </ol>
            <h4>Filtros no Mapa de Lotes (v4.6):</h4>
            <ul>
              <li><strong>Status:</strong> Filtre apenas disponíveis, reservados, em negociação ou vendidos</li>
              <li><strong>Faixa de Preço:</strong> Defina valor mínimo e máximo</li>
              <li><strong>Faixa de Área:</strong> Filtre por área mínima e máxima em m²</li>
              <li><strong>Busca Rápida:</strong> Pesquise por número ou quadra do lote</li>
              <li><strong>Contador:</strong> Veja quantos lotes correspondem aos filtros</li>
              <li><strong>Limpeza:</strong> Limpe todos os filtros com um clique</li>
            </ul>
            <h4>Informações Capturadas:</h4>
            <ul>
              <li><strong>Cliente e Loteamento:</strong> Vinculação com cadastros</li>
              <li><strong>Lote Específico:</strong> Seleção visual no mapa interativo</li>
              <li><strong>Estrutura:</strong> Área, pavimentos, quartos, suítes, banheiros, garagem</li>
              <li><strong>Cômodos:</strong> Seleção detalhada de ambientes (área gourmet, piscina, escritório, etc)</li>
              <li><strong>Acabamentos:</strong> Tipo de telhado, pisos internos/externos, revestimentos</li>
              <li><strong>Cores:</strong> Preferências de cores para fachada, paredes, portas, janelas</li>
              <li><strong>Adicionais:</strong> Ar condicionado, automação, energia solar, segurança, paisagismo</li>
              <li><strong>Orçamento:</strong> Faixa de orçamento mínimo e máximo</li>
            </ul>
            <h4>Opções de Acabamento (v4.3):</h4>
            <ul>
              <li><strong>Telhados:</strong> Cerâmica, Concreto, Fibrocimento, Metálico, Vidro, Laje Impermeabilizada, Verde, <strong>Isotérmica</strong></li>
              <li><strong>Pisos Internos:</strong> Cerâmica, Porcelanato, <strong>Porcelanato Líquido</strong>, Madeira, Laminado, Vinílico, Granito, Mármore, Cimento Queimado</li>
              <li><strong>Pisos Externos:</strong> Cerâmica, Porcelanato, Pedra, Concreto, Grama, Deck de Madeira</li>
              <li><strong>Revestimentos:</strong> Pintura, Textura, Grafiato, Cerâmica, Porcelanato, Pedra, Tijolo Aparente, Madeira</li>
            </ul>
            <h4>Fluxo de Status:</h4>
            <ol>
              <li><strong>Rascunho:</strong> Em preenchimento</li>
              <li><strong>Aguardando Projeto:</strong> Enviado para engenheiro</li>
              <li><strong>Aguardando Reunião:</strong> Projeto pronto, agendar com cliente</li>
              <li><strong>Alteração de Projeto:</strong> Cliente solicitou mudanças</li>
              <li><strong>Aprovado:</strong> Cliente aprovou o projeto</li>
              <li><strong>Cancelado:</strong> Intenção cancelada</li>
            </ol>
            <h4>Integração com Custo de Obra:</h4>
            <p>Após aprovação, gere automaticamente o Custo de Obra com todos os dados da Intenção:</p>
            <ul>
              <li>Área e padrão já preenchidos</li>
              <li>Cômodos e adicionais considerados no cálculo</li>
              <li>IA sugere materiais baseado nas preferências</li>
              <li>Orçamento gerado considera acabamentos selecionados</li>
            </ul>
          `
        },
        {
          titulo: "Custos de Obra",
          descricao: "Orçamento detalhado baseado na Intenção de Compra",
          conteudo: `
            <h3>Custos de Obra Avançado (v4.3)</h3>
            <p>Sistema completo de orçamento e controle de custos de construção, agora integrado com Intenções de Compra.</p>
            <h4>Novo Fluxo (v4.3):</h4>
            <ol>
              <li>Cliente preenche Intenção de Compra com todos os requisitos</li>
              <li>Intenção é aprovada após reunião</li>
              <li>Custo de Obra é gerado automaticamente a partir da Intenção</li>
              <li>IA calcula materiais considerando todos os detalhes do projeto</li>
              <li>Orçamento inclui acabamentos específicos (isotérmica, porcelanato líquido, etc)</li>
            </ol>
            <h4>Dados Importados da Intenção:</h4>
            <ul>
              <li>Área total e pavimentos</li>
              <li>Padrão da obra (econômico a luxo)</li>
              <li>Todos os cômodos selecionados</li>
              <li>Adicionais (ar condicionado, automação, energia solar, etc)</li>
              <li>Tipos de acabamento (telhado, pisos, revestimentos)</li>
              <li>Preferências de cores</li>
            </ul>
            <h4>Funcionalidades:</h4>
            <ul>
              <li><strong>Dashboard Financeiro:</strong> Estimado vs Realizado</li>
              <li><strong>Gerenciar Despesas:</strong> Vincule compras e pagamentos</li>
              <li><strong>Orçamentos de Compra:</strong> Envie cotações para fornecedores</li>
              <li><strong>Pesquisa de Preços IA:</strong> Busque preços regionais automaticamente</li>
              <li><strong>Sugestões IA:</strong> IA sugere materiais baseado no projeto completo</li>
            </ul>
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
          titulo: "Gestão de Tarefas",
          descricao: "Painel centralizado de todas as tarefas",
          conteudo: `
            <h3>Gestão de Tarefas Centralizada</h3>
            <p>Visualize e gerencie todas as tarefas de todos os projetos em um único painel unificado.</p>
            <h4>Acesso:</h4>
            <p>Menu Operacional > Gestão de Tarefas</p>
            <h4>Principais Funcionalidades:</h4>
            <ul>
              <li><strong>Visão Unificada:</strong> Todas as tarefas de cronogramas de obra em um só lugar</li>
              <li><strong>Múltiplas Visualizações:</strong> Alterne entre Lista detalhada e Kanban visual</li>
              <li><strong>Filtros Avançados:</strong> Por responsável, prazo, prioridade, status e unidade</li>
              <li><strong>Ordenação Dinâmica:</strong> Por prazo, prioridade, status ou responsável</li>
              <li><strong>Criação Rápida:</strong> Crie novas tarefas diretamente pelo painel</li>
            </ul>
            <h4>Filtros Disponíveis:</h4>
            <ul>
              <li><strong>Status:</strong> Não Iniciada, Em Andamento, Concluída, Atrasada, Pausada, Cancelada</li>
              <li><strong>Prioridade:</strong> Baixa, Média, Alta, Crítica</li>
              <li><strong>Responsável:</strong> Filtre tarefas de um responsável específico</li>
              <li><strong>Unidade:</strong> Veja tarefas de uma unidade/obra específica</li>
              <li><strong>Prazo:</strong> Vencidas, Vence Hoje, Próximos 7 dias, Próximos 30 dias</li>
            </ul>
            <h4>Estatísticas em Tempo Real:</h4>
            <ul>
              <li>Total de tarefas no sistema</li>
              <li>Quantidade por status (Concluídas, Em Andamento, Atrasadas)</li>
              <li>Tarefas críticas pendentes</li>
              <li>Progresso médio geral</li>
            </ul>
            <h4>Visualização Kanban:</h4>
            <p>Quadro visual estilo kanban com:</p>
            <ul>
              <li>Colunas por status da tarefa</li>
              <li>Cards compactos com informações essenciais</li>
              <li>Badges de prioridade e prazos</li>
              <li>Ações rápidas (editar, concluir, excluir)</li>
            </ul>
            <h4>Ações Rápidas:</h4>
            <ul>
              <li>Editar tarefa em modal</li>
              <li>Alterar status com um clique</li>
              <li>Excluir tarefa diretamente</li>
              <li>Ver detalhes completos</li>
            </ul>
          `
        },
        {
          titulo: "Cronograma de Obra",
          descricao: "Planejamento e controle de prazos",
          conteudo: `
            <h3>Cronograma de Obra</h3>
            <p>Planeje e acompanhe todas as etapas da construção com nível avançado de detalhamento.</p>
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
              <li><strong>Gestão de Tarefas:</strong> Acesse visão unificada de todas as tarefas</li>
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
    portalSocio: {
      titulo: "Portal do Sócio",
      icon: Users,
      color: "purple",
      itens: [
        {
          titulo: "Portal do Sócio - Visão Geral",
          descricao: "Sistema completo para sócios acompanharem investimentos",
          conteudo: `
            <h3>Portal do Sócio Riviera (v4.7)</h3>
            <p>Plataforma exclusiva para sócios acompanharem seus investimentos e aportes.</p>
            <h4>Principais Funcionalidades:</h4>
            <ul>
              <li><strong>Dashboard Inteligente:</strong> Visão geral de aportes, vendas e loteamentos</li>
              <li><strong>Notificações Push:</strong> Alertas sobre novos documentos, atas e aportes vencendo</li>
              <li><strong>Central de Documentos:</strong> Acesso a atas, DREs, balanços e documentos societários</li>
              <li><strong>Relatórios Financeiros:</strong> Análise completa de receitas, despesas e performance</li>
              <li><strong>Gestão de Aportes:</strong> Acompanhamento completo de contribuições</li>
            </ul>
            <h4>Acesso ao Portal:</h4>
            <ol>
              <li>Sócio recebe convite por email após cadastro</li>
              <li>Cria senha no primeiro acesso</li>
              <li>Login via email + senha</li>
              <li>Acesso a todos os dados da sociedade</li>
            </ol>
          `
        },
        {
          titulo: "Sistema de Notificações para Sócios",
          descricao: "Notificações em tempo real para sócios (v4.7)",
          conteudo: `
            <h3>Sistema de Notificações Push para Sócios (v4.7)</h3>
            <p>Sócios recebem notificações instantâneas sobre atualizações importantes da sociedade.</p>
            <h4>Tipos de Notificação:</h4>
            <ul>
              <li><strong>Documentos:</strong> Nova ata publicada, DRE disponível, balanço patrimonial</li>
              <li><strong>Financeiro:</strong> Novo aporte vencendo, aporte em atraso, receita significativa</li>
              <li><strong>Assembleias:</strong> Convocação de assembleia, resultado de votação</li>
              <li><strong>Vendas:</strong> Nova venda concluída, meta de vendas atingida</li>
              <li><strong>Sistema:</strong> Atualizações importantes, comunicados gerais</li>
            </ul>
            <h4>Como Funciona:</h4>
            <ul>
              <li>Notificações aparecem no sino 🔔 do portal</li>
              <li>Badge vermelho mostra quantidade não lidas</li>
              <li>Push notifications no navegador (se permitido)</li>
              <li>Atualização automática a cada 30 segundos</li>
              <li>Agrupamento por categoria</li>
            </ul>
            <h4>Central de Notificações:</h4>
            <ul>
              <li>Visualize todas as notificações em ordem cronológica</li>
              <li>Filtre por tipo (todos, documentos, financeiro, assembleias)</li>
              <li>Marcar todas como lidas de uma vez</li>
              <li>Histórico completo mantido no sistema</li>
            </ul>
            <h4>Envio pelo Administrador:</h4>
            <p>Administradores podem enviar notificações via menu:</p>
            <ol>
              <li>Acesse Documentação > Notificar Sócios</li>
              <li>Escolha tipo, título e mensagem</li>
              <li>Selecione sócios destinatários</li>
              <li>Envie notificação instantânea</li>
            </ol>
          `
        },
        {
          titulo: "Sistema de Documentos para Sócios",
          descricao: "Gestão de documentos societários (v4.7)",
          conteudo: `
            <h3>Sistema de Documentos Societários (v4.7)</h3>
            <p>Central completa para administradores gerenciarem e apresentarem documentos aos sócios.</p>
            <h4>Tipos de Documento:</h4>
            <ul>
              <li><strong>Contrato Social:</strong> Contrato constitutivo da sociedade</li>
              <li><strong>Ata de Reunião:</strong> Atas de assembleias e reuniões</li>
              <li><strong>Balanço Patrimonial:</strong> Balanços periódicos</li>
              <li><strong>Relatório Financeiro:</strong> Relatórios de performance</li>
              <li><strong>DRE:</strong> Demonstração do Resultado do Exercício</li>
              <li><strong>Balancete:</strong> Balancetes mensais/trimestrais</li>
              <li><strong>Estatuto:</strong> Estatuto social</li>
              <li><strong>Regimento Interno:</strong> Regras internas</li>
            </ul>
            <h4>Categorias no Portal:</h4>
            <ul>
              <li><strong>Atas e Assembleias:</strong> Documentos de reuniões e decisões</li>
              <li><strong>Documentos da Sociedade:</strong> DREs, balanços, relatórios, contratos</li>
            </ul>
            <h4>Upload e Apresentação:</h4>
            <ol>
              <li>Acesse Documentação > Documentos para Sócios</li>
              <li>Clique em "Novo Documento"</li>
              <li>Faça upload do arquivo (PDF recomendado)</li>
              <li>Preencha título, tipo e categoria</li>
              <li>Marque "Apresentar para Sócios" para tornar visível</li>
              <li>Opcionalmente marque como confidencial</li>
              <li>Salve e documento estará disponível no portal</li>
            </ol>
            <h4>Controle de Acesso:</h4>
            <ul>
              <li>Apenas documentos marcados como "apresentado_para_socios" são visíveis</li>
              <li>Documentos confidenciais são sinalizados</li>
              <li>Controle de versão para atualizações</li>
              <li>Data de apresentação registrada automaticamente</li>
            </ul>
            <h4>Visualização pelos Sócios:</h4>
            <ul>
              <li>Aba "Atas e Assembleias" mostra atas e documentos relacionados</li>
              <li>Aba "Documentos da Sociedade" mostra DREs, balanços e outros</li>
              <li>Preview e download disponíveis</li>
              <li>Informações de tamanho e data</li>
            </ul>
          `
        },
        {
          titulo: "Relatórios Completos para Sócios",
          descricao: "Dashboards e análises financeiras (v4.7)",
          conteudo: `
            <h3>Sistema de Relatórios para Sócios (v4.7)</h3>
            <p>Dashboards completos com análises financeiras e de performance dos loteamentos.</p>
            <h4>Relatórios Disponíveis:</h4>
            <ul>
              <li><strong>Relatórios Gerais:</strong> Visão geral com gráficos de aportes, vendas e receitas</li>
              <li><strong>Relatórios Financeiros:</strong> Análise detalhada de DRE, fluxo de caixa e rentabilidade</li>
            </ul>
            <h4>Gráficos Interativos (Relatórios Gerais):</h4>
            <ul>
              <li><strong>Aportes Mensais:</strong> Comparativo entre pago e pendente por mês</li>
              <li><strong>Status das Unidades:</strong> Pizza mostrando distribuição (vendidas, disponíveis, etc)</li>
              <li><strong>Receitas Mensais:</strong> Linha temporal de receitas recebidas</li>
              <li><strong>Vendas por Loteamento:</strong> Barra horizontal mostrando vendidas vs disponíveis</li>
            </ul>
            <h4>Cards de Resumo:</h4>
            <ul>
              <li>Total Aportado (valor pago)</li>
              <li>Unidades Vendidas (quantidade)</li>
              <li>Receita Total (valor recebido)</li>
              <li>Quantidade de Loteamentos</li>
            </ul>
            <h4>Relatórios Financeiros Detalhados:</h4>
            <ul>
              <li><strong>DRE Comparativa:</strong> Receitas vs Despesas mês a mês</li>
              <li><strong>Fluxo de Caixa:</strong> Entradas, saídas e saldo por período</li>
              <li><strong>Performance por Loteamento:</strong> Receita e margem de cada projeto</li>
              <li><strong>Distribuição de Despesas:</strong> Gráfico de pizza por tipo de despesa</li>
            </ul>
            <h4>Filtros e Período:</h4>
            <ul>
              <li>Últimos 3, 6 ou 12 meses</li>
              <li>Exportação de relatórios em PDF</li>
              <li>Atualização em tempo real</li>
            </ul>
          `
        }
      ]
    },
    portalCliente: {
      titulo: "Portal do Cliente",
      icon: FileText,
      color: "rose",
      itens: [
        {
          titulo: "Visão Geral do Portal",
          descricao: "Sistema completo para acompanhamento do cliente",
          conteudo: `
            <h3>Portal do Cliente Riviera</h3>
            <p>Plataforma exclusiva onde clientes acompanham seu investimento em tempo real.</p>
            <h4>Principais Funcionalidades:</h4>
            <ul>
              <li><strong>Dashboard Inteligente:</strong> Visão geral do investimento com progresso de pagamento e obra</li>
              <li><strong>Notificações Push:</strong> Alertas em tempo real sobre atualizações, novos documentos e mensagens</li>
              <li><strong>Acompanhamento de Obra:</strong> Cronograma atualizado com fotos e progresso das etapas</li>
              <li><strong>Central de Documentos:</strong> Acesso a contratos, boletos e comprovantes</li>
              <li><strong>Pagamento Online:</strong> Pagamento de parcelas via PIX, boleto ou cartão</li>
              <li><strong>Mensagens Diretas:</strong> Comunicação direta com a incorporadora</li>
            </ul>
            <h4>Acesso ao Portal:</h4>
            <ol>
              <li>Cliente recebe convite por email após venda</li>
              <li>Cria senha no primeiro acesso</li>
              <li>Login via email + senha</li>
              <li>Acesso completo aos seus dados</li>
            </ol>
          `
        },
        {
          titulo: "Sistema de Notificações",
          descricao: "Notificações em tempo real para o cliente",
          conteudo: `
            <h3>Sistema de Notificações Push</h3>
            <p>Clientes recebem notificações instantâneas sobre atualizações importantes.</p>
            <h4>Tipos de Notificação:</h4>
            <ul>
              <li><strong>Obra:</strong> Nova foto adicionada, etapa concluída, atualização de progresso</li>
              <li><strong>Financeiro:</strong> Boleto gerado, pagamento vencendo, pagamento confirmado</li>
              <li><strong>Documentos:</strong> Novo contrato disponível, documento assinado</li>
              <li><strong>Mensagens:</strong> Nova mensagem da incorporadora</li>
              <li><strong>Sistema:</strong> Atualizações importantes, manutenções programadas</li>
            </ul>
            <h4>Como Funciona:</h4>
            <ul>
              <li>Notificações aparecem no sino 🔔 do portal</li>
              <li>Badge vermelho mostra quantidade não lidas</li>
              <li>Push notifications no navegador (se permitido)</li>
              <li>Atualização automática a cada 10 segundos</li>
            </ul>
            <h4>Configuração:</h4>
            <ul>
              <li>Cliente pode ativar/desativar notificações do navegador</li>
              <li>Marcar todas como lidas de uma vez</li>
              <li>Histórico completo mantido no sistema</li>
            </ul>
          `
        },
        {
          titulo: "Central de Documentos",
          descricao: "Visualização, download e organização",
          conteudo: `
            <h3>Central de Documentos</h3>
            <p>Acesso completo a todos os documentos relacionados ao imóvel.</p>
            <h4>Categorias de Documentos:</h4>
            <ul>
              <li><strong>Contratos:</strong> Contratos de compra e venda, aditivos, termos</li>
              <li><strong>Comprovantes:</strong> Comprovantes de pagamento gerados automaticamente</li>
              <li><strong>Fotos da Obra:</strong> Galeria organizada por data e etapa</li>
              <li><strong>Outros:</strong> Projetos, documentação técnica, notas fiscais</li>
            </ul>
            <h4>Funcionalidades:</h4>
            <ul>
              <li><strong>Preview:</strong> Visualize documentos sem fazer download</li>
              <li><strong>Download:</strong> Baixe documentos em um clique</li>
              <li><strong>Busca:</strong> Encontre documentos por nome ou descrição</li>
              <li><strong>Filtros:</strong> Filtre por tipo, status ou data</li>
              <li><strong>Galeria de Fotos:</strong> Visualização em grid com lightbox</li>
            </ul>
            <h4>Contratos:</h4>
            <ul>
              <li>Visualize contratos assinados</li>
              <li>Veja status (aguardando assinatura, assinado, ativo)</li>
              <li>Baixe PDF para impressão</li>
              <li>Consulte valor total e condições</li>
            </ul>
            <h4>Comprovantes de Pagamento:</h4>
            <ul>
              <li>Comprovantes gerados automaticamente ao pagar</li>
              <li>Informações completas: data, valor, forma de pagamento</li>
              <li>Download em PDF</li>
              <li>Histórico completo de pagamentos</li>
            </ul>
          `
        },
        {
          titulo: "Acompanhamento de Obra",
          descricao: "Cronograma e fotos em tempo real",
          conteudo: `
            <h3>Acompanhamento de Obra em Tempo Real</h3>
            <p>Veja o progresso da construção do seu imóvel atualizado diariamente.</p>
            <h4>Dashboard de Progresso:</h4>
            <ul>
              <li>Progresso geral da obra (percentual)</li>
              <li>Etapas concluídas vs em andamento</li>
              <li>Etapas atrasadas (alertas visuais)</li>
              <li>Barra de progresso visual</li>
            </ul>
            <h4>Cronograma Detalhado:</h4>
            <p>Cada etapa mostra:</p>
            <ul>
              <li>Nome e descrição da etapa</li>
              <li>Status (não iniciada, em andamento, concluída, atrasada)</li>
              <li>Percentual de conclusão</li>
              <li>Data de início e fim (prevista e real)</li>
              <li>Dias restantes para conclusão</li>
              <li>Alertas para etapas atrasadas</li>
            </ul>
            <h4>Galeria de Fotos:</h4>
            <ul>
              <li><strong>Fotos Recentes:</strong> Últimas 12 fotos da obra</li>
              <li><strong>Por Etapa:</strong> Fotos organizadas por fase da construção</li>
              <li><strong>Visualização:</strong> Grid responsivo com lightbox para ampliar</li>
              <li><strong>Detalhes:</strong> Título, descrição e data de cada foto</li>
              <li><strong>Atualização:</strong> Fotos são sincronizadas a cada 30 segundos</li>
            </ul>
            <h4>Indicadores Visuais:</h4>
            <ul>
              <li>🟢 Verde: Etapa concluída</li>
              <li>🔵 Azul: Em andamento (ícone pulsante)</li>
              <li>🔴 Vermelho: Atrasada</li>
              <li>🟡 Amarelo: Pausada</li>
              <li>⚪ Cinza: Não iniciada</li>
            </ul>
            <h4>Acesso Mobile:</h4>
            <ul>
              <li>Design 100% responsivo</li>
              <li>Fotos otimizadas para mobile</li>
              <li>Navegação touch-friendly</li>
            </ul>
          `
        },
        {
          titulo: "Central de Mensagens",
          descricao: "Comunicação direta com a incorporadora",
          conteudo: `
            <h3>Sistema de Mensagens Diretas</h3>
            <p>Converse diretamente com a equipe da Riviera através de um sistema de mensagens integrado.</p>
            <h4>Funcionalidades:</h4>
            <ul>
              <li><strong>Conversas Organizadas:</strong> Threads separadas por assunto</li>
              <li><strong>Tempo Real:</strong> Mensagens atualizadas a cada 5 segundos</li>
              <li><strong>Histórico Completo:</strong> Acesso a todo histórico de conversas</li>
              <li><strong>Indicador de Leitura:</strong> Veja quando a incorporadora leu sua mensagem</li>
              <li><strong>Badge de Não Lidas:</strong> Contador de mensagens não lidas</li>
            </ul>
            <h4>Tipos de Assunto:</h4>
            <ul>
              <li>Geral - Dúvidas gerais</li>
              <li>Negociação - Sobre contrato e venda</li>
              <li>Pagamento - Dúvidas financeiras</li>
              <li>Documento - Solicitação de documentos</li>
              <li>Obra - Acompanhamento da construção</li>
              <li>Financeiro - Questões financeiras</li>
              <li>Suporte - Ajuda técnica</li>
            </ul>
            <h4>Criar Nova Conversa:</h4>
            <ol>
              <li>Clique em "Nova Conversa"</li>
              <li>Defina um título descritivo</li>
              <li>Escolha o assunto</li>
              <li>Escreva sua mensagem</li>
              <li>Envie e aguarde resposta</li>
            </ol>
            <h4>Encerrar Conversa:</h4>
            <ul>
              <li>Conversas resolvidas podem ser encerradas</li>
              <li>Histórico completo enviado por email</li>
              <li>Conversa arquivada para consulta futura</li>
            </ul>
            <h4>Status das Conversas:</h4>
            <ul>
              <li><strong>Aberto:</strong> Aguardando resposta</li>
              <li><strong>Em Andamento:</strong> Sendo tratado pela equipe</li>
              <li><strong>Resolvido:</strong> Questão resolvida</li>
              <li><strong>Fechado:</strong> Conversa encerrada</li>
            </ul>
          `
        },
        {
          titulo: "Pagamentos Online",
          descricao: "Pague suas parcelas pelo portal",
          conteudo: `
            <h3>Sistema de Pagamentos Online</h3>
            <p>Pague suas parcelas de forma rápida e segura diretamente pelo portal.</p>
            <h4>Formas de Pagamento:</h4>
            <ul>
              <li><strong>PIX:</strong> QR Code instantâneo, pagamento em segundos</li>
              <li><strong>Cartão de Crédito:</strong> Pagamento processado online</li>
              <li><strong>Boleto Bancário:</strong> Geração e download imediato</li>
            </ul>
            <h4>Fluxo de Pagamento:</h4>
            <ol>
              <li>Acesse Financeiro > Pagamentos Pendentes</li>
              <li>Clique em "Pagar Online" na parcela</li>
              <li>Escolha forma de pagamento</li>
              <li>Preencha dados (se cartão)</li>
              <li>Confirme pagamento</li>
              <li>Receba confirmação instantânea</li>
            </ol>
            <h4>Download de Boletos:</h4>
            <ul>
              <li>Visualize boletos pendentes</li>
              <li>Baixe PDF do boleto</li>
              <li>Copie código de barras</li>
              <li>PIX copia e cola disponível</li>
            </ul>
            <h4>Comprovantes:</h4>
            <ul>
              <li>Comprovante gerado automaticamente ao pagar</li>
              <li>Disponível na aba "Histórico"</li>
              <li>Download em PDF</li>
              <li>Válido para declaração de IR</li>
            </ul>
            <h4>Segurança:</h4>
            <ul>
              <li>🔒 Criptografia de ponta a ponta</li>
              <li>🛡️ Integração com gateways certificados PCI-DSS</li>
              <li>✅ Dados de cartão não armazenados</li>
              <li>📧 Confirmação por email</li>
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
            <h3>Portal para Imobiliárias Parceiras (v4.6)</h3>
            <p>Sistema unificado exclusivo para imobiliárias visualizarem loteamentos e cadastrarem leads com mapa interativo.</p>
            <h4>Dashboard Unificado (v4.6):</h4>
            <ul>
              <li><strong>Mapa de Loteamentos:</strong> Visualize todos os lotes disponíveis em mapa interativo</li>
              <li><strong>Seleção Visual:</strong> Clique em lotes para ver detalhes e criar pré-intenções</li>
              <li><strong>Estatísticas em Tempo Real:</strong> Veja disponibilidade por status</li>
              <li><strong>Criação Rápida:</strong> Crie pré-intenções diretamente do mapa</li>
            </ul>
            <h4>Acesso da Imobiliária:</h4>
            <ul>
              <li>Login dedicado para cada imobiliária</li>
              <li>Visualização apenas dos próprios leads</li>
              <li>Acesso a todos os loteamentos com mapa</li>
              <li>Cadastro rápido de interessados</li>
              <li>Acompanhamento de aprovações</li>
            </ul>
            <h4>Workflow do Lead:</h4>
            <ol>
              <li>Imobiliária acessa mapa de loteamentos</li>
              <li>Seleciona loteamento e visualiza lotes disponíveis</li>
              <li>Clica em lote verde (disponível)</li>
              <li>Cria pré-intenção para seu cliente</li>
              <li>Incorporadora analisa e aprova</li>
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
            <p>Crie contratos e documentos automaticamente usando templates e inteligência artificial.</p>
            <h4>Templates Disponíveis:</h4>
            <ul>
              <li>Contrato de Compra e Venda</li>
              <li>Contrato de Locação</li>
              <li>Proposta Comercial</li>
              <li>Ficha Cadastral</li>
              <li>Termo de Entrega</li>
              <li>Distrato</li>
              <li>Aditivo Contratual</li>
              <li>Procuração</li>
              <li>Declaração</li>
            </ul>
            <h4>Geração de Contratos de Venda:</h4>
            <ol>
              <li>Na negociação, clique em "Gerar Contrato"</li>
              <li>Escolha o template</li>
              <li>Selecione dados a incluir (Cliente, Unidade, Financeiro, Loteamento)</li>
              <li>Revise e edite o prompt da IA</li>
              <li>Salve prompts personalizados para reutilizar</li>
              <li>Confirme e aguarde geração</li>
            </ol>
            <h4>Aprovação de Contrato:</h4>
            <p>Após gerar o contrato:</p>
            <ul>
              <li>Status da negociação: Aguardando Assinatura</li>
              <li>Status da unidade: Reservada</li>
              <li>Ao aprovar contrato: define datas de assinatura e entrega</li>
              <li>Unidade passa para: Vendida</li>
              <li>Negociação passa para: Contrato Assinado</li>
            </ul>
            <h4>Personalização:</h4>
            <ul>
              <li>Edite o prompt da IA antes de gerar</li>
              <li>Salve prompts favoritos no template</li>
              <li>Carregue prompts salvos para reutilizar</li>
              <li>IA preenche automaticamente com dados do sistema</li>
            </ul>
          `
        },
        {
          titulo: "Assistente Jurídico IA",
          descricao: "Assistente jurídico completo para o setor imobiliário",
          conteudo: `
            <h3>Assistente Jurídico com IA</h3>
            <p>Ferramenta completa de IA para auxílio jurídico no setor imobiliário e construção civil.</p>
            <h4>Acesso:</h4>
            <p>Menu Documentação > Assistente Jurídico</p>
            <h4>1. Geração de Documentos Legais:</h4>
            <p>Crie documentos jurídicos completos com base em inputs:</p>
            <ul>
              <li>Contratos de Compra e Venda</li>
              <li>Contratos de Locação</li>
              <li>Contratos de Parceria/Sociedade</li>
              <li>Contratos de Prestação de Serviços</li>
              <li>Contratos de Empreitada</li>
              <li>Distratos e Rescisões</li>
              <li>Aditivos Contratuais</li>
              <li>Procurações</li>
              <li>Declarações</li>
              <li>Notificações Extrajudiciais</li>
              <li>Termos de Entrega e Vistoria</li>
            </ul>
            <h4>2. Análise de Documentos:</h4>
            <p>Faça upload ou cole o texto de qualquer documento para análise:</p>
            <ul>
              <li><strong>Identificar Riscos:</strong> Encontra riscos jurídicos e cláusulas abusivas</li>
              <li><strong>Inconsistências:</strong> Detecta contradições e ambiguidades</li>
              <li><strong>Cláusulas Faltantes:</strong> Lista cláusulas importantes ausentes</li>
              <li><strong>Compliance:</strong> Verifica conformidade com legislação brasileira</li>
              <li><strong>Análise Completa:</strong> Todas as verificações acima</li>
            </ul>
            <h4>3. Resumo Executivo:</h4>
            <p>Transforme documentos longos em resumos claros:</p>
            <ul>
              <li>Tipo de documento e partes envolvidas</li>
              <li>Objeto principal e valores</li>
              <li>Principais obrigações de cada parte</li>
              <li>Cláusulas importantes destacadas</li>
              <li>Penalidades e multas</li>
              <li>Pontos de atenção</li>
            </ul>
            <h4>4. Insights Jurídicos:</h4>
            <p>Obtenha consultoria jurídica sobre temas do setor:</p>
            <ul>
              <li>Compra e Venda de Imóveis</li>
              <li>Locação de Imóveis</li>
              <li>Construção Civil</li>
              <li>Direito Condominial</li>
              <li>Financiamento Imobiliário</li>
              <li>Incorporação Imobiliária</li>
              <li>Usucapião</li>
              <li>Registros e Cartórios</li>
            </ul>
            <h4>Score de Risco:</h4>
            <p>A análise de documentos inclui um score de 0 a 100:</p>
            <ul>
              <li>🟢 0-40: Baixo risco</li>
              <li>🟡 41-70: Risco moderado</li>
              <li>🔴 71-100: Alto risco</li>
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
          titulo: "Dashboard Customizável",
          descricao: "Monte seu próprio dashboard",
          conteudo: `
            <h3>Dashboard Customizável</h3>
            <p>Personalize seu dashboard escolhendo quais indicadores exibir.</p>
            <h4>Widgets Disponíveis:</h4>
            <ul>
              <li><strong>Financeiros:</strong> Saldo, Receitas, Despesas, Lucro, Contas a Receber/Pagar</li>
              <li><strong>Vendas:</strong> Vendas do Mês, Ticket Médio, Taxa de Conversão, Leads Ativos</li>
              <li><strong>Obras:</strong> Obras em Andamento, Tarefas Atrasadas, Custo Total</li>
              <li><strong>Gráficos:</strong> Vendas, Fluxo de Caixa, Status de Unidades</li>
            </ul>
            <h4>Como Configurar:</h4>
            <ol>
              <li>Acesse Dashboard > Dashboard Customizável</li>
              <li>Clique em "Configurar"</li>
              <li>Escolha os widgets por categoria</li>
              <li>Ative/desative com o switch</li>
              <li>Clique em "Salvar"</li>
            </ol>
            <h4>Recursos:</h4>
            <ul>
              <li>Preferências salvas por usuário</li>
              <li>Atualização em tempo real</li>
              <li>Layout responsivo automático</li>
              <li>Gráficos interativos</li>
            </ul>
          `
        },
        {
          titulo: "Exportação de Relatórios",
          descricao: "Exporte relatórios em múltiplos formatos",
          conteudo: `
            <h3>Exportação de Relatórios</h3>
            <p>Todos os relatórios podem ser exportados em CSV, Excel ou PDF.</p>
            <h4>Formatos Disponíveis:</h4>
            <ul>
              <li><strong>CSV:</strong> Formato universal para análise de dados</li>
              <li><strong>Excel (.xls):</strong> Com formatação e cores</li>
              <li><strong>PDF:</strong> Para impressão e compartilhamento</li>
            </ul>
            <h4>Como Exportar:</h4>
            <ol>
              <li>Acesse qualquer relatório</li>
              <li>Clique no botão "Exportar"</li>
              <li>Escolha o formato desejado</li>
              <li>Arquivo será baixado automaticamente</li>
            </ol>
            <h4>Recursos:</h4>
            <ul>
              <li>Exportação mantém filtros aplicados</li>
              <li>Nome do arquivo com data automática</li>
              <li>Formatação de valores em moeda brasileira</li>
              <li>Headers coloridos no Excel</li>
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
          v4.7.0 • 2026
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
          <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
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
                          <div className="flex items-start justify-between gap-3 text-left w-full">
                            <div className="flex items-start gap-3 flex-1">
                              <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <h3 className="font-bold text-lg text-gray-900">{item.titulo}</h3>
                                <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>
                              </div>
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

      {/* Tutoriais em Vídeo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-600" />
            Tutoriais em Vídeo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TutoriaisDisponiveis />
        </CardContent>
      </Card>
    </div>
  );
}