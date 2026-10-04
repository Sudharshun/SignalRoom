import { useEffect, useState } from 'react'
import {
  Activity,
  Brain,
  LayoutGrid,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react'
import { isDemoIncident } from '../data/blankIncident'
import { useIncidentStore } from '../store/incidentStore'
import { formatClock, formatElapsed } from '../utils/time'
import { ParticipantPresence } from './ParticipantPresence'

export function IncidentHeader() {
  const meta = useIncidentStore((s) => s.meta)
  const simulate = useIncidentStore((s) => s.simulateTelemetry)
  const diagnosisMode = useIncidentStore((s) => s.ui.diagnosisMode)
  const setCatchMeUpOpen = useIncidentStore((s) => s.setCatchMeUpOpen)
  const setCopilotOpen = useIncidentStore((s) => s.setCopilotOpen)
  const setDiagnosisMode = useIncidentStore((s) => s.setDiagnosisMode)
  const requestLayout = useIncidentStore((s) => s.requestLayout)
  const requestCenterOnNode = useIncidentStore((s) => s.requestCenterOnNode)
  const toggleSimulateTelemetry = useIncidentStore((s) => s.toggleSimulateTelemetry)
  const showDemo = useIncidentStore((s) => s.showDemo)
  const runCopilot = useIncidentStore((s) => s.runCopilot)
  const demoActive = isDemoIncident({ meta })
  const [elapsed, setElapsed] = useState(() => formatElapsed(meta.startedAt))

  const loadDemo = () => {
    showDemo()
    window.setTimeout(() => {
      requestCenterOnNode('incident-checkout')
      requestLayout('diagnosis')
    }, 40)
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsed(formatElapsed(meta.startedAt))
    }, 1000)
    return () => window.clearInterval(id)
  }, [meta.startedAt])

  return (
    <header className="shrink-0 border-b border-border bg-panel px-4 py-3">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold tracking-wide text-text-muted">
              {meta.number}
            </span>
            <span className="rounded bg-sev1-soft px-2 py-0.5 font-mono text-xs font-bold text-sev1 ring-1 ring-sev1/40">
              {meta.severity}
            </span>
          </div>
          <h1 className="truncate text-lg font-semibold tracking-tight text-text">
            {meta.title}
          </h1>
          <div className="hidden items-center gap-3 text-sm text-text-muted sm:flex">
            <span className="font-mono text-text">
              Elapsed: <span className="text-sev1">{elapsed}</span>
            </span>
            <span>·</span>
            <span>{meta.participantCount} participants</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ParticipantPresence />
          <button
            type="button"
            onClick={() => setCatchMeUpOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/15 px-3 py-1.5 text-sm font-semibold text-sky-300 ring-1 ring-sky-400/30 hover:bg-sky-500/25"
          >
            <Zap className="h-3.5 w-3.5" />
            Catch Me Up
          </button>
          <button
            type="button"
            onClick={() => {
              setDiagnosisMode(!diagnosisMode)
              if (!diagnosisMode) requestLayout('diagnosis')
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ring-1 ${
              diagnosisMode
                ? 'bg-indigo-500/20 text-indigo-200 ring-indigo-400/40'
                : 'bg-panel-elevated text-text-muted ring-border hover:text-text'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Diagnosis View
          </button>
          <button
            type="button"
            onClick={() => setCopilotOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-panel-elevated px-3 py-1.5 text-sm font-medium text-text-muted ring-1 ring-border hover:text-text"
          >
            <Brain className="h-3.5 w-3.5" />
            Copilot
          </button>
          <button
            type="button"
            onClick={() => runCopilot('challenge')}
            className="inline-flex items-center gap-1.5 rounded-md bg-panel-elevated px-3 py-1.5 text-sm font-medium text-amber-200/90 ring-1 ring-amber-500/30 hover:bg-amber-500/10"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Challenge
          </button>
          <button
            type="button"
            onClick={toggleSimulateTelemetry}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ring-1 ${
              simulate
                ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/40'
                : 'bg-panel-elevated text-text-muted ring-border hover:text-text'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Simulate Incident
          </button>
          <button
            type="button"
            onClick={loadDemo}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold ring-1 ${
              demoActive
                ? 'bg-panel-elevated text-text-muted ring-border hover:text-text'
                : 'bg-rose-500/15 text-rose-200 ring-rose-400/40 hover:bg-rose-500/25'
            }`}
            title={
              demoActive
                ? 'Reload the PC-1842 Prod Call demo'
                : 'Load the PC-1842 Prod Call checkout failure demo'
            }
          >
            {demoActive ? (
              <RotateCcw className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {demoActive ? 'Reset Demo' : 'Show Demo'}
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        <div>
          <span className="text-text-dim">Incident Commander:</span>{' '}
          <span className="font-medium text-text">{meta.incidentCommander}</span>
        </div>
        <div>
          <span className="text-text-dim">Current Strategy:</span>{' '}
          <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 font-mono text-xs font-semibold text-indigo-300 ring-1 ring-indigo-400/30">
            {meta.strategy.replace('_', ' ')}
          </span>
        </div>
        <div>
          <span className="text-text-dim">Next Update:</span>{' '}
          <span className="font-mono text-text">{formatClock(meta.nextUpdateAt)}</span>
        </div>
      </div>
    </header>
  )
}
