/// <reference types="vite/client" />

declare module 'litegraph.js' {
  const LiteGraph: unknown
  export default LiteGraph
  export const LGraph: unknown
  export const LGraphCanvas: unknown
  export const LGraphNode: unknown
  export { LiteGraph }
}

declare module 'litegraph.js/build/litegraph.js' {
  const LiteGraph: unknown
  export default LiteGraph
}
