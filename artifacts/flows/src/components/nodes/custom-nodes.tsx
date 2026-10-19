import React, { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { BaseNode } from './base-node';
import { 
  Image as ImageIcon, 
  Video, 
  Music, 
  Layers, 
  Type, 
  ListPlus, 
  Wand2, 
  Sparkles, 
  Scissors, 
  Maximize, 
  ArrowRightToLine,
  ImagePlay,
  Mic2,
  FileImage,
  RefreshCw,
  Plus,
  GripVertical,
  Clapperboard,
  UserCircle2,
  Aperture,
  Film,
  ChevronDown,
  ChevronUp,
  Zap,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLocation } from 'wouter';

type ModelArkChoice = { id: string; capability: string };

function useModelArkModels(capability: string) {
  const [models, setModels] = useState<ModelArkChoice[]>([]);
  const [catalogError, setCatalogError] = useState('');
  React.useEffect(() => {
    let active = true;
    fetch('/api/modelark/models')
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'Model catalog unavailable.');
        return payload?.models as ModelArkChoice[];
      })
      .then((available) => {
        if (active && Array.isArray(available)) {
          setModels(available.filter((model) => model.capability === capability && typeof model.id === 'string'));
        }
      })
      .catch((error) => {
        if (active) setCatalogError(error instanceof Error ? error.message : 'Model catalog unavailable.');
      });
    return () => { active = false; };
  }, [capability]);
  return { models, catalogError };
}

// -- Input Nodes --

export function ImageUploadNode({ id, data, selected }: any) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Image Upload"
      icon={ImageIcon}
      outputs={[{ id: 'out', type: 'source' }]}
    >
      <div className="aspect-video w-full rounded-md border border-border/50 bg-checkered flex items-center justify-center relative overflow-hidden group">
        <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
      </div>
      <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => {}}>
        <RefreshCw className="mr-2 h-3 w-3" />
        Replace
      </Button>
    </BaseNode>
  );
}

export function VideoUploadNode({ id, data, selected }: any) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Video Upload"
      icon={Video}
      outputs={[{ id: 'out', type: 'source' }]}
    >
      <div className="aspect-video w-full rounded-md border border-border/50 bg-checkered flex flex-col items-center justify-center relative overflow-hidden">
        <Video className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[9px] text-white">00:04</span>
      </div>
      <Button variant="secondary" size="sm" className="w-full text-xs">
        <RefreshCw className="mr-2 h-3 w-3" />
        Replace
      </Button>
    </BaseNode>
  );
}

export function AudioUploadNode({ id, data, selected }: any) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Audio Upload"
      icon={Music}
      outputs={[{ id: 'out', type: 'source' }]}
    >
      <div className="h-16 w-full rounded-md border border-border/50 bg-muted/20 flex items-center justify-center relative p-2">
        <div className="flex items-center gap-1 w-full h-full opacity-50">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="flex-1 bg-primary rounded-full" style={{ height: `${Math.max(20, Math.random() * 100)}%` }} />
          ))}
        </div>
        <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[9px] text-white">00:12</span>
      </div>
      <Button variant="secondary" size="sm" className="w-full text-xs">
        <RefreshCw className="mr-2 h-3 w-3" />
        Replace
      </Button>
    </BaseNode>
  );
}

export function PromptNode({ id, data, selected }: any) {
  const [val, setVal] = useState(data?.prompt || '');
  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Prompt"
      icon={Type}
      outputs={[{ id: 'out', type: 'source' }]}
      width={320}
    >
      <div className="relative">
        <Textarea 
          className="min-h-[100px] resize-none text-xs bg-muted/20 pb-8" 
          placeholder="Describe what you want to see..."
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <Button size="icon" variant="ghost" className="absolute bottom-1 left-1 h-6 w-6 rounded-sm text-muted-foreground hover:text-foreground">
          <span className="text-sm font-mono">@</span>
        </Button>
      </div>
    </BaseNode>
  );
}

export function PromptBuilderNode({ id, data, selected }: any) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Prompt Builder"
      icon={ListPlus}
      inputs={[{ id: 'in', type: 'target' }]}
      outputs={[{ id: 'out', type: 'source' }]}
      width={320}
    >
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground font-mono">
              {i}
            </div>
            <Textarea className="min-h-[40px] h-[40px] resize-none text-xs bg-muted/20" placeholder="Variant..." defaultValue={data?.[`variant${i}`] || ''} />
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="w-full text-xs mt-1 border border-dashed border-border/50">
        <Plus className="mr-2 h-3 w-3" />
        Add variant
      </Button>
    </BaseNode>
  );
}

