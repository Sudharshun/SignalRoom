import type { DomainEvent } from './events'
import type { IncidentNode, RecoveryStrategy } from './nodes'
import type { Relationship } from './relationships'

export interface Participant {
  id: string
  name: string
  role: string
  initials: string
  color: string
  online: boolean
  investigatingNodeId?: string
}

export interface MetricPoint {
  t: number
  v: number
}

export interface Metric {
  id: string
  label: string
  value: string | number
  unit?: string
  status: 'normal' | 'warning' | 'critical'
  history: MetricPoint[]
  trend?: 'up' | 'down' | 'flat'
}

export interface RecoveryChecklistItem {
  id: string
  label: string
  done: boolean
}

export interface RecoveryState {
  strategy: RecoveryStrategy
  alternative: RecoveryStrategy
  vendorStatus: 'ENGAGED' | 'NOT_ENGAGED' | 'WAITING'
  checklist: RecoveryChecklistItem[]
}

export interface TimelineEvent {
  id: string
  time: string
  label: string
  significant?: boolean
  nodeIds?: string[]
  eventType?: string
}

export interface IncidentMeta {
  id: string
  number: string
  severity: 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4'
  title: string
  startedAt: string
  incidentCommander: string
  strategy: RecoveryStrategy
  nextUpdateAt: string
  participantCount: number
  primaryRegion: string
  customerImpactSummary: string
  leadingHypothesisId?: string
}

export interface IncidentState {
  meta: IncidentMeta
  nodes: Record<string, IncidentNode>
  relationships: Relationship[]
  participants: Participant[]
  metrics: Metric[]
  recovery: RecoveryState
  timeline: TimelineEvent[]
  events: DomainEvent[]
  simulateTelemetry: boolean
}

export type ZoomBand = 'far' | 'medium' | 'close'
