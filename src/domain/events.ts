export type DomainEventType =
  | 'IncidentCreated'
  | 'AlertTriggered'
  | 'MetricChanged'
  | 'HypothesisCreated'
  | 'HypothesisStatusChanged'
  | 'EvidenceAdded'
  | 'EvidenceContradicted'
  | 'OwnerAssigned'
  | 'ActionCreated'
  | 'ActionCompleted'
  | 'VendorEngaged'
  | 'DecisionRequested'
  | 'DecisionMade'
  | 'MitigationStarted'
  | 'DeploymentStarted'
  | 'MetricRecovered'
  | 'IncidentResolved'
  | 'NodeCreated'
  | 'NodeUpdated'
  | 'NodeDeleted'
  | 'RelationshipCreated'
  | 'RelationshipDeleted'

export interface DomainEvent {
  id: string
  type: DomainEventType
  timestamp: string
  message: string
  nodeIds?: string[]
  payload?: Record<string, unknown>
  significant?: boolean
}

export function createEvent(
  type: DomainEventType,
  message: string,
  opts?: Partial<Omit<DomainEvent, 'id' | 'type' | 'message'>>,
): DomainEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    message,
    timestamp: opts?.timestamp ?? new Date().toISOString(),
    nodeIds: opts?.nodeIds,
    payload: opts?.payload,
    significant: opts?.significant ?? false,
  }
}
