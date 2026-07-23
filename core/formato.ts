// Formatação manual (sem Intl): o suporte a locales do Hermes varia por plataforma/ABI,
// então garantimos o padrão brasileiro (1.234,56) de forma determinística.

export function formatarNumeroBR(valor: number, decimais = 2): string {
  const negativo = valor < 0;
  const [inteira, decimal] = Math.abs(valor).toFixed(decimais).split('.');
  const inteiraFmt = inteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '-' : ''}${inteiraFmt}${decimal ? `,${decimal}` : ''}`;
}

export function formatarBRL(valor: number, decimais = 2): string {
  // O sinal fica antes do símbolo da moeda ("-R$ 10,00"), como se escreve em pt-BR.
  const negativo = valor < 0;
  return `${negativo ? '-' : ''}R$ ${formatarNumeroBR(Math.abs(valor), decimais)}`;
}

// Cotações pequenas (JPY, ARS, CLP) precisam de mais casas para não virar "R$ 0,00".
export function formatarCotacaoBR(valor: number): string {
  return formatarBRL(valor, valor < 1 ? 4 : 2);
}

export function formatarPct(valor: number, decimais = 1): string {
  return `${formatarNumeroBR(valor, decimais)}%`;
}
