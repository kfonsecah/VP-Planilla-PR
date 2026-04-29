"use client";
import { getCurrentSpanishFormattedDateString } from "@/utils/time";
import { useWeather } from "@/utils/weather";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/user";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/hooks/useNotifications";
import { useLegalParamAlertsContext } from "@/context/LegalParamAlertsContext";
import { SunIcon, MoonIcon, Bars3Icon, BellIcon } from "@heroicons/react/24/outline";
import { NotificationPanel } from "./NotificationPanel";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const currentDate = getCurrentSpanishFormattedDateString();
  const { weather: currentWeather, isLoadingWeather } = useWeather();
  const { user: currentUser } = useUser();
  const { theme, toggleTheme, mounted } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const { data, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const { alerts: legalAlerts } = useLegalParamAlertsContext();
  const legalAlertCount = legalAlerts.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const getFullName = () => {
    if (!currentUser) return "Usuario";

    const { first_name, last_name, middle_name  } = currentUser;
    
    const nameParts = [
      first_name?.trim(),
      last_name?.trim(),
      middle_name?.trim() 
    ].filter(Boolean);
    
    return nameParts.length > 0 ? nameParts.join(" ") : "Usuario";
  };

  const toggleNotifications = () => {
    if (!showNotifications) {
      fetchNotifications(1, 10);
    }
    setShowNotifications(!showNotifications);
  };

  const handleMarkRead = useCallback(async (id: number) => {
    await markAsRead(id);
  }, [markAsRead]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  return (
    <header className="bg-[#FCF1D5] dark:bg-zinc-900 border-b border-[#D4C89A] dark:border-zinc-800 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-[#F0E6D2] dark:hover:bg-zinc-800 text-[#4A5D3A] dark:text-zinc-400"
          aria-label="Open menu"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-base font-medium text-[#4A5D3A] dark:text-zinc-100 leading-tight">
            Bienvenido de vuelta, {getFullName()}
          </h1>
          <p className="text-sm text-[#D9C38B] dark:text-zinc-400 mt-0.5">
            {currentDate} |{" "}
            {isLoadingWeather
              ? "Cargando clima..."
              : `Día de ${currentWeather?.description} en ${currentWeather?.city}`}
          </p>
        </div>
      </div>
      <div className="relative flex items-center space-x-3 notification-container">
        {mounted && (
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full border border-[rgba(184,179,166,0.37)] dark:border-zinc-700 flex items-center justify-center text-[#4A5D3A] dark:text-zinc-400 hover:bg-[#F0E6D2] dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <MoonIcon className="w-5 h-5" />
            ) : (
              <SunIcon className="w-5 h-5" />
            )}
          </button>
        )}
        
        <div 
          className="relative w-8 h-8 rounded-full border border-[rgba(184,179,166,0.37)] dark:border-zinc-700 flex items-center justify-center text-[#4A5D3A] dark:text-zinc-400 hover:bg-[#F0E6D2] dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          onClick={toggleNotifications}
        >
          <BellIcon className="w-5 h-5" />
          {unreadCount > 0 && (
            <div className="absolute flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full -top-1 -right-1">
              {unreadCount}
            </div>
          )}
          {legalAlertCount > 0 && (
            <div
              className="absolute w-1.5 h-1.5 bg-red-500 rounded-full bottom-0 right-0"
              aria-label={`${legalAlertCount} alertas legales sin revisar`}
            />
          )}
        </div>
      </div>

      <NotificationPanel
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={data}
        unreadCount={unreadCount}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        isLoading={isLoading}
      />
    </header>
  );
}
