import React, { useState, useEffect } from 'react';
import { Client, Category, ApplicationStatusItem, ApplicationStatus, Language } from '../types';
import { calculateDueAmount, calculatePaymentStatus, formatCurrency, formatDisplayDate, getCurrentDate, getCurrencySymbol } from '../services/calculations';
import { translations } from '../services/translations';
import { X, Check, AlertCircle } from 'lucide-react';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Client) => void;
  clientToEdit: Client | null;
  categories: Category[];
  applicationStatuses: ApplicationStatusItem[];
  nextClientId: string;
  lang: Language;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clientToEdit,
  categories,
  applicationStatuses,
  nextClientId,
  lang,
}) => {
  const t = translations[lang];
  const isEditing = !!clientToEdit;

  // Form fields
  const [clientId, setClientId] = useState('');
  const [createdDate, setCreatedDate] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | string>('');
  const [paidAmount, setPaidAmount] = useState<number | string>('');
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>('New');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Available categories for dropdown:
  // Active categories + if editing a client with an inactive category, include that category!
  const availableCategories = React.useMemo(() => {
    const active = categories.filter((c) => c.status === 'ACTIVE');
    if (clientToEdit && clientToEdit.category) {
      const alreadyIncluded = active.some((c) => c.name === clientToEdit.category);
      if (!alreadyIncluded) {
        return [
          ...active,
          {
            id: 'HISTORICAL',
            name: clientToEdit.category,
            status: 'INACTIVE' as const,
            createdDate: '',
          },
        ];
      }
    }
    return active;
  }, [categories, clientToEdit]);

  // Available application statuses:
  // Active statuses + if editing a client with an inactive status, include that status so it is preserved!
  const availableStatuses = React.useMemo(() => {
    const active = applicationStatuses.filter((s) => s.status === 'ACTIVE');
    if (clientToEdit && clientToEdit.applicationStatus) {
      const alreadyIncluded = active.some(
        (s) => s.name.toUpperCase() === clientToEdit.applicationStatus.toUpperCase()
      );
      if (!alreadyIncluded) {
        return [
          ...active,
          {
            id: 'HISTORICAL',
            name: clientToEdit.applicationStatus,
            status: 'INACTIVE' as const,
            createdDate: '',
          },
        ];
      }
    }
    return active.length > 0
      ? active
      : [
          { id: 'APP-001', name: 'New', status: 'ACTIVE' as const, createdDate: '' },
          { id: 'APP-002', name: 'Processing', status: 'ACTIVE' as const, createdDate: '' },
          { id: 'APP-003', name: 'Completed', status: 'ACTIVE' as const, createdDate: '' },
          { id: 'APP-004', name: 'Rejected', status: 'ACTIVE' as const, createdDate: '' },
        ];
  }, [applicationStatuses, clientToEdit]);

  // Reset or populate fields when modal opens or clientToEdit changes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      if (clientToEdit) {
        setClientId(clientToEdit.id);
        setCreatedDate(clientToEdit.createdDate || getCurrentDate());
        setName(clientToEdit.name);
        setPhone(clientToEdit.phone);
        setCategory(clientToEdit.category);
        setTotalAmount(clientToEdit.totalAmount);
        setPaidAmount(clientToEdit.paidAmount);
        setApplicationStatus(clientToEdit.applicationStatus || 'New');
        setNotes(clientToEdit.notes || '');
      } else {
        setClientId(nextClientId);
        setCreatedDate(getCurrentDate());
        setName('');
        setPhone('');
        setCategory(availableCategories.length > 0 ? availableCategories[0].name : '');
        setTotalAmount('');
        setPaidAmount('0');
        setApplicationStatus(availableStatuses.length > 0 ? availableStatuses[0].name : 'New');
        setNotes('');
      }
    }
  }, [isOpen, clientToEdit, nextClientId, availableCategories, availableStatuses]);

  if (!isOpen) return null;

  // Real-time calculation previews
  const numTotal = typeof totalAmount === 'number' ? totalAmount : parseFloat(totalAmount as string) || 0;
  const numPaid = typeof paidAmount === 'number' ? paidAmount : parseFloat(paidAmount as string) || 0;
  const calculatedDue = calculateDueAmount(numTotal, numPaid);
  const calculatedPaymentStatus = calculatePaymentStatus(numTotal, numPaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (!name.trim()) {
      setErrorMessage(t.nameRequired);
      return;
    }
    if (!phone.trim()) {
      setErrorMessage(t.phoneRequired);
      return;
    }
    if (!category.trim()) {
      setErrorMessage(t.categoryRequired);
      return;
    }

    if (isNaN(numTotal) || numTotal < 0) {
      setErrorMessage(t.totalMustBePositive);
      return;
    }
    if (isNaN(numPaid) || numPaid < 0) {
      setErrorMessage(t.paidMustBePositive);
      return;
    }

    const newClient: Client = {
      id: clientId,
      name: name.trim(),
      phone: phone.trim(),
      category: category.trim(),
      totalAmount: numTotal,
      paidAmount: numPaid,
      dueAmount: calculatedDue,
      applicationStatus,
      paymentStatus: calculatedPaymentStatus,
      createdDate: createdDate || getCurrentDate(),
      notes: notes.trim(),
    };

    onSave(newClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditing ? `${t.editClient} (${clientId})` : t.addNewClient}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Client ID is permanently assigned and saved to Google Sheets.
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

          {/* Client ID & Created Date (Auto-generated / read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                {t.clientId} (Auto)
              </label>
              <input
                type="text"
                value={clientId}
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

          {/* Name & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.clientName} <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-client-name"
                type="text"
                required
                placeholder="e.g. Ahmed Al-Mansoor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.phoneNumber} <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-client-phone"
                type="tel"
                required
                placeholder="e.g. +966501234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Supports +966, +880, +971, etc.
              </span>
            </div>
          </div>

          {/* Category Dropdown & Application Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.category} <span className="text-rose-500">*</span>
              </label>
              {availableCategories.length === 0 ? (
                <div className="text-xs text-amber-700 dark:text-amber-300 p-2 bg-amber-50 dark:bg-amber-950/60 rounded-lg border border-amber-200 dark:border-amber-800">
                  No active categories found. Please create an active category first.
                </div>
              ) : (
                <select
                  id="select-client-category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="" disabled>Select category...</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name} {cat.status === 'INACTIVE' ? '(Preserved historical)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.applicationStatus} <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-client-app-status"
                required
                value={applicationStatus}
                onChange={(e) => setApplicationStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 font-medium text-slate-900 dark:text-slate-100"
              >
                {availableStatuses.map((st) => (
                  <option key={st.id} value={st.name}>
                    {st.name} {st.status === 'INACTIVE' ? '(Inactive/Preserved)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Financials: Total Amount, Paid Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.totalAmount} ({getCurrencySymbol()}) <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-client-total-amount"
                type="number"
                min="0"
                step="any"
                required
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 font-mono font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.paidAmount} ({getCurrencySymbol()}) <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-client-paid-amount"
                type="number"
                min="0"
                step="any"
                required
                placeholder="0.00"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 font-mono font-medium text-emerald-600 dark:text-emerald-400 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* Auto-Calculated Financial Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {t.dueAmount} (Auto-Calculated)
              </span>
              <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {formatCurrency(calculatedDue)}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Total Amount − Paid Amount</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {t.paymentStatus} (Auto)
              </span>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                    calculatedPaymentStatus === 'PAID'
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : calculatedPaymentStatus === 'PARTIAL'
                      ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                      : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {calculatedPaymentStatus === 'PAID'
                    ? t.paid
                    : calculatedPaymentStatus === 'PARTIAL'
                    ? t.partial
                    : t.unpaid}
                </span>
              </div>
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.notes}
            </label>
            <textarea
              id="input-client-notes"
              rows={2}
              placeholder="e.g. Passport copy received, scheduled for visa interview..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              id="btn-save-client-submit"
              type="submit"
              className="inline-flex items-center space-x-2 px-5 py-2 text-sm font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg shadow-xs transition-colors border border-transparent dark:border-slate-700"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{isEditing ? t.save : t.addNewClient}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
