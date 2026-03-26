"use client";

import React from 'react';

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
}

export default function Table<T extends { id?: number | string }>({ columns, data, onEdit, onDelete }: TableProps<T>) {
  // Normalize data to an array to avoid runtime errors when API returns object or single item
  const rows: T[] = Array.isArray(data)
    ? data
    : data && Array.isArray((data as { data: T[] }).data)
      ? (data as { data: T[] }).data
      : data
        ? [data as T]
        : [];

  return (
    <div className="overflow-auto">
      <table className="min-w-full bg-white dark:bg-[#333333] border border-gray-200 dark:border-[#404040]">
        <thead className="bg-gray-100 dark:bg-[#252525]">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-[#E5E5E5]">{col.title}</th>
            ))}
            <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-[#E5E5E5]">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row.id ?? Math.random())} className="border-t border-gray-200 dark:border-[#404040]">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-2 text-sm text-gray-800 dark:text-[#E5E5E5]">
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key as string] ?? '')}
                </td>
              ))}
              <td className="px-4 py-2 text-sm text-right">
                {onEdit && (
                  <button onClick={() => onEdit(row)} className="mr-2 px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded text-sm">Editar</button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(row)} className="px-3 py-1 bg-red-600 dark:bg-red-700 text-white rounded text-sm">Eliminar</button>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-[#A3A3A3]">No hay datos</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
