import { useEffect, useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { 
  useGetProject, 
  useListProjectShots, 
  useCreateShot, 
  useGenerateShotImage,
  getListProjectShotsQueryKey,
  getGetProjectQueryKey
} from "@workspace/api-client-react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Plus, Image as ImageIcon, Video, MoreHorizontal, Loader2 } from "lucide-react";
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

  const createShot = useCreateShot();
  const generateImage = useGenerateShotImage();
  const queryClient = useQueryClient();
  
  const proposeShotsMutation = useMutation({
    mutationFn: proposeShotsMutationFn
  });

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
          ) : shots?.length === 0 ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {shots?.map((shot) => (
                <div key={shot.id} className="group relative flex flex-col bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:border-primary/40 transition-colors">
                  
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
                      SH {String(shot.position).padStart(2, '0')}
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
                    <p className="text-sm text-foreground/90 line-clamp-3 mb-4 flex-1">
                      {shot.prompt}
                    </p>
                    
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
                          onClick={() => handleGenerateImage(shot.id)}
                          disabled={shot.status === 'generating'}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
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