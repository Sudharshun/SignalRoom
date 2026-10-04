import type { HypothesisStatus, IncidentNode, NodeType, ActionStatus } from '../domain/nodes'
import type { Relationship, RelationshipType } from '../domain/relationships'
import { createEvent, type DomainEvent } from '../domain/events'

let idCounter = 0

export function newId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function createNodeFromType(
  type: NodeType,
  position: { x: number; y: number },
  title?: string,
): IncidentNode {
  const base = {
    id: newId(type),
    title: title ?? defaultTitle(type),
    position,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  switch (type) {
    case 'hypothesis':
      return {
        ...base,
        type,
        status: 'UNKNOWN',
        confidence: 50,
        category: 'OTHER',
      }
    case 'action':
      return {
        ...base,
        type,
        status: 'TODO',
        priority: 'P1',
      }
    case 'decision':
      return {
        ...base,
        type,
        options: [
          { id: 'opt-a', label: 'Option A', risk: 'Medium' },
          { id: 'opt-b', label: 'Option B', risk: 'Medium' },
        ],
      }
    case 'deployment':
      return {
        ...base,
        type,
        version: 'x.y',
        service: 'service',
        deployedAt: nowIso(),
      }
    case 'vendor':
      return { ...base, type, status: 'NOT_ENGAGED' }
    case 'customer_impact':
      return { ...base, type, failureRate: 0, region: 'Unknown', attemptsImpacted: 0 }
    case 'service':
      return { ...base, type, health: 'degraded' }
    case 'datadog_signal':
      return { ...base, type, metric: 'metric.name', value: '—' }
    case 'evidence':
    case 'counter_evidence':
      return { ...base, type, strength: 'moderate' }
    case 'investigation':
      return { ...base, type, status: 'ACTIVE' }
    case 'experiment':
      return { ...base, type, result: 'pending' }
    case 'timeline_event':
      return { ...base, type, eventTime: nowIso(), significant: false }
    case 'incident':
      return { ...base, type, severity: 'SEV1', status: 'ACTIVE' }
    case 'observation':
    default:
      return { ...base, type: 'observation' }
  }
}

function defaultTitle(type: NodeType): string {
  const map: Record<NodeType, string> = {
    incident: 'New incident',
    observation: 'New observation',
    hypothesis: 'New hypothesis',
    evidence: 'New evidence',
    counter_evidence: 'New counter-evidence',
    datadog_signal: 'Datadog signal',
    service: 'Service',
    deployment: 'Deployment',
    customer_impact: 'Customer impact',
    investigation: 'Investigation',
    action: 'New action',
    decision: 'New decision',
    vendor: 'Vendor',
    experiment: 'Experiment',
    timeline_event: 'Timeline event',
  }
  return map[type]
}

export function createRelationship(
  sourceId: string,
  targetId: string,
  type: RelationshipType,
  label?: string,
): Relationship {
  return {
    id: newId('rel'),
    sourceId,
    targetId,
    type,
    label: label ?? type,
  }
}

export function eventForHypothesisStatus(
  nodeId: string,
  status: HypothesisStatus,
  title: string,
): DomainEvent {
  return createEvent('HypothesisStatusChanged', `${title} → ${status}`, {
    nodeIds: [nodeId],
    significant: status === 'RULED_OUT' || status === 'CONFIRMED' || status === 'LIKELY',
    payload: { status },
  })
}

export function eventForActionStatus(
  nodeId: string,
  status: ActionStatus,
  title: string,
): DomainEvent {
  const type = status === 'DONE' ? 'ActionCompleted' : 'ActionCreated'
  return createEvent(type, `${title} → ${status}`, {
    nodeIds: [nodeId],
    significant: status === 'DONE' || status === 'BLOCKED',
    payload: { status },
  })
}

export const PALETTE_TYPES: {
  type: NodeType
  label: string
  hint: string
}[] = [
  { type: 'observation', label: 'Observation', hint: 'What we see' },
  { type: 'hypothesis', label: 'Hypothesis', hint: 'Candidate cause' },
  { type: 'evidence', label: 'Evidence', hint: 'Supports a theory' },
  { type: 'counter_evidence', label: 'Counter Evidence', hint: 'Contradicts a theory' },
  { type: 'datadog_signal', label: 'Datadog Signal', hint: 'Telemetry signal' },
  { type: 'service', label: 'Service', hint: 'System component' },
  { type: 'deployment', label: 'Deployment', hint: 'Change event' },
  { type: 'customer_impact', label: 'Customer Impact', hint: 'Business harm' },
  { type: 'investigation', label: 'Investigation', hint: 'Active workstream' },
  { type: 'action', label: 'Action', hint: 'Owned task' },
  { type: 'decision', label: 'Decision', hint: 'Auditable choice' },
  { type: 'vendor', label: 'Vendor', hint: 'External party' },
  { type: 'experiment', label: 'Experiment', hint: 'Diagnostic test' },
  { type: 'timeline_event', label: 'Timeline Event', hint: 'Notable moment' },
]
