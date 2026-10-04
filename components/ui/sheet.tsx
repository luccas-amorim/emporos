import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto } from '@/components/ui/texto';
import type { Paleta } from '@/constants/theme';
import { useTema } from '@/hooks/use-tema';

interface SheetProps {
  visivel: boolean;
  aoFechar: () => void;
  titulo: string;
  /** Linha abaixo do título (ex.: "Regras conferidas em 03/10/2026"). */
  subtitulo?: string;
  /** Ação discreta à direita do título (ex.: "Restaurar padrão"). */
  acao?: { rotulo: string; aoTocar: () => void; accessibilityLabel?: string };
  /** Fixo no pé do sheet (ex.: botão "Aplicar"). */
  rodape?: React.ReactNode;
  children: React.ReactNode;
}

const DURACAO = 240;
// No react-native-web, o Modal com animationType espera um evento de fim de animação
// que nem sempre dispara; a animação é nossa, feita com Animated, e o Modal fica sem.
const DRIVER_NATIVO = Platform.OS !== 'web';

// Bottom sheet: véu de 45%, raio 28 no topo e alça de 40×5. Fecha ao tocar no véu
// ou com o voltar do Android.
export function Sheet({ visivel, aoFechar, titulo, subtitulo, acao, rodape, children }: SheetProps) {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [montado, setMontado] = useState(visivel);
  const progresso = useRef(new Animated.Value(visivel ? 1 : 0)).current;

  useEffect(() => {
    if (visivel) setMontado(true);
    Animated.timing(progresso, {
      toValue: visivel ? 1 : 0,
      duration: DURACAO,
      easing: visivel ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: DRIVER_NATIVO,
    }).start(({ finished }) => {
      if (finished && !visivel) setMontado(false);
    });
  }, [visivel, progresso]);

  if (!montado) return null;

  const deslocamento = progresso.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={aoFechar} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.veu, { opacity: progresso }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={aoFechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.posicao}
        pointerEvents="box-none">
        <Animated.View
          style={[
            styles.folha,
            { maxHeight: height - insets.top - 40, transform: [{ translateY: deslocamento }] },
          ]}
          accessibilityViewIsModal>
          <View style={styles.alca} />
          <View style={styles.cabecalho}>
            <View style={styles.titulos}>
              <Texto variante="tituloSheet" accessibilityRole="header">
                {titulo}
              </Texto>
              {subtitulo ? <Texto variante="secundario" cor="textSubtle">{subtitulo}</Texto> : null}
            </View>
            {acao ? (
              <Pressable
                onPress={acao.aoTocar}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={acao.accessibilityLabel ?? acao.rotulo}>
                <Texto variante="secundario" cor="textSubtle">
                  {acao.rotulo}
                </Texto>
              </Pressable>
            ) : null}
          </View>
          <ScrollView
            style={styles.rolagem}
            contentContainerStyle={styles.conteudo}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {rodape ? (
            <View style={[styles.rodape, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>{rodape}</View>
          ) : (
            <View style={{ height: Math.max(insets.bottom, 16) }} />
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    veu: { backgroundColor: cores.overlay },
    posicao: { flex: 1, justifyContent: 'flex-end' },
    folha: {
      backgroundColor: cores.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 10,
    },
    alca: { width: 40, height: 5, borderRadius: 3, backgroundColor: cores.border, alignSelf: 'center', marginBottom: 16 },
    cabecalho: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    titulos: { flex: 1, gap: 4 },
    rolagem: { flexGrow: 0 },
    conteudo: { paddingHorizontal: 20, gap: 16, paddingBottom: 8 },
    rodape: { paddingHorizontal: 20, paddingTop: 12 },
  });
}
