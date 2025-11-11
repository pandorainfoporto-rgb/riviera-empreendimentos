import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import * as bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verificar se é admin
    const usuarioLogado = await base44.auth.me();
    if (!usuarioLogado || usuarioLogado.role !== 'admin') {
      return Response.json({ 
        success: false, 
        error: 'Apenas administradores podem criar usuários' 
      }, { status: 403 });
    }

    const { email, senha, nome, tipo_acesso, cliente_id, cargo, telefone } = await req.json();

    if (!email || !senha || !nome || !tipo_acesso) {
      return Response.json({ 
        success: false, 
        error: 'Email, senha, nome e tipo de acesso são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se email já existe
    const usuariosExistentes = await base44.asServiceRole.entities.UsuarioCustom.filter({ 
      email: email.toLowerCase().trim() 
    });

    if (usuariosExistentes && usuariosExistentes.length > 0) {
      return Response.json({ 
        success: false, 
        error: 'Email já cadastrado' 
      }, { status: 400 });
    }

    // Hash da senha
    const senha_hash = await bcrypt.hash(senha, 10);

    // Criar usuário
    const novoUsuario = await base44.asServiceRole.entities.UsuarioCustom.create({
      email: email.toLowerCase().trim(),
      senha_hash,
      nome,
      tipo_acesso,
      cliente_id: cliente_id || null,
      cargo: cargo || null,
      telefone: telefone || null,
      ativo: true,
      primeiro_acesso: true
    });

    return Response.json({
      success: true,
      usuario: {
        id: novoUsuario.id,
        email: novoUsuario.email,
        nome: novoUsuario.nome,
        tipo_acesso: novoUsuario.tipo_acesso
      }
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return Response.json({ 
      success: false, 
      error: 'Erro ao criar usuário: ' + error.message 
    }, { status: 500 });
  }
});