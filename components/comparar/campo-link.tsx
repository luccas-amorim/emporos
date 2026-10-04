import React, { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { estiloCampo } from '@/components/comparar/estilos-campo';
import { Cartao } from '@/components/ui/cartao';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LIMITE_ESCALA_FONTE, Texto } from '@/components/ui/texto';
import type { ProdutoLido } from '@/core/parser-produto';
import { useTema } from '@/hooks/use-tema';

export type StatusLink = 'idle' | 'lendo' | 'ok' | 'falhou';

interface CampoLinkProps {
  link: string;
  status: StatusLink;
  produto?: ProdutoLido | null;
  /** Nome do produto (editável na linha do produto, quando o link foi lido). */
  nome: string;
  siteCertificado: boolean;
  aoMudarLink: (link: string) => void;
  aoMudarNome: (nome: string) => void;
  aoColar: () => void;
  /** Ler o link digitado (ao confirmar ou sair do campo). */
  aoLer: () => void;
}

// Card do link (telas 02, 07 e 11): colar, ler a página e mostrar o produto, ou cair
// para o preenchimento manual sem alarde.
export function CampoLink({
  link,
  status,
  produto,
  nome,
  siteCertificado,
  aoMudarLink,
  aoMudarNome,
  aoColar,
  aoLer,
}: CampoLinkProps) {
  const { cores } = useTema();
  const vazio = !link.trim();
  const estiloUrl = useMemo(() => estiloCampo(cores, !vazio, vazio ? 14 : 13.5), [cores, vazio]);
  const estiloNome = useMemo(() => estiloCampo(cores, false, 15, 600), [cores]);

  const botao =
    status === 'lendo' ? (
      <View style={styles.lendo} accessible accessibilityLabel="Lendo a página do produto">
        <ActivityIndicator size="small" color={cores.textSubtle} />
      </View>
    ) : (
      <Pressable
        onPress={aoColar}
        hitSlop={4}
        style={({ pressed }) => [styles.colar, { backgroundColor: cores.surface2 }, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel="Colar link do produto">
        <Texto tamanho={13} peso={600}>
          Colar
        </Texto>
      </Pressable>
    );

  return (
    <Cartao tracejado={vazio} style={{ gap: vazio ? 0 : 12 }}>
      {!vazio && <Texto variante="rotulo">Link do produto</Texto>}
      <View style={styles.linha}>
        <TextInput
          style={[estiloUrl, styles.url]}
          value={link}
          onChangeText={aoMudarLink}
          onSubmitEditing={aoLer}
          onBlur={aoLer}
          placeholder="Colar link ou digitar abaixo"
          placeholderTextColor={cores.textSubtle}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          numberOfLines={1}
          maxFontSizeMultiplier={LIMITE_ESCALA_FONTE}
          accessibilityLabel="Link do produto (opcional)"
        />
        {botao}
      </View>

      {status === 'lendo' ? (
        <Texto tamanho={12.5} cor="textMuted">
          Lendo a página…
        </Texto>
      ) : null}

      {status === 'falhou' ? (
        <Texto tamanho={12.5} cor="textMuted" style={{ lineHeight: 18 }} accessibilityLiveRegion="polite">
          Não conseguimos ler o preço desta página. Digite abaixo — o link fica salvo com a simulação.
        </Texto>
      ) : null}

      {status === 'ok' && produto ? (
        <>
          <View style={[styles.divisor, { backgroundColor: cores.border }]} />
          <View style={styles.produto}>
            {produto.imagem ? (
              <Image
                source={{ uri: produto.imagem }}
                style={[styles.miniatura, { backgroundColor: cores.surface2 }]}
                accessibilityIgnoresInvertColors
                accessible={false}
              />
            ) : (
              <View style={[styles.miniatura, styles.semImagem, { backgroundColor: cores.surface2 }]}>
                <IconSymbol name="photo" size={20} color={cores.textSubtle} />
              </View>
            )}
            <View style={styles.textos}>
              <TextInput
                style={[estiloNome, styles.nome]}
                value={nome}
                onChangeText={aoMudarNome}
                placeholder="Nome do produto"
                placeholderTextColor={cores.textSubtle}
                numberOfLines={1}
                maxFontSizeMultiplier={LIMITE_ESCALA_FONTE}
                accessibilityLabel="Nome do produto (opcional)"
              />
              <Texto variante="rotulo" numberOfLines={1}>
                {produto.loja}
                {siteCertificado ? ' · Remessa Conforme' : ''}
              </Texto>
            </View>
            <View style={[styles.pill, { backgroundColor: cores.exteriorSoft }]}>
              <Texto tamanho={11} peso={600} cor="exterior">
                do link
              </Texto>
            </View>
          </View>
        </>
      ) : null}
    </Cartao>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  url: { flex: 1, minWidth: 0, minHeight: 24 },
  colar: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, minHeight: 36, justifyContent: 'center' },
  lendo: { width: 60, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  divisor: { height: 1 },
  produto: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniatura: { width: 44, height: 44, borderRadius: 11 },
  semImagem: { alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, minWidth: 0, gap: 2 },
  nome: { minHeight: 22 },
  pill: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
});
