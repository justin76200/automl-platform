import { Handle, Position } from '@xyflow/react'
import { Sparkles } from 'lucide-react'
import usePipelineStore from '../../store/pipelineStore'

export default function TunerNode({ id, data, selected }) {
  const { updateNodeParams } = usePipelineStore()
  const params = data.params || {}

  return (
    <div className={`w-48 rounded-lg bg-card border shadow-node transition-all
      ${selected ? 'border-node-tuner shadow-node-selected' : 'border-border'}`}>

      <Handle type="target" position={Position.Left}
              className="!bg-node-tuner !border-node-tuner" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border rounded-t-lg"
           style={{ borderLeftWidth: 3, borderLeftColor: '#10B981' }}>
        <Sparkles size={13} className="text-node-tuner" />
        <span className="font-medium text-text-primary text-xs">{data.label}</span>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
        <div>
          <label className="text-xs text-text-muted block mb-1">Trials</label>
          <input
            type="number" min={5} max={500}
            className="w-full bg-panel border border-border rounded px-2 py-1 text-xs text-text-primary font-mono focus:outline-none focus:border-node-tuner"
            value={params.n_trials ?? 30}
            onChange={(e) =>
              updateNodeParams(id, { ...params, n_trials: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">CV folds</label>
          <input
            type="number" min={2} max={10}
            className="w-full bg-panel border border-border rounded px-2 py-1 text-xs text-text-primary font-mono focus:outline-none focus:border-node-tuner"
            value={params.cv_folds ?? 5}
            onChange={(e) =>
              updateNodeParams(id, { ...params, cv_folds: Number(e.target.value) })
            }
          />
        </div>
        <p className="text-[10px] text-text-muted">
          Bayesian search via Optuna
        </p>
      </div>
    </div>
  )
}
