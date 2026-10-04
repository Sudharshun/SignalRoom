import type { IncidentNode, NodeType } from '../domain/nodes'
import type { ZoomBand } from '../domain/incident'
import { LiteGraph, type LGNode } from './litegraph'
import {
  ACTION_STATUS_STYLE,
  HYPOTHESIS_STATUS_STYLE,
  NODE_TYPE_STYLE,
  detailLevel,
  liteGraphTypeFor,
} from './nodeStyles'

export interface CardProperties {
  domainId: string
  nodeType: NodeType
  title: string
  subtitle?: string
  statusText?: string
  statusColor?: string
  accent: string
  owner?: string
  confidence?: number
  activityHint?: string
  muted?: boolean
  lines?: string[]
  zoomBand: ZoomBand
  highlighted?: boolean
}

type CardNode = LGNode & {
  properties: CardProperties
  constructor: { title_mode?: number; shape?: number }
}

const LG = LiteGraph as unknown as {
  NO_TITLE: number
  ROUND_SHAPE: number
  CARD_SHAPE: number
  CIRCLE_SHAPE: number
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
      if (lines.length >= maxLines) break
    } else {
      current = test
    }
  }
  if (lines.length < maxLines && current) lines.push(current)
  if (lines.length === maxLines && current) {
    const last = lines[maxLines - 1]
    if (ctx.measureText(last).width > maxWidth - 8) {
      let trimmed = last
      while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
        trimmed = trimmed.slice(0, -1)
      }
      lines[maxLines - 1] = `${trimmed}…`
    }
  }
  return lines
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | [number, number, number, number],
): void {
  const radii = Array.isArray(r) ? r : [r, r, r, r]
  const [tl, tr, br, bl] = radii.map((v) => Math.max(0, Math.min(v, w / 2, h / 2)))
  ctx.beginPath()
  ctx.moveTo(x + tl, y)
  ctx.lineTo(x + w - tr, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr)
  ctx.lineTo(x + w, y + h - br)
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h)
  ctx.lineTo(x + bl, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl)
  ctx.lineTo(x, y + tl)
  ctx.quadraticCurveTo(x, y, x + tl, y)
  ctx.closePath()
}

function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function drawOwnerChip(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  accent: string,
): void {
  const label = initials(name)
  ctx.beginPath()
  ctx.arc(x + 8, y + 8, 9, 0, Math.PI * 2)
  ctx.fillStyle = hexAlpha(accent, 0.25)
  ctx.fill()
  ctx.strokeStyle = hexAlpha(accent, 0.55)
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = '#e8eaed'
  ctx.font = '600 8px "IBM Plex Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + 8, y + 8.5)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#9aa3b2'
  ctx.font = '500 11px "IBM Plex Sans", sans-serif'
  ctx.fillText(name, x + 24, y + 12)
}

/** Full card painted in background pass so LiteGraph chrome is replaced */
function drawCardBackground(this: CardNode, ctx: CanvasRenderingContext2D): void {
  const p = this.properties
  if (!p?.domainId) return

  const w = this.size[0]
  const h = this.size[1]
  const radius = p.nodeType === 'decision' ? 10 : 14
  const muted = !!p.muted

  ctx.save()
  ctx.imageSmoothingEnabled = true

  // Soft drop shadow
  ctx.shadowColor = muted ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = muted ? 8 : 18
  ctx.shadowOffsetY = 6

  roundRectPath(ctx, 0.5, 0.5, w - 1, h - 1, radius)
  const fill = ctx.createLinearGradient(0, 0, 0, h)
  if (muted) {
    fill.addColorStop(0, '#232833')
    fill.addColorStop(1, '#1c2028')
  } else if (p.nodeType === 'decision') {
    fill.addColorStop(0, '#2a2d42')
    fill.addColorStop(1, '#222636')
  } else if (p.nodeType === 'incident') {
    fill.addColorStop(0, '#32222a')
    fill.addColorStop(1, '#241c22')
  } else {
    fill.addColorStop(0, '#2b303b')
    fill.addColorStop(1, '#222731')
  }
  ctx.fillStyle = fill
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // Accent rail
  roundRectPath(ctx, 0.5, 0.5, 5, h - 1, [radius, 0, 0, radius])
  ctx.fillStyle = p.accent
  ctx.fill()

  // Inner top highlight
  const sheen = ctx.createLinearGradient(0, 0, 0, 28)
  sheen.addColorStop(0, 'rgba(255,255,255,0.06)')
  sheen.addColorStop(1, 'rgba(255,255,255,0)')
  roundRectPath(ctx, 5.5, 0.5, w - 6, 28, [0, radius, 0, 0])
  ctx.fillStyle = sheen
  ctx.fill()

  // Border
  roundRectPath(ctx, 0.5, 0.5, w - 1, h - 1, radius)
  if (p.highlighted) {
    ctx.strokeStyle = p.accent
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.strokeStyle = hexAlpha(p.accent, 0.25)
    ctx.lineWidth = 6
    ctx.stroke()
  } else {
    ctx.strokeStyle =
      p.nodeType === 'decision'
        ? 'rgba(129,140,248,0.45)'
        : muted
          ? 'rgba(75,85,99,0.7)'
          : 'rgba(70,78,94,0.95)'
    ctx.lineWidth = 1.25
    ctx.stroke()
  }

  ctx.restore()
}

