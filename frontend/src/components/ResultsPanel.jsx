import { CheckCircle, XCircle, Loader, BarChart3, Clock } from 'lucide-react'
import usePipelineStore from '../store/pipelineStore'

function MetricCard({ label, value }) {
  return (
    <div className="bg-panel border border-border rounded-lg p-3">
      <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-text-primary text-lg font-mono font-medium">{value}</p>
    </div>
  )
}

export default function ResultsPanel() {
  const {
    experimentStatus,
    experimentMetrics,
    experimentLogs,
    experimentBestParams,
    activeExperiment,
  } = usePipelineStore()

  if (!activeExperiment) {
    return (
      <div className="w-72 h-full bg-panel border-l border-border flex flex-col items-center justify-center p-6">
        <BarChart3 size={28} className="text-text-muted mb-3" />
        <p className="text-text-muted text-sm text-center">
          Run a pipeline to see metrics here
        </p>
      </div>
    )
  }

  const StatusIcon = experimentStatus === 'completed' ? CheckCircle
    : experimentStatus === 'failed' ? XCircle
    : Loader

  const statusColor = experimentStatus === 'completed' ? 'text-success'
    : experimentStatus === 'failed' ? 'text-error'
    : 'text-accent animate-spin'

  return (
    <aside className="w-72 h-full bg-panel border-l border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <StatusIcon size={15} className={statusColor} />
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Experiment results
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Metrics grid */}
        {experimentMetrics && (
          <div className="p-4 border-b border-border">
            <p className="text-xs text-text-muted mb-3 uppercase tracking-wider">Metrics</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(experimentMetrics).map(([k, v]) => (
                <MetricCard key={k} label={k} value={typeof v === 'number' ? v.toFixed(4) : v} />
              ))}
            </div>
          </div>
        )}

        {/* Best params */}
        {experimentBestParams && (
          <div className="p-4 border-b border-border">
            <p className="text-xs text-text-muted mb-3 uppercase tracking-wider">Best params (Optuna)</p>
            <div className="space-y-1.5">
              {Object.entries(experimentBestParams).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary font-mono">{k}</span>
                  <span className="text-xs text-node-tuner font-mono">
                    {typeof v === 'number' ? v.toFixed(5) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live log */}
        <div className="p-4">
          <p className="text-xs text-text-muted mb-2 uppercase tracking-wider">Log</p>
          <div className="bg-surface rounded-lg p-3 max-h-64 overflow-y-auto font-mono text-[11px] text-text-secondary space-y-0.5">
            {experimentLogs.length === 0 && (
              <span className="text-text-muted">Waiting for logs…</span>
            )}
            {experimentLogs.map((line, i) => (
              <div key={i} className="leading-relaxed">{line}</div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
