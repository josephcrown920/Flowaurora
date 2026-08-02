import { useEffect, useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { 
  useGetProject, 
  useListProjectShots, 
  useCreateShot, 
  useGenerateShotImage,
  useUpdateShot,
  useListCharacters,
  getListProjectShotsQueryKey,
  getGetProjectQueryKey
} from "@workspace/api-client-react";
import type { Shot, Character } from "@workspace/api-client-react";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Plus, Image as ImageIcon, Video, MoreHorizontal, Loader2, Users, Check, X, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

// Workaround to ensure proposeShots can be called if the hook export name differs
const proposeShotsMutationFn = async (data: { logline: string; sceneCount?: number }) => {
  const res = await fetch("/api/projects/propose-shots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to propose shots");
  return res.json();
};

export default function Storyboard() {
  const [, params] = useRoute("/projects/:id");
  const projectId = Number(params?.id);
  
  const { data: project, isLoading: isProjectLoading } = useGetProject(projectId, { 
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) } 
  });
  
  const { data: shots, isLoading: isShotsLoading } = useListProjectShots(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectShotsQueryKey(projectId) }
  });

  // Local ordered list for optimistic drag-and-drop reordering
  const [orderedShots, setOrderedShots] = useState<Shot[]>([]);
  useEffect(() => {
    if (shots) setOrderedShots(shots);
  }, [shots]);

  const { data: characters } = useListCharacters();

  const createShot = useCreateShot();
  const generateImage = useGenerateShotImage();
  const updateShot = useUpdateShot();
  const queryClient = useQueryClient();
  
  const proposeShotsMutation = useMutation({
    mutationFn: proposeShotsMutationFn
  });

  // dnd-kit sensors — pointer for mouse, touch for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedShots((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);

      // Persist new positions — fire-and-forget, one PATCH per shot that changed index
      next.forEach((shot, index) => {
        if (prev[index]?.id !== shot.id) {
          updateShot.mutate(
            { id: shot.id, data: { position: index } },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListProjectShotsQueryKey(projectId) });
              }
            }
          );
        }
      });

      return next;
    });
  };

  const handleProposeShots = async () => {
    if (!project?.logline) return;
    try {
      const res = await proposeShotsMutation.mutateAsync({ logline: project.logline, sceneCount: 4 }) as any;
      if (res && res.shots) {
        for (const [index, shot] of res.shots.entries()) {
          await createShot.mutateAsync({
            id: projectId,
            data: {
              shotType: shot.shotType,
              cameraAngle: shot.cameraAngle,
              prompt: shot.prompt,
              position: (shots?.length || 0) + index + 1
            }
          });
        }
        queryClient.invalidateQueries({ queryKey: getListProjectShotsQueryKey(projectId) });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateImage = (shotId: number) => {
    generateImage.mutate(
      { data: { shotId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectShotsQueryKey(projectId) });
        }
      }
    );
  };

  if (isProjectLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!project) return <div className="p-8 text-center">Project not found</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card/30 backdrop-blur px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-start gap-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mt-1 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-3">
              {project.title}
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-primary/20 text-primary border border-primary/20">
                {project.status}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
              {project.logline || "No logline provided."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleProposeShots} 
              disabled={proposeShotsMutation.isPending || !project.logline}
              className="gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black border-none shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
            >
              {proposeShotsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              AI Director
            </Button>
            
            <AddShotDialog projectId={projectId} shotCount={shots?.length || 0} />
          </div>
        </div>
      </header>

      {/* Filmstrip / Grid */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          {isShotsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="aspect-video bg-card border border-border rounded-lg animate-pulse" />)}
            </div>
          ) : orderedShots.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Video className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No shots yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                Start building your storyboard by adding shots manually or let the AI Director propose a sequence based on your logline.
              </p>
              <Button onClick={handleProposeShots} disabled={proposeShotsMutation.isPending || !project.logline} variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Let AI Director Propose Shots
              </Button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={orderedShots.map(s => s.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {orderedShots.map((shot, index) => (
                    <SortableShotCard
                      key={shot.id}
                      shot={shot}
                      index={index}
                      characters={characters || []}
                      projectId={projectId}
                      onGenerateImage={handleGenerateImage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </main>
    </div>
  );
}

function SortableShotCard({
  shot,
  index,
  characters,
  projectId,
  onGenerateImage,
}: {
  shot: Shot;
  index: number;
  characters: Character[];
  projectId: number;
  onGenerateImage: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shot.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ShotCard
        shot={shot}
        index={index}
        characters={characters}
        projectId={projectId}
        onGenerateImage={onGenerateImage}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function ShotCard({ 
  shot, 
  index,
  characters, 
  projectId, 
  onGenerateImage,
  dragHandleProps,
}: { 
  shot: Shot;
  index: number;
  characters: Character[]; 
  projectId: number; 
  onGenerateImage: (id: number) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();
  const updateShot = useUpdateShot();

  const assignedCharacters = characters.filter(c => shot.characterIds?.includes(c.id));

  const handleCharacterToggle = (characterId: number) => {
    const current = shot.characterIds || [];
    const next = current.includes(characterId)
      ? current.filter(id => id !== characterId)
      : [...current, characterId];

    updateShot.mutate(
      { id: shot.id, data: { characterIds: next } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectShotsQueryKey(projectId) });
        }
      }
    );
  };

  return (
    <div className="group relative flex flex-col bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:border-primary/40 transition-colors">
      
      {/* Drag handle — visible on hover */}
      <button
        {...dragHandleProps}
        className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center h-6 w-8 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm border border-white/10 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5 text-white/80" />
      </button>

      {/* Media Container - 16:9 */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        {shot.imageUrl ? (
          <img src={shot.imageUrl} alt={shot.prompt} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center flex flex-col items-center">
            {shot.status === 'generating' ? (
              <>
                <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
                <span className="text-xs text-primary font-medium uppercase tracking-wider">Generating</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <span className="text-xs text-muted-foreground/50 uppercase tracking-wider font-semibold">No Image</span>
              </>
            )}
          </div>
        )}

        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono font-medium text-white border border-white/10 shadow-sm">
          SH {String(index).padStart(2, '0')}
        </div>
        
        <div className="absolute top-2 right-2 flex gap-1">
          <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold uppercase text-white/90 border border-white/10">
            {shot.shotType.replace('-', ' ')}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
          {shot.cameraAngle}
        </div>
        <p className="text-sm text-foreground/90 line-clamp-3 mb-3 flex-1">
          {shot.prompt}
        </p>

        {/* Character chips */}
        {assignedCharacters.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {assignedCharacters.map(char => (
              <span
                key={char.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/20"
              >
                <Users className="h-2.5 w-2.5" />
                {char.name}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            {shot.status === 'ready' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            {shot.status === 'generating' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />}
            {shot.status === 'draft' && <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />}
            <span className="text-xs text-muted-foreground capitalize">{shot.status}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => onGenerateImage(shot.id)}
              disabled={shot.status === 'generating'}
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </Button>

            {/* Character picker popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${assignedCharacters.length > 0 ? 'text-primary' : 'text-muted-foreground'} hover:text-primary hover:bg-primary/10`}
                >
                  <Users className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-2">
                  Cast Characters
                </p>
                {characters.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-1">
                    No characters yet. Create some in the Characters tab.
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    {characters.map(char => {
                      const assigned = shot.characterIds?.includes(char.id);
                      return (
                        <button
                          key={char.id}
                          onClick={() => handleCharacterToggle(char.id)}
                          disabled={updateShot.isPending}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors ${
                            assigned 
                              ? 'bg-primary/15 text-primary' 
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <div className={`h-4 w-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                            assigned ? 'bg-primary border-primary' : 'border-border'
                          }`}>
                            {assigned && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                          </div>
                          <span className="truncate">{char.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <ShotEditDialog shot={shot} projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ShotEditDialog({ shot, projectId }: { shot: Shot; projectId: number }) {
  const [open, setOpen] = useState(false);
  const updateShot = useUpdateShot();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      shotType: shot.shotType,
      cameraAngle: shot.cameraAngle,
      prompt: shot.prompt,
    }
  });

  // Sync form when shot changes
  useEffect(() => {
    form.reset({
      shotType: shot.shotType,
      cameraAngle: shot.cameraAngle,
      prompt: shot.prompt,
    });
  }, [shot.id]);

  const onSubmit = (data: any) => {
    updateShot.mutate(
      { id: shot.id, data },
      {
        onSuccess: () => {
          setOpen(false);
          queryClient.invalidateQueries({ queryKey: getListProjectShotsQueryKey(projectId) });
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card">
        <DialogHeader>
          <DialogTitle>Edit Shot SH {String(shot.position).padStart(2, '0')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shotType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shot Type</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. wide, close-up" className="bg-input/50" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cameraAngle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Camera Angle</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. High angle" className="bg-input/50" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Describe the scene..." className="min-h-[100px] bg-input/50 resize-none" />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateShot.isPending}>
                {updateShot.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddShotDialog({ projectId, shotCount }: { projectId: number, shotCount: number }) {
  const [open, setOpen] = useState(false);
  const createShot = useCreateShot();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      shotType: "wide",
      cameraAngle: "Eye level",
      prompt: "",
    }
  });

  const onSubmit = (data: any) => {
    createShot.mutate({
      id: projectId,
      data: {
        ...data,
        position: shotCount + 1
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListProjectShotsQueryKey(projectId) });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Shot
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card">
        <DialogHeader>
          <DialogTitle>Add Manual Shot</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shotType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shot Type</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. wide, close-up" className="bg-input/50" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cameraAngle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Camera Angle</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. High angle" className="bg-input/50" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Describe the scene..." className="min-h-[100px] bg-input/50 resize-none" />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createShot.isPending}>
                {createShot.isPending ? "Adding..." : "Add Shot"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
