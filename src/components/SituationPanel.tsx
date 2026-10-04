import { Check, Circle } from 'lucide-react'
import { useIncidentStore } from '../store/incidentStore'
import { formatClock } from '../utils/time'
import { MetricCard } from './MetricCard'
import { isHypothesis } from '../domain/nodes'

export function SituationPanel() {
  const meta = useIncidentStore((s) => s.meta)
  const metrics = useIncidentStore((s) => s.metrics)
  const recovery = useIncidentStore((s) => s.recovery)
  const nodes = useIncidentStore((s) => s.nodes)

  const impact = nodes['impact-checkout']
  const leading = meta.leadingHypothesisId
    ? nodes[meta.leadingHypothesisId]
    : undefined
  const deployment = nodes['deployment-4.18']

  const failureRate =
    impact && impact.type === 'customer_impact' ? impact.failureRate : 31
  const region =
    impact && impact.type === 'customer_impact' ? impact.region : meta.primaryRegion
  const attempts =
    impact && impact.type === 'customer_impact' ? impact.attemptsImpacted : 18000

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-panel">
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-dim">
            Current Situation
          </h2>
          <div className="mt-2 space-y-2 rounded-lg border border-border-subtle bg-panel-elevated/50 p-3 text-sm">
            <Row
              label="Checkout error rate"
              value={`${failureRate}%`}
              emphasize
            />
            <Row label="Primary region" value={region ?? '—'} />
            <Row
              label="Customer impact"
              value={`~${(attempts ?? 0).toLocaleString()} attempts`}
            />
            <Row label="Started" value={formatClock(meta.startedAt)} />
            <Row
              label="Last major change"
              value={
                deployment && deployment.type === 'deployment'
                  ? `Payments API ${deployment.version} at ${formatClock(deployment.deployedAt)}`
                  : '—'
              }
            />
            <Row
              label="Leading hypothesis"
              value={
                leading && isHypothesis(leading)
                  ? leading.title.length > 42
                    ? `${leading.title.slice(0, 42)}…`
                    : leading.title
                  : '—'
              }
            />
            <Row
              label="Confidence"
              value={
                leading && isHypothesis(leading) ? `${leading.confidence}%` : '—'
              }
              emphasize
            />
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-dim">
            Live Signals
          </h2>
          <div className="mt-2 space-y-2">
            {metrics.map((m) => (
              <MetricCard key={m.id} metric={m} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-dim">
            Recovery
          </h2>
          <div className="mt-2 space-y-2 rounded-lg border border-border-subtle bg-panel-elevated/50 p-3 text-sm">
            <Row
              label="Current strategy"
              value={recovery.strategy.replace('_', ' ')}
            />
            <Row
              label="Alternative"
              value={recovery.alternative.replace('_', ' ')}
            />
            <Row label="Vendor" value={recovery.vendorStatus} />
            <ul className="mt-2 space-y-1.5 border-t border-border-subtle pt-2">
              {recovery.checklist.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2 text-xs text-text-muted"
                >
                  {item.done ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-dim" />
                  )}
                  <span className={item.done ? 'text-text' : ''}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </aside>
  )
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-text-dim">{label}</span>
      <span
        className={`text-sm ${emphasize ? 'font-semibold text-sky-300' : 'text-text'}`}
      >
        {value}
      </span>
    </div>
  )
}
