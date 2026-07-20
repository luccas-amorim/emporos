import React, { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FlagIcon } from '@/components/flag-icon';
import { MOEDAS, moedaPorCodigo, type CurrencyCode } from '@/constants/currencies';
import type { Paleta } from '@/constants/theme';
import { useTema } from '@/hooks/use-tema';

interface CurrencySelectProps {
  value: CurrencyCode;
  onChange: (codigo: CurrencyCode) => void;
}

export function CurrencySelect({ value, onChange }: CurrencySelectProps) {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const [aberto, setAberto] = useState(false);
  const selecionada = moedaPorCodigo(value);

  return (
    <>
      <TouchableOpacity
        style={styles.campo}
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={`Moeda selecionada: ${selecionada.nome}. Toque para trocar.`}>
        <FlagIcon code={selecionada.bandeira} size={16} />
        <Text style={styles.textoCampo} numberOfLines={1}>
          {selecionada.nome} ({selecionada.code})
        </Text>
        <Text style={styles.seta}>▾</Text>
      </TouchableOpacity>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setAberto(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitulo}>Escolha a moeda</Text>
            <FlatList
              data={MOEDAS}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.opcao, item.code === value && styles.opcaoSelecionada]}
                  onPress={() => {
                    onChange(item.code);
                    setAberto(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.nome}, ${item.code}`}
                  accessibilityState={{ selected: item.code === value }}>
                  <FlagIcon code={item.bandeira} size={18} />
                  <Text style={styles.opcaoNome}>{item.nome}</Text>
                  <Text style={styles.opcaoSigla}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    campo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: cores.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 50,
      backgroundColor: cores.inputBg,
    },
    textoCampo: { flex: 1, fontSize: 14, color: cores.text, fontWeight: '600' },
    seta: { color: cores.muted, fontSize: 12 },
    overlay: { flex: 1, backgroundColor: cores.overlay, justifyContent: 'center', padding: 30 },
    modalBox: { backgroundColor: cores.card, borderRadius: 12, maxHeight: '70%', padding: 10 },
    modalTitulo: { fontSize: 16, fontWeight: 'bold', color: cores.text, padding: 10 },
    opcao: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8 },
    opcaoSelecionada: { backgroundColor: cores.primarySoft },
    opcaoNome: { flex: 1, fontSize: 15, color: cores.text },
    opcaoSigla: { fontSize: 13, color: cores.muted, fontWeight: '600' },
  });
}
