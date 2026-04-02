"use client";

import React, { useState, useEffect } from 'react';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { AuditLogFilters } from '@/types/auditLog';
import {
  ShieldCheckIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function AuditLogsPage() {
  const { data: logs, total, isLoading, error, fetchAuditLogs } = useAuditLogs();
  
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    offset: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAuditLogs(filters);
  }, [fetchAuditLogs, filters]);

  const handleFilterChange = (key: keyof AuditLogFilters, value: AuditLogFilters[keyof AuditLogFilters]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0,
    }));
  };

  const handleSearch = () => {
    fetchAuditLogs({
      ...filters,
      action: searchTerm || undefined,
      offset: 0,
    });
  };

  const handleClearFilters = () => {
    setFilters({ limit: 50, offset: 0 });
    setSearchTerm('');
  };

  const getActionColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('create') || lowerAction.includes('insert')) return 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50';
    if (lowerAction.includes('update') || lowerAction.includes('edit')) return 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50';
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50';
    if (lowerAction.includes('login') || lowerAction.includes('auth')) return 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50';
    return 'text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700';
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-zinc-800 rounded-lg">
              <ShieldCheckIcon className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Logs de Auditoría</h1>
              <p className="text-zinc-500 dark:text-zinc-400">Historial de actividades del sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700'
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
              Filtros
            </button>
            <button
              onClick={() => fetchAuditLogs(filters)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              Recargar
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-100 mb-2">
                  Acción
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar acción..."
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-100 mb-2">
                  Entidad
                </label>
                <input
                  type="text"
                  value={filters.entity || ''}
                  onChange={(e) => handleFilterChange('entity', e.target.value || undefined)}
                  placeholder="Filtrar por entidad..."
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-100 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-100 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleSearch}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                Buscar
              </button>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 overflow-auto rounded-lg border border-red-200 dark:border-red-800">
            <div className="bg-red-50 dark:bg-red-950/50 p-6 text-center">
              <svg className="w-10 h-10 mx-auto mb-3 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error al cargar logs de auditoría</p>
              <p className="text-xs text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => fetchAuditLogs(filters)}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Mostrando <span className="font-semibold text-zinc-800 dark:text-zinc-100">{logs.length}</span> de{' '}
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">{total}</span> registros
          </p>
        </div>

        {/* Logs List */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                        <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
                        <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-700 rounded" />
                        <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-16 h-16 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500 dark:text-zinc-400">No se encontraron logs de auditoría</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full text-xs font-medium">
                          {log.entity}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                          <UserIcon className="w-4 h-4" />
                          <span>{log.username}</span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-500">({log.user_email})</span>
                        </div>

                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                          <ClockIcon className="w-4 h-4" />
                          <span>
                            {new Date(log.timestamp).toLocaleString('es-CR', {
                              year: 'numeric',
                              month: 'short',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                          <DocumentTextIcon className="w-4 h-4" />
                          <span>ID Entidad: {log.entity_id}</span>
                        </div>
                      </div>

                      {log.details && (
                        <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded text-sm text-zinc-600 dark:text-zinc-300">
                          <p className="font-medium mb-1">Detalles:</p>
                          <p className="text-xs whitespace-pre-wrap">{log.details}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > (filters.limit || 50) && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => handleFilterChange('offset', Math.max(0, (filters.offset || 0) - (filters.limit || 50)))}
                disabled={!filters.offset || filters.offset === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Página {Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1} de {Math.ceil(total / (filters.limit || 50))}
              </span>
              <button
                onClick={() => handleFilterChange('offset', (filters.offset || 0) + (filters.limit || 50))}
                disabled={(filters.offset || 0) + (filters.limit || 50) >= total}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
