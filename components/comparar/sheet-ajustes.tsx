import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ListaMoedas } from '@/components/lista-moedas';
import { ControleSegmentado } from '@/components/ui/controle-segmentado';
import { Sheet } from '@/components/ui/sheet';
import { Texto } from '@/components/ui/texto';
import { AVISO_LEGAL } from '@/constants/textos';
import { type CurrencyCode } from '@/constants/currencies';
import { type AliquotaICMS, REGRAS_FISCAIS } from '@/constants/regras-fiscais';
import { rotuloAliquota } from '@/core/calculadora';
import { type PreferenciaTema, useTema } from '@/hooks/use-tema';

interface SheetAjustesProps {
  visivel: boolean;
  aoFechar: () => void;
  moeda: CurrencyCode;
  aoMudarMoeda: (moeda: CurrencyCode) => void;
  icms: AliquotaICMS;
  aoMudarIcms: (icms: AliquotaICMS) => void;
}

// Ajustes: tema, moeda padrão e ICMS do estado. Valem na hora e ficam salvos.
export function SheetAjustes({ visivel, aoFechar, moeda, aoMudarMoeda, icms, aoMudarIcms }: SheetAjustesProps) {
  const { preferencia, definirPreferencia } = useTema();

  return (
    <Sheet visivel={visivel} aoFechar={aoFechar} titulo="Ajustes">
      <View style={styles.campo}>
        <Texto variante="rotulo">Tema</Texto>
        <ControleSegmentado<PreferenciaTema>
          opcoes={[
            { valor: 'auto', rotulo: 'Sistema', accessibilityLabel: 'Tema igual ao do sistema' },
            { valor: 'claro', rotulo: 'Claro', accessibilityLabel: 'Tema claro' },
            { valor: 'escuro', rotulo: 'Escuro', accessibilityLabel: 'Tema escuro' },
          ]}
          valor={preferencia}
          aoMudar={definirPreferencia}
        />
      </View>

      <View style={styles.campo}>
        <Texto variante="rotulo">ICMS do seu estado</Texto>
        <ControleSegmentado
          mono
          opcoes={REGRAS_FISCAIS.icms.opcoes.map((opcao) => ({
            valor: opcao,
            rotulo: rotuloAliquota(opcao),
            accessibilityLabel: `ICMS padrão de ${rotuloAliquota(opcao)}`,
          }))}
          valor={icms}
          aoMudar={aoMudarIcms}
        />
      </View>

      <View style={styles.campo}>
        <Texto variante="rotulo">Moeda padrão</Texto>
        <ListaMoedas valor={moeda} aoMudar={aoMudarMoeda} />
      </View>

      <Texto tamanho={11.5} cor="textSubtle" style={styles.aviso}>
        {AVISO_LEGAL}
      </Texto>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  campo: { gap: 8 },
  aviso: { lineHeight: 16 },
});
