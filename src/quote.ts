import type { Direction, Pricing } from './providers'

export interface Quote {
  /** What the recipient gets, in the target currency. */
  received: number
  /** What the same amount is worth at the mid-market rate, minus what's received. */
  cost: number
  /** `cost` as a percent of the mid-market value. */
  costPct: number
}

/** Mid-market rate in the direction of travel, from a USD→BRL rate. */
export function rateFor(direction: Direction, usdBrl: number): number {
  return direction === 'USD-BRL' ? usdBrl : 1 / usdBrl
}

/** Compares any received amount against the mid-market value. */
export function quoteFromReceived(amount: number, received: number, midRate: number): Quote {
  const ideal = amount * midRate
  const cost = ideal - received
  return { received, cost, costPct: ideal > 0 ? (cost / ideal) * 100 : 0 }
}

/**
 * Prices a transfer from a fee schedule. Fee and tax come out of the amount sent,
 * then the rest converts at the mid-market rate less the provider's margin.
 */
export function quoteFromPricing(amount: number, direction: Direction, usdBrl: number, p: Pricing): Quote {
  const mid = rateFor(direction, usdBrl)
  const amountUsd = direction === 'USD-BRL' ? amount : amount / usdBrl
  const waived = p.feeWaivedFromUsd !== undefined && amountUsd >= p.feeWaivedFromUsd
  const fee = waived ? 0 : p.fee
  const tax = amount * ((p.taxPct ?? 0) / 100)
  const converted = Math.max(0, amount - fee - tax) * mid * (1 - p.markupPct / 100)
  return quoteFromReceived(amount, round2(converted), mid)
}

export const round2 = (n: number) => Math.round(n * 100) / 100
