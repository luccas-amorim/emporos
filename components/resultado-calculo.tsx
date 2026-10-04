import React, { useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FlagIcon } from '@/components/flag-icon';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FONTES_FISCAIS, rotuloRevisao } from '@/constants/regras-fiscais';
import type { Paleta } from '@/constants/theme';
import type { CalculoResultado } from '@/core/calculadora';
import { formatarBRL, formatarPct } from '@/core/formato';
import { useTema } from '@/hooks/use-tema';

interface ResultadoCalculoProps {
  resultado: CalculoResultado;
  parcelas: number;
  aoCompartilhar: () => void;
}

// Veredito, custos, detalhamento, avisos e as fontes das regras fiscais usadas.
export function ResultadoCalculo({ resultado, parcelas, aoCompartilhar }: ResultadoCalculoProps) {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const [fontesVisiveis, setFontesVisiveis] = useState(false);
  const { valeImportar } = resultado;

  return (
    <View style={[styles.box, valeImportar ? styles.boxExterior : styles.boxBrasil]}>
      <View style={styles.tituloLinha}>
        {!valeImportar && <FlagIcon code="BR" size={16} style={{ marginRight: 6 }} />}
        <Text style={[styles.titulo, { color: valeImportar ? cores.info : cores.success }]}>{resultado.msg}</Text>
      </View>
      <Text style={styles.resumo}>
        {valeImportar
          ? `Economia de ${formatarBRL(resultado.economia)} (${formatarPct(resultado.economiaPct)})`
          : `Parcelar no Brasil sai ${formatarBRL(resultado.economia)} (${formatarPct(resultado.economiaPct)}) mais barato em valor de hoje.`}
      </Text>
      <View style={styles.divisor} />
      <Text style={styles.linha}>Custo Brasil (equivalente à vista): {formatarBRL(resultado.custoBR)}</Text>
      <Text style={styles.linha}>Custo Exterior: {formatarBRL(resultado.custoExt)}</Text>

      <View style={styles.divisor} />
      <Text style={styles.detalhamentoTitulo}>Detalhamento do custo no exterior</Text>
      {resultado.breakdown.map((item) => (
        <View key={item.label} style={styles.detalhamentoLinha}>
          <Text style={styles.detalhamentoRotulo}>{item.label}</Text>
          <Text style={styles.detalhamentoValor}>{formatarBRL(item.valor)}</Text>
        </View>
      ))}

      {resultado.avisos.map((aviso) => (
        <View key={aviso} style={styles.aviso}>
          <IconSymbol name="exclamationmark.triangle" size={14} color={cores.warn} />
          <Text style={styles.avisoTexto}>{aviso}</Text>
        </View>
      ))}

      {parcelas > 1 && (
        <Text style={styles.observacao}>
          &ldquo;Equivalente à vista&rdquo; é quanto as parcelas do Brasil valem hoje, descontadas pelo rendimento
          que esse dinheiro renderia investido na Selic.
        </Text>
      )}

      <TouchableOpacity
        onPress={() => setFontesVisiveis(!fontesVisiveis)}
        accessibilityRole="button"
        accessibilityLabel={fontesVisiveis ? 'Ocultar as fontes das regras fiscais' : 'Ver as fontes das regras fiscais'}>
        <Text style={styles.regras}>
          Regras fiscais de {rotuloRevisao()} · {fontesVisiveis ? 'ocultar fontes' : 'ver fontes'}
        </Text>
      </TouchableOpacity>
      {fontesVisiveis &&
        FONTES_FISCAIS.map((fonte) => (
          <TouchableOpacity
            key={fonte.url}
            onPress={() => Linking.openURL(fonte.url)}
            accessibilityRole="link"
            accessibilityLabel={`${fonte.regra}: ${fonte.norma}`}>
            <Text style={styles.fonte}>
              {fonte.regra} — <Text style={styles.fonteLink}>{fonte.norma}</Text>
            </Text>
          </TouchableOpacity>
        ))}

      <TouchableOpacity
        style={styles.compartilhar}
        onPress={aoCompartilhar}
        accessibilityRole="button"
        accessibilityLabel="Compartilhar resultado">
        <IconSymbol name="square.and.arrow.up" size={14} color={cores.text} />
        <Text style={styles.compartilharTexto}>Compartilhar resultado</Text>
      </TouchableOpacity>
    </View>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    box: { width: '100%', padding: 20, borderRadius: 20, marginTop: 12, marginBottom: 10, borderWidth: 1 },
    boxBrasil: { backgroundColor: cores.successBg, borderColor: cores.successBorder },
    boxExterior: { backgroundColor: cores.infoBg, borderColor: cores.infoBorder },
    tituloLinha: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    titulo: { fontSize: 18, fontWeight: 'bold' },
    resumo: { fontSize: 14, color: cores.subtext, marginBottom: 10 },
    divisor: { height: 1, backgroundColor: cores.borderSoft, marginVertical: 10 },
    linha: { fontSize: 15, color: cores.text, marginTop: 2 },
    detalhamentoTitulo: { fontSize: 12, fontWeight: 'bold', color: cores.subtext, textTransform: 'uppercase', marginBottom: 6 },
    detalhamentoLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    detalhamentoRotulo: { fontSize: 13, color: cores.subtext, flexShrink: 1, marginRight: 10 },
    detalhamentoValor: { fontSize: 13, color: cores.text, fontWeight: '600', flexShrink: 0 },
    aviso: { flexDirection: 'row', gap: 6, backgroundColor: cores.warnSoft, padding: 10, borderRadius: 12, marginTop: 10 },
    avisoTexto: { flex: 1, fontSize: 12, color: cores.text, lineHeight: 17 },
    observacao: { fontSize: 11, color: cores.muted, fontStyle: 'italic', marginTop: 8 },
    regras: { fontSize: 11, color: cores.muted, marginTop: 12, textAlign: 'center' },
    fonte: { fontSize: 11, color: cores.subtext, marginTop: 6, lineHeight: 16 },
    fonteLink: { color: cores.text, textDecorationLine: 'underline' },
    compartilhar: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, marginTop: 14, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: cores.border, backgroundColor: cores.card },
    compartilharTexto: { fontSize: 13, color: cores.text, fontWeight: '600' },
  });
}
