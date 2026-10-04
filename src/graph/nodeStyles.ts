import type { HypothesisStatus, NodeType, ActionStatus } from '../domain/nodes'
import type { ZoomBand } from '../domain/incident'

export const HYPOTHESIS_STATUS_STYLE: Record<
  HypothesisStatus,
  { color: string; bg: string; label: string; muted?: boolean }
> = {
  UNKNOWN: { color: '#9aa3b2', bg: '#3a4050', label: 'UNKNOWN' },
  INVESTIGATING: { color: '#60a5fa', bg: 'rgba(59,130,246,0.2)', label: 'INVESTIGATING' },
  SUPPORTED: { color: '#facc15', bg: 'rgba(234,179,8,0.18)', label: 'SUPPORTED' },
  LIKELY: { color: '#fb923c', bg: 'rgba(249,115,22,0.2)', label: 'LIKELY' },
  CONFIRMED: { color: '#4ade80', bg: 'rgba(34,197,94,0.18)', label: 'CONFIRMED' },
  RULED_OUT: { color: '#9ca3af', bg: 'rgba(75,85,99,0.35)', label: 'RULED OUT', muted: true },
}

export const ACTION_STATUS_STYLE: Record<
  ActionStatus,
  { color: string; label: string }
> = {
  TODO: { color: '#9aa3b2', label: 'TODO' },
  IN_PROGRESS: { color: '#60a5fa', label: 'IN PROGRESS' },
  BLOCKED: { color: '#fb923c', label: 'BLOCKED' },
  DONE: { color: '#4ade80', label: 'DONE' },
}

export const NODE_TYPE_STYLE: Record<
  NodeType,
  { accent: string; label: string; icon: string }
> = {
  incident: { accent: '#e11d48', label: 'INCIDENT', icon: '!' },
  observation: { accent: '#38bdf8', label: 'OBSERVATION', icon: '◉' },
  hypothesis: { accent: '#f97316', label: 'HYPOTHESIS', icon: '?' },
  evidence: { accent: '#22c55e', label: 'EVIDENCE', icon: '+' },
  counter_evidence: { accent: '#ef4444', label: 'COUNTER', icon: '−' },
  datadog_signal: { accent: '#a78bfa', label: 'DATADOG', icon: '◈' },
  service: { accent: '#2dd4bf', label: 'SERVICE', icon: '▣' },
  deployment: { accent: '#f472b6', label: 'DEPLOYMENT', icon: '↑' },
  customer_impact: { accent: '#e11d48', label: 'IMPACT', icon: '⚠' },
  investigation: { accent: '#3b82f6', label: 'INVESTIGATION', icon: '⌕' },
  action: { accent: '#38bdf8', label: 'ACTION', icon: '→' },
  decision: { accent: '#818cf8', label: 'DECISION', icon: '◆' },
  vendor: { accent: '#c084fc', label: 'VENDOR', icon: '☎' },
  experiment: { accent: '#14b8a6', label: 'EXPERIMENT', icon: '⚗' },
  timeline_event: { accent: '#94a3b8', label: 'EVENT', icon: '◷' },
}

export function liteGraphTypeFor(nodeType: NodeType): string {
  return `incident/${nodeType}`
}

export function visibleInZoom(nodeType: NodeType, band: ZoomBand): boolean {
  if (band === 'far') {
    return (
      nodeType === 'incident' ||
      nodeType === 'customer_impact' ||
      nodeType === 'hypothesis' ||
      nodeType === 'decision' ||
      nodeType === 'deployment'
    )
  }
  if (band === 'medium') {
    return (
      nodeType !== 'evidence' &&
      nodeType !== 'counter_evidence' &&
      nodeType !== 'datadog_signal' &&
      nodeType !== 'timeline_event' &&
      nodeType !== 'experiment'
    )
  }
  return true
}

export function detailLevel(band: ZoomBand): 'minimal' | 'standard' | 'full' {
  if (band === 'far') return 'minimal'
  if (band === 'medium') return 'standard'
  return 'full'
}

export function scaleToZoomBand(scale: number): ZoomBand {
  if (scale < 0.55) return 'far'
  if (scale < 1.05) return 'medium'
  return 'close'
}
