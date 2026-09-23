import React, { useState, useEffect } from 'react';
import { AppBranding, Language } from '../types';
import { DEFAULT_BRANDING } from '../services/googleSheetsService';
import { translations } from '../services/translations';
import { 
  X, 
  Upload, 
  Trash2, 
  Check, 
  Sliders, 
  Sparkles, 
  Image as ImageIcon, 
  Coins, 
  Loader2, 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { PRESET_CURRENCIES, formatCurrency } from '../services/calculations';
import { optimizeLogoFile, compressLogoDataUrl } from '../services/imageUtils';

interface BrandingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: AppBranding;
  onSaveBranding: (branding: AppBranding) => Promise<any> | any;
  hasPasswordConfigured: boolean;
  onSetPassword: (newPassword: string, currentPassword?: string) => Promise<{ success: boolean; error?: string }>;
  lang: Language;
}

export const BrandingSettingsModal: React.FC<BrandingSettingsModalProps> = ({
  isOpen,
  onClose,
  branding,
  onSaveBranding,
  hasPasswordConfigured,
  onSetPassword,
  lang,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'branding' | 'security'>('branding');

  // Branding states
  const [title, setTitle] = useState(branding.title);
  const [slogan, setSlogan] = useState(branding.slogan);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl || '');
  const [currency, setCurrency] = useState(branding.currency || DEFAULT_BRANDING.currency || 'USD');
  const [customCurrencySymbol, setCustomCurrencySymbol] = useState(branding.customCurrencySymbol || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Security / Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(branding.title);
      setSlogan(branding.slogan);
      setLogoUrl(branding.logoUrl || '');
      setCurrency(branding.currency || DEFAULT_BRANDING.currency || 'USD');
      setCustomCurrencySymbol(branding.customCurrencySymbol || '');
      setSuccessMsg(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
      setPasswordSuccess(null);
    }
  }, [isOpen, branding]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert('File size exceeds 15MB. Please choose a smaller image.');
        return;
      }
      setIsProcessingImage(true);
      try {
        const optimized = await optimizeLogoFile(file);
        setLogoUrl(optimized);
      } catch (err: any) {
        console.error('Failed to process image:', err);
        alert('Failed to process the uploaded image. Please try a different image.');
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleResetDefaults = () => {
    setTitle(DEFAULT_BRANDING.title);
    setSlogan(DEFAULT_BRANDING.slogan);
    setLogoUrl(DEFAULT_BRANDING.logoUrl || '');
    setCurrency(DEFAULT_BRANDING.currency || 'USD');
    setCustomCurrencySymbol(DEFAULT_BRANDING.customCurrencySymbol || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalLogoUrl = logoUrl.trim();
      if (finalLogoUrl.startsWith('data:image/') && finalLogoUrl.length > 35000) {
        finalLogoUrl = await compressLogoDataUrl(finalLogoUrl);
      }

      const updated: AppBranding = {
        title: title.trim() || DEFAULT_BRANDING.title,
        slogan: slogan.trim() || DEFAULT_BRANDING.slogan,
        logoUrl: finalLogoUrl,
        currency: currency || 'USD',
        customCurrencySymbol: customCurrencySymbol.trim(),
      };
      const result: any = await onSaveBranding(updated);
      if (result && result.success === false) {
        setIsSaving(false);
        return;
      }
      setSuccessMsg(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 4) {
      setPasswordError(t.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t.passwordsDoNotMatch);
      return;
    }

    if (hasPasswordConfigured && !currentPassword.trim()) {
      setPasswordError(lang === 'bn' ? 'বর্তমান পাসওয়ার্ড প্রদান করুন।' : 'Please enter your current password.');
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await onSetPassword(newPassword, hasPasswordConfigured ? currentPassword : undefined);
      if (res.success) {
        setPasswordSuccess(t.passwordChangeSuccess || t.passwordSetSuccess);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.error || (lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে।' : 'Failed to update password.'));
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Error updating password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.settings}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: General Branding vs Security & Lock */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2 bg-slate-50/30 dark:bg-slate-950/20">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'branding'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.brandingSettings}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'security'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.securitySettings}</span>
            {hasPasswordConfigured ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Protected" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Setup Required" />
            )}
          </button>
        </div>

        {/* Tab 1: General Branding */}
        {activeTab === 'branding' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
                <Check className="w-4 h-4 shrink-0" />
                <span>{t.settingsSaved}</span>
              </div>
            )}

            {/* Logo Section */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                {t.appLogo}
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/70">
                <div className="relative w-14 h-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {isProcessingImage ? (
                    <div className="flex flex-col items-center justify-center p-1">
                      <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                      <span className="text-[9px] text-slate-400 mt-0.5">Optimizing</span>
                    </div>
                  ) : logoUrl ? (
                    logoUrl.startsWith('data:') ||
                    logoUrl.startsWith('http://') ||
                    logoUrl.startsWith('https://') ||
                    logoUrl.startsWith('/') ||
                    logoUrl.startsWith('blob:') ? (
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-xs font-bold text-emerald-500 text-center px-1 truncate">
                        {logoUrl}
                      </div>
                    )
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t.uploadLogo}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.removeLogo}</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder={t.logoHint}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Application Title */}
            <div>
              <label
                htmlFor="settings-app-title"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
              >
                {t.appTitle} <span className="text-rose-500">*</span>
              </label>
              <input
                id="settings-app-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Al-Madina Global Services"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 transition-all font-medium"
              />
            </div>

            {/* Slogan */}
            <div>
              <label
                htmlFor="settings-app-slogan"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
              >
                {t.appSlogan}
              </label>
              <input
                id="settings-app-slogan"
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="e.g. Client Tracking & Application System"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 transition-all font-medium"
              />
            </div>

            {/* Currency Selector */}
            <div className="pt-1">
              <div className="flex items-center space-x-1.5 mb-1">
                <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Coins className="w-3 h-3" />
                </div>
                <label htmlFor="currency-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.currencySetting} <span className="text-rose-500">*</span>
                </label>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                {t.currencyHint}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <select
                    id="currency-select"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    {PRESET_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {currency === 'CUSTOM' ? (
                  <div>
                    <input
                      id="custom-currency-symbol"
                      type="text"
                      value={customCurrencySymbol}
                      onChange={(e) => setCustomCurrencySymbol(e.target.value)}
                      placeholder="Symbol e.g. ₺, ৳, د.إ, CAD"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 text-slate-900 dark:text-slate-100 font-medium"
                    />
                  </div>
                ) : (
                  <div className="flex items-center px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 mr-2">Sample:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(4500, currency, customCurrencySymbol)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                Header Preview
              </span>
              <div className="flex items-center space-x-3">
                {logoUrl ? (
                  logoUrl.startsWith('data:') ||
                  logoUrl.startsWith('http://') ||
                  logoUrl.startsWith('https://') ||
                  logoUrl.startsWith('/') ||
                  logoUrl.startsWith('blob:') ? (
                    <img
                      src={logoUrl}
                      alt="Preview Logo"
                      className="w-9 h-9 object-contain rounded-lg shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-9 px-2 rounded-lg bg-slate-900 dark:bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 truncate max-w-[80px]">
                      {logoUrl}
                    </div>
                  )
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {title || 'Client Management'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {slogan || 'Google Sheets Database'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline transition-colors cursor-pointer"
              >
                {t.resetDefaults}
              </button>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.save}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Security & Dashboard Lock */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
            {/* Status Header */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70">
              <div className="flex items-center space-x-2.5">
                {hasPasswordConfigured ? (
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900/60">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900/60">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {hasPasswordConfigured ? t.passwordProtected : t.noPasswordConfigured}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {hasPasswordConfigured
                      ? (lang === 'bn' ? 'ড্যাশবোর্ড পাসওয়ার্ড দ্বারা সুরক্ষিত রয়েছে' : 'Dashboard is secured with a server-hashed password')
                      : (lang === 'bn' ? 'ড্যাশবোর্ড সুরক্ষিত রাখতে পাসওয়ার্ড সেট করুন' : 'Setup a password to lock and protect your client data')}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  hasPasswordConfigured
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                }`}
              >
                {hasPasswordConfigured ? 'Active' : 'Not Set'}
              </span>
            </div>

            {/* Error Message */}
            {passwordError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-start space-x-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Success Message */}
            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {/* Current Password Field (only if already configured) */}
            {hasPasswordConfigured && (
              <div>
                <label 
                  htmlFor="settings-current-pass" 
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
                >
                  {t.currentPassword} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="settings-current-pass"
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder={lang === 'bn' ? 'বর্তমান পাসওয়ার্ড লিখুন...' : 'Enter your current password...'}
                    disabled={passwordLoading}
                    className="w-full pl-3 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* New Password Field */}
            <div>
              <label 
                htmlFor="settings-new-pass" 
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                {t.newPassword} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="settings-new-pass"
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder={lang === 'bn' ? 'নতুন পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর)' : 'Enter new password (min 4 chars)'}
                  disabled={passwordLoading}
                  className="w-full pl-3 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password Field */}
            <div>
              <label 
                htmlFor="settings-confirm-pass" 
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                {t.confirmPassword} <span className="text-rose-500">*</span>
              </label>
              <input
                id="settings-confirm-pass"
                type={showNewPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder={lang === 'bn' ? 'নতুন পাসওয়ার্ড পুনরায় লিখুন...' : 'Re-enter new password...'}
                disabled={passwordLoading}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 transition-all font-medium"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'পাসওয়ার্ডটি গুগল অ্যাপস স্ক্রিপ্ট সার্ভারে ক্রিপ্টোগ্রাফিক সল্ট সহ হ্যাশ (SHA-256) করে গুগল শিট সেটিংস শিটে সংরক্ষিত হয়। প্লেইন টেক্সট পাসওয়ার্ড কখনোই শিটে বা ব্রাউজারে সংরক্ষিত থাকে না।'
                : 'The password is encrypted server-side in Google Apps Script using SHA-256 with a unique salt before storage in your Google Sheet. Plain-text passwords are never saved.'}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                {t.close}
              </button>
              <button
                id="btn-save-dashboard-password"
                type="submit"
                disabled={passwordLoading || !newPassword || !confirmPassword}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t.syncing}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{hasPasswordConfigured ? t.updatePassword : t.setPassword}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
