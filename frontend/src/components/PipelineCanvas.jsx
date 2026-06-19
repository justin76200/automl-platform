import { useCallback, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import usePipelineStore from '../store/pipelineStore'
import DatasetNode from './nodes/DatasetNode'
import PreprocessorNode from './nodes/PreprocessorNode'
import ModelNode from './nodes/ModelNode'
import TunerNode from './nodes/TunerNode'

const nodeTypes = {
  datasetNode:      DatasetNode,
  preprocessorNode: PreprocessorNode,
  modelNode:        ModelNode,
  tunerNode:        TunerNode,
}

export default function PipelineCanvas() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addNode, nodeRegistry,
  } = usePipelineStore()

  const { screenToFlowPosition } = useReactFlow()
  const dropRef = useRef(null)

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      const nodeKey = e.dataTransfer.getData('nodeKey')
      if (!nodeKey || !nodeRegistry[nodeKey]) return

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      addNode(nodeKey, nodeRegistry[nodeKey], position)
    },
    [screenToFlowPosition, addNode, nodeRegistry],
  )

  return (
    <div ref={dropRef} className="flex-1 h-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        deleteKeyCode="Delete"
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{ animated: true, style: { stroke: '#7C3AED', strokeWidth: 2 } }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#30363D"
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            const cat = n.data?.category
            return cat === 'dataset' ? '#0EA5E9'
                 : cat === 'preprocessor' ? '#A855F7'
                 : cat === 'model' ? '#F59E0B'
                 : cat === 'tuner' ? '#10B981'
                 : '#30363D'
          }}
          maskColor="rgba(13,17,23,0.7)"
        />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-text-muted text-sm">Drag nodes from the left panel</p>
            <p className="text-text-muted/50 text-xs mt-1">
              Dataset → Preprocessors → Model → (Tuner)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
