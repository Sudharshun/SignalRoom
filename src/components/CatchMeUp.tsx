import { ArrowRight, X, Zap } from 'lucide-react'
import { useIncidentStore } from '../store/incidentStore'
import { isHypothesis } from '../domain/nodes'

export function CatchMeUp() {
  const open = useIncidentStore((s) => s.ui.catchMeUpOpen)
  const setCatchMeUpOpen = useIncidentStore((s) => s.setCatchMeUpOpen)
  const requestCenterOnNode = useIncidentStore((s) => s.requestCenterOnNode)
  const meta = useIncidentStore((s) => s.meta)
  const nodes = useIncidentStore((s) => s.nodes)
  const recovery = useIncidentStore((s) => s.recovery)
  const participants = useIncidentStore((s) => s.participants)

  if (!open) return null

  const leading = meta.leadingHypothesisId
    ? nodes[meta.leadingHypothesisId]
    : undefined
  const ruledOut = Object.values(nodes).filter(
    (n) => isHypothesis(n) && n.status === 'RULED_OUT',
  )
  const investigating = Object.values(nodes).filter(
    (n) => isHypothesis(n) && n.status === 'INVESTIGATING',
  )

  const goToInvestigation = () => {
    setCatchMeUpOpen(false)
    requestCenterOnNode('inv-serialization')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-panel shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-panel px-5 py-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-sky-300" />
            <h2 className="text-lg font-semibold tracking-tight">
              60 Second Catch-Up
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCatchMeUpOpen(false)}
            className="rounded-md p-1.5 text-text-muted hover:bg-panel-elevated hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4 text-sm">
          <Section title="What's broken">
            Checkout transactions failing ~31% in US-East.
          </Section>
          <Section title="Customer impact">
            ~18,000 checkout attempts affected.
          </Section>
          <Section title="What changed">
            Payments API 4.18 deployed at 10:37.
          </Section>
          <Section title="Leading theory">
            {leading && isHypothesis(leading)
              ? `${leading.title}. Confidence: ${leading.confidence}%`
              : 'Serialization regression introduced by Payments API 4.18. Confidence: 82%'}
          </Section>
          <Section title="Ruled out">
            {ruledOut.map((n) => n.title).join(', ') || 'Database capacity'}
          </Section>
          <Section title="Currently investigating">
            {investigating.map((n) => n.title).join(', ') ||
              'Payment gateway vendor contribution'}
          </Section>
          <Section title="What we're doing now">
            Patch being validated in staging. Vendor investigating gateway
            timeouts.
          </Section>
          <Section title="Current strategy">
            <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 font-mono text-xs font-semibold text-indigo-300 ring-1 ring-indigo-400/30">
              {recovery.strategy.replace('_', ' ')}
            </span>
          </Section>
          <Section title="Next decision">
            Validate staging patch and determine production deployment.
          </Section>
          <Section title="People">
            <div className="grid grid-cols-2 gap-1.5">
              {participants.map((p) => (
                <div key={p.id} className="text-text-muted">
                  <span className="text-text-dim">{p.role}:</span> {p.name}
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="sticky bottom-0 border-t border-border bg-panel px-5 py-3">
          <button
            type="button"
            onClick={goToInvestigation}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-sky-500/20 px-4 py-2.5 text-sm font-semibold text-sky-200 ring-1 ring-sky-400/40 hover:bg-sky-500/30"
          >
            Take me to current investigation
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-dim">
        {title}
      </h3>
      <div className="mt-1 text-text">{children}</div>
    </section>
  )
}
