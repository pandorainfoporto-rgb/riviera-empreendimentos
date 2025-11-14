import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { etapa, padrao, estado, area, detalhamento_projeto } = await req.json();

        console.log('📥 Parâmetros recebidos:', { etapa, padrao, estado, area, tem_detalhamento: !!detalhamento_projeto });

        // BUSCAR PRODUTOS DO ESTOQUE
        const itensEstoque = await base44.asServiceRole.entities.ItemEstoque.filter({ 
            ativo: true,
            tipo_item: 'produto'
        });

        console.log(`📦 ${itensEstoque.length} produtos encontrados no estoque`);

        const det = detalhamento_projeto || {};
        const totalQuartos = (det.quartos_terreo || 0) + (det.suites_terreo || 0) + (det.quartos_superior || 0) + (det.suites_superior || 0);
        const totalSuites = (det.suites_terreo || 0) + (det.suites_superior || 0);
        const totalBanheiros = (det.banheiros_sociais || 0) + totalSuites + (det.lavabo ? 1 : 0);

        const etapasNomes = {
            terreno_preparacao: 'Preparação do Terreno',
            fundacao: 'Fundação',
            estrutura: 'Estrutura',
            impermeabilizacao: 'Impermeabilização',
            alvenaria: 'Alvenaria',
            cobertura: 'Cobertura e Telhado',
            instalacoes_eletricas: 'Instalações Elétricas',
            instalacoes_hidraulicas: 'Instalações Hidráulicas',
            instalacoes_gas: 'Instalações de Gás',
            aquecimento_solar: 'Aquecimento Solar',
            energia_solar: 'Energia Solar Fotovoltaica',
            ar_condicionado: 'Ar Condicionado',
            revestimentos: 'Revestimentos (azulejos, cerâmicas)',
            pintura: 'Pintura',
            esquadrias: 'Esquadrias (portas e janelas)',
            pisos: 'Pisos',
            forros: 'Forros',
            acabamento: 'Acabamento Geral',
            louca_metais: 'Louças e Metais',
            mobilia: 'Mobília',
            automacao: 'Automação Residencial',
            seguranca: 'Sistema de Segurança',
            wifi_dados: 'Rede WiFi e Dados',
            paisagismo: 'Paisagismo',
            limpeza_final: 'Limpeza Final',
        };

        const padraoDescricao = {
            medio_baixo: 'Econômico - materiais funcionais de qualidade aceitável, marcas nacionais básicas',
            medio: 'Médio - materiais de boa qualidade, marcas conhecidas (Portinari, Quartzolit, Tigre)',
            alto: 'Alto - materiais premium, marcas de primeira linha (Portobello, Ceusa, Deca Premium)',
            luxo: 'Luxo - materiais de altíssima qualidade, importados, marcas de luxo (Roca, Hansgrohe, Eliane Premium)'
        };

        // CRIAR LISTA DE PRODUTOS DO ESTOQUE PARA A IA
        const produtosEstoqueInfo = itensEstoque.map(item => ({
            descricao: item.descricao,
            codigo: item.codigo,
            marca: item.marca,
            estoque_atual: item.estoque_atual || 0,
            preco_venda: item.preco_venda || 0,
            unidade: item.unidade_padrao
        }));

        const prompt = `Você é um especialista em materiais de construção civil no Brasil com 20 anos de experiência.

🎯 TAREFA: Sugerir os 10 MELHORES materiais para "${etapasNomes[etapa]}" em padrão "${padrao.toUpperCase()}".

📋 DESCRIÇÃO DO PADRÃO: ${padraoDescricao[padrao]}

🏠 PROJETO:
- Área: ${area}m²
- ${totalQuartos} quartos (${totalSuites} suítes)
- ${totalBanheiros} banheiros
- Área Gourmet: ${det.area_gourmet ? 'SIM' : 'NÃO'}
- Piscina: ${det.piscina ? `SIM (${det.piscina_tipo}, ${det.piscina_tamanho_m2}m²)` : 'NÃO'}
- Garagem: ${(det.garagem_vagas || 0) + (det.subsolo_garagem_vagas || 0)} vagas

📦 PRODUTOS EM ESTOQUE (PRIORIDADE MÁXIMA):
${produtosEstoqueInfo.length > 0 ? produtosEstoqueInfo.map(p => 
    `- ${p.descricao} (${p.marca || 'N/A'}) | Estoque: ${p.estoque_atual} ${p.unidade} | R$ ${p.preco_venda.toFixed(2)}`
).join('\n') : 'Nenhum produto em estoque'}

⚠️ REGRAS CRÍTICAS:
1. **PRIORIDADE ABSOLUTA**: Use SEMPRE produtos do estoque acima quando aplicáveis à etapa
2. Se produto do estoque tiver quantidade suficiente, marque "origem_estoque": true e "tem_quantidade": true
3. Se produto do estoque NÃO tiver quantidade suficiente, marque "origem_estoque": true e "tem_quantidade": false e indique "quantidade_faltante"
4. Só sugira produtos externos quando não houver similar no estoque
5. Quantidades SEMPRE INTEIRAS (m², m³, diárias, horas, sacos, unidades)
6. Produtos REAIS vendidos no Brasil com marcas ESPECÍFICAS
7. Preços de ${estado} em 2024/2025

📌 EXEMPLOS DE RETORNO:

**Produto do Estoque com quantidade:**
{
  "nome": "Cimento CP-II-E-32 Votoran 50kg",
  "especificacao": "Cimento Portland composto, ideal para fundações e estruturas",
  "unidade_medida": "saco",
  "quantidade_total": 45,
  "valor_unitario_atual": 32.00,
  "origem_estoque": true,
  "tem_quantidade": true,
  "estoque_id": "referência ao código/descrição do estoque"
}

**Produto do Estoque SEM quantidade suficiente:**
{
  "nome": "Areia média lavada",
  "especificacao": "Areia lavada para fundação e alvenaria",
  "unidade_medida": "m3",
  "quantidade_total": 8,
  "valor_unitario_atual": 120.00,
  "origem_estoque": true,
  "tem_quantidade": false,
  "quantidade_estoque": 2,
  "quantidade_faltante": 6,
  "sugestao_compra": "⚠️ Comprar 6m³ adicionais"
}

**Produto NÃO do estoque:**
{
  "nome": "Brita nº 1",
  "especificao": "Brita graduada para concreto",
  "unidade_medida": "m3",
  "quantidade_total": 6,
  "valor_unitario_atual": 110.00,
  "origem_estoque": false
}

Retorne JSON com array "materiais" e "observacoes_gerais".`;

        console.log('🤖 Chamando IA...');

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    materiais: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                nome: { type: "string" },
                                categoria: {
                                    type: "string",
                                    enum: ["material", "mao_de_obra", "equipamento", "servico", "moveis", "eletrodomesticos"]
                                },
                                especificacao: { type: "string" },
                                unidade_medida: {
                                    type: "string",
                                    enum: ["m2", "m3", "m", "kg", "saco", "unidade", "conjunto", "servico", "hora", "diaria", "litro", "balde", "lata", "galao", "rolo", "barra", "caixa"]
                                },
                                quantidade_por_m2: { type: "number" },
                                quantidade_total: { type: "number" },
                                valor_unitario_atual: { type: "number" },
                                marca_sugerida: { type: "string" },
                                fornecedor_sugerido: { type: "string" },
                                justificativa: { type: "string" },
                                rendimento: { type: "string" },
                                norma_tecnica: { type: "string" },
                                origem_estoque: { type: "boolean" },
                                tem_quantidade: { type: "boolean" },
                                quantidade_estoque: { type: "number" },
                                quantidade_faltante: { type: "number" },
                                sugestao_compra: { type: "string" },
                                estoque_id: { type: "string" }
                            }
                        }
                    },
                    observacoes_gerais: { type: "string" }
                }
            }
        });

        console.log('✅ Resposta da IA:', response);

        if (!response || !response.materiais || !Array.isArray(response.materiais) || response.materiais.length === 0) {
            console.log('⚠️ IA retornou vazio ou inválido');
            return Response.json({
                success: false,
                message: `IA não retornou sugestões para "${etapasNomes[etapa]}". Tente outra etapa ou adicione itens manualmente.`,
                data: { materiais: [], observacoes: 'Nenhuma sugestão disponível' }
            });
        }

        const materiaisProcessados = response.materiais.map(mat => {
            const unidadesInteiras = ['unidade', 'conjunto', 'saco', 'balde', 'lata', 'galao', 'rolo', 'barra', 'caixa', 'm2', 'm3', 'diaria', 'hora', 'servico'];
            let qtdTotal = mat.quantidade_total || (mat.quantidade_por_m2 * area);

            if (unidadesInteiras.includes(mat.unidade_medida)) {
                qtdTotal = Math.ceil(qtdTotal);
            }

            return {
                ...mat,
                quantidade_total: qtdTotal
            };
        });

        console.log(`✅ ${materiaisProcessados.length} materiais processados`);

        return Response.json({
            success: true,
            data: {
                materiais: materiaisProcessados,
                observacoes: response.observacoes_gerais || `${materiaisProcessados.length} materiais sugeridos para ${etapasNomes[etapa]}`
            }
        });

    } catch (error) {
        console.error('❌ Erro ao sugerir materiais:', error);
        return Response.json({
            success: false,
            error: error.message,
            message: `Erro ao processar: ${error.message}`,
            data: { materiais: [], observacoes: 'Erro ao buscar sugestões' }
        }, { status: 500 });
    }
});