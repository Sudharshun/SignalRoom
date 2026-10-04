# SignalRoom · Prod Call Visual Situation Room

A functional prototype of a real-time **Visual Situation Room** for production incident / Prod Call sessions.

## Stack

- React + TypeScript + Vite
- LiteGraph.js (canvas / node graph)
- Zustand (domain + UI state, localStorage persistence)
- Tailwind CSS v4
- Lucide icons

## Run

```bash
# Node 20+ recommended (nvm use 22)
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

## Demo story (PC-1842 · SEV1)

The app starts on a **blank** situation room. Click **Show Demo** (header or empty-state CTA) to load PC-1842. While the demo is active the same control becomes **Reset Demo**.

You should then see checkout failures tied to Payments API 4.18, with three competing hypotheses:

| Hypothesis | Status | Confidence | Owner |
|---|---|---|---|
| Serialization regression | LIKELY | 82% | Alex |
| Database capacity | RULED OUT | 4% | Priya |
| Payment gateway vendor | INVESTIGATING | 35% | Sam |

Recovery path: **FIX FORWARD** → patch → staging validation → deploy → validate metrics.

## Key interactions

- **Canvas:** pan, zoom, drag nodes, connect nodes, select / delete
- **Palette:** drag node types onto the canvas
- **Inspector:** edit hypothesis status/confidence/owner, add evidence, create actions
- **Diagnosis View:** rearrange hypotheses for differential diagnosis
- **Catch Me Up:** 60-second late-joiner briefing
- **Timeline:** click events to focus related nodes
- **Simulate Incident:** animate error-rate recovery (31% → 2%)
- **Incident Copilot / Challenge:** mocked AI proposals (Accept / Dismiss)
- **Show / Reset Demo:** load or reload the seeded PC-1842 Prod Call incident

## Architecture

```
Incident Domain Model  →  Graph Adapter  →  LiteGraph nodes/links
        ↑
   Zustand store (+ domain events / timeline)
```

- `src/domain` — typed incident model (no LiteGraph imports)
- `src/graph` — LiteGraph shim, custom card nodes, adapter, layouts
- `src/store` — Zustand source of truth + localStorage
- `src/services` — mock telemetry & copilot (swap for WebSocket/API later)

LiteGraph is intentionally isolated behind the adapter so the domain model can be consumed by AI agents and backends independently of the canvas.
