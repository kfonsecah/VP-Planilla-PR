'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LegalParamService } from '@/services/legalParamService';
import { LegalParam } from '@/types/legalParam';
import { LegalParamCard } from '@/components/LegalParamCard';
import { FeatureFlagToggle } from '@/components/FeatureFlagToggle';
import { LegalParamDrawer } from '@/components/LegalParamDrawer';
import { LegalParamHistoryModal } from '@/components/LegalParamHistoryModal';
import { MinWageBulkUpdateModal } from '@/components/MinWageBulkUpdateModal';
import { useAuth } from '@/hooks/useAuth';
import { ShieldExclamationIcon, ArrowPathIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const CATEGORY_NAMES: Record<string, string> = {
  WORKDAY: 'Jornada Laboral',
  OVERTIME: 'Horas Extraordinarias',
  CCSS: 'Cargas Sociales (CCSS)',
  MIN_WAGE: 'Salarios Mínimos',
  FEATURE_FLAG: 'Configuración de Sistema',
};

export default function ParametrosLegalesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [params, setParams] = useState<LegalParam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedParam, setSelectedParam] = useState<LegalParam | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [historyParamKey, setHistoryParamKey] = useState<string | null>(null);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);

  const readOnly = user?.role !== 'admin';

  const loadParams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LegalParamService.getActiveParams();
      setParams(data || []);
    } catch (err: unknown) {
      console.error('Error loading params:', err);
      setError('Error al cargar los parámetros legales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return; // Wait for auth init
    // En el futuro, si el rol ni siquiera es payroll_manager o admin, redireccionar
    if (user.role !== 'admin' && user.role !== 'payroll_manager') {
      router.push('/pages/main');
      return;
    }
    loadParams();
  }, [user, router]);

  if (!user || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ArrowPathIcon className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-950/30 border border-red-900/50 p-6 rounded-lg text-center">
          <ShieldExclamationIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error de Carga</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadParams}
            className="px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-200 rounded-md transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Group params by category
  const grouped = params.reduce((acc, param) => {
    if (!acc[param.category]) {
      acc[param.category] = [];
    }
    acc[param.category].push(param);
    return acc;
  }, {} as Record<string, LegalParam[]>);

  // Ordenamos las categorías
  const order = ['WORKDAY', 'OVERTIME', 'CCSS', 'MIN_WAGE', 'FEATURE_FLAG'];
  const categories = Object.keys(grouped).sort((a, b) => {
    const idxA = order.indexOf(a);
    const idxB = order.indexOf(b);
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link
        href="/pages/configuracion"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-6 group"
      >
        <ChevronLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span className="text-sm font-medium">Volver a Configuración</span>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100">Parámetros Legales</h1>
        <p className="text-zinc-400 mt-2">
          Gestione las constantes legales, factores de cálculo y salarios mínimos en vigor.
          {readOnly && ' (Modo Lectura)'}
        </p>
      </div>

      <div className="space-y-12">
        {categories.map((category) => (
          <section key={category}>
            <div className="flex justify-between items-end mb-6 border-b border-zinc-800 pb-2">
              <h2 className="text-xl font-semibold text-zinc-200">
                {CATEGORY_NAMES[category] || category}
              </h2>
              {category === 'MIN_WAGE' && !readOnly && (
                <button
                  onClick={() => setIsBulkUpdateOpen(true)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors"
                >
                  Actualización Masiva
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {grouped[category]
                .sort((a, b) => a.key.localeCompare(b.key))
                .map((param) => {
                  if (category === 'FEATURE_FLAG') {
                    return (
                      <FeatureFlagToggle
                        key={param.key}
                        param={param}
                        onChange={loadParams}
                        readOnly={readOnly}
                      />
                    );
                  }
                  
                  return (
                    <LegalParamCard
                      key={param.key}
                      param={param}
                      onEdit={(p) => {
                        setSelectedParam(p);
                        setIsDrawerOpen(true);
                      }}
                      onHistory={(p) => setHistoryParamKey(p.key)}
                      readOnly={readOnly}
                    />
                  );
                })}
            </div>
          </section>
        ))}
      </div>

      <LegalParamDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setTimeout(() => setSelectedParam(null), 300); // clear after animation
        }}
        param={selectedParam}
        onSuccess={loadParams}
        readOnly={readOnly}
      />

      <LegalParamHistoryModal
        isOpen={!!historyParamKey}
        onClose={() => setHistoryParamKey(null)}
        paramKey={historyParamKey}
      />

      <MinWageBulkUpdateModal
        isOpen={isBulkUpdateOpen}
        onClose={() => setIsBulkUpdateOpen(false)}
        onSuccess={loadParams}
        currentWages={grouped['MIN_WAGE'] || []}
      />
    </div>
  );
}
