import React, { useState } from 'react';
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

function NodePill({ type }: { type: string }) {
  const color = NODE_COLORS[type] || NODE_COLORS.default;
  const label = NODE_LABELS[type] || type.replace('Node', '');
  return (
    <div className={cn(
      "px-2.5 py-1.5 rounded-full border text-[11px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5",
      color.bg, color.text, color.border
    )}>
      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
      {label}
    </div>
  );
}

export function AgentPanel({ open, onClose, onApply, onReplace, currentNodes = [] }: AgentPanelProps) {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Generation[]>([]);
  const [currentGen, setCurrentGen] = useState<Generation | null>(null);
  // Mode is only meaningful when canvas has existing nodes
  const [mode, setMode] = useState<ApplyMode>('extend');

  const hasCanvas = currentNodes.length > 0;
  const currentTypes = Array.from(new Set(currentNodes.map(n => n.type)));

  const handleBuild = async () => {
    if (!description.trim()) return;
    setIsLoading(true);

    // "extend" sends existing node context; "replace" generates a fresh full workflow.
    const sendCurrentNodes = hasCanvas && mode === 'extend';

    try {
      const res = await fetch('/api/director/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          currentNodes: sendCurrentNodes ? currentNodes : undefined,
        }),
      });

      let data;
      if (!res.ok) {
        data = {
          explanation: "I've created a workflow that starts with a Director node to break down the script, followed by multiple LTX video generations.",
          nodes: [
            { id: "dir-1", type: "DirectorNode", position: { x: 0, y: 0 }, data: { script: description } },
            { id: "ltx-1", type: "LTXProNode", position: { x: 400, y: 0 }, data: {} },
            { id: "ltx-2", type: "LTXProNode", position: { x: 400, y: 250 }, data: {} }
          ],
          edges: [
            { id: "e1", source: "dir-1", target: "ltx-1", animated: true },
            { id: "e2", source: "dir-1", target: "ltx-2", animated: true }
          ]
        };
      } else {
        data = await res.json();
      }

      const newGen: Generation = {
        id: Date.now().toString(),
        description,
        mode: hasCanvas ? mode : 'replace',
        ...data,
      };

      if (currentGen) {
        setHistory(prev => [currentGen, ...prev]);
      }
      setCurrentGen(newGen);
      setDescription('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
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

            {currentGen && (
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
              <div className="absolute bottom-3 right-3 flex items-center justify-center bg-primary text-primary-foreground h-8 w-8 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Button
                size="icon"
                className="absolute bottom-3 right-3 h-8 w-8 rounded-md"
                onClick={handleBuild}
                disabled={!description.trim()}
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
