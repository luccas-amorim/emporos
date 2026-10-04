import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { FlagIcon } from '@/components/flag-icon';
import { useEstilosFormulario } from '@/components/formulario/estilos';
import { formatarBRL, formatarPct } from '@/core/formato';
import { type CamposFormulario, type DefinirCampo, valoresNumericos } from '@/hooks/use-formulario-calculo';
import { useTema } from '@/hooks/use-tema';

interface SecaoBrasilProps {
  campos: CamposFormulario;
  definir: DefinirCampo;
  /** Selic mensal, quando os dados de mercado já carregaram. */
  selicMensal?: number;
}

export function SecaoBrasil({ campos, definir, selicMensal }: SecaoBrasilProps) {
  const { cores } = useTema();
  const styles = useEstilosFormulario();
  const porParcela = campos.modoBR === 'parcela';
  const { parcelas, entradaBR, precoBRTotal } = valoresNumericos(campos);

  return (
    <View style={styles.card}>
      <View style={styles.sectionTitleRow}>
        <FlagIcon code="BR" size={14} />
        <Text style={styles.sectionTitleInline}>Opção Brasil</Text>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{porParcela ? 'Valor da parcela (R$)' : 'Preço total (R$)'}</Text>
          <TextInput
            style={styles.input}
            placeholder={porParcela ? '125,00' : '1.500,00'}
            placeholderTextColor={cores.muted}
            keyboardType="numeric"
            value={campos.valorBR}
            onChangeText={(texto) => definir('valorBR', texto)}
            accessibilityLabel={porParcela ? 'Valor da parcela em reais' : 'Preço total no Brasil em reais'}
          />
        </View>
        <View style={{ width: 110 }}>
          <Text style={styles.label}>Parcelas</Text>
          <TextInput
            style={styles.input}
            placeholder="12"
            placeholderTextColor={cores.muted}
            keyboardType="numeric"
            value={campos.parcelasBR}
            onChangeText={(texto) => definir('parcelasBR', texto)}
            accessibilityLabel="Número de parcelas"
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={() => definir('modoBR', porParcela ? 'total' : 'parcela')}
        accessibilityRole="button"
        accessibilityLabel="Alternar entre informar preço total ou valor da parcela">
        <Text style={styles.alternarModo}>{porParcela ? '← Informar o preço total' : 'Sei só o valor da parcela →'}</Text>
      </TouchableOpacity>

      {porParcela && entradaBR > 0 && parcelas > 1 && (
        <Text style={styles.obs}>
          Total nominal: {formatarBRL(precoBRTotal)} em {parcelas}x
        </Text>
      )}
      {selicMensal !== undefined && (
        <Text style={styles.obs}>Custo de oportunidade: {formatarPct(selicMensal * 100, 2)} a.m.</Text>
      )}
    </View>
  );
}
