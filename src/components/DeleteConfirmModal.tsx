import React from 'react';
import { Client, Category, ApplicationStatusItem, Language } from '../types';
import { translations } from '../services/translations';
import { AlertTriangle, Trash2, Power } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToDelete: Client | null;
  categoryToDelete: Category | null;
  statusToDelete?: ApplicationStatusItem | null;
  linkedClientsCount?: number;
  onConfirmDeleteClient: (clientId: string) => void;
  onConfirmDeleteCategory: (categoryId: string) => void;
  onConfirmDeleteStatus?: (statusId: string) => void;
  onDeactivateCategoryInstead?: (category: Category) => void;
  onDeactivateStatusInstead?: (status: ApplicationStatusItem) => void;
  lang?: Language;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  clientToDelete,
  categoryToDelete,
  statusToDelete,
  linkedClientsCount = 0,
  onConfirmDeleteClient,
  onConfirmDeleteCategory,
  onConfirmDeleteStatus,
  onDeactivateCategoryInstead,
  onDeactivateStatusInstead,
  lang = 'en',
}) => {
  const t = translations[lang];

  if (!isOpen) return null;

  // 1. Client Deletion Dialog
  if (clientToDelete) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-6">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.deleteClientConfirm}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.deleteClientWarning}
                </p>

                {/* Client info summary */}
                <div className="mt-3.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t.clientId}:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{clientToDelete.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t.clientName}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{clientToDelete.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t.category}:</span>
                    <span className="text-slate-700 dark:text-slate-300">{clientToDelete.category}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">{t.phone}:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{clientToDelete.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                id="btn-cancel-delete-client"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                id="btn-confirm-delete-client"
                onClick={() => {
                  onConfirmDeleteClient(clientToDelete.id);
                  onClose();
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.deleteClient}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Category Deletion Dialog
  if (categoryToDelete) {
    const hasLinkedClients = linkedClientsCount > 0;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-6">
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  hasLinkedClients
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400'
                }`}
              >
                {hasLinkedClients ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {hasLinkedClients ? t.categoryInUse : t.deleteCategory}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.deleteCategoryConfirm}
                </p>

                {/* Category info */}
                <div className="mt-3.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t.categoryId}:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{categoryToDelete.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t.categoryName}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{categoryToDelete.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t.state}:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{categoryToDelete.status}</span>
                  </div>
                </div>

                {/* Warning if linked clients exist */}
                {hasLinkedClients && (
                  <div className="mt-3.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-semibold flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{t.linkedClientsDetected} ({linkedClientsCount})</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/90">
                      {t.categoryInUseWarning}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
              <button
                type="button"
                id="btn-cancel-delete-category"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t.cancel}
              </button>

              {hasLinkedClients && onDeactivateCategoryInstead && (
                <button
                  type="button"
                  id="btn-deactivate-instead-category"
                  onClick={() => {
                    onDeactivateCategoryInstead(categoryToDelete);
                    onClose();
                  }}
                  className="inline-flex items-center justify-center space-x-1 px-4 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/70 hover:bg-amber-200 dark:hover:bg-amber-900/70 rounded-lg transition-colors border border-amber-300 dark:border-amber-700"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{t.deactivateInstead}</span>
                </button>
              )}

              <button
                type="button"
                id="btn-confirm-delete-category"
                onClick={() => {
                  onConfirmDeleteCategory(categoryToDelete.id);
                  onClose();
                }}
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{hasLinkedClients ? t.deleteAnyway : t.deleteCategory}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Application Status Deletion Dialog
  if (statusToDelete) {
    const hasLinkedClients = linkedClientsCount > 0;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-6">
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  hasLinkedClients
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400'
                }`}
              >
                {hasLinkedClients ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {hasLinkedClients ? t.statusInUse : t.deleteStatus}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.deleteStatusConfirm}
                </p>

                {/* Status info */}
                <div className="mt-3.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t.statusId}:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{statusToDelete.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t.statusName}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{statusToDelete.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t.state}:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{statusToDelete.status}</span>
                  </div>
                </div>

                {/* Warning if linked clients exist */}
                {hasLinkedClients && (
                  <div className="mt-3.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-semibold flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{t.linkedClientsDetected} ({linkedClientsCount})</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/90">
                      {t.statusInUseWarning}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
              <button
                type="button"
                id="btn-cancel-delete-status"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t.cancel}
              </button>

              {hasLinkedClients && onDeactivateStatusInstead && (
                <button
                  type="button"
                  id="btn-deactivate-instead-status"
                  onClick={() => {
                    onDeactivateStatusInstead(statusToDelete);
                    onClose();
                  }}
                  className="inline-flex items-center justify-center space-x-1 px-4 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/70 hover:bg-amber-200 dark:hover:bg-amber-900/70 rounded-lg transition-colors border border-amber-300 dark:border-amber-700"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{t.deactivateInstead}</span>
                </button>
              )}

              <button
                type="button"
                id="btn-confirm-delete-status"
                onClick={() => {
                  if (onConfirmDeleteStatus) {
                    onConfirmDeleteStatus(statusToDelete.id);
                  }
                  onClose();
                }}
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{hasLinkedClients ? t.deleteAnyway : t.deleteStatus}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
