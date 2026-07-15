import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

// Emoji de bandeira (🇧🇷, 🇺🇸, 🇪🇺...) não renderiza como bandeira em todo ambiente
// (ex: Windows sem fonte de emoji colorida mostra "BR"/"US" como texto). Desenhamos
// as bandeiras com Views puras para um visual consistente em qualquer plataforma.

export type FlagCode = 'BR' | 'US' | 'EU' | 'GB' | 'JP' | 'AR' | 'CL';

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

  if (code === 'EU') {
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

  if (code === 'JP') {
    const raio = height * 0.3;
    return (
      <View style={[container, { backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }]}>
        <View
          style={{
            width: raio * 2,
            height: raio * 2,
            borderRadius: raio,
            backgroundColor: '#bc002d',
          }}
        />
      </View>
    );
  }

  if (code === 'AR') {
    const faixa = height / 3;
    const solSize = height * 0.34;
    return (
      <View style={[container, { backgroundColor: '#74acdf' }]}>
        <View style={[styles.absoluteFull, { top: faixa, height: faixa, backgroundColor: '#fff' }]} />
        <View
          style={{
            position: 'absolute',
            width: solSize,
            height: solSize,
            borderRadius: solSize / 2,
            backgroundColor: '#f6b40e',
            left: width / 2 - solSize / 2,
            top: height / 2 - solSize / 2,
          }}
        />
      </View>
    );
  }

  if (code === 'CL') {
    const topoAltura = height / 2;
    return (
      <View style={[container, { backgroundColor: '#fff' }]}>
        <View style={[styles.absoluteFull, { top: topoAltura, height: topoAltura, backgroundColor: '#d52b1e' }]} />
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: topoAltura,
            height: topoAltura,
            backgroundColor: '#0039a6',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={{
              width: topoAltura * 0.4,
              height: topoAltura * 0.4,
              borderRadius: (topoAltura * 0.4) / 2,
              backgroundColor: '#fff',
            }}
          />
        </View>
      </View>
    );
  }

  // GB — Union Jack simplificada: cruz reta + saltire diagonal em duas camadas (branco/vermelho)
  const diagComprimento = width * 1.6;
  const diagBranco = height * 0.26;
  const diagVermelho = height * 0.13;
  const retaBrancoH = height * 0.34;
  const retaVermelhoH = height * 0.16;
  const retaBrancoV = height * 0.34;
  const retaVermelhoV = height * 0.16;

  return (
    <View style={[container, { backgroundColor: '#012169' }]}>
      <View
        style={{
          position: 'absolute',
          left: (width - diagComprimento) / 2,
          top: (height - diagBranco) / 2,
          width: diagComprimento,
          height: diagBranco,
          backgroundColor: '#fff',
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: (width - diagComprimento) / 2,
          top: (height - diagBranco) / 2,
          width: diagComprimento,
          height: diagBranco,
          backgroundColor: '#fff',
          transform: [{ rotate: '-45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: (width - diagComprimento) / 2,
          top: (height - diagVermelho) / 2,
          width: diagComprimento,
          height: diagVermelho,
          backgroundColor: '#c8102e',
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: (width - diagComprimento) / 2,
          top: (height - diagVermelho) / 2,
          width: diagComprimento,
          height: diagVermelho,
          backgroundColor: '#c8102e',
          transform: [{ rotate: '-45deg' }],
        }}
      />
      <View style={[styles.absoluteFull, { top: (height - retaBrancoH) / 2, height: retaBrancoH, backgroundColor: '#fff' }]} />
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: (width - retaBrancoV) / 2,
          width: retaBrancoV,
          backgroundColor: '#fff',
        }}
      />
      <View style={[styles.absoluteFull, { top: (height - retaVermelhoH) / 2, height: retaVermelhoH, backgroundColor: '#c8102e' }]} />
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: (width - retaVermelhoV) / 2,
          width: retaVermelhoV,
          backgroundColor: '#c8102e',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteFull: { position: 'absolute', left: 0, right: 0 },
});
