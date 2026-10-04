import {
  AlertTriangle,
  Beaker,
  Building2,
  Clock,
  Eye,
  FileWarning,
  GitBranch,
  HelpCircle,
  LineChart,
  Link2,
  Rocket,
  Search,
  Server,
  ShieldAlert,
  SquareCheckBig,
  Users,
} from 'lucide-react'
import type { NodeType } from '../domain/nodes'
import { PALETTE_TYPES } from '../services/incidentService'
import { NODE_TYPE_STYLE } from '../graph/nodeStyles'

const ICONS: Record<NodeType, typeof Eye> = {
  observation: Eye,
  hypothesis: HelpCircle,
  evidence: SquareCheckBig,
  counter_evidence: FileWarning,
  datadog_signal: LineChart,
  service: Server,
  deployment: Rocket,
  customer_impact: Users,
  investigation: Search,
  action: Link2,
  decision: GitBranch,
  vendor: Building2,
  experiment: Beaker,
  timeline_event: Clock,
  incident: AlertTriangle,
}

export function NodePalette() {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-panel">
      <div className="border-b border-border-subtle px-3 py-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-dim">
          Node Palette
        </div>
        <p className="mt-0.5 text-[11px] text-text-muted">Drag onto canvas</p>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {PALETTE_TYPES.map((item) => {
          const Icon = ICONS[item.type] ?? ShieldAlert
          const accent = NODE_TYPE_STYLE[item.type].accent
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/x-signalroom-node', item.type)
                e.dataTransfer.effectAllowed = 'copy'
              }}
              className="group flex cursor-grab items-start gap-2 rounded-md border border-transparent bg-panel-elevated/40 px-2 py-1.5 hover:border-border hover:bg-panel-elevated active:cursor-grabbing"
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-text">{item.label}</div>
                <div className="truncate text-[10px] text-text-dim">{item.hint}</div>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
