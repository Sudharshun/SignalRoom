import { ChevronDown, ChevronUp } from 'lucide-react'
import { useIncidentStore } from '../store/incidentStore'
import { formatClock } from '../utils/time'

export function Timeline() {
  const timeline = useIncidentStore((s) => s.timeline)
  const collapsed = useIncidentStore((s) => s.ui.timelineCollapsed)
  const setTimelineCollapsed = useIncidentStore((s) => s.setTimelineCollapsed)
  const focusTimelineEvent = useIncidentStore((s) => s.focusTimelineEvent)

  const sorted = [...timeline].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  )

  return (
    <footer className="shrink-0 border-t border-border bg-panel">
      <button
        type="button"
        onClick={() => setTimelineCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-panel-elevated/40"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-dim">
            Timeline / Activity Stream
          </span>
          <span className="font-mono text-[11px] text-text-muted">
            {sorted.length} events
          </span>
        </div>
        {collapsed ? (
          <ChevronUp className="h-4 w-4 text-text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-muted" />
        )}
      </button>

      {!collapsed && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
          {sorted.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => focusTimelineEvent(ev.id)}
              className={`min-w-[140px] max-w-[180px] shrink-0 rounded-md border px-2.5 py-2 text-left transition ${
                ev.significant
                  ? 'border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/15'
                  : 'border-border-subtle bg-panel-elevated/40 hover:bg-panel-elevated'
              }`}
            >
              <div className="font-mono text-[11px] text-sky-300">
                {formatClock(ev.time)}
              </div>
              <div className="mt-0.5 line-clamp-2 text-xs text-text">{ev.label}</div>
            </button>
          ))}
        </div>
      )}
    </footer>
  )
}
