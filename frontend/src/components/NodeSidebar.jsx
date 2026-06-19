import { Database, Filter, BrainCircuit, Sparkles } from 'lucide-react'
import usePipelineStore from '../store/pipelineStore'

const CATEGORY_META = {
  dataset:      { label: 'Dataset',       icon: Database,     color: '#0EA5E9' },
  preprocessor: { label: 'Preprocessors', icon: Filter,       color: '#A855F7' },
  model:        { label: 'Models',        icon: BrainCircuit, color: '#F59E0B' },
  tuner:        { label: 'Tuner',         icon: Sparkles,     color: '#10B981' },
}

function NodeItem({ nodeKey, meta, onDragStart }) {
  const catMeta = CATEGORY_META[meta.category] || {}
  const Icon = catMeta.icon || Filter

  return (
    <div
      className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border hover:border-border-light bg-panel hover:bg-card cursor-grab active:cursor-grabbing transition-all"
      draggable
      onDragStart={(e) => onDragStart(e, nodeKey)}
      title={meta.description}
    >
      <div className="mt-0.5 shrink-0">
        <Icon size={14} style={{ color: catMeta.color }} />
      </div>
      <div className="min-w-0">
        <p className="text-text-primary text-xs font-medium leading-tight truncate">
          {meta.label}
        </p>
        <p className="text-text-muted text-[10px] leading-tight mt-0.5 truncate">
          {meta.description}
        </p>
      </div>
    </div>
  )
}

export default function NodeSidebar() {
  const { nodeRegistry } = usePipelineStore()

  const grouped = Object.entries(nodeRegistry).reduce((acc, [key, meta]) => {
    const cat = meta.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push([key, meta])
    return acc
  }, {})

  const onDragStart = (e, nodeKey) => {
    e.dataTransfer.setData('nodeKey', nodeKey)
    e.dataTransfer.effectAllowed = 'move'
  }

  const order = ['dataset', 'preprocessor', 'model', 'tuner']

  return (
    <aside className="w-56 h-full bg-panel border-r border-border flex flex-col overflow-hidden">
      <div className="px-3 py-3 border-b border-border">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Node Palette
        </h2>
        <p className="text-text-muted text-[10px] mt-0.5">Drag nodes onto canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {order.map((cat) => {
          const items = grouped[cat]
          if (!items?.length) return null
          const { label, color } = CATEGORY_META[cat]
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 px-1 mb-2">
                <div className="h-px flex-1" style={{ background: color + '44' }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color }}>
                  {label}
                </span>
                <div className="h-px flex-1" style={{ background: color + '44' }} />
              </div>
              <div className="space-y-1.5">
                {items.map(([key, meta]) => (
                  <NodeItem key={key} nodeKey={key} meta={meta} onDragStart={onDragStart} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
