'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface SidebarItemProps {
  href: string;
  icon: string;
  text: string;
  subItems?: { href: string; text: string }[];
}

const SidebarItem: React.FC<SidebarItemProps> = ({ href, icon, text, subItems }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (subItems && subItems.some(sub => pathname.startsWith(sub.href)));
  const [isOpen, setIsOpen] = useState(isActive);

  const toggleSubmenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <Link
        href={subItems ? '#' : href}
        onClick={subItems ? toggleSubmenu : undefined}
        className={`flex items-center gap-3 p-2 rounded-lg transition-colors duration-200 ${
          isActive 
            ? 'bg-[#E7DCC1] dark:bg-zinc-700/50 border-l-2 border-green-500 text-[#4A5D3A] dark:text-zinc-100 font-medium' 
            : 'text-[#4A5D3A] dark:text-zinc-400 hover:bg-[#E7DCC1] dark:hover:bg-zinc-800'
        } ${subItems ? 'cursor-pointer' : ''}`}
      >
        <div className="flex-shrink-0 w-5 h-5">
          <Image src={icon} alt={text} width={20} height={20} loading="eager" />
        </div>
        <span className="flex-1 text-sm font-medium">
          {text}
        </span>
        {subItems && (
          <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
            {isOpen ? '▲' : '▼'}
          </span>
        )}
      </Link>
      {subItems && isOpen && (
        <div className="pl-6 mt-1 space-y-0.5">
          {subItems.map((subItem) => (
            <Link
              key={subItem.href}
              href={subItem.href}
              className={`flex items-center p-1.5 rounded-md transition-colors duration-200 text-xs ${
                pathname === subItem.href 
                  ? 'bg-[#E7DCC1] dark:bg-zinc-700/50 text-[#4A5D3A] dark:text-zinc-100 font-medium' 
                  : 'text-[#6B7556] dark:text-zinc-500 hover:bg-[#E7DCC1] dark:hover:bg-zinc-800'
              }`}
            >
              {subItem.text}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarItem;
