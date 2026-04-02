"use client";

import { useEffect, useState, useCallback } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { BellIcon, CheckIcon, ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

/**
 * Notification type icon mapping.
 */
function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    payroll_generated: "💰",
    payment_processed: "💳",
    employee_action: "👤",
    system: "⚙️",
    report_generated: "📊",
  };
  return icons[type] || "🔔";
}

/**
 * Format date to Spanish locale.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const {
    data,
    total,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useNotifications();

  const [page, setPage] = useState(1);
  const limit = 20;

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;
      setPage(newPage);
    },
    [totalPages]
  );

  useEffect(() => {
    fetchNotifications(page, limit);
  }, [page, fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
    // Refetch to update the list
    fetchNotifications(page, limit);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    fetchNotifications(page, limit);
  };

  return (
    <div className="min-h-screen bg-[#E7DCC1] dark:bg-zinc-950 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FCF1D5] dark:bg-zinc-800 rounded-lg flex items-center justify-center">
              <BellIcon className="w-5 h-5 text-[#4A5D3A] dark:text-zinc-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#4A5D3A] dark:text-zinc-100">
                Notificaciones
              </h1>
              <p className="text-sm text-[#6B7556] dark:text-zinc-400">
                {unreadCount > 0
                  ? `${unreadCount} sin leer`
                  : "Todas las notificaciones están leídas"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-[#4A5D3A] hover:bg-[#3A4D2A] dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white dark:text-zinc-100 rounded-lg text-sm font-medium transition-colors"
            >
              <CheckIcon className="w-4 h-4" />
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 overflow-auto rounded-lg border border-red-200 dark:border-red-800">
            <div className="bg-red-50 dark:bg-red-950/50 p-6 text-center">
              <ExclamationTriangleIcon className="w-10 h-10 mb-3 text-red-500 dark:text-red-400 mx-auto" />
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error al cargar datos</p>
              <p className="text-xs text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => fetchNotifications(page, limit)}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Notification List */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-[#D4C89A] dark:border-zinc-800 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="px-4 py-4 animate-pulse flex items-start gap-3"
                >
                  <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
                  </div>
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-20" />
                </div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <BellIcon className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                No hay notificaciones
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                Las notificaciones aparecerán aquí cuando estén disponibles
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {data.map((notification) => (
                <div
                  key={notification.notifications_id}
                  className={`px-4 py-4 flex items-start gap-3 transition-colors ${
                    !notification.notifications_is_read
                      ? "bg-[#FFF9E6] dark:bg-zinc-800/30"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  {/* Type Icon */}
                  <div className="w-8 h-8 bg-[#FCF1D5] dark:bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">
                    {getTypeIcon(notification.notifications_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#4A5D3A] dark:text-zinc-100">
                        {notification.notifications_title}
                      </p>
                      {!notification.notifications_is_read && (
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-[#6B7556] dark:text-zinc-400 mt-0.5">
                      {notification.notifications_message}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                      {formatDate(notification.notifications_created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {!notification.notifications_is_read && (
                      <button
                        onClick={() =>
                          handleMarkAsRead(notification.notifications_id)
                        }
                        className="px-3 py-1.5 text-xs font-medium text-[#4A5D3A] dark:text-zinc-300 bg-[#FCF1D5] dark:bg-zinc-800 hover:bg-[#F0E6D2] dark:hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        Marcar como leída
                      </button>
                    )}
                    {notification.notifications_is_read && (
                      <span className="px-3 py-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        Leída
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && data.length > 0 && (
            <div className="px-4 py-3 bg-[#F8F6F1] dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Mostrando {(page - 1) * limit + 1}–
                {Math.min(page * limit, total)} de {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-xs font-medium text-[#4A5D3A] dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-[#D4C89A] dark:border-zinc-700 rounded-lg hover:bg-[#FCF1D5] dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 px-2">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-xs font-medium text-[#4A5D3A] dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-[#D4C89A] dark:border-zinc-700 rounded-lg hover:bg-[#FCF1D5] dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
