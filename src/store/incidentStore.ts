import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { IncidentState, ZoomBand } from '../domain/incident'
import type {
  ActionStatus,
  HypothesisStatus,
  IncidentNode,
  NodeType,
} from '../domain/nodes'
import type { RelationshipType } from '../domain/relationships'
import { createBlankIncident, isDemoIncident } from '../data/blankIncident'
import { createDemoIncident } from '../data/demoIncident'
import {
  createNodeFromType,
  createRelationship,
  eventForActionStatus,
  eventForHypothesisStatus,
  newId,
  nowIso,
} from '../services/incidentService'
import { createEvent } from '../domain/events'
import {
  applyMetricUpdate,
  nextTelemetryStep,
} from '../services/mockTelemetry'
import type { CopilotActionId, CopilotResponse } from '../services/mockCopilot'
import { runCopilotAction } from '../services/mockCopilot'

export interface UiState {
  selectedNodeId: string | null
  inspectorOpen: boolean
  catchMeUpOpen: boolean
  copilotOpen: boolean
  timelineCollapsed: boolean
  diagnosisMode: boolean
  focusNodeIds: string[]
  zoomBand: ZoomBand
  canvasScale: number
  centerRequest: { nodeId: string; nonce: number } | null
  layoutRequest: { mode: 'diagnosis' | 'recovery'; nonce: number } | null
  copilotResponse: CopilotResponse | null
  pendingSuggestionId: string | null
  telemetryStep: number
}

interface IncidentStore extends IncidentState {
  ui: UiState
  selectNode: (id: string | null) => void
  setInspectorOpen: (open: boolean) => void
  setCatchMeUpOpen: (open: boolean) => void
  setCopilotOpen: (open: boolean) => void
  setTimelineCollapsed: (collapsed: boolean) => void
  setDiagnosisMode: (on: boolean) => void
  setZoomBand: (band: ZoomBand, scale: number) => void
  requestCenterOnNode: (nodeId: string) => void
  requestLayout: (mode: 'diagnosis' | 'recovery') => void
  updateNodePosition: (id: string, x: number, y: number) => void
  updateNode: (id: string, patch: Partial<IncidentNode>) => void
  deleteNode: (id: string) => void
  addNode: (type: NodeType, position: { x: number; y: number }, title?: string) => string
  addRelationship: (
    sourceId: string,
    targetId: string,
    type: RelationshipType,
    label?: string,
  ) => void
  removeRelationship: (id: string) => void
  setHypothesisStatus: (id: string, status: HypothesisStatus) => void
  setHypothesisConfidence: (id: string, confidence: number) => void
  assignOwner: (id: string, owner: string) => void
  addEvidenceToHypothesis: (
    hypothesisId: string,
    kind: 'evidence' | 'counter_evidence',
    title: string,
  ) => void
  createLinkedAction: (hypothesisId: string, title: string) => void
  setActionStatus: (id: string, status: ActionStatus) => void
  focusTimelineEvent: (eventId: string) => void
  toggleSimulateTelemetry: () => void
  tickTelemetry: () => void
  runCopilot: (actionId: CopilotActionId) => void
  acceptSuggestion: () => void
  dismissSuggestion: () => void
  /** Load / restore the seeded PC-1842 Prod Call demo incident */
  showDemo: () => void
  clearBoard: () => void
  isDemoActive: () => boolean
}

const initialUi = (): UiState => ({
  selectedNodeId: null,
  inspectorOpen: false,
  catchMeUpOpen: false,
  copilotOpen: false,
  timelineCollapsed: false,
  diagnosisMode: false,
  focusNodeIds: [],
  zoomBand: 'medium',
  canvasScale: 0.85,
  centerRequest: null,
  layoutRequest: null,
  copilotResponse: null,
  pendingSuggestionId: null,
  telemetryStep: 0,
})

function withDemo(): IncidentState & { ui: UiState } {
  return { ...createDemoIncident(), ui: initialUi() }
}

function withBlank(): IncidentState & { ui: UiState } {
  return { ...createBlankIncident(), ui: initialUi() }
}

