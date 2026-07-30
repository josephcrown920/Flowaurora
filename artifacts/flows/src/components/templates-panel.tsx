import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutTemplate, Search, Clapperboard, UserCircle2, Aperture } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TEMPLATE_LAYOUTS } from './templates';

interface Template {
  id: string;
  title: string;
  tags: string[];
  description: string;
}

const TEMPLATES: Template[] = [
  { id: '13', title: 'Director-driven story', tags: ['VIDEO', 'DIRECTOR', 'CHARACTER'], description: 'Write a script and let the Director node break it into scene prompts automatically — each feeding its own video generation pipeline.' },
  { id: '14', title: 'Character consistency — image series', tags: ['IMAGE', 'CHARACTER', 'BATCH'], description: 'Lock in a character reference and generate multiple images of the same person across different prompts, maintaining visual consistency.' },
  { id: '15', title: 'Character video series', tags: ['VIDEO', 'DIRECTOR', 'CHARACTER'], description: 'Director + Character nodes combined: auto-generate scene prompts for a consistent character, produce reference frames, then animate each scene.' },
  { id: '16', title: 'Image gen — model comparison', tags: ['IMAGE', 'BATCH'], description: 'Run the same prompt through multiple image generation models side by side — FLUX, SDXL, Ideogram — then upscale the best result.' },
  { id: '1', title: 'Image to video', tags: ['VIDEO'], description: 'Animate a still image into a short video clip.' },
  { id: '2', title: 'Image to campaign video', tags: ['VIDEO', 'CAMPAIGN'], description: 'Turn a product image into a lifestyle scene and animate it into a video.' },
  { id: '3', title: 'Subject in multiple environments', tags: ['VIDEO', 'BATCH'], description: 'Place a reference subject into different environments and generate a video for each.' },
  { id: '4', title: 'Camera angle ideation', tags: ['IMAGE'], description: 'Explore the same subject from multiple camera angles or compositions.' },
  { id: '5', title: 'Changing object or element', tags: ['IMAGE'], description: 'Swap or replace a specific element in a scene while keeping the rest intact.' },
  { id: '6', title: 'Batch background removal', tags: ['IMAGE', 'BATCH'], description: 'Remove backgrounds from a set of images and regenerate them in a new scene.' },
  { id: '7', title: 'Text iterator', tags: ['IMAGE', 'BATCH'], description: 'Generate a set of outputs from a list of different prompts.' },
  { id: '8', title: 'Thumbnail variations', tags: ['IMAGE', 'BATCH'], description: 'Generate multiple visual options from a brief and upscale for selection.' },
  { id: '9', title: 'Grid extraction and iteration', tags: ['IMAGE'], description: 'Extract individual shots from a generated image grid and iterate on each separately.' },
  { id: '10', title: 'Multi-camera audio scene', tags: ['VIDEO'], description: 'Generate the same audio-driven scene from multiple reference angles simultaneously.' },
  { id: '11', title: 'Chained video generation', tags: ['VIDEO'], description: 'Use the last frame of one video as the start of the next, creating a seamless continuous scene.' },
  { id: '12', title: 'Spokesperson video dubbing', tags: ['VIDEO', 'DUBBING'], description: 'Produce dubbed versions of a spokesperson\'s video for different markets.' },
];

const FILTERS = ['All', 'Director', 'Character', 'Image', 'Video', 'Batch', 'Campaign', 'Dubbing'];

// Color coding for different node types in the mini preview
const NODE_COLORS: Record<string, string> = {
  DirectorNode: '#f97316',       // orange
  CharacterNode: '#10b981',      // emerald
  ImageGenNode: '#38bdf8',       // sky
  LTXProNode: '#a855f7',         // purple
  NanoBananaProNode: '#eab308',  // yellow
  AudioToVideoNode: '#a855f7',   // purple
  PromptNode: '#6366f1',         // indigo
  PromptBuilderNode: '#6366f1',  // indigo
  TextIteratorNode: '#64748b',   // slate
  ImageUploadNode: '#3b82f6',    // blue
  VideoUploadNode: '#3b82f6',    // blue
  AudioUploadNode: '#3b82f6',    // blue
  ImageIteratorNode: '#3b82f6',  // blue
  RemoveBackgroundNode: '#6b7280', // gray
  TopazUpscaleNode: '#6b7280',   // gray
  VideoExtendNode: '#6b7280',    // gray
  ExtractFrameNode: '#6b7280',   // gray
  DubbingNode: '#6b7280',        // gray
};

const NODE_LABELS: Record<string, string> = {
  DirectorNode: 'Director',
  CharacterNode: 'Character',
  ImageGenNode: 'Image Gen',
  LTXProNode: 'LTX-2.3',
  NanoBananaProNode: 'NanaBanana',
  AudioToVideoNode: 'A→V',
  PromptNode: 'Prompt',
  PromptBuilderNode: 'Builder',
  TextIteratorNode: 'Texts',
  ImageUploadNode: 'Image',
  VideoUploadNode: 'Video',
  AudioUploadNode: 'Audio',
  ImageIteratorNode: 'Imgs',
  RemoveBackgroundNode: 'Rmbg',
  TopazUpscaleNode: 'Upscale',
  VideoExtendNode: 'Extend',
  ExtractFrameNode: 'Frame',
  DubbingNode: 'Dub',
};

