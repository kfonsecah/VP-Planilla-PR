"use client";

import Sidebar from "@/components/ui/Sidebar";
import Header from "@/components/ui/Header";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { ClockLogsProvider } from '@/hooks/useClockLogsContext';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { LegalParamAlertsProvider } from '@/context/LegalParamAlertsContext';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';

function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname.startsWith('/pages/auth');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isAuthenticated, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated && !isAuthPage) {
      router.push('/pages/auth');
    }
  }, [loading, isAuthenticated, isAuthPage, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowLogoutConfirm(false);
    await logout();
    setIsLoggingOut(false);
  };

  return isAuthPage ? (
    <div className="h-screen bg-[#FBF8F0] dark:bg-zinc-950">{children}</div>
  ) : (
    <div className="flex h-screen bg-[#E7DCC1] dark:bg-zinc-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - hidden on mobile unless open */}
      <div className={`
        fixed md:relative z-50 h-full transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar 
          onClose={() => setSidebarOpen(false)} 
          onLogoutClick={() => setShowLogoutConfirm(true)}
          isLoggingOut={isLoggingOut}
        />
      </div>
      
      <div className="flex flex-col flex-1 min-w-0">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Logout confirmation - rendered at root level so z-index works correctly */}
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Cerrar sesión"
        description="¿Estás seguro de que deseas cerrar sesión? Perderás acceso temporal hasta volver a iniciar."
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ClockLogsProvider>
          <TooltipProvider>
            <LegalParamAlertsProvider>
              <InnerLayout>{children}</InnerLayout>
            </LegalParamAlertsProvider>
          </TooltipProvider>
        </ClockLogsProvider>
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: '#18181b',
              border: '1px solid #3f3f46',
              color: '#f4f4f5',
            },
          }}
        />
      </ThemeProvider>
    </AuthProvider>
  );
}
