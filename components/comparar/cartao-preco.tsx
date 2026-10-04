import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { estiloCampo } from '@/components/comparar/estilos-campo';
import { estiloCartao } from '@/components/ui/cartao';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LIMITE_ESCALA_FONTE, Texto } from '@/components/ui/texto';
import { useTema } from '@/hooks/use-tema';

interface CartaoPrecoProps {
  rotulo: string;
  /** "US$", "€", "R$". */
  simbolo: string;
  valor: string;
  aoMudar: (texto: string) => void;
  /** Linha de baixo ("+ frete US$ 0", "10x de R$ 379,90"); tocar abre a edição. */
  detalhe: string;
  /** Marca à direita do rótulo ("USD", "10x"); tocar também abre a edição. */
  marca?: string;
  aoEditar: () => void;
  accessibilityLabel: string;
  rotuloEdicao: string;
  /** Destaca o card (borda de 1,5px em `text`), como quando o link não foi lido. */
  destacado?: boolean;
}

// Card de preço da grade "Lá fora" × "No Brasil": o valor se digita no próprio card;
// o resto (moeda, frete, parcelas) abre num sheet.
export function CartaoPreco({
  rotulo,
  simbolo,
  valor,
  aoMudar,
  detalhe,
  marca,
  aoEditar,
  accessibilityLabel,
  rotuloEdicao,
  destacado,
}: CartaoPrecoProps) {
  const { cores } = useTema();
  const [focado, setFocado] = useState(false);
  const campo = useRef<TextInput>(null);
  const estiloValor = useMemo(() => estiloCampo(cores, true, 21, 600), [cores]);
  const vazio = !valor.trim();

  // Destacado (link que não deu para ler): o foco vem para cá, para digitar o preço.
  useEffect(() => {
    if (destacado) campo.current?.focus();
  }, [destacado]);

  return (
    <Pressable
      onPress={() => campo.current?.focus()}
      accessible={false}
      style={[estiloCartao(cores, { destaque: focado || destacado ? 'text' : undefined }), styles.cartao]}>
      <Pressable
        onPress={aoEditar}
        hitSlop={8}
        style={styles.topo}
        accessibilityRole="button"
        accessibilityLabel={rotuloEdicao}>
        <Texto variante="rotulo">{rotulo}</Texto>
        {marca ? (
          <View style={styles.marca}>
            <Texto mono tamanho={11} cor="textSubtle">
              {marca}
            </Texto>
            <IconSymbol name="chevron.right" size={11} color={cores.textSubtle} />
          </View>
        ) : null}
      </Pressable>
      <View style={styles.valorLinha}>
        <Texto variante="valor" cor={vazio ? 'textSubtle' : 'text'} style={styles.simbolo}>
          {simbolo}
        </Texto>
        <TextInput
          ref={campo}
          style={[estiloValor, styles.campo]}
          value={valor}
          onChangeText={aoMudar}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          placeholder="0,00"
          placeholderTextColor={cores.textSubtle}
          keyboardType="decimal-pad"
          maxFontSizeMultiplier={LIMITE_ESCALA_FONTE}
          accessibilityLabel={accessibilityLabel}
        />
      </View>
      <Pressable onPress={aoEditar} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${rotuloEdicao}: ${detalhe}`}>
        <Texto tamanho={12} cor="textMuted" numberOfLines={1}>
          {detalhe}
        </Texto>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: { flex: 1, gap: 6 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 20 },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  valorLinha: { flexDirection: 'row', alignItems: 'center' },
  simbolo: { marginRight: 7 },
  campo: { flex: 1, minWidth: 40, letterSpacing: -0.42 },
});
