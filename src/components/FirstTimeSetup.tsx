import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Lock, 
  ArrowRight, 
  Check, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Loader2, 
  Sun, 
  Moon, 
  ShieldCheck,
  ChevronRight,
  Database,
  KeyRound,
  Sparkles,
  Layers,
  RotateCw
} from 'lucide-react';
import { AppBranding, GoogleSheetsConfig, Language, ThemeMode } from '../types';
import { translations } from '../services/translations';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../services/appsScriptCode';
import { 
  testGoogleSheetsConnection, 
  setDashboardPassword,
  initializeGoogleSheetsDatabase,
  verifyGoogleSheetsDatabase,
  checkPasswordConfigured,
  DatabaseInitResult
} from '../services/googleSheetsService';

interface FirstTimeSetupProps {
  branding: AppBranding;
  config: GoogleSheetsConfig;
  onSetupComplete: (webAppUrl: string) => void;
  onExistingPasswordDetected?: (webAppUrl: string) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

type SetupStep = 'welcome' | 'sheets' | 'init' | 'password';

export const FirstTimeSetup: React.FC<FirstTimeSetupProps> = ({
  branding,
  config,
  onSetupComplete,
  onExistingPasswordDetected,
  lang,
  onLanguageChange,
  theme,
  onToggleTheme,
}) => {
  const t = translations[lang];
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');

  // Step 2: Google Sheets connection state
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl || '');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectedSheetName, setConnectedSheetName] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptPreview, setShowScriptPreview] = useState(false);

  // Step 3: Database initialization state
  const [initStage, setInitStage] = useState<'idle' | 'initializing' | 'verifying' | 'success' | 'error'>('idle');
  const [initError, setInitError] = useState<string | null>(null);
  const [initDetails, setInitDetails] = useState<DatabaseInitResult['details'] | null>(null);

  // Step 4: Password setup state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Copy Script Template
  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // Step 2: Test Sheets Connection
  const handleTestConnection = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = webAppUrl.trim();
    if (!cleanUrl.startsWith('http')) {
      setConnectionStatus('error');
      setConnectionError(lang === 'bn' ? 'অনুগ্রহ করে একটি বৈধ গুগল অ্যাপস স্ক্রিপ্ট ওয়েব অ্যাপ ইউআরএল দিন।' : 'Please enter a valid Google Apps Script Web App URL.');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('testing');
    setConnectionError(null);

    try {
      const res = await testGoogleSheetsConnection(cleanUrl);
      if (res.success) {
        setConnectionStatus('success');
        setConnectedSheetName(res.sheetName || 'Google Spreadsheet');

        // If backend already has a dashboard password configured, DO NOT bypass authentication!
        // Direct user to Lock Page to enter their existing password.
        if (res.hasPasswordConfigured) {
          if (onExistingPasswordDetected) {
            onExistingPasswordDetected(cleanUrl);
          } else {
            onSetupComplete(cleanUrl);
          }
          return;
        }

        const passChk = await checkPasswordConfigured(cleanUrl);
        if (passChk.success && passChk.hasPasswordConfigured) {
          if (onExistingPasswordDetected) {
            onExistingPasswordDetected(cleanUrl);
          } else {
            onSetupComplete(cleanUrl);
          }
          return;
        }
      } else {
        setConnectionStatus('error');
        setConnectionError(res.error || t.connectionFailed);
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionError(err.message || t.connectionFailed);
    } finally {
      setTestingConnection(false);
    }
  };

  // Step 3: Run Database Initialization and Verification
  const handleRunDatabaseInit = async () => {
    const cleanUrl = webAppUrl.trim();
    if (!cleanUrl.startsWith('http')) return;

    setInitStage('initializing');
    setInitError(null);

    try {
      // 1. Initialize sheets, headers & defaults
      const initRes = await initializeGoogleSheetsDatabase(cleanUrl);
      if (!initRes.success) {
        setInitStage('error');
        setInitError(initRes.error || 'Database initialization failed. Please retry.');
        return;
      }

      // If backend already has a password configured, do not bypass authentication!
      if (initRes.hasPasswordConfigured) {
        if (onExistingPasswordDetected) {
          onExistingPasswordDetected(cleanUrl);
        } else {
          onSetupComplete(cleanUrl);
        }
        return;
      }

      setInitDetails(initRes.details);
      setInitStage('verifying');

      // 2. Verify complete database structure
      const verifyRes = await verifyGoogleSheetsDatabase(cleanUrl);
      if (!verifyRes.success) {
        setInitStage('error');
        setInitError(verifyRes.error || 'Database verification failed. Please check spreadsheet access permissions.');
        return;
      }

      if (verifyRes.hasPasswordConfigured) {
        if (onExistingPasswordDetected) {
          onExistingPasswordDetected(cleanUrl);
        } else {
          onSetupComplete(cleanUrl);
        }
        return;
      }

      if (verifyRes.details) {
        setInitDetails(verifyRes.details);
      }
      setInitStage('success');

      // Auto-advance to password setup after a brief confirmation moment
      setTimeout(() => {
        setCurrentStep('password');
      }, 1400);

    } catch (err: any) {
      setInitStage('error');
      setInitError(err.message || 'Database initialization failed. Please retry.');
    }
  };

  // Step 4: Submit Password and Complete Setup
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 4) {
      setPasswordError(t.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t.passwordsDoNotMatch);
      return;
    }

    setSavingPassword(true);

    try {
      const res = await setDashboardPassword(webAppUrl.trim(), { newPassword });
      if (res.success) {
        // Immediately persist setup completion in localStorage right at the point of success
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('app_first_time_setup_completed_v1', 'true');
          } catch (e) {
            console.error('Error persisting setup completion:', e);
          }
        }
        setPasswordSuccess(true);
        setTimeout(() => {
          onSetupComplete(webAppUrl.trim());
        }, 800);
      } else if (res.error && res.error.toLowerCase().includes('current password is required')) {
        // The connected database ALREADY has an established password configured!
        // Direct user to Lock Page so they must unlock with their existing password.
        if (onExistingPasswordDetected) {
          onExistingPasswordDetected(webAppUrl.trim());
        } else {
          onSetupComplete(webAppUrl.trim());
        }
      } else {
        setPasswordError(res.error || 'Failed to configure password.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Error communicating with Google Sheets');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-emerald-500 selection:text-white">
      {/* Background glowing ambient effects */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl rounded-full dark:from-emerald-500/10 dark:via-teal-500/5 animate-pulse" />
        <div className="absolute -bottom-40 right-1/4 w-[450px] h-[350px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl rounded-full" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              {lang === 'bn' ? 'প্রাথমিক ইনস্টলেশন' : 'First-Time Setup'}
            </span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              {branding.title || 'Client Management & Application Tracking'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Language Switcher */}
          <div className="flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-0.5 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('bn')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                lang === 'bn'
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              বাংলা
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10 max-w-2xl w-full mx-auto">
        {/* Step Indicator (when past welcome screen) */}
        {currentStep !== 'welcome' && (
          <div className="w-full flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
              {/* Step 1: Sheets */}
              <div className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-full ${
                currentStep === 'sheets'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800'
                  : 'bg-emerald-600 text-white font-medium'
              }`}>
                {currentStep !== 'sheets' ? <Check className="w-3.5 h-3.5" /> : <span>1</span>}
                <span className="hidden sm:inline">{t.stepGoogleSheets}</span>
                <span className="sm:hidden">Sheets</span>
              </div>
              
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />

              {/* Step 2: Initialize Database */}
              <div className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-full ${
                currentStep === 'init'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800'
                  : currentStep === 'password'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium'
              }`}>
                {currentStep === 'password' ? <Check className="w-3.5 h-3.5" /> : <span>2</span>}
                <span className="hidden sm:inline">{t.stepInitDatabase}</span>
                <span className="sm:hidden">Database</span>
              </div>

              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />

              {/* Step 3: Password */}
              <div className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-full ${
                currentStep === 'password'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium'
              }`}>
                <span>3</span>
                <span className="hidden sm:inline">{t.stepPasswordSetup}</span>
                <span className="sm:hidden">Password</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: WELCOME SCREEN */}
        {currentStep === 'welcome' && (
          <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl p-6 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Logo */}
            <div className="flex justify-center mb-5">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.title}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-2xl object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-2"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
                  <Database className="w-10 h-10" />
                </div>
              )}
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3 border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-3.5 h-3.5" />
              {t.setupRequiredTitle}
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.welcomeToApp} {branding.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
              {branding.slogan}
            </p>

            <p className="mt-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
              {t.setupRequiredDesc}
            </p>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => setCurrentStep('sheets')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <span>{t.startSetup}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GOOGLE SHEETS / APPS SCRIPT SETUP */}
        {currentStep === 'sheets' && (
          <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.connectGoogleSheetsTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.connectGoogleSheetsDesc}
                </p>
              </div>
            </div>

            {/* Status alerts */}
            {connectionStatus === 'success' && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold">{t.connectionSuccessful} ({connectedSheetName})</span>
              </div>
            )}

            {connectionStatus === 'error' && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-medium flex-1">{connectionError || t.connectionFailed}</span>
              </div>
            )}

            {/* Step Instructions Card */}
            <div className="mb-5 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/60 dark:bg-slate-950/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {lang === 'bn' ? 'গুগল শিট সংযোগের ৩টি সহজ ধাপ' : '3 Easy Steps to Connect'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{lang === 'bn' ? 'স্ক্রিপ্ট কপি করুন' : 'Copy Script Code'}</span>
                    </>
                  )}
                </button>
              </div>

              <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  {lang === 'bn' ? 'একটি নতুন গুগল শিট খুলুন: ' : 'Open a blank Google Spreadsheet at '}
                  <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold underline inline-flex items-center gap-0.5">
                    <span>sheets.new</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  {lang === 'bn' ? 'মেনু থেকে ' : 'Click '}
                  <strong className="text-slate-800 dark:text-slate-200">Extensions &gt; Apps Script</strong>
                  {lang === 'bn' ? ' খুলুন, কোডটি পেস্ট করুন এবং সেভ করুন।' : ', paste the copied code, and save.'}
                </li>
                <li>
                  {lang === 'bn' ? 'ক্লিক করুন ' : 'Click '}
                  <strong className="text-slate-800 dark:text-slate-200">Deploy &gt; New deployment &gt; Web app</strong>
                  {lang === 'bn' ? ', Who has access নির্বাচন করুন: ' : ', set Who has access: '}
                  <strong className="text-emerald-600 dark:text-emerald-400">"Anyone"</strong>
                  {lang === 'bn' ? ', তারপর ডেপ্লয় করে Web app URL কপি করুন।' : ', Deploy, and copy the Web app URL.'}
                </li>
              </ol>

              {/* Script preview collapsible */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowScriptPreview(!showScriptPreview)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                >
                  {showScriptPreview ? 'Hide script preview' : 'View full Apps Script code'}
                </button>
                {showScriptPreview && (
                  <pre className="mt-2 p-3 bg-slate-900 text-slate-100 text-[11px] font-mono rounded-xl max-h-48 overflow-y-auto overflow-x-auto">
                    {GOOGLE_APPS_SCRIPT_TEMPLATE}
                  </pre>
                )}
              </div>
            </div>

            {/* URL Input Form */}
            <form onSubmit={handleTestConnection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Google Apps Script Web App URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={webAppUrl}
                    onChange={(e) => {
                      setWebAppUrl(e.target.value);
                      if (connectionStatus !== 'idle') {
                        setConnectionStatus('idle');
                        setConnectionError(null);
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-slate-100 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={testingConnection || !webAppUrl.trim()}
                    className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl shrink-0 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {testingConnection && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{testingConnection ? t.testingConnection : t.testConnection}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep('welcome')}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {lang === 'bn' ? 'পিছনে' : 'Back'}
                </button>

                <button
                  type="button"
                  disabled={connectionStatus !== 'success'}
                  onClick={() => setCurrentStep('init')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <span>{t.continueToInit}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: AUTOMATIC DATABASE INITIALIZATION & VERIFICATION */}
        {currentStep === 'init' && (
          <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.initDatabaseTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {connectedSheetName ? `${t.connected}: ${connectedSheetName}` : t.connectGoogleSheetsDesc}
                </p>
              </div>
            </div>

            {/* Explanation Banner */}
            <div className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800/70 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p className="font-medium">
                {t.initDatabaseDesc}
              </p>
            </div>

            {/* Status & Checklist Box */}
            <div className="mb-6 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                {lang === 'bn' ? 'ডাটাবেজ কাঠামো স্ট্যাটাস' : 'Database Structure Status'}
              </span>

              <div className="space-y-2.5 text-xs">
                {/* 1. Clients Sheet */}
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center space-x-2">
                    <Database className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Clients</span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">(11 Headers)</span>
                  </div>
                  <div>
                    {initDetails?.clients ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>Ready</span>
                      </span>
                    ) : initStage === 'initializing' || initStage === 'verifying' ? (
                      <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                    ) : (
                      <span className="text-slate-400 text-xs">Pending</span>
                    )}
                  </div>
                </div>

                {/* 2. Categories Sheet */}
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center space-x-2">
                    <Database className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Categories</span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">(4 Headers)</span>
                  </div>
                  <div>
                    {initDetails?.categories ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>Ready</span>
                      </span>
                    ) : initStage === 'initializing' || initStage === 'verifying' ? (
                      <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                    ) : (
                      <span className="text-slate-400 text-xs">Pending</span>
                    )}
                  </div>
                </div>

                {/* 3. ApplicationStatuses Sheet */}
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center space-x-2">
                    <Database className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">ApplicationStatuses</span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">(4 Headers)</span>
                  </div>
                  <div>
                    {initDetails?.applicationStatuses ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>Ready</span>
                      </span>
                    ) : initStage === 'initializing' || initStage === 'verifying' ? (
                      <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                    ) : (
                      <span className="text-slate-400 text-xs">Pending</span>
                    )}
                  </div>
                </div>

                {/* 4. Settings Sheet */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <Database className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Settings</span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">(Branding, Currency, Auth)</span>
                  </div>
                  <div>
                    {initDetails?.settings ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>Ready</span>
                      </span>
                    ) : initStage === 'initializing' || initStage === 'verifying' ? (
                      <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                    ) : (
                      <span className="text-slate-400 text-xs">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {initStage === 'error' && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">
                  <p className="font-semibold">{initError || 'Database initialization failed.'}</p>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    {lang === 'bn' 
                      ? 'দয়া করে যাচাই করুন যে গুগল অ্যাপস স্ক্রিপ্ট ডেপ্লয়মেন্টে "Who has access: Anyone" নির্বাচন করা আছে।'
                      : 'Please verify that your Google Apps Script deployment has "Who has access: Anyone".'}
                  </p>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {initStage === 'success' && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold">{t.initSuccessTitle} {t.initSuccessDesc}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                disabled={initStage === 'initializing' || initStage === 'verifying'}
                onClick={() => setCurrentStep('sheets')}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
              >
                {lang === 'bn' ? 'পিছনে' : 'Back'}
              </button>

              {initStage === 'idle' && (
                <button
                  type="button"
                  onClick={handleRunDatabaseInit}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>{t.initializeDatabaseButton}</span>
                </button>
              )}

              {(initStage === 'initializing' || initStage === 'verifying') && (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all opacity-80 cursor-wait"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{initStage === 'initializing' ? t.initializingDatabase : t.verifyingStructure}</span>
                </button>
              )}

              {initStage === 'error' && (
                <button
                  type="button"
                  onClick={handleRunDatabaseInit}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>{t.retryInit}</span>
                </button>
              )}

              {initStage === 'success' && (
                <button
                  type="button"
                  onClick={() => setCurrentStep('password')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <span>{t.continueToPassword}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: PASSWORD SETUP */}
        {currentStep === 'password' && (
          <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.createDashboardPasswordTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.createDashboardPasswordDesc}
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {passwordError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium">{passwordError}</span>
              </div>
            )}

            {/* Success Banner */}
            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold">{t.setupCompletedNotice}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.newPassword}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder={lang === 'bn' ? 'কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড লিখুন...' : 'Enter password (min 4 characters)...'}
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.confirmPassword}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder={lang === 'bn' ? 'পাসওয়ার্ড পুনরায় লিখুন...' : 'Re-enter your password...'}
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep('init')}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {lang === 'bn' ? 'পিছনে' : 'Back'}
                </button>

                <button
                  type="submit"
                  disabled={savingPassword || passwordSuccess || newPassword.length < 4}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.creatingPassword}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{t.finishSetupAndEnter}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-xs text-slate-400 dark:text-slate-600">
        &copy; {new Date().getFullYear()} {branding.title}
      </footer>
    </div>
  );
};
