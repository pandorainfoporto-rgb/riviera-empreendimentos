import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import * as bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { email, senha, nome, tipo_acesso, cliente_id, cargo, telefone } = await req.json();

    // Validação
    if (!email || !senha || !nome || !tipo_acesso) {
      return Response.json({ success: false, error: 'Campos obrigatórios faltando' });
    }

    // Verificar duplicado
    const existe = await base44.asServiceRole.entities.UsuarioCustom.filter({ email: email.toLowerCase() });
    if (existe.length > 0) {
      return Response.json({ success: false, error: 'Email já cadastrado' });
    }

    // Criar
    const novo = await base44.asServiceRole.entities.UsuarioCustom.create({
      email: email.toLowerCase(),
      senha_hash: await bcrypt.hash(senha, 10),
      nome,
      tipo_acesso,
      cliente_id: cliente_id || null,
      cargo: cargo || null,
      telefone: telefone || null,
      ativo: true,
      primeiro_acesso: true
    });

    return Response.json({ success: true, usuario: { id: novo.id, email: novo.email } });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});