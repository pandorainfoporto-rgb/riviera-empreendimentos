import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * 🎯 INTEGRAÇÃO RD STATION CRM
 * Sincroniza leads, oportunidades e vendas
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, access_token, refresh_token, lead_data } = await req.json();

        const RD_STATION_BASE = 'https://api.rd.services';

        // 1. CRIAR/ATUALIZAR LEAD
        if (action === 'criarLead') {
            console.log('🎯 Enviando lead para RD Station...');

            const payload = {
                event_type: 'CONVERSION',
                event_family: 'CDP',
                payload: {
                    conversion_identifier: 'lead-site',
                    name: lead_data.nome_cliente,
                    email: lead_data.email,
                    mobile_phone: lead_data.telefone,
                    cf_profissao: lead_data.profissao,
                    cf_renda_mensal: lead_data.renda_mensal,
                    cf_valor_entrada: lead_data.valor_entrada,
                    cf_forma_pagamento: lead_data.forma_pagamento_pretendida,
                    cf_origem_lead: lead_data.fonte_lead,
                    cf_interesse_nivel: lead_data.interesse_nivel,
                    traffic_source: lead_data.fonte_lead,
                    tags: lead_data.tags || [],
                }
            };

            const response = await fetch(`${RD_STATION_BASE}/platform/conversions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Erro RD Station: ${error.errors?.[0]?.error_message || 'Erro desconhecido'}`);
            }

            const result = await response.json();
            console.log('✅ Lead enviado para RD Station');

            return Response.json({
                success: true,
                event_uuid: result.event_uuid,
                message: 'Lead enviado com sucesso',
            });
        }

        // 2. BUSCAR LEADS
        if (action === 'buscarLeads') {
            console.log('📥 Buscando leads do RD Station...');

            const response = await fetch(`${RD_STATION_BASE}/platform/contacts?email=${lead_data.email}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar leads');
            }

            const contacts = await response.json();

            return Response.json({
                success: true,
                contacts: contacts.contacts || [],
            });
        }

        // 3. MARCAR COMO OPORTUNIDADE
        if (action === 'marcarOportunidade') {
            console.log('💰 Marcando como oportunidade no RD Station...');

            const payload = {
                event_type: 'OPPORTUNITY',
                event_family: 'CDP',
                payload: {
                    funnel_name: 'Vendas Imobiliário',
                    email: lead_data.email,
                    opportunity_title: `Oportunidade - ${lead_data.nome_cliente}`,
                    deal_amount: lead_data.valor_proposta || 0,
                }
            };

            const response = await fetch(`${RD_STATION_BASE}/platform/conversions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Erro ao criar oportunidade');
            }

            console.log('✅ Oportunidade criada');

            return Response.json({ success: true });
        }

        // 4. MARCAR COMO VENDA GANHA
        if (action === 'marcarVenda') {
            console.log('🎉 Marcando venda ganha no RD Station...');

            const payload = {
                event_type: 'SALE',
                event_family: 'CDP',
                payload: {
                    funnel_name: 'Vendas Imobiliário',
                    email: lead_data.email,
                    value: lead_data.valor_venda,
                }
            };

            const response = await fetch(`${RD_STATION_BASE}/platform/conversions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Erro ao registrar venda');
            }

            console.log('✅ Venda registrada');

            return Response.json({ success: true });
        }

        return Response.json({ error: 'Ação não suportada' }, { status: 400 });

    } catch (error) {
        console.error('❌ Erro RD Station:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});