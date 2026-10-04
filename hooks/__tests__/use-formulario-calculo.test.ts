import {
  CAMPOS_INICIAIS,
  type CamposFormulario,
  camposDoPrefill,
  montarSimulacao,
  premissasDe,
  premissasSalvas,
  valoresNumericos,
} from '@/hooks/use-formulario-calculo';
import type { DadosMercado } from '@/services/mercado';

const dados: DadosMercado = {
  cotacoes: { USD: 5, EUR: 6, GBP: 7, JPY: 0.03, ARS: 0.004, CLP: 0.005 },
  selicAnual: 12.68,
  selicMensal: 0.01,
  atualizadoEm: '2026-10-03T12:00:00.000Z',
  origem: 'rede',
};

const preenchido: CamposFormulario = { ...CAMPOS_INICIAIS, valorBR: '1.500,00', parcelasBR: '10', precoExt: '250' };

describe('valoresNumericos', () => {
  it('lê o preço total e as parcelas', () => {
    expect(valoresNumericos(preenchido)).toMatchObject({ parcelas: 10, precoBRTotal: 1500, precoExt: 250 });
  });

  it('multiplica a parcela pelo número de parcelas no modo parcela', () => {
    const v = valoresNumericos({ ...preenchido, modoBR: 'parcela', valorBR: '125' });
    expect(v.precoBRTotal).toBe(1250);
  });

  it('trata parcelas vazias como à vista', () => {
    expect(valoresNumericos({ ...preenchido, parcelasBR: '' }).parcelas).toBe(1);
  });
});

describe('montarSimulacao', () => {
  it('não monta nada sem preços ou sem dados de mercado', () => {
    expect(montarSimulacao(CAMPOS_INICIAIS, dados)).toBeNull();
    expect(montarSimulacao(preenchido, null)).toBeNull();
  });

  it('monta a entrada do cálculo com cotações e regras fiscais', () => {
    const montada = montarSimulacao({ ...preenchido, moeda: 'EUR', freteExt: '20' }, dados)!;
    expect(montada.entrada).toMatchObject({
      precoBR: 1500,
      parcelasBR: 10,
      precoExt: 250,
      freteExt: 20,
      cenario: 'Encomenda',
      cotacao: 6,
      cotacaoUSD: 5,
      selicMensal: 0.01,
      iofCartao: 0.035,
      icms: 0.17,
      siteCertificado: true,
    });
  });

  it('zera frete na viagem e tax free na encomenda', () => {
    const viagem = montarSimulacao({ ...preenchido, cenario: 'Viagem', freteExt: '20', taxFree: '12' }, dados)!;
    expect(viagem.entrada.freteExt).toBe(0);
    expect(viagem.entrada.taxFreePct).toBe(12);
    expect(viagem.registro.icms).toBeUndefined();

    const encomenda = montarSimulacao({ ...preenchido, taxFree: '12' }, dados)!;
    expect(encomenda.entrada.taxFreePct).toBe(0);
    expect(encomenda.registro.icms).toBe(0.17);
  });

  it('guarda no registro só textos preenchidos', () => {
    const montada = montarSimulacao({ ...preenchido, nomeProduto: '  Fone ', link: '   ' }, dados)!;
    expect(montada.registro.nomeProduto).toBe('Fone');
    expect(montada.registro.link).toBeUndefined();
    expect(montada.registro.cotacao).toBe(5);
    expect(montada.registro.selicAnual).toBe(12.68);
  });
});

describe('camposDoPrefill', () => {
  const atual: CamposFormulario = { ...preenchido, freteExt: '30', nomeProduto: 'Antigo', modoBR: 'parcela' };

  it('aplica os valores recebidos e limpa os opcionais ausentes', () => {
    const campos = camposDoPrefill({ precoBR: '2000', precoExt: '300', moeda: 'EUR', cenario: 'Viagem', taxFree: '12' }, atual);
    expect(campos).toMatchObject({
      valorBR: '2000',
      precoExt: '300',
      moeda: 'EUR',
      cenario: 'Viagem',
      taxFree: '12',
      freteExt: '',
      nomeProduto: '',
      modoBR: 'total',
    });
  });

  it('ignora moeda, cenário, pagamento e ICMS inválidos', () => {
    const campos = camposDoPrefill({ moeda: 'XYZ', cenario: 'Outro', pgto: 'Pix', icms: '0.5' }, atual);
    expect(campos.moeda).toBe(atual.moeda);
    expect(campos.cenario).toBe(atual.cenario);
    expect(campos.pgto).toBe(atual.pgto);
    expect(campos.icms).toBe(atual.icms);
  });

  it('restaura ICMS e site fora do Remessa Conforme', () => {
    const campos = camposDoPrefill({ icms: '0.2', certificado: 'nao' }, atual);
    expect(campos.icms).toBe(0.2);
    expect(campos.siteCertificado).toBe(false);
  });
});

describe('premissasSalvas', () => {
  it('lê as premissas válidas e descarta o resto', () => {
    expect(premissasSalvas('{"cenario":"Viagem","siteCertificado":false,"pgto":"Dinheiro","spread":1.5}')).toEqual({
      cenario: 'Viagem',
      siteCertificado: false,
      pgto: 'Dinheiro',
      spread: 1.5,
    });
    expect(premissasSalvas('{"cenario":"Navio","pgto":"Pix","spread":-3}')).toEqual({});
    expect(premissasSalvas('não é json')).toEqual({});
    expect(premissasSalvas(null)).toEqual({});
  });
});

describe('premissasDe', () => {
  it('converte o spread digitado em número', () => {
    expect(premissasDe({ ...CAMPOS_INICIAIS, spread: '1,5' })).toMatchObject({ spread: 1.5, cenario: 'Encomenda' });
  });
});
