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

export const Colors: { light: Paleta; dark: Paleta } = {
  light: {
    background: '#f0f2f5',
    card: '#ffffff',
    text: '#333333',
    subtext: '#666666',
    muted: '#999999',
    border: '#dddddd',
    borderSoft: '#eeeeee',
    inputBg: '#ffffff',
    primary: '#1a73e8',
    primarySoft: '#e8f0fe',
    success: '#137333',
    successBg: '#e6f4ea',
    successBorder: '#34a853',
    info: '#1967d2',
    infoBg: '#e8f0fe',
    infoBorder: '#4285f4',
    warnText: '#a35a00',
    warnBg: '#fff4e0',
    danger: '#d93025',
    optionBg: '#f9f9f9',
    overlay: 'rgba(0,0,0,0.4)',
    icon: '#687076',
    tint: '#1a73e8',
    tabIconDefault: '#687076',
    tabIconSelected: '#1a73e8',
  },
  dark: {
    background: '#0f1115',
    card: '#1b1e24',
    text: '#e3e5e8',
    subtext: '#a0a6ad',
    muted: '#6d737a',
    border: '#33383f',
    borderSoft: '#2a2e34',
    inputBg: '#22262c',
    primary: '#8ab4f8',
    primarySoft: '#1e3a5f',
    success: '#81c995',
    successBg: '#17281d',
    successBorder: '#2e7d4f',
    info: '#8ab4f8',
    infoBg: '#182636',
    infoBorder: '#3b6db0',
    warnText: '#fdd663',
    warnBg: '#33290f',
    danger: '#f28b82',
    optionBg: '#22262c',
    overlay: 'rgba(0,0,0,0.6)',
    icon: '#9BA1A6',
    tint: '#8ab4f8',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#8ab4f8',
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
