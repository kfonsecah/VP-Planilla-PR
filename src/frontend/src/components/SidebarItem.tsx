'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

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

  // Sync expansion state with active route changes
  useEffect(() => {
    if (isActive) {
      setIsOpen(true);
    }
  }, [isActive]);

  const toggleSubmenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Evitar que el clic llegue al Link si el layout cambia
    setIsOpen(!isOpen);
  };

  return (
    <div className="group/sidebar-item">
      <div className="relative">
        <Link
          href={href}
          className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200 group ${
            isActive
              ? 'bg-green-600 text-white shadow-sm shadow-green-900/20'
              : 'text-[#4A5D3A] dark:text-zinc-400 hover:bg-[#E7DCC1] dark:hover:bg-zinc-800 hover:text-[#3A4D2A] dark:hover:text-zinc-100'
          }`}
        >
          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
            <Image
              src={icon}
              alt={text}
              width={18}
              height={18}
              loading="eager"
              className={isActive ? 'brightness-0 invert' : 'opacity-75 group-hover:opacity-100'}
            />
          </div>
          <span className="flex-1 text-sm font-medium leading-none">
            {text}
          </span>
        </Link>

        {subItems && (
          <button
            onClick={toggleSubmenu}
            className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all duration-200 z-10 ${
              isActive 
                ? 'text-white/70 hover:bg-white/10' 
                : 'text-[#7A8F6A] dark:text-zinc-500 hover:bg-[#D0C8A8]/30 dark:hover:bg-zinc-700/50'
            }`}
            aria-label={isOpen ? 'Colapsar' : 'Expandir'}
          >
            <ChevronDownIcon
              className={`w-3.5 h-3.5 transition-all duration-300 ease-in-out transform ${
                isOpen ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>
        )}
      </div>

      {subItems && isOpen && (
        <div className="pl-4 mt-0.5 space-y-0.5 relative">
          {/* Línea guía vertical */}
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-[#D0C8A8] dark:bg-zinc-700" />
          {subItems.map((subItem) => {
            const subActive = pathname === subItem.href;
            return (
              <Link
                key={subItem.href}
                href={subItem.href}
                className={`flex items-center pl-3 pr-2 py-1.5 rounded-md transition-all duration-200 text-xs ${
                  subActive
                    ? 'text-green-700 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20'
                    : 'text-[#6B7556] dark:text-zinc-500 hover:text-[#3A4D2A] dark:hover:text-zinc-200 hover:bg-[#E7DCC1] dark:hover:bg-zinc-800'
                }`}
              >
                {subItem.text}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SidebarItem;
