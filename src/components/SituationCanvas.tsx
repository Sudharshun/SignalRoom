import { useEffect, useRef } from 'react'
import type { NodeType } from '../domain/nodes'
import { GraphAdapter } from '../graph/graphAdapter'
import { diagnosisLayout, recoveryPathLayout } from '../graph/layouts'
import { scaleToZoomBand } from '../graph/nodeStyles'
import { useIncidentStore } from '../store/incidentStore'

export function SituationCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const adapterRef = useRef<GraphAdapter | null>(null)

  const nodes = useIncidentStore((s) => s.nodes)
  const relationships = useIncidentStore((s) => s.relationships)
  const zoomBand = useIncidentStore((s) => s.ui.zoomBand)
  const focusNodeIds = useIncidentStore((s) => s.ui.focusNodeIds)
  const centerRequest = useIncidentStore((s) => s.ui.centerRequest)
  const layoutRequest = useIncidentStore((s) => s.ui.layoutRequest)
  const showDemo = useIncidentStore((s) => s.showDemo)
  const requestCenterOnNode = useIncidentStore((s) => s.requestCenterOnNode)
  const requestLayout = useIncidentStore((s) => s.requestLayout)
  const isEmpty = Object.keys(nodes).length === 0

  const selectNode = useIncidentStore((s) => s.selectNode)
  const updateNodePosition = useIncidentStore((s) => s.updateNodePosition)
  const addRelationship = useIncidentStore((s) => s.addRelationship)
  const addNode = useIncidentStore((s) => s.addNode)
  const deleteNode = useIncidentStore((s) => s.deleteNode)
  const setZoomBand = useIncidentStore((s) => s.setZoomBand)
  const updateNode = useIncidentStore((s) => s.updateNode)

  const loadDemo = () => {
    showDemo()
    window.setTimeout(() => {
      requestCenterOnNode('incident-checkout')
      requestLayout('diagnosis')
    }, 40)
  }

  // Init LiteGraph once
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const adapter = new GraphAdapter(canvas, {
      onSelectNode: (id) => selectNode(id),
      onMoveNode: (id, x, y) => updateNodePosition(id, x, y),
      onConnect: (sourceId, targetId) =>
        addRelationship(sourceId, targetId, 'correlates-with'),
      onZoom: (scale) => setZoomBand(scaleToZoomBand(scale), scale),
      onDeleteSelected: () => {
        const id = useIncidentStore.getState().ui.selectedNodeId
        if (id) deleteNode(id)
      },
    })
    adapterRef.current = adapter

    const ro = new ResizeObserver(() => {
      adapter.resize()
    })
    ro.observe(container)
    adapter.resize()

    // Initial sync
    const state = useIncidentStore.getState()
    adapter.sync({
      nodes: state.nodes,
      relationships: state.relationships,
      zoomBand: state.ui.zoomBand,
      focusNodeIds: state.ui.focusNodeIds,
    })

    return () => {
      ro.disconnect()
      adapter.destroy()
      adapterRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync domain → graph
  useEffect(() => {
    adapterRef.current?.sync({
      nodes,
      relationships,
      zoomBand,
      focusNodeIds,
    })
  }, [nodes, relationships, zoomBand, focusNodeIds])

  // Center requests
  useEffect(() => {
    if (!centerRequest) return
    adapterRef.current?.centerOnDomainId(centerRequest.nodeId)
  }, [centerRequest])

  // Diagnosis / recovery layouts
  useEffect(() => {
    if (!layoutRequest) return
    const state = useIncidentStore.getState()
    const positions =
      layoutRequest.mode === 'diagnosis'
        ? diagnosisLayout(state.nodes)
        : recoveryPathLayout(state.nodes)
    for (const [id, pos] of Object.entries(positions)) {
      updateNode(id, { position: pos })
    }
    // Center on incident after layout
    window.setTimeout(() => {
      adapterRef.current?.centerOnDomainId('incident-checkout')
      adapterRef.current?.setZoom(0.75)
      setZoomBand('medium', 0.75)
    }, 50)
  }, [layoutRequest, updateNode, setZoomBand])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/x-signalroom-node') as NodeType
    if (!type || !adapterRef.current || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const ds = adapterRef.current.canvas.ds
    const x = (e.clientX - rect.left) / ds.scale - ds.offset[0]
    const y = (e.clientY - rect.top) / ds.scale - ds.offset[1]
    addNode(type, { x, y })
  }

  return (
    <div
      ref={containerRef}
      className="relative min-w-0 flex-1 bg-canvas"
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      }}
      onDrop={onDrop}
    >
      <canvas ref={canvasRef} className="block h-full w-full outline-none" />
      <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-panel/80 px-2 py-1 text-[11px] text-text-muted ring-1 ring-border-subtle backdrop-blur">
        Zoom:{' '}
        <span className="font-mono text-text">
          {zoomBand === 'far' ? 'Far' : zoomBand === 'medium' ? 'Medium' : 'Close'}
        </span>
        <span className="mx-1.5 text-border">|</span>
        Pan · Scroll zoom · Drag palette
      </div>

      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div className="pointer-events-auto max-w-md rounded-xl border border-border bg-panel/95 px-6 py-5 text-center shadow-2xl backdrop-blur">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-text-dim">
              Blank situation room
            </div>
            <h2 className="mt-1 text-lg font-semibold text-text">
              Build the shared understanding
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Drag nodes from the palette, or load the seeded SEV1 checkout
              failure to explore the full Prod Call story.
            </p>
            <button
              type="button"
              onClick={loadDemo}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-200 ring-1 ring-rose-400/40 hover:bg-rose-500/25"
            >
              Show Demo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
