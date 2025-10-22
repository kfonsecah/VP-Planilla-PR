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

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset pagination when filters change
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
    if (lowerAction.includes('create') || lowerAction.includes('insert')) return 'text-green-700 bg-green-100';
    if (lowerAction.includes('update') || lowerAction.includes('edit')) return 'text-blue-700 bg-blue-100';
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) return 'text-red-700 bg-red-100';
    if (lowerAction.includes('login') || lowerAction.includes('auth')) return 'text-purple-700 bg-purple-100';
    return 'text-gray-700 bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-[#E7DCC1] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#6F7153] bg-opacity-10 rounded-lg">
              <ShieldCheckIcon className="w-8 h-8 text-[#6F7153]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#3B4D36]">Logs de Auditoría</h1>
              <p className="text-[#6B5B3D]">Historial de actividades del sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-[#6F7153] text-white' 
                  : 'bg-[#F9F1DC] text-[#3B4D36] border border-[#E0D6B7]'
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
              Filtros
            </button>
            <button
              onClick={() => fetchAuditLogs(filters)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              Recargar
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                  Acción
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar acción..."
                  className="w-full px-3 py-2 border border-[#E0D6B7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                  Entidad
                </label>
                <input
                  type="text"
                  value={filters.entity || ''}
                  onChange={(e) => handleFilterChange('entity', e.target.value || undefined)}
                  placeholder="Filtrar por entidad..."
                  className="w-full px-3 py-2 border border-[#E0D6B7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-[#E0D6B7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3B4D36] mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-[#E0D6B7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6F7153]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleSearch}
                className="flex items-center gap-2 px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                Buscar
              </button>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-[#B8A989] text-[#3B4D36] rounded-lg hover:bg-[#A89979] transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-4 mb-6">
          <p className="text-sm text-[#6B5B3D]">
            Mostrando <span className="font-semibold text-[#3B4D36]">{logs.length}</span> de{' '}
            <span className="font-semibold text-[#3B4D36]">{total}</span> registros
          </p>
        </div>

        {/* Logs List */}
        <div className="bg-[#F9F1DC] rounded-xl shadow-sm border border-[#E0D6B7] p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <ArrowPathIcon className="w-12 h-12 animate-spin text-[#6F7153] mx-auto mb-3" />
              <p className="text-[#5D4E37]">Cargando logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-16 h-16 text-[#D2B48C] mx-auto mb-3" />
              <p className="text-[#6B5B3D]">No se encontraron logs de auditoría</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-white rounded-lg border border-[#E0D6B7] hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {log.entity}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-[#6B5B3D]">
                          <UserIcon className="w-4 h-4" />
                          <span>{log.username}</span>
                          <span className="text-xs text-[#A89979]">({log.user_email})</span>
                        </div>

                        <div className="flex items-center gap-2 text-[#6B5B3D]">
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

                        <div className="flex items-center gap-2 text-[#6B5B3D]">
                          <DocumentTextIcon className="w-4 h-4" />
                          <span>ID Entidad: {log.entity_id}</span>
                        </div>
                      </div>

                      {log.details && (
                        <div className="mt-3 p-3 bg-[#F9F1DC] rounded text-sm text-[#5D4E37]">
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
                className="px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-[#6B5B3D]">
                Página {Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1} de {Math.ceil(total / (filters.limit || 50))}
              </span>
              <button
                onClick={() => handleFilterChange('offset', (filters.offset || 0) + (filters.limit || 50))}
                disabled={(filters.offset || 0) + (filters.limit || 50) >= total}
                className="px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
