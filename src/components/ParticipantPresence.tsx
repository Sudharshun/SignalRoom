import { useIncidentStore } from '../store/incidentStore'

export function ParticipantPresence() {
  const participants = useIncidentStore((s) => s.participants)

  return (
    <div className="flex items-center -space-x-2">
      {participants.map((p) => (
        <div
          key={p.id}
          title={`${p.name} · ${p.role}${p.investigatingNodeId ? ' · investigating' : ''}`}
          className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-panel text-[11px] font-semibold text-white"
          style={{ backgroundColor: p.color }}
        >
          {p.initials}
          {p.online && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-panel bg-emerald-400" />
          )}
        </div>
      ))}
    </div>
  )
}
