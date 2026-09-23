import React from 'react';
import { ActiveTab, GoogleSheetsConfig, ThemeMode, AppBranding, Language } from '../types';
import { translations } from '../services/translations';
import { 
  LayoutDashboard, 
  Users, 
  Tags, 
  Activity, 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Sun, 
  Moon,
  Settings,
  Lock,
  Globe
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  sheetsConfig: GoogleSheetsConfig;
  branding: AppBranding;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenBrandingModal: () => void;
  onLockApp: () => void;
  onOpenSheetsModal: () => void;
  onQuickSync: () => void;
  isSyncing: boolean;
  totalClients: number;
  totalStatuses: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  sheetsConfig,
  branding,
  lang,
  onLanguageChange,
  onOpenBrandingModal,
  onLockApp,
  onOpenSheetsModal,
  onQuickSync,
  isSyncing,
  totalClients,
  totalStatuses,
  theme,
  onToggleTheme,
}) => {
  const isConnected = sheetsConfig.status === 'connected';
  const t = translations[lang];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 min-w-0">
            {branding.logoUrl ? (
              branding.logoUrl.startsWith('data:') ||
              branding.logoUrl.startsWith('http://') ||
              branding.logoUrl.startsWith('https://') ||
              branding.logoUrl.startsWith('/') ||
              branding.logoUrl.startsWith('blob:') ? (
                <img
                  id="navbar-app-logo-img"
                  src={branding.logoUrl}
                  alt={branding.title || 'Logo'}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-xl object-contain bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                />
              ) : (
                <div
                  id="navbar-app-logo-text"
                  className="h-10 px-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-xs tracking-wide shadow-xs border border-slate-200 dark:border-slate-700 shrink-0 truncate max-w-[120px]"
                >
                  {branding.logoUrl}
                </div>
              )
            ) : (
              <div id="navbar-app-logo-default" className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-xs border border-transparent dark:border-slate-700 shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span id="navbar-app-title" className="font-bold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight truncate max-w-[200px] sm:max-w-[320px]">
                  {branding.title}
                </span>
              </div>
              <p id="navbar-app-slogan" className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[240px] sm:max-w-[340px] hidden sm:block">
                {branding.slogan}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{t.dashboard}</span>
            </button>

            <button
              id="nav-tab-clients"
              onClick={() => setActiveTab('clients')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'clients'
                  ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t.clients}</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'clients'
                    ? 'bg-slate-800 dark:bg-slate-700 text-slate-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {totalClients}
              </span>
            </button>

            <button
              id="nav-tab-categories"
              onClick={() => setActiveTab('categories')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'categories'
                  ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Tags className="w-3.5 h-3.5" />
              <span>{t.categories}</span>
            </button>

            <button
              id="nav-tab-statuses"
              onClick={() => setActiveTab('statuses')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'statuses'
                  ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{t.applicationStatuses}</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'statuses'
                    ? 'bg-slate-800 dark:bg-slate-700 text-slate-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {totalStatuses}
              </span>
            </button>
          </nav>

          {/* Right Action: Language, Branding Settings, Theme, Sync & Google Sheets DB Status */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                id="btn-lang-en"
                type="button"
                onClick={() => onLanguageChange('en')}
                title="Switch to English"
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  lang === 'en'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                id="btn-lang-bn"
                type="button"
                onClick={() => onLanguageChange('bn')}
                title="বাংলা ভাষায় পরিবর্তন করুন"
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  lang === 'bn'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                বাংলা
              </button>
            </div>

            {/* Branding Settings Button */}
            <button
              id="btn-open-branding-settings"
              onClick={onOpenBrandingModal}
              title={t.brandingSettings}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Dashboard Manual Lock Button */}
            <button
              id="btn-manual-lock"
              onClick={onLockApp}
              title={t.lockDashboard}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Theme Toggle Button */}
            <button
              id="btn-theme-toggle"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 transition-transform rotate-0" />
              )}
            </button>

            {/* Quick Sync Button */}
            <button
              id="btn-quick-sync"
              onClick={onQuickSync}
              disabled={isSyncing}
              title="Refresh and sync data with Google Sheets"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
            </button>

            {/* Connect Google Sheets Button */}
            <button
              id="btn-open-sheets-config"
              onClick={onOpenSheetsModal}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                  : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
              }`}
            >
              {isConnected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">{t.connected}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">{t.connectGoogleSheets}</span>
                  <span className="sm:hidden">Sheets</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex lg:hidden items-center space-x-1 py-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 dark:bg-slate-800 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{t.dashboard}</span>
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'clients'
                ? 'bg-slate-900 dark:bg-slate-800 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.clients} ({totalClients})</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-slate-900 dark:bg-slate-800 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Tags className="w-3.5 h-3.5" />
            <span>{t.categories}</span>
          </button>
          <button
            onClick={() => setActiveTab('statuses')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'statuses'
                ? 'bg-slate-900 dark:bg-slate-800 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t.applicationStatuses} ({totalStatuses})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
