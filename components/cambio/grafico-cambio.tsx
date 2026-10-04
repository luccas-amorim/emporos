import React, { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { Cartao } from '@/components/ui/cartao';
import { Texto } from '@/components/ui/texto';
import { geometriaGrafico, mediaMinMax, type PontoSerie, rotulosMeses } from '@/core/cambio';
import { formatarCotacaoBR, formatarNumeroBR } from '@/core/formato';
import { useTema } from '@/hooks/use-tema';

const ALTURA = 100;

function semSimbolo(valor: number): string {
  return valor < 1 ? formatarCotacaoBR(valor).replace('R$ ', '') : formatarNumeroBR(valor, 2);
}

// Card do gráfico: linha de 2px, média tracejada, ponto final em verde e os meses.
export function GraficoCambio({ pontos }: { pontos: PontoSerie[] }) {
  const { cores } = useTema();
  const [largura, setLargura] = useState(0);
  const stats = mediaMinMax(pontos);
  const geometria = largura > 0 ? geometriaGrafico(pontos, largura, ALTURA, 5, 5) : null;
  const meses = rotulosMeses(pontos);

  if (!stats) return null;

  return (
    <Cartao
      style={styles.cartao}
      accessible
      accessibilityLabel={`Gráfico dos últimos 90 dias: média ${semSimbolo(stats.media)}, mínima ${semSimbolo(stats.min)}, máxima ${semSimbolo(stats.max)}.`}>
      <View style={styles.linha}>
        <Texto mono tamanho={11} cor="textSubtle">
          90 dias
        </Texto>
        <Texto mono tamanho={11} cor="textSubtle">
          média {semSimbolo(stats.media)} · mín {semSimbolo(stats.min)}
        </Texto>
      </View>
      <View style={{ height: ALTURA }} onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)}>
        {geometria ? (
          <Svg width={largura} height={ALTURA}>
            <Line
              x1={0}
              y1={geometria.yMedia}
              x2={largura}
              y2={geometria.yMedia}
              stroke={cores.textSubtle}
              strokeWidth={1}
              strokeDasharray="3 4"
            />
            <Polyline
              points={geometria.pontos}
              fill="none"
              stroke={cores.text}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <Circle cx={geometria.ultimo.x} cy={geometria.ultimo.y} r={4.5} fill={cores.brasil} />
          </Svg>
        ) : null}
      </View>
      <View style={styles.linha}>
        {meses.map((mes) => (
          <Texto key={mes} mono tamanho={11} cor="textSubtle">
            {mes}
          </Texto>
        ))}
      </View>
    </Cartao>
  );
}

const styles = StyleSheet.create({
  cartao: { paddingBottom: 10, gap: 8 },
  linha: { flexDirection: 'row', justifyContent: 'space-between' },
});
