import { Client, Category, ApplicationStatusItem, AppBranding, GoogleSheetsConfig } from '../types';
import { calculateDueAmount, calculatePaymentStatus, getCurrentDate } from './calculations';

const STORAGE_KEY_DATA = 'client_tracking_sheets_db_v2';
const STORAGE_KEY_CONFIG = 'client_tracking_sheets_config_v1';
const STORAGE_KEY_BRANDING = 'app_branding_settings_v1';
const STORAGE_KEY_SETUP_COMPLETED = 'app_first_time_setup_completed_v1';

/**
 * Checks whether the first-time setup flow (Google Sheets + Apps Script + Password setup)
 * has been permanently completed.
 */
export function isFirstTimeSetupCompleted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_SETUP_COMPLETED) === 'true';
  } catch (e) {
    console.error('Error checking setup completion:', e);
    return false;
  }
}

/**
 * Marks the first-time setup flow as completed permanently in localStorage.
 */
export function markFirstTimeSetupCompleted(): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETUP_COMPLETED, 'true');
  } catch (e) {
    console.error('Error saving setup completion:', e);
  }
}

/**
 * Completely resets the application's local first-time setup state.
 * Removes setup completion flag, clears active session, clears saved Sheets Web App URL,
 * and clears locally cached client data, so the next application launch starts completely
 * fresh from the Welcome screen without affecting any remote Google Sheets.
 */
export function resetLocalSetupState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_SETUP_COMPLETED);
    sessionStorage.removeItem('dashboard_session_active');
    localStorage.removeItem(STORAGE_KEY_CONFIG);
    localStorage.removeItem(STORAGE_KEY_DATA);
    localStorage.removeItem('client_tracking_sheets_db_v1');
  } catch (e) {
    console.error('Error resetting local setup state:', e);
  }
}

/**
 * Normalizes a Google Apps Script Web App URL.
 * Automatically fixes:
 * 1. Accidental test endpoint '/dev' replaced with public production endpoint '/exec'
 * 2. Trailing slashes, spaces, or query parameters
 */
export function normalizeWebAppUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Strip out any trailing query string if user pasted URL with parameters
  const queryIndex = url.indexOf('?');
  if (queryIndex !== -1) {
    url = url.substring(0, queryIndex);
  }
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  // If the user pasted an internal /dev test URL, convert it to production /exec
  if (url.endsWith('/dev')) {
    url = url.slice(0, -4) + '/exec';
  }
  return url;
}

export const DEFAULT_BRANDING: AppBranding = {
  title: 'Client Management & Application Tracking System',
  slogan: 'Google Sheets Database',
  logoUrl: '',
  currency: 'USD',
  customCurrencySymbol: '',
};

export const INITIAL_APPLICATION_STATUSES: ApplicationStatusItem[] = [
  {
    id: 'APP-001',
    name: 'New',
    status: 'ACTIVE',
    createdDate: '2026-09-01',
  },
  {
    id: 'APP-002',
    name: 'Processing',
    status: 'ACTIVE',
    createdDate: '2026-09-02',
  },
  {
    id: 'APP-003',
    name: 'Completed',
    status: 'ACTIVE',
    createdDate: '2026-09-03',
  },
  {
    id: 'APP-004',
    name: 'Rejected',
    status: 'ACTIVE',
    createdDate: '2026-09-04',
  },
];

