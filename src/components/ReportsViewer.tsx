import React, { useState } from 'react';
import { db } from '../db/database';
import {
  FileText,
  Printer,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  Truck,
  TrendingUp,
  Scale,
  ArrowDownUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Fuel,
  User,
  AlertCircle,
  DollarSign,
  Maximize2,
  ListFilter,
  Layers,
  Calculator
} from 'lucide-react';

type ReportTab = 'statement' | 'trial' | 'income' | 'balance' | 'vehicles' | 'vehicleDetails';

export const ReportsViewer: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportTab>('vehicleDetails');

  const level4Accounts = db.getAccounts().filter((a) => a.account_level === 4);
  const vehiclesList = db.getVehicles();

  const basicCurrency = db.getCurrencies().find((c) => c.currency_type === 'basic') || {
    currency_symbol: 'ر.ي',
    currency_code: 'YER',
  };

  // 1. General Account Statement Filters
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>(level4Accounts[0]?.account_code || '1210001');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // 2. Vehicle Details Report Filters
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(vehiclesList[0]?.id || 0);
  const [isDateLimitActive, setIsDateLimitActive] = useState<boolean>(false); // false = مطلق (All dates), true = تاريخ محدد
  const [vehStartDate, setVehStartDate] = useState<string>('2026-01-01');
  const [vehEndDate, setVehEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vehicleReportMode, setVehicleReportMode] = useState<'movements' | 'shipments'>('shipments');

  // Accordion Expand/Collapse State for Shipment Orders
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  const toggleOrderExpand = (id: number) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAllOrders = (orderIds: number[]) => {
    const next: Record<number, boolean> = {};
    orderIds.forEach((id) => {
      next[id] = true;
    });
    setExpandedOrders(next);
  };

  const collapseAllOrders = () => {
    setExpandedOrders({});
  };

  // Data fetching
  const accountStatement = db.getAccountStatement(selectedAccountCode, startDate, endDate);
  const trialBalance = db.getTrialBalance();
  const incomeStatement = db.getIncomeStatement();
  const balanceSheet = db.getBalanceSheet();
  const vehicleStats = db.getVehicleProfitStats();

  // Vehicle Detailed Report Fetching
  const effectiveVehStartDate = isDateLimitActive ? vehStartDate : undefined;
  const effectiveVehEndDate = isDateLimitActive ? vehEndDate : undefined;

  const vehicleMovements = db.getVehicleAccountMovements(selectedVehicleId, effectiveVehStartDate, effectiveVehEndDate);
  const vehicleShipmentsDetailed = db.getVehicleShipmentOrdersDetailed(selectedVehicleId, effectiveVehStartDate, effectiveVehEndDate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <span>التقارير المالية والتشغيلية (Financial Reports)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            كشوفات الحسابات، تقارير المركبات التفصيلية، ميزان المراجعة، قائمة الدخل، والميزانية العمومية.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>طباعة التقرير الحالي</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveReport('vehicleDetails')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeReport === 'vehicleDetails'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>تقرير تفاصيل حساب المركبة</span>
        </button>

        <button
          onClick={() => setActiveReport('statement')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeReport === 'statement'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowDownUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>كشف حساب عام</span>
        </button>

        <button
          onClick={() => setActiveReport('vehicles')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeReport === 'vehicles'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>ملخص أرباح الأسطول</span>
        </button>

        <button
          onClick={() => setActiveReport('trial')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeReport === 'trial'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>ميزان المراجعة</span>
        </button>

        <button
          onClick={() => setActiveReport('income')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeReport === 'income'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>قائمة الدخل</span>
        </button>

        <button
          onClick={() => setActiveReport('balance')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeReport === 'balance'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>الميزانية العمومية</span>
        </button>
      </div>

      {/* NEW REPORT: Vehicle Account Details & Shipment Orders Report */}
      {activeReport === 'vehicleDetails' && (
        <div className="space-y-6">
          {/* Top Control Bar: Vehicle Selection, Date Range Option, Report Type */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end text-xs sm:text-sm">
              {/* Vehicle Selector */}
              <div className="lg:col-span-4">
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>اختر المركبة / الشاحنة المطلوبة:</span>
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
                >
                  {vehiclesList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_code} - {v.vehicle_name} ({v.vehicle_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Scope Mode (مطلق / تاريخ محدد) */}
              <div className="lg:col-span-3">
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>نطاق التاريخ:</span>
                </label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsDateLimitActive(false)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !isDateLimitActive
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    مطلق (جميع التواريخ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDateLimitActive(true)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isDateLimitActive
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    تاريخ محدد
                  </button>
                </div>
              </div>

              {/* Date Inputs if Specific Date Range is Selected */}
              {isDateLimitActive ? (
                <div className="lg:col-span-5 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">من تاريخ:</label>
                    <input
                      type="date"
                      value={vehStartDate}
                      onChange={(e) => setVehStartDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">إلى تاريخ:</label>
                    <input
                      type="date"
                      value={vehEndDate}
                      onChange={(e) => setVehEndDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div className="lg:col-span-5 flex items-center px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500 dark:text-slate-400 font-bold">
                  <span>✓ النطاق مطلق: يتم جلب كافة الحركات وأوامر الشحن بدون تقييد زمني.</span>
                </div>
              )}
            </div>

            {/* Report Display Mode Switcher */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">نوع التقرير المطلوب:</span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 sm:flex-none">
                  <button
                    type="button"
                    onClick={() => setVehicleReportMode('shipments')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      vehicleReportMode === 'shipments'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>عرض أوامر الشحن وتفاصيل الرحلات بالأسفل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVehicleReportMode('movements')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      vehicleReportMode === 'movements'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ListFilter className="w-4 h-4" />
                    <span>عرض جميع الحركات المالية للمركبة</span>
                  </button>
                </div>
              </div>

              {/* Quick Actions if Shipments Mode */}
              {vehicleReportMode === 'shipments' && vehicleShipmentsDetailed.orders.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => expandAllOrders(vehicleShipmentsDetailed.orders.map((o) => o.order.id!))}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    توسيع جميع الأوامر
                  </button>
                  <button
                    type="button"
                    onClick={collapseAllOrders}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    طي الجميع
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Info Header Card */}
          {vehicleShipmentsDetailed.vehicle && (
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl font-black">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-amber-500/20 text-amber-400 font-mono font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
                        {vehicleShipmentsDetailed.vehicle.vehicle_code}
                      </span>
                      <h3 className="text-lg font-bold text-white">{vehicleShipmentsDetailed.vehicle.vehicle_name}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      رقم اللوحة: <span className="font-mono text-white font-bold">{vehicleShipmentsDetailed.vehicle.vehicle_number}</span> |
                      مواصفات الشاحنة: <span className="text-amber-300">{vehicleShipmentsDetailed.vehicle.specifications || 'شاحنة نقل ثقيل'}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-left font-mono">
                  <span className="text-[11px] text-slate-400 block">الحساب الأستاذ القائم (مستوى 4):</span>
                  <span className="text-sm font-bold text-amber-400">{vehicleShipmentsDetailed.vehicle.account_code}</span>
                </div>
              </div>

              {/* Total Stats Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[11px] text-slate-400 block">عدد أوامر الشحن:</span>
                  <span className="text-base font-bold text-white">{vehicleShipmentsDetailed.orders.length} أمر شحن</span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[11px] text-slate-400 block">إجمالي إيرادات الرحلات:</span>
                  <span className="text-base font-bold text-emerald-400">
                    +{vehicleShipmentsDetailed.orders.reduce((sum, o) => sum + o.tripEqRevenue, 0).toLocaleString()} {basicCurrency.currency_symbol}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[11px] text-slate-400 block">إجمالي المصروفات التشغيلية:</span>
                  <span className="text-base font-bold text-rose-400">
                    -{vehicleShipmentsDetailed.orders.reduce((sum, o) => sum + o.totalEqExpenses, 0).toLocaleString()} {basicCurrency.currency_symbol}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[11px] text-slate-400 block">صافي أرباح الشاحنة:</span>
                  <span className="text-base font-black text-amber-400">
                    {(
                      vehicleShipmentsDetailed.orders.reduce((sum, o) => sum + o.tripEqRevenue, 0) -
                      vehicleShipmentsDetailed.orders.reduce((sum, o) => sum + o.totalEqExpenses, 0)
                    ).toLocaleString()}{' '}
                    {basicCurrency.currency_symbol}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* MODE 1: All Financial Movements Table */}
          {vehicleReportMode === 'movements' && vehicleMovements && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <ListFilter className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>جدول القيود والحركات المالية المباشرة للمركبة:</span>
                  </h4>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold">
                    إجمالي الحركات: {vehicleMovements.rows.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <thead className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">رقم السند</th>
                        <th className="p-3">اسم الحساب المقابل</th>
                        <th className="p-3">البيان والوصف</th>
                        <th className="p-3 text-emerald-700 dark:text-emerald-400">مدين (Debit)</th>
                        <th className="p-3 text-rose-700 dark:text-rose-400">دائن (Credit)</th>
                        <th className="p-3">العملة / الصرف</th>
                        <th className="p-3">مدين مكافئ</th>
                        <th className="p-3">دائن مكافئ</th>
                        <th className="p-3 bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 font-black">
                          الرصيد المكافئ القائم
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {vehicleMovements.rows.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs">
                            لا توجد أي حركات مالية مسجلة لهذه المركبة خلال الفترة المحددة.
                          </td>
                        </tr>
                      ) : (
                        vehicleMovements.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-mono">
                            <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                            <td className="p-3 font-sans text-slate-600 dark:text-slate-400">{row.entry_date}</td>
                            <td className="p-3 font-bold text-amber-700 dark:text-amber-400">#{row.voucher_number}</td>
                            <td className="p-3 font-sans font-bold text-slate-900 dark:text-slate-100">{row.account_name}</td>
                            <td className="p-3 font-sans text-slate-700 dark:text-slate-300 max-w-xs truncate" dir="auto" title={row.description}>
                              {row.description}
                            </td>
                            <td className="p-3 text-emerald-700 dark:text-emerald-400 font-bold">{row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
                            <td className="p-3 text-rose-700 dark:text-rose-400 font-bold">{row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
                            <td className="p-3 font-sans text-slate-600 dark:text-slate-400">
                              {row.currency_code} ({row.exchange_rate})
                            </td>
                            <td className="p-3 text-emerald-800 dark:text-emerald-300 font-bold">
                              {row.equivalent_debit > 0 ? row.equivalent_debit.toLocaleString() : '-'}
                            </td>
                            <td className="p-3 text-rose-800 dark:text-rose-300 font-bold">
                              {row.equivalent_credit > 0 ? row.equivalent_credit.toLocaleString() : '-'}
                            </td>
                            <td className="p-3 bg-amber-50/80 dark:bg-amber-950/40 font-black text-slate-950 dark:text-slate-100">
                              {row.running_eq_balance.toLocaleString()} {basicCurrency.currency_symbol}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-100 dark:bg-slate-800 font-mono font-black text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                      <tr>
                        <td colSpan={5} className="p-3 font-sans text-left">
                          إجمالي حركات الفترة:
                        </td>
                        <td className="p-3 text-emerald-700 dark:text-emerald-400">{vehicleMovements.totalDebit.toLocaleString()}</td>
                        <td className="p-3 text-rose-700 dark:text-rose-400">{vehicleMovements.totalCredit.toLocaleString()}</td>
                        <td className="p-3">-</td>
                        <td className="p-3 text-emerald-800 dark:text-emerald-300">{vehicleMovements.totalEqDebit.toLocaleString()}</td>
                        <td className="p-3 text-rose-800 dark:text-rose-300">{vehicleMovements.totalEqCredit.toLocaleString()}</td>
                        <td className="p-3 bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 text-sm">
                          {vehicleMovements.netEqBalance.toLocaleString()} {basicCurrency.currency_symbol}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: Shipment Orders Accordions List */}
          {vehicleReportMode === 'shipments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>قائمة أوامر الشحن الخاصة بالمركبة ({vehicleShipmentsDetailed.orders.length}):</span>
                </h4>

                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                    <span>أمر معتمد ومُرحّل مالياً</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                    <span>مسودة غير معتمدة</span>
                  </span>
                </div>
              </div>

              {vehicleShipmentsDetailed.orders.length === 0 ? (
                <div className="p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 dark:text-slate-500 text-xs">
                  لا توجد أي أوامر شحن مسجلة لهذه المركبة في النظام حالياً.
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicleShipmentsDetailed.orders.map((item) => {
                    const orderId = item.order.id!;
                    const isExpanded = !!expandedOrders[orderId];
                    const isPosted = item.order.is_financially_posted === 1;

                    return (
                      <div
                        key={orderId}
                        className={`rounded-2xl border-2 transition-all overflow-hidden ${
                          isPosted
                            ? 'bg-white dark:bg-slate-900 border-emerald-500 dark:border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-amber-500 dark:border-amber-600 shadow-sm'
                        }`}
                      >
                        {/* Collapsible Order Header Bar */}
                        <div
                          onClick={() => toggleOrderExpand(orderId)}
                          className={`p-4 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                            isPosted
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/60'
                              : 'bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100/70 dark:hover:bg-amber-950/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className={`p-2 rounded-xl text-slate-950 font-bold transition-transform ${
                                isPosted ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            >
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                                  {item.order.reference_number}
                                </span>

                                {/* Status Tag Rule */}
                                {isPosted ? (
                                  <span className="text-xs font-extrabold bg-emerald-600 text-white px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>معتمد ومُرحّل مالياً</span>
                                  </span>
                                ) : (
                                  <span className="text-xs font-extrabold bg-amber-500 text-slate-950 px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>مسودة غير معتمدة (في الانتظار)</span>
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>
                                  المسار: <strong className="text-slate-900 dark:text-white">{item.order.departure_point}</strong> ↔{' '}
                                  <strong className="text-slate-900 dark:text-white">{item.order.arrival_point}</strong> ({item.order.route || 'مسار مباشر'})
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-auto">
                            <div className="text-right">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">تاريخ الانطلاق:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{item.order.departure_date}</span>
                            </div>

                            <div className="text-right">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">قيمة الإيجار:</span>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                                {item.order.trip_amount.toLocaleString()} {item.order.trip_currency_code}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">صافي الربح:</span>
                              <span
                                className={`font-black text-sm ${
                                  item.netTripProfitEq >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {item.netTripProfitEq >= 0 ? '+' : ''}
                                {item.netTripProfitEq.toLocaleString()} {basicCurrency.currency_symbol}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Order Detailed Body */}
                        {isExpanded && (
                          <div className="p-5 space-y-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm animate-fade-in">
                            {/* Part A: Operational & Driver Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div>
                                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">اسم السائق المسؤول:</span>
                                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{item.order.driver_name || 'غير محدد'}</span>
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">نوع البضاعة المنقولة:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{item.order.goods_type || 'بضائع عامة'}</span>
                              </div>

                              <div>
                                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">وزن الحمولة / المسافة:</span>
                                <span className="font-bold font-mono text-slate-900 dark:text-white">
                                  {item.order.payload_weight} طن | {item.order.road_length} كم
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">تاريخ الوصول المتوقع:</span>
                                <span className="font-bold font-mono text-slate-900 dark:text-white">{item.order.arrival_date}</span>
                              </div>

                              <div className="md:col-span-2">
                                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">ملاحظات تشغيلية:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200" dir="auto">
                                  {item.order.notes || 'لا توجد ملاحظات إضافية'}
                                </span>
                              </div>
                            </div>

                            {/* Part B: Trip Revenue Entry Breakdown */}
                            <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl space-y-2">
                              <h5 className="font-bold text-emerald-950 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>بيان الإيراد الدائن (قيمة إيجار الرحلة من التاجر):</span>
                              </h5>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
                                <div>
                                  <span className="text-slate-600 dark:text-slate-400 block">حساب التاجر (المدين):</span>
                                  <span className="font-sans font-bold text-slate-900 dark:text-slate-100">
                                    {item.order.merchant_account_code} - {item.merchant_account_name}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-slate-600 dark:text-slate-400 block">المبلغ والعملة / سعر الصرف:</span>
                                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                    {item.order.trip_amount.toLocaleString()} {item.order.trip_currency_code} (بسعر {item.order.trip_exchange_rate})
                                  </span>
                                </div>

                                <div>
                                  <span className="text-slate-600 dark:text-slate-400 block">المقابل بالعملة الأساسية:</span>
                                  <span className="font-black text-emerald-800 dark:text-emerald-300 text-sm">
                                    {item.tripEqRevenue.toLocaleString()} {basicCurrency.currency_symbol}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Part C: Expenses Breakdown Table */}
                            <div className="space-y-2">
                              <h5 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                                <Fuel className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                <span>بنود المصروفات المدينة التفصيلية للرحلة (اصلاح للورشة/صندوق/وقود...):</span>
                              </h5>

                              {item.expenses.length === 0 ? (
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-slate-400 dark:text-slate-500 text-xs">
                                  لم يتم تسريب أي بنود مصروفات لهذا الأمر بعد.
                                </div>
                              ) : (
                                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                                  <table className="w-full text-right text-xs">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                                      <tr>
                                        <th className="p-2 w-8 text-center">#</th>
                                        <th className="p-2">الحساب الدائن (المستفيد)</th>
                                        <th className="p-2">التاريخ</th>
                                        <th className="p-2">المبلغ والعملة</th>
                                        <th className="p-2">سعر الصرف</th>
                                        <th className="p-2 text-rose-700 dark:text-rose-400">المقابل بالأساسية</th>
                                        <th className="p-2">وصف المصروف والبيان</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-mono">
                                      {item.expenses.map((exp, expIdx) => (
                                        <tr key={expIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                          <td className="p-2 text-center text-slate-400 font-bold">{expIdx + 1}</td>
                                          <td className="p-2 font-sans font-bold text-slate-900 dark:text-slate-100">
                                            {exp.account_code} - {exp.account_name}
                                          </td>
                                          <td className="p-2 font-sans text-slate-600 dark:text-slate-400">{exp.expense_date}</td>
                                          <td className="p-2 font-bold text-slate-800 dark:text-slate-200">
                                            {exp.amount.toLocaleString()} {exp.currency_code}
                                          </td>
                                          <td className="p-2 text-slate-500">{exp.exchange_rate}</td>
                                          <td className="p-2 font-black text-rose-700 dark:text-rose-400">
                                            {exp.equivalent_amount.toLocaleString()} {basicCurrency.currency_symbol}
                                          </td>
                                          <td className="p-2 font-sans text-slate-700 dark:text-slate-300" dir="auto">
                                            {exp.description || 'مصروف رحلة'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>

                            {/* Part D: Financial Impact Summary Calculator Box */}
                            <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono">
                              <div className="flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-amber-400" />
                                <div>
                                  <span className="font-sans font-bold text-xs text-amber-400 block">حصيلة أرباح أمر الشحن المالي:</span>
                                  <span className="text-xs text-slate-300">
                                    الإيرادات ({item.tripEqRevenue.toLocaleString()}) - المصروفات ({item.totalEqExpenses.toLocaleString()})
                                  </span>
                                </div>
                              </div>

                              <div className="text-left font-black text-base sm:text-lg">
                                <span className={item.netTripProfitEq >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                  صافي ربح الرحلة: {item.netTripProfitEq >= 0 ? '+' : ''}
                                  {item.netTripProfitEq.toLocaleString()} {basicCurrency.currency_symbol}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* REPORT 1: General Account Statement */}
      {activeReport === 'statement' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اختر الحساب التفصيلي (مستوى 4):</label>
              <select
                value={selectedAccountCode}
                onChange={(e) => setSelectedAccountCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
              >
                {level4Accounts.map((acc) => (
                  <option key={acc.id} value={acc.account_code}>
                    {acc.account_code} - {acc.account_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">من تاريخ:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">إلى تاريخ:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Account Statement Header Summary */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs text-amber-400 font-mono font-bold">كشف حساب تفصيلي</span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {accountStatement.account?.account_name} ({accountStatement.account?.account_code})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                النوع: {accountStatement.account?.account_type} | الفترة من {startDate} إلى {endDate}
              </p>
            </div>

            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-left font-mono">
              <span className="text-[11px] text-slate-400 block">الرصيد النهائي المكافئ:</span>
              <span className="text-xl font-black text-amber-400">
                {accountStatement.closingEqBalance.toLocaleString()} {basicCurrency.currency_symbol}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">رقم السند</th>
                    <th className="p-3">البيان والوصف</th>
                    <th className="p-3 text-emerald-700 dark:text-emerald-400">مدين (Debit)</th>
                    <th className="p-3 text-rose-700 dark:text-rose-400">دائن (Credit)</th>
                    <th className="p-3">العملة</th>
                    <th className="p-3">سعر الصرف</th>
                    <th className="p-3">مدين مكافئ</th>
                    <th className="p-3">دائن مكافئ</th>
                    <th className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 font-black">الرصيد المكافئ التراكمي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {accountStatement.rows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-slate-400 dark:text-slate-500">
                        لا توجد حركة حركات مالية مسجلة لهذا الحساب خلال الفترة المحددة.
                      </td>
                    </tr>
                  ) : (
                    accountStatement.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-mono">
                        <td className="p-3 font-sans text-slate-600 dark:text-slate-400">{row.entry_date}</td>
                        <td className="p-3 font-bold text-amber-700 dark:text-amber-400">#{row.voucher_number}</td>
                        <td className="p-3 font-sans font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate" dir="auto" title={row.description}>
                          {row.description}
                        </td>
                        <td className="p-3 text-emerald-700 dark:text-emerald-400 font-bold">{row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
                        <td className="p-3 text-rose-700 dark:text-rose-400 font-bold">{row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
                        <td className="p-3 font-sans font-bold text-slate-700 dark:text-slate-300">{row.currency_code}</td>
                        <td className="p-3 text-slate-500">{row.exchange_rate}</td>
                        <td className="p-3 text-emerald-800 dark:text-emerald-300 font-bold">
                          {row.equivalent_debit > 0 ? row.equivalent_debit.toLocaleString() : '-'}
                        </td>
                        <td className="p-3 text-rose-800 dark:text-rose-300 font-bold">
                          {row.equivalent_credit > 0 ? row.equivalent_credit.toLocaleString() : '-'}
                        </td>
                        <td className="p-3 bg-amber-50/60 dark:bg-amber-950/40 font-black text-slate-950 dark:text-slate-100">
                          {row.running_eq_balance.toLocaleString()} {basicCurrency.currency_symbol}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT: Fleet Profit Summary */}
      {activeReport === 'vehicles' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">تقرير ملخص أرباح وإيرادات شاحنات الأسطول</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  تفاصيل الإيرادات والمصروفات وصافي الأرباح التراكمية لكل مركبة من واقع أوامر الشحن المعتمدة.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="p-3">الكود الداخلي</th>
                    <th className="p-3">اسم الشاحنة</th>
                    <th className="p-3">رقم اللوحة</th>
                    <th className="p-3">الحساب المرتبط (مستوى 4)</th>
                    <th className="p-3 text-emerald-300">إجمالي الإيرادات</th>
                    <th className="p-3 text-rose-300">إجمالي المصروفات</th>
                    <th className="p-3 bg-slate-800 text-amber-400">صافي ربح الشاحنة</th>
                    <th className="p-3">آخر تغيير زيت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {vehicleStats.map((v) => (
                    <tr key={v.vehicle.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-mono">
                      <td className="p-3 font-bold text-amber-700 dark:text-amber-400">{v.vehicle.vehicle_code}</td>
                      <td className="p-3 font-sans font-bold text-slate-900 dark:text-slate-100">{v.vehicle.vehicle_name}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{v.vehicle.vehicle_number}</td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">{v.vehicle.account_code}</td>
                      <td className="p-3 text-emerald-700 dark:text-emerald-400 font-bold">{v.totalRevenueEq.toLocaleString()}</td>
                      <td className="p-3 text-rose-700 dark:text-rose-400 font-bold">{v.totalExpenseEq.toLocaleString()}</td>
                      <td className="p-3 bg-amber-50/50 dark:bg-amber-950/40 font-black text-amber-900 dark:text-amber-200 text-sm">
                        {v.netProfitEq >= 0 ? '+' : ''}
                        {v.netProfitEq.toLocaleString()} {basicCurrency.currency_symbol}
                      </td>
                      <td className="p-3 font-sans text-slate-600 dark:text-slate-400">{v.vehicle.last_oil_change_date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: Trial Balance */}
      {activeReport === 'trial' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">ميزان المراجعة بالمجاميع والأرصدة (Trial Balance)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  عرض كود الحساب، إجمالي الحركة المدينة والدائنة بالعملة الأساسية والأرصدة القائمة.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>الميزان متوازن ومطابق ✓</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="p-3">رمز الحساب</th>
                    <th className="p-3">اسم الحساب</th>
                    <th className="p-3">نوع الحساب</th>
                    <th className="p-3">المستوى</th>
                    <th className="p-3 text-emerald-300">مجموع مدين</th>
                    <th className="p-3 text-rose-300">مجموع دائن</th>
                    <th className="p-3 bg-slate-800 text-amber-400">صافي رصيد مدين</th>
                    <th className="p-3 bg-slate-800 text-amber-400">صافي رصيد دائن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {trialBalance.map((row) => (
                    <tr key={row.account_code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-mono">
                      <td className="p-3 font-bold text-amber-700 dark:text-amber-400">{row.account_code}</td>
                      <td className="p-3 font-sans font-bold text-slate-900 dark:text-slate-100">{row.account_name}</td>
                      <td className="p-3 font-sans text-slate-600 dark:text-slate-400 text-xs">{row.account_type}</td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">مستوى {row.account_level}</td>
                      <td className="p-3 text-emerald-700 dark:text-emerald-400 font-bold">{row.debit_eq.toLocaleString()}</td>
                      <td className="p-3 text-rose-700 dark:text-rose-400 font-bold">{row.credit_eq.toLocaleString()}</td>
                      <td className="p-3 bg-amber-50/40 dark:bg-amber-950/30 text-emerald-900 dark:text-emerald-200 font-black">
                        {row.balance_eq > 0 ? row.balance_eq.toLocaleString() : '-'}
                      </td>
                      <td className="p-3 bg-amber-50/40 dark:bg-amber-950/30 text-rose-900 dark:text-rose-200 font-black">
                        {row.balance_eq < 0 ? Math.abs(row.balance_eq).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 dark:bg-slate-800 font-mono font-black text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td colSpan={4} className="p-3 font-sans text-left">
                      الإجمالي العام:
                    </td>
                    <td className="p-3 text-emerald-800 dark:text-emerald-300 text-base">
                      {trialBalance.reduce((sum, r) => sum + r.debit_eq, 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-rose-800 dark:text-rose-300 text-base">
                      {trialBalance.reduce((sum, r) => sum + r.credit_eq, 0).toLocaleString()}
                    </td>
                    <td colSpan={2} className="p-3 text-amber-900 dark:text-amber-200 text-center">
                      فرق الميزان: {(trialBalance.reduce((sum, r) => sum + r.debit_eq, 0) - trialBalance.reduce((sum, r) => sum + r.credit_eq, 0)).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: Income Statement */}
      {activeReport === 'income' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">قائمة الدخل والأرباح والخسائر (Income Statement)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                عن الفترة المالية المنتهية اليوم بالعملة الأساسية ({basicCurrency.currency_code})
              </p>
            </div>

            {/* Revenues Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-base flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span>أولاً: إيرادات النشاط والخدمات (Revenues)</span>
                <span className="font-mono text-lg font-black">{incomeStatement.totalRevenuesEq.toLocaleString()} {basicCurrency.currency_symbol}</span>
              </h4>

              <div className="space-y-1.5 pr-4 text-xs font-mono">
                {incomeStatement.revenues.map((r) => (
                  <div key={r.account_code} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-sans text-slate-800 dark:text-slate-200 font-semibold">
                      {r.account_code} - {r.account_name}
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{r.amount_eq.toLocaleString()} {basicCurrency.currency_symbol}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-rose-800 dark:text-rose-300 text-base flex items-center justify-between bg-rose-50 dark:bg-rose-950/50 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                <span>ثانياً: المصروفات التكاليفية والتشغيلية (Expenses)</span>
                <span className="font-mono text-lg font-black">{incomeStatement.totalExpensesEq.toLocaleString()} {basicCurrency.currency_symbol}</span>
              </h4>

              <div className="space-y-1.5 pr-4 text-xs font-mono">
                {incomeStatement.expenses.map((e) => (
                  <div key={e.account_code} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-sans text-slate-800 dark:text-slate-200 font-semibold">
                      {e.account_code} - {e.account_name}
                    </span>
                    <span className="font-bold text-rose-700 dark:text-rose-400">{e.amount_eq.toLocaleString()} {basicCurrency.currency_symbol}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Profit Banner */}
            <div
              className={`p-5 rounded-2xl border flex items-center justify-between font-bold text-sm sm:text-lg ${
                incomeStatement.netIncomeEq >= 0
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                  : 'bg-rose-600 text-white border-rose-700 shadow-md'
              }`}
            >
              <span>صافي نتيجة النشاط (صافي الربح / الخسارة):</span>
              <span className="font-mono text-xl sm:text-2xl font-black">
                {incomeStatement.netIncomeEq >= 0 ? '+' : ''}
                {incomeStatement.netIncomeEq.toLocaleString()} {basicCurrency.currency_symbol}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 4: Balance Sheet */}
      {activeReport === 'balance' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">الميزانية العمومية والمركز المالي (Balance Sheet)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                توازن الأصول المادية مع الخصوم وحقوق الملكية للشركة بالعملة الأساسية
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assets Column */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-base pb-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span>الأصول والمتداولات (Assets)</span>
                  <span className="font-mono text-amber-700 dark:text-amber-400 font-black">{balanceSheet.totalAssetsEq.toLocaleString()}</span>
                </h4>

                <div className="space-y-2 text-xs font-mono">
                  {balanceSheet.assets.map((a) => (
                    <div key={a.account_code} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="font-sans font-bold text-slate-800 dark:text-slate-200">
                        {a.account_code} - {a.account_name}
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{a.amount_eq.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Liabilities & Equity Column */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-base pb-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span>الخصوم وحقوق الملكية (Liabilities & Equity)</span>
                  <span className="font-mono text-amber-700 dark:text-amber-400 font-black">{balanceSheet.totalLiabilitiesAndEquityEq.toLocaleString()}</span>
                </h4>

                <div className="space-y-2 text-xs font-mono">
                  {balanceSheet.liabilitiesAndEquity.map((l) => (
                    <div key={l.account_code} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="font-sans font-bold text-slate-800 dark:text-slate-200">
                        {l.account_code} - {l.account_name}
                      </span>
                      <span className="font-bold text-rose-700 dark:text-rose-400">{l.amount_eq.toLocaleString()}</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-2.5 bg-amber-100/70 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 font-bold rounded-lg border border-amber-200 dark:border-amber-800">
                    <span className="font-sans font-black">صافي ربح الفترة (من قائمة الدخل):</span>
                    <span className="font-mono text-sm font-black">{balanceSheet.netIncomeEq.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Check Equation */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between font-mono font-bold text-sm">
              <span>توازن معادلة الميزانية: الأصول = الخصوم + حقوق الملكية</span>
              <span className="text-amber-400 font-black">
                {balanceSheet.totalAssetsEq.toLocaleString()} = {balanceSheet.totalLiabilitiesAndEquityEq.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
