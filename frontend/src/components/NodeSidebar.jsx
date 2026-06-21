import { useRef, useState } from 'react'
import { Database, Filter, BrainCircuit, Sparkles, Upload, Trash2, Check, FileText } from 'lucide-react'
import usePipelineStore from '../store/pipelineStore'
import { datasetsApi } from '../api/client'

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

function DatasetSection() {
  const { datasets, setDatasets, datasetId, setPipelineMeta } = usePipelineStore()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const handleUpload = async (file) => {
    if (!file || !file.name.endsWith('.csv')) return
    setUploading(true)
    try {
      const res = await datasetsApi.upload(file)
      setDatasets([res.data, ...datasets])
      setPipelineMeta({ datasetId: res.data.id })
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try {
      await datasetsApi.delete(id)
      setDatasets(datasets.filter(d => d.id !== id))
      if (datasetId === id) setPipelineMeta({ datasetId: null, targetColumn: '' })
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  return (
    <div className="border-b border-border">
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={13} className="text-node-dataset" />
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Datasets
          </span>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-node-dataset/10 text-node-dataset hover:bg-node-dataset/20 border border-node-dataset/30 transition-all disabled:opacity-50"
        >
          <Upload size={10} />
          {uploading ? 'Lädt…' : 'Upload'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files[0])}
        />
      </div>

      {/* Drop zone */}
      <div
        className={`mx-3 mb-2 border-2 border-dashed rounded-lg p-3 text-center transition-all cursor-pointer
          ${dragOver
            ? 'border-node-dataset bg-node-dataset/10 text-node-dataset'
            : 'border-border text-text-muted hover:border-node-dataset/50'
          }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files[0]
          handleUpload(file)
        }}
        onClick={() => fileRef.current?.click()}
      >
        <FileText size={16} className="mx-auto mb-1 opacity-60" />
        <p className="text-[10px]">CSV hier ablegen oder klicken</p>
      </div>

      {/* Dataset list */}
      {datasets.length > 0 && (
        <div className="px-3 pb-3 space-y-1.5 max-h-48 overflow-y-auto">
          {datasets.map((d) => {
            const active = d.id === datasetId
            return (
              <div
                key={d.id}
                onClick={() => setPipelineMeta({ datasetId: d.id, targetColumn: '' })}
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all group
                  ${active
                    ? 'border-node-dataset bg-node-dataset/10'
                    : 'border-border hover:border-border-light hover:bg-card'
                  }`}
              >
                {/* Active check */}
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all
                  ${active ? 'border-node-dataset bg-node-dataset' : 'border-border'}`}>
                  {active && <Check size={9} className="text-white" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-medium truncate ${active ? 'text-node-dataset' : 'text-text-primary'}`}>
                    {d.name}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {d.rows?.toLocaleString()} Zeilen · {d.columns} Spalten
                  </p>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => handleDelete(e, d.id)}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {datasets.length === 0 && !uploading && (
        <p className="px-3 pb-3 text-[10px] text-text-muted">Noch kein Datensatz hochgeladen</p>
      )}
    </div>
  )
}

export default function NodeSidebar() {
  const { nodeRegistry } = usePipelineStore()

  const grouped = Object.entries(nodeRegistry).reduce((acc, [key, meta]) => {
    if (meta.category === 'dataset') return acc  // dataset handled separately
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
      {/* Dataset upload section */}
      <DatasetSection />
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
