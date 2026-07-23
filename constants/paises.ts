import type { CurrencyCode } from '@/constants/currencies';

export interface Pais {
  codigo: string; // ISO 3166-1 alfa-2
  nome: string; // em português
  moeda: CurrencyCode; // moeda corrente, usada para sugerir a seleção
}

// Países cuja moeda corrente está entre as suportadas pelo app. Guardamos apenas o que
// não envelhece (nome e moeda): a taxa de tax free é informada pelo usuário no momento
// da compra, pois varia por loja/operadora e muda sem aviso.
export const PAISES: Pais[] = [
  { codigo: 'DE', nome: 'Alemanha', moeda: 'EUR' },
  { codigo: 'AR', nome: 'Argentina', moeda: 'ARS' },
  { codigo: 'AT', nome: 'Áustria', moeda: 'EUR' },
  { codigo: 'BE', nome: 'Bélgica', moeda: 'EUR' },
  { codigo: 'CL', nome: 'Chile', moeda: 'CLP' },
  { codigo: 'CY', nome: 'Chipre', moeda: 'EUR' },
  { codigo: 'HR', nome: 'Croácia', moeda: 'EUR' },
  { codigo: 'SV', nome: 'El Salvador', moeda: 'USD' },
  { codigo: 'SK', nome: 'Eslováquia', moeda: 'EUR' },
  { codigo: 'SI', nome: 'Eslovênia', moeda: 'EUR' },
  { codigo: 'ES', nome: 'Espanha', moeda: 'EUR' },
  { codigo: 'US', nome: 'Estados Unidos', moeda: 'USD' },
  { codigo: 'EE', nome: 'Estônia', moeda: 'EUR' },
  { codigo: 'EC', nome: 'Equador', moeda: 'USD' },
  { codigo: 'FI', nome: 'Finlândia', moeda: 'EUR' },
  { codigo: 'FR', nome: 'França', moeda: 'EUR' },
  { codigo: 'GR', nome: 'Grécia', moeda: 'EUR' },
  { codigo: 'IE', nome: 'Irlanda', moeda: 'EUR' },
  { codigo: 'IT', nome: 'Itália', moeda: 'EUR' },
  { codigo: 'JP', nome: 'Japão', moeda: 'JPY' },
  { codigo: 'LV', nome: 'Letônia', moeda: 'EUR' },
  { codigo: 'LT', nome: 'Lituânia', moeda: 'EUR' },
  { codigo: 'LU', nome: 'Luxemburgo', moeda: 'EUR' },
  { codigo: 'MT', nome: 'Malta', moeda: 'EUR' },
  { codigo: 'NL', nome: 'Países Baixos', moeda: 'EUR' },
  { codigo: 'PA', nome: 'Panamá', moeda: 'USD' },
  { codigo: 'PT', nome: 'Portugal', moeda: 'EUR' },
  { codigo: 'GB', nome: 'Reino Unido', moeda: 'GBP' },
];

// Destinos disponíveis na versão gratuita (os mais buscados por brasileiros).
export const PAISES_GRATUITOS = ['US', 'FR', 'IT', 'ES', 'PT', 'JP'];

export function paisPorCodigo(codigo: string): Pais | undefined {
  return PAISES.find((p) => p.codigo === codigo);
}

export function paisesDisponiveis(premium: boolean): Pais[] {
  const lista = premium ? PAISES : PAISES.filter((p) => PAISES_GRATUITOS.includes(p.codigo));
  return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

// Busca tolerante: ignora acentos e caixa, casando por nome do país ou sigla da moeda.
export function filtrarPaises(lista: Pais[], termo: string): Pais[] {
  const normalizar = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  const t = normalizar(termo);
  if (!t) return lista;
  return lista.filter((p) => normalizar(p.nome).includes(t) || normalizar(p.moeda).includes(t));
}
