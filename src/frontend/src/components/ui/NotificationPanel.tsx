"use client";

import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Notification } from "@/types/notification";

// Lazy-load framer-motion animation primitives
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  isLoading: boolean;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.1 } },
};

/**
 * Relative time formatter for notification timestamps.
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Hace un momento";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHr < 24) return `Hace ${diffHr}h`;
  if (diffDay < 7) return `Hace ${diffDay}d`;
  return date.toLocaleDateString("es-CR");
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  open,
  onClose,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  isLoading,
}) => {
  const router = useRouter();

  return (
    <AnimatePresence>
      {open && (
        <MotionDiv
          className="fixed inset-0 z-50"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Panel */}
          <MotionDiv
            className="absolute top-16 right-6 w-80 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-[#E0D6B7] dark:border-zinc-800 z-50"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#F0EDE5] dark:border-zinc-800 bg-[#FCF1D5] dark:bg-zinc-800 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#4A5D3A] dark:text-zinc-100 text-sm">
                  Notificaciones
                </h3>
                <span className="text-xs text-[#6B7556] dark:text-zinc-400">
                  {unreadCount} sin leer
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-96">
              {isLoading ? (
                <div className="px-4 py-3 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                          <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No hay notificaciones
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.notifications_id}
                    className={`px-4 py-3 border-b border-[#F8F6F1] dark:border-zinc-800 hover:bg-[#FDFCF9] dark:hover:bg-zinc-800/50 transition-colors cursor-pointer ${
                      !notification.notifications_is_read && notification.notifications_type === 'LEGAL_PARAM_CHANGE'
                        ? 'bg-red-50/50 dark:bg-red-900/10'
                        : !notification.notifications_is_read
                          ? 'bg-[#FFF9E6] dark:bg-zinc-800/30'
                          : ''
                    }`}
                    onClick={() => {
                      if (!notification.notifications_is_read) {
                        onMarkRead(notification.notifications_id);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {notification.notifications_type === 'LEGAL_PARAM_CHANGE'
                        ? <ShieldExclamationIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-1" />
                        : <div
                            className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              !notification.notifications_is_read
                                ? "bg-blue-500"
                                : "bg-gray-300 dark:bg-zinc-600"
                            }`}
                          />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-[#4A5D3A] dark:text-zinc-100 truncate">
                            {notification.notifications_title}
                          </p>
                          <span className="text-xs text-[#8B8B8B] dark:text-zinc-500 flex-shrink-0 ml-2">
                            {formatRelativeTime(
                              notification.notifications_created_at
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7556] dark:text-zinc-400 mt-1 leading-relaxed">
                          {notification.notifications_message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-[#F8F6F1] dark:bg-zinc-800 rounded-b-lg flex items-center justify-between">
              {unreadCount > 0 && (
                <button
                  className="text-xs text-[#4A5D3A] dark:text-zinc-400 hover:text-[#2A3A1A] dark:hover:text-zinc-200 font-medium transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAllRead();
                  }}
                >
                  Marcar todas como leídas
                </button>
              )}
              <button
                onClick={() => {
                  onClose();
                  router.push("/pages/notifications");
                }}
                className="text-xs text-[#4A5D3A] dark:text-zinc-400 hover:text-[#2A3A1A] dark:hover:text-zinc-200 font-medium transition-colors"
              >
                Ver todas las notificaciones
              </button>
            </div>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};
