import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { 
            entidade, 
            registro_id, 
            acao, 
            dados_anteriores, 
            dados_novos,
            contexto_adicional,
            severidade = 'info'
        } = body;

        if (!entidade || !acao) {
            return Response.json({ 
                error: 'Entidade e ação são obrigatórios' 
            }, { status: 400 });
        }

        // Calcular campos alterados para updates
        let campos_alterados = [];
        let resumo_mudancas = '';

        if (acao === 'atualizar' && dados_anteriores && dados_novos) {
            campos_alterados = Object.keys(dados_novos)
                .filter(key => {
                    const oldVal = dados_anteriores[key];
                    const newVal = dados_novos[key];
                    return JSON.stringify(oldVal) !== JSON.stringify(newVal);
                })
                .map(key => ({
                    campo: key,
                    valor_anterior: String(dados_anteriores[key] || ''),
                    valor_novo: String(dados_novos[key] || '')
                }));

            if (campos_alterados.length > 0) {
                resumo_mudancas = `${campos_alterados.length} campo(s) alterado(s): ${
                    campos_alterados.map(c => c.campo).join(', ')
                }`;
            }
        } else if (acao === 'criar') {
            resumo_mudancas = `Novo registro criado em ${entidade}`;
        } else if (acao === 'deletar') {
            resumo_mudancas = `Registro deletado de ${entidade}`;
        }

        // Obter IP e User Agent
        const ip_address = req.headers.get('x-forwarded-for') || 
                          req.headers.get('x-real-ip') || 
                          'unknown';
        const user_agent = req.headers.get('user-agent') || 'unknown';

        // Criar log de auditoria
        const logData = {
            entidade,
            registro_id: registro_id || 'N/A',
            acao,
            usuario_email: user.email,
            usuario_nome: user.full_name || user.email,
            usuario_tipo: user.tipo_acesso || user.role || 'usuario',
            dados_anteriores: dados_anteriores || null,
            dados_novos: dados_novos || null,
            campos_alterados: campos_alterados.length > 0 ? campos_alterados : null,
            resumo_mudancas,
            ip_address,
            user_agent,
            severidade,
            contexto_adicional: contexto_adicional || null,
            sucesso: true,
        };

        await base44.asServiceRole.entities.LogAuditoria.create(logData);

        return Response.json({ 
            success: true,
            message: 'Log de auditoria registrado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao registrar log:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});