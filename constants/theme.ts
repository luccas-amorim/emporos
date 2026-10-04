export interface Paleta {
  /** Fundo das telas. */
  background: string;
  /** Superfície de cards, tab bar e sheets sobre o fundo. */
  card: string;
  /** Trilho do controle segmentado, botões secundários, caixas de apoio. */
  surface2: string;
  text: string;
  /** Texto secundário. */
  textMuted: string;
  /** Rótulos e metadados. */
  textSubtle: string;
  /** Bordas de 1px (o app não usa sombra). */
  border: string;
  /** Tudo que significa "comprar no Brasil". */
  brasil: string;
  brasilSoft: string;
  /** Tudo que significa "importar". */
  exterior: string;
  exteriorSoft: string;
  /** Atenção: offline, cotação velha, avisos fiscais. */
  warn: string;
  warnSoft: string;
  /** Erro e ações destrutivas (excluir, limpar). */
  danger: string;
  /** Botão primário e o texto sobre ele. */
  action: string;
  actionText: string;
  /** Véu atrás de sheets e modais. */
  overlay: string;

  // Chaves da paleta anterior, mantidas para as telas que ainda não passaram pelo
  // revamp. Cada uma aponta para um token novo; saem quando a última tela migrar.
  /** @deprecated use `textMuted` */
  subtext: string;
  /** @deprecated use `textSubtle` */
  muted: string;
  /** @deprecated use `border` */
  borderSoft: string;
  /** @deprecated use `card` */
  inputBg: string;
  /** @deprecated use `action` (fundo) ou `text` (texto) */
  primary: string;
  /** @deprecated use `surface2` */
  primarySoft: string;
  /** @deprecated use `brasil` */
  success: string;
  /** @deprecated use `brasilSoft` */
  successBg: string;
  /** @deprecated use `brasil` */
  successBorder: string;
  /** @deprecated use `exterior` */
  info: string;
  /** @deprecated use `exteriorSoft` */
  infoBg: string;
  /** @deprecated use `exterior` */
  infoBorder: string;
  /** @deprecated use `warn` */
  warnText: string;
  /** @deprecated use `warnSoft` */
  warnBg: string;
  /** @deprecated use `background` */
  optionBg: string;
  /** @deprecated use `textSubtle` */
  icon: string;
  /** @deprecated use `text` */
  tint: string;
  /** @deprecated use `textSubtle` */
  tabIconDefault: string;
  /** @deprecated use `text` */
  tabIconSelected: string;
}

type TokensBase = Omit<
  Paleta,
  | 'subtext'
  | 'muted'
  | 'borderSoft'
  | 'inputBg'
  | 'primary'
  | 'primarySoft'
  | 'success'
  | 'successBg'
  | 'successBorder'
  | 'info'
  | 'infoBg'
  | 'infoBorder'
  | 'warnText'
  | 'warnBg'
  | 'optionBg'
  | 'icon'
  | 'tint'
  | 'tabIconDefault'
  | 'tabIconSelected'
>;

function comChavesAntigas(t: TokensBase, inputBg: string): Paleta {
  return {
    ...t,
    subtext: t.textMuted,
    muted: t.textSubtle,
    borderSoft: t.border,
    inputBg,
    primary: t.action,
    primarySoft: t.surface2,
    success: t.brasil,
    successBg: t.brasilSoft,
    successBorder: t.brasil,
    info: t.exterior,
    infoBg: t.exteriorSoft,
    infoBorder: t.exterior,
    warnText: t.warn,
    warnBg: t.warnSoft,
    optionBg: t.background,
    icon: t.textSubtle,
    tint: t.text,
    tabIconDefault: t.textSubtle,
    tabIconSelected: t.text,
  };
}

// "Tinta e papel": a interface é neutra e a cor só aparece quando quer dizer alguma
// coisa — verde é Brasil, azul é importar, âmbar é atenção. Os acentos vêm de oklch
// (L 0,52 no claro, 0,78 no escuro, C 0,14); os hex são os do handoff, que passam de
// 4,5:1 também sobre os fundos "Soft". O textSubtle foi escurecido em relação ao
// protótipo (#7d7f83 / #7c7e82) para passar de 4,5:1 sobre fundo, card e surface2.
export const Colors: { light: Paleta; dark: Paleta } = {
  light: comChavesAntigas(
    {
      background: '#f4f3ef',
      card: '#ffffff',
      surface2: '#ebeae5',
      text: '#17181a',
      textMuted: '#4f5155',
      textSubtle: '#68696d',
      border: '#e1e0db',
      brasil: '#1f7a4a',
      brasilSoft: '#e3f3e8',
      exterior: '#2f63b8',
      exteriorSoft: '#e6eefb',
      warn: '#9a5b12',
      warnSoft: '#f8eedb',
      danger: '#b3261e',
      action: '#17181a',
      actionText: '#f4f3ef',
      overlay: 'rgba(0,0,0,0.45)',
    },
    '#ffffff'
  ),
  dark: comChavesAntigas(
    {
      background: '#0e0f10',
      card: '#18191b',
      surface2: '#232427',
      text: '#eeede9',
      textMuted: '#b0b1b4',
      textSubtle: '#8a8c90',
      border: '#2b2c2f',
      brasil: '#6fcf97',
      brasilSoft: '#173323',
      exterior: '#8db8ff',
      exteriorSoft: '#172640',
      warn: '#f0b45a',
      warnSoft: '#3a2c14',
      danger: '#f2b8b5',
      action: '#eeede9',
      actionText: '#0e0f10',
      overlay: 'rgba(0,0,0,0.45)',
    },
    '#232427'
  ),
};

// Geist (texto) e Geist Mono (valores, cotações e datas), OFL. Com fonte customizada,
// o Android não escolhe o arquivo pelo fontWeight: cada peso é uma família própria,
// e quem escolhe é `familiaFonte`.
export type PesoFonte = 400 | 500 | 600;

const FAMILIAS = {
  sans: { 400: 'Geist-Regular', 500: 'Geist-Medium', 600: 'Geist-SemiBold' },
  mono: { 400: 'GeistMono-Regular', 500: 'GeistMono-Medium', 600: 'GeistMono-SemiBold' },
} as const;

export function familiaFonte(mono: boolean, peso: PesoFonte): string {
  return FAMILIAS[mono ? 'mono' : 'sans'][peso];
}

/** Arquivos para o `useFonts` de `app/_layout.tsx`. */
export const ARQUIVOS_FONTES = {
  [FAMILIAS.sans[400]]: require('@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf'),
  [FAMILIAS.sans[500]]: require('@expo-google-fonts/geist/500Medium/Geist_500Medium.ttf'),
  [FAMILIAS.sans[600]]: require('@expo-google-fonts/geist/600SemiBold/Geist_600SemiBold.ttf'),
  [FAMILIAS.mono[400]]: require('@expo-google-fonts/geist-mono/400Regular/GeistMono_400Regular.ttf'),
  [FAMILIAS.mono[500]]: require('@expo-google-fonts/geist-mono/500Medium/GeistMono_500Medium.ttf'),
  [FAMILIAS.mono[600]]: require('@expo-google-fonts/geist-mono/600SemiBold/GeistMono_600SemiBold.ttf'),
};

/** Raios do sistema visual. */
export const Raios = { pequeno: 10, item: 14, botao: 16, card: 20, cardLista: 18, sheet: 28, pill: 999 } as const;
