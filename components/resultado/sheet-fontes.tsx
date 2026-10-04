import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Sheet } from '@/components/ui/sheet';
import { Texto } from '@/components/ui/texto';
import { dataRevisao, FONTES_FISCAIS } from '@/constants/regras-fiscais';
import { URL_ISSUE_REGRA_FISCAL } from '@/constants/textos';
import { formatarPct } from '@/core/formato';
import { useTema } from '@/hooks/use-tema';
import { type DadosMercado, descreverIdade } from '@/services/mercado';

interface SheetFontesProps {
  visivel: boolean;
  aoFechar: () => void;
  dados: DadosMercado;
}

// Sheet 09: de onde vem cada número, com a norma e a data em que foi conferida.
export function SheetFontes({ visivel, aoFechar, dados }: SheetFontesProps) {
  const { cores } = useTema();
  const grupo = [styles.grupo, { backgroundColor: cores.card, borderColor: cores.border }];
  const divisor = { borderTopWidth: 1, borderTopColor: cores.border };

  return (
    <Sheet
      visivel={visivel}
      aoFechar={aoFechar}
      titulo="De onde vêm os números"
      subtitulo={`Regras conferidas em ${dataRevisao()}`}>
      <View style={grupo}>
        {FONTES_FISCAIS.map((fonte, i) => (
          <Pressable
            key={fonte.url}
            onPress={() => Linking.openURL(fonte.url)}
            accessibilityRole="link"
            accessibilityLabel={`${fonte.regra}: ${fonte.norma}`}
            style={({ pressed }) => [styles.linha, i > 0 && divisor, pressed && { backgroundColor: cores.surface2 }]}>
            <Texto tamanho={14} peso={500}>
              {fonte.regra}
            </Texto>
            <Texto tamanho={12} cor="textMuted" style={styles.norma}>
              {fonte.norma}
            </Texto>
          </Pressable>
        ))}
      </View>

      <View style={grupo}>
        <View style={[styles.linha, styles.linhaValor]}>
          <Texto tamanho={13} cor="textMuted">
            Câmbio · AwesomeAPI
          </Texto>
          <Texto mono tamanho={13}>
            {dados.origem === 'padrao' ? 'referência' : descreverIdade(dados.atualizadoEm)}
          </Texto>
        </View>
        <View style={[styles.linha, styles.linhaValor, divisor]}>
          <Texto tamanho={13} cor="textMuted">
            Selic · BCB, série 432
          </Texto>
          <Texto mono tamanho={13}>
            {formatarPct(dados.selicAnual, 2)} a.a.
          </Texto>
        </View>
      </View>

      <Texto tamanho={12.5} cor="textMuted" style={styles.rodape}>
        Achou uma regra desatualizada?{' '}
        <Texto
          tamanho={12.5}
          peso={600}
          style={styles.sublinhado}
          accessibilityRole="link"
          onPress={() => Linking.openURL(URL_ISSUE_REGRA_FISCAL)}>
          Avise no GitHub
        </Texto>
        . O cálculo é aberto e testado.
      </Texto>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grupo: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  linha: { paddingVertical: 12, paddingHorizontal: 14, gap: 3, minHeight: 44 },
  linhaValor: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  norma: { textDecorationLine: 'underline', lineHeight: 16 },
  rodape: { lineHeight: 18 },
  sublinhado: { textDecorationLine: 'underline' },
});
