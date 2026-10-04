import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React, { useState } from 'react';
import { Text } from 'react-native';

import { Cartao } from '@/components/ui/cartao';
import { Chip } from '@/components/ui/chip';
import { ControleSegmentado } from '@/components/ui/controle-segmentado';
import { Sheet } from '@/components/ui/sheet';
import { LIMITE_ESCALA_FONTE, Texto } from '@/components/ui/texto';
import { Colors, familiaFonte } from '@/constants/theme';

describe('Texto', () => {
  it('usa Geist Mono com números tabulares nos valores e limita a fonte dinâmica a 130%', async () => {
    await render(<Texto variante="valor">R$ 3.799</Texto>);
    const texto = screen.getByText('R$ 3.799');
    const estilo = Object.assign({}, ...[texto.props.style].flat(Infinity).filter(Boolean));
    expect(estilo.fontFamily).toBe(familiaFonte(true, 600));
    expect(estilo.fontVariant).toEqual(['tabular-nums']);
    expect(texto.props.maxFontSizeMultiplier).toBe(LIMITE_ESCALA_FONTE);
  });

  it('aplica a cor do token pedido', async () => {
    await render(
      <Texto variante="veredito" cor="brasil">
        Compre no Brasil.
      </Texto>
    );
    const estilo = Object.assign({}, ...[screen.getByText('Compre no Brasil.').props.style].flat(Infinity).filter(Boolean));
    expect(estilo.color).toBe(Colors.light.brasil);
    expect(estilo.fontSize).toBe(38);
  });
});

describe('ControleSegmentado', () => {
  function Exemplo({ aoMudar }: { aoMudar: (v: string) => void }) {
    const [valor, setValor] = useState('Encomenda');
    return (
      <ControleSegmentado
        opcoes={[
          { valor: 'Encomenda', rotulo: 'Encomenda', accessibilityLabel: 'Cenário encomenda internacional' },
          { valor: 'Viagem', rotulo: 'Viagem', accessibilityLabel: 'Cenário compra em viagem' },
        ]}
        valor={valor}
        aoMudar={(v) => {
          setValor(v);
          aoMudar(v);
        }}
      />
    );
  }

  it('marca o item ativo como selecionado e troca ao tocar', async () => {
    const aoMudar = jest.fn();
    await render(<Exemplo aoMudar={aoMudar} />);

    expect(screen.getByLabelText('Cenário encomenda internacional').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText('Cenário compra em viagem').props.accessibilityState).toEqual({ selected: false });

    await fireEvent.press(screen.getByLabelText('Cenário compra em viagem'));

    expect(aoMudar).toHaveBeenCalledWith('Viagem');
    expect(screen.getByLabelText('Cenário compra em viagem').props.accessibilityState).toEqual({ selected: true });
  });
});

describe('Chip', () => {
  it('é tocável quando recebe ação', async () => {
    const aoTocar = jest.fn();
    await render(<Chip rotulo="ICMS 17%" aoTocar={aoTocar} accessibilityLabel="Ajustar ICMS" />);
    await fireEvent.press(screen.getByLabelText('Ajustar ICMS'));
    expect(aoTocar).toHaveBeenCalled();
  });

  it('sem ação, é só um rótulo', async () => {
    await render(<Chip rotulo="Dentro da cota de US$ 1.000" tom="brasil" />);
    expect(screen.getByText('Dentro da cota de US$ 1.000')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('Cartao', () => {
  it('vira botão quando recebe aoTocar', async () => {
    const aoTocar = jest.fn();
    await render(
      <Cartao aoTocar={aoTocar} accessibilityLabel="Editar preço lá fora">
        <Text>US$ 399</Text>
      </Cartao>
    );
    await fireEvent.press(screen.getByLabelText('Editar preço lá fora'));
    expect(aoTocar).toHaveBeenCalled();
  });
});

describe('Sheet', () => {
  function Exemplo() {
    const [aberto, setAberto] = useState(true);
    return (
      <Sheet
        visivel={aberto}
        aoFechar={() => setAberto(false)}
        titulo="Premissas"
        acao={{ rotulo: 'Restaurar padrão', aoTocar: () => {} }}>
        <Text>Como você compra</Text>
      </Sheet>
    );
  }

  it('mostra título, ação e conteúdo, e fecha ao tocar no véu', async () => {
    await render(<Exemplo />);

    expect(screen.getByText('Premissas')).toBeTruthy();
    expect(screen.getByLabelText('Restaurar padrão')).toBeTruthy();
    expect(screen.getByText('Como você compra')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Fechar'));
    await waitFor(() => expect(screen.queryByText('Premissas')).toBeNull());
  });
});
