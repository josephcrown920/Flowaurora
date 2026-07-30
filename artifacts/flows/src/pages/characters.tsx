import { useState } from "react";
import { 
  useListCharacters, 
  useCreateCharacter, 
  useGenerateCharacterPortrait,
  getListCharactersQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, UserCircle2, Loader2, Sparkles } from "lucide-react";
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

export default function Characters() {
  const { data: characters, isLoading } = useListCharacters();
  const generatePortrait = useGenerateCharacterPortrait();
  const queryClient = useQueryClient();

  const handleGeneratePortrait = (characterId: number) => {
    generatePortrait.mutate({ data: { characterId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCharactersQueryKey() });
      }
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex-shrink-0 border-b border-border bg-card/30 backdrop-blur px-6 py-6 md:px-10">
        <div className="max-w-6xl mx-auto flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Character Library</h1>
            <p className="text-muted-foreground">Define persistent actors for your storyboards.</p>
          </div>
          <AddCharacterDialog />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 rounded-xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : characters?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <UserCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No characters yet</h3>
              <p className="text-muted-foreground mb-8">
                Create characters to maintain visual consistency across your shots and scenes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {characters?.map((char) => (
                <div key={char.id} className="group flex flex-col rounded-xl bg-card border border-border overflow-hidden hover:border-primary/40 transition-colors">
                  <div className="aspect-[3/4] bg-muted relative overflow-hidden flex items-center justify-center">
                    {char.referenceImageUrl ? (
                      <img src={char.referenceImageUrl} alt={char.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <UserCircle2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                        <span className="text-xs text-muted-foreground/50 uppercase tracking-wider font-semibold">No Reference</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="gap-2 bg-black/60 backdrop-blur hover:bg-primary hover:text-black border border-white/10"
                        onClick={() => handleGeneratePortrait(char.id)}
                        disabled={generatePortrait.isPending}
                      >
                        {generatePortrait.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Generate
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col">
                    <h3 className="font-bold text-lg leading-tight mb-1">{char.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{char.description}</p>
                    {char.wardrobe && (
                      <div className="mt-auto pt-2 border-t border-border/50">
                        <p className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-semibold mb-1">Wardrobe</p>
                        <p className="text-xs text-foreground/80 line-clamp-1">{char.wardrobe}</p>
                      </div>
                    )}
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

function AddCharacterDialog() {
  const [open, setOpen] = useState(false);
  const createCharacter = useCreateCharacter();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      wardrobe: "",
    }
  });

  const onSubmit = (data: any) => {
    createCharacter.mutate({ data }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListCharactersQueryKey() });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Character
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-border bg-card">
        <DialogHeader>
          <DialogTitle>Add Character</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Detective Miller" className="bg-input/50" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Physical Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Mid 40s, weathered face, short gray hair..." 
                      className="min-h-[80px] bg-input/50 resize-none" 
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wardrobe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wardrobe / Styling</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Classic trench coat, loose tie" className="bg-input/50" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createCharacter.isPending}>
                {createCharacter.isPending ? "Adding..." : "Add Character"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}