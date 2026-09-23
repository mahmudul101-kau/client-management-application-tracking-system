import React from 'react';
import { Client, DashboardStats, ApplicationStatusItem, Language } from '../types';
import { formatCurrency, formatDisplayDate } from '../services/calculations';
import { translations } from '../services/translations';
import { 
  Users, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  FileText, 
  CreditCard,
  Plus,
  ArrowRight,
  FileSpreadsheet,
  Activity
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats;
  recentClients: Client[];
  applicationStatuses: ApplicationStatusItem[];
  onAddClient: () => void;
  onAddCategory: () => void;
  onManageStatuses?: () => void;
  onViewAllClients: () => void;
  onViewClient: (client: Client) => void;
  isSheetsConnected: boolean;
  onOpenSheetsModal: () => void;
  lang: Language;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentClients,
  applicationStatuses,
  onAddClient,
  onAddCategory,
  onManageStatuses,
  onViewAllClients,
  onViewClient,
  isSheetsConnected,
  onOpenSheetsModal,
  lang,
}) => {
  const t = translations[lang];

  // Dynamic status items: map applicationStatuses plus any existing status in statusCounts
  const displayStatuses = React.useMemo(() => {
    const list: Array<{ name: string; count: number; percentage: number }> = [];
    const seen = new Set<string>();

    applicationStatuses.forEach((st) => {
      const count = stats.statusCounts[st.name] || 0;
      const percentage = stats.totalApplications > 0 ? Math.round((count / stats.totalApplications) * 100) : 0;
      list.push({ name: st.name, count, percentage });
      seen.add(st.name.toUpperCase());
    });

    // Also include any client statuses that might not be in applicationStatuses
    Object.keys(stats.statusCounts).forEach((k) => {
      if (!seen.has(k.toUpperCase())) {
        const count = stats.statusCounts[k];
        const percentage = stats.totalApplications > 0 ? Math.round((count / stats.totalApplications) * 100) : 0;
        list.push({ name: k, count, percentage });
      }
    });

    return list;
  }, [applicationStatuses, stats.statusCounts, stats.totalApplications]);

  const getStatusCardTheme = (name: string) => {
    const upper = name.toUpperCase();
    if (upper === 'COMPLETED' || upper === 'APPROVED') {
      return {
        bg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
        border: 'border-emerald-100 dark:border-emerald-900/60',
        text: 'text-emerald-800 dark:text-emerald-300',
        number: 'text-emerald-900 dark:text-emerald-100',
        sub: 'text-emerald-700 dark:text-emerald-400',
        dot: 'bg-emerald-500',
      };
    }
    if (upper === 'REJECTED' || upper === 'CANCELLED') {
      return {
        bg: 'bg-rose-50/70 dark:bg-rose-950/40',
        border: 'border-rose-100 dark:border-rose-900/60',
        text: 'text-rose-800 dark:text-rose-300',
        number: 'text-rose-900 dark:text-rose-100',
        sub: 'text-rose-700 dark:text-rose-400',
        dot: 'bg-rose-500',
      };
    }
    if (upper === 'PROCESSING' || upper === 'UNDER REVIEW') {
      return {
        bg: 'bg-blue-50/70 dark:bg-blue-950/40',
        border: 'border-blue-100 dark:border-blue-900/60',
        text: 'text-blue-800 dark:text-blue-300',
        number: 'text-blue-900 dark:text-blue-100',
        sub: 'text-blue-700 dark:text-blue-400',
        dot: 'bg-blue-500',
      };
    }
    if (upper === 'NEW') {
      return {
        bg: 'bg-indigo-50/70 dark:bg-indigo-950/40',
        border: 'border-indigo-100 dark:border-indigo-900/60',
        text: 'text-indigo-800 dark:text-indigo-300',
        number: 'text-indigo-900 dark:text-indigo-100',
        sub: 'text-indigo-700 dark:text-indigo-400',
        dot: 'bg-indigo-500',
      };
    }
    return {
      bg: 'bg-amber-50/70 dark:bg-amber-950/40',
      border: 'border-amber-100 dark:border-amber-900/60',
      text: 'text-amber-800 dark:text-amber-300',
      number: 'text-amber-900 dark:text-amber-100',
      sub: 'text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
    };
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header section with quick action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.dashboard}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time overview of clients, applications, and financial metrics backed by Google Sheets.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            id="dash-btn-add-category"
            onClick={onAddCategory}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>{t.addCategory}</span>
          </button>
          <button
            id="dash-btn-add-client"
            onClick={onAddClient}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-slate-800 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-xs border border-transparent dark:border-slate-700"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{t.addNewClient}</span>
          </button>
        </div>
      </div>

      {/* Sheets connection notice if not connected */}
      {!isSheetsConnected && (
        <div className="bg-slate-900 dark:bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm border border-slate-800">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="p-2.5 bg-slate-800 rounded-lg shrink-0 border border-slate-700">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Google Sheets Database Connection</h2>
              <p className="text-xs text-slate-300 dark:text-slate-400 mt-0.5">
                Connect your Google Sheet spreadsheet to automatically store and sync clients and categories directly to Google Sheets.
              </p>
            </div>
          </div>
          <button
            id="dash-btn-connect-sheets-banner"
            onClick={onOpenSheetsModal}
            className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs rounded-lg transition-colors shrink-0 shadow-xs"
          >
            <span>{t.connectGoogleSheets}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Section 1: Financial Summary */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.financialOverview}
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Auto-calculated from all clients</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Expected Amount */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {t.totalExpectedAmount}
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(stats.totalExpectedAmount)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sum of total amounts across all client files</p>
          </div>

          {/* Total Income / Paid Amount */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {t.totalIncome}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(stats.totalIncome)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total revenue collected from paid and partial payments</p>
          </div>

          {/* Total Due Amount */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {t.totalDueAmount}
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(stats.totalDueAmount)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Remaining balance owed (Expected − Income)</p>
          </div>
        </div>
      </div>

      {/* Section 2: Dynamic Application Status Summary & Payment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Application Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.applicationStatuses}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {stats.totalApplications} {t.totalApplications}
              </span>
              {onManageStatuses && (
                <button
                  onClick={onManageStatuses}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 underline"
                >
                  Manage
                </button>
              )}
            </div>
          </div>

          {displayStatuses.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No statuses configured.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {displayStatuses.map((st) => {
                const theme = getStatusCardTheme(st.name);
                return (
                  <div
                    key={st.name}
                    className={`p-3.5 rounded-lg ${theme.bg} border ${theme.border}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${theme.text} flex items-center space-x-1.5`}>
                        <span className={`w-2 h-2 rounded-full ${theme.dot}`}></span>
                        <span>{st.name}</span>
                      </span>
                    </div>
                    <div className={`mt-2 text-2xl font-bold ${theme.number}`}>
                      {st.count}
                    </div>
                    <span className={`text-[11px] ${theme.sub} mt-0.5 block`}>
                      {st.percentage}% of applications
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.paymentBreakdown}
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Auto-tracked status</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* PAID */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">{t.paid}</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stats.paidCount}</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Full settled</span>
            </div>

            {/* PARTIAL */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 block">{t.partial}</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stats.partialCount}</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Part paid</span>
            </div>

            {/* UNPAID */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block">{t.unpaid}</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stats.unpaidCount}</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Zero paid</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Recent Clients Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.recentClients}
            </h2>
          </div>
          <button
            id="dash-btn-view-all-clients"
            onClick={onViewAllClients}
            className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1 transition-colors"
          >
            <span>{t.viewAll} ({stats.totalClients})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentClients.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            <p>No clients registered yet.</p>
            <button
              onClick={onAddClient}
              className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Add your first client
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">{t.clientId}</th>
                  <th className="px-4 py-3">{t.clientName}</th>
                  <th className="px-4 py-3">{t.category}</th>
                  <th className="px-4 py-3">{t.createdDate}</th>
                  <th className="px-4 py-3 text-right">{t.totalAmount}</th>
                  <th className="px-4 py-3 text-right">{t.paid}</th>
                  <th className="px-4 py-3 text-right">{t.due}</th>
                  <th className="px-4 py-3">{t.applicationStatus}</th>
                  <th className="px-4 py-3">{t.paymentStatus}</th>
                  <th className="px-4 py-3 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-100">{client.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{client.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                        {client.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono">
                      {formatDisplayDate(client.createdDate)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(client.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatCurrency(client.paidAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400 font-medium">
                      {formatCurrency(client.dueAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {client.applicationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          client.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : client.paymentStatus === 'PARTIAL'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {client.paymentStatus === 'PAID'
                          ? t.paid
                          : client.paymentStatus === 'PARTIAL'
                          ? t.partial
                          : t.unpaid}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onViewClient(client)}
                        className="text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium hover:underline transition-colors"
                      >
                        {t.view}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
