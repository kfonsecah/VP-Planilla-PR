"use client"; // Mark this component as a client component

import "@/styles/globals.css";
import Sidebar from "@/components/ui/Sidebar";
import Header from "@/components/ui/Header";
import { usePathname } from 'next/navigation'; // Import usePathname

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname(); // Get the current path

  // Check if the current path starts with '/pages/auth'
  const isAuthPage = pathname.startsWith('/pages/auth');

  return (
    <html lang="en">
      <body>
        {/* Conditionally render the layout */}
        {isAuthPage ? (
          // If it's an auth page, just render the children without the layout
          <div className="h-screen bg-[#FBF8F0]"> {/* Still apply background to the whole screen */}
            {children}
          </div>
        ) : (          // If it's not an auth page, render the full layout
          <div className="flex h-screen bg-[#E7DCC1]">
            <Sidebar />
            <div className="flex flex-col flex-1">
              <Header />
              <main className="flex-1 overflow-hidden">
                {children}
              </main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
