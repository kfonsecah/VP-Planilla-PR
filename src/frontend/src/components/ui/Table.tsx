"use client";

import React from 'react';

type Column<T> = {
  key: keyof T | string;
  title: string;
  render?: (item: T) => React.ReactNode;
};

interface TableProps<T> {
  columns: Column<T>[];
  data: T[] | any | null;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export default function Table<T extends { id?: number | string }>({ columns, data, onEdit, onDelete }: TableProps<T>) {
  // Normalize data to an array to avoid runtime errors when API returns object or single item
  const rows: T[] = Array.isArray(data)
    ? data
    : data && Array.isArray((data as any).data)
      ? (data as any).data
      : data
        ? [data]
        : [];

  return (
    <div className="overflow-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="px-4 py-2 text-left text-sm font-medium text-gray-700">{col.title}</th>
            ))}
            <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String((row as any).id || Math.random())} className="border-t">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-2 text-sm text-gray-800">
                  {col.render ? col.render(row) : (row as any)[col.key as string]}
                </td>
              ))}
              <td className="px-4 py-2 text-sm text-right">
                {onEdit && (
                  <button onClick={() => onEdit(row)} className="mr-2 px-3 py-1 bg-blue-600 text-white rounded text-sm">Editar</button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(row)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Eliminar</button>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-sm text-gray-500">No hay datos</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
