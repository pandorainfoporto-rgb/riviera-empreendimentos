import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * 🔄 INTEGRAÇÃO PIPEFY
 * Automatiza processos e gestão de obras/vendas
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, api_token, pipe_id, card_data } = await req.json();

        const PIPEFY_ENDPOINT = 'https://api.pipefy.com/graphql';

        // HELPER: Executar query GraphQL
        const executarQuery = async (query, variables = {}) => {
            const response = await fetch(PIPEFY_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${api_token}`,
                },
                body: JSON.stringify({ query, variables }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Erro Pipefy: ${JSON.stringify(error)}`);
            }

            return await response.json();
        };

        // 1. CRIAR CARD (Lead, Obra, Contrato, etc)
        if (action === 'criarCard') {
            console.log('📝 Criando card no Pipefy...');

            const mutation = `
                mutation CreateCard($input: CreateCardInput!) {
                    createCard(input: $input) {
                        card {
                            id
                            title
                            url
                        }
                    }
                }
            `;

            const result = await executarQuery(mutation, {
                input: {
                    pipe_id: pipe_id,
                    title: card_data.titulo,
                    fields_attributes: card_data.campos || [],
                    assignee_ids: card_data.responsaveis || [],
                }
            });

            console.log('✅ Card criado:', result.data.createCard.card.id);

            return Response.json({
                success: true,
                card_id: result.data.createCard.card.id,
                url: result.data.createCard.card.url,
            });
        }

        // 2. ATUALIZAR CARD
        if (action === 'atualizarCard') {
            console.log('🔄 Atualizando card no Pipefy...');

            const mutation = `
                mutation UpdateCard($input: UpdateCardInput!) {
                    updateCard(input: $input) {
                        card {
                            id
                        }
                    }
                }
            `;

            await executarQuery(mutation, {
                input: {
                    id: card_data.card_id,
                    title: card_data.titulo,
                }
            });

            console.log('✅ Card atualizado');
            return Response.json({ success: true });
        }

        // 3. MOVER CARD PARA FASE
        if (action === 'moverCard') {
            console.log('➡️ Movendo card no Pipefy...');

            const mutation = `
                mutation MoveCard($input: MoveCardToPhaseInput!) {
                    moveCardToPhase(input: $input) {
                        card {
                            id
                        }
                    }
                }
            `;

            await executarQuery(mutation, {
                input: {
                    card_id: card_data.card_id,
                    destination_phase_id: card_data.fase_destino_id,
                }
            });

            console.log('✅ Card movido');
            return Response.json({ success: true });
        }

        // 4. BUSCAR CARDS
        if (action === 'buscarCards') {
            console.log('🔍 Buscando cards no Pipefy...');

            const query = `
                query GetPipeCards($pipeId: ID!, $search: CardSearch) {
                    pipe(id: $pipeId) {
                        cards(search: $search, first: 50) {
                            edges {
                                node {
                                    id
                                    title
                                    url
                                    fields {
                                        name
                                        value
                                    }
                                    assignees {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const result = await executarQuery(query, {
                pipeId: pipe_id,
                search: card_data.filtros || {},
            });

            const cards = result.data.pipe.cards.edges.map(e => e.node);

            return Response.json({
                success: true,
                cards,
                total: cards.length,
            });
        }

        return Response.json({ error: 'Ação não suportada' }, { status: 400 });

    } catch (error) {
        console.error('❌ Erro Pipefy:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});