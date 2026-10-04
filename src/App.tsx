import { useEffect } from 'react'
import { CatchMeUp } from './components/CatchMeUp'
import { IncidentCopilot } from './components/IncidentCopilot'
import { IncidentHeader } from './components/IncidentHeader'
import { NodeInspector } from './components/NodeInspector'
import { NodePalette } from './components/NodePalette'
import { SituationCanvas } from './components/SituationCanvas'
import { SituationPanel } from './components/SituationPanel'
import { Timeline } from './components/Timeline'
import { TELEMETRY_INTERVAL_MS } from './services/mockTelemetry'
import { useIncidentStore } from './store/incidentStore'

export default function App() {
  const simulate = useIncidentStore((s) => s.simulateTelemetry)
  const tickTelemetry = useIncidentStore((s) => s.tickTelemetry)

  useEffect(() => {
    if (!simulate) return
    const id = window.setInterval(() => tickTelemetry(), TELEMETRY_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [simulate, tickTelemetry])

  return (
    <div className="flex h-full flex-col bg-canvas text-text">
      <IncidentHeader />
      <div className="relative flex min-h-0 flex-1">
        <NodePalette />
        <SituationCanvas />
        <SituationPanel />
        <NodeInspector />
        <IncidentCopilot />
      </div>
      <Timeline />
      <CatchMeUp />
    </div>
  )
}
