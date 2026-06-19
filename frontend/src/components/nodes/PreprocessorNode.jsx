import { Handle, Position } from '@xyflow/react'
import { Filter } from 'lucide-react'
import { useState } from 'react'
import usePipelineStore from '../../store/pipelineStore'

export default function PreprocessorNode({ id, data, selected }) {
  const { updateNodeParams, nodeRegistry } = usePipelineStore()
  const [expanded, setExpanded] = useState(false)
  const meta = nodeRegistry[data.node_type] || {}
  const paramOptions = meta.param_options || {}

  return (
    <div className={`w-48 rounded-lg bg-card border shadow-node transition-all
      ${selected ? 'border-node-pre shadow-node-selected' : 'border-border'}`}>

      <Handle type="target" position={Position.Left}
              className="!bg-node-pre !border-node-pre" />

      {/* Header */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border rounded-t-lg cursor-pointer"
        style={{ borderLeftWidth: 3, borderLeftColor: '#A855F7' }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-node-pre" />
          <span className="font-medium text-text-primary text-xs">{data.label}</span>
        </div>
        <span className="text-text-muted text-xs">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Params (collapsible) */}
      {expanded && Object.keys(data.params || {}).length > 0 && (
        <div className="p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
          {Object.entries(data.params).map(([key, val]) => (
            <div key={key}>
              <label className="text-xs text-text-muted block mb-1">{key}</label>
              {paramOptions[key] ? (
                <select
                  className="w-full bg-panel border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-node-pre"
                  value={val}
                  onChange={(e) => updateNodeParams(id, { ...data.params, [key]: e.target.value })}
                >
                  {paramOptions[key].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="w-full bg-panel border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-node-pre"
                  value={val ?? ''}
                  onChange={(e) => updateNodeParams(id, { ...data.params, [key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Right}
              className="!bg-node-pre !border-node-pre" />
    </div>
  )
}
