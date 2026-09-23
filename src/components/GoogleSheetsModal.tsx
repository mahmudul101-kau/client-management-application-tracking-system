import React, { useState } from 'react';
import { GoogleSheetsConfig } from '../types';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../services/appsScriptCode';
import { 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud,
  Code
} from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (newUrl: string) => Promise<boolean>;
  onSyncAllToSheet: () => Promise<void>;
  onPullFromSheet: () => Promise<void>;
  isSyncing: boolean;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onSyncAllToSheet,
  onPullFromSheet,
  isSyncing,
}) => {
  const [urlInput, setUrlInput] = useState(config.webAppUrl || '');
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setStatusMsg({ text: 'Please enter a valid Google Apps Script Web App URL.', type: 'error' });
      return;
    }

    setTesting(true);
    setStatusMsg({ text: 'Connecting to Google Sheets and verifying structure...', type: 'info' });
    try {
      const success = await onSaveConfig(urlInput.trim());
      if (success) {
        setStatusMsg({ text: 'Connected successfully to Google Sheets!', type: 'success' });
      } else {
        setStatusMsg({
          text: 'Could not connect. Please check the URL and ensure the Apps Script deployment has "Who has access: Anyone".',
          type: 'error',
        });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Connection failed.', type: 'error' });
    } finally {
      setTesting(false);
    }
  };

  const handlePushAll = async () => {
    setStatusMsg({ text: 'Synchronizing all records to Google Sheets...', type: 'info' });
    try {
      await onSyncAllToSheet();
      setStatusMsg({ text: 'Successfully saved and synchronized all data to Google Sheets!', type: 'success' });
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to sync to Google Sheets.', type: 'error' });
    }
  };

  const handlePullLatest = async () => {
    setStatusMsg({ text: 'Fetching latest data from Google Sheets...', type: 'info' });
    try {
      await onPullFromSheet();
      setStatusMsg({ text: 'Latest records successfully loaded from Google Sheets!', type: 'success' });
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to fetch from Google Sheets.', type: 'error' });
    }
  };

  const isConnected = config.status === 'connected';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Google Sheets Database Integration</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Persistent storage directly into your Google Sheets spreadsheet.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status feedback message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border flex items-center space-x-2 text-xs ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : statusMsg.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Connection Status Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Database Status
              </span>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                />
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {isConnected ? (config.sheetName || 'Google Sheet Connected') : 'Local Storage Mode (Ready to Connect)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {config.lastSyncedAt
                  ? `Last synchronized: ${new Date(config.lastSyncedAt).toLocaleString()}`
                  : 'All client and category records are preserved.'}
              </p>
            </div>

            {/* Sync actions if connected */}
            {isConnected && (
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handlePushAll}
                  disabled={isSyncing}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Push to Sheet</span>
                </button>
                <button
                  onClick={handlePullLatest}
                  disabled={isSyncing}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-2xs"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>Pull Latest</span>
                </button>
              </div>
            )}
          </div>

          {/* Web App URL Form */}
          <form onSubmit={handleConnect} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Google Apps Script Web App URL
            </label>
            <div className="flex gap-2">
              <input
                id="input-sheets-web-app-url"
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-400/20 focus:border-slate-500 dark:focus:border-slate-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono"
              />
              <button
                id="btn-save-sheets-url"
                type="submit"
                disabled={testing}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors disabled:opacity-50 border border-transparent dark:border-slate-700"
              >
                {testing ? 'Testing...' : isConnected ? 'Update URL' : 'Connect Sheet'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Enter the Web App URL generated from the Apps Script attached to your Google Sheet.
            </p>
          </form>

          {/* Step-by-Step Instructions */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-950/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                How to Connect Your Google Sheet in 2 Minutes
              </h3>
              <button
                type="button"
                onClick={handleCopyScript}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 transition-colors"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Copy Apps Script Code</span>
                  </>
                )}
              </button>
            </div>

            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5 list-decimal list-inside leading-relaxed">
              <li>
                Open a new or existing spreadsheet at{' '}
                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 font-semibold underline inline-flex items-center space-x-0.5"
                >
                  <span>sheets.new</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                </a>.
              </li>
              <li>
                In the menu, click <strong className="text-slate-800 dark:text-slate-200">Extensions</strong> &gt;{' '}
                <strong className="text-slate-800 dark:text-slate-200">Apps Script</strong>.
              </li>
              <li>
                Replace any existing code in the script editor with the code by clicking{' '}
                <strong className="text-slate-800 dark:text-slate-200">"Copy Apps Script Code"</strong> above, then paste and save (Ctrl+S).
              </li>
              <li>
                <span className="font-semibold text-slate-800 dark:text-slate-200">To Deploy or Update:</span>
                <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-[11px]">
                  <li>
                    <strong>First time deployment:</strong> Click <strong className="text-slate-800 dark:text-slate-200">Deploy</strong> &gt; <strong className="text-slate-800 dark:text-slate-200">New deployment</strong> &gt; Select type: <strong className="text-slate-800 dark:text-slate-200">Web app</strong> &gt; Execute as: <strong className="text-slate-800 dark:text-slate-200">Me</strong> &gt; Who has access: <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">Anyone</strong> &gt; Deploy.
                  </li>
                  <li>
                    <strong>Updating an existing script:</strong> Click <strong className="text-slate-800 dark:text-slate-200">Deploy</strong> &gt; <strong className="text-slate-800 dark:text-slate-200">Manage deployments</strong> &gt; Click the Pencil (Edit) icon &gt; Select Version: <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">"New version"</strong> &gt; Click <strong className="text-slate-800 dark:text-slate-200">Deploy</strong>.
                  </li>
                </ul>
              </li>
              <li>
                Copy the <strong className="text-slate-800 dark:text-slate-200">Web app URL</strong> and paste it into the Web App URL input above!
              </li>
            </ol>

            {/* Collapsible script preview */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowScriptCode(!showScriptCode)}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium flex items-center space-x-1"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{showScriptCode ? 'Hide Apps Script Code' : 'View Complete Apps Script Code'}</span>
              </button>

              {showScriptCode && (
                <div className="mt-2 relative">
                  <pre className="p-3 bg-slate-900 dark:bg-slate-950 text-slate-200 text-[11px] rounded-lg overflow-x-auto max-h-48 font-mono leading-normal border border-transparent dark:border-slate-800">
                    {GOOGLE_APPS_SCRIPT_TEMPLATE}
                  </pre>
                  <button
                    onClick={handleCopyScript}
                    className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-medium"
                  >
                    {copiedScript ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Google Sheets Structure Specifications */}
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Google Sheets Structure Generated Automatically:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">Sheet 1: Clients</span>
                <p className="text-slate-500 dark:text-slate-400">
                  Client ID, Client Name, Phone Number, Category, Total Amount, Paid Amount, Due Amount, Application Status, Payment Status, Created Date, Notes.
                </p>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">Sheet 2: Categories</span>
                <p className="text-slate-500 dark:text-slate-400">
                  Category ID, Category Name, Status (ACTIVE/INACTIVE), Created Date.
                </p>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">Sheet 3: ApplicationStatuses</span>
                <p className="text-slate-500 dark:text-slate-400">
                  Status ID (e.g. APP-001), Status Name, Status (ACTIVE/INACTIVE), Created Date.
                </p>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">Sheet 4: Settings</span>
                <p className="text-slate-500 dark:text-slate-400">
                  Setting Key (app_title, app_slogan, logo_url), Setting Value.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent dark:border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
