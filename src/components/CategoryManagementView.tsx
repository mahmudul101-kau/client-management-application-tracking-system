import React from 'react';
import { Category, Client, Language } from '../types';
import { formatDisplayDate } from '../services/calculations';
import { translations } from '../services/translations';
import { Plus, Edit3, Power, Trash2, CheckCircle, XCircle, Tag, Users } from 'lucide-react';

interface CategoryManagementViewProps {
  categories: Category[];
  clients: Client[];
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onToggleCategoryStatus: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  lang?: Language;
}

export const CategoryManagementView: React.FC<CategoryManagementViewProps> = ({
  categories,
  clients,
  onAddCategory,
  onEditCategory,
  onToggleCategoryStatus,
  onDeleteCategory,
  lang = 'en',
}) => {
  const t = translations[lang];

  // Count how many clients use each category
  const clientCountByCategory = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of clients) {
      counts[c.category] = (counts[c.category] || 0) + 1;
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
              {t.categories}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {categories.length} {t.categories}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage application categories saved to the Google Sheets "Categories" tab.
          </p>
        </div>

        <button
          id="btn-add-category-page"
          onClick={onAddCategory}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors border border-transparent dark:border-slate-700"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>{t.addCategory}</span>
        </button>
      </div>

      {/* Rules Notice */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-3">
        <Tag className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">Category Rules & Historical Preservation:</p>
          <p>
            When a category is deactivated, it no longer appears in dropdowns for new client entries. Existing client records with that category will preserve their historical category info intact.
          </p>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/90 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Category ID</th>
                <th className="px-5 py-3.5">Category Name</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">{t.createdDate}</th>
                <th className="px-5 py-3.5 text-center">Linked Clients</th>
                <th className="px-5 py-3.5 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((category) => {
                const count = clientCountByCategory[category.name] || 0;
                const isActive = category.status === 'ACTIVE';

                return (
                  <tr
                    key={category.id}
                    id={`category-row-${category.id}`}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Category ID */}
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {category.id}
                    </td>

                    {/* Category Name */}
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold">{category.name}</span>
                        {!isActive && (
                          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            Deactivated
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{t.active}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>{t.inactive}</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDisplayDate(category.createdDate)}
                    </td>

                    {/* Linked Clients */}
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                        <Users className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        <span>{count}</span>
                      </span>
                    </td>

                    {/* Actions: Edit & Deactivate/Activate */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          id={`btn-edit-category-${category.id}`}
                          onClick={() => onEditCategory(category)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>{t.edit}</span>
                        </button>

                        <button
                          id={`btn-toggle-status-${category.id}`}
                          onClick={() => onToggleCategoryStatus(category)}
                          title={isActive ? 'Deactivate category' : 'Re-activate category'}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                            isActive
                              ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                              : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{isActive ? t.deactivate : t.activate}</span>
                        </button>

                        <button
                          id={`btn-delete-category-${category.id}`}
                          onClick={() => onDeleteCategory(category)}
                          title="Delete category"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-700 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t.delete}</span>
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
