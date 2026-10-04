import React, { useMemo } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';

import { estiloCampo } from '@/components/comparar/estilos-campo';
import { ListaMoedas } from '@/components/lista-moedas';
import { Botao } from '@/components/ui/botao';
import { Cartao } from '@/components/ui/cartao';
import { ControleSegmentado } from '@/components/ui/controle-segmentado';
import { Sheet } from '@/components/ui/sheet';
import { Stepper } from '@/components/ui/stepper';
import { LIMITE_ESCALA_FONTE, Texto } from '@/components/ui/texto';
import { moedaPorCodigo } from '@/constants/currencies';
import { formatarBRL, formatarPct } from '@/core/formato';
import { type CamposFormulario, type DefinirCampo, valoresNumericos } from '@/hooks/use-formulario-calculo';
import { useTema } from '@/hooks/use-tema';

interface SheetPrecoProps {
  visivel: boolean;
  aoFechar: () => void;
  campos: CamposFormulario;
  definir: DefinirCampo;
}

export const PARCELAS_MAXIMAS = 24;

// Edição do card "Lá fora": moeda e, na encomenda, o frete.
export function SheetPrecoExterior({ visivel, aoFechar, campos, definir }: SheetPrecoProps) {
  const { cores } = useTema();
  const moeda = moedaPorCodigo(campos.moeda);
  const estilo = useMemo(() => estiloCampo(cores, true, 21, 600), [cores]);

  return (
    <Sheet visivel={visivel} aoFechar={aoFechar} titulo="Lá fora" rodape={<Botao titulo="Pronto" aoTocar={aoFechar} />}>
      {campos.cenario === 'Encomenda' && (
        <Cartao style={{ gap: 6 }}>
          <Texto variante="rotulo">Frete internacional</Texto>
          <View style={styles.linha}>
            <Texto variante="valor" cor={campos.freteExt ? 'text' : 'textSubtle'} style={{ marginRight: 7 }}>
              {moeda.simbolo}
            </Texto>
            <TextInput
              style={[estilo, styles.campo]}
              value={campos.freteExt}
              onChangeText={(t) => definir('freteExt', t)}
              placeholder="0,00"
              placeholderTextColor={cores.textSubtle}
              keyboardType="decimal-pad"
              maxFontSizeMultiplier={LIMITE_ESCALA_FONTE}
              accessibilityLabel={`Frete internacional em ${moeda.nome}`}
            />
          </View>
          <Texto tamanho={12} cor="textMuted">
            Na mesma moeda do produto. Entra no valor aduaneiro e no limite de US$ 50.
          </Texto>
        </Cartao>
      )}
      <View style={{ gap: 8 }}>
        <Texto variante="rotulo">Moeda</Texto>
        <ListaMoedas valor={campos.moeda} aoMudar={(codigo) => definir('moeda', codigo)} />
      </View>
    </Sheet>
  );
}

interface SheetPrecoBrasilProps extends SheetPrecoProps {
  /** Selic mensal, quando os dados de mercado já carregaram. */
  selicMensal?: number;
}

// Edição do card "No Brasil": preço total ou valor da parcela, parcelas e juros.
export function SheetPrecoBrasil({ visivel, aoFechar, campos, definir, selicMensal }: SheetPrecoBrasilProps) {
  const { cores } = useTema();
  const { parcelas, entradaBR, precoBRTotal } = valoresNumericos(campos);
  const porParcela = campos.modoBR === 'parcela';

  return (
    <Sheet visivel={visivel} aoFechar={aoFechar} titulo="No Brasil" rodape={<Botao titulo="Pronto" aoTocar={aoFechar} />}>
      <View style={{ gap: 8 }} accessibilityLabel="Alternar entre informar preço total ou valor da parcela">
        <Texto variante="rotulo">O valor do card é</Texto>
        <ControleSegmentado
          opcoes={[
            { valor: 'total', rotulo: 'Preço total', accessibilityLabel: 'Informar o preço total' },
            { valor: 'parcela', rotulo: 'Valor da parcela', accessibilityLabel: 'Informar o valor da parcela' },
          ]}
          valor={campos.modoBR}
          aoMudar={(v) => definir('modoBR', v)}
        />
        {porParcela && entradaBR > 0 && parcelas > 1 ? (
          <Texto tamanho={12} cor="textMuted">
            Total nominal: {formatarBRL(precoBRTotal)} em {parcelas}x
          </Texto>
        ) : null}
      </View>

      <Cartao style={styles.linhaCartao}>
        <View style={styles.textos}>
          <Texto tamanho={14} peso={500}>
            Parcelas
          </Texto>
          <Texto variante="rotulo">{parcelas === 1 ? 'À vista' : `${parcelas}x no cartão`}</Texto>
        </View>
        <Stepper
          valorTexto={`${parcelas}x`}
          aoDiminuir={() => definir('parcelasBR', String(Math.max(1, parcelas - 1)))}
          aoAumentar={() => definir('parcelasBR', String(Math.min(PARCELAS_MAXIMAS, parcelas + 1)))}
          podeDiminuir={parcelas > 1}
          podeAumentar={parcelas < PARCELAS_MAXIMAS}
          rotuloAcessivel="número de parcelas"
        />
      </Cartao>

      {parcelas > 1 && (
        <Cartao style={styles.linhaCartao}>
          <View style={styles.textos}>
            <Texto tamanho={14} peso={500}>
              Sem juros
            </Texto>
            <Texto variante="rotulo">
              {campos.semJuros
                ? 'O total é o mesmo à vista e parcelado'
                : 'Digite o total já com os juros; a conta é a mesma'}
            </Texto>
          </View>
          <Switch
            value={campos.semJuros}
            onValueChange={(v) => definir('semJuros', v)}
            trackColor={{ true: cores.brasil, false: cores.surface2 }}
            thumbColor="#ffffff"
            accessibilityLabel="Parcelamento sem juros"
          />
        </Cartao>
      )}

      {selicMensal !== undefined && (
        <Texto tamanho={12.5} cor="textMuted" style={{ lineHeight: 18 }}>
          As parcelas são trazidas a valor de hoje pela Selic ({formatarPct(selicMensal * 100, 2)} a.m.): o dinheiro que
          fica na sua conta enquanto elas vencem também rende.
        </Texto>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center' },
  campo: { flex: 1, letterSpacing: -0.42 },
  linhaCartao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16 },
  textos: { flex: 1, gap: 2 },
});
