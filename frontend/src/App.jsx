import { useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'

import usePipelineStore from './store/pipelineStore'
import { datasetsApi, pipelinesApi } from './api/client'

import Toolbar from './components/Toolbar'
import NodeSidebar from './components/NodeSidebar'
import PipelineCanvas from './components/PipelineCanvas'
import ResultsPanel from './components/ResultsPanel'

export default function App() {
  const { setDatasets, setNodeRegistry } = usePipelineStore()

  useEffect(() => {
    // Load node palette from backend
    pipelinesApi.nodes()
      .then((r) => setNodeRegistry(r.data))
      .catch(console.error)

    // Load existing datasets
    datasetsApi.list()
      .then((r) => setDatasets(r.data))
      .catch(console.error)
  }, [])

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-surface">
        <Toolbar />
        <div className="flex flex-1 overflow-hidden relative">
          <NodeSidebar />
          <PipelineCanvas />
          <ResultsPanel />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
