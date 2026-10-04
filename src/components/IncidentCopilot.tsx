import { Brain, X } from 'lucide-react'
import { COPILOT_ACTIONS } from '../services/mockCopilot'
import { useIncidentStore } from '../store/incidentStore'

export function IncidentCopilot() {
  const open = useIncidentStore((s) => s.ui.copilotOpen)
  const response = useIncidentStore((s) => s.ui.copilotResponse)
  const pendingSuggestionId = useIncidentStore((s) => s.ui.pendingSuggestionId)
  const setCopilotOpen = useIncidentStore((s) => s.setCopilotOpen)
  const runCopilot = useIncidentStore((s) => s.runCopilot)
  const acceptSuggestion = useIncidentStore((s) => s.acceptSuggestion)
  const dismissSuggestion = useIncidentStore((s) => s.dismissSuggestion)
  const requestCenterOnNode = useIncidentStore((s) => s.requestCenterOnNode)
  const selectNode = useIncidentStore((s) => s.selectNode)

  if (!open) return null

  const suggestion =
    response?.suggestion && pendingSuggestionId === response.suggestion.id
      ? response.suggestion
      : null

  return (
    <div className="absolute bottom-3 left-56 z-20 flex w-96 max-h-[70vh] flex-col overflow-hidden rounded-xl border border-border bg-panel shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-sky-300" />
          <h3 className="text-sm font-semibold">Incident Copilot</h3>
        </div>
        <button
          type="button"
          onClick={() => setCopilotOpen(false)}
          className="rounded p-1 text-text-muted hover:bg-panel-elevated"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-border-subtle p-2">
        <div className="flex flex-wrap gap-1">
          {COPILOT_ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => runCopilot(a.id)}
              className={`rounded border px-2 py-1 text-[11px] ${
                a.id === 'challenge'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                  : 'border-border-subtle bg-panel-elevated/50 text-text-muted hover:text-text'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-text-dim">
          Copilot proposes changes. Humans approve them. Nothing is applied silently.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
        {!response && (
          <p className="text-text-muted">
            Choose a suggested action to generate a mocked incident analysis.
          </p>
        )}

        {response && (
          <>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-sky-300">
              {response.heading}
            </h4>
            {response.sections.map((sec) => (
              <section key={sec.title}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-text-dim">
                  {sec.title}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-text-muted">{sec.content}</p>
              </section>
            ))}
          </>
        )}

        {suggestion && (
          <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">
              AI Suggestion
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-text">{suggestion.body}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={acceptSuggestion}
                className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={dismissSuggestion}
                className="rounded-md bg-panel-elevated px-2.5 py-1 text-xs font-medium text-text-muted ring-1 ring-border"
              >
                Dismiss
              </button>
              {suggestion.inspectNodeIds?.[0] && (
                <button
                  type="button"
                  onClick={() => {
                    const id = suggestion.inspectNodeIds![0]
                    selectNode(id)
                    requestCenterOnNode(id)
                  }}
                  className="rounded-md bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-200 ring-1 ring-sky-400/30"
                >
                  Inspect Evidence
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
