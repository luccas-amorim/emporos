import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { type CurrencyCode, ehCodigoMoeda } from '@/constants/currencies';
import { type AliquotaICMS, aliquotaICMSValida, REGRAS_FISCAIS } from '@/constants/regras-fiscais';
import { type CalculoInput, type Cenario, type FormaPagamento, parseNumeroLocal } from '@/core/calculadora';
import { formatarNumeroBR } from '@/core/formato';
import { type Premissas, PREMISSAS_PADRAO } from '@/core/premissas';
import type { SimulacaoSalva } from '@/hooks/use-historico-simulacoes';
import { CHAVES, lerComMigracao } from '@/services/armazenamento';
import type { DadosMercado } from '@/services/mercado';

export type ModoEntradaBR = 'total' | 'parcela';

// O que o usuário digita ou escolhe na Home. Números ficam como texto até o cálculo,
// para aceitar "1.500,00" enquanto ele ainda está digitando.
export interface CamposFormulario {
  cenario: Cenario;
  modoBR: ModoEntradaBR;
  valorBR: string;
  parcelasBR: string;
  /** Parcelas sem juros (o preço total é o mesmo à vista e parcelado). */
  semJuros: boolean;
  precoExt: string;
  freteExt: string;
  moeda: CurrencyCode;
  spread: string;
  pgto: FormaPagamento;
  taxFree: string;
  siteCertificado: boolean;
  icms: AliquotaICMS;
  nomeProduto: string;
  link: string;
  observacao: string;
}

export type DefinirCampo = <K extends keyof CamposFormulario>(campo: K, valor: CamposFormulario[K]) => void;

export const CAMPOS_INICIAIS: CamposFormulario = {
  cenario: 'Encomenda',
  modoBR: 'total',
  valorBR: '',
  parcelasBR: '1',
  semJuros: true,
  precoExt: '',
  freteExt: '',
  moeda: 'USD',
  spread: textoSpread(PREMISSAS_PADRAO.spread),
  pgto: PREMISSAS_PADRAO.pgto,
  taxFree: '',
  siteCertificado: PREMISSAS_PADRAO.siteCertificado,
  icms: REGRAS_FISCAIS.icms.padrao,
  nomeProduto: '',
  link: '',
  observacao: '',
};

/** Spread numérico no formato do campo ("2,0"). */
export function textoSpread(spread: number): string {
  return formatarNumeroBR(spread, 1);
}

/** Premissas atuais do formulário. */
export function premissasDe(campos: CamposFormulario): Premissas {
  return {
    cenario: campos.cenario,
    siteCertificado: campos.siteCertificado,
    icms: campos.icms,
    pgto: campos.pgto,
    spread: parseNumeroLocal(campos.spread),
  };
}

/** Lê as premissas salvas, descartando o que for inválido. */
export function premissasSalvas(bruto: string | null): Partial<Premissas> {
  if (!bruto) return {};
  try {
    const salvo = JSON.parse(bruto);
    const p: Partial<Premissas> = {};
    if (salvo.cenario === 'Encomenda' || salvo.cenario === 'Viagem') p.cenario = salvo.cenario;
    if (typeof salvo.siteCertificado === 'boolean') p.siteCertificado = salvo.siteCertificado;
    if (salvo.pgto === 'Cartao' || salvo.pgto === 'Dinheiro') p.pgto = salvo.pgto;
    if (typeof salvo.spread === 'number' && salvo.spread >= 0 && salvo.spread <= 100) p.spread = salvo.spread;
    return p;
  } catch {
    return {};
  }
}

export function valoresNumericos(campos: CamposFormulario) {
  const parcelas = parseInt(campos.parcelasBR, 10) || 1;
  const entradaBR = parseNumeroLocal(campos.valorBR);
  return {
    parcelas,
    entradaBR,
    precoBRTotal: campos.modoBR === 'parcela' ? entradaBR * parcelas : entradaBR,
    precoExt: parseNumeroLocal(campos.precoExt),
  };
}

export type RegistroSimulacao = Omit<SimulacaoSalva, 'id' | 'data' | 'valeImportar' | 'custoBR' | 'custoExt' | 'economia'>;

export interface SimulacaoMontada {
  entrada: CalculoInput;
  registro: RegistroSimulacao;
}

