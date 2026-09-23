export type ApplicationStatus = 'COMPLETED' | 'NOT COMPLETED' | string;
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';
export type CategoryStatus = 'ACTIVE' | 'INACTIVE';
export type ApplicationStatusState = 'ACTIVE' | 'INACTIVE';

export interface Client {
  id: string; // e.g. C-0001
  name: string;
  phone: string;
  category: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number; // auto-calculated: totalAmount - paidAmount
  applicationStatus: ApplicationStatus;
  paymentStatus: PaymentStatus; // auto-calculated: PAID, PARTIAL, UNPAID
  createdDate: string; // e.g. 2026-09-22
  notes?: string;
}

export interface Category {
  id: string; // e.g. CAT-001
  name: string;
  status: CategoryStatus;
  createdDate: string;
}

export interface ApplicationStatusItem {
  id: string; // e.g. APP-001
  name: string;
  status: ApplicationStatusState;
  createdDate: string;
}

export interface AppBranding {
  title: string;
  slogan: string;
  logoUrl?: string;
  currency?: string;
  customCurrencySymbol?: string;
  hasPasswordConfigured?: boolean;
}

export interface DashboardStats {
  totalClients: number;
  totalExpectedAmount: number;
  totalIncome: number;
  totalDueAmount: number;
  totalApplications: number;
  completedApplications: number;
  notCompletedApplications: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  statusCounts: Record<string, number>;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  sheetId?: string;
  sheetName?: string;
  lastSyncedAt?: string | null;
  status: 'connected' | 'syncing' | 'idle' | 'error' | 'not_configured';
  errorMessage?: string;
}

export type ActiveTab = 'dashboard' | 'clients' | 'categories' | 'statuses';
export type ThemeMode = 'light' | 'dark';
export type Language = 'en' | 'bn';

