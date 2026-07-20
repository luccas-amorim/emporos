// Camada de compras da versão completa (compra única).
//
// A integração real com a loja (expo-iap ou RevenueCat) entra aqui quando as contas
// de developer estiverem aprovadas: basta substituir os corpos de comprarVersaoCompleta
// e restaurarCompras — a UI (paywall) e o gate (use-premium) não mudam.

export const PRECO_VERSAO_COMPLETA = 'R$ 9,99';

export interface ResultadoCompra {
  sucesso: boolean;
  mensagem?: string;
}

// Em produção a compra fica indisponível ("em breve") até o IAP real ser integrado,
// para que nenhum build de loja destrave premium sem pagamento. Em desenvolvimento,
// a compra é simulada para permitir testar o fluxo completo da paywall.
export function compraDisponivel(): boolean {
  return __DEV__;
}

export async function comprarVersaoCompleta(): Promise<ResultadoCompra> {
  if (!__DEV__) {
    return { sucesso: false, mensagem: 'Compra disponível em breve na loja.' };
  }
  // Simulação de dev: substitua por expo-iap/RevenueCat na integração real.
  await new Promise((r) => setTimeout(r, 600));
  return { sucesso: true };
}

export async function restaurarCompras(): Promise<ResultadoCompra> {
  return { sucesso: false, mensagem: 'Restauração disponível quando a compra estiver ativa na loja.' };
}
