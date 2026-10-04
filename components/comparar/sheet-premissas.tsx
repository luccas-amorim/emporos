import React, { useEffect, useMemo, useState } from 'react';
import { Linking, StyleSheet, TextInput, View } from 'react-native';

import { estiloCampo } from '@/components/comparar/estilos-campo';
import { Botao } from '@/components/ui/botao';
import { Cartao } from '@/components/ui/cartao';
import { ControleSegmentado } from '@/components/ui/controle-segmentado';
import { Sheet } from '@/components/ui/sheet';
import { Stepper } from '@/components/ui/stepper';
import { LIMITE_ESCALA_FONTE, Texto } from '@/components/ui/texto';
import { FONTES_FISCAIS, REGRAS_FISCAIS } from '@/constants/regras-fiscais';
import { rotuloAliquota } from '@/core/calculadora';
import { formatarNumeroBR, formatarPct } from '@/core/formato';
import {
  PREMISSAS_PADRAO,
  passoSpread,
  type Premissas,
  rotuloPagamento,
  SPREAD_MAXIMO,
} from '@/core/premissas';
import { useTema } from '@/hooks/use-tema';

export type PremissasEditaveis = Premissas & { taxFree: string };

interface SheetPremissasProps {
  visivel: boolean;
  aoFechar: () => void;
  atuais: PremissasEditaveis;
  aoAplicar: (premissas: PremissasEditaveis) => void;
}

const URL_COMSEFAZ = FONTES_FISCAIS.find((f) => f.norma.includes('Comsefaz'))?.url;

function Campo({ rotulo, children, nota }: { rotulo: string; children: React.ReactNode; nota?: React.ReactNode }) {
  return (
    <View style={styles.campo}>
      <Texto variante="rotulo">{rotulo}</Texto>
      {children}
      {nota}
    </View>
  );
}