export function TextIteratorNode({ id, data, selected }: any) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Text Iterator"
      icon={Layers}
      inputs={[{ id: 'in', type: 'target' }]}
      outputs={[{ id: 'out', type: 'source' }]}
    >
      <div className="flex flex-col gap-2">
        {['Cinematic lighting', 'Neon cyberpunk', 'Watercolor painting'].map((txt, i) => (
          <div key={i} className="flex items-center gap-2 group cursor-move">
            <GripVertical className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground" />
            <input 
              type="text" 
              className="flex-1 rounded-md border border-border/50 bg-muted/20 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary" 
              defaultValue={txt} 
            />
          </div>
        ))}
        <Button variant="ghost" size="sm" className="w-full text-xs mt-1 border border-dashed border-border/50">
          <Plus className="mr-2 h-3 w-3" />
          Add text
        </Button>
      </div>
    </BaseNode>
  );
}

export function ImageIteratorNode({ id, data, selected }: any) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Image Iterator"
      icon={FileImage}
      inputs={[{ id: 'in', type: 'target' }]}
      outputs={[{ id: 'out', type: 'source' }]}
    >
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square rounded border border-border/50 bg-checkered relative group">
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-move">
               <GripVertical className="h-4 w-4 text-white" />
             </div>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="w-full text-xs mt-2 border border-dashed border-border/50">
        <Plus className="mr-2 h-3 w-3" />
        Add image
      </Button>
    </BaseNode>
  );
}

// -- Director & Character Nodes --

export function DirectorNode({ id, data, selected }: any) {
  const [script, setScript] = useState(data?.script || '');
  const [style, setStyle] = useState(data?.style || '');
  const [scenes, setScenes] = useState(data?.scenes || 3);
  const [expanded, setExpanded] = useState(true);

  const sceneOutputs = Array.from({ length: scenes }, (_, i) => ({
    id: `scene-${i + 1}`,
    type: 'source' as const,
  }));

  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Director"
      icon={Clapperboard}
      iconColor="text-orange-400"
      badge="DIRECTOR"
      inputs={[{ id: 'character', type: 'target' }]}
      outputs={sceneOutputs}
      width={340}
      footer={
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-orange-400/80">
            <Film className="h-3 w-3" /> {scenes} scene{scenes !== 1 ? 's' : ''} queued
          </span>
          <span className="text-muted-foreground">Auto-prompt</span>
        </div>
      }
    >
      {/* Script */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Story / Script</label>
        <Textarea
          className="min-h-[80px] resize-none text-xs bg-muted/20"
          placeholder="Describe the story arc, setting, mood, or shot list. The Director will generate scene prompts automatically..."
          value={script}
          onChange={(e) => setScript(e.target.value)}
        />
      </div>

      {/* Style Direction */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Style Direction</label>
        <input
          type="text"
          className="h-8 w-full rounded-md border border-border/50 bg-muted/20 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/50"
          placeholder="e.g. cinematic, warm tones, handheld, noir..."
          value={style}
          onChange={(e) => setStyle(e.target.value)}
        />
      </div>

      {/* Scene count */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Scenes</label>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 rounded-sm"
            onClick={() => setScenes(Math.max(1, scenes - 1))}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <span className="min-w-[20px] text-center text-sm font-semibold">{scenes}</span>
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 rounded-sm"
            onClick={() => setScenes(Math.min(8, scenes + 1))}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Scene output previews */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-border/30">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Scene Outputs</label>
        {Array.from({ length: scenes }, (_, i) => (
          <div key={i} className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/10 px-2 py-1.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-orange-500/20 text-[9px] font-mono text-orange-400">
              {i + 1}
            </div>
            <span className="flex-1 text-[10px] text-muted-foreground italic truncate">
              {script ? `Scene ${i + 1} — auto-generated from script` : 'Connect to a generation node →'}
            </span>
          </div>
        ))}
      </div>
    </BaseNode>
  );
}

export function CharacterNode({ id, data, selected }: any) {
  const [name, setName] = useState(data?.name || '');
  const [desc, setDesc] = useState(data?.description || '');

  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Character"
      icon={UserCircle2}
      iconColor="text-emerald-400"
      badge="REF"
      outputs={[{ id: 'out', type: 'source' }]}
      width={260}
      footer={
        <div className="flex items-center gap-1.5 text-emerald-400/80">
          <Zap className="h-3 w-3" />
          <span>Consistency lock active</span>
        </div>
      }
    >
      {/* Reference image */}
      <div className="relative aspect-square w-full rounded-lg border border-border/50 bg-checkered overflow-hidden group">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/30">
          <UserCircle2 className="h-10 w-10" />
          <span className="text-[10px]">Reference image</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] h-6 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
        >
          <RefreshCw className="mr-1 h-2.5 w-2.5" /> Upload photo
        </Button>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Character Name</label>
        <input
          type="text"
          className="h-7 w-full rounded-md border border-border/50 bg-muted/20 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          placeholder="e.g. Maya, John Doe..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Description</label>
        <Textarea
          className="min-h-[60px] resize-none text-xs bg-muted/20"
          placeholder="Age, appearance, clothing, distinctive features..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>
    </BaseNode>
  );
}

