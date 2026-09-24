import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Client, 
  Category, 
  ApplicationStatusItem, 
  AppBranding, 
  ActiveTab, 
  GoogleSheetsConfig, 
  ThemeMode, 
  Language 
} from './types';
import { 
  calculateDashboardStats, 
  generateNextClientId, 
  generateNextCategoryId, 
  generateNextStatusId,
  getCurrentDate,
  setActiveCurrency
} from './services/calculations';
import { 
  getLocalData, 
  saveLocalData, 
  loadSheetsConfig, 
  saveSheetsConfig,
  fetchFromGoogleSheets,
  sendMutationToGoogleSheets,
  testGoogleSheetsConnection,
  saveStoredBranding,
  DEFAULT_BRANDING,
  DEFAULT_APPLICATION_STATUSES,
  verifyDashboardPassword,
  setDashboardPassword,
  checkPasswordConfigured,
  isFirstTimeSetupCompleted,
  markFirstTimeSetupCompleted
} from './services/googleSheetsService';
import { compressLogoDataUrl } from './services/imageUtils';
import { translations } from './services/translations';

import { Navbar } from './components/Navbar';
import { LockPage } from './components/LockPage';
import { FirstTimeSetup } from './components/FirstTimeSetup';
import { DashboardView } from './components/DashboardView';
import { ClientManagementView } from './components/ClientManagementView';
import { CategoryManagementView } from './components/CategoryManagementView';
import { ApplicationStatusManagementView } from './components/ApplicationStatusManagementView';
import { ClientModal } from './components/ClientModal';
import { ClientDetailsModal } from './components/ClientDetailsModal';
import { CategoryModal } from './components/CategoryModal';
import { ApplicationStatusModal } from './components/ApplicationStatusModal';
import { BrandingSettingsModal } from './components/BrandingSettingsModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ClientPrintPreviewModal } from './components/ClientPrintPreviewModal';

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Database State
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [applicationStatuses, setApplicationStatuses] = useState<ApplicationStatusItem[]>(DEFAULT_APPLICATION_STATUSES);
  const [branding, setBranding] = useState<AppBranding>(DEFAULT_BRANDING);

  // First-time setup state (persisted in localStorage)
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return isFirstTimeSetupCompleted();
    }
    return false;
  });

  // Security & Lock State:
  // - If setup is complete AND current browser session was already unlocked (e.g. page reload / refresh), restore dashboard unlocked.
  // - In a fresh browser session (new tab/window after close), or when explicitly locked/inactivity, show LockPage.
  // - sessionStorage automatically clears when the tab/browser is closed, making it ideal for session vs setup distinction.
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const setupDone = isFirstTimeSetupCompleted();
      if (!setupDone) return true; // not setup yet -> setup wizard will be shown

      const sessionUnlocked = sessionStorage.getItem('dashboard_session_active') === 'true';
      if (sessionUnlocked) {
        return false; // Browser reload during active dashboard session
      }
    }
    return true; // Fresh application session: show Lock Page
  });

  const [hasPasswordConfigured, setHasPasswordConfigured] = useState<boolean>(false);

  // Sheets Config
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>({
    webAppUrl: '',
    status: 'not_configured',
    lastSyncedAt: null,
  });

  // Sync State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Language State (Stored purely in client localStorage per user directive)
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferred_language');
      if (saved === 'bn' || saved === 'en') return saved;
    }
    return 'en';
  });

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_language', newLang);
    }
  };

  const t = translations[lang];

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<Client | null>(null);
  const [selectedClientForPrint, setSelectedClientForPrint] = useState<Client | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusToEdit, setStatusToEdit] = useState<ApplicationStatusItem | null>(null);

  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [statusToDelete, setStatusToDelete] = useState<ApplicationStatusItem | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Theme mode state (persisted in localStorage)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme_mode');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme_mode', next);
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // 1. Initial Load from Persistent Store and Google Sheets
  useEffect(() => {
    // Load local stored data
    const local = getLocalData();
    setClients(local.clients);
    setCategories(local.categories);
    if (local.applicationStatuses && local.applicationStatuses.length > 0) {
      setApplicationStatuses(local.applicationStatuses);
    }
    if (local.branding) {
      setBranding(local.branding);
      setActiveCurrency(local.branding.currency, local.branding.customCurrencySymbol);
    }

    // Load sheets config
    const config = loadSheetsConfig();
    setSheetsConfig(config);

    // Only interact with remote Google Sheets if setup has been completed
    if (isFirstTimeSetupCompleted() && config.webAppUrl && config.webAppUrl.trim().startsWith('http')) {
      // Quickly check password configuration status
      checkPasswordConfigured(config.webAppUrl).then((chk) => {
        if (chk.success && chk.hasPasswordConfigured !== undefined) {
          setHasPasswordConfigured(chk.hasPasswordConfigured);
        }
      }).catch(() => {});

      // Pull live data - Google Sheets is the persistent source of truth
      setIsSyncing(true);
      fetchFromGoogleSheets(config.webAppUrl)
        .then((res) => {
          if (res.success) {
            if (res.hasPasswordConfigured !== undefined) {
              setHasPasswordConfigured(Boolean(res.hasPasswordConfigured));
            }
            if (res.branding) {
              setBranding(res.branding);
              setActiveCurrency(res.branding.currency, res.branding.customCurrencySymbol);
              saveStoredBranding(res.branding);
            }
            if (res.clients) {
              setClients(res.clients);
            }
            if (res.categories) {
              setCategories(res.categories);
            }
            if (res.applicationStatuses && res.applicationStatuses.length > 0) {
              setApplicationStatuses(res.applicationStatuses);
            }
            saveLocalData({
              clients: res.clients || local.clients,
              categories: res.categories || local.categories,
              applicationStatuses: res.applicationStatuses || local.applicationStatuses,
              branding: res.branding || local.branding,
              updatedAt: new Date().toISOString(),
            });
            const updatedConfig: GoogleSheetsConfig = {
              ...config,
              sheetName: res.sheetName || config.sheetName,
              lastSyncedAt: new Date().toISOString(),
              status: 'connected',
            };
            setSheetsConfig(updatedConfig);
            saveSheetsConfig(updatedConfig);
          }
        })
        .catch((err) => {
          console.warn('Initial sheets fetch failed, using local storage cache:', err);
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }
  }, []);

  // 2. 10-Minute Inactivity Auto-Lock
  // Runs continuously in the background only after the dashboard is unlocked.
  // Any user activity (mouse, keyboard, touch, scroll) resets the 10-minute timer.
  useEffect(() => {
    if (isLocked) return;

    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
    let timeoutId: any = null;

    const resetInactivityTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('dashboard_session_active');
        }
        setIsLocked(true);
        showToast(t.autoLockNotice, 'info');
      }, INACTIVITY_TIMEOUT_MS);
    };

    // Arm timer on unlock
    resetInactivityTimer();

    // Event listeners to detect any user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'keypress',
      'scroll',
      'touchstart',
      'wheel',
      'click',
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
    };
  }, [isLocked, showToast, t.autoLockNotice]);

  // Synchronize global currency formatting with current branding settings
  useEffect(() => {
    setActiveCurrency(branding.currency, branding.customCurrencySymbol);
  }, [branding.currency, branding.customCurrencySymbol]);

  // Security & Unlock Action Handlers
  const handleUnlock = async (enteredPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!sheetsConfig.webAppUrl || !sheetsConfig.webAppUrl.trim().startsWith('http')) {
      // If web app URL is not configured yet, unlock and allow user to setup sheet
      setIsLocked(false);
      return { success: true };
    }

    try {
      const res = await verifyDashboardPassword(sheetsConfig.webAppUrl, enteredPassword);
      if (res.verified) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('dashboard_session_active', 'true');
        }
        setIsLocked(false);
        setHasPasswordConfigured(true);
        return { success: true };
      } else {
        return {
          success: false,
          error: res.error || t.incorrectPassword,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || t.incorrectPassword,
      };
    }
  };

  const handleSetInitialPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!sheetsConfig.webAppUrl || !sheetsConfig.webAppUrl.trim().startsWith('http')) {
      setIsLocked(false);
      return { success: true };
    }

    try {
      const res = await setDashboardPassword(sheetsConfig.webAppUrl, { newPassword });
      if (res.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('dashboard_session_active', 'true');
        }
        markFirstTimeSetupCompleted();
        setIsSetupComplete(true);
        setHasPasswordConfigured(true);
        setIsLocked(false);
        showToast(t.passwordSetSuccess, 'success');
        return { success: true };
      } else {
        return { success: false, error: res.error || 'Failed to configure password.' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error communicating with Google Sheets' };
    }
  };

  const handleFirstTimeSetupComplete = async (completedWebAppUrl: string) => {
    // 1. Mark setup as permanently completed
    markFirstTimeSetupCompleted();
    setIsSetupComplete(true);

    // 2. Mark current browser session as active (so reload keeps user in dashboard)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dashboard_session_active', 'true');
    }

    // 3. Update Sheets config
    const updatedConfig: GoogleSheetsConfig = {
      ...sheetsConfig,
      webAppUrl: completedWebAppUrl,
      status: 'connected',
      lastSyncedAt: new Date().toISOString(),
    };
    setSheetsConfig(updatedConfig);
    saveSheetsConfig(updatedConfig);

    // 4. Update password and unlock states
    setHasPasswordConfigured(true);
    setIsLocked(false);
    showToast(t.setupCompletedNotice, 'success');

    // 5. Pull initial data from the connected spreadsheet
    setIsSyncing(true);
    try {
      const res = await fetchFromGoogleSheets(completedWebAppUrl);
      if (res.success) {
        if (res.branding) {
          setBranding(res.branding);
          setActiveCurrency(res.branding.currency, res.branding.customCurrencySymbol);
          saveStoredBranding(res.branding);
        }
        if (res.clients) setClients(res.clients);
        if (res.categories) setCategories(res.categories);
        if (res.applicationStatuses && res.applicationStatuses.length > 0) {
          setApplicationStatuses(res.applicationStatuses);
        }
      }
    } catch (e) {
      console.warn('Initial setup data pull:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSetPasswordFromSettings = async (
    newPassword: string,
    currentPassword?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!sheetsConfig.webAppUrl || !sheetsConfig.webAppUrl.trim().startsWith('http')) {
      return {
        success: false,
        error: lang === 'bn' ? 'গুগল শিট ওয়েব অ্যাপ সংযুক্ত করা হয়নি।' : 'Google Sheets Web App is not connected yet.',
      };
    }

    try {
      const res = await setDashboardPassword(sheetsConfig.webAppUrl, { newPassword, currentPassword });
      if (res.success) {
        setHasPasswordConfigured(true);
        showToast(t.passwordChangeSuccess || t.passwordSetSuccess, 'success');
        return { success: true };
      } else {
        return { success: false, error: res.error || 'Failed to update password.' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error communicating with Google Sheets' };
    }
  };

  // Compute live Dashboard statistics from clients array
  const dashboardStats = useMemo(() => {
    return calculateDashboardStats(clients);
  }, [clients]);

  // Next unique Client ID
  const nextClientId = useMemo(() => {
    return generateNextClientId(clients);
  }, [clients]);

  // Next unique Category ID
  const nextCategoryId = useMemo(() => {
    return generateNextCategoryId(categories);
  }, [categories]);

  // Next unique Status ID
  const nextStatusId = useMemo(() => {
    return generateNextStatusId(applicationStatuses);
  }, [applicationStatuses]);

  // Save full state locally and sync with Google Sheets
  const persistAndSync = useCallback((
    updatedClients: Client[],
    updatedCategories: Category[],
    updatedStatuses: ApplicationStatusItem[],
    updatedBranding: AppBranding,
    _actionDesc?: string
  ) => {
    // Save to local storage immediately
    saveLocalData({
      clients: updatedClients,
      categories: updatedCategories,
      applicationStatuses: updatedStatuses,
      branding: updatedBranding,
      updatedAt: new Date().toISOString(),
    });

    // If Google Sheets is connected, push update in background
    if (sheetsConfig.webAppUrl && sheetsConfig.status === 'connected') {
      setIsSyncing(true);
      sendMutationToGoogleSheets(sheetsConfig.webAppUrl, 'saveAll', {
        clients: updatedClients,
        categories: updatedCategories,
        applicationStatuses: updatedStatuses,
        branding: updatedBranding,
        settings: {
          app_title: updatedBranding.title,
          app_slogan: updatedBranding.slogan,
          logo_url: (updatedBranding.logoUrl && updatedBranding.logoUrl.length > 45000)
            ? updatedBranding.logoUrl.substring(0, 45000)
            : (updatedBranding.logoUrl || ''),
          currency: updatedBranding.currency || 'USD',
          custom_currency_symbol: updatedBranding.customCurrencySymbol || '',
        },
      })
        .then((res) => {
          if (res.success) {
            const updatedConfig: GoogleSheetsConfig = {
              ...sheetsConfig,
              lastSyncedAt: new Date().toISOString(),
            };
            setSheetsConfig(updatedConfig);
            saveSheetsConfig(updatedConfig);
          } else {
            console.warn('Sheets sync response:', res.error);
          }
        })
        .catch((err) => {
          console.error('Sheets sync error:', err);
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }
  }, [sheetsConfig]);

  // ================= Client Actions =================
  const handleOpenAddClient = () => {
    setClientToEdit(null);
    setIsClientModalOpen(true);
  };

  const handleOpenEditClient = (client: Client) => {
    setClientToEdit(client);
    setIsClientModalOpen(true);
  };

  const handleSaveClient = (clientData: Client) => {
    let updatedClients: Client[];
    const isEdit = clients.some((c) => c.id === clientData.id);

    if (isEdit) {
      updatedClients = clients.map((c) => (c.id === clientData.id ? clientData : c));
      showToast(`Client ${clientData.id} (${clientData.name}) updated successfully.`);
    } else {
      updatedClients = [clientData, ...clients];
      showToast(`New Client ${clientData.id} (${clientData.name}) added and saved.`);
    }

    setClients(updatedClients);
    persistAndSync(updatedClients, categories, applicationStatuses, branding, isEdit ? 'updateClient' : 'addClient');
  };

  // ================= Category Actions =================
  const handleOpenAddCategory = () => {
    setCategoryToEdit(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (category: Category) => {
    setCategoryToEdit(category);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (categoryData: Category) => {
    let updatedCategories: Category[];
    const isEdit = categories.some((c) => c.id === categoryData.id);

    if (isEdit) {
      updatedCategories = categories.map((c) => (c.id === categoryData.id ? categoryData : c));
      showToast(`Category ${categoryData.id} (${categoryData.name}) updated.`);
    } else {
      updatedCategories = [...categories, categoryData];
      showToast(`Category ${categoryData.id} (${categoryData.name}) created and saved to Google Sheets.`);
    }

    setCategories(updatedCategories);
    persistAndSync(clients, updatedCategories, applicationStatuses, branding, isEdit ? 'updateCategory' : 'addCategory');
  };

  const handleToggleCategoryStatus = (category: Category) => {
    const newStatus = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updatedCategories = categories.map((c) =>
      c.id === category.id ? { ...c, status: newStatus as any } : c
    );
    setCategories(updatedCategories);
    persistAndSync(clients, updatedCategories, applicationStatuses, branding, 'updateCategory');

    showToast(
      newStatus === 'INACTIVE'
        ? `Category "${category.name}" deactivated. Hidden for new client entries, preserved for historical records.`
        : `Category "${category.name}" re-activated. Now available for new entries.`
    );
  };

  // ================= Application Status Actions =================
  const handleOpenAddStatus = () => {
    setStatusToEdit(null);
    setIsStatusModalOpen(true);
  };

  const handleOpenEditStatus = (status: ApplicationStatusItem) => {
    setStatusToEdit(status);
    setIsStatusModalOpen(true);
  };

  const handleSaveStatus = async (statusData: ApplicationStatusItem): Promise<boolean> => {
    const isEdit = applicationStatuses.some((s) => s.id === statusData.id);
    let updatedStatuses: ApplicationStatusItem[];
    let preparedStatus: ApplicationStatusItem;

    if (isEdit) {
      const original = applicationStatuses.find((s) => s.id === statusData.id);
      preparedStatus = {
        ...statusData,
        id: statusData.id,
        createdDate: original?.createdDate || statusData.createdDate,
      };
      updatedStatuses = applicationStatuses.map((s) =>
        s.id === statusData.id ? preparedStatus : s
      );
    } else {
      preparedStatus = {
        ...statusData,
        id: statusData.id || nextStatusId,
        createdDate: statusData.createdDate || getCurrentDate(),
      };
      updatedStatuses = [...applicationStatuses, preparedStatus];
    }

    // When Google Sheets is connected, update UI only after operation succeeds
    if (sheetsConfig.webAppUrl && sheetsConfig.status === 'connected') {
      setIsSyncing(true);
      try {
        const action = isEdit ? 'updateStatus' : 'addStatus';
        let res = await sendMutationToGoogleSheets(sheetsConfig.webAppUrl, action, {
          status: preparedStatus,
          applicationStatuses: updatedStatuses,
        });

        // Graceful compatibility fallback if user's deployed Web App is an older version
        if (!res.success && res.error && res.error.toLowerCase().includes('unknown action')) {
          console.warn(`Deployed Apps Script does not recognize ${action}, saving via saveAll:`, res.error);
          res = await sendMutationToGoogleSheets(sheetsConfig.webAppUrl, 'saveAll', {
            clients,
            categories,
            applicationStatuses: updatedStatuses,
            branding,
          });
          if (res.success) {
            showToast('Saved to Google Sheets. (Please update Google Apps Script to New Version for direct status routing)', 'info');
          }
        }

        if (!res.success) {
          showToast(res.error || `Failed to ${isEdit ? 'update' : 'add'} status in Google Sheets`, 'error');
          return false;
        }

        // Also trigger saveAll in background to guarantee full spreadsheet consistency
        sendMutationToGoogleSheets(sheetsConfig.webAppUrl, 'saveAll', {
          clients,
          categories,
          applicationStatuses: updatedStatuses,
          branding,
        }).catch((err) => console.warn('Background sync warning:', err));

        // Update UI only after Google Sheets succeeds
        setApplicationStatuses(updatedStatuses);
        saveLocalData({
          clients,
          categories,
          applicationStatuses: updatedStatuses,
          branding,
          updatedAt: new Date().toISOString(),
        });

        const updatedConfig: GoogleSheetsConfig = {
          ...sheetsConfig,
          lastSyncedAt: new Date().toISOString(),
        };
        setSheetsConfig(updatedConfig);
        saveSheetsConfig(updatedConfig);

        showToast(
          isEdit
            ? `Status ${preparedStatus.id} (${preparedStatus.name}) updated in Google Sheets.`
            : `Status ${preparedStatus.id} (${preparedStatus.name}) created in Google Sheets.`
        );
        return true;
      } catch (err: any) {
        showToast(err.message || 'Error communicating with Google Sheets', 'error');
        return false;
      } finally {
        setIsSyncing(false);
      }
    } else {
      // Local fallback if Google Sheets is not configured yet
      setApplicationStatuses(updatedStatuses);
      saveLocalData({
        clients,
        categories,
        applicationStatuses: updatedStatuses,
        branding,
        updatedAt: new Date().toISOString(),
      });
      showToast(
        isEdit
          ? `Status ${preparedStatus.id} (${preparedStatus.name}) updated locally.`
          : `Status ${preparedStatus.id} (${preparedStatus.name}) created locally.`
      );
      return true;
    }
  };

  const handleToggleStatusActive = async (status: ApplicationStatusItem) => {
    const newStatus = status.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updatedStatus: ApplicationStatusItem = {
      ...status,
      status: newStatus,
    };
    const updatedStatuses = applicationStatuses.map((s) =>
      s.id === status.id ? updatedStatus : s
    );

    if (sheetsConfig.webAppUrl && sheetsConfig.status === 'connected') {
      setIsSyncing(true);
      try {
        let res = await sendMutationToGoogleSheets(sheetsConfig.webAppUrl, 'updateStatus', {
          status: updatedStatus,
          applicationStatuses: updatedStatuses,
        });

        // Graceful compatibility fallback if user's deployed Web App is an older version
        if (!res.success && res.error && res.error.toLowerCase().includes('unknown action')) {
          console.warn('Deployed Apps Script does not recognize updateStatus, saving via saveAll:', res.error);
          res = await sendMutationToGoogleSheets(sheetsConfig.webAppUrl, 'saveAll', {
            clients,
            categories,
            applicationStatuses: updatedStatuses,
            branding,
          });
        }

        if (!res.success) {
          showToast(res.error || 'Failed to update status in Google Sheets', 'error');
          return;
        }

        sendMutationToGoogleSheets(sheetsConfig.webAppUrl, 'saveAll', {
          clients,
          categories,
          applicationStatuses: updatedStatuses,
          branding,
        }).catch((err) => console.warn('Background sync warning:', err));

        setApplicationStatuses(updatedStatuses);
        saveLocalData({
          clients,
          categories,
          applicationStatuses: updatedStatuses,
          branding,
          updatedAt: new Date().toISOString(),
        });

        showToast(
          newStatus === 'INACTIVE'
            ? `Status "${status.name}" deactivated in Google Sheets.`
            : `Status "${status.name}" activated in Google Sheets.`
        );
      } catch (err: any) {
        showToast(err.message || 'Error communicating with Google Sheets', 'error');
      } finally {
        setIsSyncing(false);
      }
    } else {
      setApplicationStatuses(updatedStatuses);
      saveLocalData({
        clients,
        categories,
        applicationStatuses: updatedStatuses,
        branding,
        updatedAt: new Date().toISOString(),
      });

      showToast(
        newStatus === 'INACTIVE'
          ? `Status "${status.name}" deactivated locally.`
          : `Status "${status.name}" activated locally.`
      );
    }
  };

  // ================= Branding Settings Action =================
  const handleSaveBranding = async (newBranding: AppBranding): Promise<{ success: boolean; error?: string }> => {
    // 1. Ensure logo data URL is safely sized for transmission and cell limits
    let safeBranding = { ...newBranding };
    if (safeBranding.logoUrl && safeBranding.logoUrl.startsWith('data:image/') && safeBranding.logoUrl.length > 40000) {
      safeBranding.logoUrl = await compressLogoDataUrl(safeBranding.logoUrl);
    }

    // 2. Immediately update state and local persistence
    setBranding(safeBranding);
    setActiveCurrency(safeBranding.currency, safeBranding.customCurrencySymbol);
    saveStoredBranding(safeBranding);
    saveLocalData({
      clients,
      categories,
      applicationStatuses,
      branding: safeBranding,
      updatedAt: new Date().toISOString(),
    });

    // 3. Persist directly to Google Sheets "Settings" sheet
    if (sheetsConfig.webAppUrl && sheetsConfig.webAppUrl.trim().length > 0) {
      setIsSyncing(true);
      try {
        const payload = {
          settings: {
            app_title: safeBranding.title,
            app_slogan: safeBranding.slogan,
            logo_url: safeBranding.logoUrl || '',
            currency: safeBranding.currency || 'USD',
            custom_currency_symbol: safeBranding.customCurrencySymbol || '',
          },
          branding: safeBranding,
        };

        const res = await sendMutationToGoogleSheets(sheetsConfig.webAppUrl, 'saveSettings', payload);
        if (res.success) {
          const updatedConfig: GoogleSheetsConfig = {
            ...sheetsConfig,
            lastSyncedAt: new Date().toISOString(),
            status: 'connected',
          };
          setSheetsConfig(updatedConfig);
          saveSheetsConfig(updatedConfig);
          showToast(t.brandingSavedSuccess);
          return { success: true };
        } else {
          // Fallback to saveAll
          const fallbackRes = await sendMutationToGoogleSheets(sheetsConfig.webAppUrl, 'saveAll', {
            clients,
            categories,
            applicationStatuses,
            ...payload,
          });
          if (fallbackRes.success) {
            const updatedConfig: GoogleSheetsConfig = {
              ...sheetsConfig,
              lastSyncedAt: new Date().toISOString(),
              status: 'connected',
            };
            setSheetsConfig(updatedConfig);
            saveSheetsConfig(updatedConfig);
            showToast(t.brandingSavedSuccess);
            return { success: true };
          }
          showToast(`Saved locally, but Google Sheets returned: ${res.error || fallbackRes.error || 'Failed to save'}`, 'error');
          return { success: false, error: res.error || fallbackRes.error };
        }
      } catch (err: any) {
        console.error('Failed to sync settings to Google Sheets:', err);
        showToast(`Saved locally, but network error occurred: ${err.message}`, 'error');
        return { success: false, error: err.message };
      } finally {
        setIsSyncing(false);
      }
    } else {
      showToast(t.brandingSavedSuccess);
      return { success: true };
    }
  };

  // ================= Delete Actions =================
  const handlePromptDeleteClient = (client: Client) => {
    setCategoryToDelete(null);
    setStatusToDelete(null);
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteClient = (clientId: string) => {
    const updatedClients = clients.filter((c) => c.id !== clientId);
    setClients(updatedClients);
    persistAndSync(updatedClients, categories, applicationStatuses, branding, 'deleteClient');
    if (sheetsConfig.webAppUrl && sheetsConfig.status === 'connected') {
      sendMutationToGoogleSheets(sheetsConfig.webAppUrl, 'deleteClient', { clientId })
        .catch((err) => console.warn('Delete client API error:', err));
    }
    showToast(`Client ${clientId} deleted successfully.`);
  };

  const handlePromptDeleteCategory = (category: Category) => {
    setClientToDelete(null);
    setStatusToDelete(null);
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteCategory = (categoryId: string) => {
    const target = categories.find((c) => c.id === categoryId);
    const updatedCategories = categories.filter((c) => c.id !== categoryId);
    setCategories(updatedCategories);
    persistAndSync(clients, updatedCategories, applicationStatuses, branding, 'deleteCategory');
    if (sheetsConfig.webAppUrl && sheetsConfig.status === 'connected') {
      sendMutationToGoogleSheets(sheetsConfig.webAppUrl, 'deleteCategory', { categoryId })
        .catch((err) => console.warn('Delete category API error:', err));
    }
    showToast(`Category ${categoryId} ${target ? `("${target.name}")` : ''} deleted.`);
  };

  const handlePromptDeleteStatus = (status: ApplicationStatusItem) => {
    setClientToDelete(null);
    setCategoryToDelete(null);
    setStatusToDelete(status);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteStatus = async (statusId: string) => {
    const target = applicationStatuses.find((s) => s.id === statusId);
    const updatedStatuses = applicationStatuses.filter((s) => s.id !== statusId);

    if (sheetsConfig.webAppUrl && sheetsConfig.status === 'connected') {
      setIsSyncing(true);
      try {
        let res = await sendMutationToGoogleSheets(sheetsConfig.webAppUrl, 'deleteStatus', {
          statusId,
          applicationStatuses: updatedStatuses,
        });

        // Graceful compatibility fallback if user's deployed Web App is an older version
        if (!res.success && res.error && res.error.toLowerCase().includes('unknown action')) {
          console.warn('Deployed Apps Script does not recognize deleteStatus, deleting via saveAll:', res.error);
          res = await sendMutationToGoogleSheets(sheetsConfig.webAppUrl, 'saveAll', {
            clients,
            categories,
            applicationStatuses: updatedStatuses,
            branding,
          });
          if (res.success) {
            showToast('Deleted from Google Sheets. (Please update Google Apps Script to New Version for direct status routing)', 'info');
          }
        }

        if (!res.success) {
          showToast(res.error || 'Failed to delete status from Google Sheets', 'error');
          return;
        }

        sendMutationToGoogleSheets(sheetsConfig.webAppUrl, 'saveAll', {
          clients,
          categories,
          applicationStatuses: updatedStatuses,
          branding,
        }).catch((err) => console.warn('Background sync warning:', err));

        // Update UI only after Google Sheets responds successfully
        setApplicationStatuses(updatedStatuses);
        saveLocalData({
          clients,
          categories,
          applicationStatuses: updatedStatuses,
          branding,
          updatedAt: new Date().toISOString(),
        });

        showToast(`Status ${statusId} ${target ? `("${target.name}")` : ''} deleted from Google Sheets.`);
      } catch (err: any) {
        showToast(err.message || 'Error communicating with Google Sheets', 'error');
      } finally {
        setIsSyncing(false);
      }
    } else {
      setApplicationStatuses(updatedStatuses);
      saveLocalData({
        clients,
        categories,
        applicationStatuses: updatedStatuses,
        branding,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Status ${statusId} ${target ? `("${target.name}")` : ''} deleted locally.`);
    }
  };

  const linkedClientsCount = useMemo(() => {
    if (categoryToDelete) {
      return clients.filter((c) => c.category === categoryToDelete.name).length;
    }
    if (statusToDelete) {
      return clients.filter((c) => c.applicationStatus.toUpperCase() === statusToDelete.name.toUpperCase()).length;
    }
    return 0;
  }, [categoryToDelete, statusToDelete, clients]);

  // ================= Google Sheets Connection =================
  const handleSaveSheetsConfig = async (newUrl: string): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const test = await testGoogleSheetsConnection(newUrl);
      if (test.success) {
        // Connected! Try fetching existing settings and records from the sheet first
        const fetchRes = await fetchFromGoogleSheets(newUrl);
        if (fetchRes.success && (fetchRes.branding || (fetchRes.clients && fetchRes.clients.length > 0))) {
          if (fetchRes.branding) {
            setBranding(fetchRes.branding);
            setActiveCurrency(fetchRes.branding.currency, fetchRes.branding.customCurrencySymbol);
            saveStoredBranding(fetchRes.branding);
          }
          if (fetchRes.clients) setClients(fetchRes.clients);
          if (fetchRes.categories) setCategories(fetchRes.categories);
          if (fetchRes.applicationStatuses && fetchRes.applicationStatuses.length > 0) {
            setApplicationStatuses(fetchRes.applicationStatuses);
          }
          saveLocalData({
            clients: fetchRes.clients || clients,
            categories: fetchRes.categories || categories,
            applicationStatuses: fetchRes.applicationStatuses || applicationStatuses,
            branding: fetchRes.branding || branding,
            updatedAt: new Date().toISOString(),
          });
        } else {
          // Push current data and settings
          await sendMutationToGoogleSheets(newUrl, 'saveAll', {
            clients,
            categories,
            applicationStatuses,
            branding,
            settings: {
              app_title: branding.title,
              app_slogan: branding.slogan,
              logo_url: (branding.logoUrl && branding.logoUrl.length > 45000)
                ? branding.logoUrl.substring(0, 45000)
                : (branding.logoUrl || ''),
              currency: branding.currency || 'USD',
              custom_currency_symbol: branding.customCurrencySymbol || '',
            },
          });
        }

        const newConfig: GoogleSheetsConfig = {
          webAppUrl: newUrl,
          sheetName: test.sheetName,
          status: 'connected',
          lastSyncedAt: new Date().toISOString(),
        };
        setSheetsConfig(newConfig);
        saveSheetsConfig(newConfig);
        showToast(`Connected to Google Sheet: "${test.sheetName || 'Spreadsheet'}"!`, 'success');
        return true;
      } else {
        const errorConfig: GoogleSheetsConfig = {
          ...sheetsConfig,
          webAppUrl: newUrl,
          status: 'error',
          errorMessage: test.error,
        };
        setSheetsConfig(errorConfig);
        saveSheetsConfig(errorConfig);
        showToast(test.error || 'Connection failed', 'error');
        return false;
      }
    } catch (err: any) {
      showToast(err.message || 'Connection error', 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAllToSheet = async () => {
    if (!sheetsConfig.webAppUrl) {
      showToast('Please connect a Google Sheet first.', 'error');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await sendMutationToGoogleSheets(sheetsConfig.webAppUrl, 'saveAll', {
        clients,
        categories,
        applicationStatuses,
        branding,
        settings: {
          app_title: branding.title,
          app_slogan: branding.slogan,
          logo_url: (branding.logoUrl && branding.logoUrl.length > 45000)
            ? branding.logoUrl.substring(0, 45000)
            : (branding.logoUrl || ''),
          currency: branding.currency || 'USD',
          custom_currency_symbol: branding.customCurrencySymbol || '',
        },
      });
      if (res.success) {
        const updatedConfig: GoogleSheetsConfig = {
          ...sheetsConfig,
          lastSyncedAt: new Date().toISOString(),
        };
        setSheetsConfig(updatedConfig);
        saveSheetsConfig(updatedConfig);
        showToast('All client, category, status, and settings records synced to Google Sheets.');
      } else {
        showToast(res.error || 'Sync failed', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromSheet = async () => {
    if (!sheetsConfig.webAppUrl) {
      showToast('Please connect a Google Sheet first.', 'error');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await fetchFromGoogleSheets(sheetsConfig.webAppUrl);
      if (res.success) {
        if (res.clients) {
          setClients(res.clients);
        }
        if (res.categories) {
          setCategories(res.categories);
        }
        if (res.applicationStatuses && res.applicationStatuses.length > 0) {
          setApplicationStatuses(res.applicationStatuses);
        }
        if (res.branding) {
          setBranding(res.branding);
          setActiveCurrency(res.branding.currency, res.branding.customCurrencySymbol);
          saveStoredBranding(res.branding);
        }
        saveLocalData({
          clients: res.clients || clients,
          categories: res.categories || categories,
          applicationStatuses: res.applicationStatuses || applicationStatuses,
          branding: res.branding || branding,
          updatedAt: new Date().toISOString(),
        });
        const updatedConfig: GoogleSheetsConfig = {
          ...sheetsConfig,
          sheetName: res.sheetName || sheetsConfig.sheetName,
          lastSyncedAt: new Date().toISOString(),
          status: 'connected',
        };
        setSheetsConfig(updatedConfig);
        saveSheetsConfig(updatedConfig);
        showToast('Fetched latest data and settings directly from Google Sheets.');
      } else {
        showToast(res.error || 'Fetch failed', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Fetch failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // 1. First-time open: If initial setup is incomplete, show FirstTimeSetup wizard
  if (!isSetupComplete) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <FirstTimeSetup
          branding={branding}
          config={sheetsConfig}
          onSetupComplete={handleFirstTimeSetupComplete}
          lang={lang}
          onLanguageChange={handleLanguageChange}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
            <div
              className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium ${
                toast.type === 'success'
                  ? 'bg-emerald-900 text-emerald-100 border-emerald-800'
                  : toast.type === 'error'
                  ? 'bg-rose-900 text-rose-100 border-rose-800'
                  : 'bg-slate-900 text-slate-100 border-slate-800'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
              )}
              <span>{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Setup completed: Check if Dashboard is currently locked
  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <LockPage
          branding={branding}
          hasPasswordConfigured={hasPasswordConfigured}
          isWebappConfigured={Boolean(sheetsConfig.webAppUrl && sheetsConfig.webAppUrl.trim().startsWith('http'))}
          onUnlock={handleUnlock}
          onSetInitialPassword={handleSetInitialPassword}
          onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
          lang={lang}
          onLanguageChange={handleLanguageChange}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Google Sheets Config & Sync Modal accessible from lock screen */}
        <GoogleSheetsModal
          isOpen={isSheetsModalOpen}
          onClose={() => setIsSheetsModalOpen(false)}
          config={sheetsConfig}
          onSaveConfig={handleSaveSheetsConfig}
          onSyncAllToSheet={handleSyncAllToSheet}
          onPullFromSheet={handlePullFromSheet}
          isSyncing={isSyncing}
        />

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
            <div
              className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium ${
                toast.type === 'success'
                  ? 'bg-emerald-900 text-emerald-100 border-emerald-800'
                  : toast.type === 'error'
                  ? 'bg-rose-900 text-rose-100 border-rose-800'
                  : 'bg-slate-900 text-slate-100 border-slate-800'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
              )}
              <span>{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sheetsConfig={sheetsConfig}
        branding={branding}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onOpenBrandingModal={() => setIsBrandingModalOpen(true)}
        onLockApp={() => {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('dashboard_session_active');
          }
          setIsLocked(true);
        }}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onQuickSync={sheetsConfig.status === 'connected' ? handlePullFromSheet : () => setIsSheetsModalOpen(true)}
        isSyncing={isSyncing}
        totalClients={clients.length}
        totalStatuses={applicationStatuses.length}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={dashboardStats}
            recentClients={clients.slice(0, 5)}
            applicationStatuses={applicationStatuses}
            onAddClient={handleOpenAddClient}
            onAddCategory={handleOpenAddCategory}
            onManageStatuses={() => setActiveTab('statuses')}
            onViewAllClients={() => setActiveTab('clients')}
            onViewClient={(client) => setSelectedClientForDetails(client)}
            isSheetsConnected={sheetsConfig.status === 'connected'}
            onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
            lang={lang}
          />
        )}

        {activeTab === 'clients' && (
          <ClientManagementView
            clients={clients}
            categories={categories}
            applicationStatuses={applicationStatuses}
            onAddClient={handleOpenAddClient}
            onEditClient={handleOpenEditClient}
            onViewClient={(client) => setSelectedClientForDetails(client)}
            onDeleteClient={handlePromptDeleteClient}
            onPrintClient={(client) => setSelectedClientForPrint(client)}
            isSyncing={isSyncing}
            lang={lang}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManagementView
            categories={categories}
            clients={clients}
            onAddCategory={handleOpenAddCategory}
            onEditCategory={handleOpenEditCategory}
            onToggleCategoryStatus={handleToggleCategoryStatus}
            onDeleteCategory={handlePromptDeleteCategory}
            lang={lang}
          />
        )}

        {activeTab === 'statuses' && (
          <ApplicationStatusManagementView
            statuses={applicationStatuses}
            clients={clients}
            onAddStatus={handleOpenAddStatus}
            onEditStatus={handleOpenEditStatus}
            onToggleStatusActive={handleToggleStatusActive}
            onDeleteStatus={handlePromptDeleteStatus}
            lang={lang}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 mt-auto transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <p className="font-medium text-slate-700 dark:text-slate-300">
            {lang === 'bn'
              ? `ডেভেলপড বাই: Mahmudul Hasan Manik © ${new Date().getFullYear()}. সর্বস্বত্ব সংরক্ষিত।`
              : `Developed by: Mahmudul Hasan Manik © ${new Date().getFullYear()}. All Rights Reserved.`}
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsBrandingModalOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 underline"
            >
              {t.brandingSettings}
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSheetsModalOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 underline"
            >
              {t.sheetsSetupGuide}
            </button>
            <span>•</span>
            <span>Auto-Calculated Financials</span>
          </div>
        </div>
      </footer>

      {/* Client Add/Edit Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveClient}
        clientToEdit={clientToEdit}
        categories={categories}
        applicationStatuses={applicationStatuses}
        nextClientId={nextClientId}
        lang={lang}
      />

      {/* Client Details Modal */}
      <ClientDetailsModal
        isOpen={!!selectedClientForDetails}
        client={selectedClientForDetails}
        onClose={() => setSelectedClientForDetails(null)}
        onEdit={(client) => {
          setSelectedClientForDetails(null);
          handleOpenEditClient(client);
        }}
        onDelete={(client) => {
          setSelectedClientForDetails(null);
          handlePromptDeleteClient(client);
        }}
        onPrint={(client) => {
          setSelectedClientForDetails(null);
          setSelectedClientForPrint(client);
        }}
        lang={lang}
      />

      {/* Client Professional Print Preview Modal */}
      <ClientPrintPreviewModal
        isOpen={!!selectedClientForPrint}
        onClose={() => setSelectedClientForPrint(null)}
        client={selectedClientForPrint}
        branding={branding}
        lang={lang}
      />

      {/* Category Add/Edit Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        categoryToEdit={categoryToEdit}
        nextCategoryId={nextCategoryId}
        lang={lang}
      />

      {/* Application Status Add/Edit Modal */}
      <ApplicationStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSave={handleSaveStatus}
        statusToEdit={statusToEdit}
        nextStatusId={nextStatusId}
        lang={lang}
      />

      {/* Branding Settings Modal */}
      <BrandingSettingsModal
        isOpen={isBrandingModalOpen}
        onClose={() => setIsBrandingModalOpen(false)}
        branding={branding}
        onSaveBranding={handleSaveBranding}
        hasPasswordConfigured={hasPasswordConfigured}
        onSetPassword={handleSetPasswordFromSettings}
        lang={lang}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setClientToDelete(null);
          setCategoryToDelete(null);
          setStatusToDelete(null);
        }}
        clientToDelete={clientToDelete}
        categoryToDelete={categoryToDelete}
        statusToDelete={statusToDelete}
        linkedClientsCount={linkedClientsCount}
        onConfirmDeleteClient={handleConfirmDeleteClient}
        onConfirmDeleteCategory={handleConfirmDeleteCategory}
        onConfirmDeleteStatus={handleConfirmDeleteStatus}
        onDeactivateCategoryInstead={handleToggleCategoryStatus}
        onDeactivateStatusInstead={handleToggleStatusActive}
        lang={lang}
      />

      {/* Google Sheets Config & Sync Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        config={sheetsConfig}
        onSaveConfig={handleSaveSheetsConfig}
        onSyncAllToSheet={handleSyncAllToSheet}
        onPullFromSheet={handlePullFromSheet}
        isSyncing={isSyncing}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-800'
                : toast.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-800'
                : 'bg-slate-900 text-slate-100 border-slate-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
