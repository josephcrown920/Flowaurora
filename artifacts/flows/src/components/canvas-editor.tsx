import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  SelectionMode,
  useReactFlow,
  ReactFlowProvider,
  OnNodesChange,
  OnEdgesChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '@/components/nodes';
import { Toolbar } from '@/components/toolbar';
import { Header } from '@/components/header';
import { TEMPLATE_LAYOUTS } from '@/components/templates';
import { useGetProject, useUpdateProject, getGetProjectQueryKey } from '@workspace/api-client-react';
import { AgentPanel } from './agent-panel';

const DEFAULT_TEMPLATE = TEMPLATE_LAYOUTS['1'];

function getProjectIdFromUrl(): number | null {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('projectId');
  return id ? Number(id) : null;
}

function CanvasEditorInner() {
  const projectId = getProjectIdFromUrl();

  const { data: project, isLoading } = useGetProject(projectId ?? 0, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId ?? 0) }
  });
  const updateProject = useUpdateProject();

  const [nodes, setNodes, onNodesChange] = useNodesState(DEFAULT_TEMPLATE.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEFAULT_TEMPLATE.edges);
  const [activeTool, setActiveTool] = useState<'select' | 'pan' | 'cut'>('select');
  const [isRunning, setIsRunning] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [agentOpen, setAgentOpen] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  // Whether we've applied the saved state from the server
  const restoredRef = useRef(false);

  // Auto-save state machine:
  //   debounceTimer   – pending timer before we start the first/next request
  //   isInFlight      – a PATCH request is currently in progress
  //   pendingSnapshot – the latest dirty snapshot captured while isInFlight was true
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInFlight = useRef(false);
  const pendingSnapshot = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);

  // Restore canvas state when the project loads for the first time
  useEffect(() => {
    if (!project || restoredRef.current) return;
    restoredRef.current = true;

    if (project.canvasState) {
      try {
        const saved = JSON.parse(project.canvasState) as { nodes: Node[]; edges: Edge[] };
        if (saved.nodes && saved.edges) {
          setNodes(saved.nodes);
          setEdges(saved.edges);
          return;
        }
      } catch {
        // Malformed state — fall through to template default
      }
    }
    // No saved state: keep the template default already in place
  }, [project, setNodes, setEdges]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Fire a PATCH request with the given snapshot; on settle, send any newer
  // pending snapshot that accumulated while the request was in flight.
  const flushSave = useCallback(
    (snapshot: { nodes: Node[]; edges: Edge[] }) => {
      if (!projectId) return;
      isInFlight.current = true;
      const canvasState = JSON.stringify(snapshot);
      updateProject.mutate(
        { id: projectId, data: { canvasState } },
        {
          onSettled: () => {
            isInFlight.current = false;
            // If new edits arrived while we were saving, flush them now
            if (pendingSnapshot.current) {
              const next = pendingSnapshot.current;
              pendingSnapshot.current = null;
              flushSave(next);
            }
          },
        }
      );
    },
    [projectId, updateProject]
  );

  // Schedule a save after a quiet period. If a save is already in flight,
  // just update the pending snapshot — flushSave will pick it up on settle.
  const scheduleSave = useCallback(
    (nextNodes: Node[], nextEdges: Edge[]) => {
      if (!projectId || !restoredRef.current) return;

      const snapshot = { nodes: nextNodes, edges: nextEdges };

      if (isInFlight.current) {
        // Capture the latest state; it will be flushed after current request settles
        pendingSnapshot.current = snapshot;
        return;
      }

      // Debounce: reset the timer on every change
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null;
        flushSave(snapshot);
      }, 1000);
    },
    [projectId, flushSave]
  );

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      setNodes((nds) => {
        scheduleSave(nds, edges);
        return nds;
      });
    },
    [onNodesChange, setNodes, edges, scheduleSave]
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      setEdges((eds) => {
        scheduleSave(nodes, eds);
        return eds;
      });
    },
    [onEdgesChange, setEdges, nodes, scheduleSave]
  );

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges((eds) => {
        const next = addEdge({ ...params, animated: true }, eds);
        scheduleSave(nodes, next);
        return next;
      });
    },
    [setEdges, nodes, scheduleSave]
  );

  const onAddNode = (type: string) => {
    const center = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: center.x - 140, y: center.y - 100 },
      data: {},
    };
    setNodes((nds) => {
      const next = [...nds, newNode];
      scheduleSave(next, edges);
      return next;
    });
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
      scheduleSave(template.nodes, template.edges);
    }
  };

  const handleApplyWorkflow = (newNodes: Node[], newEdges: Edge[]) => {
    const ts = Date.now();
    // Stamp only the NEW nodes with fresh IDs; existing-node references in edges
    // are left as-is via the idMap fallback so they resolve against the live canvas.
    const stamped = newNodes.map(n => ({
      ...n,
      id: `agent-${ts}-${n.id}`,
    }));
    const idMap: Record<string, string> = {};
    newNodes.forEach((n, i) => { idMap[n.id] = stamped[i].id; });
    const stampedEdges = newEdges.map(e => ({
      ...e,
      id: `agent-e-${ts}-${e.id}`,
      // If the endpoint is a new node, remap it; otherwise keep the existing node's real ID.
      source: idMap[e.source] ?? e.source,
      target: idMap[e.target] ?? e.target,
    }));

    setNodes(nds => [...nds, ...stamped]);
    setEdges(eds => [...eds, ...stampedEdges]);
    scheduleSave([...nodes, ...stamped], [...edges, ...stampedEdges]);
  };

  if (projectId && isLoading) {
    return (
      <div className="w-full h-[100dvh] bg-background flex items-center justify-center">
        <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="w-full h-[100dvh] bg-background overflow-hidden relative font-sans text-foreground"
      data-running={isRunning}
    >
      <Header
        onRun={handleRun}
        isRunning={isRunning}
        onSelectTemplate={handleSelectTemplate}
        projectName={project?.title}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
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
        onOpenAgent={() => setAgentOpen(true)}
      />

      <AgentPanel
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        onApply={handleApplyWorkflow}
        onReplace={(newNodes, newEdges) => {
          setNodes(newNodes);
          setEdges(newEdges);
          scheduleSave(newNodes, newEdges);
        }}
        currentNodes={nodes
          .filter(n => n.type)
          .map(n => ({ id: n.id, type: n.type as string, position: n.position }))}
      />
    </div>
  );
}

export function CanvasEditor() {
  return (
    <ReactFlowProvider>
      <CanvasEditorInner />
    </ReactFlowProvider>
  );
}
