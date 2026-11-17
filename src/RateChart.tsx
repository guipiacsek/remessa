import { useState } from 'react'
import type { Point } from './api'
import { t, type Lang } from './i18n'

const W = 640
const H = 220
const PAD = { top: 12, right: 16, bottom: 28, left: 48 }

/** Single-series line chart with a snapping crosshair; the title names the series, so no legend. */
export function RateChart({ points, lang }: { points: Point[]; lang: Lang }) {
  const [hover, setHover] = useState<number | null>(null)
  if (points.length < 2) return null
  const s = t[lang]
  const rates = points.map((p) => p.rate)
  const min = Math.min(...rates)
  const max = Math.max(...rates)
  const span = max - min || 1
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * (W - PAD.left - PAD.right)
  const y = (r: number) => PAD.top + (1 - (r - min) / span) * (H - PAD.top - PAD.bottom)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.rate).toFixed(1)}`).join('')
  const ticks = [min, min + span / 2, max]
  const fmtDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', { month: 'short', day: 'numeric' })

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * W
    const i = Math.round(((px - PAD.left) / (W - PAD.left - PAD.right)) * (points.length - 1))
    setHover(Math.max(0, Math.min(points.length - 1, i)))
  }

  const h = hover === null ? null : points[hover]
  const last = points[points.length - 1]

  return (
    <figure className="chart">
      <figcaption>
        <strong>{s.history}</strong>
        <span className="muted">{s.historyHint}</span>
      </figcaption>
      <div className="chart-plot">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={s.history}>
          {ticks.map((r) => (
            <g key={r}>
              <line className="grid" x1={PAD.left} x2={W - PAD.right} y1={y(r)} y2={y(r)} />
              <text className="axis" x={PAD.left - 6} y={y(r) + 4} textAnchor="end">
                {r.toFixed(2)}
              </text>
            </g>
          ))}
          <text className="axis" x={PAD.left} y={H - 8}>
            {fmtDate(points[0].date)}
          </text>
          <text className="axis" x={W - PAD.right} y={H - 8} textAnchor="end">
            {fmtDate(last.date)}
          </text>
          <path className="line" d={path} />
          <circle className="dot" cx={x(points.length - 1)} cy={y(last.rate)} r={4} />
          {h && hover !== null && (
            <g>
              <line className="crosshair" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} />
              <circle className="dot" cx={x(hover)} cy={y(h.rate)} r={4} />
            </g>
          )}
          <rect
            x={PAD.left}
            y={0}
            width={W - PAD.left - PAD.right}
            height={H}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
        {h && hover !== null && (
          <div className="tooltip" style={{ left: `${(x(hover) / W) * 100}%` }}>
            <strong>{h.rate.toFixed(4)}</strong>
            <span>{fmtDate(h.date)}</span>
          </div>
        )}
      </div>
      <details>
        <summary>{s.showTable}</summary>
        <table>
          <thead>
            <tr>
              <th>{s.date}</th>
              <th>{s.rate}</th>
            </tr>
          </thead>
          <tbody>
            {[...points].reverse().map((p) => (
              <tr key={p.date}>
                <td>{p.date}</td>
                <td>{p.rate.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
