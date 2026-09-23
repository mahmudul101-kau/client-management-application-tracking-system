import React, { useState, useEffect } from 'react';
import { Category, CategoryStatus, Language } from '../types';
import { getCurrentDate, formatDisplayDate } from '../services/calculations';
import { translations } from '../services/translations';
import { X, Check, AlertCircle } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: Category) => void;
  categoryToEdit: Category | null;
  nextCategoryId: string;
  lang?: Language;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categoryToEdit,
  nextCategoryId,
  lang = 'en',
}) => {
  const t = translations[lang];
  const isEditing = !!categoryToEdit;

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<CategoryStatus>('ACTIVE');
  const [createdDate, setCreatedDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      if (categoryToEdit) {
        setId(categoryToEdit.id);
        setName(categoryToEdit.name);
        setStatus(categoryToEdit.status);
        setCreatedDate(categoryToEdit.createdDate);
      } else {
        setId(nextCategoryId);
        setName('');
        setStatus('ACTIVE');
        setCreatedDate(getCurrentDate());
      }
    }
  }, [isOpen, categoryToEdit, nextCategoryId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage(t.categoryRequired);
      return;
    }

    const updatedCategory: Category = {
      id,
      name: name.trim(),
      status,
      createdDate,
    };

    onSave(updatedCategory);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isEditing ? `${t.edit} ${t.category} (${id})` : t.addCategory}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Saved to the "Categories" Google Sheets tab.
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

          {/* Category ID (Auto-generated / read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Category ID (Auto)
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
                value={formatDisplayDate(createdDate)}
                disabled
                className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-category-name"
              type="text"
              required
              placeholder="e.g. Saudi Scholarship"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 dark:focus:border-slate-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category Status
            </label>
            <select
              id="select-category-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as CategoryStatus)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 dark:focus:border-slate-500 font-medium text-slate-900 dark:text-slate-100"
            >
              <option value="ACTIVE">{t.active} (Available for new client entries)</option>
              <option value="INACTIVE">{t.inactive} (Hidden for new clients, preserved for historical)</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              id="btn-save-category-submit"
              type="submit"
              className="inline-flex items-center space-x-2 px-5 py-2 text-sm font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg shadow-xs transition-colors border border-transparent dark:border-slate-700"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{isEditing ? t.save : t.addCategory}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
