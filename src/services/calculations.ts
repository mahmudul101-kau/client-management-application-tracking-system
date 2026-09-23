import { Client, Category, ApplicationStatusItem, DashboardStats, PaymentStatus } from '../types';

/**
 * Automatically calculates due amount.
 * Due Amount = Total Amount - Paid Amount
 * Never allows negative due amount.
 */
export function calculateDueAmount(totalAmount: number, paidAmount: number): number {
  const total = isNaN(totalAmount) ? 0 : Math.max(0, totalAmount);
  const paid = isNaN(paidAmount) ? 0 : Math.max(0, paidAmount);
  return Math.max(0, total - paid);
}

/**
 * Automatically determines payment status:
 * - PAID = Paid Amount is equal to or greater than Total Amount
 * - PARTIAL = Paid Amount is greater than 0 but less than Total Amount
 * - UNPAID = Paid Amount is 0
 */
export function calculatePaymentStatus(totalAmount: number, paidAmount: number): PaymentStatus {
  const total = isNaN(totalAmount) ? 0 : Math.max(0, totalAmount);
  const paid = isNaN(paidAmount) ? 0 : Math.max(0, paidAmount);

  if (total === 0 && paid === 0) {
    return 'PAID';
  }
  if (paid >= total && total > 0) {
    return 'PAID';
  }
  if (paid > 0 && paid < total) {
    return 'PARTIAL';
  }
  return 'UNPAID';
}

/**
 * Generates unique next Client ID (e.g. C-0001, C-0002)
 * Ensures Client ID never duplicates.
 */
export function generateNextClientId(existingClients: Client[]): string {
  let maxId = 0;
  for (const client of existingClients) {
    const match = client.id.match(/^C-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxId) {
        maxId = num;
      }
    }
  }
  const nextNum = maxId + 1;
  return `C-${nextNum.toString().padStart(4, '0')}`;
}

/**
 * Generates unique next Category ID (e.g. CAT-001, CAT-002)
 */
export function generateNextCategoryId(existingCategories: Category[]): string {
  let maxId = 0;
  for (const cat of existingCategories) {
    const match = cat.id.match(/^CAT-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxId) {
        maxId = num;
      }
    }
  }
  const nextNum = maxId + 1;
  return `CAT-${nextNum.toString().padStart(3, '0')}`;
}

/**
 * Generates unique next Application Status ID (e.g. APP-001, APP-002)
 */
export function generateNextStatusId(existingStatuses: ApplicationStatusItem[]): string {
  let maxId = 0;
  for (const s of existingStatuses) {
    const match = s.id.match(/^APP-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxId) {
        maxId = num;
      }
    }
  }
  const nextNum = maxId + 1;
  return `APP-${nextNum.toString().padStart(3, '0')}`;
}

/**
 * Calculates all dashboard metrics from the current clients list.
 * Total Expected Amount = Total Amount of all clients
 * Total Income = Total Paid Amount of all clients
 * Total Due = Total Amount - Total Paid Amount
 * Status counts are computed dynamically from actual client records.
 */
export function calculateDashboardStats(clients: Client[]): DashboardStats {
  let totalExpectedAmount = 0;
  let totalIncome = 0;
  let completedApplications = 0;
  let notCompletedApplications = 0;
  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;
  const statusCounts: Record<string, number> = {};

  for (const client of clients) {
    const total = isNaN(client.totalAmount) ? 0 : Math.max(0, client.totalAmount);
    const paid = isNaN(client.paidAmount) ? 0 : Math.max(0, client.paidAmount);

    totalExpectedAmount += total;
    totalIncome += paid;

    const st = client.applicationStatus || 'Unassigned';
    statusCounts[st] = (statusCounts[st] || 0) + 1;

    const upperStatus = st.toUpperCase();
    if (upperStatus === 'COMPLETED') {
      completedApplications++;
    } else {
      notCompletedApplications++;
    }

    const pStatus = calculatePaymentStatus(total, paid);
    if (pStatus === 'PAID') {
      paidCount++;
    } else if (pStatus === 'PARTIAL') {
      partialCount++;
    } else {
      unpaidCount++;
    }
  }

  const totalDueAmount = Math.max(0, totalExpectedAmount - totalIncome);

  return {
    totalClients: clients.length,
    totalExpectedAmount,
    totalIncome,
    totalDueAmount,
    totalApplications: clients.length,
    completedApplications,
    notCompletedApplications,
    paidCount,
    partialCount,
    unpaidCount,
    statusCounts,
  };
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  label: string;
  spaceBetween?: boolean;
}

