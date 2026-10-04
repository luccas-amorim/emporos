// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'clock.fill': 'history',
  airplane: 'flight',
  shippingbox: 'inventory-2',
  suitcase: 'luggage',
  link: 'link',
  'note.text': 'notes',
  'arrow.clockwise': 'refresh',
  'square.and.arrow.up': 'ios-share',
  trash: 'delete-outline',
  'circle.lefthalf.filled': 'contrast',
  'sun.max': 'light-mode',
  moon: 'dark-mode',
  bell: 'notifications-none',
  'bell.slash': 'notifications-off',
  scope: 'track-changes',
  'arrow.down': 'arrow-downward',
  'arrow.up': 'arrow-upward',
  xmark: 'close',
  scalemass: 'balance',
  function: 'functions',
  'doc.text': 'receipt-long',
  'exclamationmark.triangle': 'warning-amber',
  'chart.line.uptrend.xyaxis': 'show-chart',
  'wifi.slash': 'wifi-off',
  globe: 'public',
  tag: 'sell',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  plus: 'add',
  minus: 'remove',
  gearshape: 'settings',
  checkmark: 'check',
  'info.circle': 'info-outline',
  'doc.on.clipboard': 'content-paste',
  ellipsis: 'more-horiz',
  pencil: 'edit',
  photo: 'image',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
