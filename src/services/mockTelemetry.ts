import type { Metric } from '../domain/incident'

/** Simulated recovery curve for checkout error rate */
const ERROR_CURVE = [31, 28, 23, 14, 7, 2]
const GATEWAY_CURVE = [12, 11, 9, 6, 3, 1]
const LATENCY_CURVE = [1.8, 1.6, 1.4, 1.1, 0.9, 0.7]

export interface TelemetryTick {
  step: number
  metrics: Partial<Record<string, number | string>>
}

export function nextTelemetryStep(step: number): TelemetryTick {
  const i = Math.min(step, ERROR_CURVE.length - 1)
  return {
    step: i,
    metrics: {
      'm-error': ERROR_CURVE[i],
      'm-gateway': GATEWAY_CURVE[i],
      'm-p95': LATENCY_CURVE[i],
      'm-traffic': i >= 4 ? 'Recovering' : 'Normal',
    },
  }
}

export function applyMetricUpdate(metric: Metric, value: number | string): Metric {
  const history = [...metric.history]
  if (typeof value === 'number') {
    history.push({ t: history.length, v: value })
    if (history.length > 32) history.shift()
  }

  let status: Metric['status'] = 'normal'
  if (metric.id === 'm-error' && typeof value === 'number') {
    status = value >= 15 ? 'critical' : value >= 5 ? 'warning' : 'normal'
  } else if (metric.id === 'm-gateway' && typeof value === 'number') {
    status = value >= 8 ? 'critical' : value >= 3 ? 'warning' : 'normal'
  } else if (metric.id === 'm-p95' && typeof value === 'number') {
    status = value >= 1.5 ? 'warning' : 'normal'
  }

  const prev =
    typeof metric.value === 'number'
      ? metric.value
      : typeof value === 'number'
        ? value
        : 0
  const trend =
    typeof value === 'number'
      ? value < prev
        ? 'down'
        : value > prev
          ? 'up'
          : 'flat'
      : metric.trend

  return {
    ...metric,
    value,
    history,
    status,
    trend,
  }
}

export const TELEMETRY_INTERVAL_MS = 2200
