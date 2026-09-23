import React, { useState, useEffect } from 'react';
import { ApplicationStatusItem, ApplicationStatusState, Language } from '../types';
import { getCurrentDate } from '../services/calculations';
import { translations } from '../services/translations';
import { X, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface ApplicationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (statusData: ApplicationStatusItem) => Promise<boolean | void> | boolean | void;
  statusToEdit: ApplicationStatusItem | null;
  nextStatusId: string;
  lang: Language;
}

export const ApplicationStatusModal: React.FC<ApplicationStatusModalProps> = ({
  isOpen,
  onClose,
  onSave,
  statusToEdit,
  nextStatusId,
  lang,
}) => {
  const t = translations[lang];
  const isEditing = !!statusToEdit;

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ApplicationStatusState>('ACTIVE');
  const [createdDate, setCreatedDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setIsSubmitting(false);
      if (statusToEdit) {
        setId(statusToEdit.id);
        setName(statusToEdit.name);
        setStatus(statusToEdit.status);
        setCreatedDate(statusToEdit.createdDate);
      } else {
        setId(nextStatusId);
        setName('');
        setStatus('ACTIVE');
        setCreatedDate(getCurrentDate());
      }
    }
  }, [isOpen, statusToEdit, nextStatusId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage(t.statusNameRequired);
      return;
    }

    const updated: ApplicationStatusItem = {
      id,
      name: name.trim(),
      status,
      createdDate,
    };

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const result = await onSave(updated);
      if (result !== false) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save status to Google Sheets.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isEditing ? `${t.editStatus} (${id})` : t.addStatus}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Saved to the "ApplicationStatuses" Google Sheets tab.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center space-x-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Status ID (Auto-generated / read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                {t.statusId} (Auto)
              </label>
              <input
                type="text"
                value={id}
                disabled
                className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-mono font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                {t.createdDate} (Auto)
              </label>
              <input
                type="text"
                value={createdDate}
                disabled
                className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          {/* Status Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.statusName} <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-status-name"
              type="text"
              required
              placeholder="e.g. Processing, Under Review, Approved"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Active / Inactive Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.state} <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-status-active"
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatusState)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 text-slate-900 dark:text-slate-100"
            >
              <option value="ACTIVE">{t.active}</option>
              <option value="INACTIVE">{t.inactive}</option>
            </select>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Inactive statuses are hidden from new client entries but preserved for existing records.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {t.cancel}
            </button>
            <button
              id="btn-save-status"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.syncing}</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.save}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
