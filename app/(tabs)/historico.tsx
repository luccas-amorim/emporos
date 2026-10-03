import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, Linking, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FlagIcon } from '@/components/flag-icon';
import { moedaPorCodigo } from '@/constants/currencies';
import type { Paleta } from '@/constants/theme';
import { formatarBRL, formatarCotacaoBR, formatarPct } from '@/core/formato';
import { useHistoricoSimulacoes, type SimulacaoSalva } from '@/hooks/use-historico-simulacoes';
import { useTema } from '@/hooks/use-tema';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function economiaPctDe(item: SimulacaoSalva): number {
  const maisCaro = Math.max(item.custoBR, item.custoExt);
  return maisCaro > 0 ? (item.economia / maisCaro) * 100 : 0;
}

function ItemHistorico({
  item,
  styles,
  cores,
  aoRemover,
  aoRecalcular,
}: {
  item: SimulacaoSalva;
  styles: ReturnType<typeof criarStyles>;
  cores: Paleta;
  aoRemover: (id: string) => void;
  aoRecalcular: (item: SimulacaoSalva) => void;
}) {
  const veredito = item.valeImportar ? '✈️ Exterior venceu' : 'Brasil venceu';

  const compartilhar = async () => {
    const nome = item.nomeProduto || 'um produto';
    try {
      await Share.share({
        message:
          `Simulei ${nome} no Vale importar?: ${item.valeImportar ? 'vale importar' : 'melhor comprar no Brasil'}! ` +
          `Brasil: ${formatarBRL(item.custoBR)} × Exterior: ${formatarBRL(item.custoExt)} ` +
          `(diferença de ${formatarBRL(item.economia)}, ${formatarPct(economiaPctDe(item))}).`,
      });
    } catch {
      // usuário cancelou o share
    }
  };

  return (
    <View style={[styles.card, item.valeImportar ? styles.cardExt : styles.cardBr]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardMsgRow}>
          {!item.valeImportar && <FlagIcon code="BR" size={12} style={{ marginRight: 4 }} />}
          <Text style={styles.cardMsg} numberOfLines={1}>
            {item.nomeProduto || veredito}
          </Text>
        </View>
        <Text style={styles.cardData}>{formatarData(item.data)}</Text>
      </View>

      {item.nomeProduto && <Text style={styles.cardSubMsg}>{veredito}</Text>}
      {item.cenario && (
        <Text style={styles.cardSubMsg}>
          {item.cenario === 'Encomenda' ? '📦 Encomenda (com II + ICMS)' : '🧳 Compra em viagem'}
        </Text>
      )}

      {item.link && (
        <TouchableOpacity
          onPress={() => Linking.openURL(item.link!)}
          accessibilityRole="link"
          accessibilityLabel="Abrir link do produto">
          <Text style={styles.cardLink} numberOfLines={1}>
            🔗 {item.link}
          </Text>
        </TouchableOpacity>
      )}
      {item.observacao && <Text style={styles.cardObs}>📝 {item.observacao}</Text>}

      <View style={styles.cardLineRow}>
        <Text style={styles.cardLine}>
          BR: {formatarBRL(item.precoBR)} em {item.parcelasBR}x · Ext:{' '}
        </Text>
        <FlagIcon code={moedaPorCodigo(item.moeda).bandeira} size={11} style={{ marginRight: 3 }} />
        <Text style={styles.cardLine}>
          {item.moeda} {item.precoExt.toFixed(2)}
          {item.freteExt ? ` + frete ${item.freteExt.toFixed(2)}` : ''} ({item.pgto}, spread {item.spread}%)
        </Text>
      </View>

      {item.cotacao != null && item.selicAnual != null && (
        <Text style={styles.cardTaxas}>
          Na época: {item.moeda} a {formatarCotacaoBR(item.cotacao)} · Selic {formatarPct(item.selicAnual, 2)}
        </Text>
      )}

      <View style={styles.divider} />
      <Text style={styles.cardLine}>Custo Brasil (equiv. à vista): {formatarBRL(item.custoBR)}</Text>
      <Text style={styles.cardLine}>Custo Exterior: {formatarBRL(item.custoExt)}</Text>
      <Text style={styles.cardEconomia}>
        Diferença: {formatarBRL(item.economia)} ({formatarPct(economiaPctDe(item))})
      </Text>

      <View style={styles.acoesRow}>
        <TouchableOpacity
          style={styles.acaoBtn}
          onPress={() => aoRecalcular(item)}
          accessibilityRole="button"
          accessibilityLabel="Recalcular esta simulação com a cotação de hoje">
          <Text style={styles.acaoTexto}>🔄 Recalcular hoje</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acaoBtn}
          onPress={compartilhar}
          accessibilityRole="button"
          accessibilityLabel="Compartilhar esta simulação">
          <Text style={styles.acaoTexto}>📤 Compartilhar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acaoBtn}
          onPress={() => aoRemover(item.id)}
          accessibilityRole="button"
          accessibilityLabel="Excluir esta simulação">
          <Text style={[styles.acaoTexto, { color: cores.danger }]}>🗑️ Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HistoricoScreen() {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const router = useRouter();
  const { historico, carregando, removerSimulacao, limparHistorico } = useHistoricoSimulacoes();

  const recalcular = (item: SimulacaoSalva) => {
    router.push({
      pathname: '/',
      params: {
        prefill: String(Date.now()),
        precoBR: String(item.precoBR),
        parcelasBR: String(item.parcelasBR),
        precoExt: String(item.precoExt),
        freteExt: item.freteExt ? String(item.freteExt) : '',
        moeda: item.moeda,
        pgto: item.pgto,
        spread: String(item.spread),
        cenario: item.cenario ?? 'Viagem',
        nomeProduto: item.nomeProduto ?? '',
        link: item.link ?? '',
        observacao: item.observacao ?? '',
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.titulo}>📊 Histórico</Text>
        {historico.length > 0 && (
          <TouchableOpacity
            onPress={limparHistorico}
            accessibilityRole="button"
            accessibilityLabel="Limpar todo o histórico">
            <Text style={styles.limparTexto}>Limpar tudo</Text>
          </TouchableOpacity>
        )}
      </View>

      {!carregando && historico.length === 0 && (
        <Text style={styles.vazio}>Nenhuma simulação salva ainda. Calcule na aba Home para começar.</Text>
      )}

      <FlatList
        data={historico}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemHistorico
            item={item}
            styles={styles}
            cores={cores}
            aoRemover={removerSimulacao}
            aoRecalcular={recalcular}
          />
        )}
        contentContainerStyle={styles.lista}
      />
    </View>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: cores.background, paddingTop: 60, paddingHorizontal: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    titulo: { fontSize: 26, fontWeight: 'bold', color: cores.primary },
    limparTexto: { color: cores.danger, fontWeight: '600' },
    vazio: { color: cores.subtext, fontSize: 14, textAlign: 'center', marginTop: 40 },
    lista: { paddingBottom: 40 },
    card: { backgroundColor: cores.card, padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
    cardBr: { borderColor: cores.successBorder },
    cardExt: { borderColor: cores.infoBorder },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    cardMsgRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: 8 },
    cardMsg: { fontSize: 15, fontWeight: 'bold', color: cores.text },
    cardSubMsg: { fontSize: 12, color: cores.subtext, marginBottom: 2 },
    cardData: { fontSize: 11, color: cores.muted },
    cardLink: { fontSize: 12, color: cores.primary, marginVertical: 2 },
    cardObs: { fontSize: 12, color: cores.subtext, fontStyle: 'italic', marginVertical: 2 },
    cardLineRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
    cardLine: { fontSize: 13, color: cores.text },
    cardTaxas: { fontSize: 11, color: cores.muted, marginTop: 4 },
    cardEconomia: { fontSize: 14, fontWeight: 'bold', color: cores.primary, marginTop: 6 },
    divider: { height: 1, backgroundColor: cores.borderSoft, marginVertical: 8 },
    acoesRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    acaoBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: cores.border,
      backgroundColor: cores.optionBg,
      alignItems: 'center',
    },
    acaoTexto: { fontSize: 11, color: cores.text, fontWeight: '600' },
  });
}
