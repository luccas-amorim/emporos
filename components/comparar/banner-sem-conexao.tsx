import React from 'react';

import { Cartao } from '@/components/ui/cartao';
import { Texto } from '@/components/ui/texto';
import { type DadosMercado, descreverHorario } from '@/services/mercado';

// Aviso de que a cotação não veio da rede agora.
export function BannerSemConexao({ dados }: { dados: DadosMercado }) {
  if (dados.origem === 'rede') return null;
  const detalhe =
    dados.origem === 'cache'
      ? `Usando a última cotação salva, ${descreverHorario(dados.atualizadoEm)}. Puxe a tela para atualizar.`
      : 'Usando valores de referência. Puxe a tela para atualizar.';

  return (
    <Cartao tom="aviso" raio={18} style={{ gap: 4 }} accessibilityRole="alert">
      <Texto tamanho={14} peso={600} cor="warn">
        Sem conexão
      </Texto>
      <Texto tamanho={13} style={{ lineHeight: 18 }}>
        {detalhe}
      </Texto>
    </Cartao>
  );
}
