export type NodeType =
  | 'incident'
  | 'observation'
  | 'hypothesis'
  | 'evidence'
  | 'counter_evidence'
  | 'datadog_signal'
  | 'service'
  | 'deployment'
  | 'customer_impact'
  | 'investigation'
  | 'action'
  | 'decision'
  | 'vendor'
  | 'experiment'
  | 'timeline_event'

export type HypothesisStatus =
  | 'UNKNOWN'
  | 'INVESTIGATING'
  | 'SUPPORTED'
  | 'LIKELY'
  | 'CONFIRMED'
  | 'RULED_OUT'

export type ActionStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE'

export type ActionPriority = 'P0' | 'P1' | 'P2' | 'P3'

export type RecoveryStrategy = 'FIX_FORWARD' | 'ROLLBACK' | 'VENDOR' | 'UNKNOWN'

export type VendorStatus = 'NOT_ENGAGED' | 'ENGAGED' | 'WAITING' | 'RESOLVED'

export interface Position {
  x: number
  y: number
}

export interface BaseNode {
  id: string
  type: NodeType
  title: string
  description?: string
  position: Position
  owner?: string
  createdAt: string
  updatedAt: string
  tags?: string[]
  /** Soft presence / activity hint for collaboration mock */
  activityHint?: string
}

export interface IncidentCoreNode extends BaseNode {
  type: 'incident'
  severity: 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4'
  status: 'ACTIVE' | 'MITIGATING' | 'RESOLVED'
}

export interface HypothesisNode extends BaseNode {
  type: 'hypothesis'
  status: HypothesisStatus
  confidence: number
  category?: 'APPLICATION' | 'PLATFORM' | 'EXTERNAL' | 'OTHER'
}

export interface EvidenceNode extends BaseNode {
  type: 'evidence' | 'counter_evidence'
  source?: string
  strength?: 'weak' | 'moderate' | 'strong'
}

export interface ActionNode extends BaseNode {
  type: 'action'
  status: ActionStatus
  priority: ActionPriority
  startedAt?: string
  dependsOn?: string[]
}

export interface DecisionOption {
  id: string
  label: string
  etaMinutes?: number
  risk?: 'Low' | 'Medium' | 'High'
  concern?: string
  notes?: string
}

export interface DecisionNode extends BaseNode {
  type: 'decision'
  options: DecisionOption[]
  selectedOptionId?: string
  decisionMaker?: string
  decidedAt?: string
  reason?: string
}

export interface DeploymentNode extends BaseNode {
  type: 'deployment'
  version: string
  service: string
  deployedAt: string
}

export interface VendorNode extends BaseNode {
  type: 'vendor'
  caseId?: string
  status: VendorStatus
}

export interface CustomerImpactNode extends BaseNode {
  type: 'customer_impact'
  failureRate?: number
  region?: string
  attemptsImpacted?: number
}

export interface ServiceNode extends BaseNode {
  type: 'service'
  health?: 'healthy' | 'degraded' | 'critical'
}

export interface DatadogSignalNode extends BaseNode {
  type: 'datadog_signal'
  metric?: string
  value?: string
}

export interface ObservationNode extends BaseNode {
  type: 'observation'
}

export interface InvestigationNode extends BaseNode {
  type: 'investigation'
  status?: 'ACTIVE' | 'PAUSED' | 'DONE'
}

export interface ExperimentNode extends BaseNode {
  type: 'experiment'
  result?: 'pending' | 'pass' | 'fail'
}

export interface TimelineEventNode extends BaseNode {
  type: 'timeline_event'
  eventTime: string
  significant?: boolean
}

export type IncidentNode =
  | IncidentCoreNode
  | HypothesisNode
  | EvidenceNode
  | ActionNode
  | DecisionNode
  | DeploymentNode
  | VendorNode
  | CustomerImpactNode
  | ServiceNode
  | DatadogSignalNode
  | ObservationNode
  | InvestigationNode
  | ExperimentNode
  | TimelineEventNode

export function isHypothesis(node: IncidentNode): node is HypothesisNode {
  return node.type === 'hypothesis'
}

export function isAction(node: IncidentNode): node is ActionNode {
  return node.type === 'action'
}

export function isDecision(node: IncidentNode): node is DecisionNode {
  return node.type === 'decision'
}

export function isEvidence(node: IncidentNode): node is EvidenceNode {
  return node.type === 'evidence' || node.type === 'counter_evidence'
}
