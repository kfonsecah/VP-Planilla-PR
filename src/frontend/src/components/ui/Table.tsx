"use client";

import React from 'react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

type Column<T> = {
  key: keyof T | string;
  title: string;
  render?: (item: T) => React.ReactNode;
};

interface TableProps<T> {
  columns: Column<T>[];
  data: T[] | { data: T[] } | T | null;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  skeletonRows?: number;
  onRetry?: () => void;
}

export default function Table<T extends { id?: number | string }>({
  columns,
  data,
  onEdit,
  onDelete,
  isLoading = false,
  error = null,
  emptyMessage,
  skeletonRows = 5,
  onRetry,
}: TableProps<T>) {
  // Normalize data to an array to avoid runtime errors when API returns object or single item
  const rows: T[] = Array.isArray(data)
    ? data
    : data && Array.isArray((data as { data: T[] }).data)
      ? (data as { data: T[] }).data
      : data
        ? [data as T]
        : [];

  // Error state
  if (error) {
    return (
      <div className="overflow-auto rounded-lg border border-red-200 dark:border-red-800">
        <div className="bg-red-50 dark:bg-red-950/50 p-6 text-center">
          <div className="flex flex-col items-center">
            <svg className="w-10 h-10 mb-3 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error al cargar datos</p>
            <p className="text-xs text-red-600 dark:text-red-400 mb-4">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading state with skeleton rows
  if (isLoading) {
    return (
      <div className="overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="min-w-full bg-white dark:bg-zinc-900">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className="px-4 py-2.5 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">{col.title}</th>
              ))}
              <th className="px-4 py-2.5 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {Array.from({ length: skeletonRows }).map((_, index) => (
              <tr key={index} className="animate-pulse">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-16 ml-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="min-w-full bg-white dark:bg-zinc-900">
        <thead className="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="px-4 py-2.5 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">{col.title}</th>
            ))}
            <th className="px-4 py-2.5 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {rows.map((row) => (
            <tr key={String(row.id ?? Math.random())} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200">
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key as string] ?? '')}
                </td>
              ))}
              <td className="px-4 py-2.5 text-sm text-right">
                <div className="flex items-center justify-end gap-1">
                  {onEdit && (
                    <button onClick={() => onEdit(row)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors" title="Editar">
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(row)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Eliminar">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center text-zinc-400 dark:text-zinc-500">
                  <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm font-medium">{emptyMessage || 'No hay datos disponibles'}</p>
                  <p className="text-xs mt-1">Intenta ajustar los filtros o agregar nuevos registros</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
