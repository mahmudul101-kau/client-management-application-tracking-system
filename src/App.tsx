import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  fetchPublicBranding,
  isFirstTimeSetupCompleted,
  markFirstTimeSetupCompleted,
  resolveWebAppUrl
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

import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X, 
  Loader2, 
  ShieldAlert, 
  RotateCw, 
  Database, 
  Sun, 
  Moon,
  FileSpreadsheet
} from 'lucide-react';

export type StartupRoute = 'CHECKING_BACKEND' | 'LOCK_PAGE' | 'FIRST_TIME_SETUP' | 'BACKEND_ERROR';

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Database State
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [applicationStatuses, setApplicationStatuses] = useState<ApplicationStatusItem[]>(DEFAULT_APPLICATION_STATUSES);
  const [branding, setBranding] = useState<AppBranding>(DEFAULT_BRANDING);

  // Startup routing state: REMOTE BACKEND IS THE SINGLE SOURCE OF TRUTH
  // 1. CHECKING_BACKEND: Resolves VITE_GOOGLE_SHEETS_WEB_APP_URL and checks remote password status
  // 2. LOCK_PAGE: hasPasswordConfigured === true from backend
  // 3. FIRST_TIME_SETUP: ONLY when hasPasswordConfigured === false from backend
  // 4. BACKEND_ERROR: If remote check fails or no URL found, shows clear connection error screen
  const [startupRoute, setStartupRoute] = useState<StartupRoute>('CHECKING_BACKEND');
  const [backendError, setBackendError] = useState<string | null>(null);

  // Sheets Config (from URL params, Vercel environment variables, or localStorage)
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    if (typeof window !== 'undefined') {
      return loadSheetsConfig();
    }
    return {
      webAppUrl: '',
      status: 'not_configured',
      lastSyncedAt: null,
    };
  });

  // First-time setup state (local convenience cache only; remote backend check is source of truth)
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return isFirstTimeSetupCompleted();
    }
    return false;
  });

  // Security & Lock State: Starts locked by default; unlocked only after backend verification + session
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [hasPasswordConfigured, setHasPasswordConfigured] = useState<boolean>(false);

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
  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  // Guard refs to prevent duplicate/concurrent backend checks and prevent updates after unmount
  const startupCheckStartedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  // 1. Startup Decision Logic - REMOTE BACKEND IS THE SINGLE SOURCE OF TRUTH
  // Executes EXACTLY ONCE per app startup; guarded by startupCheckStartedRef and isMountedRef.
  const checkStartupBackend = useCallback(async (isRetry: boolean = false) => {
    // Prevent duplicate/concurrent checks from React StrictMode, effects, or re-renders
    if (startupCheckStartedRef.current && !isRetry) {
      return;
    }
    startupCheckStartedRef.current = true;

    if (!isMountedRef.current) return;
    setStartupRoute('CHECKING_BACKEND');
    setBackendError(null);

    // 1. Resolve VITE_GOOGLE_SHEETS_WEB_APP_URL
    const resolvedUrl = resolveWebAppUrl();
    console.log('[STARTUP_AUTH] 1. resolved Web App URL:', resolvedUrl || '(none)');

    if (!resolvedUrl) {
      console.warn('[STARTUP_AUTH] No Web App URL resolved from env, url params, or local storage.');
      if (isMountedRef.current) {
        setBackendError(
          langRef.current === 'bn'
            ? 'কোনো গুগল অ্যাপস স্ক্রিপ্ট ওয়েব অ্যাপ ইউআরএল পাওয়া যায়নি। অনুগ্রহ করে Vercel-এ VITE_GOOGLE_SHEETS_WEB_APP_URL কনফিগার করুন অথবা নিচের ডাটাবেজ বাটনে ক্লিক করে ইউআরএল দিন।'
            : 'No Google Apps Script Web App URL found. Please configure VITE_GOOGLE_SHEETS_WEB_APP_URL in your Vercel deployment settings, pass ?webapp=<url> in the URL, or click "Configure Database URL" below.'
        );
        setStartupRoute('BACKEND_ERROR');
      }
      console.log('[STARTUP_AUTH] 6. final startup route: BACKEND_ERROR');
      return;
    }

    if (isMountedRef.current) {
      setSheetsConfig((prev) => ({
        ...prev,
        webAppUrl: resolvedUrl,
        status: 'connected',
      }));
    }

    try {
      // 2. Call the remote Apps Script backend to check whether a dashboard password exists & fetch public branding (ONE request)
      const chk = await checkPasswordConfigured(resolvedUrl);

      if (!isMountedRef.current) return;

      // Extract and apply remote public branding (app_title, app_slogan, logo_url) from Google Sheets Settings
      let loadedBranding = chk.branding;

      // Fallback: If checkPasswordStatus didn't include branding (e.g. older deployment), fetch public branding once
      if (!loadedBranding) {
        try {
          const brandRes = await fetchPublicBranding(resolvedUrl);
          if (brandRes.success && brandRes.branding) {
            loadedBranding = brandRes.branding;
          }
        } catch {
          // ignore
        }
      }

      if (loadedBranding && isMountedRef.current) {
        const brandTitle = loadedBranding.app_title || loadedBranding.title;
        const brandSlogan = loadedBranding.app_slogan !== undefined ? loadedBranding.app_slogan : loadedBranding.slogan;
        const brandLogo = loadedBranding.logo_url || loadedBranding.logoUrl;

        setBranding((prev) => {
          const updated: AppBranding = {
            title: brandTitle || prev.title || DEFAULT_BRANDING.title,
            slogan: brandSlogan !== undefined ? brandSlogan : (prev.slogan !== 'Google Sheets Database' ? prev.slogan : ''),
            logoUrl: brandLogo !== undefined ? brandLogo : (prev.logoUrl || ''),
            currency: prev.currency || 'USD',
            customCurrencySymbol: prev.customCurrencySymbol || '',
          };
          saveStoredBranding(updated);
          return updated;
        });
      }

      if (chk.success && chk.hasPasswordConfigured === true) {
        // REQUIREMENT 5:
        // hasPasswordConfigured === true
        // THEN:
        // - NEVER render FirstTimeSetup.
        // - Treat the application as already initialized.
        // - Show LockPage.
        // - Ask only for the existing password.
        // - Verify the password remotely.
        // - On success, open Dashboard and load existing Google Sheets data.
        // NOTE: Does NOT modify localStorage / Google Sheets during check (Requirement 11).

        setIsSetupComplete(true);
        setHasPasswordConfigured(true);

        const sessionActive = typeof window !== 'undefined' && sessionStorage.getItem('dashboard_session_active') === 'true';
        setIsLocked(!sessionActive);
        setStartupRoute('LOCK_PAGE');
        console.log('[STARTUP_AUTH] 6. final startup route: LOCK_PAGE');

        // If session was already active (e.g. reload during active use), pull fresh data in background
        if (sessionActive) {
          setIsSyncing(true);
          fetchFromGoogleSheets(resolvedUrl)
            .then((res) => {
              if (!isMountedRef.current || !res.success) return;
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
              saveLocalData({
                clients: res.clients || [],
                categories: res.categories || [],
                applicationStatuses: res.applicationStatuses || [],
                branding: res.branding || DEFAULT_BRANDING,
                updatedAt: new Date().toISOString(),
              });
            })
            .catch((err) => {
              console.warn('[STARTUP_AUTH] Initial data sync error:', err);
            })
            .finally(() => {
              if (isMountedRef.current) {
                setIsSyncing(false);
              }
            });
        }
      } else if (chk.success && chk.hasPasswordConfigured === false) {
        // REQUIREMENT 6:
        // hasPasswordConfigured === false
        // THEN and ONLY THEN:
        // - allow FirstTimeSetup.
        setIsSetupComplete(false);
        setHasPasswordConfigured(false);
        setStartupRoute('FIRST_TIME_SETUP');
        console.log('[STARTUP_AUTH] 6. final startup route: FIRST_TIME_SETUP');
      } else {
        // REQUIREMENT 7:
        // If the remote check fails:
        // - DO NOT automatically show FirstTimeSetup.
        // - DO NOT initialize the database.
        // - DO NOT create a password.
        // - Show ONE stable BACKEND_ERROR screen with a Retry button.
        setBackendError(
          chk.error ||
          (langRef.current === 'bn' 
            ? 'গুগল অ্যাপস স্ক্রিপ্ট ব্যাকএন্ডের সাথে সংযোগ স্থাপন করা যায়নি।' 
            : 'Could not connect to Google Apps Script backend. Please verify your Web App URL.')
        );
        setStartupRoute('BACKEND_ERROR');
        console.log('[STARTUP_AUTH] 6. final startup route: BACKEND_ERROR');
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setBackendError(
        err.message || 
        (langRef.current === 'bn' 
          ? 'ডাটাবেজ সংযোগ পরীক্ষায় নেটওয়ার্ক ত্রুটি দেখা দিয়েছে।' 
          : 'Network error while checking remote database status.')
      );
      setStartupRoute('BACKEND_ERROR');
      console.log('[STARTUP_AUTH] 6. final startup route: BACKEND_ERROR');
    }
  }, []);

  // Initial Load from Persistent Store and single startup verification check
  useEffect(() => {
    // 1. Load local stored data
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

    // 2. Run startup verification EXACTLY ONCE on app startup
    checkStartupBackend(false);
  }, [checkStartupBackend]);

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
  const handleUnlock = async (enteredPassword: string): Promise<{
    success: boolean;
    error?: string;
    locked?: boolean;
    remainingSeconds?: number;
    remainingAttempts?: number;
  }> => {
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

        // Refresh live data from Google Sheets in background upon successful unlock
        if (sheetsConfig.webAppUrl) {
          fetchFromGoogleSheets(sheetsConfig.webAppUrl).then((fetchRes) => {
            if (fetchRes.success) {
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
            }
          }).catch(() => {});
        }
        return { success: true };
      } else {
        return {
          success: false,
          error: res.error || t.incorrectPassword,
          locked: res.locked,
          remainingSeconds: res.remainingSeconds,
          remainingAttempts: res.remainingAttempts,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || t.incorrectPassword,
      };
    }
  };

  const handleExistingPasswordDetected = useCallback((detectedWebAppUrl: string) => {
    const updatedConfig: GoogleSheetsConfig = {
      ...sheetsConfig,
      webAppUrl: detectedWebAppUrl,
      status: 'connected',
      lastSyncedAt: new Date().toISOString(),
    };
    setSheetsConfig(updatedConfig);
    saveSheetsConfig(updatedConfig);
    setHasPasswordConfigured(true);
    setIsLocked(true); // Must remain locked! Never bypass password authentication.
    setStartupRoute('LOCK_PAGE');
    showToast(
      lang === 'bn' 
        ? 'বিদ্যমান পাসওয়ার্ড সনাক্ত করা হয়েছে। ড্যাশবোর্ডে প্রবেশ করতে আপনার পাসওয়ার্ড দিন।' 
        : 'Existing password detected. Please enter your dashboard password to unlock.',
      'info'
    );
  }, [sheetsConfig, lang, showToast]);

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
    setStartupRoute('LOCK_PAGE');

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

  // 0. CHECKING_BACKEND: Temporary loading screen while verifying backend connection
  // Displays company logo from logo_url, app_title, and app_slogan with secure connection indicator
  if (startupRoute === 'CHECKING_BACKEND') {
    const logoUrl = branding.logoUrl || '';
    const hasCustomLogo = Boolean(logoUrl.trim().length > 0);
    const isImageLogo = Boolean(hasCustomLogo && (
      logoUrl.startsWith('data:') ||
      logoUrl.startsWith('http://') ||
      logoUrl.startsWith('https://') ||
      logoUrl.startsWith('/') ||
      logoUrl.startsWith('blob:')
    ));

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors selection:bg-emerald-500 selection:text-white">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center animate-in fade-in zoom-in-95 duration-200">
          {/* Company Logo Container */}
          {isImageLogo ? (
            <div className="relative group mb-1">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-sm animate-pulse" />
              <img
                src={logoUrl}
                alt={branding.title || 'Application Logo'}
                referrerPolicy="no-referrer"
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md p-2"
              />
            </div>
          ) : hasCustomLogo ? (
            <div className="h-14 sm:h-16 px-5 rounded-2xl bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm sm:text-base tracking-wide shadow-md border border-slate-200/90 dark:border-slate-800 mb-1">
              {logoUrl}
            </div>
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-emerald-400 flex items-center justify-center shadow-lg border border-slate-200/80 dark:border-slate-700/80 mb-1">
              <FileSpreadsheet className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
            </div>
          )}

          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {branding.title || 'Client Management'}
            </h2>
            {branding.slogan && branding.slogan !== 'Google Sheets Database' && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-xs mx-auto">
                {branding.slogan}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-200/70 dark:border-emerald-800/60 font-medium shadow-2xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>{lang === 'bn' ? 'ডাটাবেজের সাথে সংযোগ পরীক্ষা করা হচ্ছে...' : 'Checking secure connection...'}</span>
          </div>
        </div>
      </div>
    );
  }

  // 1. BACKEND_ERROR: If remote check fails or no URL found
  // REQUIREMENT 7:
  // - DO NOT automatically show FirstTimeSetup.
  // - DO NOT initialize the database.
  // - DO NOT create a password.
  // - Show a clear backend connection/configuration error instead.
  if (startupRoute === 'BACKEND_ERROR') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between text-slate-900 dark:text-slate-100 transition-colors p-4 sm:p-6 selection:bg-emerald-500 selection:text-white">
        {/* Top Header with Language & Theme */}
        <div className="w-full max-w-md mx-auto flex items-center justify-between py-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-4 h-4" />
            <span>{lang === 'bn' ? 'সংযোগ ত্রুটি' : 'Connection Alert'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleLanguageChange(lang === 'en' ? 'bn' : 'en')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {lang === 'en' ? 'বাংলা' : 'EN'}
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Central Error Card */}
        <div className="w-full max-w-md mx-auto my-auto bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-2xs">
            <AlertCircle className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {lang === 'bn' ? 'গুগল শিট ব্যাকএন্ড সংযোগ ব্যর্থ' : 'Backend Connection Error'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
            {backendError || (lang === 'bn' ? 'গুগল অ্যাপস স্ক্রিপ্ট ব্যাকএন্ডের সাথে সংযোগ স্থাপন করা যায়নি।' : 'Could not establish connection to the Google Apps Script backend.')}
          </p>

          {sheetsConfig.webAppUrl && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800/70 rounded-xl text-left text-xs mb-5 font-mono text-slate-700 dark:text-slate-300 break-all border border-slate-200 dark:border-slate-700/60">
              <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">
                {lang === 'bn' ? 'যাচাইকৃত ইউআরএল:' : 'Checked URL:'}
              </span>
              {sheetsConfig.webAppUrl}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => checkStartupBackend(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              <span>{lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry Connection'}</span>
            </button>

            <button
              onClick={() => setIsSheetsModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Database className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'bn' ? 'ডাটাবেজ সেটিংস / ইউআরএল পরিবর্তন' : 'Database Settings / Change URL'}</span>
            </button>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto py-2 text-center text-xs text-slate-400 dark:text-slate-600">
          {branding.title}
        </div>

        {/* Database configuration modal */}
        <GoogleSheetsModal
          isOpen={isSheetsModalOpen}
          onClose={() => setIsSheetsModalOpen(false)}
          config={sheetsConfig}
          onSaveConfig={async (newUrl) => {
            const saved = await handleSaveSheetsConfig(newUrl);
            if (saved) {
              setIsSheetsModalOpen(false);
              checkStartupBackend(true);
            }
            return saved;
          }}
          onSyncAllToSheet={handleSyncAllToSheet}
          onPullFromSheet={handlePullFromSheet}
          isSyncing={isSyncing}
        />
      </div>
    );
  }

  // 2. FIRST_TIME_SETUP: ONLY allowed when remote backend explicitly confirmed hasPasswordConfigured === false
  if (startupRoute === 'FIRST_TIME_SETUP' && !isSetupComplete) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <FirstTimeSetup
          branding={branding}
          config={sheetsConfig}
          onSetupComplete={handleFirstTimeSetupComplete}
          onExistingPasswordDetected={handleExistingPasswordDetected}
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
          webAppUrl={sheetsConfig.webAppUrl}
          onUnlock={handleUnlock}
          onSetInitialPassword={handleSetInitialPassword}
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
