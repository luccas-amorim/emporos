import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import type { Paleta } from '@/constants/theme';
import { useTema } from '@/hooks/use-tema';

interface BotaoOpcaoProps {
  titulo: string;
  detalhe?: string;
  selecionado: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

// Botão de escolha exclusiva (cenário, pagamento, ICMS...), usado lado a lado numa linha.
export function BotaoOpcao({ titulo, detalhe, selecionado, onPress, accessibilityLabel }: BotaoOpcaoProps) {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);

  return (
    <TouchableOpacity
      style={[styles.botao, selecionado && styles.botaoSelecionado]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: selecionado }}>
      <Text style={[styles.titulo, selecionado && styles.textoSelecionado]}>{titulo}</Text>
      {detalhe ? <Text style={[styles.detalhe, selecionado && styles.textoSelecionado]}>{detalhe}</Text> : null}
    </TouchableOpacity>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    botao: { flex: 1, padding: 10, borderWidth: 1, borderColor: cores.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.surface2, minHeight: 60 },
    botaoSelecionado: { backgroundColor: cores.card, borderColor: cores.text },
    titulo: { color: cores.textMuted, fontSize: 14, fontWeight: '600' },
    detalhe: { color: cores.textSubtle, fontSize: 11, marginTop: 2, textAlign: 'center' },
    textoSelecionado: { color: cores.text },
  });
}