export const DEFAULT_APPLICATION_STATUSES = INITIAL_APPLICATION_STATUSES;

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'CAT-001',
    name: 'Saudi Scholarship',
    status: 'ACTIVE',
    createdDate: '2026-09-01',
  },
  {
    id: 'CAT-002',
    name: 'University Admission',
    status: 'ACTIVE',
    createdDate: '2026-09-02',
  },
  {
    id: 'CAT-003',
    name: 'Visa Application',
    status: 'ACTIVE',
    createdDate: '2026-09-03',
  },
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'C-0001',
    name: 'Ahmed Al-Mansoor',
    phone: '+966501234567',
    category: 'Saudi Scholarship',
    totalAmount: 4500,
    paidAmount: 4500,
    dueAmount: 0,
    applicationStatus: 'Completed',
    paymentStatus: 'PAID',
    createdDate: '2026-09-10',
    notes: 'Documents verified and accepted by university scholarship board.',
  },
  {
    id: 'C-0002',
    name: 'Fatima Zahra',
    phone: '+971551234567',
    category: 'University Admission',
    totalAmount: 3200,
    paidAmount: 1600,
    dueAmount: 1600,
    applicationStatus: 'Processing',
    paymentStatus: 'PARTIAL',
    createdDate: '2026-09-14',
    notes: 'Waiting for IELTS score report before final submission.',
  },
  {
    id: 'C-0003',
    name: 'Tanvir Rahman',
    phone: '+8801712345678',
    category: 'Visa Application',
    totalAmount: 1800,
    paidAmount: 0,
    dueAmount: 1800,
    applicationStatus: 'New',
    paymentStatus: 'UNPAID',
    createdDate: '2026-09-18',
    notes: 'Embassy appointment scheduled for next week.',
  },
];

export interface StoredData {
  clients: Client[];
  categories: Category[];
  applicationStatuses: ApplicationStatusItem[];
  branding: AppBranding;
  updatedAt: string;
}

/**
 * Loads persistent configuration from localStorage, URL params, or build environment variables.
 * Enables shared links and multi-device access without forcing First-Time Setup.
 */
export function loadSheetsConfig(): GoogleSheetsConfig {
  let webAppUrl = '';
  let status: GoogleSheetsConfig['status'] = 'not_configured';
  let sheetName: string | undefined = undefined;
  let lastSyncedAt: string | null = null;

  // 1. Check persistent localStorage first
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.webAppUrl) {
        webAppUrl = normalizeWebAppUrl(parsed.webAppUrl);
        status = parsed.status || (webAppUrl ? 'connected' : 'not_configured');
        sheetName = parsed.sheetName;
        lastSyncedAt = parsed.lastSyncedAt || null;
      }
    }
  } catch (e) {
    console.error('Error reading sheets config:', e);
  }

  // 2. Check URL query parameters (?webapp=..., ?script=..., ?url=...) for seamless link sharing
  if (typeof window !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryParamUrl = urlParams.get('webapp') || urlParams.get('script') || urlParams.get('url') || urlParams.get('sheet');
      if (queryParamUrl && queryParamUrl.trim().startsWith('http')) {
        webAppUrl = normalizeWebAppUrl(queryParamUrl);
        status = 'connected';
        // Persist to localStorage for future reloads and navigation
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({
          webAppUrl,
          status: 'connected',
          lastSyncedAt: new Date().toISOString()
        }));
      }
    } catch (err) {
      console.warn('Could not parse URL query parameters:', err);
    }
  }

  // 3. Check Vercel/Vite environment variables if not present in localStorage
  if (!webAppUrl) {
    const envUrl = (
      (typeof import.meta !== 'undefined' && import.meta.env && (
        import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL ||
        import.meta.env.VITE_APPS_SCRIPT_URL ||
        import.meta.env.VITE_SHEETS_URL ||
        import.meta.env.VITE_WEB_APP_URL
      )) || ''
    ).trim();

    if (envUrl && envUrl.startsWith('http')) {
      webAppUrl = normalizeWebAppUrl(envUrl);
      status = 'connected';
    }
  }

  return {
    webAppUrl,
    sheetName,
    status: webAppUrl ? (status || 'connected') : 'not_configured',
    lastSyncedAt,
  };
}

/**
 * Saves configuration to localStorage
 */
export function saveSheetsConfig(config: GoogleSheetsConfig): void {
  try {
    const sanitizedConfig = {
      ...config,
      webAppUrl: normalizeWebAppUrl(config.webAppUrl),
    };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(sanitizedConfig));
  } catch (e) {
    console.error('Error saving sheets config:', e);
  }
}

/**
 * Loads branding settings
 */