export const useIncidentStore = create<IncidentStore>()(
  persist(
    (set, get) => ({
      ...withBlank(),

      selectNode: (id) =>
        set((s) => ({
          ui: {
            ...s.ui,
            selectedNodeId: id,
            inspectorOpen: id != null,
          },
        })),

      setInspectorOpen: (open) =>
        set((s) => ({
          ui: {
            ...s.ui,
            inspectorOpen: open,
            selectedNodeId: open ? s.ui.selectedNodeId : s.ui.selectedNodeId,
          },
        })),

      setCatchMeUpOpen: (open) =>
        set((s) => ({ ui: { ...s.ui, catchMeUpOpen: open } })),

      setCopilotOpen: (open) =>
        set((s) => ({ ui: { ...s.ui, copilotOpen: open } })),

      setTimelineCollapsed: (collapsed) =>
        set((s) => ({ ui: { ...s.ui, timelineCollapsed: collapsed } })),

      setDiagnosisMode: (on) =>
        set((s) => ({
          ui: {
            ...s.ui,
            diagnosisMode: on,
            layoutRequest: on
              ? { mode: 'diagnosis', nonce: Date.now() }
              : s.ui.layoutRequest,
          },
        })),

      setZoomBand: (band, scale) =>
        set((s) => ({ ui: { ...s.ui, zoomBand: band, canvasScale: scale } })),

      requestCenterOnNode: (nodeId) =>
        set((s) => ({
          ui: {
            ...s.ui,
            centerRequest: { nodeId, nonce: Date.now() },
            focusNodeIds: [nodeId],
            selectedNodeId: nodeId,
            inspectorOpen: true,
          },
        })),

      requestLayout: (mode) =>
        set((s) => ({
          ui: {
            ...s.ui,
            layoutRequest: { mode, nonce: Date.now() },
            diagnosisMode: mode === 'diagnosis',
          },
        })),

      updateNodePosition: (id, x, y) =>
        set((s) => {
          const node = s.nodes[id]
          if (!node) return s
          return {
            nodes: {
              ...s.nodes,
              [id]: { ...node, position: { x, y }, updatedAt: nowIso() },
            },
          }
        }),

      updateNode: (id, patch) =>
        set((s) => {
          const node = s.nodes[id]
          if (!node) return s
          const updated = {
            ...node,
            ...patch,
            id: node.id,
            type: node.type,
            updatedAt: nowIso(),
          } as IncidentNode
          return {
            nodes: { ...s.nodes, [id]: updated },
            events: [
              ...s.events,
              createEvent('NodeUpdated', `Updated ${updated.title}`, {
                nodeIds: [id],
              }),
            ],
          }
        }),

      deleteNode: (id) =>
        set((s) => {
          const node = s.nodes[id]
          if (!node) return s
          const { [id]: _, ...rest } = s.nodes
          return {
            nodes: rest,
            relationships: s.relationships.filter(
              (r) => r.sourceId !== id && r.targetId !== id,
            ),
            events: [
              ...s.events,
              createEvent('NodeDeleted', `Deleted ${node.title}`, {
                nodeIds: [id],
              }),
            ],
            ui: {
              ...s.ui,
              selectedNodeId:
                s.ui.selectedNodeId === id ? null : s.ui.selectedNodeId,
              inspectorOpen:
                s.ui.selectedNodeId === id ? false : s.ui.inspectorOpen,
            },
          }
        }),

      addNode: (type, position, title) => {
        const node = createNodeFromType(type, position, title)
        set((s) => ({
          nodes: { ...s.nodes, [node.id]: node },
          events: [
            ...s.events,
            createEvent('NodeCreated', `Created ${node.title}`, {
              nodeIds: [node.id],
              significant: type === 'hypothesis' || type === 'decision',
            }),
          ],
          ui: {
            ...s.ui,
            selectedNodeId: node.id,
            inspectorOpen: true,
          },
        }))
        return node.id
      },

      addRelationship: (sourceId, targetId, type, label) =>
        set((s) => {
          if (
            s.relationships.some(
              (r) =>
                r.sourceId === sourceId &&
                r.targetId === targetId &&
                r.type === type,
            )
          ) {
            return s
          }
          const rel = createRelationship(sourceId, targetId, type, label)
          return {
            relationships: [...s.relationships, rel],
            events: [
              ...s.events,
              createEvent('RelationshipCreated', `${type}: ${sourceId} → ${targetId}`, {
                nodeIds: [sourceId, targetId],
                payload: { type },
              }),
            ],
          }
        }),

      removeRelationship: (id) =>
        set((s) => ({
          relationships: s.relationships.filter((r) => r.id !== id),
          events: [
            ...s.events,
            createEvent('RelationshipDeleted', `Removed relationship ${id}`, {
              payload: { id },
            }),
          ],
        })),

      setHypothesisStatus: (id, status) =>
        set((s) => {
          const node = s.nodes[id]
          if (!node || node.type !== 'hypothesis') return s
          const updated = {
            ...node,
            status,
            confidence:
              status === 'RULED_OUT'
                ? Math.min(node.confidence, 10)
                : status === 'CONFIRMED'
                  ? Math.max(node.confidence, 95)
                  : node.confidence,
            updatedAt: nowIso(),
          }
          const events = [
            ...s.events,
            eventForHypothesisStatus(id, status, node.title),
          ]
          const timeline = [
            ...s.timeline,
            {
              id: newId('tl'),
              time: nowIso(),
              label: `${node.title.split(' ').slice(0, 4).join(' ')}… → ${status}`,
              significant: true,
              nodeIds: [id],
            },
          ]
          return {
            nodes: { ...s.nodes, [id]: updated },
            events,
            timeline,
            meta:
              status === 'LIKELY' || status === 'CONFIRMED'
                ? { ...s.meta, leadingHypothesisId: id }
                : s.meta,
          }
        }),

      setHypothesisConfidence: (id, confidence) =>
        set((s) => {
          const node = s.nodes[id]
          if (!node || node.type !== 'hypothesis') return s
          return {
            nodes: {
              ...s.nodes,
              [id]: {
                ...node,
                confidence: Math.max(0, Math.min(100, confidence)),
                updatedAt: nowIso(),
              },
            },
          }
        }),

      assignOwner: (id, owner) =>
        set((s) => {
          const node = s.nodes[id]
          if (!node) return s
          return {
            nodes: {
              ...s.nodes,
              [id]: { ...node, owner, updatedAt: nowIso() },
            },
            events: [
              ...s.events,
              createEvent('OwnerAssigned', `${owner} owns ${node.title}`, {
                nodeIds: [id],
                payload: { owner },
              }),
            ],
          }
        }),

      addEvidenceToHypothesis: (hypothesisId, kind, title) => {
        const hyp = get().nodes[hypothesisId]
        if (!hyp) return
        const position = {
          x: hyp.position.x + (kind === 'evidence' ? -40 : 40),
          y: hyp.position.y + 180,
        }
        const id = get().addNode(kind, position, title)
        get().addRelationship(
          id,
          hypothesisId,
          kind === 'evidence' ? 'supports' : 'contradicts',
        )
        set((s) => ({
          events: [
            ...s.events,
            createEvent(
              kind === 'evidence' ? 'EvidenceAdded' : 'EvidenceContradicted',
              title,
              { nodeIds: [id, hypothesisId], significant: true },
            ),
          ],
        }))
      },

      createLinkedAction: (hypothesisId, title) => {
        const hyp = get().nodes[hypothesisId]
        if (!hyp) return
        const id = get().addNode('action', {
          x: hyp.position.x + 160,
          y: hyp.position.y + 200,
        }, title)
        get().assignOwner(id, hyp.owner ?? 'Unassigned')
        get().addRelationship(hypothesisId, id, 'mitigated-by')
      },

      setActionStatus: (id, status) =>
        set((s) => {
          const node = s.nodes[id]
          if (!node || node.type !== 'action') return s
          const checklist = [...s.recovery.checklist]
          if (status === 'DONE' && node.id === 'action-staging') {
            const item = checklist.find((c) => c.id === 'c4')
            if (item) item.done = true
          }
          if (status === 'DONE' && node.id === 'action-deploy') {
            const item = checklist.find((c) => c.id === 'c5')
            if (item) item.done = true
          }
          return {
            nodes: {
              ...s.nodes,
              [id]: { ...node, status, updatedAt: nowIso() },
            },
            recovery: { ...s.recovery, checklist },
            events: [
              ...s.events,
              eventForActionStatus(id, status, node.title),
            ],
            timeline: [
              ...s.timeline,
              {
                id: newId('tl'),
                time: nowIso(),
                label: `${node.title} → ${status}`,
                significant: status === 'DONE' || status === 'BLOCKED',
                nodeIds: [id],
              },
            ],
          }
        }),

      focusTimelineEvent: (eventId) => {
        const ev = get().timeline.find((t) => t.id === eventId)
        if (!ev?.nodeIds?.length) return
        const primary = ev.nodeIds[0]
        set((s) => ({
          ui: {
            ...s.ui,
            focusNodeIds: ev.nodeIds ?? [],
            selectedNodeId: primary,
            inspectorOpen: true,
            centerRequest: { nodeId: primary, nonce: Date.now() },
          },
        }))
      },

      toggleSimulateTelemetry: () =>
        set((s) => ({
          simulateTelemetry: !s.simulateTelemetry,
          ui: { ...s.ui, telemetryStep: s.simulateTelemetry ? s.ui.telemetryStep : 0 },
        })),

      tickTelemetry: () =>
        set((s) => {
          if (!s.simulateTelemetry) return s
          const nextStep = s.ui.telemetryStep + 1
          const tick = nextTelemetryStep(nextStep)
          const metrics = s.metrics.map((m) => {
            const v = tick.metrics[m.id]
            if (v === undefined) return m
            return applyMetricUpdate(m, v)
          })
          const errorMetric = metrics.find((m) => m.id === 'm-error')
          const impact = s.nodes['impact-checkout']
          const signal = s.nodes['signal-dd-checkout']
          const nodes = { ...s.nodes }
          if (impact && impact.type === 'customer_impact' && typeof errorMetric?.value === 'number') {
            nodes['impact-checkout'] = {
              ...impact,
              failureRate: errorMetric.value,
              updatedAt: nowIso(),
            }
          }
          if (signal && signal.type === 'datadog_signal' && typeof errorMetric?.value === 'number') {
            nodes['signal-dd-checkout'] = {
              ...signal,
              value: `${errorMetric.value}%`,
              updatedAt: nowIso(),
            }
          }
          return {
            metrics,
            nodes,
            events: [
              ...s.events,
              createEvent('MetricChanged', `Checkout error rate → ${errorMetric?.value}%`, {
                nodeIds: ['impact-checkout', 'signal-dd-checkout'],
                payload: { value: errorMetric?.value },
              }),
            ],
            ui: { ...s.ui, telemetryStep: nextStep },
          }
        }),

      runCopilot: (actionId) => {
        const response = runCopilotAction(actionId)
        set((s) => ({
          ui: {
            ...s.ui,
            copilotOpen: true,
            copilotResponse: response,
            pendingSuggestionId: response.suggestion?.id ?? null,
          },
        }))
      },

      acceptSuggestion: () => {
        const { ui } = get()
        const sug = ui.copilotResponse?.suggestion
        if (!sug?.proposedChange || sug.proposedChange.kind === 'none') {
          set((s) => ({
            ui: { ...s.ui, pendingSuggestionId: null },
          }))
          return
        }
        if (
          sug.proposedChange.kind === 'confidence' &&
          sug.proposedChange.nodeId &&
          typeof sug.proposedChange.to === 'number'
        ) {
          get().setHypothesisConfidence(
            sug.proposedChange.nodeId,
            sug.proposedChange.to,
          )
        }
        if (
          sug.proposedChange.kind === 'status' &&
          sug.proposedChange.nodeId &&
          typeof sug.proposedChange.to === 'string'
        ) {
          get().setHypothesisStatus(
            sug.proposedChange.nodeId,
            sug.proposedChange.to as HypothesisStatus,
          )
        }
        set((s) => ({
          ui: { ...s.ui, pendingSuggestionId: null },
        }))
      },

      dismissSuggestion: () =>
        set((s) => ({
          ui: { ...s.ui, pendingSuggestionId: null },
        })),

      showDemo: () => set(withDemo()),

      clearBoard: () => set(withBlank()),

      isDemoActive: () => isDemoIncident(get()),
    }),
    {
      // v3: Prod Call naming (PC-1842); prior keys discarded
      name: 'signalroom-incident-v3',
      partialize: (s) => ({
        meta: s.meta,
        nodes: s.nodes,
        relationships: s.relationships,
        participants: s.participants,
        metrics: s.metrics,
        recovery: s.recovery,
        timeline: s.timeline,
        events: s.events,
        simulateTelemetry: false,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<IncidentState> | undefined
        if (!p?.meta) return current
        return {
          ...current,
          ...p,
          nodes: p.nodes ?? {},
          simulateTelemetry: false,
          ui: current.ui,
        }
      },
    },
  ),
)