// Converte o formulário na entrada do cálculo e no registro do histórico. Null enquanto
// faltam os preços ou os dados de mercado.
export function montarSimulacao(campos: CamposFormulario, dados: DadosMercado | null): SimulacaoMontada | null {
  const { parcelas, precoBRTotal, precoExt } = valoresNumericos(campos);
  if (!dados || precoBRTotal <= 0 || precoExt <= 0) return null;

  const encomenda = campos.cenario === 'Encomenda';
  const spread = parseNumeroLocal(campos.spread);
  const freteExt = encomenda ? parseNumeroLocal(campos.freteExt) : 0;
  const taxFreePct = encomenda ? 0 : parseNumeroLocal(campos.taxFree);
  const cotacao = dados.cotacoes[campos.moeda];

  return {
    entrada: {
      precoBR: precoBRTotal,
      parcelasBR: parcelas,
      precoExt,
      freteExt,
      taxFreePct,
      cenario: campos.cenario,
      cotacao,
      cotacaoUSD: dados.cotacoes.USD,
      spread,
      pgto: campos.pgto,
      selicMensal: dados.selicMensal,
      iofCartao: REGRAS_FISCAIS.iof.cartao,
      iofDinheiro: REGRAS_FISCAIS.iof.especie,
      icms: campos.icms,
      siteCertificado: campos.siteCertificado,
    },
    registro: {
      nomeProduto: campos.nomeProduto.trim() || undefined,
      observacao: campos.observacao.trim() || undefined,
      link: campos.link.trim() || undefined,
      precoBR: precoBRTotal,
      parcelasBR: parcelas,
      precoExt,
      freteExt,
      taxFreePct,
      cenario: campos.cenario,
      icms: encomenda ? campos.icms : undefined,
      siteCertificado: encomenda ? campos.siteCertificado : undefined,
      moeda: campos.moeda,
      pgto: campos.pgto,
      spread,
      cotacao,
      selicAnual: dados.selicAnual,
    },
  };
}

// Aplica os parâmetros do "Recalcular hoje" (ver paramsRecalculo). Os opcionais são
// aplicados mesmo vazios, para não herdar valores da simulação que estava na tela;
// valores inválidos são ignorados.
export function camposDoPrefill(
  params: Record<string, string | undefined>,
  atual: CamposFormulario
): CamposFormulario {
  const cenario = params.cenario === 'Encomenda' || params.cenario === 'Viagem' ? params.cenario : atual.cenario;
  const pgto = params.pgto === 'Cartao' || params.pgto === 'Dinheiro' ? params.pgto : atual.pgto;
  return {
    ...atual,
    cenario,
    modoBR: 'total',
    valorBR: params.precoBR || atual.valorBR,
    parcelasBR: params.parcelasBR || atual.parcelasBR,
    precoExt: params.precoExt || atual.precoExt,
    freteExt: params.freteExt ?? '',
    moeda: ehCodigoMoeda(params.moeda) ? params.moeda : atual.moeda,
    spread: params.spread || atual.spread,
    pgto,
    taxFree: params.taxFree ?? '',
    siteCertificado: params.certificado !== 'nao',
    icms: aliquotaICMSValida(params.icms) ?? atual.icms,
    nomeProduto: params.nomeProduto ?? '',
    link: params.link ?? '',
    observacao: params.observacao ?? '',
  };
}

// Estado do formulário da Home. Moeda e ICMS são lembrados entre usos.
export function useFormularioCalculo() {
  const [campos, setCampos] = useState<CamposFormulario>(CAMPOS_INICIAIS);
  const restaurado = useRef(false);
  const veioDoHistorico = useRef(false);

  useEffect(() => {
    Promise.all([lerComMigracao(CHAVES.moeda), lerComMigracao(CHAVES.icms), lerComMigracao(CHAVES.premissas)])
      .then(([moeda, icms, premissas]) => {
        // Se o "Recalcular hoje" chegou antes, os valores dele prevalecem.
        if (veioDoHistorico.current) return;
        const salvas = premissasSalvas(premissas);
        setCampos((atual) => ({
          ...atual,
          moeda: ehCodigoMoeda(moeda) ? moeda : atual.moeda,
          icms: aliquotaICMSValida(icms) ?? atual.icms,
          cenario: salvas.cenario ?? atual.cenario,
          siteCertificado: salvas.siteCertificado ?? atual.siteCertificado,
          pgto: salvas.pgto ?? atual.pgto,
          spread: salvas.spread !== undefined ? textoSpread(salvas.spread) : atual.spread,
        }));
      })
      .catch(() => {})
      .finally(() => {
        restaurado.current = true;
      });
  }, []);

  useEffect(() => {
    if (!restaurado.current) return;
    AsyncStorage.setItem(CHAVES.moeda, campos.moeda).catch(() => {});
  }, [campos.moeda]);

  useEffect(() => {
    if (!restaurado.current) return;
    AsyncStorage.setItem(CHAVES.icms, String(campos.icms)).catch(() => {});
  }, [campos.icms]);

  const definir: DefinirCampo = useCallback((campo, valor) => {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
  }, []);

  const aplicarPrefill = useCallback((params: Record<string, string | undefined>) => {
    veioDoHistorico.current = true;
    setCampos((atual) => camposDoPrefill(params, atual));
  }, []);

  // Premissas aplicadas no sheet viram o padrão das próximas comparações.
  const aplicarPremissas = useCallback((p: Premissas & { taxFree?: string }) => {
    setCampos((atual) => ({
      ...atual,
      cenario: p.cenario,
      siteCertificado: p.siteCertificado,
      icms: p.icms as AliquotaICMS,
      pgto: p.pgto,
      spread: textoSpread(p.spread),
      taxFree: p.taxFree ?? atual.taxFree,
    }));
    const { cenario, siteCertificado, pgto, spread } = p;
    AsyncStorage.setItem(CHAVES.premissas, JSON.stringify({ cenario, siteCertificado, pgto, spread })).catch(() => {});
  }, []);

  return { campos, definir, aplicarPrefill, aplicarPremissas };
}
