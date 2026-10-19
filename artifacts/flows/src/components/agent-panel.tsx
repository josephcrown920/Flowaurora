import React, { useState, useRef, useEffect } from 'react';
import { Clapperboard, X, Sparkles, ArrowRight, RotateCcw, Loader2, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Node, Edge } from '@xyflow/react';
import { ScrollArea } from '@/components/ui/scroll-area';

const NODE_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  DirectorNode: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  CharacterNode: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  ImageGenNode: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  LTXProNode: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  NanoBananaProNode: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  PromptNode: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  PromptBuilderNode: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  default: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },
};

const NODE_LABELS: Record<string, string> = {
  DirectorNode: 'Director',
  CharacterNode: 'Character',
  ImageGenNode: 'Image Gen',
  LTXProNode: 'LTX',
  NanoBananaProNode: 'Video',
  PromptNode: 'Prompt',
  PromptBuilderNode: 'Builder',
  ImageUploadNode: 'Image',
  VideoUploadNode: 'Video',
  AudioUploadNode: 'Audio',
  ImageIteratorNode: 'Images',
  TextIteratorNode: 'Texts',
  RemoveBackgroundNode: 'Rmbg',
  TopazUpscaleNode: 'Upscale',
  VideoExtendNode: 'Extend',
  ExtractFrameNode: 'Frame',
  DubbingNode: 'Dub',
};

const STREAM_IDLE_TIMEOUT_MS = 20_000;

interface CanvasNodeRef {
  id: string;
  type: string;
  position: { x: number; y: number };
}

interface AgentPanelProps {
  open: boolean;
  onClose: () => void;
  /** Append the AI-generated nodes/edges to the current canvas */
  onApply: (nodes: Node[], edges: Edge[]) => void;
  /** Replace the entire canvas with the AI-generated nodes/edges */
  onReplace: (nodes: Node[], edges: Edge[]) => void;
  currentNodes?: CanvasNodeRef[];
}

type ApplyMode = 'extend' | 'replace';

interface Generation {
  id: string;
  description: string;
  explanation: string;
  nodes: Node[];
  edges: Edge[];
  /** The mode the user selected when this generation was triggered */
  mode: ApplyMode;
}

/** Extract complete JSON objects from a running text buffer, returning them and the remaining unparsed tail */
function extractNextObject(text: string): { obj: unknown; rest: string } | null {
  let depth = 0;
  let inString = false;
  let escape = false;
  let start = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const slice = text.slice(start, i + 1);
        try {
          const obj = JSON.parse(slice);
          return { obj, rest: text.slice(i + 1) };
        } catch {
          // Not valid JSON yet, keep scanning
          start = -1;
        }
      }
    }
  }
  return null;
}

/**
 * Incrementally extract nodes from accumulated streaming text.
 * Looks for the "nodes" array and parses complete node objects one by one.
 */
function extractObjectsFromArray<T>(text: string, key: string): T[] {
  const arrayIdx = text.indexOf(`"${key}"`);
  if (arrayIdx === -1) return [];

  const bracketIdx = text.indexOf('[', arrayIdx);
  if (bracketIdx === -1) return [];

  const objects: T[] = [];
  let remaining = text.slice(bracketIdx + 1);

  while (remaining.length > 0) {
    const trimmed = remaining.replace(/^[\s,]+/, '');
    if (trimmed.startsWith(']')) break;
    remaining = trimmed;

    const result = extractNextObject(remaining);
    if (!result) break;

    try {
      objects.push(result.obj as T);
    } catch {
      // Ignore malformed entries and continue with the next complete object.
    }
    remaining = result.rest;
  }

  return objects;
}

function extractNodesFromText(text: string): Node[] {
  return extractObjectsFromArray<Node>(text, 'nodes')
    .filter((node) => Boolean(node.id && node.type));
}

function extractEdgesFromText(text: string): Edge[] {
  return extractObjectsFromArray<Edge>(text, 'edges')
    .filter((edge) => Boolean(edge.id && edge.source && edge.target));
}

/**
 * Decode the explanation value as it is being generated in partial JSON text.
 * Incomplete escape sequences are held back until the next stream chunk.
 */
