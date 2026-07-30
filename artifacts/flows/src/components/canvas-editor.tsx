import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
  SelectionMode,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '@/components/nodes';
import { Toolbar } from '@/components/toolbar';
import { Header } from '@/components/header';
import { TEMPLATE_LAYOUTS } from '@/components/templates';

const initialNodes = TEMPLATE_LAYOUTS['1'].nodes;
const initialEdges = TEMPLATE_LAYOUTS['1'].edges;

interface CanvasEditorProps {
  projectId: number;
  onClose: () => void;
}

function CanvasEditorInner({ projectId, onClose }: CanvasEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [activeTool, setActiveTool] = useState<'select' | 'pan' | 'cut'>('select');
  const [isRunning, setIsRunning] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  );

  const onAddNode = (type: string) => {
    const center = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });
    
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: center.x - 140, y: center.y - 100 },
      data: {}
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 3000);
  };

  const handleSelectTemplate = (id: string) => {
    const template = TEMPLATE_LAYOUTS[id];
    if (template) {
      setNodes(template.nodes);
      setEdges(template.edges);
    }
  };

  return (
    <div 
      className="w-full h-[100dvh] bg-background overflow-hidden relative font-sans text-foreground"
      data-running={isRunning}
    >
      <Header 
        onRun={handleRun} 
        isRunning={isRunning} 
        onSelectTemplate={handleSelectTemplate} 
        onClose={onClose}
      />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        panOnDrag={activeTool === 'pan' ? true : [1, 2]}
        selectionOnDrag={activeTool === 'select'}
        selectionMode={activeTool === 'select' ? SelectionMode.Partial : SelectionMode.Full}
        proOptions={{ hideAttribution: true }}
        className="dark"
        minZoom={0.2}
        maxZoom={4}
      >
        {showGrid && (
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={24} 
            size={2} 
            color="hsl(var(--muted-foreground)/0.3)" 
          />
        )}
        <Controls 
          position="bottom-right" 
          className="bg-card border-border shadow-lg !mb-20"
          showInteractive={false}
        />
      </ReactFlow>

      <Toolbar 
        onAddNode={onAddNode} 
        activeTool={activeTool} 
        setActiveTool={setActiveTool}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
      />
    </div>
  );
}

export function CanvasEditor(props: CanvasEditorProps) {
  return (
    <ReactFlowProvider>
      <CanvasEditorInner {...props} />
    </ReactFlowProvider>
  );
}