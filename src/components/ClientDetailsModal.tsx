import React from 'react';
import { Client, Language } from '../types';
import { formatCurrency, formatDisplayDate } from '../services/calculations';
import { translations } from '../services/translations';
import { X, Edit3, Trash2, Phone, Tag, Calendar, FileText } from 'lucide-react';

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onDelete?: (client: Client) => void;
  lang?: Language;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  client,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  lang = 'en',
}) => {
  const t = translations[lang];

  if (!isOpen || !client) return null;

  const getStatusBadgeClass = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'APPROVED') {
      return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    }
    if (s === 'REJECTED' || s === 'CANCELLED') {
      return 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
    }
    if (s === 'PROCESSING' || s === 'UNDER REVIEW') {
      return 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
    }
    if (s === 'NEW') {
      return 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800';
    }
    return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-900 dark:bg-slate-800 text-white border border-transparent dark:border-slate-700">
              {client.id}
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{client.name}</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>{t.createdDate}: {formatDisplayDate(client.createdDate)}</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Key Information Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>{t.phoneNumber}</span>
              </span>
              <p className="mt-1 text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">{client.phone}</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>{t.category}</span>
              </span>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{client.category}</p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                {t.applicationStatus}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(
                  client.applicationStatus
                )}`}
              >
                {client.applicationStatus}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                {t.paymentStatus}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                  client.paymentStatus === 'PAID'
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : client.paymentStatus === 'PARTIAL'
                    ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {client.paymentStatus === 'PAID'
                  ? t.paid
                  : client.paymentStatus === 'PARTIAL'
                  ? t.partial
                  : t.unpaid}
              </span>
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {t.financialOverview}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>{t.totalAmount}:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(client.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                <span>{t.paidAmount}:</span>
                <span className="font-semibold">{formatCurrency(client.paidAmount)}</span>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                <span className="text-rose-600 dark:text-rose-400">{t.dueAmount}:</span>
                <span className="text-rose-600 dark:text-rose-400 text-base">{formatCurrency(client.dueAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {client.notes ? (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{t.notes}</span>
              </span>
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{client.notes}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">No additional notes recorded.</p>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            {onDelete ? (
              <button
                id={`btn-details-delete-${client.id}`}
                onClick={() => {
                  onClose();
                  onDelete(client);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors border border-rose-200 dark:border-rose-900"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.deleteClient}</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {t.close}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(client);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors shadow-xs border border-transparent dark:border-slate-700"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t.editClient}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
