import type { IncidentNode } from '../domain/nodes'
import type { Relationship } from '../domain/relationships'
import { RELATIONSHIP_COLORS } from '../domain/relationships'
import type { ZoomBand } from '../domain/incident'
import {
  LGraph,
  LGraphCanvas,
  LiteGraph,
  configureLiteGraphTheme,
  type LGCanvas,
  type LGGraph,
  type LGNode,
} from './litegraph'
import { applyDomainToLiteNode, registerIncidentNodes } from './registerNodes'
import { liteGraphTypeFor, visibleInZoom } from './nodeStyles'

export interface GraphAdapterCallbacks {
  onSelectNode: (domainId: string | null) => void
  onMoveNode: (domainId: string, x: number, y: number) => void
  onConnect: (sourceDomainId: string, targetDomainId: string) => void
  onZoom: (scale: number) => void
  onDeleteSelected?: () => void
}

type CanvasExtras = LGCanvas & {
  highquality_render?: boolean
  render_shadows?: boolean
  render_connections_shadows?: boolean
  render_curved_connections?: boolean
  render_connection_arrows?: boolean
  links_render_mode?: number
  round_radius?: number
  clear_background?: boolean
  editor_alpha?: number
  default_connection_color?: {
    input_off: string
    input_on: string
    output_off: string
    output_on: string
  }
  onDrawOverlay?: (ctx: CanvasRenderingContext2D) => void
  bgctx?: CanvasRenderingContext2D
  ctx?: CanvasRenderingContext2D
}

/**
 * Bridges Incident domain model ↔ LiteGraph runtime.
 * Domain remains source of truth; this class only projects visuals.
 */
export class GraphAdapter {
  graph: LGGraph
  canvas: CanvasExtras
  private domainToLg = new Map<string, number>()
  private lgToDomain = new Map<number, string>()
  private syncing = false
  private callbacks: GraphAdapterCallbacks
  private lastLinkCount = 0
  private zoomPoll: number | null = null
  private lastScale = 0.9

