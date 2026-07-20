import { Platform } from 'react-native';

export interface Paleta {
  background: string;
  card: string;
  text: string;
  subtext: string;
  muted: string;
  border: string;
  borderSoft: string;
  inputBg: string;
  primary: string;
  primarySoft: string;
  success: string;
  successBg: string;
  successBorder: string;
  info: string;
  infoBg: string;
  infoBorder: string;
  warnText: string;
  warnBg: string;
  danger: string;
  optionBg: string;
  overlay: string;
  icon: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
}

// Identidade "Petróleo": azul-esverdeado profundo — confiança do azul + associação
// monetária do verde, num território de cor livre no mercado financeiro brasileiro.
// As cores semânticas (success/info/warn/danger) são propositalmente distintas da
// cor de marca para não misturar "identidade" com "significado" nos resultados.
export const Colors: { light: Paleta; dark: Paleta } = {
  light: {
    background: '#eef3f2',
    card: '#ffffff',
    text: '#2f3634',
    subtext: '#5c6763',
    muted: '#8f9995',
    border: '#d5dedb',
    borderSoft: '#e6edea',
    inputBg: '#ffffff',
    primary: '#0f6e56',
    primarySoft: '#e1f5ee',
    success: '#137333',
    successBg: '#e6f4ea',
    successBorder: '#34a853',
    info: '#1967d2',
    infoBg: '#e8f0fe',
    infoBorder: '#4285f4',
    warnText: '#a35a00',
    warnBg: '#fff4e0',
    danger: '#d93025',
    optionBg: '#f5f8f7',
    overlay: 'rgba(4,52,44,0.45)',
    icon: '#687670',
    tint: '#0f6e56',
    tabIconDefault: '#687670',
    tabIconSelected: '#0f6e56',
  },
  dark: {
    background: '#0e1413',
    card: '#19211f',
    text: '#e1e7e5',
    subtext: '#9faba7',
    muted: '#6c7874',
    border: '#313c39',
    borderSoft: '#28312e',
    inputBg: '#202a27',
    primary: '#5dcaa5',
    primarySoft: '#123529',
    success: '#81c995',
    successBg: '#17281d',
    successBorder: '#2e7d4f',
    info: '#8ab4f8',
    infoBg: '#182636',
    infoBorder: '#3b6db0',
    warnText: '#fdd663',
    warnBg: '#33290f',
    danger: '#f28b82',
    optionBg: '#202a27',
    overlay: 'rgba(0,0,0,0.6)',
    icon: '#93a19c',
    tint: '#5dcaa5',
    tabIconDefault: '#93a19c',
    tabIconSelected: '#5dcaa5',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
