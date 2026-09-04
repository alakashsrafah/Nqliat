import React, { useState } from 'react';
import { Currency, CurrencyType } from '../types';
import { db } from '../db/database';
import { DollarSign, Plus, Edit3, Trash2, AlertCircle, CheckCircle, RefreshCw, X } from 'lucide-react';

export const CurrenciesManager: React.FC = () => {
  const [currencies, setCurrencies] = useState<Currency[]>(db.getCurrencies());

  const [isAddOpen, setIsAddModalOpen] = useState(false);
  const [editCurrency, setEditCurrency] = useState<Currency | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<CurrencyType>('foreign');
  const [symbol, setSymbol] = useState('');
  const [rate, setRate] = useState<number>(1.0);
  const [details, setDetails] = useState('');

  const [editRate, setEditRate] = useState<number>(1.0);
  const [editDetails, setEditDetails] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const refreshCurrencies = () => {
    setCurrencies(db.getCurrencies());
  };

  const handleOpenAdd = () => {
    setName('');
    setCode('');
    setType('foreign');
    setSymbol('');
    setRate(1.0);
    setDetails('');
    setErrorMessage('');
    setSuccessMessage('');
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || !code.trim() || !symbol.trim()) {
      setErrorMessage('يرجى تعبئة كافة الحقول المطلوبة (اسم العملة، الرمز، العلامة)');
      return;
    }

    try {
      const added = db.addCurrency({
        currency_name: name.trim(),
        currency_code: code.trim().toUpperCase(),
        currency_type: type,
        currency_symbol: symbol.trim(),
        exchange_rate: type === 'basic' ? 1.0 : rate,
        details: details.trim(),
      });

      refreshCurrencies();
      setIsAddModalOpen(false);
      setSuccessMessage(`تم إضافة العملة (${added.currency_name}) بنجاح`);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إضافة العملة');
    }
  };

  const handleOpenEdit = (curr: Currency) => {
    setEditCurrency(curr);
    setEditRate(curr.exchange_rate);
    setEditDetails(curr.details || '');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCurrency) return;
    setErrorMessage('');
    setSuccessMessage('');

    try {
      db.updateCurrencyRate(editCurrency.id, editRate, editDetails.trim());
      refreshCurrencies();
      setEditCurrency(null);
      setSuccessMessage(`تم تحديث سعر صرف عملة (${editCurrency.currency_code}) إلى ${editRate}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل التحديث');
    }
  };

  const handleDelete = (curr: Currency) => {
    setErrorMessage('');
    setSuccessMessage('');

    if (window.confirm(`هل أنت متأكد من حذف العملة ${curr.currency_name} (${curr.currency_code})؟`)) {
      try {
        db.deleteCurrency(curr.id);
        refreshCurrencies();
        setSuccessMessage(`تم حذف العملة ${curr.currency_code} بنجاح`);
      } catch (err: any) {
        setErrorMessage(err.message || 'فشل الحذف');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-600" />
            <span>إدارة العملات وأسعار الصرف (Currencies)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تعريف العملة الأساسية للنظام (سعر صرف 1.0) والعملات الأجنبية المستخدمة مع أسعار صرفها المحدثة.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عملة جديدة</span>
        </button>
      </div>

      {/* Notifications */}
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

      {/* Currencies Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">اسم العملة</th>
                <th className="p-4">الرمز</th>
                <th className="p-4">علامة العملة</th>
                <th className="p-4">النوع</th>
                <th className="p-4">سعر الصرف مقابل الأساسية</th>
                <th className="p-4">ملاحظات والتفاصيل</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currencies.map((curr, idx) => (
                <tr key={curr.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-500">{idx + 1}</td>
                  <td className="p-4 font-bold text-slate-900">{curr.currency_name}</td>
                  <td className="p-4 font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg w-max">
                    {curr.currency_code}
                  </td>
                  <td className="p-4 font-bold text-slate-800 text-base">{curr.currency_symbol}</td>
                  <td className="p-4">
                    {curr.currency_type === 'basic' ? (
                      <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full text-xs font-black">
                        العملة الأساسية (basic)
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-900 px-2.5 py-1 rounded-full text-xs font-bold">
                        عملة أجنبية (foreign)
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-900">
                    {curr.exchange_rate.toLocaleString()} {curr.currency_type === 'basic' ? '' : 'ريال يمني'}
                  </td>
                  <td className="p-4 text-slate-500 text-xs">{curr.details || '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {curr.currency_type === 'foreign' ? (
                        <button
                          onClick={() => handleOpenEdit(curr)}
                          title="تعديل سعر الصرف"
                          className="p-2 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                          <span>تعديل الصرف</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">أساسية (1.0)</span>
                      )}

                      {curr.currency_type === 'foreign' && (
                        <button
                          onClick={() => handleDelete(curr)}
                          title="حذف العملة"
                          className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Currency Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-600" />
                <span>إضافة عملة جديدة</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم العملة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دينار كويتي، يورو..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرمز المختصر:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: EUR, KWD"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">علامة العملة:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: €، د.ك"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع العملة:</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CurrencyType)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                >
                  <option value="foreign">عملة أجنبية (foreign)</option>
                  <option value="basic">عملة أساسية (basic - يجب ألا توجد عملة أساسية غيرها)</option>
                </select>
              </div>

              {type === 'foreign' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر الصرف مقابل العملة الأساسية:</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">تفاصيل / ملاحظات (اختياري):</label>
                <input
                  type="text"
                  placeholder="ملاحظات حول العملة..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm"
                >
                  إضافة العملة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Currency Rate Modal */}
      {editCurrency && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-600" />
                <span>تحديث سعر صرف عملة ({editCurrency.currency_name})</span>
              </h3>
              <button onClick={() => setEditCurrency(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs sm:text-sm">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 leading-snug">
                <div className="font-bold">كود العملة: {editCurrency.currency_code}</div>
                <div className="text-[11px] text-amber-800">
                  سعر الصرف الحالي: {editCurrency.exchange_rate}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">سعر الصرف الجديد مقابل الأساسية:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.0001"
                  required
                  value={editRate}
                  onChange={(e) => setEditRate(parseFloat(e.target.value) || 1)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold text-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب التعديل / ملاحظات:</label>
                <input
                  type="text"
                  placeholder="سبب التعديل..."
                  value={editDetails}
                  onChange={(e) => setEditDetails(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditCurrency(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm"
                >
                  حفظ سعر الصرف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
