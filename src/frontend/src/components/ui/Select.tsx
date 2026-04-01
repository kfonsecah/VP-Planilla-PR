'use client';

import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from 'lucide-react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface SelectGroupProps {
  children: React.ReactNode;
}

interface SelectLabelProps {
  children: React.ReactNode;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, placeholder, disabled, className, children }) => (
  <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
    <SelectPrimitive.Trigger
      className={`inline-flex items-center justify-between w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
    >
      <SelectPrimitive.Value placeholder={placeholder} />
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="w-4 h-4 text-zinc-400 flex-shrink-0 ml-2" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className="overflow-hidden bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50"
        position="popper"
        sideOffset={4}
      >
        <SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-6 bg-zinc-900 text-zinc-400 cursor-default">
          <ChevronUpIcon className="w-4 h-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-6 bg-zinc-900 text-zinc-400 cursor-default">
          <ChevronDownIcon className="w-4 h-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>
);

const SelectItem: React.FC<SelectItemProps> = ({ value, children, className }) => (
  <SelectPrimitive.Item
    value={value}
    className={`relative flex items-center gap-2 px-3 py-2 text-sm text-zinc-100 rounded-md cursor-pointer select-none outline-none hover:bg-zinc-700 focus:bg-zinc-700 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed ${className || ''}`}
  >
    <SelectPrimitive.ItemIndicator>
      <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
    </SelectPrimitive.ItemIndicator>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
);

const SelectGroup: React.FC<SelectGroupProps> = ({ children }) => (
  <SelectPrimitive.Group>{children}</SelectPrimitive.Group>
);

const SelectLabel: React.FC<SelectLabelProps> = ({ children, className }) => (
  <SelectPrimitive.Label className={`px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider ${className || ''}`}>
    {children}
  </SelectPrimitive.Label>
);

export { Select, SelectItem, SelectGroup, SelectLabel };
