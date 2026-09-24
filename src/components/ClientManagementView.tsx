import React, { useState, useMemo } from 'react';
import { Client, Category, ApplicationStatusItem, Language } from '../types';
import { formatCurrency, formatDisplayDate } from '../services/calculations';
import { translations } from '../services/translations';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2,
  X, 
  Users, 
  Printer,
} from 'lucide-react';

interface ClientManagementViewProps {
  clients: Client[];
  categories: Category[];
  applicationStatuses: ApplicationStatusItem[];
  onAddClient: () => void;
  onEditClient: (client: Client) => void;
  onViewClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
  onPrintClient?: (client: Client) => void;
  isSyncing: boolean;
  lang: Language;
}

export const ClientManagementView: React.FC<ClientManagementViewProps> = ({
  clients,
  categories,
  applicationStatuses,
  onAddClient,
  onEditClient,
  onViewClient,
  onDeleteClient,
  onPrintClient,
  lang,
}) => {
  const t = translations[lang];

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAppStatus, setSelectedAppStatus] = useState<string>('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('ALL');

  // Dynamic status options: combines applicationStatuses with any existing client statuses
  const distinctStatuses = useMemo(() => {
    const set = new Set<string>();
    applicationStatuses.forEach((s) => set.add(s.name));
    clients.forEach((c) => {
      if (c.applicationStatus) set.add(c.applicationStatus);
    });
    return Array.from(set);
  }, [applicationStatuses, clients]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Smart search across ID, Name, Phone, Category
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        client.id.toLowerCase().includes(term) ||
        client.name.toLowerCase().includes(term) ||
        client.phone.toLowerCase().includes(term) ||
        client.category.toLowerCase().includes(term);

      // Filter: Category
      const matchesCategory =
        selectedCategory === 'ALL' || client.category === selectedCategory;

      // Filter: Application Status
      const matchesAppStatus =
        selectedAppStatus === 'ALL' ||
        client.applicationStatus.toUpperCase() === selectedAppStatus.toUpperCase();

      // Filter: Payment Status
      const matchesPaymentStatus =
        selectedPaymentStatus === 'ALL' || client.paymentStatus === selectedPaymentStatus;

      return matchesSearch && matchesCategory && matchesAppStatus && matchesPaymentStatus;
    });
  }, [clients, searchTerm, selectedCategory, selectedAppStatus, selectedPaymentStatus]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedCategory !== 'ALL' ||
    selectedAppStatus !== 'ALL' ||
    selectedPaymentStatus !== 'ALL';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedAppStatus('ALL');
    setSelectedPaymentStatus('ALL');
  };

  const getStatusBadgeClass = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'APPROVED') {
      return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    if (s === 'REJECTED' || s === 'CANCELLED') {
      return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
    if (s === 'PROCESSING' || s === 'UNDER REVIEW') {
      return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
    if (s === 'NEW') {
      return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    }
    return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.clientManagement}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {filteredClients.length} of {clients.length}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.manageClientsDesc}
          </p>
        </div>

        <button
          id="btn-add-client-page"
          onClick={onAddClient}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors border border-transparent dark:border-slate-700"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>{t.addNewClient}</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Smart Search */}
          <div className="md:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="input-client-search"
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-slate-600 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">{t.allCategories}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name} {cat.status === 'INACTIVE' ? '(Inactive)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Application Status Filter */}
          <div className="md:col-span-2">
            <select
              id="filter-app-status"
              value={selectedAppStatus}
              onChange={(e) => setSelectedAppStatus(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-slate-600 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">{t.allAppStatuses}</option>
              {distinctStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="md:col-span-2">
            <select
              id="filter-payment-status"
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-slate-600 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">{t.allPayments}</option>
              <option value="PAID">{t.paid}</option>
              <option value="PARTIAL">{t.partial}</option>
              <option value="UNPAID">{t.unpaid}</option>
            </select>
          </div>
        </div>

        {/* Clear Filters bar if any active */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200">{filteredClients.length}</strong> matching results
            </span>
            <button
              id="btn-clear-filters"
              onClick={clearFilters}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium flex items-center space-x-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t.resetFilters}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Client Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              {t.noMatchingClients}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try clearing the search input or changing filter dropdowns.'
                : 'Get started by adding your first client.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="mt-4 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                {t.resetFilters}
              </button>
            ) : (
              <button
                onClick={onAddClient}
                className="mt-4 px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors border border-transparent dark:border-slate-700"
              >
                {t.addNewClient}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/90 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">{t.clientId}</th>
                  <th className="px-4 py-3.5">{t.clientName}</th>
                  <th className="px-4 py-3.5">{t.phoneNumber}</th>
                  <th className="px-4 py-3.5">{t.category}</th>
                  <th className="px-4 py-3.5">{t.createdDate}</th>
                  <th className="px-4 py-3.5 text-right">{t.totalAmount}</th>
                  <th className="px-4 py-3.5 text-right">{t.paid}</th>
                  <th className="px-4 py-3.5 text-right">{t.due}</th>
                  <th className="px-4 py-3.5">{t.applicationStatus}</th>
                  <th className="px-4 py-3.5">{t.paymentStatus}</th>
                  <th className="px-4 py-3.5 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    id={`client-row-${client.id}`}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Client ID */}
                    <td className="px-4 py-3.5 font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {client.id}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {client.name}
                    </td>

                    {/* Phone Number */}
                    <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {client.phone}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                        {client.category}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                      {formatDisplayDate(client.createdDate)}
                    </td>

                    {/* Total Amount */}
                    <td className="px-4 py-3.5 text-right font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatCurrency(client.totalAmount)}
                    </td>

                    {/* Paid Amount */}
                    <td className="px-4 py-3.5 text-right text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                      {formatCurrency(client.paidAmount)}
                    </td>

                    {/* Due Amount */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          client.dueAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {formatCurrency(client.dueAmount)}
                      </span>
                    </td>

                    {/* Application Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(
                          client.applicationStatus
                        )}`}
                      >
                        {client.applicationStatus}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          client.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : client.paymentStatus === 'PARTIAL'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {client.paymentStatus === 'PAID'
                          ? t.paid
                          : client.paymentStatus === 'PARTIAL'
                          ? t.partial
                          : t.unpaid}
                      </span>
                    </td>

                    {/* Actions: View, Edit, and Delete */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        {onPrintClient && (
                          <button
                            id={`btn-print-${client.id}`}
                            onClick={() => onPrintClient(client)}
                            title={t.printDetails}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          id={`btn-view-${client.id}`}
                          onClick={() => onViewClient(client)}
                          title="View Details"
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-edit-${client.id}`}
                          onClick={() => onEditClient(client)}
                          title="Edit Client"
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-${client.id}`}
                          onClick={() => onDeleteClient(client)}
                          title="Delete Client"
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
