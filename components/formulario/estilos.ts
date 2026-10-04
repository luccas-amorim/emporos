import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import type { Paleta } from '@/constants/theme';
import { useTema } from '@/hooks/use-tema';

// Estilos comuns aos cards do formulário da Home.
function criarEstilosFormulario(cores: Paleta) {
  return StyleSheet.create({
    card: { backgroundColor: cores.card, width: '100%', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: cores.text, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: cores.borderSoft, paddingBottom: 5 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: cores.borderSoft, paddingBottom: 5 },
    sectionTitleInline: { fontSize: 16, fontWeight: 'bold', color: cores.text },
    label: { fontSize: 14, color: cores.subtext, marginTop: 10, marginBottom: 5, fontWeight: '600' },
    obs: { fontSize: 11, color: cores.muted, marginTop: 8, fontStyle: 'italic' },
    alternarModo: { fontSize: 12, color: cores.primary, marginTop: 8, fontWeight: '600' },
    input: { borderWidth: 1, borderColor: cores.border, borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: cores.inputBg, color: cores.text, height: 50 },
    inputMultilinha: { height: 70, textAlignVertical: 'top', paddingTop: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  });
}

export function useEstilosFormulario() {
  const { cores } = useTema();
  return useMemo(() => criarEstilosFormulario(cores), [cores]);
}
