import type { IncidentNode, Position } from '../domain/nodes'

/**
 * Differential diagnosis layout:
 *
 *                 CHECKOUT FAILURE
 *        ┌────────────┼─────────────┐
 *   APPLICATION   PLATFORM      EXTERNAL
 */
export function diagnosisLayout(
  nodes: Record<string, IncidentNode>,
): Record<string, Position> {
  const positions: Record<string, Position> = {}
  const incident = Object.values(nodes).find((n) => n.type === 'incident')
  const impact = Object.values(nodes).find((n) => n.type === 'customer_impact')
  const deployment = Object.values(nodes).find((n) => n.type === 'deployment')
  const hypotheses = Object.values(nodes).filter((n) => n.type === 'hypothesis')

  const cx = 620
  const top = 60

  if (incident) positions[incident.id] = { x: cx, y: top }
  if (impact) positions[impact.id] = { x: cx - 360, y: top }
  if (deployment) positions[deployment.id] = { x: cx + 360, y: top }

  const categoryOrder = ['APPLICATION', 'PLATFORM', 'EXTERNAL', 'OTHER'] as const
  const sorted = [...hypotheses].sort((a, b) => {
    const ac = categoryOrder.indexOf(a.category ?? 'OTHER')
    const bc = categoryOrder.indexOf(b.category ?? 'OTHER')
    return ac - bc
  })

  const gap = 360
  const startX = cx - ((sorted.length - 1) * gap) / 2
  sorted.forEach((h, i) => {
    positions[h.id] = { x: startX + i * gap, y: top + 260 }
  })

  for (const h of sorted) {
    const related = Object.values(nodes).filter(
      (n) =>
        (n.type === 'evidence' || n.type === 'counter_evidence') &&
        (n.owner === h.owner ||
          (h.category === 'APPLICATION' &&
            ['ev-timing', 'ev-instances', 'ev-traces', 'cev-preexisting'].includes(
              n.id,
            )) ||
          (h.category === 'PLATFORM' &&
            ['ev-cpu', 'ev-pool', 'ev-latency'].includes(n.id)) ||
          (h.category === 'EXTERNAL' && ['ev-gateway'].includes(n.id))),
    )
    related.forEach((ev, idx) => {
      const hp = positions[h.id]
      positions[ev.id] = {
        x: hp.x - 40 + (idx % 3) * 40,
        y: hp.y + 180 + Math.floor(idx / 3) * 100,
      }
    })
  }

  const vendor = Object.values(nodes).find((n) => n.type === 'vendor')
  const vendorHyp = sorted.find((h) => h.category === 'EXTERNAL')
  if (vendor && vendorHyp && positions[vendorHyp.id]) {
    positions[vendor.id] = {
      x: positions[vendorHyp.id].x + 200,
      y: positions[vendorHyp.id].y,
    }
  }

  const decision = Object.values(nodes).find((n) => n.type === 'decision')
  if (decision) positions[decision.id] = { x: cx, y: top + 520 }

  return positions
}

/** Emphasize the recovery path under the leading hypothesis */
export function recoveryPathLayout(
  nodes: Record<string, IncidentNode>,
): Record<string, Position> {
  const base = diagnosisLayout(nodes)
  const actions = [
    'action-patch',
    'action-staging',
    'action-deploy',
    'action-validate-metrics',
  ]
  const startX = 180
  const y = 780
  actions.forEach((id, i) => {
    if (nodes[id]) base[id] = { x: startX + i * 290, y }
  })
  return base
}
