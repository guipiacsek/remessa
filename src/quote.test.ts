import { describe, expect, it } from 'vitest'
import { quoteFromPricing, quoteFromReceived, rateFor } from './quote'
import type { Pricing } from './providers'

const base: Pricing = { fee: 0, markupPct: 0, note: { en: '', pt: '' }, source: '', checked: '' }

describe('rateFor', () => {
  it('inverts the USD→BRL rate for BRL→USD', () => {
    expect(rateFor('USD-BRL', 5)).toBe(5)
    expect(rateFor('BRL-USD', 5)).toBe(0.2)
  })
})

describe('quoteFromPricing', () => {
  it('costs nothing with no fee, margin or tax', () => {
    const q = quoteFromPricing(1000, 'USD-BRL', 5, base)
    expect(q).toEqual({ received: 5000, cost: 0, costPct: 0 })
  })

  it('takes the fee before converting and applies the margin to the rest', () => {
    // (1000 - 40) * 5 * 0.97 = 4656
    const q = quoteFromPricing(1000, 'USD-BRL', 5, { ...base, fee: 40, markupPct: 3 })
    expect(q.received).toBe(4656)
    expect(q.cost).toBe(344)
    expect(q.costPct).toBeCloseTo(6.88)
  })

  it('waives the fee once the amount reaches the USD threshold', () => {
    const p = { ...base, fee: 50, feeWaivedFromUsd: 500 }
    // BRL 2000 is USD 400 at 5.0: fee applies. BRL 2500 is USD 500: waived.
    expect(quoteFromPricing(2000, 'BRL-USD', 5, p).received).toBe(390)
    expect(quoteFromPricing(2500, 'BRL-USD', 5, p).received).toBe(500)
  })

  it('takes tax on the full amount sent', () => {
    // 1000 BRL, 3.5% IOF = 35, so 965 BRL converts at 0.2 = 193 USD
    const q = quoteFromPricing(1000, 'BRL-USD', 5, { ...base, taxPct: 3.5 })
    expect(q.received).toBe(193)
  })

  it('never goes negative when fees exceed the amount', () => {
    expect(quoteFromPricing(10, 'USD-BRL', 5, { ...base, fee: 40 }).received).toBe(0)
  })
})

describe('quoteFromReceived', () => {
  it('measures a live quote against the mid-market value', () => {
    const q = quoteFromReceived(1000, 4900, 5)
    expect(q.cost).toBe(100)
    expect(q.costPct).toBe(2)
  })
})