export function ImageGenNode({ id, data, selected }: any) {
  const { updateNodeData } = useReactFlow();
  const { models, catalogError } = useModelArkModels('image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState<'modelark' | 'openai' | 'gemini'>(
    data?.provider === 'openai' || data?.provider === 'replit' ? 'openai' : data?.provider === 'gemini' ? 'gemini' : 'modelark'
  );
  const [openAiAccessMode, setOpenAiAccessMode] = useState<'replit' | 'direct' | 'unavailable'>('unavailable');
  const model = typeof data?.model === 'string' ? data.model : '';
  const prompt = typeof data?.prompt === 'string' ? data.prompt : '';
  const geminiModels = [
    { id: 'gemini-3.1-flash-lite-image', name: 'Nano Banana 2 Lite · fastest/lowest cost' },
    { id: 'gemini-nano-banana-2.1', name: 'Nano Banana 2.1 · recommended' },
    { id: 'gemini-3.1-flash-image', name: 'Nano Banana 2 · high detail' },
    { id: 'gemini-3-pro-image', name: 'Nano Banana Pro · premium' },
  ];

  React.useEffect(() => {
    if (!model && models.length > 0) updateNodeData(id, { model: models[0].id });
  }, [id, model, models, updateNodeData]);

  React.useEffect(() => {
    let active = true;
    fetch('/api/ai/models')
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        const mode = payload?.accessMode;
        setOpenAiAccessMode(mode === 'direct' || mode === 'replit' ? mode : 'unavailable');
      })
      .catch(() => {
        if (active) setOpenAiAccessMode('unavailable');
      });
    return () => { active = false; };
  }, []);

  const generate = async () => {
    const selectedModel = provider === 'openai' ? 'gpt-image-1' : model;
    if (!selectedModel || (provider === 'openai' && openAiAccessMode === 'unavailable')) return;
    setError('');
    setIsGenerating(true);
    try {
      const response = await fetch(
        provider === 'modelark' ? '/api/modelark/images/generations' : '/api/generate/canvas-image',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: selectedModel, prompt }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'Image generation failed.');
      updateNodeData(id, { imageUrl: result.imageUrl, generationStatus: 'completed' });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Image generation failed.';
      setError(message);
      updateNodeData(id, { generationStatus: 'failed' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={provider === 'openai' ? 'OpenAI Image' : provider === 'gemini' ? 'Gemini Image' : 'ModelArk Image'}
      icon={Aperture}
      iconColor="text-sky-400"
      inputs={[
        { id: 'prompt', type: 'target' },
        { id: 'character', type: 'target' },
        { id: 'style', type: 'target' },
      ]}
      outputs={[{ id: 'out', type: 'source' }]}
      width={300}
      footer={
        <div className="flex items-center justify-between">
          <span>1024×1024</span>
          <span>x1</span>
        </div>
      }
    >
      {/* Preview area */}
      <div className="aspect-square w-full rounded-md border border-border/50 bg-checkered flex items-center justify-center relative overflow-hidden group">
        {data?.imageUrl ? (
          <img src={data.imageUrl} alt="Generated image preview" className="h-full w-full object-cover" />
        ) : isGenerating ? (
          <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        ) : (
          <Aperture className="h-8 w-8 text-sky-400/30" />
        )}
        <span className="absolute bottom-1.5 right-1.5 rounded bg-sky-500/20 border border-sky-500/30 px-1.5 py-0.5 text-[9px] text-sky-400 font-medium">
          {isGenerating ? 'GENERATING' : data?.imageUrl ? 'READY' : provider === 'openai' ? (openAiAccessMode === 'direct' ? 'OPENAI API' : 'REPLIT CREDITS') : provider === 'gemini' ? 'GOOGLE API' : 'MODELARK'}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Image provider</label>
        <select
          className="h-7 rounded-sm border border-border bg-muted/20 text-xs px-1"
          value={provider}
          onChange={(e) => {
            const next = e.target.value === 'openai' || e.target.value === 'gemini' ? e.target.value : 'modelark';
            setProvider(next);
            updateNodeData(id, {
              provider: next,
              model: next === 'openai'
                ? 'gpt-image-1'
                : next === 'gemini'
                  ? geminiModels[0].id
                  : (models[0]?.id ?? ''),
            });
          }}
          aria-label="Image provider"
        >
          <option value="modelark">ModelArk</option>
          <option value="openai">
            OpenAI GPT Image 1 · {openAiAccessMode === 'direct' ? 'OpenAI API billing' : openAiAccessMode === 'replit' ? 'Replit credits' : 'unavailable'}
          </option>
          <option value="gemini">Gemini image · Google API billing</option>
        </select>
        {provider === 'modelark' ? (
          <>
            <label className="sr-only" htmlFor={`image-model-${id}`}>ModelArk image model</label>
            <select
              id={`image-model-${id}`}
              className="h-7 rounded-sm border border-border bg-muted/20 text-xs px-1"
              value={model}
              onChange={(e) => updateNodeData(id, { model: e.target.value })}
              aria-label="Image generation model"
            >
              {models.map((entry) => <option key={entry.id} value={entry.id}>{entry.id}</option>)}
            </select>
          </>
        ) : provider === 'gemini' ? (
          <>
            <label className="sr-only" htmlFor={`gemini-image-model-${id}`}>Gemini image model</label>
            <select
              id={`gemini-image-model-${id}`}
              className="h-7 rounded-sm border border-border bg-muted/20 text-xs px-1"
              value={model || geminiModels[0].id}
              onChange={(e) => updateNodeData(id, { model: e.target.value })}
              aria-label="Gemini image model"
            >
              {geminiModels.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>
            <p className="text-[9px] text-muted-foreground">Uses your Google API key, not Replit credits.</p>
          </>
        ) : (
          <div className="h-7 rounded-sm border border-border/50 bg-muted/20 px-2 flex items-center text-xs text-muted-foreground">
            gpt-image-1 · 1024×1024
          </div>
        )}
      </div>
      {provider === 'openai' ? (
        <p className="text-[9px] text-muted-foreground" role="status">
          {openAiAccessMode === 'direct'
            ? 'Uses your OpenAI API key; image requests are billed by OpenAI.'
            : openAiAccessMode === 'replit'
              ? 'Uses Replit AI Integrations and Replit credits.'
              : 'OpenAI is not available to this API runtime.'}
        </p>
      ) : null}
      <Textarea
        className="min-h-[66px] resize-none text-xs bg-muted/20"
        placeholder="Describe the image to create..."
        value={prompt}
        onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
        aria-label="Image prompt"
      />
      {error || (provider === 'modelark' ? catalogError : '') ? <p className="text-[10px] text-destructive" role="status">{error || catalogError}</p> : null}
      <Button
        size="sm"
        className="w-full text-xs"
        disabled={(provider === 'modelark' && !model) || (provider === 'openai' && openAiAccessMode === 'unavailable') || !prompt.trim() || isGenerating}
        onClick={generate}
      >
        {isGenerating ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}
        {isGenerating ? 'Generating…' : 'Generate image'}
      </Button>
    </BaseNode>
  );
}

// -- AI Model Nodes --

export function LTXProNode({ id, data, selected }: any) {
  const { updateNodeData } = useReactFlow();
  const [, setLocation] = useLocation();
  const { models, catalogError } = useModelArkModels('video');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const model = typeof data?.model === 'string' ? data.model : '';
  const prompt = typeof data?.prompt === 'string' ? data.prompt : '';

  React.useEffect(() => {
    if (!model && models.length > 0) updateNodeData(id, { model: models[0].id });
  }, [id, model, models, updateNodeData]);

  const generate = async () => {
    setError('');
    setIsGenerating(true);
    try {
      const createResponse = await fetch('/api/modelark/videos/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt }),
      });
      const created = await createResponse.json();
      if (!createResponse.ok) throw new Error(created?.error || 'Video task could not start.');
      updateNodeData(id, { taskId: created.taskId, generationStatus: 'processing', videoUrl: null });

      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise((resolve) => window.setTimeout(resolve, 5_000));
        const pollResponse = await fetch(`/api/modelark/videos/tasks/${encodeURIComponent(created.taskId)}`);
        const task = await pollResponse.json();
        if (!pollResponse.ok) throw new Error(task?.error || 'Unable to check video task.');
        const status = String(task.status || '').toLowerCase();
        if (task.videoUrl) {
          updateNodeData(id, { videoUrl: task.videoUrl, generationStatus: 'completed' });
          return;
        }
        if (['failed', 'error', 'cancelled', 'canceled'].includes(status)) {
          throw new Error(task.error || 'Video generation failed.');
        }
      }
      throw new Error('Video is still processing. Try checking again later.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Video generation failed.';
      setError(message);
      updateNodeData(id, { generationStatus: 'failed' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <BaseNode
      id={id}
      selected={selected}
      title="ModelArk Video"
      icon={Wand2}
      iconColor="text-purple-400"
      inputs={[
        { id: 'prompt', type: 'target' },
        { id: 'image', type: 'target' },
        { id: 'motion', type: 'target' },
      ]}
      outputs={[{ id: 'out', type: 'source' }]}
      width={300}
      footer={
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1"><Video className="h-3 w-3"/> ModelArk · external</span>
          <span>Text to video</span>
        </div>
      }
    >
      <div className="aspect-video w-full rounded-md border border-border/50 bg-checkered flex items-center justify-center overflow-hidden">
        {data?.videoUrl ? (
          <video src={data.videoUrl} className="h-full w-full object-cover" controls playsInline />
        ) : isGenerating ? (
          <div className="flex flex-col items-center gap-2 text-purple-300">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-[10px]">Rendering video…</span>
          </div>
        ) : (
          <Video className="h-8 w-8 text-purple-400/30" />
        )}
      </div>
      <p className="text-[9px] text-muted-foreground">Uses ModelArk billing. Replit AI integrations do not provide app video output.</p>
      {data?.generationStatus === 'completed' && typeof data?.videoUrl === 'string' && (
        <Button
          size="sm"
          variant="secondary"
          className="w-full text-xs"
          data-testid={`button-edit-video-${id}`}
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            const projectId = params.get('projectId');
            const query = new URLSearchParams({ source: data.videoUrl, nodeId: String(id) });
            if (projectId && /^\d+$/.test(projectId)) query.set('projectId', projectId);
            setLocation(`/editor?${query.toString()}`);
          }}
        >
          <Scissors className="mr-2 h-3 w-3" />
          Edit video
        </Button>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">ModelArk video model</label>
        <select
          className="h-7 rounded-sm border border-border bg-muted/20 text-xs px-1"
          value={model}
          onChange={(e) => updateNodeData(id, { model: e.target.value })}
          aria-label="Video generation model"
        >
          {models.map((entry) => <option key={entry.id} value={entry.id}>{entry.id}</option>)}
        </select>
      </div>
      <Textarea
        className="min-h-[66px] resize-none text-xs bg-muted/20"
        placeholder="Describe the video to create..."
        value={prompt}
        onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
        aria-label="Video prompt"
      />
      {error || catalogError ? <p className="text-[10px] text-destructive" role="status">{error || catalogError}</p> : null}
      <Button size="sm" className="w-full text-xs" disabled={!model || !prompt.trim() || isGenerating} onClick={generate}>
        {isGenerating ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}
        {isGenerating ? 'Generating…' : 'Generate video'}
      </Button>
    </BaseNode>
  );
}

export function NanoBananaProNode({ id, data, selected }: any) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Nano Banana Pro"
      icon={Sparkles}
      iconColor="text-yellow-400"
      badge="PRO"
      inputs={[
        { id: 'prompt', type: 'target' },
        { id: 'image', type: 'target' }
      ]}
      outputs={[{ id: 'out', type: 'source' }]}
      width={280}
      footer={
        <div className="flex items-center justify-between">
          <span>1K</span>
          <span>16:9</span>
          <span>x1</span>
        </div>
      }
    >
      <div className="aspect-video w-full rounded-md border border-border/50 bg-checkered relative overflow-hidden group">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center border border-yellow-500/20">
          <Sparkles className="h-6 w-6 text-yellow-500 mb-2" />
          <p className="text-xs font-medium text-foreground mb-1">Upgrade to unlock</p>
          <p className="text-[10px] text-muted-foreground">Access pro models and higher limits.</p>
        </div>
      </div>
    </BaseNode>
  );
}

export function AudioToVideoNode({ id, data, selected }: any) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Audio to Video - LTX-2.3"
      icon={ImagePlay}
      inputs={[
        { id: 'audio', type: 'target' },
        { id: 'image', type: 'target' }
      ]}
      outputs={[{ id: 'out', type: 'source' }]}
      footer={
        <div className="flex items-center justify-between">
          <span>16:9</span>
          <span>x1</span>
        </div>
      }
    >
      <div className="aspect-video w-full rounded-md border border-border/50 bg-checkered" />
    </BaseNode>
  );
}

