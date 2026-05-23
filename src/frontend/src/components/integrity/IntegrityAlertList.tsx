import React from 'react';
import { IntegrityAlert } from '@/services/integrityService';
import { AlertTriangle, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface IntegrityAlertListProps {
  alerts: IntegrityAlert[];
}

/**
 * Lists data integrity alerts with visual severity indicators and affected record counts.
 */
export const IntegrityAlertList: React.FC<IntegrityAlertListProps> = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-emerald-50 rounded-2xl border border-emerald-100">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
        <h4 className="text-emerald-900 font-bold">¡Todo correcto!</h4>
        <p className="text-emerald-700 text-sm">No se detectaron problemas de integridad en la última auditoría.</p>
      </div>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'ERROR': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'WARN': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'ERROR': return 'bg-rose-100 text-rose-700';
      case 'WARN': return 'bg-amber-100 text-amber-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="space-y-4" data-testid="integrity-alert-list">
      {alerts.map((alert) => (
        <div 
          key={alert.code} 
          data-testid={`integrity-alert-${alert.code}`}
          className="flex items-start p-4 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md"
        >
          <div className="mt-1 mr-4">
            {getSeverityIcon(alert.severity)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono font-bold text-slate-400">{alert.code}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getSeverityBadgeClass(alert.severity)}`}>
                {alert.severity}
              </span>
            </div>
            <h4 className="text-slate-900 font-bold text-sm mb-1">{alert.message}</h4>
            <div className="flex items-center text-xs text-slate-500 gap-4">
              <span className="flex items-center">
                <span className="font-bold text-slate-700 mr-1">{alert.affectedCount}</span> registros afectados
              </span>
              <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                Entidad: {alert.entity}
              </span>
            </div>
            {alert.sampleIds.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-50">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">IDs de ejemplo</p>
                <div className="flex flex-wrap gap-2">
                  {alert.sampleIds.map(id => (
                    <span key={id} className="px-2 py-1 bg-slate-50 rounded border border-slate-100 text-[10px] font-mono text-slate-600">
                      #{id}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
