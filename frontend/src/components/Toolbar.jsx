import { Play, Save, Trash2, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import usePipelineStore from '../store/pipelineStore'
import { pipelinesApi, experimentsApi, createExperimentSocket } from '../api/client'

export default function Toolbar() {
  const {
    nodes, edges,
    pipelineName, pipelineId,
    targetColumn, taskType, datasetId,
    setPipelineMeta, clearCanvas,
    startExperiment, appendLog, finishExperiment,
    experimentStatus,
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

  const isRunning = experimentStatus === 'running'

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
      </div>

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
