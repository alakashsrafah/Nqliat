import React, { useState } from 'react';
import { db } from '../db/database';
import { Database, Download, Upload, RefreshCw, CheckCircle, AlertCircle, Folder, HardDrive, Share2 } from 'lucide-react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const BackupRestore: React.FC = () => {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const TARGET_PATH = '/storage/emulated/0/Documents/nkliat';

  const handleExportBackup = async () => {
    setSuccessMessage('');
    setErrorMessage('');
    setIsSaving(true);

    try {
      const jsonStr = db.exportDatabaseBackup();
      const filename = `nkliat_backup_${new Date().toISOString().split('T')[0]}.json`;
      let savedToPhoneMemory = false;

      // Attempt Capacitor Native Filesystem save to Documents/nkliat
      try {
        if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
          try {
            await Filesystem.mkdir({
              path: 'nkliat',
              directory: Directory.Documents,
              recursive: true,
            });
          } catch (e) {
            // Directory might already exist
          }

          await Filesystem.writeFile({
            path: `nkliat/${filename}`,
            data: jsonStr,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
          });

          savedToPhoneMemory = true;
        }
      } catch (nativeErr) {
        console.warn('Capacitor native filesystem save notice:', nativeErr);
      }

      // Web Download fallback / companion
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (savedToPhoneMemory) {
        setSuccessMessage(`تم إنشاء النسخة الاحتياطية بنجاح وحفظها في ذاكرة الهاتف بالمجلد:\n${TARGET_PATH}/${filename}`);
      } else {
        setSuccessMessage(`تم تصدير وتنزيل النسخة الاحتياطية (${filename}) بنجاح.\nمسار حفظ الملف الموصى به: ${TARGET_PATH}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تصدير النسخة الاحتياطية');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareBackup = async () => {
    setSuccessMessage('');
    setErrorMessage('');
    setIsSharing(true);

    try {
      const jsonStr = db.exportDatabaseBackup();
      const filename = `nkliat_backup_${new Date().toISOString().split('T')[0]}.json`;
      let sharedSuccessfully = false;

      // 1. Try Capacitor Native File Save & Share
      try {
        if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
          try {
            await Filesystem.mkdir({
              path: 'nkliat',
              directory: Directory.Cache,
              recursive: true,
            });
          } catch (e) {
            // Directory might exist
          }

          await Filesystem.writeFile({
            path: `nkliat/${filename}`,
            data: jsonStr,
            directory: Directory.Cache,
            encoding: Encoding.UTF8,
          });

          const fileUri = await Filesystem.getUri({
            path: `nkliat/${filename}`,
            directory: Directory.Cache,
          });

          await Share.share({
            title: 'النسخة الاحتياطية - شركة النقل البري',
            text: `ملف النسخة الاحتياطية لنظام إدارة شركة النقل البري بتاريخ ${new Date().toLocaleDateString('ar-YE')}`,
            url: fileUri.uri,
            dialogTitle: 'مشاركة النسخة الاحتياطية عبر الواتساب أو التطبيقات',
          });

          sharedSuccessfully = true;
        }
      } catch (nativeErr) {
        console.warn('Capacitor native share error, falling back to Web Share API:', nativeErr);
      }

      // 2. Fallback to Web Share API
      if (!sharedSuccessfully) {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const file = new File([blob], filename, { type: 'application/json' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'النسخة الاحتياطية - شركة النقل البري',
            text: `ملف النسخة الاحتياطية لنظام النقل البري بتاريخ ${new Date().toLocaleDateString('ar-YE')}`,
            files: [file],
          });
          sharedSuccessfully = true;
        } else if (navigator.share) {
          await navigator.share({
            title: 'النسخة الاحتياطية - شركة النقل البري',
            text: `ملف النسخة الاحتياطية لنظام إدارة شركة النقل البري: ${filename}`,
          });
          sharedSuccessfully = true;
        }
      }

      if (sharedSuccessfully) {
        setSuccessMessage('تم فتح قائمة المشاركة بنجاح! اختر الواتساب أو التطبيق المطلوب.');
      } else {
        // Download as fallback
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setSuccessMessage(`تم تنزيل ملف النسخة الاحتياطية (${filename}) بنجاح! يمكنك الآن إرساله عبر الواتساب يدوياً.`);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMessage(err.message || 'فشلت عملية مشاركة النسخة الاحتياطية');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuccessMessage('');
    setErrorMessage('');

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        db.importDatabaseBackup(content);
        setSuccessMessage('تم استرجاع النسخة الاحتياطية بنجاح! سيتم تحديث الصفحة الآن...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        setErrorMessage(err.message || 'ملف النسخة الاحتياطية غير صالح أو تالف');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemoData = () => {
    setSuccessMessage('');
    setErrorMessage('');

    if (
      window.confirm(
        'تحذير هام: هل أنت متأكد من إعادة ضبط المصنع ومسح جميع البيانات المدخلة واستعادة البيانات النموذجية الافتراضية؟'
      )
    ) {
      try {
        db.resetToDefaultData();
        setSuccessMessage('تم إعادة ضبط النظام إلى بيانات العرض الافتراضية بنجاح!');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        setErrorMessage('حدث خطأ أثناء إعادة ضبط البيانات');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-amber-600" />
          <span>النسخ الاحتياطي واستعادة البيانات (Offline Backup & Restore)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          بما أن التطبيق يعمل كاملاً بدون إنترنت (Offline-First)، يمكنك حفظ وقراءة أو مشاركة نسخة احتياطية من جميع بيانات الشركة بملف JSON.
        </p>
      </div>

      {/* Target Storage Directory Info Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
        <Folder className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 space-y-1">
          <div className="font-bold text-amber-900">مسار مجلد النسخ الاحتياطي المخصص في أندرويد:</div>
          <div className="font-mono bg-white/80 border border-amber-300 px-3 py-1.5 rounded-xl font-bold text-amber-950 dir-ltr text-left w-fit select-all">
            {TARGET_PATH}
          </div>
          <p className="text-[11px] text-amber-800 pt-1">
            يتم إنشاء مجلد <span className="font-bold">nkliat</span> داخل المستندات تلقائياً عند الحفظ لتسهيل الوصول للنسخ الاحتياطية وإرسالها.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2 whitespace-pre-line">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Export Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-3 bg-amber-50 text-amber-700 w-max rounded-xl">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">حفظ بذاكرة الهاتف</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              توليد وحفظ ملف JSON يضم شجرة الحسابات، السندات، وأوامر الشحن بالمسار (<span className="font-mono text-amber-800">Documents/nkliat</span>).
            </p>
          </div>

          <button
            onClick={handleExportBackup}
            disabled={isSaving}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <HardDrive className="w-4 h-4" />
            <span>{isSaving ? 'جاري الحفظ...' : 'نسخ لمجلد nkliat'}</span>
          </button>
        </div>

        {/* Share Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-3 bg-emerald-50 text-emerald-700 w-max rounded-xl">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">مشاركة النسخة</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              إرسال ومشاركة ملف النسخة الاحتياطية مباشرة عبر الواتساب (WhatsApp) أو الإيميل أو تطبيقات التواصل.
            </p>
          </div>

          <button
            onClick={handleShareBackup}
            disabled={isSharing}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{isSharing ? 'جاري المشاركة...' : 'مشاركة عبر الواتساب'}</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 text-blue-700 w-max rounded-xl">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">استرجاع نسخة</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              اختيار ملف النسخة الاحتياطية (<span className="font-mono text-blue-800">.json</span>) من ذاكرة الهاتف لاستعادة كافة بيانات النظام.
            </p>
          </div>

          <label className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>استرجاع ملف JSON</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>

        {/* Reset Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-3 bg-rose-50 text-rose-700 w-max rounded-xl">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">إعادة الضبط</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              إعادة تهيئة النظام واسترجاع البيانات النموذجية الافتراضية (شجرة الحسابات، والمركبات العينة).
            </p>
          </div>

          <button
            onClick={handleResetDemoData}
            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs sm:text-sm transition-colors border border-rose-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>ضبط المصنع</span>
          </button>
        </div>
      </div>
    </div>
  );
};
