import type { Direction } from './providers'

// Both APIs are free, need no key, and allow browser requests (CORS *).
const FX = 'https://api.frankfurter.dev/v1'
const WISE = 'https://api.wise.com/v4/comparisons/'

export interface Point {
  date: string
  rate: number
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json() as Promise<T>
}

/** Daily USD→BRL mid-market rates (European Central Bank) for the last `days` days, oldest first. */
export async function usdBrlHistory(days: number, signal?: AbortSignal): Promise<Point[]> {
  const start = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
  const data = await getJson<{ rates: Record<string, { BRL: number }> }>(`${FX}/${start}..?from=USD&to=BRL`, signal)
  return Object.entries(data.rates).map(([date, r]) => ({ date, rate: r.BRL }))
}

interface WiseComparison {
  providers: { alias: string; quotes: { receivedAmount: number; dateCollected: string }[] }[]
}

/** Wise's own live quote: what the recipient gets for `amount`, or null if Wise has no quote. */
export async function wiseReceived(amount: number, direction: Direction, signal?: AbortSignal) {
  const [from, to] = direction.split('-')
  const data = await getJson<WiseComparison>(
    `${WISE}?sourceCurrency=${from}&targetCurrency=${to}&sendAmount=${amount}`,
    signal,
  )
  const quote = data.providers.find((p) => p.alias === 'wise')?.quotes[0]
  return quote ? { received: quote.receivedAmount, at: quote.dateCollected } : null
}
