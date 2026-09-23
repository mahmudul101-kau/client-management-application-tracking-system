import React from 'react';
import { ApplicationStatusItem, Client, Language } from '../types';
import { formatDisplayDate } from '../services/calculations';
import { translations } from '../services/translations';
import { Plus, Edit3, Power, Trash2, CheckCircle, XCircle, Activity, Users } from 'lucide-react';

interface ApplicationStatusManagementViewProps {
  statuses: ApplicationStatusItem[];
  clients: Client[];
  onAddStatus: () => void;
  onEditStatus: (status: ApplicationStatusItem) => void;
  onToggleStatusActive: (status: ApplicationStatusItem) => void;
  onDeleteStatus: (status: ApplicationStatusItem) => void;
  lang: Language;
}

export const ApplicationStatusManagementView: React.FC<ApplicationStatusManagementViewProps> = ({
  statuses,
  clients,
  onAddStatus,
  onEditStatus,
  onToggleStatusActive,
  onDeleteStatus,
  lang,
}) => {
  const t = translations[lang];

  // Count how many clients use each status
  const clientCountByStatus = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of clients) {
      const st = c.applicationStatus || 'Unassigned';
      counts[st] = (counts[st] || 0) + 1;
    }
    return counts;
  }, [clients]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.applicationStatuses}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {statuses.length} {t.applicationStatuses}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.manageAppStatusesDesc}
          </p>
        </div>

        <button
          id="btn-add-status-page"
          onClick={onAddStatus}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors border border-transparent dark:border-slate-700"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>{t.addStatus}</span>
        </button>
      </div>

      {/* Rules Notice */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-3">
        <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Dynamic Status Rules & Client Safety:
          </p>
          <p>
            Statuses created here automatically appear in the Client Add/Edit dropdown. If a status is deactivated, it is safely hidden from new entries while existing clients keep their historical record intact.
          </p>
        </div>
      </div>

      {/* Statuses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/90 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">{t.statusId}</th>
                <th className="px-5 py-3.5">{t.statusName}</th>
                <th className="px-5 py-3.5">{t.state}</th>
                <th className="px-5 py-3.5">{t.createdDate}</th>
                <th className="px-5 py-3.5 text-center">Linked Clients</th>
                <th className="px-5 py-3.5 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {statuses.map((item) => {
                const count = clientCountByStatus[item.name] || 0;
                const isActive = item.status === 'ACTIVE';

                return (
                  <tr
                    key={item.id}
                    id={`status-row-${item.id}`}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Status ID */}
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {item.id}
                    </td>

                    {/* Status Name */}
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="text-sm font-semibold">{item.name}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isActive ? (
                          <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        )}
                        <span>{isActive ? t.active : t.inactive}</span>
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                      {formatDisplayDate(item.createdDate)}
                    </td>

                    {/* Linked Clients */}
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          count > 0
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        <span>{count}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => onEditStatus(item)}
                          title="Edit Status"
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Active / Inactive Button */}
                        <button
                          onClick={() => onToggleStatusActive(item)}
                          title={isActive ? 'Deactivate Status' : 'Activate Status'}
                          className={`p-1.5 rounded-md transition-colors ${
                            isActive
                              ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => onDeleteStatus(item)}
                          title="Delete Status"
                          className="p-1.5 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
