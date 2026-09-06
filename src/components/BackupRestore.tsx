import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { sqliteService, SqlQueryResult } from '../services/sqliteService';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Folder,
  HardDrive,
  Share2,
  FileCode,
  Terminal,
  Play,
  Layers,
  Sparkles,
  Table as TableIcon
} from 'lucide-react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const BackupRestore: React.FC = () => {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSavingSqlite, setIsSavingSqlite] = useState(false);
  const [isSavingSqlScript, setIsSavingSqlScript] = useState(false);
  const [isSavingJson, setIsSavingJson] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // SQLite Console states
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM accounts LIMIT 8;');
  const [queryResult, setQueryResult] = useState<SqlQueryResult[] | null>(null);
  const [queryError, setQueryError] = useState('');
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [tableCounts, setTableCounts] = useState<{ table: string; nameAr: string; count: number }[]>([]);

  const TARGET_PATH = '/storage/emulated/0/Documents/nkliat';

  useEffect(() => {
    loadTableCounts();
  }, []);

  const loadTableCounts = async () => {
    try {
      const counts = await sqliteService.getTableCounts();
      setTableCounts(counts);
    } catch (e) {
      console.warn('Error loading table counts:', e);
    }
  };

  /**
   * 1. Export real SQLite binary database (.sqlite) and save to /storage/emulated/0/Documents/nkliat
   */
  const handleExportSqliteDb = async () => {
    setSuccessMessage('');
    setErrorMessage('');
    setIsSavingSqlite(true);

    try {
      const filename = `nkliat_database_${new Date().toISOString().split('T')[0]}.sqlite`;
      const res = await sqliteService.saveSqliteToDeviceAndPath(filename);

      if (res.savedToPhone) {
        setSuccessMessage(
          `تم إنشاء قاعدة بيانات SQLite بنجاح وحفظها في ذاكرة الهاتف:\n${TARGET_PATH}/${filename}`
        );
      } else {
        setSuccessMessage(
          `تم توليد وتنزيل قاعدة بيانات SQLite (${filename}) بنجاح!\nمسار الحفظ في نظام أندرويد: ${TARGET_PATH}/${filename}`
        );
      }
      loadTableCounts();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تصدير قاعدة بيانات SQLite');
    } finally {
      setIsSavingSqlite(false);
    }
  };

  /**
   * 2. Export SQLite SQL Script (.sql) and save to /storage/emulated/0/Documents/nkliat
   */
  const handleExportSqlScript = async () => {
    setSuccessMessage('');
    setErrorMessage('');
    setIsSavingSqlScript(true);

    try {
      const filename = `nkliat_dump_${new Date().toISOString().split('T')[0]}.sql`;
      const res = await sqliteService.saveSqlScriptToDeviceAndPath(filename);

      if (res.savedToPhone) {
        setSuccessMessage(
          `تم تصدير سكربت أوامر SQLite (.sql) بنجاح وحفظه في:\n${TARGET_PATH}/${filename}`
        );
      } else {
        setSuccessMessage(
          `تم تنزيل سكربت SQLite SQL (${filename}) بنجاح!\nمتوافق مع DB Browser for SQLite ومسار الحفظ: ${TARGET_PATH}`
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تصدير سكربت SQL');
    } finally {
      setIsSavingSqlScript(false);
    }
  };

  /**
   * 3. Export JSON Backup to /storage/emulated/0/Documents/nkliat
   */
  const handleExportJsonBackup = async () => {
    setSuccessMessage('');
    setErrorMessage('');
    setIsSavingJson(true);

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
          } catch {
            // Folder exists
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

      // Web Download fallback
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
        setSuccessMessage(
          `تم إنشاء النسخة الاحتياطية (JSON) وحفظها في ذاكرة الهاتف بالمجلد:\n${TARGET_PATH}/${filename}`
        );
      } else {
        setSuccessMessage(
          `تم تصدير وتنزيل ملف النسخة الاحتياطية (${filename}) بنجاح.\nمسار الحفظ: ${TARGET_PATH}`
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تصدير النسخة الاحتياطية');
    } finally {
      setIsSavingJson(false);
    }
  };

  /**
   * 4. Share SQLite database file via WhatsApp or native share sheet
   */
  const handleShareSqlite = async () => {
    setSuccessMessage('');
    setErrorMessage('');
    setIsSharing(true);

    try {
      const binary = await sqliteService.exportSqliteBinary();
      const filename = `nkliat_database_${new Date().toISOString().split('T')[0]}.sqlite`;
      let sharedSuccessfully = false;

      // Try Capacitor Native File Save & Share
      try {
        if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
          const { uint8ArrayToBase64 } = await import('../services/sqliteService');
          const base64Data = uint8ArrayToBase64(binary);

          try {
            await Filesystem.mkdir({
              path: 'nkliat',
              directory: Directory.Cache,
              recursive: true,
            });
          } catch {
            // Directory exists
          }

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
            title: 'قاعدة بيانات SQLite - نظام النقل البري',
            text: `ملف قاعدة بيانات SQLite لشركة النقل البري بتاريخ ${new Date().toLocaleDateString('ar-YE')}`,
            url: fileUri.uri,
            dialogTitle: 'مشاركة قاعدة بيانات SQLite عبر الواتساب أو التطبيقات',
          });

          sharedSuccessfully = true;
        }
      } catch (nativeErr) {
        console.warn('Capacitor native share notice:', nativeErr);
      }

      // Fallback to Web Share API
      if (!sharedSuccessfully) {
        const blob = new Blob([binary as unknown as BlobPart], { type: 'application/x-sqlite3' });
        const file = new File([blob], filename, { type: 'application/x-sqlite3' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'قاعدة بيانات SQLite - نظام النقل البري',
            text: `ملف قاعدة بيانات SQLite بتاريخ ${new Date().toLocaleDateString('ar-YE')}`,
            files: [file],
          });
          sharedSuccessfully = true;
        } else if (navigator.share) {
          await navigator.share({
            title: 'قاعدة بيانات SQLite - شركة النقل البري',
            text: `ملف قاعدة بيانات SQLite: ${filename}`,
          });
          sharedSuccessfully = true;
        }
      }

      if (sharedSuccessfully) {
        setSuccessMessage('تم فتح قائمة المشاركة بنجاح! اختر الواتساب أو التطبيق المطلوب.');
      } else {
        // Download as fallback
        const blob = new Blob([binary as unknown as BlobPart], { type: 'application/x-sqlite3' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSuccessMessage(`تم تنزيل ملف قاعدة البيانات (${filename}) بنجاح! يمكنك الآن إرساله عبر الواتساب.`);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMessage(err.message || 'فشلت عملية مشاركة ملف SQLite');
      }
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * 5. Import SQLite (.sqlite / .db / .sql) or JSON file
   */
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuccessMessage('');
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const fileNameLower = file.name.toLowerCase();

    if (fileNameLower.endsWith('.sqlite') || fileNameLower.endsWith('.db')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const uint8 = new Uint8Array(buffer);
          const ok = await sqliteService.importSqliteBinary(uint8);
          if (ok) {
            setSuccessMessage('تم استرجاع قاعدة بيانات SQLite بنجاح! جاري تحديث بيانات النظام...');
            setTimeout(() => window.location.reload(), 1500);
          } else {
            setErrorMessage('تعذر قراءة جداول قاعدة البيانات من ملف SQLite المرفوع.');
          }
        } catch (err: any) {
          setErrorMessage('الملف غير صالح أو حدث خطأ أثناء فك تشفير SQLite: ' + err.message);
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (fileNameLower.endsWith('.sql')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const sqlText = event.target?.result as string;
          const ok = await sqliteService.importSqlScript(sqlText);
          if (ok) {
            setSuccessMessage('تم استيراد وتنفيذ سكربت أوامر SQLite بنجاح! جاري تحديث الواجهة...');
            setTimeout(() => window.location.reload(), 1500);
          } else {
            setErrorMessage('فشل تنفيذ سكربت SQL، يرجى التأكد من صحة بناء جمل SQL.');
          }
        } catch (err: any) {
          setErrorMessage('خطأ في استيراد سكربت SQL: ' + err.message);
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } else {
      // Default to JSON
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const ok = db.importDatabaseBackup(content);
          if (ok) {
            setSuccessMessage('تم استرجاع النسخة الاحتياطية بنجاح! سيتم تحديث الصفحة الآن...');
            setTimeout(() => window.location.reload(), 1500);
          } else {
            setErrorMessage('صيغة ملف النسخة الاحتياطية غير مطابقة لمعايير النظام.');
          }
        } catch (err: any) {
          setErrorMessage(err.message || 'ملف النسخة الاحتياطية غير صالح أو تالف');
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    }
  };

  /**
   * 6. Execute custom SQL query on the active SQLite engine
   */
  const handleExecuteQuery = async (customQuery?: string) => {
    const q = customQuery || sqlQuery;
    if (!q.trim()) return;

    setIsExecutingQuery(true);
    setQueryError('');
    setQueryResult(null);

    try {
      const res = await sqliteService.executeQuery(q);
      setQueryResult(res);
      loadTableCounts();
    } catch (err: any) {
      setQueryError(err.message || 'خطأ أثناء تنفيذ استعلام SQL');
    } finally {
      setIsExecutingQuery(false);
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
        setTimeout(() => window.location.reload(), 1500);
      } catch (err: any) {
        setErrorMessage('حدث خطأ أثناء إعادة ضبط البيانات');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Title Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            <span>إدارة وحفظ قاعدة بيانات SQLite والنسخ الاحتياطي</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            دعم كامل لتقنية SQLite وحفظ قواعد البيانات الثنائية (.sqlite / .db) وسكربتات SQL وملفات JSON محلياً بدون إنترنت.
          </p>
        </div>

        {/* Engine Status Badge */}
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl w-fit">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
            محرك SQLite مفعّل ويعمل بنجاح
          </span>
        </div>
      </div>

      {/* Target Storage Directory Info Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
        <Folder className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 dark:text-amber-200 space-y-1.5 w-full">
          <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between">
            <span>مسار مجلد الحفظ المخصص لبيانات النظام في الهاتف (أندرويد):</span>
            <span className="text-[11px] font-semibold bg-amber-200/70 dark:bg-amber-900/80 px-2 py-0.5 rounded-md text-amber-900 dark:text-amber-200">
              ثابت ومعتمد
            </span>
          </div>
          <div className="font-mono bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/80 px-3 py-2 rounded-xl font-bold text-amber-950 dark:text-amber-300 dir-ltr text-left select-all text-xs sm:text-sm">
            {TARGET_PATH}
          </div>
          <p className="text-[11px] text-amber-800 dark:text-amber-400">
            يتم حفظ واستخراج ملفات <span className="font-bold font-mono">.sqlite</span> و{' '}
            <span className="font-bold font-mono">.sql</span> و{' '}
            <span className="font-bold font-mono">.json</span> مباشرة داخل مجلد{' '}
            <span className="font-bold">nkliat</span> في المستندات لتسهيل الوصول إليها وإدارتها.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2 whitespace-pre-line">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Export SQLite Binary File */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-400 transition-colors">
          <div className="space-y-2">
            <div className="p-3 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 w-max rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">قاعدة بيانات SQLite</h3>
              <span className="text-[10px] font-mono bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-bold">
                .sqlite / .db
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              إنشاء ملف قاعدة بيانات SQLite ثنائي حقيقي وحفظه بالمجلد المخصص (<span className="font-mono text-amber-700 dark:text-amber-400">Documents/nkliat</span>).
            </p>
          </div>

          <button
            onClick={handleExportSqliteDb}
            disabled={isSavingSqlite}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <HardDrive className="w-4 h-4" />
            <span>{isSavingSqlite ? 'جاري بناء وحفظ SQLite...' : 'حفظ SQLite بمجلد nkliat'}</span>
          </button>
        </div>

        {/* 2. Export SQL Script */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-400 transition-colors">
          <div className="space-y-2">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 w-max rounded-xl">
              <FileCode className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">سكربت SQL كامل</h3>
              <span className="text-[10px] font-mono bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded font-bold">
                .sql Dump
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              تصدير ملف SQL يحتوي كافة جداول SQLite وتعليمات الإدراج والفهارس متوافق مع DB Browser for SQLite.
            </p>
          </div>

          <button
            onClick={handleExportSqlScript}
            disabled={isSavingSqlScript}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isSavingSqlScript ? 'جاري التصدير...' : 'تصدير سكربت SQL'}</span>
          </button>
        </div>

        {/* 3. Share SQLite file */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-400 transition-colors">
          <div className="space-y-2">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 w-max rounded-xl">
              <Share2 className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">مشاركة عبر الواتساب</h3>
              <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                Share Sheet
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              إرسال ومشاركة ملف قاعدة بيانات SQLite مباشرة عبر الواتساب أو تيليجرام أو البريد الإلكتروني.
            </p>
          </div>

          <button
            onClick={handleShareSqlite}
            disabled={isSharing}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{isSharing ? 'جاري التجهيز...' : 'مشاركة SQLite بالواتساب'}</span>
          </button>
        </div>

        {/* 4. Import / Restore (.sqlite / .sql / .json) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors">
          <div className="space-y-2">
            <div className="p-3 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 w-max rounded-xl">
              <Upload className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">استرجاع واستيراد</h3>
              <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-bold">
                .sqlite / .sql / .json
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              اختيار واسترجاع ملف قاعدة بيانات SQLite أو سكربت SQL أو ملف JSON واستعادة كافة بيانات المحاسبة فوراً.
            </p>
          </div>

          <label className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{isImporting ? 'جاري الاستيراد...' : 'اختيار ملف واسترجاع'}</span>
            <input
              type="file"
              accept=".sqlite,.db,.sql,.json"
              onChange={handleImportFile}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* SQLite Database Tables Inspector */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>سجلات جداول SQLite النشطة في النظام</span>
          </h3>
          <button
            onClick={loadTableCounts}
            className="text-xs text-slate-500 hover:text-amber-600 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث الإحصائيات</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {tableCounts.map((t) => (
            <div
              key={t.table}
              onClick={() => {
                setSqlQuery(`SELECT * FROM ${t.table} LIMIT 10;`);
                handleExecuteQuery(`SELECT * FROM ${t.table} LIMIT 10;`);
              }}
              className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-xl hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-slate-800 cursor-pointer transition-all text-right group"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono text-[11px] group-hover:text-amber-600 dark:group-hover:text-amber-400">{t.table}</span>
                <TableIcon className="w-3.5 h-3.5 opacity-60" />
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{t.nameAr}</div>
              <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {t.count} سجل
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive SQLite Query Console */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">محرر واستعلامات SQLite المباشرة (SQL Query Console)</h3>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                const q = 'SELECT id, account_code, account_name, account_type FROM accounts LIMIT 8;';
                setSqlQuery(q);
                handleExecuteQuery(q);
              }}
              className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-mono transition-colors cursor-pointer"
            >
              الحسابات
            </button>
            <button
              onClick={() => {
                const q = 'SELECT id, order_number, driver_name, trip_route, cargo_type, trip_amount, status FROM shipment_orders LIMIT 8;';
                setSqlQuery(q);
                handleExecuteQuery(q);
              }}
              className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-mono transition-colors cursor-pointer"
            >
              أوامر الشحن
            </button>
            <button
              onClick={() => {
                const q = 'SELECT id, vehicle_name, vehicle_number, vehicle_code FROM vehicles;';
                setSqlQuery(q);
                handleExecuteQuery(q);
              }}
              className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-mono transition-colors cursor-pointer"
            >
              الشاحنات
            </button>
            <button
              onClick={() => {
                const q = 'SELECT id, entry_date, account_code, debit, credit, description FROM journal_entries ORDER BY id DESC LIMIT 8;';
                setSqlQuery(q);
                handleExecuteQuery(q);
              }}
              className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-mono transition-colors cursor-pointer"
            >
              قيود اليومية
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              rows={3}
              placeholder="اكتب استعلام SQL هنا (مثال: SELECT * FROM accounts;)"
              className="w-full font-mono text-xs sm:text-sm p-3 bg-slate-900 text-emerald-400 rounded-xl border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 dir-ltr text-left resize-y"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => handleExecuteQuery()}
              disabled={isExecutingQuery}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isExecutingQuery ? 'جاري التنفيذ...' : 'تشغيل الاستعلام (Run SQL)'}</span>
            </button>
          </div>
        </div>

        {/* Query Error */}
        {queryError && (
          <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 font-mono text-xs rounded-xl dir-ltr text-left">
            Error: {queryError}
          </div>
        )}

        {/* Query Results Table */}
        {queryResult && queryResult.length > 0 && (
          <div className="space-y-4 pt-2">
            {queryResult.map((res, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>تم استرجاع <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{res.values.length}</span> صفاً:</span>
                  <span className="font-mono text-[11px]">{res.columns.length} أعمدة</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-mono font-bold">
                      <tr>
                        {res.columns.map((col) => (
                          <th key={col} className="p-2.5 border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {res.values.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          {row.map((val, cIdx) => (
                            <td
                              key={cIdx}
                              className="p-2.5 text-slate-800 dark:text-slate-300 font-mono whitespace-nowrap text-xs max-w-xs truncate"
                              title={String(val)}
                            >
                              {val === null || val === undefined ? (
                                <span className="text-slate-400 italic">NULL</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Options (JSON & Factory Reset) */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 text-right w-full sm:w-auto">
          <div className="font-bold text-slate-800 dark:text-slate-200">النسخ الاحتياطي الإضافي بصيغة JSON:</div>
          <div>يمكنك حفظ نسخة احتياطية خفيفة JSON بمجلد nkliat أو إجراء إعادة تهيئة للنظام.</div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportJsonBackup}
            disabled={isSavingJson}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isSavingJson ? 'جاري الحفظ...' : 'نسخة JSON بمجلد nkliat'}</span>
          </button>

          <button
            onClick={handleResetDemoData}
            className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ضبط المصنع</span>
          </button>
        </div>
      </div>
    </div>
  );
};
