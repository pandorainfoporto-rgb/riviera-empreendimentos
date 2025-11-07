import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verifica se o usuário é admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        error: 'Apenas administradores podem executar esta função' 
      }, { status: 403 });
    }

    console.log('Iniciando importação de cidades do IBGE...');

    // 1. Buscar todos os municípios do IBGE
    const responseIBGE = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
    
    if (!responseIBGE.ok) {
      throw new Error('Erro ao buscar dados do IBGE');
    }

    const municipios = await responseIBGE.json();
    console.log(`Total de municípios encontrados: ${municipios.length}`);

    // 2. Processar e formatar os dados
    const cidadesFormatadas = municipios.map(municipio => {
      const estado = municipio.microrregiao?.mesorregiao?.UF;
      
      return {
        nome: municipio.nome,
        estado: estado?.sigla || '',
        estado_nome: estado?.nome || '',
        codigo_ibge: municipio.id?.toString() || '',
        // Nota: A API do IBGE não retorna CEP, DDD, lat/long diretamente
        // Esses dados podem ser complementados depois ou obtidos de outras APIs
        cep_inicial: '',
        cep_final: '',
        ddd: '',
        latitude: null,
        longitude: null,
      };
    });

    // 3. Verificar se já existem dados
    const cidadesExistentes = await base44.asServiceRole.entities.CidadeBrasil.list();
    
    if (cidadesExistentes.length > 0) {
      return Response.json({
        status: 'aviso',
        message: `Já existem ${cidadesExistentes.length} cidades cadastradas. Deseja sobrescrever?`,
        total_municipios_ibge: municipios.length,
        action_required: 'Envie o parâmetro { "force": true } para sobrescrever'
      });
    }

    // 4. Inserir em lotes para evitar timeout
    const BATCH_SIZE = 100;
    let totalInserido = 0;
    const erros = [];

    for (let i = 0; i < cidadesFormatadas.length; i += BATCH_SIZE) {
      const batch = cidadesFormatadas.slice(i, i + BATCH_SIZE);
      
      try {
        await base44.asServiceRole.entities.CidadeBrasil.bulkCreate(batch);
        totalInserido += batch.length;
        console.log(`Inserido lote ${Math.floor(i / BATCH_SIZE) + 1}: ${totalInserido}/${cidadesFormatadas.length}`);
      } catch (error) {
        console.error(`Erro no lote ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
        erros.push({
          lote: Math.floor(i / BATCH_SIZE) + 1,
          erro: error.message
        });
      }
    }

    // 5. Retornar resultado
    return Response.json({
      status: 'sucesso',
      message: 'Importação concluída!',
      total_municipios_ibge: municipios.length,
      total_inserido: totalInserido,
      total_erros: erros.length,
      erros: erros.length > 0 ? erros : undefined,
      observacao: 'Os campos CEP, DDD, latitude e longitude não são fornecidos pela API do IBGE e ficaram vazios. Podem ser complementados posteriormente.',
      dicas: {
        complementar_dados: 'Use a API BrasilAPI ou ViaCEP para complementar CEPs e DDDs',
        exemplo_brasilapi: 'https://brasilapi.com.br/api/cep/v2/{cep}',
        exemplo_viacep: 'https://viacep.com.br/ws/{cep}/json/'
      }
    });

  } catch (error) {
    console.error('Erro na importação:', error);
    return Response.json({ 
      status: 'erro',
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});