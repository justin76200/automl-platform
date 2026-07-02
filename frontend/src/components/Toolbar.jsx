import { Play, Save, Download, Trash2, Database, ChevronDown, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import usePipelineStore from '../store/pipelineStore'
import { pipelinesApi, experimentsApi, createExperimentSocket } from '../api/client'

function DatasetBadge() {
  const { datasets, datasetId, targetColumn, setPipelineMeta } = usePipelineStore()
  const [open, setOpen] = useState(false)
  const active = datasets.find(d => d.id === datasetId)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all
          ${active
            ? 'border-node-dataset/50 bg-node-dataset/10 text-node-dataset'
            : 'border-border text-text-muted hover:border-border-light'
          }`}
      >
        <Database size={13} />
        <span className="max-w-32 truncate">
          {active ? active.name : 'Kein Datensatz'}
        </span>
        {active && (
          <span className="text-[10px] text-text-muted font-normal">
            {active.rows?.toLocaleString()} Zeilen
          </span>
        )}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-1 left-0 w-72 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Dataset list */}
          <div className="max-h-48 overflow-y-auto">
            {datasets.length === 0 && (
              <p className="px-3 py-3 text-xs text-text-muted">
                Kein Datensatz – bitte links hochladen
              </p>
            )}
            {datasets.map(d => (
              <button
                key={d.id}
                onClick={() => { setPipelineMeta({ datasetId: d.id, targetColumn: '' }); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-panel transition-all
                  ${d.id === datasetId ? 'bg-node-dataset/10' : ''}`}
              >
                <Database size={13} className={d.id === datasetId ? 'text-node-dataset' : 'text-text-muted'} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${d.id === datasetId ? 'text-node-dataset' : 'text-text-primary'}`}>
                    {d.name}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {d.rows?.toLocaleString()} Zeilen · {d.columns} Spalten
                  </p>
                </div>
                {d.id === datasetId && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-node-dataset/20 text-node-dataset">aktiv</span>
                )}
              </button>
            ))}
          </div>

          {/* Target column selector */}
          {active && (
            <div className="border-t border-border px-3 py-2.5 bg-panel">
              <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
                Zielspalte (Target)
              </label>
              <select
                className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-node-dataset"
                value={targetColumn || ''}
                onChange={(e) => { setPipelineMeta({ targetColumn: e.target.value }); setOpen(false) }}
              >
                <option value="">— Spalte wählen —</option>
                {(active.column_names || []).map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}

function ActivePipelineInfo() {
  const { datasetId, targetColumn, taskType, datasets } = usePipelineStore()
  const dataset = datasets.find(d => d.id === datasetId)

  if (!dataset) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-surface border border-border text-[10px]">
      <span className="text-text-muted">Task:</span>
      <span className="text-text-secondary font-medium">{taskType}</span>
      {targetColumn && (
        <>
          <span className="text-border">·</span>
          <span className="text-text-muted">Target:</span>
          <span className="text-node-model font-medium font-mono">{targetColumn}</span>
        </>
      )}
    </div>
  )
}

export default function Toolbar() {
  const {
    nodes, edges,
    pipelineName, pipelineId,
    targetColumn, taskType, datasetId,
    setPipelineMeta, clearCanvas,
    startExperiment, appendLog, finishExperiment,
    experimentStatus,
    lastExperimentId,
  } = usePipelineStore()

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!nodes.length) return
    setSaving(true)
    try {
      const body = {
        name: pipelineName,
        nodes,
        edges,
        target_column: targetColumn,
        task_type: taskType,
        dataset_id: datasetId,
      }
      if (pipelineId) {
        await pipelinesApi.update(pipelineId, body)
      } else {
        const res = await pipelinesApi.create(body)
        setPipelineMeta({ pipelineId: res.data.id })
      }
    } catch (err) {
      console.error('Save failed', err)
    } finally {
      setSaving(false)
    }
  }

  const handleRun = async () => {
    if (!pipelineId) {
      // Auto-save first
      await handleSave()
    }
    const id = usePipelineStore.getState().pipelineId
    if (!id) return

    try {
      const res = await experimentsApi.run(id)
      const expId = res.data.id
      startExperiment(expId)

      const ws = createExperimentSocket(expId)
      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data)
        console.log('WS message:', msg) 
        if (msg.type === 'log') appendLog(msg.message)
        if (msg.type === 'done') {
          finishExperiment(msg)
          ws.close()
        }
      }
      ws.onerror = () => ws.close()
    } catch (err) {
      console.error('Run failed', err)
    }
  }

  const handleExport = () => {
  window.open(
    `http://localhost:8000/api/experiments/download/${lastExperimentId}`,
    '_blank'
  )
}

  const isRunning = experimentStatus === 'running'

  console.log('TOOLBAR →', { lastExperimentId, experimentStatus })
  
  return (
    <header className="h-12 bg-panel border-b border-border flex items-center px-4 gap-4 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">A</span>
        </div>
        <span className="text-text-primary text-sm font-semibold">AutoML</span>
      </div>

      {/* Pipeline name */}
      <input
        className="bg-transparent border-b border-transparent hover:border-border focus:border-accent text-text-primary text-sm focus:outline-none w-40 transition-colors"
        value={pipelineName}
        onChange={(e) => setPipelineMeta({ pipelineName: e.target.value })}
      />

      {/* Task type */}
      <div className="flex items-center gap-1 text-xs">
        <span className="text-text-muted">Task:</span>
        <select
          className="bg-card border border-border rounded px-2 py-1 text-text-primary text-xs focus:outline-none focus:border-accent"
          value={taskType}
          onChange={(e) => setPipelineMeta({ taskType: e.target.value })}
        >
          <option value="classification">Classification</option>
          <option value="regression">Regression</option>
        </select>

        {/* Dataset badge – shows active dataset + dropdown to switch */}
      <DatasetBadge />

      {/* Active pipeline info */}
      <ActivePipelineInfo />

      {/* Warning if target missing */}
      {datasetId && !targetColumn && (
        <div className="flex items-center gap-1.5 text-warning text-[11px]">
          <AlertCircle size={12} />
          <span>Zielspalte wählen</span>
        </div>
      )}</div>

      <div className="flex-1" />

      {/* Actions */}
      <button
        onClick={clearCanvas}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-text-secondary hover:text-error hover:bg-error/10 border border-transparent hover:border-error/30 transition-all"
      >
        <Trash2 size={13} />
        Clear
      </button>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border border-border text-text-secondary hover:text-text-primary hover:border-border-light transition-all disabled:opacity-50"
      >
        <Save size={13} />
        {saving ? 'Saving…' : 'Save'}
      </button>

      <button
        onClick={handleExport}
        disabled={!lastExperimentId || experimentStatus === 'running'}
        title={!lastExperimentId ? 'Erst ein Experiment erfolgreich abschließen' : 'Modell als ONNX exportieren'}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border border-border text-text-secondary hover:text-text-primary hover:border-border-light transition-all disabled:opacity-40 disabled:cursor-not-allowed"
>
        <Download size={13} />
        Export
      </button>

      <button
        onClick={handleRun}
        disabled={isRunning || !nodes.length}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs bg-accent hover:bg-accent-hover text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Play size={13} />
        {isRunning ? 'Running…' : 'Run pipeline'}
      </button>
    </header>
  )
}
