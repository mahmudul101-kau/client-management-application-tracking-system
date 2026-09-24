import React from 'react';
import { createPortal } from 'react-dom';
import { Client, AppBranding, Language } from '../types';
import { translations } from '../services/translations';
import { formatCurrency, formatDisplayDate } from '../services/calculations';
import { Printer, X, FileSpreadsheet } from 'lucide-react';

interface ClientPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  branding: AppBranding;
  lang: Language;
}

export const ClientPrintPreviewModal: React.FC<ClientPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  client,
  branding,
  lang,
}) => {
  if (!isOpen || !client) return null;

  const t = translations[lang];

  // Robust print trigger:
  // First tries direct window.print().
  // If window.print() is restricted or blocked by iframe/sandbox, falls back to an isolated print window.
  const handlePrint = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      // Direct browser print
      window.print();
    } catch (err) {
      console.warn('Direct window.print() threw, trying fallback print window:', err);
      triggerFallbackPrintWindow(client, branding, lang, t);
    }
  };

  return (
    <>
      {/* 
        SCREEN PREVIEW MODAL OVERLAY (.print-modal-ui):
        Strictly hidden during browser print via .print-modal-ui { display: none !important; }.
        Provides a realistic, clean, un-fragmented A4 preview.
      */}
      <div className="print-modal-ui fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 dark:bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Top Control Bar: Fixed at top of modal */}
          <div className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 z-10">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.printDetails}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {client.id} — <span className="font-sans font-medium text-slate-700 dark:text-slate-300">{client.name}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                id="btn-trigger-print"
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.printDocument}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Scrollable Viewport:
              The document itself is a continuous, realistic A4 sheet (width: 794px max).
              It is never squashed or fractured.
          */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/70 dark:bg-slate-950/90 flex justify-center items-start">
            <div className="w-full max-w-[794px] bg-white text-slate-900 shadow-xl border border-slate-300/80 rounded-sm p-10 sm:p-12 font-sans my-2 min-h-[600px]">
              <PrintDocumentContent client={client} branding={branding} lang={lang} t={t} isPrintMode={false} />
            </div>
          </div>

          {/* Bottom Bar: Instructions and Close */}
          <div className="shrink-0 px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 flex items-center justify-between z-10">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'bn' 
                ? 'ব্রাউজারের প্রিন্ট ডায়ালগ থেকে প্রিন্ট করুন অথবা "Save as PDF" নির্বাচন করুন।' 
                : 'Use browser print dialog to print or choose "Save as PDF".'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>

      {/* 
        DEDICATED PRINT DOM CONTAINER VIA REACT PORTAL:
        Rendered directly into document.body as #client-print-root.
        Completely immune to parent modal positioning, overflow, transforms, or clipping.
      */}
      {createPortal(
        <div id="client-print-root" className="client-print-document">
          <PrintDocumentContent client={client} branding={branding} lang={lang} t={t} isPrintMode={true} />
        </div>,
        document.body
      )}
    </>
  );
};

interface PrintDocumentContentProps {
  client: Client;
  branding: AppBranding;
  lang: Language;
  t: any;
  isPrintMode?: boolean;
}

