import type { IncidentState } from '../domain/incident'

/** Empty situation room — ready for a live Prod Call or Show Demo */
export function createBlankIncident(): IncidentState {
  const now = new Date().toISOString()
  return {
    meta: {
      id: 'inc-blank',
      number: 'PC-—',
      severity: 'SEV1',
      title: 'New Situation Room',
      startedAt: now,
      incidentCommander: 'Unassigned',
      strategy: 'UNKNOWN',
      nextUpdateAt: now,
      participantCount: 0,
      primaryRegion: '—',
      customerImpactSummary: 'No impact recorded yet',
      leadingHypothesisId: undefined,
    },
    nodes: {},
    relationships: [],
    participants: [],
    metrics: [
      {
        id: 'm-error',
        label: 'Checkout error rate',
        value: '—',
        status: 'normal',
        history: [],
        trend: 'flat',
      },
      {
        id: 'm-p95',
        label: 'P95 latency',
        value: '—',
        status: 'normal',
        history: [],
        trend: 'flat',
      },
      {
        id: 'm-traffic',
        label: 'Traffic',
        value: '—',
        status: 'normal',
        history: [],
        trend: 'flat',
      },
      {
        id: 'm-gateway',
        label: 'Payment gateway timeout',
        value: '—',
        status: 'normal',
        history: [],
        trend: 'flat',
      },
    ],
    recovery: {
      strategy: 'UNKNOWN',
      alternative: 'ROLLBACK',
      vendorStatus: 'NOT_ENGAGED',
      checklist: [
        { id: 'c1', label: 'Vendor engaged', done: false },
        { id: 'c2', label: 'Root cause candidate identified', done: false },
        { id: 'c3', label: 'Patch created', done: false },
        { id: 'c4', label: 'Patch tested', done: false },
        { id: 'c5', label: 'Patch deployed', done: false },
        { id: 'c6', label: 'Metrics validated', done: false },
        { id: 'c7', label: 'Incident resolved', done: false },
      ],
    },
    timeline: [],
    events: [],
    simulateTelemetry: false,
  }
}

export function isDemoIncident(state: Pick<IncidentState, 'meta'>): boolean {
  return state.meta.id === 'inc-prodcall-1842' || state.meta.number === 'PC-1842'
}
