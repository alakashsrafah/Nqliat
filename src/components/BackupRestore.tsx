import React, { useState } from 'react';
import { db } from '../db/database';
import { sqliteBackupService } from '../services/sqliteBackupService';
import { Database, Download, Upload, RefreshCw, CheckCircle, AlertCircle, Folder, HardDrive, Share2, Layers, FileCode } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Helper to convert Uint8Array to base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const BackupRestore: React.FC = () => {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const TARGET_PATH = '/storage/emulated/0/Documents/nkliat';

  // Get live counts from database
  const currentSchema = db.getSchema();
  const accountsCount = currentSchema.chart_of_accounts?.length || 0;
  const vouchersCount = currentSchema.voucher_header?.length || 0;
  const shipmentsCount = currentSchema.shipment_orders?.length || 0;
  const vehiclesCount = currentSchema.vehicles?.length || 0;
  const driversCount = currentSchema.drivers?.length || 0;

  const handleExportSqliteBackup = async () => {
    setSuccessMessage('');
    setErrorMessage('');
    setIsSaving(true);

    try {
      const schema = db.getSchema();
      const sqliteBytes = await sqliteBackupService.exportToSqliteBinary(schema);
      const filename = `nkliat_backup_${new Date().toISOString().split('T')[0]}.sqlite`;
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

          const base64Data = uint8ArrayToBase64(sqliteBytes);
          await Filesystem.writeFile({
            path: `nkliat/${filename}`,
            data: base64Data,
            directory: Directory.Documents,
          });

          savedToPhoneMemory = true;
        }
      } catch (nativeErr) {
        console.warn('Capacitor native filesystem save notice:', nativeErr);
      }

      // Web Download fallback / companion (real SQLite 3 binary file)
      const blob = new Blob([sqliteBytes.buffer as ArrayBuffer], { type: 'application/vnd.sqlite3' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (savedToPhoneMemory) {
        setSuccessMessage(`تم إنشاء قاعدة بيانات SQLite بنجاح وحفظها في ذاكرة الهاتف بالمجلد:\n${TARGET_PATH}/${filename}`);
      } else {
        setSuccessMessage(`تم تصدير وتنزيل ملف قاعدة بيانات SQLite (${filename}) بنجاح!\nمسار حفظ الملف الموصى به: ${TARGET_PATH}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تصدير النسخة الاحتياطية بصيغة SQLite');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareSqliteBackup = async () => {
    setSuccessMessage('');
    setErrorMessage('');
    setIsSharing(true);

    try {
      const schema = db.getSchema();
      const sqliteBytes = await sqliteBackupService.exportToSqliteBinary(schema);
      const filename = `nkliat_backup_${new Date().toISOString().split('T')[0]}.sqlite`;
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

          const base64Data = uint8ArrayToBase64(sqliteBytes);
          await Filesystem.writeFile({
            path: `nkliat/${filename}`,
            data: base64Data,
            directory: Directory.Cache,
          });

          const fileUri = await Filesystem.getUri({
            path: `nkliat/${filename}`,
            directory: Directory.Cache,
          });

          await Share.share({
            title: 'قاعدة بيانات SQLite - نظام النقليات البرية',
            text: `ملف قاعدة بيانات SQLite لنظام إدارة النقليات بتاريخ ${new Date().toLocaleDateString('ar-YE')}`,
            url: fileUri.uri,
            dialogTitle: 'مشاركة ملف SQLite عبر الواتساب أو التطبيقات',
          });

          sharedSuccessfully = true;
        }
      } catch (nativeErr) {
        console.warn('Capacitor native share error, falling back to Web Share API:', nativeErr);
      }

      // 2. Fallback to Web Share API
      if (!sharedSuccessfully) {
        const blob = new Blob([sqliteBytes.buffer as ArrayBuffer], { type: 'application/vnd.sqlite3' });
        const file = new File([blob], filename, { type: 'application/vnd.sqlite3' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'قاعدة بيانات SQLite - شركة النقل البري',
            text: `ملف النسخة الاحتياطية بصيغة SQLite بتاريخ ${new Date().toLocaleDateString('ar-YE')}`,
            files: [file],
          });
          sharedSuccessfully = true;
        } else if (navigator.share) {
          await navigator.share({
            title: 'قاعدة بيانات SQLite - شركة النقل البري',
            text: `ملف قاعدة بيانات SQLite لنظام إدارة النقليات: ${filename}`,
          });
          sharedSuccessfully = true;
        }
      }

      if (sharedSuccessfully) {
        setSuccessMessage('تم فتح قائمة المشاركة بنجاح! اختر الواتساب أو التطبيق المطلوب.');
      } else {
        // Download as fallback
        const blob = new Blob([sqliteBytes.buffer as ArrayBuffer], { type: 'application/vnd.sqlite3' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setSuccessMessage(`تم تنزيل ملف قاعدة البيانات (${filename}) بنجاح! يمكنك الآن إرساله عبر الواتساب يدوياً.`);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMessage(err.message || 'فشلت عملية مشاركة النسخة الاحتياطية');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleImportBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuccessMessage('');
    setErrorMessage('');

    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);

    try {
      const isJson = file.name.toLowerCase().endsWith('.json');

      if (isJson) {
        // Legacy JSON restore support
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            const ok = db.importDatabaseBackup(content);
            if (ok) {
              setSuccessMessage('تم استرجاع النسخة الاحتياطية (JSON) بنجاح! سيتم تحديث الصفحة الآن...');
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              setErrorMessage('الملف المحدد لا يحتوي على بنية بيانات نظام النقليات الصحيحة.');
            }
          } catch (err: any) {
            setErrorMessage(err.message || 'ملف النسخة الاحتياطية غير صالح أو تالف');
          } finally {
            setIsRestoring(false);
          }
        };
        reader.readAsText(file);
      } else {
        // Native SQLite restore
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        const restoredSchema = await sqliteBackupService.importFromSqliteBinary(bytes);
        const ok = db.setSchema(restoredSchema);

        if (ok) {
          setSuccessMessage('تم استرجاع قاعدة بيانات SQLite بنجاح بجميع الجداول! سيتم تحديث التطبيق الآن...');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setErrorMessage('فشل تحديث قاعدة البيانات من ملف SQLite المحدد.');
          setIsRestoring(false);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'ملف SQLite غير صالح أو تالف أو تالف البنية');
      setIsRestoring(false);
    }
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
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                SQLite 3 Engine
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Offline-First Relational Backup</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
              <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>النسخ الاحتياطي بصيغة SQLite (SQLite Database Backup & Restore)</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <Layers className="w-4 h-4 text-blue-500" />
            <span>الجداول المضمنة: 9 جداول علائقية</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          يتم حفظ وتصدير قاعدة البيانات بصيغة <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">.sqlite / .db</span> قياسية كاملة، مما يتيح فتحها في أي برنامج SQLite خارجي (مثل DB Browser for SQLite) أو استعادتها بأمان تام.
        </p>

        {/* Database Content Stats Pill Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 block">شجرة الحسابات</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{accountsCount} حساب</span>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 block">السندات والقيود</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{vouchersCount} سند</span>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 block">أوامر الشحن</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{shipmentsCount} أمر</span>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 block">المركبات والشاحنات</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{vehiclesCount} مركبة</span>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 block">السائقين</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{driversCount} سائق</span>
          </div>
        </div>
      </div>

      {/* Target Storage Directory Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 p-4 rounded-2xl flex items-start gap-3">
        <Folder className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-950 dark:text-blue-200 space-y-1">
          <div className="font-bold text-blue-900 dark:text-blue-300">مسار حفظ ملف SQLite في أندرويد وذاكرة الهاتف:</div>
          <div className="font-mono bg-white/80 dark:bg-slate-900/80 border border-blue-300 dark:border-blue-800 px-3 py-1.5 rounded-xl font-bold text-blue-950 dark:text-blue-300 dir-ltr text-left w-fit select-all">
            {TARGET_PATH}/*.sqlite
          </div>
          <p className="text-[11px] text-blue-800 dark:text-blue-300/80 pt-1">
            يتم تخزين النسخة داخل مجلد <span className="font-bold font-mono">Documents/nkliat</span> بصيغة <span className="font-mono font-bold">.sqlite</span> متوافقة مع جميع أنظمة قواعد البيانات القياسية.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2 whitespace-pre-line">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Export SQLite Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 w-max rounded-xl">
              <Download className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">تصدير SQLite</h3>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono font-bold">.sqlite</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              توليد وحفظ ملف قاعدة بيانات SQLite كاملة تشمل الحسابات، السندات، الرحلات بالمسار (<span className="font-mono text-blue-800 dark:text-blue-300">Documents/nkliat</span>).
            </p>
          </div>

          <button
            onClick={handleExportSqliteBackup}
            disabled={isSaving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <HardDrive className="w-4 h-4" />
            <span>{isSaving ? 'جاري التصدير...' : 'تصدير نسخة SQLite'}</span>
          </button>
        </div>

        {/* Share Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 w-max rounded-xl">
              <Share2 className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">مشاركة SQLite</h3>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">WhatsApp</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              إرسال ومشاركة ملف قاعدة بيانات SQLite مباشرة عبر الواتساب (WhatsApp) أو الإيميل أو السحابة.
            </p>
          </div>

          <button
            onClick={handleShareSqliteBackup}
            disabled={isSharing}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{isSharing ? 'جاري المشاركة...' : 'مشاركة SQLite بالواتساب'}</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 w-max rounded-xl">
              <Upload className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">استرجاع قاعدة بيانات</h3>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-mono font-bold">.sqlite / .db</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              اختيار ملف قاعدة بيانات (<span className="font-mono text-amber-800 dark:text-amber-300">.sqlite / .db / .json</span>) لاستعادة كافة الحسابات والعمليات فوراً.
            </p>
          </div>

          <label className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{isRestoring ? 'جاري الاسترجاع...' : 'استرجاع ملف SQLite'}</span>
            <input
              type="file"
              accept=".sqlite,.db,.sqlite3,.json"
              onChange={handleImportBackupFile}
              disabled={isRestoring}
              className="hidden"
            />
          </label>
        </div>

        {/* Reset Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 w-max rounded-xl">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">إعادة الضبط</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              إعادة تهيئة النظام واسترجاع البيانات النموذجية الافتراضية (شجرة الحسابات، والمركبات العينة).
            </p>
          </div>

          <button
            onClick={handleResetDemoData}
            className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold rounded-xl text-xs sm:text-sm transition-colors border border-rose-200 dark:border-rose-900/60 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>ضبط المصنع</span>
          </button>
        </div>
      </div>
    </div>
  );
};

