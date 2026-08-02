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
import { LayoutTemplate, Search, Clapperboard, UserCircle2, ArrowRight } from 'lucide-react';
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

function VisualFlowPreview({ template }: { template: Template }) {
  const layout = TEMPLATE_LAYOUTS[template.id];
  if (!layout) return null;

  const sortedNodes = [...layout.nodes].sort((a, b) => a.position.x - b.position.x);
  const displayNodes = sortedNodes.slice(0, 4);
  const remaining = sortedNodes.length - 4;

  const gradient = (() => {
    if (template.tags.includes('VIDEO')) return 'from-purple-950/60 to-blue-950/60 border-purple-500/20';
    if (template.tags.includes('IMAGE')) return 'from-sky-950/60 to-indigo-950/60 border-sky-500/20';
    if (template.tags.includes('DIRECTOR') || template.tags.includes('CHARACTER')) return 'from-orange-950/60 to-emerald-950/60 border-orange-500/20';
    if (template.tags.includes('BATCH')) return 'from-slate-900/80 to-slate-800/60 border-slate-500/20';
    if (template.tags.includes('DUBBING')) return 'from-violet-950/60 to-pink-950/60 border-pink-500/20';
    return 'from-muted/40 to-muted/20 border-border/50';
  })();

  return (
    <div className={cn("h-full w-full bg-gradient-to-r flex items-center px-4 gap-1.5 overflow-hidden", gradient)}>
      {displayNodes.map((n, i) => {
        const type = n.type as string;
        const color = NODE_COLORS[type] || NODE_COLORS.default;
        const label = NODE_LABELS[type] || type.replace('Node', '');
        return (
          <React.Fragment key={n.id}>
            {i > 0 && <ArrowRight className="h-3 w-3 text-white/30 shrink-0" />}
            <div className={cn(
              "px-2 py-1 rounded-full border text-[10px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm backdrop-blur-sm",
              color.bg, color.text, color.border
            )}>
              <div className={cn("h-1.5 w-1.5 rounded-full", color.bg.replace('/15', '/80').replace('/20', '/80'))} style={{ backgroundColor: 'currentColor' }} />
              {label}
            </div>
          </React.Fragment>
        );
      })}
      {remaining > 0 && (
        <>
          <ArrowRight className="h-3 w-3 text-white/30 shrink-0" />
          <div className="px-2 py-1 rounded-full border border-white/10 bg-white/5 text-white/50 text-[10px] font-semibold shrink-0 backdrop-blur-sm">
            +{remaining}
          </div>
        </>
      )}
    </div>
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
          <div className="flex flex-col gap-4 pb-12">
            {filteredTemplates.map(template => {
              const isSelected = selectedId === template.id;
              const isNewTemplate = isNew(template.id);
              return (
                <div 
                  key={template.id}
                  onClick={() => setSelectedId(template.id)}
                  className={cn(
                    "rounded-xl border overflow-hidden transition-all cursor-pointer group",
                    isSelected ? "border-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]" : "border-border/50 bg-card hover:border-border hover:bg-muted/10",
                    isNewTemplate && !isSelected && "border-orange-500/20 bg-orange-500/5 hover:border-orange-500/30"
                  )}
                >
                  {/* Visual flow diagram */}
                  <div className={cn(
                    "h-[80px] w-full border-b transition-transform duration-500 origin-bottom",
                    isSelected ? "border-primary/20 scale-105" : "border-border/40 group-hover:scale-[1.02]",
                    isNewTemplate && !isSelected ? "border-orange-500/20" : ""
                  )}>
                    <VisualFlowPreview template={template} />
                  </div>

                  <div className="p-3 bg-card relative z-10">
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
                    <p className="text-xs text-muted-foreground mb-1 leading-relaxed truncate">
                      {template.description}
                    </p>

                    {isSelected && (
                      <div className="flex items-center gap-2 pt-3 animate-in fade-in slide-in-from-top-1 duration-300">
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
