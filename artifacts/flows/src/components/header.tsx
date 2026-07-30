import React from 'react';
import { Play, Share2, Undo2, Redo2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TemplatesPanel } from './templates-panel';

interface HeaderProps {
  onRun: () => void;
  isRunning: boolean;
  onSelectTemplate: (id: string) => void;
}

export function Header({ onRun, isRunning, onSelectTemplate }: HeaderProps) {
  const [projectName, setProjectName] = React.useState('Untitled Project');
  const [isEditing, setIsEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <header className="absolute top-0 left-0 right-0 h-14 border-b border-border/50 bg-background/80 backdrop-blur-md z-50 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white" />
          </div>
          <span className="font-bold tracking-wide">Flows</span>
        </div>
        
        <div className="h-4 w-px bg-border/50" />
        
        <div className="flex items-center">
          <TemplatesPanel onSelectTemplate={onSelectTemplate} />
        </div>
        
        <div className="h-4 w-px bg-border/50" />

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
            className="h-8 rounded px-2 text-sm font-medium bg-muted/20 border border-border focus:outline-none focus:border-primary w-[200px]"
          />
        ) : (
          <div 
            className="h-8 flex items-center px-2 text-sm font-medium hover:bg-muted/50 rounded cursor-pointer transition-colors"
            onClick={() => setIsEditing(true)}
          >
            {projectName}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 mr-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" size="sm" className="h-8 gap-2 hidden sm:flex">
          <Users className="h-3.5 w-3.5" />
          Collaborate
        </Button>
        
        <Button size="sm" className="h-8 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 ml-1">
          <Share2 className="h-3.5 w-3.5" />
          Export
        </Button>

        <Button 
          size="sm" 
          className="h-8 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 ml-2"
          onClick={onRun}
          disabled={isRunning}
        >
          {isRunning ? (
             <div className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
          {isRunning ? 'Running...' : 'Run Flow'}
        </Button>
      </div>
    </header>
  );
}
