import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

// Emoji de bandeira (🇧🇷, 🇺🇸, 🇪🇺) não renderiza como bandeira em todo ambiente
// (ex: Windows sem fonte de emoji colorida mostra "BR"/"US" como texto). Desenhamos
// as bandeiras com Views puras para um visual consistente em qualquer plataforma.

export type FlagCode = 'BR' | 'US' | 'EU';

interface FlagIconProps {
  code: FlagCode;
  size?: number; // altura em px; a largura segue proporção 3:2
  style?: ViewStyle;
}

function pontosEmCirculo(qtd: number, raio: number, centro: number) {
  return Array.from({ length: qtd }, (_, i) => {
    const angulo = (i / qtd) * 2 * Math.PI - Math.PI / 2;
    return {
      left: centro + raio * Math.cos(angulo),
      top: centro + raio * Math.sin(angulo),
    };
  });
}

export function FlagIcon({ code, size = 16, style }: FlagIconProps) {
  const height = size;
  const width = size * 1.5;

  const container: ViewStyle = {
    width,
    height,
    borderRadius: 2,
    overflow: 'hidden',
    ...style,
  };

  if (code === 'BR') {
    const diamante = height * 0.85;
    return (
      <View style={[container, { backgroundColor: '#009c3b', alignItems: 'center', justifyContent: 'center' }]}>
        <View
          style={{
            position: 'absolute',
            width: diamante,
            height: diamante,
            backgroundColor: '#ffdf00',
            transform: [{ rotate: '45deg' }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: height * 0.5,
            height: height * 0.5,
            borderRadius: height * 0.25,
            backgroundColor: '#002776',
          }}
        />
      </View>
    );
  }

  if (code === 'US') {
    const listraAltura = height * 0.14;
    return (
      <View style={[container, { backgroundColor: '#fff' }]}>
        <View style={[styles.absoluteFull, { top: listraAltura * 1, height: listraAltura, backgroundColor: '#b22234' }]} />
        <View style={[styles.absoluteFull, { top: listraAltura * 3, height: listraAltura, backgroundColor: '#b22234' }]} />
        <View style={[styles.absoluteFull, { top: listraAltura * 5, height: listraAltura, backgroundColor: '#b22234' }]} />
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: width * 0.4,
            height: height * 0.55,
            backgroundColor: '#3c3b6e',
          }}
        />
      </View>
    );
  }

  // EU
  const raio = height * 0.32;
  const centro = height / 2;
  const estrelaSize = height * 0.16;
  const estrelas = pontosEmCirculo(8, raio, centro);

  return (
    <View style={[container, { backgroundColor: '#003399' }]}>
      {estrelas.map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: estrelaSize,
            height: estrelaSize,
            borderRadius: estrelaSize / 2,
            backgroundColor: '#ffcc00',
            left: p.left - estrelaSize / 2 + (width - height) / 2,
            top: p.top - estrelaSize / 2,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteFull: { position: 'absolute', left: 0, right: 0 },
});
