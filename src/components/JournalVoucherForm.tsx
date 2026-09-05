import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../db/database';
import { GitCommit, Plus, Trash2, CheckCircle, AlertCircle, Save, Scale, Calendar, FileSpreadsheet } from 'lucide-react';

interface JournalVoucherFormProps {
  currentUser: User | null;
  onSuccess: () => void;
}

interface JournalRow {
  account_code: string;
  debit: number;
  credit: number;
  currency_code: string;
  exchange_rate: number;
  description: string;
}

export const JournalVoucherForm: React.FC<JournalVoucherFormProps> = ({ currentUser, onSuccess }) => {
  const level4Accounts = db.getAccounts().filter((a) => a.account_level === 4);
  const currencies = db.getCurrencies();
  const basicCurrency = currencies.find((c) => c.currency_type === 'basic') || currencies[0];

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');

  const [items, setItems] = useState<JournalRow[]>([
    {
      account_code: '',
      debit: 0,
      credit: 0,
      currency_code: basicCurrency.currency_code,
      exchange_rate: basicCurrency.exchange_rate,
      description: '',
    },
    {
      account_code: '',
      debit: 0,
      credit: 0,
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
        debit: 0,
        credit: 0,
        currency_code: basicCurrency.currency_code,
        exchange_rate: basicCurrency.exchange_rate,
        description: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 2) {
      alert('قيد اليومية يجب أن يحتوي على طرفين على الأقل (مدين ودائن)');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof JournalRow, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'currency_code') {
      const selectedCurrency = currencies.find((c) => c.currency_code === value);
      if (selectedCurrency) {
        item.exchange_rate = selectedCurrency.exchange_rate;
      }
    }

    // Auto clear opposing field if debit > 0 or credit > 0
    if (field === 'debit' && value > 0) {
      item.credit = 0;
    } else if (field === 'credit' && value > 0) {
      item.debit = 0;
    }

    updated[index] = item;
    setItems(updated);
  };

  const totalEqDebit = items.reduce((sum, item) => sum + (item.debit || 0) * (item.exchange_rate || 1), 0);
  const totalEqCredit = items.reduce((sum, item) => sum + (item.credit || 0) * (item.exchange_rate || 1), 0);
  const diff = Math.abs(totalEqDebit - totalEqCredit);
  const isBalanced = diff < 0.01 && totalEqDebit > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!description.trim()) {
      setErrorMessage('يرجى إدخال البيان العام لقيد اليومية');
      return;
    }

    if (items.some((it) => !it.account_code || (it.debit <= 0 && it.credit <= 0))) {
      setErrorMessage('يرجى التأكد من تحديد الحساب وإدخال مبلغ (مدين أو دائن) لكل طرف في القيد');
      return;
    }

    if (!isBalanced) {
      setErrorMessage(
        `القيد غير متوازن! إجمالي المدين المكافئ (${totalEqDebit.toLocaleString()}) لا يساوي إجمالي الدائن المكافئ (${totalEqCredit.toLocaleString()}) - الفارق: ${diff.toLocaleString()}`
      );
      return;
    }

    try {
      const result = db.createJournalVoucher({
        date,
        description: description.trim(),
        user_id: currentUser?.id || 1,
        items,
      });

      setSuccessMessage(`تم حفظ قيد اليومية بنجاح برقم آلي (${result.header.number})`);
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ القيد اليومي');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl shadow-md shrink-0">
            <GitCommit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white">
              إضافة قيد يومية عام (Journal Entry)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              تسجيل التسويات المحاسبية ونقل الأرصدة المباشرة بين الحسابات بدقة وتوازن مزدوج
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center font-mono">
          <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 px-3.5 py-1.5 rounded-xl text-right">
            <span className="text-[10px] text-blue-800 dark:text-blue-300 font-bold block">رقم القيد القادم</span>
            <span className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-400">
              #{db.getNextVoucherNumber(3)}
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
            <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>البيانات الأساسية للقيد</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                تاريخ القيد <span className="text-rose-600">*</span>:
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white font-mono font-bold text-xs sm:text-sm rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
              />
            </div>

            {/* General Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                البيان والوصف العام للقيد (عربي / إنجليزي) <span className="text-rose-600">*</span>:
              </label>
              <input
                type="text"
                required
                dir="auto"
                placeholder="مثال: تسوية حساب العميل مع حساب المصروفات... / Journal adjustment entry"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white font-bold text-xs sm:text-sm rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Journal Entries Container */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-950 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>أطراف القيد المحاسبي (مدين / دائن)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                أدخل أطراف القيد مع التأكد من تساوي إجمالي المدين المكافئ مع الدائن المكافئ
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="self-start sm:self-auto px-4 py-2 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-800 dark:text-blue-200 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 border-2 border-blue-300 dark:border-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة طرف قيد</span>
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
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-lg text-xs font-black">
                      طرف #{idx + 1}
                    </span>
                    {item.debit > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-300 dark:border-emerald-800">
                        طرف مدين
                      </span>
                    )}
                    {item.credit > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 rounded-md border border-rose-300 dark:border-rose-800">
                        طرف دائن
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    title="حذف الطرف"
                    className="text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/80 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">حذف</span>
                  </button>
                </div>

                {/* Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                  {/* Account Selection */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      الحساب المحاسبي (مستوى 4) <span className="text-rose-600">*</span>:
                    </label>
                    <select
                      required
                      value={item.account_code}
                      onChange={(e) => handleItemChange(idx, 'account_code', e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl font-bold text-xs sm:text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
                    >
                      <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">-- اختر الحساب المحاسبي --</option>
                      {level4Accounts.map((acc) => (
                        <option key={acc.id} value={acc.account_code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {acc.account_code} - {acc.account_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Debit Amount */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-400">
                      مدين (Debit):
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={item.debit === 0 ? '' : item.debit}
                      onChange={(e) => handleItemChange(idx, 'debit', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-emerald-800 dark:text-emerald-300 rounded-xl font-mono font-black text-sm sm:text-base focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  {/* Credit Amount */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[11px] font-bold text-rose-800 dark:text-rose-400">
                      دائن (Credit):
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={item.credit === 0 ? '' : item.credit}
                      onChange={(e) => handleItemChange(idx, 'credit', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-rose-800 dark:text-rose-300 rounded-xl font-mono font-black text-sm sm:text-base focus:border-rose-500 dark:focus:border-rose-400 focus:outline-none"
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
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl font-bold text-xs sm:text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
                    >
                      {currencies.map((c) => (
                        <option key={c.id} value={c.currency_code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {c.currency_code} ({c.currency_symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Exchange Rate */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      سعر الصرف:
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      required
                      value={item.exchange_rate}
                      onChange={(e) => handleItemChange(idx, 'exchange_rate', parseFloat(e.target.value) || 1)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl font-mono font-bold text-xs sm:text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Second Line: Row Notes + Equivalent Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
                  <div className="sm:col-span-7 space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      ملاحظة أو بيان خاص بهذا الطرف (اختياري عربي / EN):
                    </label>
                    <input
                      type="text"
                      dir="auto"
                      placeholder="بيان تفصيلي للطرف..."
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white rounded-lg text-xs font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-5 flex flex-wrap items-center justify-between sm:justify-end gap-2 bg-slate-100 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    {item.debit > 0 && (
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-slate-500 dark:text-slate-400">مدين مكافئ:</span>
                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">
                          {((item.debit || 0) * (item.exchange_rate || 1)).toLocaleString()} {basicCurrency.currency_symbol}
                        </span>
                      </div>
                    )}
                    {item.credit > 0 && (
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-slate-500 dark:text-slate-400">دائن مكافئ:</span>
                        <span className="font-mono font-black text-rose-700 dark:text-rose-400">
                          {((item.credit || 0) * (item.exchange_rate || 1)).toLocaleString()} {basicCurrency.currency_symbol}
                        </span>
                      </div>
                    )}
                    {item.debit === 0 && item.credit === 0 && (
                      <span className="text-slate-400 text-[11px]">أدخل قيمة المدين أو الدائن</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Balance Indicator Banner */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm transition-colors ${
              isBalanced
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-700 text-rose-950 dark:text-rose-100'
            }`}
          >
            <div className="flex items-center gap-3 font-bold text-xs sm:text-sm">
              <Scale className={`w-6 h-6 shrink-0 ${isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
              <div>
                <div className="text-sm sm:text-base font-black">
                  {isBalanced ? 'القيد متوازن محاسبياً تماماً ✓' : 'القيد غير متوازن حالياً ✕'}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {isBalanced
                    ? 'أطراف القيد متطابقة في المبالغ المكافئة بالعملة الأساسية ويمكنك الحفظ الآن.'
                    : `يوجد فارق قدره (${diff.toLocaleString()} ${basicCurrency.currency_symbol}) بين طرفي المدين والدائن.`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 font-mono font-bold text-xs sm:text-sm bg-white/70 dark:bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">إجمالي مدين مكافئ</span>
                <span className="text-emerald-700 dark:text-emerald-400 text-sm sm:text-base font-black">
                  {totalEqDebit.toLocaleString()} {basicCurrency.currency_symbol}
                </span>
              </div>

              <div className="w-px h-8 bg-slate-300 dark:bg-slate-700" />

              <div className="text-right">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">إجمالي دائن مكافئ</span>
                <span className="text-rose-700 dark:text-rose-400 text-sm sm:text-base font-black">
                  {totalEqCredit.toLocaleString()} {basicCurrency.currency_symbol}
                </span>
              </div>
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
            disabled={!isBalanced}
            className={`w-full sm:w-auto px-8 py-3 font-black rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 ${
              isBalanced
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 cursor-pointer'
                : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>حفظ وترحيل قيد اليومية</span>
          </button>
        </div>
      </form>
    </div>
  );
};
