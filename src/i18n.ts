export type Lang = 'en' | 'pt'

export const t = {
  en: {
    title: 'Remessa',
    tagline: 'What does it really cost to send money between the U.S. and Brazil?',
    send: 'You send',
    direction: 'Direction',
    usdBrl: 'U.S. → Brazil',
    brlUsd: 'Brazil → U.S.',
    midRate: 'Mid-market rate',
    midNote: 'The real exchange rate, with no margin (European Central Bank, updated on business days).',
    provider: 'Provider',
    receives: 'Recipient gets',
    cost: 'Hidden cost',
    vsMid: 'vs. mid-market',
    best: 'Cheapest',
    live: 'Live',
    estimate: 'Estimate',
    custom: 'Your quote',
    source: 'source',
    checked: 'checked',
    enterQuote: 'Enter my quote',
    quotePrompt: 'Amount the recipient would get',
    compareQuote: 'Compare quote',
    removeQuote: 'Remove my quote',
    quoteInvalid: 'Enter the amount the recipient would get, above 0.',
    wiseLoading: 'Getting Wise’s live quote…',
    wiseError: 'Couldn’t get Wise’s live quote.',
    language: 'Language',
    data: 'Data',
    notOffered: 'Not offered in this direction',
    loading: 'Loading…',
    error: 'Could not load live data. Check your connection and try again.',
    retry: 'Try again',
    history: 'USD/BRL, last 90 days',
    historyHint: 'Higher means each dollar buys more reais.',
    showTable: 'Show as table',
    date: 'Date',
    rate: 'Rate',
    disclaimer:
      'Estimates come from public fee pages and comparison sites, linked on each row. Fees change: confirm in the provider’s app before sending. Not financial advice.',
  },
  pt: {
    title: 'Remessa',
    tagline: 'Quanto custa de verdade mandar dinheiro entre os EUA e o Brasil?',
    send: 'Você envia',
    direction: 'Direção',
    usdBrl: 'EUA → Brasil',
    brlUsd: 'Brasil → EUA',
    midRate: 'Câmbio comercial',
    midNote: 'A taxa real, sem margem (Banco Central Europeu, atualizada em dias úteis).',
    provider: 'Serviço',
    receives: 'Destinatário recebe',
    cost: 'Custo escondido',
    vsMid: 'vs. câmbio comercial',
    best: 'Mais barato',
    live: 'Ao vivo',
    estimate: 'Estimativa',
    custom: 'Sua cotação',
    source: 'fonte',
    checked: 'verificado em',
    enterQuote: 'Inserir minha cotação',
    quotePrompt: 'Valor que o destinatário receberia',
    compareQuote: 'Comparar cotação',
    removeQuote: 'Remover minha cotação',
    quoteInvalid: 'Informe o valor que o destinatário receberia, acima de 0.',
    wiseLoading: 'Buscando a cotação ao vivo da Wise…',
    wiseError: 'Não foi possível buscar a cotação ao vivo da Wise.',
    language: 'Idioma',
    data: 'Dados',
    notOffered: 'Não disponível nesta direção',
    loading: 'Carregando…',
    error: 'Não foi possível carregar os dados ao vivo. Verifique sua conexão e tente de novo.',
    retry: 'Tentar de novo',
    history: 'USD/BRL, últimos 90 dias',
    historyHint: 'Mais alto significa que cada dólar compra mais reais.',
    showTable: 'Ver como tabela',
    date: 'Data',
    rate: 'Taxa',
    disclaimer:
      'Estimativas vêm de páginas de tarifas e sites comparativos, com link em cada linha. Tarifas mudam: confirme no app antes de enviar. Não é recomendação financeira.',
  },
} satisfies Record<Lang, Record<string, string>>

const locale = (lang: Lang) => (lang === 'pt' ? 'pt-BR' : 'en-US')

export function money(n: number, currency: 'USD' | 'BRL', lang: Lang) {
  return new Intl.NumberFormat(locale(lang), { style: 'currency', currency }).format(n)
}

/** A plain number with a fixed count of decimals, in the reader's locale (5.7821 / 5,7821). */
export function num(n: number, digits: number, lang: Lang) {
  return new Intl.NumberFormat(locale(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)
}

/** A percentage given as 0–100 (4.51% / 4,51%). */
export function pct(n: number, lang: Lang) {
  return new Intl.NumberFormat(locale(lang), { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n / 100)
}
