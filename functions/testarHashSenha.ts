import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { senha } = await req.json();

        console.log('🔐 Testando senha:', senha);

        // Gerar hash SHA-256
        const encoder = new TextEncoder();
        const data = encoder.encode(senha);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const hashCompleto = `sha256:${hashHex}`;

        console.log('✅ Hash gerado:', hashCompleto);

        return Response.json({
            success: true,
            senha: senha,
            hash: hashCompleto,
            hash_sem_prefixo: hashHex
        });

    } catch (error) {
        console.error('💥 ERRO:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});