  constructor(canvasEl: HTMLCanvasElement, callbacks: GraphAdapterCallbacks) {
    configureLiteGraphTheme()
    registerIncidentNodes()

    this.callbacks = callbacks
    this.graph = new LGraph()
    this.canvas = new LGraphCanvas(canvasEl, this.graph, {
      skip_render: false,
      autoresize: true,
    }) as CanvasExtras

    this.configureCanvasLook()
    this.canvas.ds.scale = 0.9

    this.canvas.onNodeSelected = (node) => {
      const domainId = this.lgToDomain.get(node.id) ?? null
      this.callbacks.onSelectNode(domainId)
    }

    this.canvas.onShowNodePanel = (node) => {
      const domainId = this.lgToDomain.get(node.id) ?? null
      this.callbacks.onSelectNode(domainId)
    }

    // Graph-space overlays (transformed with pan/zoom)
    this.canvas.onDrawForeground = (ctx) => {
      this.drawEdgeLabels(ctx)
    }

    // Graph-space background (dot grid)
    this.canvas.onDrawBackground = (ctx, visibleArea) => {
      this.drawDotGrid(ctx, visibleArea as Float32Array | number[])
    }

    // Screen-space overlay (minimap)
    this.canvas.onDrawOverlay = (ctx) => {
      this.drawMinimap(ctx)
    }

    canvasEl.addEventListener('mouseup', () => this.flushPositions())
    canvasEl.addEventListener('touchend', () => this.flushPositions())

    canvasEl.tabIndex = 0
    canvasEl.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        this.callbacks.onDeleteSelected?.()
      }
    })

    // Graph execution loop not needed for visual prototype; canvas uses rAF
    this.graph.start(1000)

    this.zoomPoll = window.setInterval(() => {
      const scale = this.canvas.ds.scale
      if (Math.abs(scale - this.lastScale) > 0.015) {
        this.lastScale = scale
        this.callbacks.onZoom(scale)
      }
      this.detectNewLinks()
    }, 160)
  }

  private configureCanvasLook(): void {
    const c = this.canvas
    const LG = LiteGraph as unknown as { SPLINE_LINK: number }

    c.background_image = null
    c.clear_background = true
    c.clear_background_color = '#171a20'
    c.render_canvas_border = false
    c.render_connections_border = false
    c.render_connections_shadows = false
    c.render_shadows = true
    c.highquality_render = true
    c.render_curved_connections = true
    c.render_connection_arrows = false
    c.connections_width = 2.25
    c.links_render_mode = LG.SPLINE_LINK
    c.round_radius = 14
    c.allow_searchbox = false
    c.show_info = false
    c.editor_alpha = 1
    c.title_text_font = '600 12px "IBM Plex Sans", sans-serif'
    c.inner_text_font = '400 11px "IBM Plex Sans", sans-serif'
    c.default_link_color = 'rgba(100,112,132,0.75)'
    c.default_connection_color = {
      input_off: '#4b5568',
      input_on: '#7dd3fc',
      output_off: '#4b5568',
      output_on: '#7dd3fc',
    }
  }

  destroy(): void {
    if (this.zoomPoll != null) window.clearInterval(this.zoomPoll)
    this.graph.stop()
    this.graph.clear()
  }

  resize(): void {
    this.canvas.resize()
    this.canvas.setDirty(true, true)
  }

  centerOnDomainId(domainId: string): void {
    const lgId = this.domainToLg.get(domainId)
    if (lgId == null) return
    const node = this.graph.getNodeById(lgId)
    if (node) {
      this.canvas.centerOnNode(node)
      this.canvas.setDirty(true, true)
    }
  }

  setZoom(scale: number): void {
    this.canvas.setZoom(scale)
    this.lastScale = scale
    this.canvas.setDirty(true, true)
  }

  sync(params: {
    nodes: Record<string, IncidentNode>
    relationships: Relationship[]
    zoomBand: ZoomBand
    focusNodeIds: string[]
  }): void {
    this.syncing = true
    const { nodes, relationships, zoomBand, focusNodeIds } = params
    const focus = new Set(focusNodeIds)
    const seen = new Set<string>()

    for (const domain of Object.values(nodes)) {
      const show = visibleInZoom(domain.type, zoomBand)
      const existingId = this.domainToLg.get(domain.id)
      if (!show) {
        if (existingId != null) {
          const n = this.graph.getNodeById(existingId)
          if (n) this.graph.remove(n)
          this.domainToLg.delete(domain.id)
          this.lgToDomain.delete(existingId)
        }
        continue
      }
      seen.add(domain.id)
      let lgNode: LGNode | null =
        existingId != null ? this.graph.getNodeById(existingId) : null
      if (!lgNode) {
        lgNode = LiteGraph.createNode(liteGraphTypeFor(domain.type))
        if (!lgNode) continue
        this.graph.add(lgNode)
        this.domainToLg.set(domain.id, lgNode.id)
        this.lgToDomain.set(lgNode.id, domain.id)
      }
      applyDomainToLiteNode(lgNode, domain, zoomBand, focus.has(domain.id))
    }

    for (const [domainId, lgId] of [...this.domainToLg.entries()]) {
      if (!seen.has(domainId)) {
        const n = this.graph.getNodeById(lgId)
        if (n) this.graph.remove(n)
        this.domainToLg.delete(domainId)
        this.lgToDomain.delete(lgId)
      }
    }

    this.rebuildLinks(relationships)
    this.syncing = false
    this.canvas.setDirty(true, true)
  }

  private rebuildLinks(relationships: Relationship[]): void {
    for (const node of [...this.graph._nodes]) {
      if (node.outputs?.[0]?.links?.length) {
        const links = [...node.outputs[0].links]
        for (const linkId of links) {
          const link = this.graph.links[linkId]
          if (link) {
            const target = this.graph.getNodeById(link.target_id)
            if (target?.inputs?.[link.target_slot]) {
              target.inputs[link.target_slot].link = null
            }
            delete this.graph.links[linkId]
          }
        }
        node.outputs[0].links = []
      }
      if (node.inputs?.[0]) node.inputs[0].link = null
    }

    for (const rel of relationships) {
      const srcId = this.domainToLg.get(rel.sourceId)
      const tgtId = this.domainToLg.get(rel.targetId)
      if (srcId == null || tgtId == null) continue
      const src = this.graph.getNodeById(srcId)
      const tgt = this.graph.getNodeById(tgtId)
      if (!src || !tgt) continue

      const linkId = (this.graph as unknown as { last_link_id: number }).last_link_id
        ? ++(this.graph as unknown as { last_link_id: number }).last_link_id
        : ((this.graph as unknown as { last_link_id: number }).last_link_id = 1)

      const color = RELATIONSHIP_COLORS[rel.type]
      this.graph.links[linkId] = {
        id: linkId,
        origin_id: src.id,
        origin_slot: 0,
        target_id: tgt.id,
        target_slot: 0,
        type: rel.type,
        color,
        data: { label: rel.label ?? rel.type, relId: rel.id },
      }
      if (!src.outputs) src.outputs = []
      if (!src.outputs[0]) src.addOutput('', '*')
      if (!tgt.inputs) tgt.inputs = []
      if (!tgt.inputs[0]) tgt.addInput('', '*')
      src.outputs[0].links = src.outputs[0].links ?? []
      src.outputs[0].links.push(linkId)
      tgt.inputs[0].link = linkId
    }

    this.lastLinkCount = Object.keys(this.graph.links).length
  }

  private detectNewLinks(): void {
    if (this.syncing) return
    const count = Object.keys(this.graph.links).length
    if (count > this.lastLinkCount) {
      for (const link of Object.values(this.graph.links)) {
        if (link && !(link.data as { relId?: string } | undefined)?.relId) {
          const srcDomain = this.lgToDomain.get(link.origin_id)
          const tgtDomain = this.lgToDomain.get(link.target_id)
          if (srcDomain && tgtDomain) {
            link.color = RELATIONSHIP_COLORS['correlates-with']
            link.type = 'correlates-with'
            link.data = { label: 'correlates-with', relId: 'pending' }
            this.callbacks.onConnect(srcDomain, tgtDomain)
          }
        }
      }
    }
    this.lastLinkCount = count
  }

  private flushPositions(): void {
    if (this.syncing) return
    for (const node of this.graph._nodes) {
      const domainId = this.lgToDomain.get(node.id)
      if (!domainId) continue
      this.callbacks.onMoveNode(domainId, node.pos[0], node.pos[1])
    }
  }

  private drawDotGrid(
    ctx: CanvasRenderingContext2D,
    visibleArea: Float32Array | number[],
  ): void {
    const scale = this.canvas.ds.scale
    if (scale < 0.35) return

    const x0 = visibleArea[0]
    const y0 = visibleArea[1]
    const x1 = x0 + visibleArea[2]
    const y1 = y0 + visibleArea[3]
    const major = 80
    const minor = 20

    ctx.save()
    // Minor dots
    if (scale > 0.55) {
      ctx.fillStyle = 'rgba(90, 100, 120, 0.28)'
      const startX = Math.floor(x0 / minor) * minor
      const startY = Math.floor(y0 / minor) * minor
      for (let x = startX; x < x1; x += minor) {
        for (let y = startY; y < y1; y += minor) {
          if (x % major === 0 && y % major === 0) continue
          ctx.beginPath()
          ctx.arc(x, y, 1.1 / scale, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // Major dots
    ctx.fillStyle = 'rgba(120, 132, 156, 0.4)'
    const startMX = Math.floor(x0 / major) * major
    const startMY = Math.floor(y0 / major) * major
    for (let x = startMX; x < x1; x += major) {
      for (let y = startMY; y < y1; y += major) {
        ctx.beginPath()
        ctx.arc(x, y, 1.6 / scale, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  private drawEdgeLabels(ctx: CanvasRenderingContext2D): void {
    const scale = this.canvas.ds.scale
    if (scale < 0.55) return

    ctx.save()
    ctx.imageSmoothingEnabled = true
    for (const link of Object.values(this.graph.links)) {
      if (!link) continue
      const src = this.graph.getNodeById(link.origin_id)
      const tgt = this.graph.getNodeById(link.target_id)
      if (!src || !tgt) continue
      const label =
        (link.data as { label?: string } | undefined)?.label ??
        String(link.type ?? '')
      if (!label) continue

      const a = [src.pos[0] + src.size[0], src.pos[1] + src.size[1] * 0.5]
      const b = [tgt.pos[0], tgt.pos[1] + tgt.size[1] * 0.5]
      const px = (a[0] + b[0]) / 2
      const py = (a[1] + b[1]) / 2 - 4

      ctx.font = '600 10px "IBM Plex Mono", monospace'
      const tw = ctx.measureText(label).width
      const padX = 8
      const bw = tw + padX * 2
      const bh = 18

      ctx.beginPath()
      const r = 9
      const x = px - bw / 2
      const y = py - bh / 2
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + bw, y, x + bw, y + bh, r)
      ctx.arcTo(x + bw, y + bh, x, y + bh, r)
      ctx.arcTo(x, y + bh, x, y, r)
      ctx.arcTo(x, y, x + bw, y, r)
      ctx.closePath()
      ctx.fillStyle = 'rgba(18, 21, 28, 0.88)'
      ctx.fill()
      ctx.strokeStyle = (link.color as string) || '#6b7385'
      ctx.globalAlpha = 0.55
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillStyle = (link.color as string) || '#c5cad6'
      ctx.fillText(label, px - tw / 2, py + 3.5)
    }
    ctx.restore()
  }

  private drawMinimap(ctx: CanvasRenderingContext2D): void {
    const cssW = this.canvas.canvas.clientWidth || this.canvas.canvas.width
    const cssH = this.canvas.canvas.clientHeight || this.canvas.canvas.height
    const mw = 168
    const mh = 108
    const pad = 14
    const x = cssW - mw - pad
    const y = cssH - mh - pad

    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Glass panel
    ctx.beginPath()
    ctx.roundRect(x, y, mw, mh, 10)
    ctx.fillStyle = 'rgba(24, 28, 36, 0.92)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(80, 90, 110, 0.85)'
    ctx.lineWidth = 1
    ctx.stroke()

    if (!this.graph._nodes.length) {
      ctx.fillStyle = '#6b7385'
      ctx.font = '500 10px "IBM Plex Sans", sans-serif'
      ctx.fillText('No nodes', x + 14, y + 24)
      ctx.restore()
      return
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const n of this.graph._nodes) {
      minX = Math.min(minX, n.pos[0])
      minY = Math.min(minY, n.pos[1])
      maxX = Math.max(maxX, n.pos[0] + n.size[0])
      maxY = Math.max(maxY, n.pos[1] + n.size[1])
    }
    const bw = Math.max(1, maxX - minX)
    const bh = Math.max(1, maxY - minY)
    const scale = Math.min((mw - 20) / bw, (mh - 20) / bh)

    for (const n of this.graph._nodes) {
      const props = n.properties as { accent?: string; muted?: boolean }
      ctx.globalAlpha = props.muted ? 0.35 : 0.9
      ctx.fillStyle = props.accent ?? '#6b7385'
      const nx = x + 10 + (n.pos[0] - minX) * scale
      const ny = y + 10 + (n.pos[1] - minY) * scale
      ctx.beginPath()
      ctx.roundRect(
        nx,
        ny,
        Math.max(4, n.size[0] * scale),
        Math.max(3, n.size[1] * scale),
        2,
      )
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.restore()
  }
}