export const PRESET_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar', spaceBetween: false },
  { code: 'BDT', symbol: '৳', label: 'BDT (৳) - Bangladeshi Taka', spaceBetween: true },
  { code: 'SAR', symbol: '﷼', label: 'SAR (﷼) - Saudi Riyal', spaceBetween: true },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro', spaceBetween: false },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound', spaceBetween: false },
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee', spaceBetween: false },
  { code: 'AED', symbol: 'د.إ', label: 'AED (د.إ) - UAE Dirham', spaceBetween: true },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$) - Canadian Dollar', spaceBetween: false },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$) - Australian Dollar', spaceBetween: false },
  { code: 'MYR', symbol: 'RM', label: 'MYR (RM) - Malaysian Ringgit', spaceBetween: true },
  { code: 'QAR', symbol: 'QR', label: 'QAR (QR) - Qatari Riyal', spaceBetween: true },
  { code: 'KWD', symbol: 'KD', label: 'KWD (KD) - Kuwaiti Dinar', spaceBetween: true },
  { code: 'CUSTOM', symbol: '', label: 'Other / Custom Currency...', spaceBetween: true },
];

// Initialize global active currency from localStorage if available
let initialCurrency = 'USD';
let initialCustomSymbol = '';
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = localStorage.getItem('client_tracking_branding_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.currency) initialCurrency = String(parsed.currency).toUpperCase();
      if (parsed.customCurrencySymbol) initialCustomSymbol = String(parsed.customCurrencySymbol).trim();
    }
  }
} catch (e) {
  // Ignore localStorage read errors
}

let globalActiveCurrencyCode = initialCurrency;
let globalActiveCustomSymbol = initialCustomSymbol;

export function setActiveCurrency(currencyCode?: string, customSymbol?: string) {
  if (currencyCode) {
    globalActiveCurrencyCode = currencyCode.toUpperCase();
  }
  if (customSymbol !== undefined) {
    globalActiveCustomSymbol = customSymbol.trim();
  }
}

export function getActiveCurrency(): { code: string; symbol: string } {
  const code = globalActiveCurrencyCode;
  const symbol = getCurrencySymbol(code, globalActiveCustomSymbol);
  return { code, symbol };
}

export function getCurrencySymbol(currencyCode?: string, customSymbol?: string): string {
  const code = (currencyCode || globalActiveCurrencyCode).toUpperCase();
  if (code === 'CUSTOM') {
    return (customSymbol !== undefined ? customSymbol : globalActiveCustomSymbol) || '¤';
  }
  const preset = PRESET_CURRENCIES.find((c) => c.code === code);
  return preset ? preset.symbol : code;
}

/**
 * Format currency amount with commas, decimals, and the selected global currency symbol.
 */
export function formatCurrency(
  amount: number,
  currencyCode?: string,
  customSymbol?: string
): string {
  const valid = isNaN(amount) ? 0 : amount;
  const targetCode = (currencyCode || globalActiveCurrencyCode).toUpperCase();

  const formattedNumber = valid.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (targetCode === 'CUSTOM') {
    const sym = (customSymbol !== undefined ? customSymbol : globalActiveCustomSymbol) || '';
    return sym ? `${sym} ${formattedNumber}` : formattedNumber;
  }

  const preset = PRESET_CURRENCIES.find((c) => c.code === targetCode);
  const symbol = preset ? preset.symbol : targetCode;
  const space = preset?.spaceBetween ?? true;

  const isDirectPrefix = symbol === '$' || symbol === '€' || symbol === '£' || symbol === '₹';
  if (isDirectPrefix && !space) {
    return `${symbol}${formattedNumber}`;
  }

  return `${symbol}${space ? ' ' : ''}${formattedNumber}`;
}

/**
 * Format date cleanly as "22 Sep 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') return '—';
  try {
    const clean = dateStr.trim();
    // Handle YYYY-MM-DD
    const parts = clean.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(monthIdx) && !isNaN(day)) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${String(day).padStart(2, '0')} ${months[monthIdx] || parts[1]} ${year}`;
      }
    }
    const d = new Date(clean.includes('T') ? clean : `${clean}T00:00:00`);
    if (!isNaN(d.getTime())) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Get current date string formatted as YYYY-MM-DD
 */
export function getCurrentDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