function extractExplanation(text: string): string | null {
  const match = /"explanation"\s*:\s*"/.exec(text);
  if (!match || match.index === undefined) return null;

  let explanation = '';
  const valueStart = match.index + match[0].length;
  for (let i = valueStart; i < text.length; i += 1) {
    const character = text[i];
    if (character === '"') return explanation;
    if (character !== '\\') {
      explanation += character;
      continue;
    }

    const escape = text[i + 1];
    if (escape === undefined) break;
    const escapedCharacters: Record<string, string> = {
      '"': '"',
      '\\': '\\',
      '/': '/',
      b: '\b',
      f: '\f',
      n: '\n',
      r: '\r',
      t: '\t',
    };
    if (escape === 'u') {
      const hex = text.slice(i + 2, i + 6);
      if (hex.length < 4 || !/^[\da-f]{4}$/i.test(hex)) break;
      explanation += String.fromCharCode(parseInt(hex, 16));
      i += 5;
    } else {
      const decoded = escapedCharacters[escape];
      if (decoded === undefined) break;
      explanation += decoded;
      i += 1;
    }
  }

  return explanation;
}

function NodePill({ type, animate }: { type: string; animate?: boolean }) {
  const color = NODE_COLORS[type] || NODE_COLORS.default;
  const label = NODE_LABELS[type] || type.replace('Node', '');
  return (
    <div className={cn(
      "px-2.5 py-1.5 rounded-full border text-[11px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5",
      color.bg, color.text, color.border,
      animate && "animate-in fade-in slide-in-from-bottom-2 duration-300"
    )}>
      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
      {label}
    </div>
  );
}

