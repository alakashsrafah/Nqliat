import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../db/database';
import { ArrowUpRight, Plus, Trash2, CheckCircle, AlertCircle, Save, Calculator, Wallet } from 'lucide-react';

interface PaymentVoucherFormProps {
  currentUser: User | null;
  onSuccess: () => void;
}

interface ItemRow {
  account_code: string;
  amount: number;
  currency_code: string;
  exchange_rate: number;
  description: string;
}

export const PaymentVoucherForm: React.FC<PaymentVoucherFormProps> = ({ currentUser, onSuccess }) => {
  const level4Accounts = db.getAccounts().filter((a) => a.account_level === 4);
  const cashAccounts = level4Accounts.filter((a) => a.account_code.startsWith('1220') || a.account_name.includes('صندوق') || a.account_name.includes('بنك'));
  const currencies = db.getCurrencies();
  const basicCurrency = currencies.find((c) => c.currency_type === 'basic') || currencies[0];

  const [cashAccountCode, setCashAccountCode] = useState<string>(cashAccounts[0]?.account_code || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');

  const [items, setItems] = useState<ItemRow[]>([
    {
      account_code: '',
      amount: 0,
      currency_code: basicCurrency.currency_code,
      exchange_rate: basicCurrency.exchange_rate,
      description: '',
    },
  ]);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        account_code: '',
        amount: 0,
        currency_code: basicCurrency.currency_code,
        exchange_rate: basicCurrency.exchange_rate,
        description: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('يجب الإبقاء على بند واحد على الأقل بالسند');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'currency_code') {
      const selectedCurrency = currencies.find((c) => c.currency_code === value);
      if (selectedCurrency) {
        item.exchange_rate = selectedCurrency.exchange_rate;
      }
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!cashAccountCode) {
      setErrorMessage('يرجى اختيار صندوق أو بنك الصرف');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('يرجى إدخال البيان العام لسند الصرف');
      return;
    }

    if (items.some((it) => !it.account_code || it.amount <= 0 || it.exchange_rate <= 0)) {
      setErrorMessage('يرجى التأكد من تعبئة جميع بنود المصروفات بحساب صحيح ومبلغ وسعر صرف أكبر من صفر');
      return;
    }

    try {
      const result = db.createPaymentVoucher({
        cash_account_code: cashAccountCode,
        date,
        description: description.trim(),
        user_id: currentUser?.id || 1,
        items,
      });

      setSuccessMessage(`تم حفظ سند الصرف بنجاح برقم آلي (${result.header.number})`);
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ سند الصرف');
    }
  };

  const totalEquivalent = items.reduce((sum, item) => sum + (item.amount || 0) * (item.exchange_rate || 1), 0);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-600 dark:bg-rose-500 text-white rounded-xl shadow-md shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white">
              سند صرف نقدي جديد (Cash Payment)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              إثبات صرف ودفع النقدية من الصندوق مع إثبات القيود المدينة للموردين أو المصروفات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center font-mono">
          <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 px-3.5 py-1.5 rounded-xl text-right">
            <span className="text-[10px] text-rose-800 dark:text-rose-300 font-bold block">رقم السند القادم</span>
            <span className="text-base sm:text-lg font-black text-rose-700 dark:text-rose-400">
              #{db.getNextVoucherNumber(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-300 dark:border-rose-700 rounded-xl text-rose-900 dark:text-rose-100 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-900 dark:text-emerald-100 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* General Details Panel */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>البيانات الأساسية للصندوق والدفع</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cash Account */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                صندوق الصرف (حساب الصندوق الدائن) <span className="text-rose-600">*</span>:
              </label>
              <select
                required
                value={cashAccountCode}
                onChange={(e) => setCashAccountCode(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white font-bold text-xs sm:text-sm rounded-xl focus:border-rose-500 dark:focus:border-rose-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">-- اختر صندوق / بنك الصرف --</option>
                {cashAccounts.map((acc) => (
                  <option key={acc.id} value={acc.account_code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {acc.account_code} - {acc.account_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                تاريخ السند <span className="text-rose-600">*</span>:
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white font-mono font-bold text-xs sm:text-sm rounded-xl focus:border-rose-500 dark:focus:border-rose-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* General Description */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              البيان والوصف العام للسند (عربي / إنجليزي) <span className="text-rose-600">*</span>:
            </label>
            <input
              type="text"
              required
              dir="auto"
              placeholder="مثال: صرف ديزل ومصاريف صيانة وإعاشة شاحنة... / Cash payment for fuel expenses"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white font-bold text-xs sm:text-sm rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-rose-500 dark:focus:border-rose-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Dynamic Debit Items Container */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-950 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>تفاصيل البنود المدينة (المبالغ المصروفة)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                يمكنك تفنيد أوجه الصرف لعدة حسابات ومصروفات مختلفة داخل نفس السند
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="self-start sm:self-auto px-4 py-2 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-800 dark:text-rose-200 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 border-2 border-rose-300 dark:border-rose-700 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة بند صرف جديد</span>
            </button>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950/60 border-2 border-slate-200 dark:border-slate-800 rounded-2xl transition-all hover:border-slate-300 dark:hover:border-slate-700 space-y-3"
              >
                {/* Top row with Item Badge & Delete */}
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80 pb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 rounded-lg text-xs font-black">
                    بند صرف #{idx + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    title="حذف البند"
                    className="text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/80 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">حذف البند</span>
                  </button>
                </div>

                {/* Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                  {/* Account Selection */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      الحساب المدين (المصروف / المورد) <span className="text-rose-600">*</span>:
                    </label>
                    <select
                      required
                      value={item.account_code}
                      onChange={(e) => handleItemChange(idx, 'account_code', e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl font-bold text-xs sm:text-sm focus:border-rose-500 dark:focus:border-rose-400 focus:outline-none"
                    >
                      <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">-- اختر الحساب المدين --</option>
                      {level4Accounts.map((acc) => (
                        <option key={acc.id} value={acc.account_code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {acc.account_code} - {acc.account_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      المبلغ <span className="text-rose-600">*</span>:
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={item.amount === 0 ? '' : item.amount}
                      onChange={(e) => handleItemChange(idx, 'amount', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl font-mono font-black text-sm sm:text-base focus:border-rose-500 dark:focus:border-rose-400 focus:outline-none"
                    />
                  </div>

                  {/* Currency */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      العملة:
                    </label>
                    <select
                      value={item.currency_code}
                      onChange={(e) => handleItemChange(idx, 'currency_code', e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl font-bold text-xs sm:text-sm focus:border-rose-500 dark:focus:border-rose-400 focus:outline-none"
                    >
                      {currencies.map((c) => (
                        <option key={c.id} value={c.currency_code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {c.currency_code} ({c.currency_symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Exchange Rate */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      سعر الصرف (مقابل الأساس):
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      required
                      value={item.exchange_rate}
                      onChange={(e) => handleItemChange(idx, 'exchange_rate', parseFloat(e.target.value) || 1)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl font-mono font-bold text-xs sm:text-sm focus:border-rose-500 dark:focus:border-rose-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Second Line: Row Notes + Equivalent Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
                  <div className="sm:col-span-8 space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      ملاحظة أو بيان خاص بهذا البند (اختياري عربي / EN):
                    </label>
                    <input
                      type="text"
                      dir="auto"
                      placeholder="بيان تفصيلي للبند..."
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white rounded-lg text-xs font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-rose-500 dark:focus:border-rose-400 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4 flex items-center justify-between sm:justify-end gap-2 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 px-3 py-2 rounded-xl">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">المكافئ:</span>
                    <span className="font-mono font-black text-rose-800 dark:text-rose-300 text-sm sm:text-base">
                      {((item.amount || 0) * (item.exchange_rate || 1)).toLocaleString()} {basicCurrency.currency_symbol}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Equivalent Summary Card */}
          <div className="p-4 sm:p-5 bg-rose-50 dark:bg-rose-950/50 rounded-2xl border-2 border-rose-300 dark:border-rose-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 text-rose-950 dark:text-rose-200 font-bold text-xs sm:text-sm">
              <Calculator className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>إجمالي صرف النقدية المكافئ بالعملة الأساسية ({basicCurrency.currency_name}):</span>
            </div>
            <div className="text-xl sm:text-3xl font-black font-mono text-rose-800 dark:text-rose-300 tracking-tight">
              {totalEquivalent.toLocaleString()}{' '}
              <span className="text-xs sm:text-sm font-normal text-rose-900 dark:text-rose-200">
                {basicCurrency.currency_symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onSuccess}
            className="w-full sm:w-auto px-6 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-sm transition-colors cursor-pointer text-center"
          >
            إلغاء التراجع
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ وترحيل سند الصرف</span>
          </button>
        </div>
      </form>
    </div>
  );
};
