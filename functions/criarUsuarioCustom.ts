import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import * as bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  console.log('🔍 Iniciando criarUsuarioCustom...');
  
  try {
    const base44 = createClientFromRequest(req);
    console.log('✅ SDK inicializado');

    // Verificar se é admin
    let usuarioLogado;
    try {
      usuarioLogado = await base44.auth.me();
      console.log('✅ Usuário logado:', usuarioLogado?.email);
    } catch (authError) {
      console.error('❌ Erro ao buscar usuário logado:', authError);
      return Response.json({ 
        success: false, 
        error: 'Erro de autenticação: ' + authError.message 
      }, { status: 500 });
    }

    if (!usuarioLogado || usuarioLogado.role !== 'admin') {
      console.log('❌ Não é admin:', usuarioLogado?.role);
      return Response.json({ 
        success: false, 
        error: 'Apenas administradores podem criar usuários' 
      }, { status: 403 });
    }

    let body;
    try {
      body = await req.json();
      console.log('✅ Body recebido:', JSON.stringify(body));
    } catch (jsonError) {
      console.error('❌ Erro ao parsear JSON:', jsonError);
      return Response.json({ 
        success: false, 
        error: 'JSON inválido' 
      }, { status: 400 });
    }

    const { email, senha, nome, tipo_acesso, cliente_id, cargo, telefone } = body;

    if (!email || !senha || !nome || !tipo_acesso) {
      console.log('❌ Campos obrigatórios faltando');
      return Response.json({ 
        success: false, 
        error: 'Email, senha, nome e tipo de acesso são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se email já existe
    console.log('🔍 Verificando se email já existe...');
    let usuariosExistentes;
    try {
      usuariosExistentes = await base44.asServiceRole.entities.UsuarioCustom.filter({ 
        email: email.toLowerCase().trim() 
      });
      console.log('✅ Verificação de email concluída, encontrados:', usuariosExistentes?.length || 0);
    } catch (filterError) {
      console.error('❌ Erro ao filtrar usuários:', filterError);
      return Response.json({ 
        success: false, 
        error: 'Erro ao verificar email: ' + filterError.message 
      }, { status: 500 });
    }

    if (usuariosExistentes && usuariosExistentes.length > 0) {
      console.log('❌ Email já cadastrado');
      return Response.json({ 
        success: false, 
        error: 'Email já cadastrado' 
      }, { status: 400 });
    }

    // Hash da senha
    console.log('🔐 Gerando hash da senha...');
    let senha_hash;
    try {
      senha_hash = await bcrypt.hash(senha, 10);
      console.log('✅ Hash gerado com sucesso');
    } catch (hashError) {
      console.error('❌ Erro ao gerar hash:', hashError);
      return Response.json({ 
        success: false, 
        error: 'Erro ao criptografar senha: ' + hashError.message 
      }, { status: 500 });
    }

    // Criar usuário
    console.log('💾 Criando usuário...');
    let novoUsuario;
    try {
      novoUsuario = await base44.asServiceRole.entities.UsuarioCustom.create({
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
      console.log('✅ Usuário criado:', novoUsuario.id);
    } catch (createError) {
      console.error('❌ Erro ao criar usuário:', createError);
      return Response.json({ 
        success: false, 
        error: 'Erro ao criar registro: ' + createError.message 
      }, { status: 500 });
    }

    console.log('🎉 Sucesso total!');
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
    console.error('❌ ERRO GERAL:', error);
    console.error('Stack:', error.stack);
    return Response.json({ 
      success: false, 
      error: 'Erro ao criar usuário: ' + error.message,
      stack: error.stack
    }, { status: 500 });
  }
});