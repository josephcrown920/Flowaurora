import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface Port {
  id: string;
  type: 'target' | 'source';
  position?: Position;
}

interface BaseNodeProps {
  id: string;
  selected?: boolean;
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  badge?: string;
  children: React.ReactNode;
  inputs?: Port[];
  outputs?: Port[];
  width?: number | string;
  className?: string;
  footer?: React.ReactNode;
}

export function BaseNode({
  id,
  selected,
  title,
  icon: Icon,
  iconColor,
  badge,
  children,
  inputs = [],
  outputs = [],
  width = 280,
  className,
  footer,
}: BaseNodeProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow',
        selected ? 'border-primary ring-1 ring-primary' : 'border-border',
        className
      )}
      style={{ width }}
    >
      {/* Inputs */}
      {inputs.map((port, i) => {
        const topPercent = inputs.length === 1 ? 50 : 25 + (50 / (inputs.length - 1)) * i;
        return (
          <Handle
            key={port.id}
            type="target"
            position={port.position || Position.Left}
            id={port.id}
            style={{ top: `${topPercent}%` }}
          />
        );
      })}

      {/* Outputs */}
      {outputs.map((port, i) => {
        const topPercent = outputs.length === 1 ? 50 : 25 + (50 / (outputs.length - 1)) * i;
        return (
          <Handle
            key={port.id}
            type="source"
            position={port.position || Position.Right}
            id={port.id}
            style={{ top: `${topPercent}%` }}
          />
        );
      })}

      <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-3 py-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={cn("flex items-center justify-center rounded-sm", iconColor)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <span className="text-xs font-semibold tracking-wide text-foreground/90">{title}</span>
        </div>
        {badge && (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3">
        {children}
      </div>

      {footer && (
        <div className="border-t border-border/50 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}
