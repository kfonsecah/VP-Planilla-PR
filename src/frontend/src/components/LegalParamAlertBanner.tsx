"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ShieldExclamationIcon,
  InformationCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { useLegalParamAlertsContext } from '@/context/LegalParamAlertsContext';
import { Notification } from '@/types/notification';

const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });

interface Props {
  userRole: string;
}

const bannerVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.15 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.1 } },
};

function hasRisk(message: string): boolean {
  return (
    message.includes('Art. 139 CT') ||
    message.includes('Art. 148 CT') ||
    message.includes('DESACTIVADA') ||
    message.includes('CCSS')
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export const LegalParamAlertBanner: React.FC<Props> = ({ userRole }) => {
  const { alerts, isLoading, isAcknowledging, acknowledge } = useLegalParamAlertsContext();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);

  if (dismissed || (!isLoading && alerts.length === 0)) return null;

  const isRisk = alerts.some(a => hasRisk(a.notifications_message));
  const primaryAlert: Notification | undefined = alerts[0];
  const extraCount = alerts.length - 1;

  const colorClasses = isRisk
    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
    : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800';
  const textClasses = isRisk ? 'text-red-800 dark:text-red-300' : 'text-blue-800 dark:text-blue-300';
  const iconClasses = isRisk ? 'text-red-600' : 'text-blue-600';
  const subtextClasses = isRisk ? 'text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400';
  const Icon = isRisk ? ShieldExclamationIcon : InformationCircleIcon;
  const role = isRisk ? 'alert' : 'status';

  return (
    <AnimatePresence>
      {!dismissed && (isLoading || alerts.length > 0) && (
        <MotionDiv
          role={role}
          variants={bannerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`border rounded-xl p-5 mb-4 ${colorClasses}`}
        >
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-3">
                  <div className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-600 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                    <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconClasses}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                {primaryAlert && (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-semibold ${textClasses}`}>
                        {primaryAlert.notifications_title}
                      </h4>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <button
                          onClick={() => setExpanded(e => !e)}
                          aria-expanded={expanded}
                          aria-controls={`alert-body-${primaryAlert.notifications_id}`}
                          className={`p-1 rounded hover:bg-black/5 transition-colors ${subtextClasses}`}
                        >
                          {expanded
                            ? <ChevronUpIcon className="w-4 h-4" />
                            : <ChevronDownIcon className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setDismissed(true)}
                          aria-label="Descartar por ahora"
                          title="Se ocultará hasta que recargues la página."
                          className={`p-1 rounded hover:bg-black/5 transition-colors ${subtextClasses}`}
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div id={`alert-body-${primaryAlert.notifications_id}`} className="mt-1">
                        <p className={`text-xs leading-relaxed ${subtextClasses}`}>
                          {primaryAlert.notifications_message}
                        </p>
                        <p className={`text-xs mt-1 ${subtextClasses} opacity-75`}>
                          {formatDate(primaryAlert.notifications_created_at)}
                        </p>
                      </div>
                    )}

                    {extraCount > 0 && (
                      <p className={`text-xs mt-2 font-medium ${subtextClasses}`}>
                        +{extraCount} alertas sin revisar
                      </p>
                    )}

                    {userRole === 'admin' && (
                      <button
                        onClick={() => acknowledge(primaryAlert.notifications_id)}
                        disabled={isAcknowledging === primaryAlert.notifications_id}
                        aria-label="Marcar alerta como revisada"
                        aria-disabled={isAcknowledging === primaryAlert.notifications_id}
                        className="mt-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold px-4 py-2 text-sm shadow-md shadow-green-600/20 transition-colors disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                      >
                        {isAcknowledging === primaryAlert.notifications_id && (
                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        )}
                        Marcar como revisado
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};
