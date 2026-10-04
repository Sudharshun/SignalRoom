import type { Metric } from '../domain/incident'

function Sparkline({ points, color }: { points: { v: number }[]; color: string }) {
  if (points.length < 2) return null
  const vals = points.map((p) => p.v)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = Math.max(0.001, max - min)
  const w = 72
  const h = 28
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - ((p.v - min) / span) * (h - 4) - 2
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={w} height={h} className="opacity-90">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

const statusColor = {
  normal: '#22c55e',
  warning: '#eab308',
  critical: '#e11d48',
} as const

export function MetricCard({ metric }: { metric: Metric }) {
  const color = statusColor[metric.status]
  const display =
    typeof metric.value === 'number'
      ? `${metric.value}${metric.unit ?? ''}`
      : metric.value

  return (
    <div className="rounded-lg border border-border-subtle bg-panel-elevated/60 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-text-dim">
            {metric.label}
          </div>
          <div className="mt-0.5 font-mono text-lg font-semibold" style={{ color }}>
            {display}
          </div>
        </div>
        <Sparkline points={metric.history} color={color} />
      </div>
    </div>
  )
}
