import React from 'react';
import { 
  Plus, 
  MousePointer2, 
  Hand, 
  Scissors, 
  Grid, 
  Sparkles, 
  Share,
  Clapperboard,
  UserCircle2,
  Aperture,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ToolbarProps {
  onAddNode: (type: string) => void;
  activeTool: 'select' | 'pan' | 'cut';
  setActiveTool: (tool: 'select' | 'pan' | 'cut') => void;
  showGrid: boolean;
  setShowGrid: (val: boolean) => void;
  onOpenAgent: () => void;
}

const nodeCategories = [
  {
    label: "Director",
    items: [
      { id: "DirectorNode", label: "Director", icon: Clapperboard, accent: "text-orange-400" },
      { id: "CharacterNode", label: "Character", icon: UserCircle2, accent: "text-emerald-400" },
    ]
  },
  {
    label: "Inputs",
    items: [
      { id: "ImageUploadNode", label: "Image Upload" },
      { id: "VideoUploadNode", label: "Video Upload" },
      { id: "AudioUploadNode", label: "Audio Upload" },
      { id: "ImageIteratorNode", label: "Image Iterator" },
      { id: "PromptNode", label: "Prompt" },
      { id: "PromptBuilderNode", label: "Prompt Builder" },
      { id: "TextIteratorNode", label: "Text Iterator" },
    ]
  },
  {
    label: "AI Models",
    items: [
      { id: "ImageGenNode", label: "Image Generate", icon: Aperture, accent: "text-sky-400" },
      { id: "LTXProNode", label: "LTX-2.3 Pro" },
      { id: "NanoBananaProNode", label: "Nano Banana Pro" },
      { id: "AudioToVideoNode", label: "Audio to Video" },
    ]
  },
  {
    label: "Post-processing",
    items: [
      { id: "RemoveBackgroundNode", label: "Remove Background" },
      { id: "TopazUpscaleNode", label: "Topaz Upscale" },
      { id: "VideoExtendNode", label: "Video Extend" },
      { id: "ExtractFrameNode", label: "Extract Frame" },
      { id: "DubbingNode", label: "Dubbing" },
    ]
  }
];

export function Toolbar({ onAddNode, activeTool, setActiveTool, showGrid, setShowGrid, onOpenAgent }: ToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full border border-border/40 bg-background/80 px-2 py-2 shadow-lg backdrop-blur-md">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/20 hover:text-primary">
            <Plus className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="top" className="w-56 mb-2">
          {nodeCategories.map((cat, i) => (
            <React.Fragment key={cat.label}>
              {i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">{cat.label}</DropdownMenuLabel>
                {cat.items.map((item: any) => (
                  <DropdownMenuItem key={item.id} onSelect={() => onAddNode(item.id)} className="cursor-pointer text-sm gap-2">
                    {item.icon && <item.icon className={cn("h-3.5 w-3.5", item.accent || "text-muted-foreground")} />}
                    <span className={item.accent ? "font-medium" : ""}>{item.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="mx-1 h-6 w-px bg-border/50" />

      <Button 
        variant="ghost" 
        size="icon" 
        className={cn("rounded-full", activeTool === 'select' && "bg-muted text-foreground")}
        onClick={() => setActiveTool('select')}
      >
        <MousePointer2 className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className={cn("rounded-full", activeTool === 'pan' && "bg-muted text-foreground")}
        onClick={() => setActiveTool('pan')}
      >
        <Hand className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className={cn("rounded-full", activeTool === 'cut' && "bg-muted text-foreground")}
        onClick={() => setActiveTool('cut')}
      >
        <Scissors className="h-4 w-4" />
      </Button>

      <div className="mx-1 h-6 w-px bg-border/50" />

      <Button 
        variant="ghost" 
        size="icon" 
        className={cn("rounded-full", showGrid && "bg-muted text-foreground")}
        onClick={() => setShowGrid(!showGrid)}
      >
        <Grid className="h-4 w-4" />
      </Button>
      <div className="relative group flex items-center justify-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
          onClick={onOpenAgent}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100 bg-card border border-border/50 px-2 py-1 rounded text-[10px] uppercase font-bold text-yellow-500 whitespace-nowrap tracking-wider shadow-sm pointer-events-none">
          Director
        </span>
      </div>

      <div className="mx-1 h-6 w-px bg-border/50" />

      <Button variant="ghost" size="icon" className="rounded-full">
        <Share className="h-4 w-4" />
      </Button>
    </div>
  );
}
