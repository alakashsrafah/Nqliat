import React, { useState } from 'react';
import { licenseService, LicenseInfo } from '../services/licenseService';
import {
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Key,
  Calendar,
  AlertTriangle,
  X,
  Send,
  Sparkles,
} from 'lucide-react';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLicenseChanged?: () => void;
  isStartupPrompt?: boolean;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  onLicenseChanged,
  isStartupPrompt = false,
}) => {
  const [license, setLicense] = useState<LicenseInfo>(licenseService.getCurrentLicense());
  const [inputKey, setInputKey] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Re-sync license state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const current = licenseService.getCurrentLicense();
      setLicense(current);
      if (!current.isLicensed) {
        setStatusMsg({
          type: 'error',
          text: current.isExpired && current.licenseKey
            ? 'انتهت صلاحية مفتاح الترخيص الحالي. يرجى إدخال مفتاح تجديد جديد.'
            : 'النظام حالياً غير مفعّل. يرجى إدخال مفتاح الترخيص لمتابعة العمل.',
        });
      } else {
        setStatusMsg(null);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyMachineId = () => {
    navigator.clipboard.writeText(license.machineId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleSendViaWhatsApp = () => {
    const text = `مرحباً، أود تفعيل ترخيص برنامج [نظام إدارة النقليات البرية].\nرمز جهازي هو: ${license.machineId}\nاسم المنشأة: ${clientName || 'شركة نقل'}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setStatusMsg({ type: 'error', text: 'يرجى إدخال مفتاح التفعيل أولاً.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    const res = await licenseService.activateLicense(inputKey, clientName);
    setLoading(false);

    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
      setLicense(licenseService.getCurrentLicense());
      setInputKey('');
      if (onLicenseChanged) onLicenseChanged();
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${license.isLicensed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {license.isLicensed ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ترخيص وتفعيل النظام</h3>
              <p className="text-xs text-slate-400">إدارة مفتاح التفعيل وربط الترخيص بالجهاز</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs sm:text-sm">
          {/* Current Status Card */}
          <div
            className={`p-4 rounded-2xl border ${
              license.isLicensed
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                {license.isLicensed ? (
                  license.licenseType === 'trial' ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>حالة النظام: فترة تجريبية مجانية (أسبوع)</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>حالة النظام: نُسخة مُرخّصة ونشطة</span>
                    </>
                  )
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>حالة النظام: انتهت الفترة التجريبية / مطلوب تفعيل</span>
                  </>
                )}
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-slate-900 text-white">
                {license.licenseType === 'lifetime'
                  ? 'دائم'
                  : license.licenseType === 'annual'
                  ? 'سنوي'
                  : license.licenseType === 'trial'
                  ? 'تجريبي (أسبوع)'
                  : 'غير مرخص'}
              </span>
            </div>

            {/* Trial Details Notification */}
            {license.licenseType === 'trial' && (
              <div className="mt-2.5 p-2.5 bg-slate-900/10 dark:bg-slate-950/40 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">تاريخ أول عملية:</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                    {license.firstOperationAt || 'تبدأ عند أول عملية'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {license.isExpired
                    ? '⚠️ انتهت مهلة الأسبوع التجريبي من تاريخ أول عملية مسجلة.'
                    : '💡 الفترة التجريبية مدتها أسبوع (7 أيام) تُحسب من تاريخ أول عملية مسجلة بالبرنامج.'}
                </div>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">الصلاحية:</span>
                <span className="font-bold">{license.expiresDateFormatted}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">الأيام المتبقية:</span>
                <span className={`font-bold ${license.isExpired ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                  {license.licenseType === 'lifetime'
                    ? '∞ غير محدود'
                    : license.isExpired
                    ? '0 يوم (منتهي)'
                    : `${license.daysRemaining} يوم`}
                </span>
              </div>
            </div>
          </div>

          {/* Machine Code Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                رمز هذا الجهاز (Machine Code):
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">خاص بهذا الجهاز فقط</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={license.machineId}
                dir="ltr"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-amber-600 dark:text-amber-400 text-center tracking-wider text-sm select-all"
              />

              <button
                type="button"
                onClick={handleCopyMachineId}
                title="نسخ رمز الجهاز"
                className="p-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl transition-colors shrink-0"
              >
                {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSendViaWhatsApp}
              className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال رمز الجهاز للمطور عبر واتساب للحصول على التفعيل</span>
            </button>
          </div>

          {/* Activation Form */}
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                اسم المؤسسة / العميل:
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="مثال: شركة البراري للشحن"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>مفتاح الترخيص (License Key):</span>
                <Key className="w-3.5 h-3.5 text-amber-500" />
              </label>
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="NKL-..."
                dir="ltr"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs text-amber-600 dark:text-amber-400 font-bold"
              />
            </div>

            {statusMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300'
                }`}
              >
                {statusMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'جاري التحقق والتفعيل...' : 'تفعيل الترخيص الآن'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