function drawCardForeground(this: CardNode, ctx: CanvasRenderingContext2D): void {
  const p = this.properties
  if (!p?.domainId) return

  const w = this.size[0]
  const h = this.size[1]
  const detail = detailLevel(p.zoomBand ?? 'medium')
  const style = NODE_TYPE_STYLE[p.nodeType]
  const padX = 16

  ctx.save()
  ctx.imageSmoothingEnabled = true

  // Type chip with icon disc
  const chipY = 12
  ctx.beginPath()
  ctx.arc(padX + 9, chipY + 9, 9, 0, Math.PI * 2)
  ctx.fillStyle = hexAlpha(p.accent, 0.2)
  ctx.fill()
  ctx.fillStyle = p.accent
  ctx.font = '700 10px "IBM Plex Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(style.icon, padX + 9, chipY + 9.5)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  ctx.font = '600 10px "IBM Plex Sans", sans-serif'
  ctx.fillStyle = hexAlpha(p.accent, 0.95)
  ctx.fillText(style.label, padX + 24, chipY + 13)

  // Title
  let y = 44
  ctx.fillStyle = p.muted ? '#8b93a7' : '#f1f3f7'
  ctx.font =
    detail === 'minimal'
      ? '600 13px "IBM Plex Sans", sans-serif'
      : '600 14px "IBM Plex Sans", sans-serif'
  const titleLines = wrapText(
    ctx,
    p.title || 'Untitled',
    w - padX * 2,
    detail === 'minimal' ? 1 : 2,
  )
  for (const line of titleLines) {
    ctx.fillText(line, padX, y)
    y += 18
  }

  if (p.muted) {
    ctx.strokeStyle = 'rgba(156,163,175,0.45)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(padX, 40)
    ctx.lineTo(w - padX, y - 10)
    ctx.stroke()
  }

  if (detail === 'minimal') {
    if (typeof p.confidence === 'number') {
      ctx.fillStyle = p.statusColor ?? p.accent
      ctx.font = '700 18px "IBM Plex Mono", monospace'
      ctx.fillText(`${p.confidence}%`, padX, h - 16)
      if (p.statusText) {
        ctx.font = '600 10px "IBM Plex Mono", monospace'
        ctx.fillStyle = p.statusColor ?? '#9aa3b2'
        const tw = ctx.measureText(p.statusText).width
        ctx.fillText(p.statusText, w - padX - tw, h - 16)
      }
    }
    ctx.restore()
    return
  }

  y += 6

  // Status pill
  if (p.statusText) {
    ctx.font = '600 10px "IBM Plex Mono", monospace'
    const label = p.statusText
    const sw = Math.min(w - padX * 2, ctx.measureText(label).width + 18)
    roundRectPath(ctx, padX, y, sw, 20, 6)
    ctx.fillStyle = hexAlpha(p.statusColor ?? '#6b7385', 0.16)
    ctx.fill()
    ctx.strokeStyle = hexAlpha(p.statusColor ?? '#6b7385', 0.35)
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = p.statusColor ?? '#9aa3b2'
    ctx.fillText(label, padX + 9, y + 14)
    y += 30
  }

  // Confidence meter
  if (typeof p.confidence === 'number' && p.nodeType === 'hypothesis') {
    const barW = w - padX * 2
    const pct = Math.max(0, Math.min(100, p.confidence)) / 100
    roundRectPath(ctx, padX, y, barW, 7, 4)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fill()
    if (pct > 0) {
      const grad = ctx.createLinearGradient(padX, 0, padX + barW, 0)
      grad.addColorStop(0, hexAlpha(p.statusColor ?? p.accent, 0.55))
      grad.addColorStop(1, p.statusColor ?? p.accent)
      roundRectPath(ctx, padX, y, Math.max(6, barW * pct), 7, 4)
      ctx.fillStyle = grad
      ctx.fill()
    }
    ctx.fillStyle = '#d7dce6'
    ctx.font = '600 12px "IBM Plex Mono", monospace'
    ctx.fillText(`${p.confidence}% confidence`, padX, y + 22)
    y += 34
  }

  // Meta rows
  if (detail === 'full') {
    if (p.owner) {
      drawOwnerChip(ctx, p.owner, padX, y, p.accent)
      y += 26
    }
    if (p.lines?.length) {
      ctx.fillStyle = '#8b93a7'
      ctx.font = '400 11px "IBM Plex Sans", sans-serif'
      for (const line of p.lines.slice(0, 2)) {
        ctx.fillText(line, padX, y + 10)
        y += 16
      }
    }
    if (p.activityHint) {
      ctx.fillStyle = '#38bdf8'
      ctx.font = '500 10px "IBM Plex Sans", sans-serif'
      const ay = Math.max(y + 8, h - 16)
      ctx.fillText(`●  ${p.activityHint}`, padX, ay)
    }
  } else if (p.owner) {
    drawOwnerChip(ctx, p.owner, padX, Math.min(y, h - 28), p.accent)
  }

  ctx.restore()
}