const PrintDocumentContent: React.FC<PrintDocumentContentProps> = ({
  client,
  branding,
  lang,
  t,
  isPrintMode = false,
}) => {
  return (
    <div className={`client-document-body space-y-6 ${isPrintMode ? 'is-print-mode' : ''}`}>
      {/* 1. HEADER / BRANDING (Never splits across pages) */}
      <div className="client-print-header flex items-start justify-between pb-5 border-b-2 border-slate-900 print:border-black">
        <div className="flex items-center space-x-4">
          {branding.logoUrl ? (
            branding.logoUrl.startsWith('data:') ||
            branding.logoUrl.startsWith('http://') ||
            branding.logoUrl.startsWith('https://') ||
            branding.logoUrl.startsWith('/') ||
            branding.logoUrl.startsWith('blob:') ? (
              <img
                src={branding.logoUrl}
                alt={branding.title || 'App Logo'}
                referrerPolicy="no-referrer"
                className="w-14 h-14 max-w-[56px] max-h-[56px] object-contain rounded-lg border border-slate-200 print:border-slate-400 p-0.5 shrink-0"
              />
            ) : (
              <div className="h-14 px-3 rounded-lg bg-slate-900 print:bg-slate-800 text-emerald-400 print:text-black flex items-center justify-center font-bold text-sm tracking-wide border border-slate-700 shrink-0">
                {branding.logoUrl}
              </div>
            )
          ) : (
            <div className="w-14 h-14 rounded-lg bg-slate-900 print:bg-slate-800 text-white flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-7 h-7 text-emerald-400 print:text-white" />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 print:text-black break-words">
              {branding.title}
            </h1>
            <p className="text-xs text-slate-600 print:text-slate-700 mt-0.5 break-words">
              {branding.slogan}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 ml-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 print:text-slate-700 block">
            {t.clientDetailsDocument}
          </span>
          <span className="font-mono text-sm font-bold text-slate-900 print:text-black block mt-0.5">
            {client.id}
          </span>
        </div>
      </div>

      {/* 2. CLIENT INFORMATION (Never splits awkwardly) */}
      <div className="client-print-section print-avoid-break">
        <h2 className="text-xs font-bold text-slate-800 print:text-black uppercase tracking-wider pb-2 mb-3 border-b border-slate-200 print:border-slate-400">
          {t.clientInformation}
        </h2>

        <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
          <div className="print-avoid-break">
            <span className="text-slate-500 print:text-slate-600 block text-[11px] font-medium">{t.clientName}</span>
            <span className="font-bold text-slate-900 print:text-black text-sm break-words">{client.name}</span>
          </div>

          <div className="print-avoid-break">
            <span className="text-slate-500 print:text-slate-600 block text-[11px] font-medium">{t.clientId}</span>
            <span className="font-mono font-semibold text-slate-800 print:text-black">{client.id}</span>
          </div>

          {client.phone && (
            <div className="print-avoid-break">
              <span className="text-slate-500 print:text-slate-600 block text-[11px] font-medium">{t.phoneNumber}</span>
              <span className="font-mono font-medium text-slate-800 print:text-black">{client.phone}</span>
            </div>
          )}

          {client.category && (
            <div className="print-avoid-break">
              <span className="text-slate-500 print:text-slate-600 block text-[11px] font-medium">{t.category}</span>
              <span className="font-medium text-slate-800 print:text-black">{client.category}</span>
            </div>
          )}

          {client.createdDate && (
            <div className="print-avoid-break">
              <span className="text-slate-500 print:text-slate-600 block text-[11px] font-medium">{t.createdDate}</span>
              <span className="font-mono font-medium text-slate-800 print:text-black">{formatDisplayDate(client.createdDate)}</span>
            </div>
          )}
        </div>

        {/* Notes (rendered only if present, flows naturally for multi-page if long) */}
        {client.notes && client.notes.trim() !== '' && (
          <div className="mt-3.5 pt-3 border-t border-dashed border-slate-200 print:border-slate-400 print-avoid-break">
            <span className="text-slate-500 print:text-slate-600 block text-[11px] font-medium mb-1">{t.notes}</span>
            <p className="text-xs text-slate-700 print:text-black whitespace-pre-wrap leading-relaxed break-words">
              {client.notes}
            </p>
          </div>
        )}
      </div>

      {/* 3. APPLICATION & PAYMENT INFORMATION (Never splits awkwardly) */}
      <div className="client-print-section print-avoid-break">
        <h2 className="text-xs font-bold text-slate-800 print:text-black uppercase tracking-wider pb-2 mb-3 border-b border-slate-200 print:border-slate-400">
          {t.applicationAndPayment}
        </h2>

        {/* Statuses Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg border border-slate-200 print:border-slate-400 bg-slate-50/70 print:bg-white print-avoid-break">
            <span className="text-[11px] font-medium text-slate-500 print:text-slate-600 block mb-1">
              {t.applicationStatus}
            </span>
            <span className="text-xs font-bold text-slate-900 print:text-black uppercase">
              {client.applicationStatus}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 print:border-slate-400 bg-slate-50/70 print:bg-white print-avoid-break">
            <span className="text-[11px] font-medium text-slate-500 print:text-slate-600 block mb-1">
              {t.paymentStatus}
            </span>
            <span className="text-xs font-bold text-slate-900 print:text-black uppercase">
              {client.paymentStatus === 'PAID'
                ? t.paid
                : client.paymentStatus === 'PARTIAL'
                ? t.partial
                : t.unpaid}
            </span>
          </div>
        </div>

        {/* Financial Table */}
        <table className="client-print-table w-full text-xs border border-slate-200 print:border-slate-400 rounded-lg overflow-hidden">
          <tbody>
            <tr className="border-b border-slate-200 print:border-slate-400 bg-slate-50/50 print:bg-white">
              <td className="py-2.5 px-4 text-slate-600 print:text-black font-medium">{t.totalAmount}</td>
              <td className="py-2.5 px-4 text-right font-semibold text-slate-900 print:text-black">
                {formatCurrency(client.totalAmount)}
              </td>
            </tr>
            <tr className="border-b border-slate-200 print:border-slate-400">
              <td className="py-2.5 px-4 text-slate-600 print:text-black font-medium">{t.paidAmount}</td>
              <td className="py-2.5 px-4 text-right font-semibold text-slate-900 print:text-black">
                {formatCurrency(client.paidAmount)}
              </td>
            </tr>
            <tr className="bg-slate-50 print:bg-white font-bold border-t border-slate-300 print:border-slate-400">
              <td className="py-2.5 px-4 text-slate-900 print:text-black">{t.dueAmount}</td>
              <td className="py-2.5 px-4 text-right text-slate-900 print:text-black text-sm">
                {formatCurrency(client.dueAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. FOOTER: Electronic Generation Notice (Never splits awkwardly) */}
      <div className="client-print-footer print-avoid-break pt-6 border-t border-slate-200 print:border-slate-400 text-center">
        <p className="text-[11px] text-slate-500 print:text-slate-600 italic leading-relaxed">
          {t.electronicDocumentNotice}
        </p>
      </div>
    </div>
  );
};

// Fallback Print Window helper:
// Used only if the host environment blocks top-level window.print()
function triggerFallbackPrintWindow(
  client: Client,
  branding: AppBranding,
  lang: Language,
  t: any
) {
  try {
    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে ব্রাউজারের পপ-আপ অনুমোদন করুন।' : 'Please allow pop-ups to print the document.');
      return;
    }

    const logoHtml = branding.logoUrl
      ? `<img src="${branding.logoUrl}" alt="Logo" style="width:56px;height:56px;object-fit:contain;border:1px solid #ccc;padding:2px;border-radius:6px;" />`
      : `<div style="width:56px;height:56px;background:#1e293b;color:#34d399;font-weight:bold;display:flex;align-items:center;justify-content:center;border-radius:6px;">APP</div>`;

    const notesHtml = client.notes && client.notes.trim() !== ''
      ? `<div style="margin-top:14px;padding-top:10px;border-top:1px dashed #ccc;page-break-inside:avoid;">
           <span style="font-size:11px;color:#64748b;display:block;margin-bottom:4px;">${t.notes}</span>
           <p style="font-size:12px;color:#000;margin:0;white-space:pre-wrap;line-height:1.5;">${escapeHtml(client.notes)}</p>
         </div>`
      : '';

    const phoneHtml = client.phone
      ? `<div style="page-break-inside:avoid;">
           <span style="color:#64748b;display:block;font-size:11px;font-weight:500;">${t.phoneNumber}</span>
           <span style="font-family:monospace;font-size:12px;color:#000;">${escapeHtml(client.phone)}</span>
         </div>`
      : '';

    const categoryHtml = client.category
      ? `<div style="page-break-inside:avoid;">
           <span style="color:#64748b;display:block;font-size:11px;font-weight:500;">${t.category}</span>
           <span style="font-size:12px;color:#000;">${escapeHtml(client.category)}</span>
         </div>`
      : '';

    const createdDateHtml = client.createdDate
      ? `<div style="page-break-inside:avoid;">
           <span style="color:#64748b;display:block;font-size:11px;font-weight:500;">${t.createdDate}</span>
           <span style="font-family:monospace;font-size:12px;color:#000;">${escapeHtml(formatDisplayDate(client.createdDate))}</span>
         </div>`
      : '';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(client.id)} - ${escapeHtml(client.name)}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #000; background: #fff; line-height: 1.4; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2px solid #0f172a; margin-bottom: 22px; page-break-inside: avoid; }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .header-title { font-size: 20px; font-weight: bold; margin: 0; }
    .header-slogan { font-size: 12px; color: #475569; margin: 3px 0 0 0; }
    .header-right { text-align: right; }
    .doc-type { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; }
    .doc-id { font-size: 14px; font-family: monospace; font-weight: bold; margin-top: 3px; }
    .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin: 20px 0 12px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 12px; }
    .status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
    .status-card { border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 6px; background: #f8fafc; }
    .table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 12px; }
    .table td { padding: 9px 14px; border-bottom: 1px solid #e2e8f0; }
    .footer { margin-top: 26px; padding-top: 18px; border-top: 1px solid #cbd5e1; text-align: center; font-size: 11px; color: #64748b; font-style: italic; page-break-inside: avoid; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      ${logoHtml}
      <div>
        <h1 class="header-title">${escapeHtml(branding.title)}</h1>
        <p class="header-slogan">${escapeHtml(branding.slogan)}</p>
      </div>
    </div>
    <div class="header-right">
      <div class="doc-type">${escapeHtml(t.clientDetailsDocument)}</div>
      <div class="doc-id">${escapeHtml(client.id)}</div>
    </div>
  </div>

  <div style="page-break-inside: avoid;">
    <div class="section-title">${escapeHtml(t.clientInformation)}</div>
    <div class="grid">
      <div>
        <span style="color:#64748b;display:block;font-size:11px;font-weight:500;">${escapeHtml(t.clientName)}</span>
        <span style="font-weight:bold;font-size:13px;">${escapeHtml(client.name)}</span>
      </div>
      <div>
        <span style="color:#64748b;display:block;font-size:11px;font-weight:500;">${escapeHtml(t.clientId)}</span>
        <span style="font-family:monospace;font-weight:600;">${escapeHtml(client.id)}</span>
      </div>
      ${phoneHtml}
      ${categoryHtml}
      ${createdDateHtml}
    </div>
    ${notesHtml}
  </div>

  <div style="page-break-inside: avoid; margin-top: 16px;">
    <div class="section-title">${escapeHtml(t.applicationAndPayment)}</div>
    <div class="status-grid">
      <div class="status-card">
        <span style="font-size:11px;color:#64748b;display:block;margin-bottom:3px;">${escapeHtml(t.applicationStatus)}</span>
        <span style="font-weight:bold;font-size:12px;text-transform:uppercase;">${escapeHtml(client.applicationStatus)}</span>
      </div>
      <div class="status-card">
        <span style="font-size:11px;color:#64748b;display:block;margin-bottom:3px;">${escapeHtml(t.paymentStatus)}</span>
        <span style="font-weight:bold;font-size:12px;text-transform:uppercase;">${
          client.paymentStatus === 'PAID' ? escapeHtml(t.paid) : client.paymentStatus === 'PARTIAL' ? escapeHtml(t.partial) : escapeHtml(t.unpaid)
        }</span>
      </div>
    </div>

    <table class="table">
      <tr>
        <td style="color:#475569;">${escapeHtml(t.totalAmount)}</td>
        <td style="text-align:right;font-weight:600;">${escapeHtml(formatCurrency(client.totalAmount))}</td>
      </tr>
      <tr>
        <td style="color:#475569;">${escapeHtml(t.paidAmount)}</td>
        <td style="text-align:right;font-weight:600;">${escapeHtml(formatCurrency(client.paidAmount))}</td>
      </tr>
      <tr style="background:#f8fafc;font-weight:bold;">
        <td>${escapeHtml(t.dueAmount)}</td>
        <td style="text-align:right;font-size:13px;">${escapeHtml(formatCurrency(client.dueAmount))}</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    ${escapeHtml(t.electronicDocumentNotice)}
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 200);
    };
  </script>
</body>
</html>`;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  } catch (e) {
    console.error('Fallback print window error:', e);
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
