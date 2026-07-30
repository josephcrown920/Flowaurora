import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useListProjects, useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Clapperboard, FolderOpen, MoreVertical, Film } from "lucide-react";
import { format } from "date-fns";
import { CanvasEditor } from "@/components/canvas-editor";
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

function ProjectsList({ onOpenCanvas }: { onOpenCanvas: (id: number) => void }) {
  const { data: projects, isLoading } = useListProjects();
  const createProject = useCreateProject();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      title: "",
      logline: "",
    }
  });

  const onSubmit = (data: { title: string; logline: string }) => {
    createProject.mutate({ data }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      }
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Projects</h1>
          <p className="text-muted-foreground">Manage your storyboards and video pipelines.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] border-border bg-card">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. The Grand Budapest Hotel" className="bg-input/50 border-border" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="logline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logline</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="A brief summary of your story..." 
                          className="min-h-[100px] bg-input/50 border-border resize-none" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createProject.isPending}>
                    {createProject.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Clapperboard className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Your next production starts here</h3>
          <p className="text-muted-foreground mb-8">
            Create a project to start planning shots, generating storyboards, and mapping out your cinematic vision.
          </p>
          <Button onClick={() => setOpen(true)} size="lg" className="px-8">
            Start a Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <div 
              key={project.id} 
              className="group flex flex-col rounded-xl bg-card border border-border overflow-hidden hover:border-primary/50 transition-colors"
            >
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted text-xs font-medium text-muted-foreground border border-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/80"></span>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                  {project.logline || "No logline provided."}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                  <div className="flex items-center gap-1">
                    <Film className="h-3.5 w-3.5" />
                    {project.shotCount} shots
                  </div>
                  <div className="flex items-center gap-1">
                    <FolderOpen className="h-3.5 w-3.5" />
                    {format(new Date(project.updatedAt), "MMM d, yyyy")}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
                <Link href={`/projects/${project.id}`}>
                  <Button variant="secondary" size="sm" className="w-full text-xs mr-2">
                    Storyboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs ml-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                  onClick={() => onOpenCanvas(project.id)}
                >
                  Canvas
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const canvasId = params.get('canvas');

  if (canvasId) {
    return <CanvasEditor projectId={Number(canvasId)} onClose={() => setLocation("/")} />;
  }

  return <ProjectsList onOpenCanvas={(id) => setLocation(`/?canvas=${id}`)} />;
}