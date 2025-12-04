import { base44 } from "@/api/base44Client";

export async function gerarNumeroSequencial(entityName) {
  try {
    const items = await base44.entities[entityName].list('-created_date', 1);
    if (items && items.length > 0 && items[0].numero) {
      const ultimoNumero = parseInt(items[0].numero) || 0;
      return String(ultimoNumero + 1).padStart(6, '0');
    }
    return '000001';
  } catch (error) {
    console.error('Erro ao gerar número sequencial:', error);
    return String(Date.now()).slice(-6);
  }
}