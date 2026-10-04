import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Botao } from '@/components/ui/botao';
import { Cartao } from '@/components/ui/cartao';
import { ControleSegmentado } from '@/components/ui/controle-segmentado';
import { Sheet } from '@/components/ui/sheet';
import { Stepper } from '@/components/ui/stepper';
import { Texto } from '@/components/ui/texto';
import { type CurrencyCode, moedaPorCodigo } from '@/constants/currencies';
import { mediaMinMax } from '@/core/cambio';
import { formatarCotacaoBR, formatarNumeroBR } from '@/core/formato';
import { useAlertasCambio } from '@/hooks/use-alertas-cambio';
import { useSerieCambio } from '@/hooks/use-serie-cambio';
import { type AlertaCambio, alvoInicial, type DirecaoAlerta, PASSO_ALVO, passoAlvo } from '@/services/alertas';
import type { StatusPermissao } from '@/services/notificacoes';

export interface SugestaoAlerta {
  /** Ponto de virada da simulação. */
  valor: number;
  nomeProduto?: string;
}

interface SheetNovoAlertaProps {
  visivel: boolean;
  aoFechar: () => void;
  moeda: CurrencyCode;
  cotacaoHoje: number;
  sugestao?: SugestaoAlerta | null;
  /** Id da simulação que originou o alerta. */
  origem?: string;
  /** Alerta existente, para editar ou excluir. */
  editando?: AlertaCambio | null;
  aoCriar?: (id: string) => void;
}

const NOTA: Record<StatusPermissao, string> = {
  concedida:
    'O celular confere a cotação algumas vezes por dia, sem servidor. A notificação chega mesmo com o app fechado.',
  pendente:
    'O celular confere a cotação algumas vezes por dia, sem servidor. Ao criar o primeiro alerta, vamos pedir permissão para avisar por notificação.',
  negada:
    'Notificações desativadas: o aviso só aparece com o app aberto. Para receber notificações, ative-as nas configurações do celular.',
  indisponivel: 'Nesta versão, o aviso aparece no app, na aba Câmbio.',
};

// Sheet 10: alvo de um alerta de câmbio, com a cotação de hoje, a mínima de 90 dias
// e, quando há uma simulação, o ponto de virada como sugestão.
export function SheetNovoAlerta({
  visivel,
  aoFechar,
  moeda,
  cotacaoHoje,
  sugestao,
  origem,
  editando,
  aoCriar,
}: SheetNovoAlertaProps) {
  const { adicionarAlerta, editarAlerta, removerAlerta, permissao, pedirPermissaoNotificacao } = useAlertasCambio();
  const { serie } = useSerieCambio(moeda, visivel);
  const [direcao, setDirecao] = useState<DirecaoAlerta>('abaixo');
  const [alvo, setAlvo] = useState(0);
  const info = moedaPorCodigo(moeda);
  const minimo = serie ? mediaMinMax(serie.pontos)?.min : undefined;

  useEffect(() => {
    if (!visivel) return;
    if (editando) {
      setDirecao(editando.direcao);
      setAlvo(editando.alvo);
    } else {
      setDirecao('abaixo');
      setAlvo(alvoInicial(cotacaoHoje, 'abaixo', sugestao?.valor));
    }
  }, [visivel]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmar = () => {
    if (editando) {
      editarAlerta(editando.id, { alvo, direcao });
    } else {
      const id = adicionarAlerta({ moeda, alvo, direcao, origem });
      if (permissao === 'pendente') pedirPermissaoNotificacao();
      aoCriar?.(id);
    }
    aoFechar();
  };

  const mostrarSugestao = !!sugestao && direcao === 'abaixo' && Number.isFinite(sugestao.valor) && sugestao.valor > 0;

  return (
    <Sheet
      visivel={visivel}
      aoFechar={aoFechar}
      titulo={`Avisar quando ${info.nomeFrase} ficar ${direcao === 'abaixo' ? 'abaixo' : 'acima'} de`}
      rodape={
        <View style={{ gap: 10 }}>
          <Botao titulo={editando ? 'Salvar alerta' : 'Criar alerta'} aoTocar={confirmar} />
          {editando ? (
            <Botao
              titulo="Excluir alerta"
              variante="secundario"
              accessibilityLabel="Remover alerta"
              aoTocar={() => {
                removerAlerta(editando.id);
                aoFechar();
              }}
            />
          ) : null}
        </View>
      }>
      <ControleSegmentado<DirecaoAlerta>
        opcoes={[
          { valor: 'abaixo', rotulo: 'Cair até', accessibilityLabel: 'Avisar quando cair até o alvo' },
          { valor: 'acima', rotulo: 'Subir até', accessibilityLabel: 'Avisar quando subir até o alvo' },
        ]}
        valor={direcao}
        aoMudar={(d) => {
          setDirecao(d);
          if (!editando) setAlvo(alvoInicial(cotacaoHoje, d, d === 'abaixo' ? sugestao?.valor : null));
        }}
      />

      <Cartao style={styles.stepper}>
        <Stepper
          tamanho="grande"
          valorTexto={formatarCotacaoBR(alvo)}
          aoDiminuir={() => setAlvo((a) => passoAlvo(a, -1))}
          aoAumentar={() => setAlvo((a) => passoAlvo(a, 1))}
          podeDiminuir={alvo > PASSO_ALVO}
          rotuloAcessivel="cotação alvo em reais"
        />
      </Cartao>

      <View style={styles.referencias}>
        <Texto mono tamanho={12} cor="textSubtle">
          hoje {formatarNumeroBR(cotacaoHoje, 2)}
        </Texto>
        {minimo !== undefined ? (
          <Texto mono tamanho={12} cor="textSubtle">
            mín. 90 dias {formatarNumeroBR(minimo, 2)}
          </Texto>
        ) : null}
      </View>

      {mostrarSugestao ? (
        <Pressable
          onPress={() => setAlvo(Math.round(sugestao!.valor * 100) / 100)}
          accessibilityRole="button"
          accessibilityLabel={`Usar a sugestão: ${formatarCotacaoBR(sugestao!.valor)}`}>
          <Cartao tom="exterior" raio={18} style={{ gap: 4 }}>
            <Texto tamanho={14} peso={600} cor="exterior">
              Sugestão: {formatarCotacaoBR(sugestao!.valor)}
            </Texto>
            <Texto tamanho={12.5} style={{ lineHeight: 18 }}>
              É o ponto de virada {sugestao!.nomeProduto?.trim() ? `do ${sugestao!.nomeProduto.trim()}` : 'da sua simulação'}:
              abaixo disso, importar passa a valer mais que parcelar.
            </Texto>
          </Cartao>
        </Pressable>
      ) : null}

      <Texto tamanho={12} cor="textSubtle" style={{ lineHeight: 17 }}>
        {NOTA[permissao]}
      </Texto>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center' },
  referencias: { flexDirection: 'row', justifyContent: 'space-between' },
});