function FlowPreview({ templateId }: { templateId: string }) {
  const template = TEMPLATE_LAYOUTS[templateId];
  if (!template) return null;

  const { nodes, edges } = template;

  // Compute bounding box of all node positions
  const xs = nodes.map(n => n.position.x);
  const ys = nodes.map(n => n.position.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs) + 80; // approx node width
  const maxY = Math.max(...ys) + 40; // approx node height

  const rawW = maxX - minX || 1;
  const rawH = maxY - minY || 1;

  // Target canvas
  const W = 390;
  const H = 90;
  const PAD = 10;

  const scale = Math.min((W - PAD * 2) / rawW, (H - PAD * 2) / rawH);
  const offsetX = PAD + ((W - PAD * 2) - rawW * scale) / 2;
  const offsetY = PAD + ((H - PAD * 2) - rawH * scale) / 2;

  const nodeW = Math.max(28, Math.min(48, 60 * scale));
  const nodeH = Math.max(14, Math.min(22, 24 * scale));
  const rx = 3;

  // Map nodeId → screen center
  const nodeCenters: Record<string, { x: number; y: number }> = {};
  nodes.forEach(n => {
    nodeCenters[n.id] = {
      x: offsetX + (n.position.x - minX) * scale + nodeW / 2,
      y: offsetY + (n.position.y - minY) * scale + nodeH / 2,
    };
  });

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full"
      style={{ display: 'block' }}
    >
      <defs>
        <marker id={`arr-${templateId}`} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z" fill="rgba(148,163,184,0.5)" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map(edge => {
        const src = nodeCenters[edge.source];
        const tgt = nodeCenters[edge.target];
        if (!src || !tgt) return null;
        const mx = (src.x + tgt.x) / 2;
        return (
          <path
            key={edge.id}
            d={`M${src.x},${src.y} C${mx},${src.y} ${mx},${tgt.y} ${tgt.x},${tgt.y}`}
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="1"
            fill="none"
            markerEnd={`url(#arr-${templateId})`}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map(n => {
        const cx = offsetX + (n.position.x - minX) * scale;
        const cy = offsetY + (n.position.y - minY) * scale;
        const color = NODE_COLORS[n.type as string] || '#6b7280';
        const label = NODE_LABELS[n.type as string] || n.type || '';
        const fontSize = Math.max(6, Math.min(8, nodeH * 0.45));

        return (
          <g key={n.id}>
            <rect
              x={cx}
              y={cy}
              width={nodeW}
              height={nodeH}
              rx={rx}
              fill={color + '22'}
              stroke={color + 'cc'}
              strokeWidth="1"
            />
            <text
              x={cx + nodeW / 2}
              y={cy + nodeH / 2 + fontSize * 0.36}
              textAnchor="middle"
              fontSize={fontSize}
              fill={color}
              fontFamily="system-ui, sans-serif"
              fontWeight="600"
              style={{ userSelect: 'none' }}
            >
              {label.length > 7 ? label.slice(0, 6) + '…' : label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

interface TemplatesPanelProps {
  onSelectTemplate: (id: string) => void;
}

const TAG_COLORS: Record<string, string> = {
  DIRECTOR: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  CHARACTER: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  IMAGE: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
  VIDEO: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  BATCH: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  CAMPAIGN: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
  DUBBING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
};

export function TemplatesPanel({ onSelectTemplate }: TemplatesPanelProps) {
  const [activeFilter, setActiveFilter] = React.useState('All');
  const [search, setSearch] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'All' || t.tags.includes(activeFilter.toUpperCase());
    return matchesSearch && matchesFilter;
  });

  const isNew = (id: string) => ['13', '14', '15', '16'].includes(id);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LayoutTemplate className="h-4 w-4" />
          Templates
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[420px] sm:w-[500px] p-0 flex flex-col border-border/50">
        <div className="p-4 border-b border-border/50">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="text-lg">Templates</SheetTitle>
          </SheetHeader>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search templates..." 
              className="pl-9 bg-muted/20 border-border/50" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(f => (
              <Badge 
                key={f} 
                variant={activeFilter === f ? "default" : "secondary"}
                className={cn(
                  "cursor-pointer text-[10px] uppercase font-semibold",
                  activeFilter !== f && "hover:bg-muted bg-muted/40 text-muted-foreground"
                )}
                onClick={() => setActiveFilter(f)}
              >
                {f === 'Director' && <Clapperboard className="mr-1 h-2.5 w-2.5 text-orange-400" />}
                {f === 'Character' && <UserCircle2 className="mr-1 h-2.5 w-2.5 text-emerald-400" />}
                {f}
              </Badge>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="flex flex-col gap-3">
            {filteredTemplates.map(template => {
              const isSelected = selectedId === template.id;
              const isNewTemplate = isNew(template.id);
              return (
                <div 
                  key={template.id}
                  onClick={() => setSelectedId(template.id)}
                  className={cn(
                    "rounded-xl border p-3 transition-all cursor-pointer",
                    isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 bg-card hover:border-border hover:bg-muted/10",
                    isNewTemplate && !isSelected && "border-orange-500/20 bg-orange-500/5 hover:border-orange-500/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm leading-tight">{template.title}</h3>
                      {isNewTemplate && (
                        <span className="text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          New
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {template.tags.slice(0, 2).map(tag => (
                        <span key={tag} className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded", TAG_COLORS[tag] || "bg-muted text-muted-foreground")}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    {template.description}
                  </p>
                  
                  {/* Visual flow diagram */}
                  <div className={cn(
                    "h-[90px] w-full rounded-lg border overflow-hidden mb-3",
                    isNewTemplate ? "border-orange-500/20 bg-background/60" : "border-border/40 bg-background/40"
                  )}>
                    <FlowPreview templateId={template.id} />
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button size="sm" className="w-full text-xs h-8" onClick={(e) => {
                        e.stopPropagation();
                        onSelectTemplate(template.id);
                        setOpen(false);
                      }}>
                        Use Template
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No templates found.
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
