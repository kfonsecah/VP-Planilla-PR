import React, { useEffect, useState } from 'react';
import { LegalParam } from '../types/legalParam';
import { LegalParamService } from '../services/legalParamService';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';

interface LegalParamHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  paramKey: string | null;
}

export const LegalParamHistoryModal: React.FC<LegalParamHistoryModalProps> = ({
  isOpen,
  onClose,
  paramKey,
}) => {
  const [history, setHistory] = useState<LegalParam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && paramKey) {
      setLoading(true);
      setError(null);
      LegalParamService.getParamHistory(paramKey)
        .then((data: LegalParam[]) => {
          setHistory(data ?? []);
        })
        .catch((err) => {
          setError(err.message || 'Ocurrió un error inesperado');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, paramKey]);

  if (!isOpen || !paramKey) return null;

  const formatDate = (d: string | Date) => {
    return new Intl.DateTimeFormat('es-CR', { dateStyle: 'long' }).format(new Date(d));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-6 h-6 text-zinc-400" />
            <h2 className="text-xl font-bold text-zinc-100">
              Historial de {paramKey}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-400 text-center py-8">{error}</div>
          ) : history.length === 0 ? (
            <div className="text-zinc-500 text-center py-8">No hay registros previos.</div>
          ) : (
            <div className="relative border-l border-zinc-800 ml-3 space-y-8">
              {history.map((record, i) => (
                <div key={record.id} className="relative pl-6">
                  <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-zinc-900" />
                  
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-800/50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-lg font-bold text-zinc-100">
                        {record.category === 'MIN_WAGE' 
                          ? new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(Number(record.value))
                          : Number(record.value).toString()
                        }
                      </div>
                      <div className="text-xs text-zinc-500">
                        {i === 0 ? (
                          <span className="text-green-400 bg-green-400/10 px-2 py-1 rounded">Actual</span>
                        ) : (
                          'Histórico'
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-zinc-400 space-y-1">
                      <div>
                        Vigente desde: <span className="text-zinc-300">{formatDate(record.validFrom)}</span>
                        {record.validUntil && (
                          <> hasta <span className="text-zinc-300">{formatDate(record.validUntil)}</span></>
                        )}
                      </div>
                      {record.source_decree && (
                        <div>Decreto: <span className="text-zinc-300">{record.source_decree}</span></div>
                      )}
                      {record.updatedBy && (
                        <div>Actualizado por: <span className="text-zinc-300">{record.updatedBy}</span></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
