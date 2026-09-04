import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../db/database';
import { GitCommit, Plus, Trash2, CheckCircle, AlertCircle, Save, Scale } from 'lucide-react';

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

    // Ensure if debit > 0, credit = 0 or vice versa for simple entry unless explicitly set
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
  const isBalanced = Math.abs(totalEqDebit - totalEqCredit) < 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!description.trim()) {
      setErrorMessage('يرجى إدخال الوصف والبيان العام للقيد اليومي');
      return;
    }

    if (!isBalanced) {
      setErrorMessage(
        `القيد غير متوازن! إجمالي المدين المكافئ (${totalEqDebit.toLocaleString()}) لا يساوي إجمالي الدائن المكافئ (${totalEqCredit.toLocaleString()})`
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
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ القيد اليومي');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
            <GitCommit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">إضافة قيد يومية بسيط (Journal Entry)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              تسجيل التسويات المالية المباشرة بين حسابين أو أكثر دون التأثير المباشر على صندوق النقدية.
            </p>
          </div>
        </div>

        <div className="text-left font-mono">
          <div className="text-xs text-slate-400">رقم القيد القادم:</div>
          <div className="text-lg font-bold text-blue-700">#{db.getNextVoucherNumber(3)}</div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Settings Panel */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">تاريخ القيد:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">البيان والوصف العام للقيد:</label>
              <input
                type="text"
                required
                dir="auto"
                placeholder="مثال: تسوية حساب العميل س مع حساب ص..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Journal Entries Table */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>بنود القيد المحاسبي (أطراف القيد)</span>
            </h3>

            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-800 dark:text-blue-200 font-bold rounded-xl text-xs flex items-center gap-1 border border-blue-200 dark:border-blue-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة طرف قيد</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs text-slate-900 dark:text-slate-100"
              >
                <div className="sm:col-span-3">
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">اسم الحساب (مستوى 4):</label>
                  <select
                    value={item.account_code}
                    onChange={(e) => handleItemChange(idx, 'account_code', e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-bold"
                  >
                    <option value="">-- اختر الحساب --</option>
                    {level4Accounts.map((acc) => (
                      <option key={acc.id} value={acc.account_code}>
                        {acc.account_code} - {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">مدين (Debit):</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={item.debit === 0 ? '' : item.debit}
                    onChange={(e) => handleItemChange(idx, 'debit', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-emerald-700 dark:text-emerald-400 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">دائن (Credit):</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={item.credit === 0 ? '' : item.credit}
                    onChange={(e) => handleItemChange(idx, 'credit', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-rose-700 dark:text-rose-400 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">العملة والسعر:</label>
                  <div className="flex gap-1">
                    <select
                      value={item.currency_code}
                      onChange={(e) => handleItemChange(idx, 'currency_code', e.target.value)}
                      className="w-2/3 p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-[11px] font-bold"
                    >
                      {currencies.map((c) => (
                        <option key={c.id} value={c.currency_code}>
                          {c.currency_code}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={item.exchange_rate}
                      onChange={(e) => handleItemChange(idx, 'exchange_rate', parseFloat(e.target.value) || 1)}
                      className="w-1/3 p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-[11px] font-mono font-bold"
                      title="سعر الصرف"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3 flex items-center justify-between gap-1 pt-2 sm:pt-0">
                  <div className="text-left leading-none text-[10px]">
                    <div className="font-mono text-emerald-700">
                      مدين مكافئ: {(item.debit * item.exchange_rate).toLocaleString()}
                    </div>
                    <div className="font-mono text-rose-700 mt-1">
                      دائن مكافئ: {(item.credit * item.exchange_rate).toLocaleString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Balance Indicator Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
              <Scale className={`w-5 h-5 ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`} />
              <span>
                {isBalanced ? 'حالة التوازن المحاسبي: متوازن تماماً ✓' : 'حالة التوازن المحاسبي: غير متوازن! ✕'}
              </span>
            </div>

            <div className="flex items-center gap-6 font-mono font-bold text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 font-normal">إجمالي مدين: </span>
                <span className="text-emerald-700">{totalEqDebit.toLocaleString()} {basicCurrency.currency_symbol}</span>
              </div>
              <div>
                <span className="text-slate-500 font-normal">إجمالي دائن: </span>
                <span className="text-rose-700">{totalEqCredit.toLocaleString()} {basicCurrency.currency_symbol}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onSuccess}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
          >
            إلغاء
          </button>

          <button
            type="submit"
            disabled={!isBalanced}
            className={`px-6 py-2.5 font-bold rounded-xl text-sm transition-colors shadow-md flex items-center gap-2 active:scale-95 ${
              isBalanced
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>حفظ قيد اليومية</span>
          </button>
        </div>
      </form>
    </div>
  );
};
