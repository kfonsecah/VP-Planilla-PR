'use client';

import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, side = 'top' }) => (
  <TooltipPrimitive.Tooltip delayDuration={200}>
    <TooltipPrimitive.Trigger asChild>
      {children}
    </TooltipPrimitive.Trigger>
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={6}
        className="bg-zinc-800 text-zinc-100 text-xs px-2.5 py-1.5 rounded-md border border-zinc-700 shadow-lg animate-in fade-in zoom-in-95 duration-150 z-50"
      >
        {content}
        <TooltipPrimitive.Arrow className="fill-zinc-800" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  </TooltipPrimitive.Tooltip>
);

const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TooltipPrimitive.Provider delayDuration={200}>
    {children}
  </TooltipPrimitive.Provider>
);

export { Tooltip, TooltipProvider };