export function AgentPanel({ open, onClose, onApply, onReplace, currentNodes = [] }: AgentPanelProps) {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<'claude' | 'modelark' | 'openai' | 'openrouter'>('claude');
  const [modelArkModels, setModelArkModels] = useState<string[]>([]);
  const [openAiModels, setOpenAiModels] = useState<Array<{ id: string; name: string }>>([]);
  const [openRouterModels, setOpenRouterModels] = useState<Array<{ id: string; name: string }>>([]);
  const [openAiAvailable, setOpenAiAvailable] = useState<boolean | null>(null);
  const [openAiAccessMode, setOpenAiAccessMode] = useState<'replit' | 'direct' | 'unavailable' | null>(null);
  const [openRouterAccessMode, setOpenRouterAccessMode] = useState<'replit' | 'direct' | 'unavailable' | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [modelArkError, setModelArkError] = useState('');
  const [openAiError, setOpenAiError] = useState('');
  const [openRouterError, setOpenRouterError] = useState('');
  const [history, setHistory] = useState<Generation[]>([]);
  const [currentGen, setCurrentGen] = useState<Generation | null>(null);
  // Mode is only meaningful when canvas has existing nodes
  const [mode, setMode] = useState<ApplyMode>('extend');

  // Streaming state
  const [streamingNodes, setStreamingNodes] = useState<Node[]>([]);
  const [streamingExplanation, setStreamingExplanation] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const streamingTextRef = useRef('');
  const streamingNodesRef = useRef<Node[]>([]);
  const streamingEdgesRef = useRef<Edge[]>([]);
  const streamingExplanationRef = useRef<string | null>(null);
  const knownNodeCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/modelark/models')
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'ModelArk model list unavailable.');
        return payload?.models as Array<{ id: string; capability: string }>;
      })
      .then((models) => {
        if (!active || !Array.isArray(models)) return;
        const languageModels = models
          .filter((entry) => entry.capability === 'language')
          .map((entry) => entry.id);
        setModelArkModels(languageModels);
      })
      .catch((error) => {
        if (active) setModelArkError(error instanceof Error ? error.message : 'ModelArk model list unavailable.');
      });
    fetch('/api/ai/models')
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'OpenAI model list unavailable.');
        return {
          models: payload?.models as Array<{ id: string; name: string }>,
          available: payload?.available === true,
          accessMode: ['replit', 'direct', 'unavailable'].includes(payload?.accessMode)
            ? payload.accessMode as 'replit' | 'direct' | 'unavailable'
            : 'unavailable',
        };
      })
      .then(({ models, available, accessMode }) => {
        if (active && Array.isArray(models)) {
          setOpenAiModels(models);
          setOpenAiAvailable(available);
          setOpenAiAccessMode(accessMode);
        }
      })
      .catch((error) => {
        if (active) setOpenAiError(error instanceof Error ? error.message : 'OpenAI model list unavailable.');
      });
    fetch('/api/openrouter/models')
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'OpenRouter model list unavailable.');
        const accessMode = ['replit', 'direct', 'unavailable'].includes(payload?.accessMode)
          ? payload.accessMode as 'replit' | 'direct' | 'unavailable'
          : 'unavailable';
        return {
          models: payload?.models as Array<{ id: string; name: string }>,
          accessMode,
        };
      })
      .then(({ models, accessMode }) => {
        if (active && Array.isArray(models)) {
          setOpenRouterModels(models);
          setOpenRouterAccessMode(accessMode);
        }
      })
      .catch((error) => {
        if (active) setOpenRouterError(error instanceof Error ? error.message : 'OpenRouter model list unavailable.');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (provider === 'claude') return;
    const choices =
      provider === 'modelark' ? modelArkModels :
      provider === 'openai' ? openAiModels :
      openRouterModels;
    const ids = choices.map((choice) => typeof choice === 'string' ? choice : choice.id);
    if (!ids.includes(selectedModel)) setSelectedModel(ids[0] || '');
  }, [provider, modelArkModels, openAiModels, openRouterModels, selectedModel]);

  const hasCanvas = currentNodes.length > 0;
  const currentTypes = Array.from(new Set(currentNodes.map(n => n.type)));
  const currentModels =
    provider === 'modelark' ? modelArkModels.map((id) => ({ id, name: id })) :
    provider === 'openai' ? openAiModels :
    provider === 'openrouter' ? openRouterModels :
    [];
  const currentModelError =
    provider === 'modelark' ? modelArkError :
    provider === 'openai' ? openAiError :
    provider === 'openrouter' ? openRouterError :
    '';
  const providerAccessNote =
    provider === 'openai' && openAiAccessMode === 'direct'
      ? 'Using your OpenAI API key; these requests are billed by OpenAI, not Replit credits.'
      : provider === 'openai' && openAiAccessMode === 'replit'
        ? 'Using Replit AI Integrations for these requests.'
        : provider === 'openai' && (openAiAvailable === false || openAiAccessMode === 'unavailable')
          ? 'OpenAI access is unavailable. Check the configured key and account access.'
      : provider === 'openrouter' && openRouterAccessMode === 'direct'
        ? 'Using your OpenRouter key; these requests do not use Replit credits.'
        : provider === 'openrouter' && openRouterAccessMode === 'replit'
          ? 'Using Replit AI Integrations for these requests.'
          : provider === 'openrouter' && openRouterAccessMode === 'unavailable'
            ? 'No OpenRouter request credentials are available.'
            : '';

  // The current mode for a new generation
  const effectiveMode: ApplyMode = hasCanvas ? mode : 'replace';

  const handleCancel = () => {
    const controller = abortControllerRef.current;
    if (!controller) return;

    abortControllerRef.current = null;
    controller.abort();
    setIsLoading(false);
    setStreamingNodes([]);
    setStreamingExplanation(null);
    setStreamError(null);
    streamingTextRef.current = '';
    streamingNodesRef.current = [];
    streamingEdgesRef.current = [];
    streamingExplanationRef.current = null;
    knownNodeCountRef.current = 0;
  };

  const handleBuild = async () => {
    if (!description.trim() || abortControllerRef.current) return;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    setStreamError(null);

    // Reset streaming state
    setStreamingNodes([]);
    setStreamingExplanation(null);
    streamingTextRef.current = '';
    streamingNodesRef.current = [];
    streamingEdgesRef.current = [];
    streamingExplanationRef.current = null;
    knownNodeCountRef.current = 0;

    const sendCurrentNodes = hasCanvas && mode === 'extend';
    const capturedDescription = description;
    let recoverPartial: (() => boolean) | undefined;
    let cleanupStream: (() => void) | undefined;

    try {
      const res = await fetch('/api/director/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: capturedDescription,
          currentNodes: sendCurrentNodes ? currentNodes : undefined,
          provider,
          model: provider === 'modelark' ? selectedModel : undefined,
          ...(provider === 'openai' || provider === 'openrouter' ? { model: selectedModel } : {}),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        let message = `Director AI request failed (${res.status}). Please try again.`;
        try {
          const payload = await res.json();
          if (typeof payload?.error === 'string') message = payload.error;
        } catch {
          // Keep the status-based message when the response has no JSON body.
        }
        setStreamError(message);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';
      let idleTimedOut = false;
      let receivedDone = false;
      let receivedError: string | null = null;
      let idleTimer: ReturnType<typeof setTimeout> | undefined;

      const clearIdleTimer = () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = undefined;
      };
      cleanupStream = clearIdleTimer;

      const resetIdleTimer = () => {
        clearIdleTimer();
        idleTimer = setTimeout(() => {
          idleTimedOut = true;
          void reader.cancel().catch(() => undefined);
        }, STREAM_IDLE_TIMEOUT_MS);
      };

      const setPartialState = (text: string) => {
        const explanation = extractExplanation(text);
        if (explanation !== null) {
          streamingExplanationRef.current = explanation;
          setStreamingExplanation(explanation);
        }

        const nodes = extractNodesFromText(text);
        if (nodes.length >= streamingNodesRef.current.length) {
          streamingNodesRef.current = nodes;
          if (nodes.length > knownNodeCountRef.current) {
            knownNodeCountRef.current = nodes.length;
            setStreamingNodes(nodes);
          }
        }
        const edges = extractEdgesFromText(text);
        if (edges.length >= streamingEdgesRef.current.length) {
          streamingEdgesRef.current = edges;
        }
      };

      const finishWithWorkflow = (workflow?: unknown) => {
        const wf = workflow && typeof workflow === 'object'
          ? workflow as { explanation?: string; nodes?: Node[]; edges?: Edge[] }
          : undefined;
        const nodes = Array.isArray(wf?.nodes) ? wf.nodes : streamingNodesRef.current;
        const edges = Array.isArray(wf?.edges) ? wf.edges : streamingEdgesRef.current;
        const newGen: Generation = {
          id: Date.now().toString(),
          description: capturedDescription,
          mode: effectiveMode,
          explanation: wf?.explanation ?? streamingExplanationRef.current ?? '',
          nodes,
          edges,
        };
        if (currentGen) setHistory(prev => [currentGen, ...prev]);
        setCurrentGen(newGen);
        setStreamingNodes([]);
        setStreamingExplanation(null);
        setDescription('');
      };
      recoverPartial = () => {
        if (streamingNodesRef.current.length === 0 || streamingEdgesRef.current.length === 0) {
          return false;
        }
        finishWithWorkflow();
        return true;
      };

      const processSSELine = (line: string) => {
        if (!line.startsWith('data: ')) return;
        const jsonStr = line.slice(6);
        let event: { type: string; text?: string; workflow?: unknown; error?: string };
        try {
          event = JSON.parse(jsonStr);
        } catch {
          return;
        }

        if (event.type === 'chunk' && event.text) {
          resetIdleTimer();
          streamingTextRef.current += event.text;
          setPartialState(streamingTextRef.current);
        } else if (event.type === 'done' && event.workflow) {
          receivedDone = true;
          clearIdleTimer();
          finishWithWorkflow(event.workflow);
        } else if (event.type === 'error') {
          console.error('Director stream error:', event.error);
          receivedError = event.error || 'Director AI could not complete this workflow. Please try again.';
          clearIdleTimer();
          setStreamError(receivedError);
          void reader.cancel().catch(() => undefined);
        }
      };

      resetIdleTimer();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() ?? ''; // keep incomplete last line
        for (const line of lines) {
          processSSELine(line.trim());
        }
      }

      // Process any remaining buffer content
      if (sseBuffer.trim()) processSSELine(sseBuffer.trim());

      clearIdleTimer();
      if (!receivedDone && !controller.signal.aborted) {
        if (recoverPartial?.()) {
          setStreamError(
            receivedError
              ? `${receivedError} A partial workflow was recovered below.`
              : idleTimedOut
                ? 'The stream paused, so the partial workflow was recovered below.'
                : 'The stream ended early, so the partial workflow was recovered below.'
          );
        } else if (!receivedError) {
          setStreamError(
            idleTimedOut
              ? 'Director AI stopped responding before a complete workflow arrived. Please try again.'
              : 'The connection ended before the workflow was complete. Please try again.'
          );
        }
      }

    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError') && !controller.signal.aborted) {
        console.error(e);
        if (recoverPartial?.()) {
          setStreamError('The connection was interrupted, so the partial workflow was recovered below.');
        } else {
          setStreamError('Director AI could not complete this workflow. Please try again.');
        }
      }
    } finally {
      cleanupStream?.();
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsLoading(false);
        streamingTextRef.current = '';
        streamingNodesRef.current = [];
        streamingEdgesRef.current = [];
        streamingExplanationRef.current = null;
        knownNodeCountRef.current = 0;
      }
    }
  };

  const handleApplyGen = (gen: Generation) => {
    if (gen.mode === 'extend') {
      onApply(gen.nodes, gen.edges);
    } else {
      onReplace(gen.nodes, gen.edges);
    }
    onClose();
  };

  // While streaming, show an inline preview card
  const isStreaming = isLoading && (streamingNodes.length > 0 || streamingExplanation !== null);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm transition-opacity duration-250"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 w-[420px] bg-card border-l border-border/50 shadow-2xl z-50 flex flex-col transform transition-transform duration-250 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2 text-primary">
            <Clapperboard className="h-5 w-5" />
            <h2 className="font-semibold tracking-tight">Director AI</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mode selector — only when canvas has nodes */}
        {hasCanvas && (
          <div className="px-4 py-3 border-b border-border/50 bg-muted/20 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setMode('extend')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold border transition-colors",
                  mode === 'extend'
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                )}
              >
                <Plus className="h-3 w-3" /> Extend Canvas
              </button>
              <button
                onClick={() => setMode('replace')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold border transition-colors",
                  mode === 'replace'
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                )}
              >
                <RefreshCw className="h-3 w-3" /> Replace Canvas
              </button>
            </div>
            {mode === 'extend' && currentTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {currentTypes.map((type, i) => (
                  <NodePill key={i} type={type} />
                ))}
              </div>
            )}
            {mode === 'replace' && (
              <p className="text-[11px] text-muted-foreground">
                Generates a fresh workflow — current canvas will be overwritten.
              </p>
            )}
          </div>
        )}

        <ScrollArea className="flex-1 p-4">
          <div className="flex flex-col gap-6 pb-24">

            {streamError && (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {streamError}
              </div>
            )}

            {history.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Previous Generations</h3>
                {history.map(gen => (
                  <div key={gen.id} className="bg-muted/20 border border-border/50 rounded-lg p-3 text-sm flex flex-col gap-2">
                    <p className="text-muted-foreground line-clamp-2 italic">"{gen.description}"</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="self-start h-7 text-xs gap-1.5"
                      onClick={() => {
                        if (currentGen) setHistory(prev => [currentGen, ...prev.filter(g => g.id !== gen.id)]);
                        else setHistory(prev => prev.filter(g => g.id !== gen.id));
                        setCurrentGen(gen);
                      }}
                    >
                      <RotateCcw className="h-3 w-3" /> Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Streaming preview card — shown while loading and first data arrives */}
            {isStreaming && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex justify-end -mb-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"
                      onClick={handleCancel}
                      aria-label="Cancel Director AI generation"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </div>
                  {streamingExplanation !== null && (
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {streamingExplanation}
                      {isLoading && (
                        <span
                          aria-hidden="true"
                          className="inline-block ml-1 w-1.5 h-3.5 bg-primary/60 rounded-sm animate-cursor-blink align-middle"
                        />
                      )}
                    </p>
                  )}

                  {streamingNodes.length > 0 && (
                    <div className="bg-background/50 rounded-lg p-3 border border-border/50 flex items-center gap-1.5 overflow-x-auto hide-scrollbar flex-wrap">
                      {streamingNodes.map((n, i) => {
                        const type = n.type as string;
                        return (
                          <React.Fragment key={n.id}>
                            {i > 0 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
                            <NodePill type={type} animate />
                          </React.Fragment>
                        );
                      })}
                      {/* Pulsing placeholder for next incoming node */}
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/20 shrink-0" />
                      <div className="px-2.5 py-1.5 rounded-full border border-border/30 bg-muted/20 flex items-center gap-1.5 animate-pulse">
                        <div className="h-1.5 w-10 rounded-full bg-muted-foreground/20" />
                      </div>
                    </div>
                  )}

                  {/* Apply button appears as soon as first node arrives */}
                  {streamingNodes.length > 0 && (
                    <Button
                      className="w-full gap-2 font-semibold shadow-md mt-2 animate-in fade-in duration-300"
                      size="lg"
                      disabled
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating…
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Loading spinner before any streaming data arrives */}
            {isLoading && !isStreaming && (
              <div className="flex flex-col items-center justify-center text-center h-32 gap-3 opacity-60">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Director AI is thinking…</p>
              </div>
            )}

            {currentGen && !isLoading && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-primary/90 italic flex-1">
                      "{currentGen.description}"
                    </p>
                    {currentGen.mode === 'extend' ? (
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Extend
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                        Replace
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {currentGen.explanation}
                  </p>

                  <div className="bg-background/50 rounded-lg p-3 border border-border/50 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                    {currentGen.nodes.map((n, i) => {
                      const type = n.type as string;
                      return (
                        <React.Fragment key={n.id}>
                          {i > 0 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
                          <NodePill type={type} />
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <Button
                    className="w-full gap-2 font-semibold shadow-md mt-2"
                    size="lg"
                    onClick={() => handleApplyGen(currentGen)}
                  >
                    {currentGen.mode === 'extend' ? (
                      <><Plus className="h-4 w-4" /> Add to Canvas</>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> Apply to Canvas</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {!currentGen && !isLoading && history.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center h-48 gap-3 opacity-50">
                <Clapperboard className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground max-w-[250px]">
                  {hasCanvas && mode === 'extend'
                    ? 'Describe what to add and Director AI will extend your workflow.'
                    : 'Describe what you want to create and Director AI will build the workflow for you.'}
                </p>
              </div>
            )}

          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border/50 backdrop-blur-xl">
          <div className="mb-2 grid grid-cols-[148px_1fr] gap-2">
            <label className="sr-only" htmlFor="director-provider">AI provider</label>
            <select
              id="director-provider"
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              value={provider}
              onChange={(event) => setProvider(event.target.value as 'claude' | 'modelark' | 'openai' | 'openrouter')}
              disabled={isLoading}
            >
              <option value="claude">Claude</option>
              <option value="modelark">ModelArk</option>
              <option value="openai">
                OpenAI{openAiAccessMode === 'direct' ? ' · direct key' : openAiAccessMode === 'replit' ? ' · Replit credits' : ''}
                {openAiAvailable === false ? ' (unavailable)' : ''}
              </option>
              <option value="openrouter">
                OpenRouter free
                {openRouterAccessMode === 'replit' ? ' · Replit credits' : openRouterAccessMode === 'direct' ? ' · direct key' : ''}
              </option>
            </select>
            {provider !== 'claude' ? (
              <>
                <label className="sr-only" htmlFor="director-model">Agent text model</label>
                <select
                  id="director-model"
                  className="h-8 min-w-0 rounded-md border border-border bg-background px-2 text-xs"
                  value={selectedModel}
                  onChange={(event) => setSelectedModel(event.target.value)}
                  disabled={isLoading || currentModels.length === 0}
                >
                  {currentModels.length === 0
                    ? <option value="">No models available</option>
                    : currentModels.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
                </select>
              </>
            ) : (
              <div className="h-8 flex items-center rounded-md border border-border/50 bg-muted/20 px-2 text-xs text-muted-foreground">
                Claude Sonnet
              </div>
            )}
          </div>
          {currentModelError ? (
            <p className="mb-2 text-xs text-destructive" role="status">{currentModelError}</p>
          ) : null}
          {providerAccessNote ? (
            <p className="mb-2 text-[10px] text-muted-foreground" role="status">{providerAccessNote}</p>
          ) : null}
          <div className="relative">
            <Textarea
              placeholder={hasCanvas && mode === 'extend'
                ? 'e.g. Add an upscale step after the video generation...'
                : 'e.g. A cinematic video of a character walking through a foggy forest at dawn...'}
              className="resize-none pr-12 min-h-[100px] text-sm bg-background border-border focus-visible:ring-primary/50"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleBuild();
                }
              }}
            />
            {isLoading ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute bottom-3 right-3 h-8 w-8 rounded-md text-primary"
                onClick={handleCancel}
                aria-label="Cancel Director AI generation"
                title="Cancel generation"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="absolute bottom-3 right-3 h-8 w-8 rounded-md"
                onClick={handleBuild}
                disabled={!description.trim() || (provider !== 'claude' && !selectedModel)}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
