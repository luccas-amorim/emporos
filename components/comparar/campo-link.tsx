import React, { useMemo } from 'react';
import { TextInput } from 'react-native';

import { estiloCampo } from '@/components/comparar/estilos-campo';
import { Cartao } from '@/components/ui/cartao';
import { LIMITE_ESCALA_FONTE, Texto } from '@/components/ui/texto';
import { useTema } from '@/hooks/use-tema';

interface CampoLinkProps {
  link: string;
  aoMudar: (link: string) => void;
}

// Link do produto. Vazio, aparece com borda tracejada, como um convite.
export function CampoLink({ link, aoMudar }: CampoLinkProps) {
  const { cores } = useTema();
  const vazio = !link.trim();
  const estilo = useMemo(() => estiloCampo(cores, !vazio, vazio ? 14 : 13.5), [cores, vazio]);

  return (
    <Cartao tracejado={vazio} style={{ gap: vazio ? 0 : 8 }}>
      {!vazio && <Texto variante="rotulo">Link do produto</Texto>}
      <TextInput
        style={[estilo, { minHeight: 24 }]}
        value={link}
        onChangeText={aoMudar}
        placeholder="Colar link ou digitar abaixo"
        placeholderTextColor={cores.textSubtle}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        numberOfLines={1}
        maxFontSizeMultiplier={LIMITE_ESCALA_FONTE}
        accessibilityLabel="Link do produto (opcional)"
      />
    </Cartao>
  );
}
