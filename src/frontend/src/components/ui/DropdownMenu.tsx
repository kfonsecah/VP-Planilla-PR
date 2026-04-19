'use client';

import React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, children, align = 'end', sideOffset = 4 }) => (
  <DropdownMenuPrimitive.Root>
    <DropdownMenuPrimitive.Trigger asChild>
      {trigger}
    </DropdownMenuPrimitive.Trigger>
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150"
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  </DropdownMenuPrimitive.Root>
);

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuContent = DropdownMenuPrimitive.Content;

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ children, onClick, className, disabled }) => (
  <DropdownMenuPrimitive.Item
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 text-sm text-zinc-100 px-3 py-2 rounded-md cursor-pointer select-none outline-none hover:bg-zinc-700 focus:bg-zinc-700 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed ${className || ''}`}
  >
    {children}
  </DropdownMenuPrimitive.Item>
);

interface DropdownMenuSeparatorProps {
  className?: string;
}

const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ className }) => (
  <DropdownMenuPrimitive.Separator className={`bg-zinc-700 h-px my-1 ${className || ''}`} />
);

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ children, className }) => (
  <DropdownMenuPrimitive.Label className={`px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider ${className || ''}`}>
    {children}
  </DropdownMenuPrimitive.Label>
);

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel };
