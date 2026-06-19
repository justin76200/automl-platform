import { Handle, Position } from '@xyflow/react'
import { Database } from 'lucide-react'
import usePipelineStore from '../../store/pipelineStore'

export default function DatasetNode({ id, data, selected }) {
  const { datasets, setPipelineMeta, datasetId, targetColumn } = usePipelineStore()
  const dataset = datasets.find((d) => d.id === datasetId)

  return (
    <div className={`w-52 rounded-lg bg-card border shadow-node transition-all
      ${selected ? 'border-node-dataset shadow-node-selected' : 'border-border'}`}>
      
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border rounded-t-lg"
           style={{ borderLeftWidth: 3, borderLeftColor: '#0EA5E9' }}>
        <Database size={14} className="text-node-dataset" />
        <span className="font-medium text-text-primary text-xs">{data.label}</span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        <div>
          <label className="text-xs text-text-muted block mb-1">Dataset</label>
          <select
            className="w-full bg-panel border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-node-dataset"
            value={datasetId || ''}
            onChange={(e) => setPipelineMeta({ datasetId: e.target.value })}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">— select dataset —</option>
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {dataset && (
          <>
            <div>
              <label className="text-xs text-text-muted block mb-1">Target column</label>
              <select
                className="w-full bg-panel border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-node-dataset"
                value={targetColumn || ''}
                onChange={(e) => setPipelineMeta({ targetColumn: e.target.value })}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">— select target —</option>
                {(dataset.column_names || []).map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            <p className="text-text-muted text-xs">
              {dataset.rows?.toLocaleString()} rows · {dataset.columns} cols
            </p>
          </>
        )}
      </div>

      <Handle type="source" position={Position.Right}
              className="!bg-node-dataset !border-node-dataset" />
    </div>
  )
}
