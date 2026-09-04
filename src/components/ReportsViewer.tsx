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
  CheckCircle2
} from 'lucide-react';

type ReportTab = 'statement' | 'trial' | 'income' | 'balance' | 'vehicles';

export const ReportsViewer: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportTab>('statement');

  const level4Accounts = db.getAccounts().filter((a) => a.account_level === 4);
  const basicCurrency = db.getCurrencies().find((c) => c.currency_type === 'basic') || {
    currency_symbol: 'ر.ي',
    currency_code: 'YER',
  };

  // Statement Filters
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>(level4Accounts[0]?.account_code || '1210001');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Data fetching
  const accountStatement = db.getAccountStatement(selectedAccountCode, startDate, endDate);
  const trialBalance = db.getTrialBalance();
  const incomeStatement = db.getIncomeStatement();
  const balanceSheet = db.getBalanceSheet();
  const vehicleStats = db.getVehicleProfitStats();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-600" />
            <span>التقارير المالية والتشغيلية (Financial Reports)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            كشوفات الحسابات، ميزان المراجعة، قائمة الدخل، الميزانية العمومية وتقارير ربحية المركبات.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>طباعة التقرير الحالي</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveReport('statement')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeReport === 'statement' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowDownUp className="w-4 h-4 text-amber-600" />
          <span>كشف حساب</span>
        </button>

        <button
          onClick={() => setActiveReport('trial')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeReport === 'trial' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4 text-blue-600" />
          <span>ميزان المراجعة</span>
        </button>

        <button
          onClick={() => setActiveReport('income')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeReport === 'income' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>قائمة الدخل</span>
        </button>

        <button
          onClick={() => setActiveReport('balance')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeReport === 'balance' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PieChart className="w-4 h-4 text-purple-600" />
          <span>الميزانية العمومية</span>
        </button>

        <button
          onClick={() => setActiveReport('vehicles')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeReport === 'vehicles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4 text-amber-600" />
          <span>تقارير المركبات</span>
        </button>
      </div>

      {/* REPORT 1: Account Statement */}
      {activeReport === 'statement' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اختر الحساب التفصيلي (مستوى 4):</label>
              <select
                value={selectedAccountCode}
                onChange={(e) => setSelectedAccountCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
              >
                {level4Accounts.map((acc) => (
                  <option key={acc.id} value={acc.account_code}>
                    {acc.account_code} - {acc.account_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">من تاريخ:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">إلى تاريخ:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">رقم السند</th>
                    <th className="p-3">البيان والوصف</th>
                    <th className="p-3 text-emerald-700">مدين (Debit)</th>
                    <th className="p-3 text-rose-700">دائن (Credit)</th>
                    <th className="p-3">العملة</th>
                    <th className="p-3">سعر الصرف</th>
                    <th className="p-3">مدين مكافئ</th>
                    <th className="p-3">دائن مكافئ</th>
                    <th className="p-3 bg-amber-50 text-amber-950 font-black">الرصيد المكافئ التراكمي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accountStatement.rows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-slate-400">
                        لا توجد حركة حركات مالية مسجلة لهذا الحساب خلال الفترة المحددة.
                      </td>
                    </tr>
                  ) : (
                    accountStatement.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors font-mono">
                        <td className="p-3 font-sans text-slate-600">{row.entry_date}</td>
                        <td className="p-3 font-bold text-amber-700">#{row.voucher_number}</td>
                        <td className="p-3 font-sans font-medium text-slate-900 max-w-xs truncate">{row.description}</td>
                        <td className="p-3 text-emerald-700 font-bold">{row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
                        <td className="p-3 text-rose-700 font-bold">{row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
                        <td className="p-3 font-sans font-bold text-slate-700">{row.currency_code}</td>
                        <td className="p-3 text-slate-500">{row.exchange_rate}</td>
                        <td className="p-3 text-emerald-800 font-bold">{row.equivalent_debit > 0 ? row.equivalent_debit.toLocaleString() : '-'}</td>
                        <td className="p-3 text-rose-800 font-bold">{row.equivalent_credit > 0 ? row.equivalent_credit.toLocaleString() : '-'}</td>
                        <td className="p-3 bg-amber-50/60 font-black text-slate-950">
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

      {/* REPORT 2: Trial Balance */}
      {activeReport === 'trial' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">ميزان المراجعة بالمجاميع والأرصدة (Trial Balance)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  عرض كود الحساب، إجمالي الحركة المدينة والدائنة بالعملة الأساسية والأرصدة القائمة.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
                <tbody className="divide-y divide-slate-100">
                  {trialBalance.map((row) => (
                    <tr key={row.account_code} className="hover:bg-slate-50 transition-colors font-mono">
                      <td className="p-3 font-bold text-amber-700">{row.account_code}</td>
                      <td className="p-3 font-sans font-bold text-slate-900">{row.account_name}</td>
                      <td className="p-3 font-sans text-slate-600 text-xs">{row.account_type}</td>
                      <td className="p-3 text-slate-500">مستوى {row.account_level}</td>
                      <td className="p-3 text-emerald-700 font-bold">{row.debit_eq.toLocaleString()}</td>
                      <td className="p-3 text-rose-700 font-bold">{row.credit_eq.toLocaleString()}</td>
                      <td className="p-3 bg-amber-50/40 text-emerald-900 font-black">
                        {row.balance_eq > 0 ? row.balance_eq.toLocaleString() : '-'}
                      </td>
                      <td className="p-3 bg-amber-50/40 text-rose-900 font-black">
                        {row.balance_eq < 0 ? Math.abs(row.balance_eq).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-mono font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={4} className="p-3 font-sans text-left">
                      الإجمالي العام:
                    </td>
                    <td className="p-3 text-emerald-800 text-base">
                      {trialBalance.reduce((sum, r) => sum + r.debit_eq, 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-rose-800 text-base">
                      {trialBalance.reduce((sum, r) => sum + r.credit_eq, 0).toLocaleString()}
                    </td>
                    <td colSpan={2} className="p-3 text-amber-900 text-center">
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
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="text-center pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">قائمة الدخل والأرباح والخسائر (Income Statement)</h3>
              <p className="text-xs text-slate-500 mt-1">
                عن الفترة المالية المنتهية اليوم بالعملة الأساسية ({basicCurrency.currency_code})
              </p>
            </div>

            {/* Revenues Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-emerald-800 text-base flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span>أولاً: إيرادات النشاط والخدمات (Revenues)</span>
                <span className="font-mono text-lg font-black">{incomeStatement.totalRevenuesEq.toLocaleString()} {basicCurrency.currency_symbol}</span>
              </h4>

              <div className="space-y-1.5 pr-4 text-xs font-mono">
                {incomeStatement.revenues.map((r) => (
                  <div key={r.account_code} className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="font-sans text-slate-800 font-semibold">
                      {r.account_code} - {r.account_name}
                    </span>
                    <span className="font-bold text-emerald-700">{r.amount_eq.toLocaleString()} {basicCurrency.currency_symbol}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-rose-800 text-base flex items-center justify-between bg-rose-50 p-3 rounded-xl border border-rose-200">
                <span>ثانياً: المصروفات التكاليفية والتشغيلية (Expenses)</span>
                <span className="font-mono text-lg font-black">{incomeStatement.totalExpensesEq.toLocaleString()} {basicCurrency.currency_symbol}</span>
              </h4>

              <div className="space-y-1.5 pr-4 text-xs font-mono">
                {incomeStatement.expenses.map((e) => (
                  <div key={e.account_code} className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="font-sans text-slate-800 font-semibold">
                      {e.account_code} - {e.account_name}
                    </span>
                    <span className="font-bold text-rose-700">{e.amount_eq.toLocaleString()} {basicCurrency.currency_symbol}</span>
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
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="text-center pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">الميزانية العمومية والمركز المالي (Balance Sheet)</h3>
              <p className="text-xs text-slate-500 mt-1">
                توازن الأصول المادية مع الخصوم وحقوق الملكية للشركة بالعملة الأساسية
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assets Column */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-200 flex items-center justify-between">
                  <span>الأصول والمتداولات (Assets)</span>
                  <span className="font-mono text-amber-700 font-black">{balanceSheet.totalAssetsEq.toLocaleString()}</span>
                </h4>

                <div className="space-y-2 text-xs font-mono">
                  {balanceSheet.assets.map((a) => (
                    <div key={a.account_code} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                      <span className="font-sans font-bold text-slate-800">
                        {a.account_code} - {a.account_name}
                      </span>
                      <span className="font-bold text-emerald-700">{a.amount_eq.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Liabilities & Equity Column */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-200 flex items-center justify-between">
                  <span>الخصوم وحقوق الملكية (Liabilities & Equity)</span>
                  <span className="font-mono text-amber-700 font-black">{balanceSheet.totalLiabilitiesAndEquityEq.toLocaleString()}</span>
                </h4>

                <div className="space-y-2 text-xs font-mono">
                  {balanceSheet.liabilitiesAndEquity.map((l) => (
                    <div key={l.account_code} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                      <span className="font-sans font-bold text-slate-800">
                        {l.account_code} - {l.account_name}
                      </span>
                      <span className="font-bold text-rose-700">{l.amount_eq.toLocaleString()}</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-2.5 bg-amber-100/70 text-amber-950 font-bold rounded-lg border border-amber-200">
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

      {/* REPORT 5: Vehicle Profit Reports */}
      {activeReport === 'vehicles' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">تقرير إيرادات وأرباح شاحنات الأسطول</h3>
                <p className="text-xs text-slate-500 mt-0.5">
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
                <tbody className="divide-y divide-slate-100">
                  {vehicleStats.map((v) => (
                    <tr key={v.vehicle.id} className="hover:bg-slate-50 transition-colors font-mono">
                      <td className="p-3 font-bold text-amber-700">{v.vehicle.vehicle_code}</td>
                      <td className="p-3 font-sans font-bold text-slate-900">{v.vehicle.vehicle_name}</td>
                      <td className="p-3 text-slate-600">{v.vehicle.vehicle_number}</td>
                      <td className="p-3 text-slate-500">{v.vehicle.account_code}</td>
                      <td className="p-3 text-emerald-700 font-bold">{v.totalRevenueEq.toLocaleString()}</td>
                      <td className="p-3 text-rose-700 font-bold">{v.totalExpenseEq.toLocaleString()}</td>
                      <td className="p-3 bg-amber-50/50 font-black text-amber-900 text-sm">
                        {v.netProfitEq >= 0 ? '+' : ''}
                        {v.netProfitEq.toLocaleString()} {basicCurrency.currency_symbol}
                      </td>
                      <td className="p-3 font-sans text-slate-600">{v.vehicle.last_oil_change_date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