// -- Post-processing Nodes --

export function RemoveBackgroundNode({ id, data, selected }: any) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Remove Background"
      icon={Scissors}
      inputs={[{ id: 'in', type: 'target' }]}
      outputs={[{ id: 'out', type: 'source' }]}
      width={240}
    >
      <div className="aspect-square w-full rounded-md border border-border/50 bg-checkered" />
    </BaseNode>
  );
}

export function TopazUpscaleNode({ id, data, selected }: any) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Topaz Standard Upscale"
      icon={Maximize}
      inputs={[{ id: 'in', type: 'target' }]}
      outputs={[{ id: 'out', type: 'source' }]}
      footer={
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">2X Scale</span>
          <span className="text-primary hover:underline cursor-pointer">Advanced</span>
        </div>
      }
    >
      <div className="aspect-video w-full rounded-md border border-border/50 bg-checkered" />
    </BaseNode>
  );
}

export function VideoExtendNode({ id, data, selected }: any) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Video Extend"
      icon={ArrowRightToLine}
      inputs={[
        { id: 'video', type: 'target' },
        { id: 'prompt', type: 'target' }
      ]}
      outputs={[{ id: 'out', type: 'source' }]}
      footer={
        <div className="flex items-center justify-between">
          <span>LTX-2.3</span>
          <span>+4s</span>
        </div>
      }
    >
      <div className="aspect-video w-full rounded-md border border-border/50 bg-checkered" />
    </BaseNode>
  );
}

