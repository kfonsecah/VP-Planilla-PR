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
    <div>
      <Link
        href={subItems ? '#' : href} // If subItems exist, link to # or prevent default
        onClick={subItems ? toggleSubmenu : undefined}
        className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
          isActive ? 'bg-[#3B4D36] text-green-800' : 'text-[#3B4D36] hover:bg-[#53614A1F]'
        } ${subItems ? 'cursor-pointer' : ''}`} // Add cursor pointer for items with submenus
      >
        <div className="mr-3 text-xl">
          <Image src={icon} alt={text} width={32} height={32} />
        </div>
        <span className="flex-1 text-lg font-medium">
          {text}
        </span>
        {subItems && (
          <span className="ml-2">
            {isOpen ? '▲' : '▼'} {/* Arrow indicator for submenu */}
          </span>
        )}
      </Link>
      {subItems && isOpen && (
        <div className="pl-8 mt-1 space-y-1"> {/* Submenu container */}
          {subItems.map((subItem) => (
            <Link
              key={subItem.href}
              href={subItem.href}
              className={`flex items-center p-2 rounded-lg transition-colors duration-200 text-sm ${
                pathname === subItem.href ? 'bg-[#3B4D36] text-green-700 font-semibold' : 'text-[#3B4D36] hover:bg-[#53614A1F]'
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
