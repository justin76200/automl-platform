import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'

let nodeIdCounter = 0
const newId = (type) => `${type}_${++nodeIdCounter}`

const usePipelineStore = create((set, get) => ({
  // ── Canvas ──────────────────────────────────────────────────────────
  nodes: [],
  edges: [],

  onNodesChange: (changes) =>
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),

  onEdgesChange: (changes) =>
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

  onConnect: (connection) =>
    set((s) => ({ edges: addEdge({ ...connection, animated: true }, s.edges) })),

  addNode: (nodeTypeKey, meta, position) => {
    const id = newId(nodeTypeKey)
    const node = {
      id,
      type: meta.category === 'dataset' ? 'datasetNode'
          : meta.category === 'preprocessor' ? 'preprocessorNode'
          : meta.category === 'model' ? 'modelNode'
          : 'tunerNode',
      position,
      data: {
        label: meta.label,
        node_type: nodeTypeKey,
        params: { ...(meta.params ?? {}) },
        category: meta.category,
      },
    }
    set((s) => ({ nodes: [...s.nodes, node] }))
  },

  updateNodeParams: (nodeId, params) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, params } } : n
      ),
    })),

  clearCanvas: () => set({ nodes: [], edges: [] }),

  // ── Pipeline metadata ───────────────────────────────────────────────
  pipelineName:   'My Pipeline',
  pipelineId:     null,
  targetColumn:   '',
  taskType:       'classification',
  datasetId:      null,
  description:    '',

  setPipelineMeta: (meta) => set(meta),

  // ── Datasets & node registry ────────────────────────────────────────
  datasets:     [],
  nodeRegistry: {},

  setDatasets:     (datasets)     => set({ datasets }),
  setNodeRegistry: (nodeRegistry) => set({ nodeRegistry }),

  // ── Experiment ──────────────────────────────────────────────────────
  activeExperiment:   null,
  lastExperimentId:   null,
  experimentStatus:   null,  // pending | running | completed | failed
  experimentMetrics:  null,
  experimentLogs:     [],
  experimentBestParams: null,

  startExperiment: (id) =>
    set({
      activeExperiment: id,
      experimentStatus: 'running',
      experimentMetrics: null,
      experimentLogs: [],
      experimentBestParams: null,
    }),

  appendLog: (line) =>
    set((s) => ({ experimentLogs: [...s.experimentLogs, line] })),

  finishExperiment: (msg = {}) =>
    set((s) => ({ experimentStatus: msg.status || 'completed', 
      experimentMetrics: msg.metrics || null, 
      experimentBestParams: msg.best_params || null, 
      lastExperimentId: msg.experiment_id || null, })),
}))

export default usePipelineStore
