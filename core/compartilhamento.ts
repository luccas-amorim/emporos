import { formatarBRL, formatarPct } from '@/core/formato';

export interface ResumoCompartilhavel {
  nomeProduto?: string;
  valeImportar: boolean;
  custoBR: number;
  custoExt: number;
  economia: number;
  economiaPct: number;
}

// Texto do "Compartilhar", igual na Home e no Histórico. "Vale importar?" é o nome que
// quem recebe a mensagem conhece.
export function textoCompartilhamento(resumo: ResumoCompartilhavel): string {
  const nome = resumo.nomeProduto?.trim() || 'um produto';
  const veredito = resumo.valeImportar ? 'importar' : 'comprar no Brasil';
  return (
    `Simulei ${nome} no Vale importar?: vale mais a pena ${veredito}! ` +
    `Brasil: ${formatarBRL(resumo.custoBR)} × Exterior: ${formatarBRL(resumo.custoExt)} ` +
    `(diferença de ${formatarBRL(resumo.economia)}, ${formatarPct(resumo.economiaPct)}).`
  );
}
