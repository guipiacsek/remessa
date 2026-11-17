import { useEffect, useMemo, useState } from 'react'
import { usdBrlHistory, wiseReceived, type Point } from './api'
import { t, money, num, pct, type Lang } from './i18n'
import { providers, type Direction } from './providers'
import { quoteFromPricing, quoteFromReceived, rateFor, type Quote } from './quote'
import { RateChart } from './RateChart'
import './App.css'

interface Row {
  id: string
  name: string
  badge: 'live' | 'estimate' | 'custom'
  quote: Quote | null
  note?: string
  source?: string
  checked?: string
  retry?: boolean
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [direction, setDirection] = useState<Direction>('USD-BRL')
  const [amount, setAmount] = useState(1000)
  const [history, setHistory] = useState<Point[]>([])
  const [wise, setWise] = useState<number | null>(null)
  const [wiseStatus, setWiseStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [wiseTry, setWiseTry] = useState(0)
  const [custom, setCustom] = useState<Record<string, number>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [quoteError, setQuoteError] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const s = t[lang]
  const [from, to] = direction.split('-') as ['USD' | 'BRL', 'USD' | 'BRL']

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
  }, [lang])

  useEffect(() => {
    const ctl = new AbortController()
    setError(false)
    usdBrlHistory(90, ctl.signal)
      .then(setHistory)
      .catch((e) => e.name !== 'AbortError' && setError(true))
    return () => ctl.abort()
  }, [attempt])

  // Debounced so typing an amount doesn't fire a request per keystroke.
  useEffect(() => {
    setWise(null)
    setWiseStatus('loading')
    if (!(amount > 0)) return
    const ctl = new AbortController()
    const id = setTimeout(() => {
      wiseReceived(amount, direction, ctl.signal)
        .then((q) => {
          setWise(q?.received ?? null)
          setWiseStatus(q ? 'ok' : 'error')
        })
        .catch((e) => e.name !== 'AbortError' && setWiseStatus('error'))
    }, 400)
    return () => {
      clearTimeout(id)
      ctl.abort()
    }
  }, [amount, direction, attempt, wiseTry])

  // A quote for a different amount or direction no longer applies.
  useEffect(() => setCustom({}), [amount, direction])

  const usdBrl = history[history.length - 1]?.rate
  const mid = usdBrl ? rateFor(direction, usdBrl) : undefined

  const rows = useMemo<Row[]>(() => {
    if (!usdBrl || !mid || !(amount > 0)) return []
    const out: Row[] = providers.map((p) => {
      const mine = custom[p.id]
      if (mine !== undefined)
        return { id: p.id, name: p.name, badge: 'custom', quote: quoteFromReceived(amount, mine, mid) }
      if (p.kind === 'live')
        return {
          id: p.id,
          name: p.name,
          badge: 'live',
          quote: wise === null ? null : quoteFromReceived(amount, wise, mid),
          note: wiseStatus === 'loading' ? s.wiseLoading : wiseStatus === 'error' ? s.wiseError : undefined,
          retry: wiseStatus === 'error',
        }
      const pricing = p.pricing[direction]
      if (!pricing) return { id: p.id, name: p.name, badge: 'estimate', quote: null, note: s.notOffered }
      return {
        id: p.id,
        name: p.name,
        badge: 'estimate',
        quote: quoteFromPricing(amount, direction, usdBrl, pricing),
        note: pricing.note[lang],
        source: pricing.source,
        checked: pricing.checked,
      }
    })
    return out.sort((a, b) => (b.quote?.received ?? -1) - (a.quote?.received ?? -1))
  }, [usdBrl, mid, amount, direction, wise, wiseStatus, custom, lang, s])

  const bestId = rows.find((r) => r.quote)?.id

  return (
    <main>
      <header>
        <div>
          <h1>{s.title}</h1>
          <p className="muted">{s.tagline}</p>
        </div>
        <div className="segmented lang" role="group" aria-label={s.language}>
          {(['en', 'pt'] as Lang[]).map((l) => (
            <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <section className="form">
        <label className="field">
          <span className="muted">{s.send}</span>
          <span className="amount">
            <span>{from}</span>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              value={Number.isNaN(amount) ? '' : amount}
              onChange={(e) => setAmount(e.target.valueAsNumber)}
            />
          </span>
        </label>
        <fieldset className="field">
          <legend className="muted">{s.direction}</legend>
          <div className="segmented">
            {(['USD-BRL', 'BRL-USD'] as Direction[]).map((d) => (
              <button key={d} aria-pressed={direction === d} onClick={() => setDirection(d)}>
                {d === 'USD-BRL' ? s.usdBrl : s.brlUsd}
              </button>
            ))}
          </div>
        </fieldset>
        {mid && (
          <div className="field mid">
            <span className="muted">{s.midRate}</span>
            <strong>
              1 {from} = {num(mid, 4, lang)} {to}
            </strong>
            <span className="muted small">{s.midNote}</span>
          </div>
        )}
      </section>

      {error && (
        <p className="error" role="alert">
          {s.error} <button onClick={() => setAttempt((n) => n + 1)}>{s.retry}</button>
        </p>
      )}
      {!error && !mid && <p className="muted">{s.loading}</p>}

      {rows.length > 0 && (
        <table className="compare">
          <thead>
            <tr>
              <th>{s.provider}</th>
              <th className="num">{s.receives}</th>
              <th className="num">
                {s.cost} <span className="muted small">{s.vsMid}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="name">
                    <strong>{r.name}</strong>
                    <span className={`badge ${r.badge}`}>{s[r.badge]}</span>
                    {r.id === bestId && <span className="badge best">{s.best}</span>}
                  </div>
                  {r.note && <p className="note">{r.note}</p>}
                  {r.retry && (
                    <button className="link row-retry" onClick={() => setWiseTry((n) => n + 1)}>
                      {s.retry}
                    </button>
                  )}
                  {r.source && (
                    <p className="note">
                      <a href={r.source} target="_blank" rel="noreferrer">
                        {s.source}
                      </a>{' '}
                      · {s.checked} {r.checked}
                    </p>
                  )}
                  {editing === r.id ? (
                    <form
                      className="quote-form"
                      onSubmit={(e) => {
                        e.preventDefault()
                        const input = e.currentTarget.elements.namedItem('received') as HTMLInputElement
                        const n = Number(input.value)
                        if (!(n > 0)) {
                          setQuoteError(true)
                          input.focus()
                          return
                        }
                        setCustom((c) => ({ ...c, [r.id]: n }))
                        setEditing(null)
                      }}
                    >
                      <div className="quote-form-row">
                        <label>
                          <span className="muted small">
                            {s.quotePrompt} ({to})
                          </span>
                          <input
                            name="received"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            autoFocus
                            aria-invalid={quoteError}
                            aria-describedby={quoteError ? `quote-error-${r.id}` : undefined}
                          />
                        </label>
                        <button type="submit">{s.compareQuote}</button>
                      </div>
                      {quoteError && (
                        <p className="field-error" id={`quote-error-${r.id}`}>
                          {s.quoteInvalid}
                        </p>
                      )}
                    </form>
                  ) : r.badge === 'custom' ? (
                    <button
                      className="link"
                      onClick={() =>
                        setCustom((c) => {
                          const next = { ...c }
                          delete next[r.id]
                          return next
                        })
                      }
                    >
                      {s.removeQuote}
                    </button>
                  ) : (
                    r.quote !== null && (
                      <button
                        className="link"
                        onClick={() => {
                          setQuoteError(false)
                          setEditing(r.id)
                        }}
                      >
                        {s.enterQuote}
                      </button>
                    )
                  )}
                </td>
                <td className="num" data-label={s.receives}>
                  {r.quote ? <strong>{money(r.quote.received, to, lang)}</strong> : '—'}
                </td>
                <td className="num" data-label={s.cost}>
                  {r.quote ? (
                    <>
                      {money(r.quote.cost, to, lang)}
                      <span className="muted small"> ({pct(r.quote.costPct, lang)})</span>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <RateChart points={history} lang={lang} />

      <footer className="muted small">
        <p>{s.disclaimer}</p>
        <p>
          {s.data}: <a href="https://frankfurter.dev">Frankfurter</a> (ECB) ·{' '}
          <a href="https://wise.com/us/compare/">Wise comparison API</a> ·{' '}
          <a href="https://github.com/guipiacsek/remessa">GitHub</a>
        </p>
      </footer>
    </main>
  )
}
