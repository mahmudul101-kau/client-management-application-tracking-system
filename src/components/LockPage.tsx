import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  LockOpen, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Sun, 
  Moon, 
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';
import { AppBranding, Language, ThemeMode } from '../types';
import { translations } from '../services/translations';
import { 
  checkDeviceLockStatus, 
  getLocalDeviceLock, 
  clearLocalDeviceLock 
} from '../services/googleSheetsService';

interface LockPageProps {
  branding: AppBranding;
  hasPasswordConfigured: boolean;
  webAppUrl?: string;
  onUnlock: (password: string) => Promise<{
    success: boolean;
    error?: string;
    locked?: boolean;
    remainingSeconds?: number;
    remainingAttempts?: number;
  }>;
  onSetInitialPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const LockPage: React.FC<LockPageProps> = ({
  branding,
  hasPasswordConfigured,
  webAppUrl = '',
  onUnlock,
  onSetInitialPassword,
  lang,
  onLanguageChange,
  theme,
  onToggleTheme,
}) => {
  const t = translations[lang];
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Device-specific lockout state (5 failed attempts -> 1-hour block)
  const [isDeviceLocked, setIsDeviceLocked] = useState(false);
  const [remainingLockSeconds, setRemainingLockSeconds] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Setup mode states (if no password is set yet)
  const [isSetupMode, setIsSetupMode] = useState(!hasPasswordConfigured);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [setupSuccessMessage, setSetupSuccessMessage] = useState<string | null>(null);

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const newPasswordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsSetupMode(!hasPasswordConfigured);
  }, [hasPasswordConfigured]);

  // Initial and remote check for device lockout
  useEffect(() => {
    let isMounted = true;

    // 1. Immediate local cache check
    const local = getLocalDeviceLock();
    if (local.isLocked && local.remainingSeconds > 0) {
      setIsDeviceLocked(true);
      setRemainingLockSeconds(local.remainingSeconds);
      setRemainingAttempts(0);
    } else if (local.remainingAttempts < 5) {
      setRemainingAttempts(local.remainingAttempts);
    }

    // 2. Query remote Google Apps Script backend for persistent lockout state
    if (webAppUrl && webAppUrl.trim().startsWith('http')) {
      checkDeviceLockStatus(webAppUrl).then((status) => {
        if (!isMounted) return;
        if (status.locked && status.remainingSeconds > 0) {
          setIsDeviceLocked(true);
          setRemainingLockSeconds(status.remainingSeconds);
          setRemainingAttempts(0);
        } else {
          setIsDeviceLocked(false);
          setRemainingLockSeconds(0);
          if (status.remainingAttempts !== undefined) {
            setRemainingAttempts(status.remainingAttempts);
          }
        }
      }).catch((e) => {
        console.warn('Error checking device lock status from backend:', e);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [webAppUrl]);

  // Countdown timer for lockout duration
  useEffect(() => {
    if (!isDeviceLocked || remainingLockSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingLockSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsDeviceLocked(false);
          setRemainingAttempts(5);
          setErrorMessage(null);
          clearLocalDeviceLock();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDeviceLocked, remainingLockSeconds]);

  // Format seconds into MM:SS (e.g. 59:59)
  const formatCountdown = (totalSeconds: number): string => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isSetupMode) {
      newPasswordInputRef.current?.focus();
    } else if (!isDeviceLocked) {
      passwordInputRef.current?.focus();
    }
  }, [isSetupMode, isDeviceLocked]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 450);
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeviceLocked) return;

    if (!password.trim()) {
      setErrorMessage(lang === 'bn' ? 'অনুগ্রহ করে পাসওয়ার্ড দিন।' : 'Please enter your password.');
      triggerShake();
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await onUnlock(password);
      if (!res.success) {
        if (res.locked) {
          setIsDeviceLocked(true);
          setRemainingLockSeconds(res.remainingSeconds || 3600);
          setRemainingAttempts(0);
        } else {
          if (res.remainingAttempts !== undefined) {
            setRemainingAttempts(res.remainingAttempts);
          }
        }
        setErrorMessage(res.error || t.incorrectPassword);
        triggerShake();
        setPassword('');
        passwordInputRef.current?.focus();
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || t.incorrectPassword);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 4) {
      setErrorMessage(t.passwordTooShort);
      triggerShake();
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t.passwordsDoNotMatch);
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      const res = await onSetInitialPassword(newPassword);
      if (res.success) {
        setSetupSuccessMessage(t.passwordSetSuccess);
        setIsSuccess(true);
      } else {
        setErrorMessage(res.error || (lang === 'bn' ? 'পাসওয়ার্ড সেট করতে ব্যর্থ হয়েছে।' : 'Failed to set initial password.'));
        triggerShake();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error configuring password.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      
      {/* Ambient background glows - subtle, modern enterprise polish */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl rounded-full dark:from-emerald-500/10 dark:via-teal-500/5 animate-lock-glow" />
        <div className="absolute -bottom-40 right-1/4 w-[450px] h-[350px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl rounded-full animate-lock-glow" />
      </div>

      {/* Top Navigation & Control Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between">
        {/* Status Indicator */}
        <div className="flex items-center space-x-2 text-xs font-medium">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold">{t.dashboardLocked}</span>
          </div>
        </div>

        {/* Controls: Language & Theme */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Language Switcher Pill */}
          <div className="flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <button
              id="lock-lang-en"
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
              id="lock-lang-bn"
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

          {/* Theme Toggle Button */}
          <button
            id="lock-theme-toggle"
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </header>

      {/* Main Lock Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        
        {/* 1. BRANDING AREA (Centered at Top) */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8 animate-lock-logo">
          {branding.logoUrl ? (
            branding.logoUrl.startsWith('data:') ||
            branding.logoUrl.startsWith('http://') ||
            branding.logoUrl.startsWith('https://') ||
            branding.logoUrl.startsWith('/') ||
            branding.logoUrl.startsWith('blob:') ? (
              <div className="relative group mb-3.5">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-sm group-hover:blur-md transition-all" />
                <img
                  id="lock-app-logo-img"
                  src={branding.logoUrl}
                  alt={branding.title || 'Application Logo'}
                  referrerPolicy="no-referrer"
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md p-2 animate-lock-float"
                />
              </div>
            ) : (
              <div
                id="lock-app-logo-text"
                className="h-14 sm:h-16 px-5 rounded-2xl bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm sm:text-base tracking-wide shadow-md border border-slate-200/90 dark:border-slate-800 mb-3.5 animate-lock-float"
              >
                {branding.logoUrl}
              </div>
            )
          ) : (
            <div 
              id="lock-app-logo-default" 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-emerald-400 flex items-center justify-center shadow-lg border border-slate-200/80 dark:border-slate-700/80 mb-3.5 animate-lock-float"
            >
              <FileSpreadsheet className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
            </div>
          )}

          <h1 id="lock-app-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-md">
            {branding.title || 'Client Management'}
          </h1>
          {branding.slogan && branding.slogan !== 'Google Sheets Database' && (
            <p id="lock-app-slogan" className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm font-medium">
              {branding.slogan}
            </p>
          )}
        </div>

        {/* 2. AUTHENTICATION LOCK CARD */}
        <div 
          className={`w-full max-w-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/60 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden transition-all duration-300 animate-lock-entrance ${
            isShaking ? 'animate-lock-shake border-red-300 dark:border-red-900' : ''
          }`}
        >
          {/* Subtle Top Accent Gradient Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

          <div className="p-6 sm:p-8">
            {/* Header inside Card */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-2xs animate-lock-float">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {isSetupMode ? t.setupInitialPassword : t.welcomeBack}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isSetupMode ? t.setupPasswordDesc : t.enterPasswordToContinue}
              </p>
            </div>

            {/* Device Lockout Alert Banner (5 Failed Attempts -> 1 Hour Block) */}
            {isDeviceLocked && (
              <div 
                id="lock-device-locked-banner"
                role="alert"
                className="mb-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/70 text-rose-800 dark:text-rose-200 shadow-sm animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400 mt-0.5">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-rose-900 dark:text-rose-100">
                      {lang === 'bn' ? 'অনেকবার ভুল পাসওয়ার্ড দেওয়া হয়েছে।' : 'Too many failed attempts.'}
                    </h3>
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 font-medium">
                      {lang === 'bn' ? 'এই ডিভাইসটি সাময়িকভাবে লক করা হয়েছে।' : 'This device is temporarily locked.'}
                    </p>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-rose-300 dark:border-rose-800/80 font-mono font-bold text-xs sm:text-sm text-rose-700 dark:text-rose-300 shadow-2xs">
                      <span>{lang === 'bn' ? 'পুনরায় চেষ্টা করুন:' : 'Try again in'}</span>
                      <span className="tabular-nums tracking-wider text-rose-800 dark:text-rose-200">{formatCountdown(remainingLockSeconds)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message Alert Banner */}
            {!isDeviceLocked && errorMessage && (
              <div 
                id="lock-error-banner"
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200/90 dark:border-red-900/70 flex flex-col space-y-2 text-red-700 dark:text-red-300 text-xs sm:text-sm shadow-2xs transition-all"
              >
                <div className="flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
                  <div className="flex-1 leading-relaxed">
                    <span className="font-medium">{errorMessage}</span>
                    {remainingAttempts !== null && remainingAttempts > 0 && remainingAttempts < 5 && (
                      <span className="block mt-1 font-semibold text-rose-700 dark:text-rose-300">
                        {lang === 'bn' 
                          ? `(আর ${remainingAttempts}টি প্রচেষ্টা বাকি আছে)` 
                          : `(${remainingAttempts} ${remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining)`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Success Message Alert Banner */}
            {setupSuccessMessage && (
              <div 
                id="lock-success-banner"
                role="status"
                className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/90 dark:border-emerald-900/70 flex items-start space-x-2.5 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm shadow-2xs transition-all"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <span className="font-medium flex-1">{setupSuccessMessage}</span>
              </div>
            )}

            {/* MODE 1: Standard Unlock Form (When password is configured) */}
            {!isSetupMode && (
              <form onSubmit={handleUnlockSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label 
                      htmlFor="lock-password-input" 
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                    >
                      {t.password}
                    </label>
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      ref={passwordInputRef}
                      id="lock-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder={
                        isDeviceLocked
                          ? (lang === 'bn' ? 'ডিভাইসটি ১ ঘণ্টার জন্য লক রয়েছে' : 'Device is locked for 1 hour')
                          : (lang === 'bn' ? 'পাসওয়ার্ড লিখুন...' : 'Enter your password...')
                      }
                      disabled={loading || isDeviceLocked}
                      autoComplete="current-password"
                      className="w-full pl-10 pr-11 py-3 text-sm bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:ring-emerald-400/20 dark:focus:border-emerald-500 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isDeviceLocked}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {remainingAttempts !== null && remainingAttempts > 0 && remainingAttempts < 5 && !isDeviceLocked && (
                    <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {lang === 'bn'
                          ? `আর ${remainingAttempts}টি ভুল হলে ১ ঘণ্টার জন্য ডিভাইস লক হবে`
                          : `${remainingAttempts} ${remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining before 1-hour lockout`}
                      </span>
                    </p>
                  )}
                </div>

                {/* Unlock Button */}
                <button
                  id="btn-unlock-dashboard"
                  type="submit"
                  disabled={loading || isDeviceLocked || !password.trim()}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isDeviceLocked ? (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-300" />
                      <span>{lang === 'bn' ? `লক করা হয়েছে (${formatCountdown(remainingLockSeconds)})` : `Locked (${formatCountdown(remainingLockSeconds)})`}</span>
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{t.unlocking}</span>
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white animate-bounce" />
                      <span>{lang === 'bn' ? 'আনলক করা হয়েছে!' : 'Unlocked!'}</span>
                    </>
                  ) : (
                    <>
                      <LockOpen className="w-4 h-4" />
                      <span>{t.unlock}</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MODE 2: First-time Password Setup (When no password is configured in Sheets) */}
            {isSetupMode && (
              <form onSubmit={handleSetupSubmit} className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 mb-2">
                  <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-semibold text-xs mb-1">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>{t.setupInitialPassword}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t.setupPasswordDesc}
                  </p>
                </div>

                <div>
                  <label 
                    htmlFor="lock-new-password" 
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                  >
                    {t.newPassword}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      ref={newPasswordInputRef}
                      id="lock-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder={lang === 'bn' ? 'নতুন পাসওয়ার্ড লিখুন (কমপক্ষে ৪ অক্ষর)' : 'Enter password (min 4 chars)'}
                      disabled={loading}
                      autoComplete="new-password"
                      className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:ring-emerald-400/20 dark:focus:border-emerald-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label 
                    htmlFor="lock-confirm-password" 
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                  >
                    {t.confirmPassword}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="lock-confirm-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder={lang === 'bn' ? 'পাসওয়ার্ডটি পুনরায় লিখুন...' : 'Re-enter your password...'}
                      disabled={loading}
                      autoComplete="new-password"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:ring-emerald-400/20 dark:focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <button
                  id="btn-set-initial-password"
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{t.syncing}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{t.setPassword}</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Security Info Badge */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {lang === 'bn' 
                    ? '১০ মিনিট নিষ্ক্রিয় থাকলে ড্যাশবোর্ড স্বয়ংক্রিয়ভাবে লক হবে'
                    : '10-minute inactivity auto-lock enabled'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Developer Copyright Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
        <p className="font-medium">
          {lang === 'bn'
            ? `ডেভেলপড বাই: Mahmudul Hasan Manik © ${currentYear}। সর্বস্বত্ব সংরক্ষিত।`
            : `Developed by: Mahmudul Hasan Manik © ${currentYear}. All Rights Reserved.`}
        </p>
      </footer>
    </div>
  );
};
