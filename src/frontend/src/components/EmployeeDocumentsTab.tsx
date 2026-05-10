'use client';

import React, { useState } from 'react';
import {
  FolderOpenIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useEmployeeDocuments } from '@/hooks/useEmployeeDocuments';
import { formatDateDisplay } from '@/utils/formatters';
import { toast } from 'sonner';
import EmployeeDocumentModal from '@/components/EmployeeDocumentModal';
import { DocumentFormData } from '@/schemas/employeeDocumentSchema';

interface Props {
  employeeId: string | number;
}

const EmployeeDocumentsTab: React.FC<Props> = ({ employeeId }) => {
  const { data, isLoading, error, refresh, createDocument, deleteDocument } = useEmployeeDocuments(employeeId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (form: DocumentFormData) => {
    try {
      await createDocument({ file_path: form.file_path, document_type: form.document_type });
      toast.success('Documento agregado correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo agregar el documento');
      throw err;
    }
  };

  const handleDelete = async (docId: number, fileName: string) => {
    if (!window.confirm(`¿Eliminar el documento «${fileName}»? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteDocument(docId);
      toast.success('Documento eliminado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar el documento');
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpenIcon className="w-4 h-4 text-green-700 dark:text-green-400" />
          <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Documentos
          </h3>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#4A5D3A] hover:bg-[#3a4d2a] dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Agregar Documento
        </button>
      </div>

      {isLoading && (
        <div className="p-5 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <ExclamationTriangleIcon className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1">No se pudo cargar los documentos</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mb-3">{error} — Intenta de nuevo.</p>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#4A5D3A] hover:bg-[#3a4d2a] dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && (!data || data.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <FolderOpenIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-3" />
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1">Sin documentos</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mb-3">
            Agrega referencias de documentos como contratos, identificaciones u otros archivos.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#4A5D3A] hover:bg-[#3a4d2a] dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Agregar Documento
          </button>
        </div>
      )}

      {!isLoading && !error && data && data.length > 0 && (
        <div>
          {data.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <DocumentIcon className="w-5 h-5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-zinc-700 dark:text-zinc-200 truncate">{doc.file_path}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {doc.document_type} · {formatDateDisplay(doc.uploaded_at)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc.id, doc.file_path)}
                className="p-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                aria-label="Eliminar"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <EmployeeDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default EmployeeDocumentsTab;