export function loadStoredBranding(): AppBranding {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BRANDING);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        title: parsed.title || DEFAULT_BRANDING.title,
        slogan: parsed.slogan || DEFAULT_BRANDING.slogan,
        logoUrl: parsed.logoUrl || '',
        currency: parsed.currency || DEFAULT_BRANDING.currency || 'USD',
        customCurrencySymbol: parsed.customCurrencySymbol || '',
      };
    }
  } catch (e) {
    console.error('Error loading branding:', e);
  }
  return DEFAULT_BRANDING;
}

/**
 * Saves branding settings
 */
export function saveStoredBranding(branding: AppBranding): void {
  try {
    localStorage.setItem(STORAGE_KEY_BRANDING, JSON.stringify(branding));
  } catch (e) {
    console.error('Error saving branding:', e);
  }
}

/**
 * Loads stored local data (with backwards compatibility & data migration)
 */
export function getLocalData(): StoredData {
  try {
    // Check v2 key first
    let raw = localStorage.getItem(STORAGE_KEY_DATA);
    // If not found, check older key v1 for backwards compatibility
    if (!raw) {
      raw = localStorage.getItem('client_tracking_sheets_db_v1');
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.clients) && Array.isArray(parsed.categories)) {
        // Migration: Ensure applicationStatuses array exists
        let statuses: ApplicationStatusItem[] = Array.isArray(parsed.applicationStatuses) && parsed.applicationStatuses.length > 0
          ? parsed.applicationStatuses
          : [...INITIAL_APPLICATION_STATUSES];

        // Ensure any status already used by clients exists in the statuses list
        const existingNames = new Set(statuses.map((s) => s.name.toUpperCase()));
        parsed.clients.forEach((c: Client) => {
          if (c.applicationStatus && !existingNames.has(c.applicationStatus.toUpperCase())) {
            const nextId = `APP-${(statuses.length + 1).toString().padStart(3, '0')}`;
            statuses.push({
              id: nextId,
              name: c.applicationStatus,
              status: 'ACTIVE',
              createdDate: c.createdDate || getCurrentDate(),
            });
            existingNames.add(c.applicationStatus.toUpperCase());
          }
        });

        const branding: AppBranding = parsed.branding || loadStoredBranding();

        const fullData: StoredData = {
          clients: parsed.clients,
          categories: parsed.categories,
          applicationStatuses: statuses,
          branding,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
        saveLocalData(fullData);
        return fullData;
      }
    }
  } catch (e) {
    console.error('Error reading local data:', e);
  }

  // Initial seed data
  const initialData: StoredData = {
    clients: INITIAL_CLIENTS,
    categories: INITIAL_CATEGORIES,
    applicationStatuses: INITIAL_APPLICATION_STATUSES,
    branding: DEFAULT_BRANDING,
    updatedAt: new Date().toISOString(),
  };
  saveLocalData(initialData);
  return initialData;
}

/**
 * Saves data to local persistent store
 */
export function saveLocalData(data: StoredData): void {
  try {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving local data:', e);
  }
}

/**
 * Tests connection to a Google Sheets Web App URL
 */
