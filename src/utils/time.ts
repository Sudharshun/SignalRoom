import { DEMO_NOW, DEMO_START } from '../data/demoIncident'

/** Format elapsed since incident start. Demo incidents use a stable story clock. */
export function formatElapsed(startedAt: string, nowMs: number = Date.now()): string {
  const start = new Date(startedAt).getTime()
  const isDemoStart = startedAt === DEMO_START

  let elapsedMs: number
  if (isDemoStart) {
    const demoNow = new Date(DEMO_NOW).getTime()
    const demoBaseElapsed = Math.max(0, demoNow - start)
    const boot =
      (window as unknown as { __srBoot?: number }).__srBoot ?? Date.now()
    if (!(window as unknown as { __srBoot?: number }).__srBoot) {
      ;(window as unknown as { __srBoot?: number }).__srBoot = boot
    }
    elapsedMs = demoBaseElapsed + (nowMs - boot)
  } else {
    elapsedMs = Math.max(0, nowMs - start)
  }

  const totalSec = Math.floor(elapsedMs / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
