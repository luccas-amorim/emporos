import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FlagIcon } from '@/components/flag-icon';
import { MOEDAS, moedaPorCodigo, type CurrencyCode } from '@/constants/currencies';

interface CurrencySelectProps {
  value: CurrencyCode;
  onChange: (codigo: CurrencyCode) => void;
}

export function CurrencySelect({ value, onChange }: CurrencySelectProps) {
  const [aberto, setAberto] = useState(false);
  const selecionada = moedaPorCodigo(value);

  return (
    <>
      <TouchableOpacity style={styles.campo} onPress={() => setAberto(true)}>
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
                  }}>
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

const styles = StyleSheet.create({
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 50,
    backgroundColor: '#fff',
  },
  textoCampo: { flex: 1, fontSize: 14, color: '#333', fontWeight: '600' },
  seta: { color: '#999', fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 30 },
  modalBox: { backgroundColor: '#fff', borderRadius: 12, maxHeight: '70%', padding: 10 },
  modalTitulo: { fontSize: 16, fontWeight: 'bold', color: '#333', padding: 10 },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8 },
  opcaoSelecionada: { backgroundColor: '#e8f0fe' },
  opcaoNome: { flex: 1, fontSize: 15, color: '#333' },
  opcaoSigla: { fontSize: 13, color: '#999', fontWeight: '600' },
});
