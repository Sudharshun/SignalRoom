/**
 * LiteGraph integration shim.
 *
 * litegraph.js ships as an IIFE that attaches to a global. In Vite/ESM, `this`
 * inside that IIFE can be undefined, so we import the module and also read
 * from globalThis / the module namespace.
 *
 * Keep LiteGraph imports confined to `src/graph/*` so domain models stay pure.
 */

import 'litegraph.js/css/litegraph.css'
import * as LiteGraphModule from 'litegraph.js'

export interface LiteGraphRuntime {
  registerNodeType: (type: string, ctor: new () => unknown) => void
  createNode: (type: string) => LGNode
  registered_node_types: Record<string, unknown>
  NODE_TITLE_HEIGHT: number
  LINK_COLOR: string
  NODE_DEFAULT_COLOR: string
  NODE_DEFAULT_BGCOLOR: string
  NODE_TITLE_COLOR: string
  NODE_TEXT_COLOR: string
  DEFAULT_SHADOW_COLOR: string
  searchbox_extras: Record<string, unknown>
  NO_TITLE?: number
  TRANSPARENT_TITLE?: number
  ROUND_SHAPE?: number
  CARD_SHAPE?: number
  CIRCLE_SHAPE?: number
  SPLINE_LINK?: number
}

export interface LGNode {
  id: number
  title: string
  type?: string
  pos: [number, number]
  size: [number, number]
  flags: { collapsed?: boolean; horizontal?: boolean }
  properties: Record<string, unknown>
  boxcolor?: string
  color?: string
  bgcolor?: string
  shape?: string | number
  inputs?: {
    name: string
    type: string | number
    link: number | null
    color_on?: string
    color_off?: string
    shape?: number
  }[]
  outputs?: {
    name: string
    type: string | number
    links: number[] | null
    color_on?: string
    color_off?: string
    shape?: number
  }[]
  graph?: LGGraph | null
  addInput: (name: string, type: string | number) => void
  addOutput: (name: string, type: string | number) => void
  onDrawForeground?: (ctx: CanvasRenderingContext2D, graphCanvas: unknown) => void
  onDrawBackground?: (ctx: CanvasRenderingContext2D, graphCanvas: unknown) => void
  onSelected?: () => void
  onDeselected?: () => void
  computeSize?: () => [number, number]
}

export interface LGGraph {
  add: (node: LGNode) => void
  remove: (node: LGNode) => void
  clear: () => void
  start: (interval?: number) => void
  stop: () => void
  getNodeById: (id: number) => LGNode | null
  _nodes: LGNode[]
  links: Record<
    number,
    {
      id: number
      origin_id: number
      origin_slot: number
      target_id: number
      target_slot: number
      type?: string
      color?: string
      data?: unknown
    }
  >
  onNodeConnectionChange?: (
    direction: number,
    node: LGNode,
    slot: number,
    targetNode: LGNode | null,
    targetSlot: number,
  ) => void
}

export interface LGCanvas {
  graph: LGGraph | null
  canvas: HTMLCanvasElement
  bgcanvas?: HTMLCanvasElement
  ds: { scale: number; offset: [number, number] }
  selected_nodes: Record<number, LGNode>
  background_image: string | null
  clear_background_color: string
  render_canvas_border: boolean
  render_connections_border: boolean
  connections_width: number
  title_text_font: string
  inner_text_font: string
  allow_searchbox: boolean
  show_info?: boolean
  setGraph: (graph: LGGraph, skipClear?: boolean) => void
  setDirty: (fg?: boolean, bg?: boolean) => void
  resize: () => void
  draw: (force?: boolean, forceFG?: boolean) => void
  centerOnNode: (node: LGNode) => void
  setZoom: (value: number, center?: [number, number]) => void
  onNodeSelected?: (node: LGNode) => void
  onNodeDeselected?: (node: LGNode) => void
  onShowNodePanel?: (node: LGNode) => void
  onDrawForeground?: (ctx: CanvasRenderingContext2D) => void
  onDrawBackground?: (ctx: CanvasRenderingContext2D, visibleArea: unknown) => void
  onDrawOverlay?: (ctx: CanvasRenderingContext2D) => void
  pause_rendering?: boolean
  default_link_color?: string
}

type LGCtor = new (
  canvas?: HTMLCanvasElement | string | null,
  graph?: LGGraph | null,
  options?: object,
) => LGCanvas
type GraphCtor = new () => LGGraph

function resolveLiteGraph(): {
  LiteGraph: LiteGraphRuntime
  LGraph: GraphCtor
  LGraphCanvas: LGCtor
} {
  const root = globalThis as Record<string, unknown>
  const mod = LiteGraphModule as Record<string, unknown>

  const fromMod =
    (mod.LiteGraph as LiteGraphRuntime | undefined) ??
    ((mod.default as Record<string, unknown> | undefined)?.LiteGraph as
      | LiteGraphRuntime
      | undefined)

  const LiteGraph =
    (root.LiteGraph as LiteGraphRuntime | undefined) ??
    fromMod ??
    (mod as unknown as LiteGraphRuntime)

  const anyLG = LiteGraph as unknown as Record<string, unknown>

  const LGraph =
    (root.LGraph as GraphCtor | undefined) ??
    (mod.LGraph as GraphCtor | undefined) ??
    (anyLG.LGraph as GraphCtor | undefined)

  const LGraphCanvas =
    (root.LGraphCanvas as LGCtor | undefined) ??
    (mod.LGraphCanvas as LGCtor | undefined) ??
    (anyLG.LGraphCanvas as LGCtor | undefined)

  if (!LiteGraph?.registerNodeType || !LGraph || !LGraphCanvas) {
    throw new Error(
      'LiteGraph failed to initialize. Inspect litegraph.js import bindings.',
    )
  }

  // Normalize globals for any code paths that expect window.LiteGraph
  root.LiteGraph = LiteGraph
  root.LGraph = LGraph
  root.LGraphCanvas = LGraphCanvas

  return { LiteGraph, LGraph, LGraphCanvas }
}

const resolved = resolveLiteGraph()

export const LiteGraph = resolved.LiteGraph
export const LGraph = resolved.LGraph
export const LGraphCanvas = resolved.LGraphCanvas

export function configureLiteGraphTheme(): void {
  LiteGraph.NODE_DEFAULT_COLOR = '#2b303b'
  LiteGraph.NODE_DEFAULT_BGCOLOR = '#2b303b'
  LiteGraph.NODE_TITLE_COLOR = '#e8eaed'
  LiteGraph.NODE_TEXT_COLOR = '#9aa3b2'
  LiteGraph.DEFAULT_SHADOW_COLOR = 'rgba(0,0,0,0.4)'
  LiteGraph.LINK_COLOR = 'rgba(100,112,132,0.75)'
  LiteGraph.NODE_TITLE_HEIGHT = 0
}
