import { X } from 'lucide-react'
import type { ActionStatus, HypothesisStatus } from '../domain/nodes'
import {
  isAction,
  isDecision,
  isEvidence,
  isHypothesis,
} from '../domain/nodes'
import { useIncidentStore } from '../store/incidentStore'
import { formatClock } from '../utils/time'
import { NODE_TYPE_STYLE } from '../graph/nodeStyles'

const HYP_STATUSES: HypothesisStatus[] = [
  'UNKNOWN',
  'INVESTIGATING',
  'SUPPORTED',
  'LIKELY',
  'CONFIRMED',
  'RULED_OUT',
]

const ACTION_STATUSES: ActionStatus[] = [
  'TODO',
  'IN_PROGRESS',
  'BLOCKED',
  'DONE',
]

const OWNERS = ['Maya', 'Alex', 'Priya', 'Sam', 'Jordan', 'Unassigned']

export function NodeInspector() {
  const open = useIncidentStore((s) => s.ui.inspectorOpen)
  const selectedId = useIncidentStore((s) => s.ui.selectedNodeId)
  const node = useIncidentStore((s) =>
    selectedId ? s.nodes[selectedId] : undefined,
  )
  const relationships = useIncidentStore((s) => s.relationships)
  const setInspectorOpen = useIncidentStore((s) => s.setInspectorOpen)
  const updateNode = useIncidentStore((s) => s.updateNode)
  const deleteNode = useIncidentStore((s) => s.deleteNode)
  const setHypothesisStatus = useIncidentStore((s) => s.setHypothesisStatus)
  const setHypothesisConfidence = useIncidentStore((s) => s.setHypothesisConfidence)
  const assignOwner = useIncidentStore((s) => s.assignOwner)
  const addEvidenceToHypothesis = useIncidentStore((s) => s.addEvidenceToHypothesis)
  const createLinkedAction = useIncidentStore((s) => s.createLinkedAction)
  const setActionStatus = useIncidentStore((s) => s.setActionStatus)

  if (!open || !node) return null

  const style = NODE_TYPE_STYLE[node.type]
  const supporting = relationships.filter(
    (r) => r.targetId === node.id && r.type === 'supports',
  ).length
  const contradicting = relationships.filter(
    (r) => r.targetId === node.id && r.type === 'contradicts',
  ).length

  return (
    <div className="absolute right-[18.5rem] top-3 z-20 w-80 max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-xl border border-border bg-panel shadow-2xl">
      <div className="sticky top-0 flex items-start justify-between border-b border-border bg-panel px-3 py-2.5">
        <div>
          <div
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: style.accent }}
          >
            {style.label}
          </div>
          <h3 className="mt-0.5 text-sm font-semibold leading-snug text-text">
            {node.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setInspectorOpen(false)}
          className="rounded p-1 text-text-muted hover:bg-panel-elevated hover:text-text"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 p-3 text-sm">
        <label className="block">
          <span className="text-[11px] text-text-dim">Title</span>
          <input
            className="mt-1 w-full rounded-md border border-border bg-canvas px-2 py-1.5 text-sm text-text outline-none focus:border-sky-500/50"
            value={node.title}
            onChange={(e) => updateNode(node.id, { title: e.target.value })}
          />
        </label>

        {isHypothesis(node) && (
          <>
            <label className="block">
              <span className="text-[11px] text-text-dim">Status</span>
              <select
                className="mt-1 w-full rounded-md border border-border bg-canvas px-2 py-1.5 text-sm"
                value={node.status}
                onChange={(e) =>
                  setHypothesisStatus(node.id, e.target.value as HypothesisStatus)
                }
              >
                {HYP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] text-text-dim">
                Confidence: {node.confidence}%
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={node.confidence}
                onChange={(e) =>
                  setHypothesisConfidence(node.id, Number(e.target.value))
                }
                className="mt-1 w-full"
              />
            </label>

            <div className="rounded-md border border-border-subtle bg-panel-elevated/40 px-2 py-1.5 text-xs text-text-muted">
              Evidence: {supporting} supporting · {contradicting} contradicting
            </div>

            <div className="flex flex-wrap gap-1.5">
              <ActionBtn
                onClick={() =>
                  addEvidenceToHypothesis(node.id, 'evidence', 'New supporting evidence')
                }
              >
                Add evidence
              </ActionBtn>
              <ActionBtn
                onClick={() =>
                  addEvidenceToHypothesis(
                    node.id,
                    'counter_evidence',
                    'New counter-evidence',
                  )
                }
              >
                Add counter evidence
              </ActionBtn>
              <ActionBtn
                onClick={() =>
                  createLinkedAction(node.id, `Follow-up: ${node.title.slice(0, 28)}`)
                }
              >
                Create linked action
              </ActionBtn>
              <ActionBtn onClick={() => setHypothesisStatus(node.id, 'RULED_OUT')} tone="muted">
                Mark ruled out
              </ActionBtn>
              <ActionBtn onClick={() => setHypothesisStatus(node.id, 'CONFIRMED')} tone="good">
                Mark confirmed
              </ActionBtn>
            </div>
          </>
        )}

        {isAction(node) && (
          <label className="block">
            <span className="text-[11px] text-text-dim">Status</span>
            <select
              className="mt-1 w-full rounded-md border border-border bg-canvas px-2 py-1.5 text-sm"
              value={node.status}
              onChange={(e) =>
                setActionStatus(node.id, e.target.value as ActionStatus)
              }
            >
              {ACTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>
        )}

        {isDecision(node) && (
          <div className="space-y-2 rounded-md border border-indigo-500/30 bg-indigo-500/10 p-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
              Auditable decision
            </div>
            {node.options.map((opt) => (
              <div
                key={opt.id}
                className={`rounded border px-2 py-1.5 text-xs ${
                  node.selectedOptionId === opt.id
                    ? 'border-indigo-400/50 bg-indigo-500/20'
                    : 'border-border-subtle'
                }`}
              >
                <div className="font-semibold">{opt.label}</div>
                <div className="text-text-muted">
                  ETA {opt.etaMinutes ?? '—'}m · Risk {opt.risk ?? '—'}
                </div>
                {opt.concern && <div className="text-amber-200/80">{opt.concern}</div>}
              </div>
            ))}
            {node.reason && (
              <p className="text-xs text-text-muted">{node.reason}</p>
            )}
          </div>
        )}

        <label className="block">
          <span className="text-[11px] text-text-dim">Owner</span>
          <select
            className="mt-1 w-full rounded-md border border-border bg-canvas px-2 py-1.5 text-sm"
            value={node.owner ?? 'Unassigned'}
            onChange={(e) => assignOwner(node.id, e.target.value)}
          >
            {OWNERS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>

        {node.description !== undefined && (
          <label className="block">
            <span className="text-[11px] text-text-dim">Description</span>
            <textarea
              className="mt-1 w-full rounded-md border border-border bg-canvas px-2 py-1.5 text-sm"
              rows={3}
              value={node.description ?? ''}
              onChange={(e) => updateNode(node.id, { description: e.target.value })}
            />
          </label>
        )}

        <div className="grid grid-cols-2 gap-2 text-[11px] text-text-dim">
          <div>
            Created
            <div className="font-mono text-text-muted">{formatClock(node.createdAt)}</div>
          </div>
          <div>
            Last updated
            <div className="font-mono text-text-muted">{formatClock(node.updatedAt)}</div>
          </div>
        </div>

        {isEvidence(node) && (
          <div className="text-xs text-text-muted">
            Source: {node.source ?? '—'} · Strength: {node.strength ?? '—'}
          </div>
        )}

        <button
          type="button"
          onClick={() => deleteNode(node.id)}
          className="w-full rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
        >
          Delete node
        </button>
      </div>
    </div>
  )
}

function ActionBtn({
  children,
  onClick,
  tone = 'default',
}: {
  children: React.ReactNode
  onClick: () => void
  tone?: 'default' | 'muted' | 'good'
}) {
  const cls =
    tone === 'muted'
      ? 'border-border text-text-muted hover:bg-panel-elevated'
      : tone === 'good'
        ? 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
        : 'border-sky-500/30 text-sky-300 hover:bg-sky-500/10'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2 py-1 text-[11px] font-medium ${cls}`}
    >
      {children}
    </button>
  )
}
