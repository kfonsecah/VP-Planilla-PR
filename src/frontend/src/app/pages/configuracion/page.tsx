'use client';
import Link from 'next/link';
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function ConfiguracionDashboard() {
  const settingsCards = [
    {
      title: 'Ventanas de Tiempo',
      description: 'Configure los rangos horarios para la inferencia automática de entradas y salidas.',
      href: '/pages/configuracion/ventanas',
      icon: <ClockIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
    },
    {
      title: 'Feriados',
      description: 'Administre los días feriados, reglas de pago obligatorio y tiempo extra.',
      href: '/pages/configuracion/feriados',
      icon: <CalendarDaysIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Configuración</p>
          <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">Centro de Configuración</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gestione las reglas de negocio, horarios y parámetros generales del sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {settingsCards.map((card) => (
            <Link key={card.href} href={card.href} className="block group">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:shadow-md transition-all duration-200 hover:border-green-500/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {card.icon}
                  </div>
                  <h3 className="font-medium text-zinc-800 dark:text-zinc-100">{card.title}</h3>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
