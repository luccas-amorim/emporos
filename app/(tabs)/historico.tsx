import React from 'react';
import { FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FlagIcon } from '@/components/flag-icon';
import { useHistoricoSimulacoes, type SimulacaoSalva } from '@/hooks/use-historico-simulacoes';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ItemHistorico({ item }: { item: SimulacaoSalva }) {
  return (
    <View style={[styles.card, item.valeImportar ? styles.cardExt : styles.cardBr]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardMsgRow}>
          {!item.valeImportar && <FlagIcon code="BR" size={12} style={{ marginRight: 4 }} />}
          <Text style={styles.cardMsg}>
            {item.nomeProduto || (item.valeImportar ? '✈️ Exterior venceu' : 'Brasil venceu')}
          </Text>
        </View>
        <Text style={styles.cardData}>{formatarData(item.data)}</Text>
      </View>
      {item.nomeProduto && (
        <Text style={styles.cardSubMsg}>{item.valeImportar ? '✈️ Exterior venceu' : 'Brasil venceu'}</Text>
      )}
      {item.link && (
        <TouchableOpacity onPress={() => Linking.openURL(item.link!)}>
          <Text style={styles.cardLink} numberOfLines={1}>
            🔗 {item.link}
          </Text>
        </TouchableOpacity>
      )}
      <Text style={styles.cardLine}>
        BR: R$ {item.precoBR.toFixed(2)} em {item.parcelasBR}x · Ext: {item.moeda} {item.precoExt.toFixed(2)} (
        {item.pgto}, spread {item.spread}%)
      </Text>
      <View style={styles.divider} />
      <Text style={styles.cardLine}>Custo BR (VP): R$ {item.custoBR.toFixed(2)}</Text>
      <Text style={styles.cardLine}>Custo Ext: R$ {item.custoExt.toFixed(2)}</Text>
      <Text style={styles.cardEconomia}>Diferença: R$ {item.economia.toFixed(2)}</Text>
    </View>
  );
}

export default function HistoricoScreen() {
  const { historico, carregando, limparHistorico } = useHistoricoSimulacoes();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.titulo}>📊 Histórico</Text>
        {historico.length > 0 && (
          <TouchableOpacity onPress={limparHistorico}>
            <Text style={styles.limparTexto}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      {!carregando && historico.length === 0 && (
        <Text style={styles.vazio}>Nenhuma simulação salva ainda. Calcule na aba Home para começar.</Text>
      )}

      <FlatList
        data={historico}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ItemHistorico item={item} />}
        contentContainerStyle={styles.lista}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', paddingTop: 60, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#1a73e8' },
  limparTexto: { color: '#d93025', fontWeight: '600' },
  vazio: { color: '#666', fontSize: 14, textAlign: 'center', marginTop: 40 },
  lista: { paddingBottom: 40 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  cardBr: { borderColor: '#34a853' },
  cardExt: { borderColor: '#4285f4' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardMsgRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  cardMsg: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  cardSubMsg: { fontSize: 12, color: '#666', marginBottom: 4 },
  cardData: { fontSize: 11, color: '#999' },
  cardLink: { fontSize: 12, color: '#1a73e8', marginBottom: 4 },
  cardLine: { fontSize: 13, color: '#333', marginTop: 2 },
  cardEconomia: { fontSize: 14, fontWeight: 'bold', color: '#1a73e8', marginTop: 6 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginVertical: 8 },
});
