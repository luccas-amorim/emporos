import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { useTema } from '@/hooks/use-tema';
import type { Paleta } from '@/constants/theme';

const STORAGE_KEY = '@paridade:onboarding_visto';

interface Slide {
  emoji: string;
  titulo: string;
  texto: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '⚖️',
    titulo: 'Compare o custo real',
    texto:
      'O Paridade compara o preço de comprar no Brasil parcelado com o de comprar no exterior — considerando câmbio, spread, IOF e os impostos de importação.',
  },
  {
    emoji: '📐',
    titulo: 'Matemática honesta',
    texto:
      'Parcelas no Brasil são trazidas a valor de hoje usando a taxa Selic: se o seu dinheiro pode render enquanto você parcela, isso conta a favor do Brasil. A cotação vem de fontes oficiais, em tempo real.',
  },
  {
    emoji: '🧾',
    titulo: 'Viagem ou encomenda?',
    texto:
      'Encomendas internacionais pagam Imposto de Importação e ICMS; compras em viagem, não. Escolha o cenário certo e veja cada custo detalhado antes de decidir.',
  },
];

export function useOnboarding() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((visto) => {
        if (!visto) setVisivel(true);
      })
      .catch(() => {});
  }, []);

  const concluir = () => {
    setVisivel(false);
    AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => {});
  };

  return { visivel, concluir };
}

export function Onboarding({ visivel, aoConcluir }: { visivel: boolean; aoConcluir: () => void }) {
  const { cores } = useTema();
  const { width } = useWindowDimensions();
  const [indice, setIndice] = useState(0);
  const listaRef = useRef<FlatList<Slide>>(null);
  const styles = criarStyles(cores);

  const ultimo = indice === SLIDES.length - 1;

  const avancar = () => {
    if (ultimo) {
      aoConcluir();
    } else {
      // Atualiza o índice direto no press: onMomentumScrollEnd não dispara de forma
      // confiável em scrolls programáticos (especialmente no web), só em swipes.
      setIndice(indice + 1);
      listaRef.current?.scrollToIndex({ index: indice + 1, animated: true });
    }
  };

  // Overlay absoluto em vez de <Modal>: no react-native-web, um Modal montado dentro
  // de uma tela de tab pode ficar abaixo da tab bar na stacking order e não receber
  // cliques. O overlay com zIndex alto se comporta igual em native e web.
  if (!visivel) return null;

  return (
    <View style={styles.overlayRoot}>
      <View style={styles.container}>
        <FlatList
          ref={listaRef}
          data={SLIDES}
          keyExtractor={(item) => item.titulo}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          onMomentumScrollEnd={(e) => setIndice(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.titulo}>{item.titulo}</Text>
              <Text style={styles.texto}>{item.texto}</Text>
            </View>
          )}
        />

        <View style={styles.rodape}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === indice && styles.dotAtivo]} />
            ))}
          </View>

          <TouchableOpacity
            style={styles.botao}
            onPress={avancar}
            accessibilityRole="button"
            accessibilityLabel={ultimo ? 'Começar a usar o app' : 'Próximo slide'}>
            <Text style={styles.botaoTexto}>{ultimo ? 'COMEÇAR' : 'PRÓXIMO'}</Text>
          </TouchableOpacity>

          {!ultimo && (
            <TouchableOpacity onPress={aoConcluir} accessibilityRole="button" accessibilityLabel="Pular introdução">
              <Text style={styles.pular}>Pular</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    overlayRoot: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      elevation: 1000,
    },
    container: { flex: 1, backgroundColor: cores.background },
    slide: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emoji: { fontSize: 64, marginBottom: 24 },
    titulo: { fontSize: 24, fontWeight: 'bold', color: cores.text, marginBottom: 16, textAlign: 'center' },
    texto: { fontSize: 16, color: cores.subtext, textAlign: 'center', lineHeight: 24 },
    rodape: { padding: 30, alignItems: 'center', gap: 16 },
    dots: { flexDirection: 'row', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: cores.border },
    dotAtivo: { backgroundColor: cores.primary, width: 20 },
    botao: {
      backgroundColor: cores.primary,
      paddingVertical: 14,
      paddingHorizontal: 60,
      borderRadius: 10,
      minWidth: 220,
      alignItems: 'center',
    },
    botaoTexto: { color: cores.card, fontSize: 16, fontWeight: 'bold' },
    pular: { color: cores.muted, fontSize: 14 },
  });
}
