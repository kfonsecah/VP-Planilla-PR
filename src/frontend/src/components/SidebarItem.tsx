'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface SidebarItemProps {
  href: string;
  icon: string;
  text: string;
  subItems?: { href: string; text: string }[]; // Optional array for submenus
}

const SidebarItem: React.FC<SidebarItemProps> = ({ href, icon, text, subItems }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (subItems && subItems.some(sub => pathname.startsWith(sub.href)));
  const [isOpen, setIsOpen] = useState(isActive); // State to manage submenu open/close

  const toggleSubmenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if it's a parent item with submenus
    setIsOpen(!isOpen);
  };

  return (
    <div>      <Link
        href={subItems ? '#' : href} // If subItems exist, link to # or prevent default
        onClick={subItems ? toggleSubmenu : undefined}
        className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${
          isActive ? 'bg-[#4A5D3A] text-white' : 'text-[#4A5D3A] hover:bg-[#E7DCC1]'
        } ${subItems ? 'cursor-pointer' : ''}`} // Add cursor pointer for items with submenus
      >
        <div className="mr-2 text-lg">
          <Image src={icon} alt={text} width={20} height={20} />
        </div>
        <span className="flex-1 text-sm font-medium">
          {text}
        </span>
        {subItems && (
          <span className="ml-2 text-xs">
            {isOpen ? '▲' : '▼'} {/* Arrow indicator for submenu */}
          </span>
        )}
      </Link>
      {subItems && isOpen && (
        <div className="pl-6 mt-1 space-y-0.5"> {/* Submenu container */}
          {subItems.map((subItem) => (
            <Link
              key={subItem.href}
              href={subItem.href}
              className={`flex items-center p-1.5 rounded-md transition-colors duration-200 text-xs ${
                pathname === subItem.href ? 'bg-[#4A5D3A] text-white font-medium' : 'text-[#6B7556] hover:bg-[#E7DCC1]'
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
