import { Sidebar } from "./sidebar";
import { useSearch } from "wouter";

export function Shell({ children }: { children: React.ReactNode }) {
  // If we are in Canvas mode, we might want to hide the sidebar completely 
  // to give max real estate, but keeping a thin sidebar is nice. 
  // We'll keep the sidebar always visible for now, or hide it if search contains canvas.
  const search = useSearch();
  const params = new URLSearchParams(search);
  const isCanvasMode = !!params.get('canvas');

  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden">
      {!isCanvasMode && <Sidebar />}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}