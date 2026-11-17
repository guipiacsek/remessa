// Fees for providers without a public quote API. These are estimates: each one
// names its source and the date it was checked, and the UI labels it "estimate".
// Edit this file when you get a real quote (or use "I have a quote" in the app).

export type Direction = 'USD-BRL' | 'BRL-USD'

export interface Pricing {
  /** Flat fee, in the currency being sent. */
  fee: number
  /** Fee is waived when the amount sent is worth at least this many USD. */
  feeWaivedFromUsd?: number
  /** Exchange-rate margin over the mid-market rate, in percent. */
  markupPct: number
  /** Tax on the exchange (Brazil's IOF), in percent of the amount sent. */
  taxPct?: number
  note: { en: string; pt: string }
  source: string
  checked: string
}

export interface Provider {
  id: string
  name: string
  /** 'live' providers are quoted from the Wise comparison API; the rest use `pricing`. */
  kind: 'live' | 'estimate'
  pricing: Partial<Record<Direction, Pricing>>
}

export const providers: Provider[] = [
  { id: 'wise', name: 'Wise', kind: 'live', pricing: {} },
  {
    id: 'inter',
    name: 'Inter&Co',
    kind: 'estimate',
    pricing: {
      'USD-BRL': {
        fee: 0,
        markupPct: 0.99,
        note: {
          en: 'Global Account conversion, spread "up to 0.99%" per comparison sites. Check the Inter app for your rate.',
          pt: 'Conversão na Conta Global, spread "de até 0,99%" segundo sites comparativos. Confira sua taxa no app do Inter.',
        },
        source: 'https://www.nomadglobal.com/conteudos/nomad-ou-inter',
        checked: '2026-11-17',
      },
      'BRL-USD': {
        fee: 50,
        feeWaivedFromUsd: 500,
        markupPct: 1.4,
        taxPct: 3.5,
        note: {
          en: 'Remittance from Brazil: spread up to 1.4%, BRL 50 fee under USD 500, plus 3.5% IOF.',
          pt: 'Remessa a partir do Brasil: spread de até 1,4%, tarifa de R$ 50 abaixo de US$ 500, mais 3,5% de IOF.',
        },
        source: 'https://exiap.com.br/guias/banco-inter-transferencia-internacional',
        checked: '2026-11-17',
      },
    },
  },
  {
    id: 'bank',
    name: 'U.S. bank wire (SWIFT)',
    kind: 'estimate',
    pricing: {
      'USD-BRL': {
        fee: 40,
        markupPct: 3,
        note: {
          en: 'Chase-style online wire: $40 fee. Banks convert at their own retail rate; the 3% margin is an assumption, not a published number.',
          pt: 'Wire online estilo Chase: tarifa de US$ 40. Bancos convertem pela própria taxa; a margem de 3% é uma suposição, não um número publicado.',
        },
        source: 'https://www.nerdwallet.com/banking/learn/wire-transfers-what-banks-charge',
        checked: '2026-11-17',
      },
    },
  },
]
