import React, { useState } from 'react';
import { User, ChartOfAccount, Currency } from '../types';
import { db } from '../db/database';
import { ArrowDownLeft, Plus, Trash2, CheckCircle, AlertCircle, Save, Calculator } from 'lucide-react';

interface ReceiptVoucherFormProps {
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

export const ReceiptVoucherForm: React.FC<ReceiptVoucherFormProps> = ({ currentUser, onSuccess }) => {
  const level4Accounts = db.getAccounts().filter((a) => a.account_level === 4);
  const cashAccounts = level4Accounts.filter((a) => a.account_code.startsWith('1220') || a.account_name.includes('صندوق') || a.account_name.includes('بنك'));
  const currencies = db.getCurrencies();
  const basicCurrency = currencies.find((c) => c.currency_type === 'basic') || currencies[0];

  const [cashAccountCode, setCashAccountCode] = useState<string>('');
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

    // Auto set exchange rate when currency changes
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

    if (!description.trim()) {
      setErrorMessage('يرجى إدخال الوصف العام لسند القبض');
      return;
    }

    if (items.some((it) => !it.account_code || it.amount <= 0 || it.exchange_rate <= 0)) {
      setErrorMessage('يرجى التأكد من تعبئة جميع بنود المقبوضات بمبالغ وأسعار صرف أكبر من صفر');
      return;
    }

    try {
      const result = db.createReceiptVoucher({
        cash_account_code: cashAccountCode,
        date,
        description: description.trim(),
        user_id: currentUser?.id || 1,
        items,
      });

      setSuccessMessage(`تم حفظ سند القبض بنجاح برقم آلي (${result.header.number})`);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ سند القبض');
    }
  };

  const totalEquivalent = items.reduce((sum, item) => sum + (item.amount || 0) * (item.exchange_rate || 1), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">سند قبض نقدي جديد (Cash Receipt)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              تسجيل المبالغ المقبوضة نقدياً لحساب الصندوق مع إثبات القيود الدائنة للعملاء أو الإيرادات فورياً.
            </p>
          </div>
        </div>

        <div className="text-left font-mono">
          <div className="text-xs text-slate-400">رقم السند القادم:</div>
          <div className="text-lg font-bold text-emerald-700">#{db.getNextVoucherNumber(1)}</div>
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
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">صندوق الاستلام (حساب الصندوق المدين):</label>
              <select
                value={cashAccountCode}
                onChange={(e) => setCashAccountCode(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
              >
                <option value="">-- اختر صندوق / بنك الاستلام --</option>
                {cashAccounts.map((acc) => (
                  <option key={acc.id} value={acc.account_code}>
                    {acc.account_code} - {acc.account_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">تاريخ السند:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">الوصف العام والبيان للسند:</label>
            <input
              type="text"
              required
              dir="auto"
              placeholder="مثال: قبض مبلغ مقابل إيجارات ونقل بضائع شحنة..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>
        </div>

        {/* Dynamic Credit Items Table */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span>تفاصيل البنود الدائنة (المبالغ المقبوضة)</span>
            </h3>

            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 font-bold rounded-xl text-xs flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صف بند دائن</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs text-slate-900 dark:text-slate-100"
              >
                <div className="sm:col-span-4">
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">الحساب الدائن (المقابل):</label>
                  <select
                    value={item.account_code}
                    onChange={(e) => handleItemChange(idx, 'account_code', e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-bold"
                  >
                    <option value="">-- اختر الحساب الدائن --</option>
                    {level4Accounts.map((acc) => (
                      <option key={acc.id} value={acc.account_code}>
                        {acc.account_code} - {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">المبلغ:</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={item.amount === 0 ? '' : item.amount}
                    onChange={(e) => handleItemChange(idx, 'amount', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">العملة:</label>
                  <select
                    value={item.currency_code}
                    onChange={(e) => handleItemChange(idx, 'currency_code', e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-slate-100"
                  >
                    {currencies.map((c) => (
                      <option key={c.id} value={c.currency_code}>
                        {c.currency_code} ({c.currency_symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">سعر الصرف:</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={item.exchange_rate}
                    onChange={(e) => handleItemChange(idx, 'exchange_rate', parseFloat(e.target.value) || 1)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between gap-1 pt-3 sm:pt-0">
                  <div className="text-left leading-none">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block">المكافئ:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                      {(item.amount * item.exchange_rate).toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total Equivalent Summary */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <span>الإجمالي المكافئ للسند بالعملة الأساسية:</span>
            </div>
            <div className="text-lg sm:text-2xl font-black font-mono text-emerald-800">
              {totalEquivalent.toLocaleString()} <span className="text-xs font-normal">{basicCurrency.currency_symbol}</span>
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
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>حفظ سند القبض المباشر</span>
          </button>
        </div>
      </form>
    </div>
  );
};