export function ExtractFrameNode({ id, data, selected }: any) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Extract Frame"
      icon={ImagePlay}
      inputs={[{ id: 'in', type: 'target' }]}
      outputs={[{ id: 'out', type: 'source' }]}
    >
      <div className="aspect-video w-full rounded-md border border-border/50 bg-checkered mb-2" />
      <select className="w-full h-8 rounded-md border border-border bg-muted/20 text-xs px-2">
        <option>Last Frame</option>
        <option>First Frame</option>
        <option>Custom Time (00:00)</option>
      </select>
    </BaseNode>
  );
}

export function DubbingNode({ id, data, selected }: any) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Dubbing"
      icon={Mic2}
      inputs={[{ id: 'in', type: 'target' }]}
      outputs={[{ id: 'out', type: 'source' }]}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-foreground">Dubbing Active</span>
          <div className="h-3 w-6 rounded-full bg-primary relative">
             <div className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-white" />
          </div>
        </div>
      }
    >
      <div className="aspect-video w-full rounded-md border border-border/50 bg-checkered mb-2" />
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Target Language</label>
        <select className="h-8 w-full rounded-md border border-border bg-muted/20 text-xs px-2">
          <option>German</option>
          <option>French</option>
          <option>Spanish</option>
          <option>Japanese</option>
        </select>
      </div>
    </BaseNode>
  );
}
