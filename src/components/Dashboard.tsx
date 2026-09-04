import React from 'react';
import { ViewTab, User } from '../types';
import { db } from '../db/database';
import {
  FilePlus,
  ArrowDownLeft,
  ArrowUpRight,
  GitCommit,
  Truck,
  FileText,
  DollarSign,
  Users,
  PieChart,
  Layers,
  CheckCircle2,
  Clock,
  MapPin,
  Send,
  GitFork,
  UserCog,
  HardDrive,
  Coins,
  TrendingUp,
  Wallet,
  Wrench,
  UserCheck
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: ViewTab) => void;
  currentUser: User | null;
  onOpenShipmentForm?: (shipmentId?: number) => void;
  onCreateShipment?: (shipmentId?: number) => void;
  onCreateVoucher?: (type: 'receipt' | 'payment' | 'journal') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  currentUser,
  onOpenShipmentForm,
  onCreateShipment,
  onCreateVoucher,
}) => {
  const handleOpenShipment = (shipmentId?: number) => {
    if (onOpenShipmentForm) {
      onOpenShipmentForm(shipmentId);
    } else if (onCreateShipment) {
      onCreateShipment(shipmentId);
    } else {
      onNavigate('shipments');
    }
  };

  const handleOpenVoucher = (type: 'receipt' | 'payment' | 'journal') => {
    if (onCreateVoucher) {
      onCreateVoucher(type);
    } else {
      onNavigate(`voucher_${type}` as ViewTab);
    }
  };

  const shipmentOrders = db.getShipmentOrders();
  const draftShipments = shipmentOrders.filter((s) => s.is_financially_posted === 0);
  const postedShipments = shipmentOrders.filter((s) => s.is_financially_posted === 1);
  const vehicles = db.getVehicles();
  const drivers = db.getDrivers();
  const currencies = db.getCurrencies();
  const basicCurrency = currencies.find((c) => c.currency_type === 'basic') || currencies[0];

  // Cash Box Balance
  const cashStmt = db.getAccountStatement('1220001');
  const cashBalance = cashStmt.closingEqBalance;

  // Vehicle Stats
  const vehicleStats = db.getVehicleProfitStats();

  const isAdmin = currentUser?.user_type === 'مدير';

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/80 rounded-3xl p-6 text-white shadow-lg border border-slate-700/50 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-amber-500/10 rounded-r-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2 border border-amber-500/30">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>نظام أندرويد محلي - لا يحتاج إنترنت (Offline-First)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-amber-400">
              أهلاً بك، {currentUser?.full_name || currentUser?.username || 'المستخدم'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              إدارة حركة أسطول الشاحنات، إصدار السندات المالية، أتمتة مسودات الشحن، والتأثير المحاسبي المباشر.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenShipment()}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Truck className="w-5 h-5" />
              <span>أمر شحن جديد</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="flex items-center gap-2 px-4 py-3 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs sm:text-sm border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <PieChart className="w-5 h-5 text-amber-400" />
              <span>التقارير المالية</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Primary KPIs Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash Box */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">الصندوق الرئيسي</span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight dir-ltr text-right">
            {cashBalance.toLocaleString()} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">{basicCurrency.currency_symbol}</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>حساب 1220001 جاهز للاستخدام</span>
          </div>
        </div>

        {/* Approved Shipments */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">أوامر الشحن المعتمدة</span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Truck className="w-6 h-6" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {postedShipments.length} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">رحلة معتمدة</span>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-1.5">
            مرحلة للقيود والحسابات
          </div>
        </div>

        {/* Draft Shipments */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">مسودات معلقة</span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {draftShipments.length} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">مسودة</span>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-1.5">
            تحتاج مراجعة واعتتماد
          </div>
        </div>

        {/* Fleet Count */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">أسطول الشاحنات</span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Wrench className="w-6 h-6" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {vehicles.length} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">مركبة</span>
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1.5">
            مرتبطة بمصروفات وإيرادات
          </div>
        </div>
      </div>

      {/* 3. Quick Voucher Creation Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <FilePlus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>إصدار سريع للعمليات المالية والشحن</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Receipt Voucher */}
          <button
            onClick={() => handleOpenVoucher('receipt')}
            className="flex flex-col items-center justify-center p-4 bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-900 dark:text-emerald-200 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-sm">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm">سند قبض نقدي</span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">قبض نقدية للصندوق</span>
          </button>

          {/* Payment Voucher */}
          <button
            onClick={() => handleOpenVoucher('payment')}
            className="flex flex-col items-center justify-center p-4 bg-rose-50/70 hover:bg-rose-100/80 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-rose-900 dark:text-rose-200 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center mb-2 shadow-sm">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm">سند صرف نقدي</span>
            <span className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">صرف نقدية من الصندوق</span>
          </button>

          {/* Journal Entry */}
          <button
            onClick={() => handleOpenVoucher('journal')}
            className="flex flex-col items-center justify-center p-4 bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 rounded-2xl text-blue-900 dark:text-blue-200 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <GitCommit className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm">قيد يومية بسيط</span>
            <span className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">تسوية بين حسابين</span>
          </button>

          {/* Shipment Invoice */}
          <button
            onClick={() => handleOpenShipment()}
            className="flex flex-col items-center justify-center p-4 bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border border-amber-300 dark:border-amber-800/60 rounded-2xl text-amber-950 dark:text-amber-200 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center mb-2 shadow-sm">
              <Truck className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm">أمر شحن جديد</span>
            <span className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5">رحلة + المصروفات</span>
          </button>
        </div>
      </div>

      {/* 4. Main Navigation Modules Grid with Larger Clear Icons */}
      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>أقسام وإدارات النظام الأساسية</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Shipments List */}
          <button
            onClick={() => onNavigate('shipments')}
            className="p-5 bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm text-right transition-all flex flex-col justify-between h-40 group hover:-translate-y-1 active:scale-98 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                <Truck className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {shipmentOrders.length} شحنة
              </span>
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-base">سجل أوامر الشحن</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                استعراض، تعديل واعتماد المسودات وإصدار فواتير الرحلات
              </div>
            </div>
          </button>

          {/* Vouchers List */}
          <button
            onClick={() => onNavigate('vouchers_list')}
            className="p-5 bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm text-right transition-all flex flex-col justify-between h-40 group hover:-translate-y-1 active:scale-98 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileText className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                سندات
              </span>
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-base">سجل السندات المالية</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                سجل القيود اليومية، القبض، الصرف للتحقق والطباعة
              </div>
            </div>
          </button>

          {/* Accounts Tree */}
          <button
            onClick={() => (isAdmin ? onNavigate('accounts') : alert('عذراً، هذه الصلاحية للمدير فقط'))}
            className={`p-5 bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm text-right transition-all flex flex-col justify-between h-40 group hover:-translate-y-1 active:scale-98 cursor-pointer ${
              !isAdmin ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <GitFork className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                4 مستويات
              </span>
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-base flex items-center justify-between">
                <span>شجرة الحسابات</span>
                {!isAdmin && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">مدير</span>}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                دليل الحسابات المحاسبي المكتمل (أصول، خصوم، مصروفات، إيرادات)
              </div>
            </div>
          </button>

          {/* Vehicles Fleet */}
          <button
            onClick={() => (isAdmin ? onNavigate('vehicles') : alert('عذراً، هذه الصلاحية للمدير فقط'))}
            className={`p-5 bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm text-right transition-all flex flex-col justify-between h-40 group hover:-translate-y-1 active:scale-98 cursor-pointer ${
              !isAdmin ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                <Wrench className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {vehicles.length} مركبة
              </span>
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-base flex items-center justify-between">
                <span>أسطول الشاحنات</span>
                {!isAdmin && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">مدير</span>}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                ربط حسابات الإيراد وتتبع مواعيد غيار الزيت والصيانة
              </div>
            </div>
          </button>

          {/* Drivers */}
          <button
            onClick={() => onNavigate('drivers')}
            className="p-5 bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm text-right transition-all flex flex-col justify-between h-40 group hover:-translate-y-1 active:scale-98 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <UserCheck className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {drivers.length} سائق
              </span>
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-base">دليل السائقين</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                سجل السائقين، أرقام الرخص والهواتف لربطهم بالرحلات
              </div>
            </div>
          </button>

          {/* Currencies */}
          <button
            onClick={() => (isAdmin ? onNavigate('currencies') : alert('عذراً، هذه الصلاحية للمدير فقط'))}
            className={`p-5 bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm text-right transition-all flex flex-col justify-between h-40 group hover:-translate-y-1 active:scale-98 cursor-pointer ${
              !isAdmin ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-400 group-hover:bg-yellow-500 group-hover:text-slate-950 transition-colors">
                <Coins className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-50 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300">
                {basicCurrency.currency_code}
              </span>
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-base flex items-center justify-between">
                <span>العملات والصرف</span>
                {!isAdmin && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">مدير</span>}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                ضبط العملة الأساسية وأسعار الصرف الأجنبي
              </div>
            </div>
          </button>

          {/* Financial Reports */}
          <button
            onClick={() => onNavigate('reports')}
            className="p-5 bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm text-right transition-all flex flex-col justify-between h-40 group hover:-translate-y-1 active:scale-98 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <TrendingUp className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                قوائم وختامية
              </span>
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-base">التقارير المالية</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                كشف الحساب، ميزان المراجعة، قائمة الدخل، والميزانية العمومية
              </div>
            </div>
          </button>

          {/* Backup & Storage */}
          <button
            onClick={() => onNavigate('backup_restore')}
            className="p-5 bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm text-right transition-all flex flex-col justify-between h-40 group hover:-translate-y-1 active:scale-98 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <HardDrive className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                مجلد nkliat
              </span>
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-base">النسخ الاحتياطي والمشاركة</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                حفظ بذاكرة الهاتف بالمسار المخصص أو مشاركته عبر الواتساب
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 5. Fleet Performance Summary */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>ملخص الأداء المالي لأسطول المركبات</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicleStats.map((st) => {
            const isProfitable = st.netProfitEq >= 0;
            return (
              <div
                key={st.vehicle.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs">
                      {st.vehicle.vehicle_code}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {st.vehicle.vehicle_name} ({st.vehicle.vehicle_number})
                      </h4>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        رحلات مسجلة: {st.shipmentCount}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isProfitable
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    صافي الأرباح: {st.netProfitEq.toLocaleString()} {basicCurrency.currency_symbol}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">إجمالي الإيرادات</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {st.totalRevenueEq.toLocaleString()} {basicCurrency.currency_symbol}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">إجمالي المصروفات</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                      {st.totalExpenseEq.toLocaleString()} {basicCurrency.currency_symbol}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Pending Draft Shipments Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              مسودات أوامر الشحن بانتظار الاعتماد المالي
            </h3>
            <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold px-2 py-0.5 rounded-full">
              {draftShipments.length}
            </span>
          </div>

          <button
            onClick={() => onNavigate('shipments')}
            className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 font-bold hover:underline cursor-pointer"
          >
            عرض جميع أوامر الشحن ←
          </button>
        </div>

        {draftShipments.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            لا توجد مسودات معلقة حالياً. جميع أوامر الشحن معتمدة ومرحلة مالياً!
          </div>
        ) : (
          <div className="space-y-3">
            {draftShipments.slice(0, 3).map((shipment) => {
              const vehicle = vehicles.find((v) => v.id === shipment.vehicle_id);
              const merchantAcc = db.getAccountByCode(shipment.merchant_account_code);
              const expenses = db.getShipmentExpenseItems(shipment.id);
              const totalExp = expenses.reduce((sum, e) => sum + e.amount * e.exchange_rate, 0);

              return (
                <div
                  key={shipment.id}
                  className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        مرجع: {shipment.reference_number}
                      </span>
                      <span className="text-[11px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded font-bold">
                        مسودة تشغيلية
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-slate-500" />
                        المركبة: {vehicle?.vehicle_name || 'غير معروفة'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        المسار: {shipment.departure_point} ← {shipment.arrival_point}
                      </span>
                      <span>التاجر: {merchantAcc?.account_name || shipment.merchant_account_code}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-amber-200/60 dark:border-amber-900/60">
                    <div className="text-left leading-tight">
                      <div className="text-xs text-slate-500 dark:text-slate-400">مبلغ الإيجار:</div>
                      <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        {shipment.trip_amount.toLocaleString()} {shipment.trip_currency_code}
                      </div>
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                        المصروفات: {totalExp.toLocaleString()} {basicCurrency.currency_symbol}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenShipment(shipment.id)}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>مراجعة واعتتماد</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