// Sheet 06: premissas da comparação. As mudanças valem ao tocar em "Aplicar" e viram
// o padrão das próximas comparações; fechar sem aplicar descarta.
export function SheetPremissas({ visivel, aoFechar, atuais, aoAplicar }: SheetPremissasProps) {
  const { cores } = useTema();
  const [rascunho, setRascunho] = useState<PremissasEditaveis>(atuais);
  const estiloTaxFree = useMemo(() => estiloCampo(cores, true, 15, 600), [cores]);
  const { remessaConforme: rc, icms, bagagem } = REGRAS_FISCAIS;

  useEffect(() => {
    if (visivel) setRascunho(atuais);
  }, [visivel]); // eslint-disable-line react-hooks/exhaustive-deps

  const mudar = <K extends keyof PremissasEditaveis>(campo: K, valor: PremissasEditaveis[K]) =>
    setRascunho((atual) => ({ ...atual, [campo]: valor }));

  const encomenda = rascunho.cenario === 'Encomenda';

  return (
    <Sheet
      visivel={visivel}
      aoFechar={aoFechar}
      titulo="Premissas"
      acao={{
        rotulo: 'Restaurar padrão',
        aoTocar: () => setRascunho({ ...PREMISSAS_PADRAO, cenario: rascunho.cenario, taxFree: '' }),
      }}
      rodape={
        <Botao
          titulo="Aplicar"
          aoTocar={() => {
            aoAplicar(rascunho);
            aoFechar();
          }}
        />
      }>
      <Campo rotulo="Como você compra">
        <ControleSegmentado
          opcoes={[
            { valor: 'Encomenda', rotulo: 'Encomenda', accessibilityLabel: 'Cenário encomenda internacional' },
            { valor: 'Viagem', rotulo: 'Viagem', accessibilityLabel: 'Cenário compra em viagem' },
          ]}
          valor={rascunho.cenario}
          aoMudar={(v) => mudar('cenario', v)}
        />
      </Campo>

      {encomenda ? (
        <>
          <Campo
            rotulo="O site está no Remessa Conforme?"
            nota={
              <Texto tamanho={12} cor="textMuted" style={styles.nota}>
                II de {rotuloAliquota(rc.aliquotaFaixaBaixa)} até US$ {rc.limiteFaixaBaixaUSD}; acima disso,{' '}
                {rotuloAliquota(rc.aliquotaFaixaAlta)} − US$ {rc.descontoFaixaAltaUSD}. Fora do programa:{' '}
                {rotuloAliquota(REGRAS_FISCAIS.aliquotaForaRemessaConforme)}.
              </Texto>
            }>
            <ControleSegmentado
              opcoes={[
                { valor: 'sim', rotulo: 'Sim', accessibilityLabel: 'Site certificado no Remessa Conforme' },
                { valor: 'nao', rotulo: 'Não', accessibilityLabel: 'Site fora do Remessa Conforme' },
              ]}
              valor={rascunho.siteCertificado ? 'sim' : 'nao'}
              aoMudar={(v) => mudar('siteCertificado', v === 'sim')}
            />
          </Campo>

          <Campo
            rotulo="ICMS do seu estado"
            nota={
              <Texto tamanho={12} cor="textMuted" style={styles.nota}>
                A maioria dos estados cobra {rotuloAliquota(icms.padrao)}. Confira o seu na{' '}
                <Texto
                  tamanho={12}
                  cor="text"
                  style={styles.link}
                  accessibilityRole="link"
                  onPress={URL_COMSEFAZ ? () => Linking.openURL(URL_COMSEFAZ) : undefined}>
                  tabela do Comsefaz
                </Texto>
                .
              </Texto>
            }>
            <ControleSegmentado
              mono
              opcoes={icms.opcoes.map((opcao) => ({
                valor: opcao,
                rotulo: rotuloAliquota(opcao),
                accessibilityLabel: `ICMS de ${rotuloAliquota(opcao)}`,
              }))}
              valor={rascunho.icms as (typeof icms.opcoes)[number]}
              aoMudar={(v) => mudar('icms', v)}
            />
          </Campo>
        </>
      ) : (
        <>
          <Cartao style={styles.linhaCartao}>
            <View style={styles.textos}>
              <Texto tamanho={14} peso={500}>
                Tax free que você recupera
              </Texto>
              <Texto variante="rotulo">O que volta ao bolso, não a alíquota cheia</Texto>
            </View>
            <View style={styles.linha}>
              <TextInput
                style={[estiloTaxFree, styles.campoTaxFree]}
                value={rascunho.taxFree}
                onChangeText={(t) => mudar('taxFree', t)}
                placeholder="0"
                placeholderTextColor={cores.textSubtle}
                keyboardType="decimal-pad"
                maxLength={5}
                maxFontSizeMultiplier={LIMITE_ESCALA_FONTE}
                accessibilityLabel="Tax free a recuperar, em porcentagem"
              />
              <Texto mono tamanho={15} peso={600}>
                %
              </Texto>
            </View>
          </Cartao>
          <Cartao tom="apoio" raio={18} style={{ gap: 4 }}>
            <Texto tamanho={14} peso={600}>
              Cota de bagagem: US$ {formatarNumeroBR(bagagem.cotaUSD, 0)}
            </Texto>
            <Texto tamanho={12.5} cor="textMuted" style={styles.nota}>
              Acima dela, a Receita cobra {rotuloAliquota(bagagem.aliquotaExcedente)} sobre o excedente. O resultado avisa,
              mas não soma esse imposto.
            </Texto>
          </Cartao>
        </>
      )}

      <Campo rotulo="Pagamento">
        <ControleSegmentado
          opcoes={[
            { valor: 'Cartao', rotulo: rotuloPagamento('Cartao'), accessibilityLabel: 'Pagamento com cartão' },
            { valor: 'Dinheiro', rotulo: rotuloPagamento('Dinheiro'), accessibilityLabel: 'Pagamento em dinheiro' },
          ]}
          valor={rascunho.pgto}
          aoMudar={(v) => mudar('pgto', v)}
        />
      </Campo>

      <Cartao style={styles.linhaCartao}>
        <View style={styles.textos}>
          <Texto tamanho={14} peso={500}>
            Spread da operadora
          </Texto>
          <Texto variante="rotulo">Acima do câmbio comercial</Texto>
        </View>
        <Stepper
          valorTexto={formatarPct(rascunho.spread, 1)}
          aoDiminuir={() => mudar('spread', passoSpread(rascunho.spread, -1))}
          aoAumentar={() => mudar('spread', passoSpread(rascunho.spread, 1))}
          podeDiminuir={rascunho.spread > 0}
          podeAumentar={rascunho.spread < SPREAD_MAXIMO}
          rotuloAcessivel="spread bancário em porcentagem"
        />
      </Cartao>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  campo: { gap: 8 },
  nota: { lineHeight: 17 },
  link: { textDecorationLine: 'underline' },
  linhaCartao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16 },
  textos: { flex: 1, gap: 2 },
  linha: { flexDirection: 'row', alignItems: 'center' },
  campoTaxFree: { minWidth: 28, minHeight: 44, textAlign: 'right' },
});