function sizeFor(nodeType: NodeType, band: ZoomBand): [number, number] {
  const detail = detailLevel(band)
  if (detail === 'minimal') {
    if (nodeType === 'hypothesis') return [220, 96]
    if (nodeType === 'incident') return [240, 80]
    return [200, 72]
  }
  if (nodeType === 'decision') return [280, detail === 'full' ? 168 : 148]
  if (nodeType === 'hypothesis') return [280, detail === 'full' ? 168 : 140]
  if (nodeType === 'incident') return [260, 124]
  if (nodeType === 'customer_impact') return [250, 128]
  if (nodeType === 'action') return [250, detail === 'full' ? 136 : 118]
  if (nodeType === 'vendor' || nodeType === 'deployment') return [230, 118]
  return [230, 110]
}

function buildProperties(
  domain: IncidentNode,
  zoomBand: ZoomBand,
  highlighted: boolean,
): CardProperties {
  const style = NODE_TYPE_STYLE[domain.type]
  const base: CardProperties = {
    domainId: domain.id,
    nodeType: domain.type,
    title: domain.title,
    accent: style.accent,
    owner: domain.owner,
    activityHint: domain.activityHint,
    zoomBand,
    highlighted,
    lines: [],
  }

  switch (domain.type) {
    case 'hypothesis': {
      const st = HYPOTHESIS_STATUS_STYLE[domain.status]
      return {
        ...base,
        statusText: st.label,
        statusColor: st.color,
        confidence: domain.confidence,
        muted: !!st.muted,
        subtitle: domain.category,
        accent: st.color,
      }
    }
    case 'action': {
      const st = ACTION_STATUS_STYLE[domain.status]
      return {
        ...base,
        statusText: st.label,
        statusColor: st.color,
        lines: [
          `Priority ${domain.priority}`,
          domain.startedAt
            ? `Started ${new Date(domain.startedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : 'Not started',
        ],
      }
    }
    case 'decision': {
      const selected = domain.options.find((o) => o.id === domain.selectedOptionId)
      return {
        ...base,
        statusText: selected ? `DECIDED · ${selected.label}` : 'PENDING',
        statusColor: '#818cf8',
        lines: [
          domain.decisionMaker ? `Decision maker ${domain.decisionMaker}` : 'Unassigned',
          domain.decidedAt
            ? new Date(domain.decidedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '',
        ].filter(Boolean),
      }
    }
    case 'customer_impact':
      return {
        ...base,
        statusText: `${domain.failureRate ?? 0}% failure`,
        statusColor: '#e11d48',
        lines: [
          domain.region ?? '',
          domain.attemptsImpacted
            ? `~${domain.attemptsImpacted.toLocaleString()} attempts`
            : '',
        ].filter(Boolean),
      }
    case 'deployment':
      return {
        ...base,
        statusText: `v${domain.version}`,
        statusColor: '#f472b6',
        lines: [
          domain.service,
          new Date(domain.deployedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        ],
      }
    case 'vendor':
      return {
        ...base,
        statusText: domain.status === 'ENGAGED' ? 'VENDOR ENGAGED' : domain.status,
        statusColor: '#c084fc',
        lines: domain.caseId ? [`Case ${domain.caseId}`] : [],
      }
    case 'evidence':
      return {
        ...base,
        statusText: 'SUPPORTS',
        statusColor: '#22c55e',
        lines: domain.source ? [domain.source] : [],
      }
    case 'counter_evidence':
      return {
        ...base,
        statusText: 'CONTRADICTS',
        statusColor: '#ef4444',
        lines: domain.source ? [domain.source] : [],
      }
    case 'incident':
      return {
        ...base,
        statusText: domain.severity,
        statusColor: '#e11d48',
        lines: [domain.status],
      }
    case 'datadog_signal':
      return {
        ...base,
        statusText: String(domain.value ?? ''),
        statusColor: '#a78bfa',
        lines: domain.metric ? [domain.metric] : [],
      }
    default:
      return base
  }
}

function stylePorts(node: CardNode, accent: string): void {
  if (node.inputs?.[0]) {
    node.inputs[0].color_on = accent
    node.inputs[0].color_off = hexAlpha(accent, 0.45)
    ;(node.inputs[0] as { shape?: number }).shape = LG.CIRCLE_SHAPE
  }
  if (node.outputs?.[0]) {
    node.outputs[0].color_on = accent
    node.outputs[0].color_off = hexAlpha(accent, 0.45)
    ;(node.outputs[0] as { shape?: number }).shape = LG.CIRCLE_SHAPE
  }
}

function createNodeClass(nodeType: NodeType): new () => CardNode {
  function IncidentCardNode(this: CardNode) {
    this.addInput('', '*')
    this.addOutput('', '*')
    this.properties = {
      domainId: '',
      nodeType,
      title: NODE_TYPE_STYLE[nodeType].label,
      accent: NODE_TYPE_STYLE[nodeType].accent,
      zoomBand: 'medium',
    }
    this.size = sizeFor(nodeType, 'medium')
    this.color = '#2b303b'
    this.bgcolor = '#2b303b'
    this.boxcolor = NODE_TYPE_STYLE[nodeType].accent
    this.shape = LG.ROUND_SHAPE
    stylePorts(this, NODE_TYPE_STYLE[nodeType].accent)
  }

  IncidentCardNode.title = NODE_TYPE_STYLE[nodeType].label
  IncidentCardNode.desc = `SignalRoom ${nodeType} node`
  IncidentCardNode.title_mode = LG.NO_TITLE
  IncidentCardNode.shape = LG.ROUND_SHAPE
  ;(IncidentCardNode as unknown as { skip_list?: boolean }).skip_list = true
  IncidentCardNode.prototype.onDrawBackground = drawCardBackground
  IncidentCardNode.prototype.onDrawForeground = drawCardForeground

  return IncidentCardNode as unknown as new () => CardNode
}

let registered = false

export function registerIncidentNodes(): void {
  if (registered) return
  const types = Object.keys(NODE_TYPE_STYLE) as NodeType[]
  for (const t of types) {
    const key = liteGraphTypeFor(t)
    if (!LiteGraph.registered_node_types?.[key]) {
      LiteGraph.registerNodeType(key, createNodeClass(t))
    }
  }
  registered = true
}

export function applyDomainToLiteNode(
  lgNode: LGNode,
  domain: IncidentNode,
  zoomBand: ZoomBand,
  highlighted: boolean,
): void {
  const props = buildProperties(domain, zoomBand, highlighted)
  lgNode.properties = props as unknown as Record<string, unknown>
  lgNode.title = ''
  lgNode.pos = [domain.position.x, domain.position.y]
  lgNode.size = sizeFor(domain.type, zoomBand)
  lgNode.color = props.muted ? '#1f232b' : '#2b303b'
  lgNode.bgcolor = lgNode.color
  lgNode.boxcolor = props.accent
  lgNode.shape = LG.ROUND_SHAPE
  lgNode.flags = lgNode.flags ?? {}
  stylePorts(lgNode as CardNode, props.accent)
}
