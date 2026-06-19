import { Handle, Position } from '@xyflow/react'
import { BrainCircuit } from 'lucide-react'
import { useState } from 'react'
import usePipelineStore from '../../store/pipelineStore'

export default function ModelNode({ id, data, selected }) {
  const { updateNodeParams, nodeRegistry } = usePipelineStore()
  const [expanded, setExpanded] = useState(true)
  const meta = nodeRegistry[data.node_type] || {}

  return (
    <div className={`w-52 rounded-lg bg-card border shadow-node transition-all
      ${selected ? 'border-node-model shadow-node-selected' : 'border-border'}`}>

      <Handle type="target" position={Position.Left}
              className="!bg-node-model !border-node-model" />

      {/* Header */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border rounded-t-lg cursor-pointer"
        style={{ borderLeftWidth: 3, borderLeftColor: '#F59E0B' }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2">
          <BrainCircuit size={14} className="text-node-model" />
          <span className="font-medium text-text-primary text-xs">{data.label}</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-node-model/20 text-node-model">
          {meta.task || 'clf'}
        </span>
      </div>

      {/* Description */}
      {meta.description && (
        <p className="px-3 pt-2 text-text-muted text-xs">{meta.description}</p>
      )}

      {/* Params */}
      {expanded && Object.keys(data.params || {}).length > 0 && (
        <div className="p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
          {Object.entries(data.params).map(([key, val]) => (
            <div key={key}>
              <label className="text-xs text-text-muted block mb-1">{key}</label>
              <input
                className="w-full bg-panel border border-border rounded px-2 py-1 text-xs text-text-primary font-mono focus:outline-none focus:border-node-model"
                value={val ?? ''}
                onChange={(e) => {
                  const parsed = isNaN(e.target.value) ? e.target.value : Number(e.target.value)
                  updateNodeParams(id, { ...data.params, [key]: parsed })
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Tunable indicator */}
      {meta.tunable && (
        <div className="px-3 pb-2">
          <span className="text-[10px] text-node-tuner">
            ✦ {Object.keys(meta.tunable).length} tunable params
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Right}
              className="!bg-node-model !border-node-model" />
    </div>
  )
}