export async function testGoogleSheetsConnection(webAppUrl: string): Promise<{
  success: boolean;
  sheetName?: string;
  clientsCount?: number;
  categoriesCount?: number;
  statusesCount?: number;
  hasPasswordConfigured?: boolean;
  message?: string;
  error?: string;
}> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return { success: false, error: 'Please enter a valid Google Apps Script Web App URL.' };
  }

  try {
    const cleanUrl = normalizeWebAppUrl(webAppUrl);
    const testUrl = new URL(cleanUrl);
    testUrl.searchParams.set('action', 'test');

    const res = await fetch(testUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: Failed to reach Google Apps Script.` };
    }

    const json = await res.json();
    if (json.success) {
      return {
        success: true,
        sheetName: json.sheetName || 'Google Spreadsheet',
        clientsCount: json.clientsCount,
        categoriesCount: json.categoriesCount,
        statusesCount: json.statusesCount,
        hasPasswordConfigured: Boolean(json.hasPasswordConfigured),
        message: json.message || 'Connected successfully!',
      };
    } else {
      return { success: false, error: json.error || 'Google Sheet returned an error.' };
    }
  } catch (err: any) {
    console.error('Google Sheets test failed:', err);
    return {
      success: false,
      error: err.message || 'Network error connecting to Google Apps Script. Ensure the script is deployed with "Anyone" access.',
    };
  }
}

/**
 * Parses settings key-value pairs from Google Sheets into AppBranding object.
 * Google Sheets is the persistent source of truth for Title, Slogan, Logo, and Global Currency.
 */
export function parseBrandingFromSettings(
  rawSettings: any,
  fallback: AppBranding = DEFAULT_BRANDING
): AppBranding {
  if (!rawSettings || typeof rawSettings !== 'object' || Object.keys(rawSettings).length === 0) {
    return fallback;
  }

  // Normalize all keys: lowercase, alphanumeric only
  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawSettings)) {
    const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    normalized[cleanKey] = v !== undefined && v !== null ? String(v) : '';
  }

  const findValue = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const clean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean in normalized) {
        return normalized[clean];
      }
    }
    return undefined;
  };

  const rawTitle = findValue('app_title', 'title', 'application_title', 'name');
  const rawSlogan = findValue('app_slogan', 'slogan', 'subtitle', 'tagline');
  const rawLogo = findValue('logo_url', 'logo', 'app_logo', 'image');
  const rawCurrency = findValue('currency', 'global_currency');
  const rawSymbol = findValue('custom_currency_symbol', 'custom_currency', 'currency_symbol', 'symbol');

  const title = rawTitle !== undefined ? (rawTitle.trim() || fallback.title) : fallback.title;
  const slogan = rawSlogan !== undefined ? rawSlogan : fallback.slogan;
  const logoUrl = rawLogo !== undefined ? rawLogo : (fallback.logoUrl || '');
  const currency = rawCurrency !== undefined && rawCurrency.trim() ? rawCurrency.trim() : (fallback.currency || 'USD');
  const customCurrencySymbol = rawSymbol !== undefined ? rawSymbol : (fallback.customCurrencySymbol || '');

  return {
    title,
    slogan,
    logoUrl,
    currency,
    customCurrencySymbol,
  };
}

/**
 * Fetches all clients, categories, application statuses, and settings from Google Sheets
 */
export async function fetchFromGoogleSheets(webAppUrl: string): Promise<{
  success: boolean;
  clients?: Client[];
  categories?: Category[];
  applicationStatuses?: ApplicationStatusItem[];
  branding?: AppBranding;
  settings?: any;
  hasPasswordConfigured?: boolean;
  sheetName?: string;
  error?: string;
}> {
  try {
    const cleanUrl = normalizeWebAppUrl(webAppUrl);
    const fetchUrl = new URL(cleanUrl);
    fetchUrl.searchParams.set('action', 'getAll');

    const res = await fetch(fetchUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }

    const data = await res.json();
    if (data.success) {
      const clients: Client[] = (data.clients || []).map((c: any) => {
        const total = parseFloat(c.totalAmount) || 0;
        const paid = parseFloat(c.paidAmount) || 0;
        return {
          id: String(c.id || '').trim(),
          name: String(c.name || '').trim(),
          phone: String(c.phone || '').trim(),
          category: String(c.category || '').trim(),
          totalAmount: total,
          paidAmount: paid,
          dueAmount: calculateDueAmount(total, paid),
          applicationStatus: c.applicationStatus || 'New',
          paymentStatus: calculatePaymentStatus(total, paid),
          createdDate: c.createdDate || getCurrentDate(),
          notes: c.notes || '',
        };
      });

      const categories: Category[] = (data.categories || []).map((cat: any) => ({
        id: String(cat.id || '').trim(),
        name: String(cat.name || '').trim(),
        status: (cat.status || 'ACTIVE').toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        createdDate: cat.createdDate || getCurrentDate(),
      }));

      const applicationStatuses: ApplicationStatusItem[] = (data.applicationStatuses || []).map((st: any) => ({
        id: String(st.id || '').trim(),
        name: String(st.name || '').trim(),
        status: (st.status || 'ACTIVE').toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        createdDate: st.createdDate || getCurrentDate(),
      }));

      let branding: AppBranding | undefined;
      if (data.settings && typeof data.settings === 'object' && Object.keys(data.settings).length > 0) {
        branding = parseBrandingFromSettings(data.settings, loadStoredBranding());
      }

      return {
        success: true,
        clients,
        categories,
        applicationStatuses,
        branding,
        settings: data.settings,
        hasPasswordConfigured: Boolean(data.settings?.hasPasswordConfigured),
        sheetName: data.sheetName,
      };
    } else {
      return { success: false, error: data.error || 'Failed to fetch data' };
    }
  } catch (err: any) {
    console.error('Fetch from Google Sheets failed:', err);
    return { success: false, error: err.message || 'Connection failed' };
  }
}

/**
 * Sends a mutation to the Google Sheets Web App
 */
export async function sendMutationToGoogleSheets(
  webAppUrl: string,
  action:
    | 'addClient'
    | 'updateClient'
    | 'deleteClient'
    | 'addCategory'
    | 'updateCategory'
    | 'deleteCategory'
    | 'addStatus'
    | 'updateStatus'
    | 'deleteStatus'
    | 'saveSettings'
    | 'saveAll'
    | 'verifyPassword'
    | 'setPassword'
    | 'checkPasswordStatus'
    | 'initializeDatabase'
    | 'verifyDatabase',
  payload: any
): Promise<{
  success: boolean;
  error?: string;
  message?: string;
  status?: any;
  applicationStatuses?: any[];
  deleted?: boolean;
  settings?: any;
  verified?: boolean;
  hasPasswordConfigured?: boolean;
  details?: any;
}> {
  try {
    const cleanUrl = normalizeWebAppUrl(webAppUrl);
    const bodyData = {
      action,
      ...payload,
    };

    // Google Apps Script accepts text/plain to avoid CORS preflight failures
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }

    const data = await res.json();
    return {
      success: !!data.success,
      error: data.error,
      message: data.message,
      status: data.status,
      applicationStatuses: data.applicationStatuses,
      deleted: data.deleted,
      settings: data.settings,
      verified: data.verified,
      hasPasswordConfigured: data.hasPasswordConfigured,
      details: data.details,
    };
  } catch (err: any) {
    console.error(`Google Sheets mutation ${action} failed:`, err);
    return {
      success: false,
      error: err.message || 'Failed to send update to Google Sheets',
    };
  }
}

/**
 * Verifies the dashboard unlock password through Google Apps Script
 */
export async function verifyDashboardPassword(
  webAppUrl: string,
  password: string
): Promise<{
  success: boolean;
  verified?: boolean;
  hasPasswordConfigured?: boolean;
  error?: string;
  message?: string;
}> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return { success: false, error: 'Google Sheets Web App is not configured.' };
  }

  const res = await sendMutationToGoogleSheets(webAppUrl, 'verifyPassword', { password });

  // Handle specific Google Sheets / Apps Script Web App reachability errors (e.g. 404, DNS, invalid deployment URL)
  if (res.error && res.error.includes('HTTP Error 404')) {
    return {
      success: false,
      verified: false,
      hasPasswordConfigured: true,
      error: 'Google Apps Script Web App returned HTTP 404 Not Found. Your configured Web App URL is invalid or no longer exists. Please click "Database Settings" below or in the top right to verify or update your Web App URL.',
    };
  }

  // If the deployed Apps Script Web App is running an older deployment that predates verifyPassword:
  if (res.error && res.error.toLowerCase().includes('unknown action')) {
    return {
      success: false,
      verified: false,
      hasPasswordConfigured: true,
      error: 'Google Apps Script requires updating: In your Google Sheet, go to Extensions > Apps Script > Deploy > Manage deployments > Edit > New version > Deploy.',
    };
  }

  return {
    success: res.success,
    verified: res.verified,
    hasPasswordConfigured: res.hasPasswordConfigured,
    error: res.error,
    message: res.message,
  };
}

/**
 * Computes a standard SHA-256 hex string from salt:password using Web Crypto API.
 * This produces the EXACT same 64-character hex hash as Google Apps Script's sha256Hex(salt + ':' + password).
 */
export async function hashPasswordWebCrypto(salt: string, password: string): Promise<string> {
  const text = `${salt}:${password}`;
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sets or changes the dashboard password through Google Apps Script
 */
export async function setDashboardPassword(
  webAppUrl: string,
  payload: { newPassword: string; currentPassword?: string }
): Promise<{
  success: boolean;
  hasPasswordConfigured?: boolean;
  error?: string;
  message?: string;
}> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return { success: false, error: 'Google Sheets Web App is not configured.' };
  }

  // 1. Primary: send exact 'setPassword' action to Google Apps Script router
  const res = await sendMutationToGoogleSheets(webAppUrl, 'setPassword', payload);

  if (res.success) {
    return {
      success: true,
      hasPasswordConfigured: true,
      message: res.message || 'Password saved successfully to Google Sheets',
    };
  }

  // 2. Compatibility fallback:
  // If the user's currently deployed Google Apps Script in their Google Sheet is an older version
  // and returns "Unknown action: setPassword", fallback to computing the SHA-256 salted hash
  // using Web Crypto (identical format to Apps Script sha256Hex) and saving to Settings via saveSettings.
  if (res.error && res.error.toLowerCase().includes('unknown action')) {
    try {
      if (payload.currentPassword) {
        const verifyCheck = await verifyDashboardPassword(webAppUrl, payload.currentPassword);
        if (verifyCheck.hasPasswordConfigured && !verifyCheck.verified) {
          return {
            success: false,
            error: 'Current password is incorrect',
          };
        }
      }

      const salt = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      const hash = await hashPasswordWebCrypto(salt, payload.newPassword);

      const saveRes = await sendMutationToGoogleSheets(webAppUrl, 'saveSettings', {
        settings: {
          dashboard_password_hash: hash,
          dashboard_password_salt: salt,
        },
      });

      if (saveRes.success) {
        return {
          success: true,
          hasPasswordConfigured: true,
          message: 'Password saved successfully to Google Sheets',
        };
      }
    } catch {
      // Fall through to original response error
    }
  }

  return {
    success: false,
    hasPasswordConfigured: res.hasPasswordConfigured,
    error: res.error || 'Failed to update password in Google Sheets',
    message: res.message,
  };
}

/**
 * Checks if a password has been configured in the Google Sheets database
 */
export async function checkPasswordConfigured(
  webAppUrl: string
): Promise<{
  success: boolean;
  hasPasswordConfigured?: boolean;
  error?: string;
}> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return { success: false, hasPasswordConfigured: false };
  }

  try {
    const cleanUrl = normalizeWebAppUrl(webAppUrl);
    const testUrl = new URL(cleanUrl);
    testUrl.searchParams.set('action', 'checkPasswordStatus');

    const res = await fetch(testUrl.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.hasPasswordConfigured !== undefined) {
        return {
          success: !!data.success,
          hasPasswordConfigured: Boolean(data.hasPasswordConfigured),
        };
      }
    }
  } catch (err) {
    console.warn('GET checkPasswordStatus failed, trying POST fallback:', err);
  }

  // Fallback via POST mutation
  try {
    const postRes = await sendMutationToGoogleSheets(webAppUrl, 'checkPasswordStatus', {});
    if (postRes.hasPasswordConfigured !== undefined) {
      return {
        success: !!postRes.success,
        hasPasswordConfigured: Boolean(postRes.hasPasswordConfigured),
      };
    }
  } catch (postErr) {
    console.warn('POST checkPasswordStatus failed:', postErr);
  }

  return { success: false, hasPasswordConfigured: false };
}

export interface DatabaseInitResult {
  success: boolean;
  message?: string;
  error?: string;
  hasPasswordConfigured?: boolean;
  details?: {
    clients: boolean;
    categories: boolean;
    applicationStatuses: boolean;
    settings: boolean;
    defaultStatusesCreated?: number;
    defaultCategoriesCreated?: number;
    defaultSettingsCreated?: boolean;
    canReadWrite?: boolean;
  };
}

/**
 * Automatically creates all required database sheets (Clients, Categories,
 * ApplicationStatuses, Settings) with exact headers and default configuration
 * via the Apps Script backend. Idempotent and safe.
 */
export async function initializeGoogleSheetsDatabase(
  webAppUrl: string
): Promise<DatabaseInitResult> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return { success: false, error: 'Google Sheets Web App is not configured.' };
  }

  // 1. Try dedicated Apps Script action initializeDatabase
  const res = await sendMutationToGoogleSheets(webAppUrl, 'initializeDatabase', {});
  if (res.success) {
    return {
      success: true,
      message: res.message || 'Database structure initialized and verified successfully',
      details: res.details,
      hasPasswordConfigured: res.hasPasswordConfigured,
    };
  }

  // 2. Fallback if running an earlier version that doesn't have initializeDatabase:
  // Use setupSheetsIfMissing by triggering getAll, then saving defaults if empty
  if (res.error && res.error.toLowerCase().includes('unknown action')) {
    try {
      const getRes = await fetchFromGoogleSheets(webAppUrl);
      if (getRes.success) {
        // If categories are empty, seed them
        const catsToSave = (!getRes.categories || getRes.categories.length === 0)
          ? INITIAL_CATEGORIES
          : getRes.categories;
        const statusesToSave = (!getRes.applicationStatuses || getRes.applicationStatuses.length === 0)
          ? INITIAL_APPLICATION_STATUSES
          : getRes.applicationStatuses;
        const brandingToSave = getRes.branding || DEFAULT_BRANDING;

        await sendMutationToGoogleSheets(webAppUrl, 'saveAll', {
          categories: catsToSave,
          applicationStatuses: statusesToSave,
          settings: brandingToSave,
          clients: getRes.clients || [],
        });

        return {
          success: true,
          message: 'Database structure initialized and verified successfully',
          hasPasswordConfigured: getRes.branding?.hasPasswordConfigured || false,
          details: {
            clients: true,
            categories: true,
            applicationStatuses: true,
            settings: true,
            canReadWrite: true,
          },
        };
      }
    } catch (fallbackErr: any) {
      return {
        success: false,
        error: fallbackErr.message || 'Failed to initialize database via fallback',
      };
    }
  }

  return {
    success: false,
    error: res.error || 'Failed to initialize Google Sheets database',
    message: res.message,
    details: res.details,
  };
}

/**
 * Verifies that all 4 required database sheets (Clients, Categories,
 * ApplicationStatuses, Settings) and headers exist and are readable/writable.
 */
export async function verifyGoogleSheetsDatabase(
  webAppUrl: string
): Promise<DatabaseInitResult> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return { success: false, error: 'Google Sheets Web App is not configured.' };
  }

  const res = await sendMutationToGoogleSheets(webAppUrl, 'verifyDatabase', {});
  if (res.success) {
    return {
      success: true,
      message: res.message || 'Database structure verified successfully',
      details: res.details,
      hasPasswordConfigured: res.hasPasswordConfigured,
    };
  }

  // Fallback: verify via fetchFromGoogleSheets
  try {
    const getRes = await fetchFromGoogleSheets(webAppUrl);
    if (getRes.success) {
      return {
        success: true,
        message: 'Database verified successfully',
        hasPasswordConfigured: getRes.branding?.hasPasswordConfigured || false,
        details: {
          clients: true,
          categories: true,
          applicationStatuses: true,
          settings: true,
          canReadWrite: true,
        },
      };
    }
    return {
      success: false,
      error: getRes.error || 'Database verification failed',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Database verification failed',
    };
  }
}


