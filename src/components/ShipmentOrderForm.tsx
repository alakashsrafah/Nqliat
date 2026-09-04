import React, { useState, useEffect } from 'react';
import { User, Driver, ShipmentOrder, ShipmentExpenseItem } from '../types';
import { db } from '../db/database';
import {
  Truck,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Save,
  Send,
  Calculator,
  MapPin,
  Calendar,
  UserCheck,
  UserPlus,
  Fuel,
  FileText,
  DollarSign,
  X,
  Edit3
} from 'lucide-react';

interface ShipmentOrderFormProps {
  currentUser: User | null;
  initialShipmentId?: number;
  onSuccess: () => void;
}

interface ExpenseRow {
  account_code: string;
  amount: number;
  currency_code: string;
  exchange_rate: number;
  expense_date: string;
  description: string;
}

export const ShipmentOrderForm: React.FC<ShipmentOrderFormProps> = ({ currentUser, initialShipmentId, onSuccess }) => {
  const vehicles = db.getVehicles();
  const level4Accounts = db.getAccounts().filter((a) => a.account_level === 4);
  const merchantAccounts = level4Accounts.filter((a) => a.account_code.startsWith('121') || a.account_type === 'أصول');
  const expenseAccounts = level4Accounts; // يسمح لاختيار أي حساب من المستوى الرابع (محطة، ورشة، صندوق، سائق...)

  const currencies = db.getCurrencies();
  const basicCurrency = currencies.find((c) => c.currency_type === 'basic') || currencies[0];

  // Part 1: Trip Operational Form States
  const [refNumber, setRefNumber] = useState<string>(`SH-2026-${String(Math.floor(Math.random() * 900) + 100)}`);
  const [vehicleId, setVehicleId] = useState<number>(0);
  const [merchantCode, setMerchantCode] = useState<string>('');

  const [tripAmount, setTripAmount] = useState<number>(0);
  const [tripCurrency, setTripCurrency] = useState<string>(basicCurrency.currency_code);
  const [tripRate, setTripRate] = useState<number>(basicCurrency.exchange_rate);

  const [departurePoint, setDeparturePoint] = useState<string>('');
  const [arrivalPoint, setArrivalPoint] = useState<string>('');
  const [route, setRoute] = useState<string>('');

  const [payloadWeight, setPayloadWeight] = useState<number>(0);
  const [roadLength, setRoadLength] = useState<number>(0);

  const [departureDate, setDepartureDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [arrivalDate, setArrivalDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [driverName, setDriverName] = useState<string>('');
  const [driversList, setDriversList] = useState<Driver[]>(db.getDrivers());
  const [isQuickAddDriverOpen, setIsQuickAddDriverOpen] = useState<boolean>(false);
  const [quickDriverName, setQuickDriverName] = useState<string>('');
  const [quickDriverPhone, setQuickDriverPhone] = useState<string>('');
  const [quickDriverLicense, setQuickDriverLicense] = useState<string>('');

  const [goodsType, setGoodsType] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isPosted, setIsPosted] = useState<boolean>(false);

  // Part 2: Expense Items List & Container Form State
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [editingExpenseIndex, setEditingExpenseIndex] = useState<number | null>(null);

  // Single Expense Draft Container Form State
  const [expAccountCode, setExpAccountCode] = useState<string>('');
  const [expDate, setExpDate] = useState<string>(departureDate);
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expCurrencyCode, setExpCurrencyCode] = useState<string>(basicCurrency.currency_code);
  const [expExchangeRate, setExpExchangeRate] = useState<number>(basicCurrency.exchange_rate);
  const [expDescription, setExpDescription] = useState<string>('');

  const [expenseNotice, setExpenseNotice] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Default expense account selection
  useEffect(() => {
    if (!expAccountCode && expenseAccounts.length > 0) {
      setExpAccountCode(expenseAccounts[0].account_code);
    }
  }, [expenseAccounts]);

  // Keep expense date synchronized with departure date if unchanged
  useEffect(() => {
    if (!expDate) {
      setExpDate(departureDate);
    }
  }, [departureDate]);

  // Load existing shipment if editing
  useEffect(() => {
    if (initialShipmentId) {
      const order = db.getShipmentOrderById(initialShipmentId);
      if (order) {
        setRefNumber(order.reference_number);
        setVehicleId(order.vehicle_id);
        setMerchantCode(order.merchant_account_code);
        setTripAmount(order.trip_amount);
        setTripCurrency(order.trip_currency_code);
        setTripRate(order.trip_exchange_rate);
        setDeparturePoint(order.departure_point);
        setArrivalPoint(order.arrival_point);
        setRoute(order.route);
        setPayloadWeight(order.payload_weight);
        setRoadLength(order.road_length);
        setDepartureDate(order.departure_date);
        setArrivalDate(order.arrival_date);
        setDriverName(order.driver_name);
        setGoodsType(order.goods_type);
        setNotes(order.notes);
        setIsPosted(order.is_financially_posted === 1);

        const loadedExp = db.getShipmentExpenseItems(initialShipmentId);
        if (loadedExp.length > 0) {
          setExpenses(
            loadedExp.map((e) => ({
              account_code: e.account_code,
              amount: e.amount,
              currency_code: e.currency_code,
              exchange_rate: e.exchange_rate,
              expense_date: e.expense_date,
              description: e.description,
            }))
          );
        }
      }
    }
  }, [initialShipmentId]);

  const handleTripCurrencyChange = (currCode: string) => {
    setTripCurrency(currCode);
    const curr = currencies.find((c) => c.currency_code === currCode);
    if (curr) setTripRate(curr.exchange_rate);
  };

  const handleExpCurrencyChange = (currCode: string) => {
    setExpCurrencyCode(currCode);
    const curr = currencies.find((c) => c.currency_code === currCode);
    if (curr) setExpExchangeRate(curr.exchange_rate);
  };

  const handleQuickAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDriverName.trim()) return;
    try {
      const newDriver = db.addDriver({
        full_name: quickDriverName.trim(),
        phone_number: quickDriverPhone.trim(),
        license_number: quickDriverLicense.trim(),
        status: 'نشط',
      });
      const updatedDrivers = db.getDrivers();
      setDriversList(updatedDrivers);
      setDriverName(newDriver.full_name);
      setQuickDriverName('');
      setQuickDriverPhone('');
      setQuickDriverLicense('');
      setIsQuickAddDriverOpen(false);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء إضافة السائق');
    }
  };

  // Expense Container Handlers
  const handleSaveExpenseItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!expAccountCode) {
      alert('يرجى اختيار الحساب الدائن للمصروف');
      return;
    }
    const numAmount = typeof expAmount === 'number' ? expAmount : parseFloat(expAmount);
    if (!numAmount || numAmount <= 0) {
      alert('يرجى إدخال مبلغ صحيح للمصروف أكبر من صفر');
      return;
    }

    const newItem: ExpenseRow = {
      account_code: expAccountCode,
      expense_date: expDate || departureDate,
      amount: numAmount,
      currency_code: expCurrencyCode,
      exchange_rate: expExchangeRate,
      description: expDescription.trim(),
    };

    if (editingExpenseIndex !== null) {
      const updated = [...expenses];
      updated[editingExpenseIndex] = newItem;
      setExpenses(updated);
      setEditingExpenseIndex(null);
      setExpenseNotice('✓ تم تعديل بند المصروف وتحديث الجدول بنجاح!');
    } else {
      setExpenses([...expenses, newItem]);
      setExpenseNotice('✓ تم حفظ بند المصروف وتفريغ الحاوية للبند التالي!');
    }

    // Reset container input fields
    setExpAmount('');
    setExpDescription('');

    // Clear notice after 3.5 seconds
    setTimeout(() => {
      setExpenseNotice('');
    }, 3500);
  };

  const handleEditExpenseItem = (index: number) => {
    const item = expenses[index];
    setEditingExpenseIndex(index);
    setExpAccountCode(item.account_code);
    setExpDate(item.expense_date);
    setExpAmount(item.amount);
    setExpCurrencyCode(item.currency_code);
    setExpExchangeRate(item.exchange_rate);
    setExpDescription(item.description);
  };

  const handleCancelEditExpense = () => {
    setEditingExpenseIndex(null);
    setExpAmount('');
    setExpDescription('');
  };

  const handleRemoveExpenseItem = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
    if (editingExpenseIndex === index) {
      handleCancelEditExpense();
    }
  };

  // Profit/Loss Calculation preview
  const tripEqRevenue = tripAmount * tripRate;
  const totalEqExpenses = expenses.reduce((sum, e) => sum + e.amount * e.exchange_rate, 0);
  const netProfitEq = tripEqRevenue - totalEqExpenses;

  // Save Stage 1: Draft
  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!refNumber.trim()) {
      setErrorMessage('يرجى إدخال الرقم المرجعي للشحنة');
      return;
    }

    if (tripAmount <= 0) {
      setErrorMessage('مبلغ إيجار الرحلة يجب أن يكون أكبر من صفر');
      return;
    }

    try {
      const saved = db.saveShipmentOrderDraft(
        {
          reference_number: refNumber.trim(),
          vehicle_id: vehicleId,
          merchant_account_code: merchantCode,
          trip_amount: tripAmount,
          trip_currency_code: tripCurrency,
          trip_exchange_rate: tripRate,
          departure_point: departurePoint.trim(),
          arrival_point: arrivalPoint.trim(),
          route: route.trim(),
          payload_weight: payloadWeight,
          road_length: roadLength,
          departure_date: departureDate,
          arrival_date: arrivalDate,
          driver_name: driverName.trim(),
          goods_type: goodsType.trim(),
          notes: notes.trim(),
          created_by: currentUser?.id || 1,
        },
        expenses,
        initialShipmentId
      );

      setSuccessMessage(`تم حفظ أمر الشحن كمسودة تشغيلية بنجاح برقم مرجعي (${saved.reference_number})`);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ مسودة أمر الشحن');
    }
  };

  // Save Stage 2: Financial Approval & Posting (الاعتماد المالي)
  const handleApproveAndPost = () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!refNumber.trim()) {
      setErrorMessage('يرجى إدخال الرقم المرجعي للشحنة أولاً');
      return;
    }

    if (expenses.length === 0) {
      setErrorMessage('لا يمكن اعتماد أمر الشحن بدون إدخال بنود المصروفات');
      return;
    }

    try {
      // First save draft if needed
      const saved = db.saveShipmentOrderDraft(
        {
          reference_number: refNumber.trim(),
          vehicle_id: vehicleId,
          merchant_account_code: merchantCode,
          trip_amount: tripAmount,
          trip_currency_code: tripCurrency,
          trip_exchange_rate: tripRate,
          departure_point: departurePoint.trim(),
          arrival_point: arrivalPoint.trim(),
          route: route.trim(),
          payload_weight: payloadWeight,
          road_length: roadLength,
          departure_date: departureDate,
          arrival_date: arrivalDate,
          driver_name: driverName.trim(),
          goods_type: goodsType.trim(),
          notes: notes.trim(),
          created_by: currentUser?.id || 1,
        },
        expenses,
        initialShipmentId
      );

      // Post financially
      const postedVoucher = db.postShipmentOrderFinancially(saved.id!, currentUser?.id || 1);

      setIsPosted(true);
      setSuccessMessage(`تم الاعتماد المالي لأمر الشحن وتوليد القيد المحاسبي المزدوج برقم سند شحن (${postedVoucher.voucher.number}) بنجاح!`);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء ترحيل سند الشحن مالياً');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-md">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">أمر شحن ونقل (Shipment Order)</h2>
              {isPosted ? (
                <span className="text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                  معتمد مالياً (مُرحّل)
                </span>
              ) : (
                <span className="text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2.5 py-0.5 rounded-full">
                  مسودة تشغيلية
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              الفاتورة الأساسية لشركة النقل: إدخال تفاصيل الرحلة، جدول المصروفات، والترحيل المالي بضغطة زر.
            </p>
          </div>
        </div>

        <div className="text-left font-mono">
          <div className="text-xs text-slate-400 dark:text-slate-500">سند الشحن المالي القادم:</div>
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">#{db.getNextVoucherNumber(4)}</div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveDraft} className="space-y-6">
        {/* Part 1: Operational Trip Form */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 text-xs sm:text-sm">
          <h3 className="font-bold text-slate-900 dark:text-white text-base pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>الجزء الأول: بيانات الرحلة والمشغّلات التشغيلية</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">الرقم المرجعي للشحنة (يدوي):</label>
              <input
                type="text"
                required
                disabled={isPosted}
                dir="auto"
                placeholder="SH-2026-001"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">المركبة / الشاحنة:</label>
              <select
                disabled={isPosted}
                value={vehicleId}
                onChange={(e) => setVehicleId(parseInt(e.target.value, 10))}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 dark:text-slate-100"
              >
                <option value={0}>-- اختر المركبة / الشاحنة --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_code} - {v.vehicle_name} ({v.vehicle_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">حساب التاجر (المدين بالرحلة):</label>
              <select
                disabled={isPosted}
                value={merchantCode}
                onChange={(e) => setMerchantCode(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 dark:text-slate-100"
              >
                <option value="">-- اختر حساب التاجر --</option>
                {merchantAccounts.map((acc) => (
                  <option key={acc.id} value={acc.account_code}>
                    {acc.account_code} - {acc.account_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/80 dark:border-amber-800/50">
            <div>
              <label className="block font-bold text-amber-950 dark:text-amber-300 mb-1">مبلغ الإيجار المتفق عليه:</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                disabled={isPosted}
                placeholder="أدخل مبلغ الإيجار..."
                value={tripAmount === 0 ? '' : tripAmount}
                onChange={(e) => setTripAmount(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-amber-950 dark:text-amber-300 mb-1">عملة الإيجار:</label>
              <select
                disabled={isPosted}
                value={tripCurrency}
                onChange={(e) => handleTripCurrencyChange(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 dark:text-slate-100"
              >
                {currencies.map((c) => (
                  <option key={c.id} value={c.currency_code}>
                    {c.currency_code} ({c.currency_symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-amber-950 dark:text-amber-300 mb-1">سعر الصرف مقابل الأساسية:</label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                required
                disabled={isPosted}
                value={tripRate}
                onChange={(e) => setTripRate(parseFloat(e.target.value) || 1)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-amber-950 dark:text-amber-300 mb-1">المقابل بالأساسية ({basicCurrency.currency_code}):</label>
              <div className="w-full p-2.5 bg-amber-100/90 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 rounded-xl font-mono font-bold text-amber-950 dark:text-amber-100 text-base flex items-center justify-between shadow-inner">
                <span>{(tripAmount * tripRate).toLocaleString()}</span>
                <span className="text-xs text-amber-800 dark:text-amber-300 font-sans">{basicCurrency.currency_symbol}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">نقطة الانطلاق:</label>
              <input
                type="text"
                required
                disabled={isPosted}
                dir="auto"
                placeholder="عدن"
                value={departurePoint}
                onChange={(e) => setDeparturePoint(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">نقطة الوصول:</label>
              <input
                type="text"
                required
                disabled={isPosted}
                dir="auto"
                placeholder="صنعاء"
                value={arrivalPoint}
                onChange={(e) => setArrivalPoint(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">خط السير والمسار التفصيلي:</label>
              <input
                type="text"
                disabled={isPosted}
                dir="auto"
                placeholder="المخا - تعز - إب..."
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">وزن الحمولة (طن):</label>
              <input
                type="number"
                step="0.1"
                disabled={isPosted}
                placeholder="0.0"
                value={payloadWeight === 0 ? '' : payloadWeight}
                onChange={(e) => setPayloadWeight(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">المسافة (كيلومتر):</label>
              <input
                type="number"
                disabled={isPosted}
                placeholder="0"
                value={roadLength === 0 ? '' : roadLength}
                onChange={(e) => setRoadLength(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">تاريخ الانطلاق:</label>
              <input
                type="date"
                required
                disabled={isPosted}
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">تاريخ الوصول المتوقع:</label>
              <input
                type="date"
                required
                disabled={isPosted}
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-800 dark:text-slate-200">اسم السائق المسؤول (من الجدول):</label>
                {!isPosted && (
                  <button
                    type="button"
                    onClick={() => setIsQuickAddDriverOpen(true)}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة سائق جديد</span>
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  disabled={isPosted}
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- اختر السائق --</option>
                  {driversList.map((d) => (
                    <option key={d.id} value={d.full_name}>
                      {d.full_name} {d.phone_number ? `(${d.phone_number})` : ''} - [{d.status}]
                    </option>
                  ))}
                  {driverName && !driversList.some((d) => d.full_name === driverName) && (
                    <option value={driverName}>{driverName} (مخصص)</option>
                  )}
                </select>
                {!isPosted && (
                  <button
                    type="button"
                    onClick={() => setIsQuickAddDriverOpen(true)}
                    className="p-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shrink-0 flex items-center justify-center transition-colors"
                    title="إضافة سائق جديد فوراً"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">نوع البضاعة المنقولة:</label>
              <input
                type="text"
                required
                disabled={isPosted}
                dir="auto"
                value={goodsType}
                onChange={(e) => setGoodsType(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">ملاحظات تشغيلية إضافية:</label>
            <input
              type="text"
              disabled={isPosted}
              dir="auto"
              placeholder="شروط التسليم، رقم بوليصة التأمين..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 font-bold"
            />
          </div>
        </div>

        {/* Part 2: Shipment Expenses Section */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Fuel className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <span>الجزء الثاني: حاوية إدخال وتوثيق مصروفات الرحلة</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                أدخل بيانات بند المصروف في الحاوية أدناه، ثم اضغط حفظ لترحيله للجدول وتفريغ الحاوية للبند التالي.
              </p>
            </div>

            {expenseNotice && (
              <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-xl animate-fade-in flex items-center gap-1.5 shadow-sm">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{expenseNotice}</span>
              </div>
            )}
          </div>

          {/* Fixed Expense Item Input Container */}
          {!isPosted && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>{editingExpenseIndex !== null ? `تعديل بند المصروف (#${editingExpenseIndex + 1})` : 'حاوية إدخال بند مصروف جديد:'}</span>
                </span>
                {editingExpenseIndex !== null && (
                  <button
                    type="button"
                    onClick={handleCancelEditExpense}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs">
                {/* Account Code */}
                <div className="lg:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الحساب الدائن (المستفيد / المحطة / الورشة):
                  </label>
                  <select
                    value={expAccountCode}
                    onChange={(e) => setExpAccountCode(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                  >
                    {expenseAccounts.map((acc) => (
                      <option key={acc.id} value={acc.account_code}>
                        {acc.account_code} - {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expense Date */}
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ المصروف:
                  </label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-[11px]"
                  />
                </div>

                {/* Amount */}
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المبلغ:
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-rose-700 dark:text-rose-400 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Currency & Exchange Rate */}
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    العملة / سعر الصرف:
                  </label>
                  <div className="flex gap-1">
                    <select
                      value={expCurrencyCode}
                      onChange={(e) => handleExpCurrencyChange(e.target.value)}
                      className="w-2/3 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 text-[11px]"
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
                      value={expExchangeRate}
                      onChange={(e) => setExpExchangeRate(parseFloat(e.target.value) || 1)}
                      className="w-1/3 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100 text-[11px]"
                    />
                  </div>
                </div>

                {/* Calculated Equivalent */}
                <div className="lg:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المقابل بالأساسية ({basicCurrency.currency_code}):
                  </label>
                  <div className="w-full p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl font-mono font-bold text-rose-900 dark:text-rose-100 flex items-center justify-between">
                    <span>{((typeof expAmount === 'number' ? expAmount : parseFloat(expAmount) || 0) * expExchangeRate).toLocaleString()}</span>
                    <span className="text-xs text-rose-700 dark:text-rose-300 font-sans">{basicCurrency.currency_symbol}</span>
                  </div>
                </div>

                {/* Description & Save Button */}
                <div className="lg:col-span-9">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وصف المصروف والبيان التفصيلي:
                  </label>
                  <input
                    type="text"
                    dir="auto"
                    placeholder="مثال: تعبئة وقود ديزل 50 لتر على الحساب..."
                    value={expDescription}
                    onChange={(e) => setExpDescription(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="lg:col-span-3 flex items-end">
                  <button
                    type="button"
                    onClick={() => handleSaveExpenseItem()}
                    className="w-full p-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingExpenseIndex !== null ? 'تحديث وتعديل البند' : 'حفظ وإضافة البند للجدول'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Table: Fixed height container with vertical & horizontal scrolling */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>قائمة بنود المصروفات المسجلة للرحلة ({expenses.length}):</span>
              {expenses.length > 0 && (
                <span className="font-mono text-rose-700 dark:text-rose-400">
                  إجمالي المصروفات: {totalEqExpenses.toLocaleString()} {basicCurrency.currency_symbol}
                </span>
              )}
            </div>

            <div className="max-h-72 overflow-x-auto overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-inner">
              {expenses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  لا توجد أي بنود مصروفات مضافة بعد. استخدم حاوية الإدخال أعلاه لإضافة وتوثيق بنود رحلة الشحن.
                </div>
              ) : (
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5">الحساب الدائن (المستفيد)</th>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5">المبلغ</th>
                      <th className="p-2.5">العملة / سعر الصرف</th>
                      <th className="p-2.5">المقابل بالأساسية</th>
                      <th className="p-2.5">البيان</th>
                      {!isPosted && <th className="p-2.5 text-center w-28">الإجراءات</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {expenses.map((exp, idx) => {
                      const account = level4Accounts.find((a) => a.account_code === exp.account_code);
                      const eqAmount = exp.amount * exp.exchange_rate;
                      const isEditingThis = editingExpenseIndex === idx;

                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            isEditingThis ? 'bg-amber-50 dark:bg-amber-950/40 font-semibold' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">
                            {exp.account_code} - {account?.account_name || 'حساب فرعي'}
                          </td>
                          <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">{exp.expense_date}</td>
                          <td className="p-2.5 font-mono font-bold text-rose-700 dark:text-rose-400">
                            {exp.amount.toLocaleString()}
                          </td>
                          <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                            {exp.currency_code} ({exp.exchange_rate})
                          </td>
                          <td className="p-2.5 font-mono font-bold text-amber-700 dark:text-amber-400">
                            {eqAmount.toLocaleString()} {basicCurrency.currency_symbol}
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={exp.description} dir="auto">
                            {exp.description || 'مصروف رحلة'}
                          </td>
                          {!isPosted && (
                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEditExpenseItem(idx)}
                                  className="p-1 px-2 text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-950/60 rounded-lg text-[11px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                                  title="تعديل البند في الحاوية"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>تعديل</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExpenseItem(idx)}
                                  className="p-1 px-2 text-rose-600 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-950/60 rounded-lg text-[11px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                                  title="حذف البند"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف</span>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Operational Profitability Calculator Preview */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs sm:text-sm shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                <span>حاسبة الربحية التشغيلية المتوقعة للرحلة:</span>
              </span>
              <span className="font-mono text-xs text-slate-400">
                (بالعملة الأساسية {basicCurrency.currency_code})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono pt-1">
              <div>
                <span className="text-slate-400 text-[11px] block">إجمالي إيراد الإيجار:</span>
                <span className="text-emerald-400 font-bold text-base">
                  +{tripEqRevenue.toLocaleString()} {basicCurrency.currency_symbol}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">إجمالي مصروفات الرحلة:</span>
                <span className="text-rose-400 font-bold text-base">
                  -{totalEqExpenses.toLocaleString()} {basicCurrency.currency_symbol}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">صافي ربح الرحلة للمركبة:</span>
                <span className={`font-black text-lg ${netProfitEq >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {netProfitEq >= 0 ? '+' : ''}
                  {netProfitEq.toLocaleString()} {basicCurrency.currency_symbol}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onSuccess}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm transition-colors"
          >
            إلغاء والعودة
          </button>

          {!isPosted ? (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>حفظ كمسودة تشغيلية</span>
              </button>

              <button
                type="button"
                onClick={handleApproveAndPost}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>الاعتماد المالي والترحيل فوراً</span>
              </button>
            </div>
          ) : (
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
              ✓ تم الترحيل المالي وتوليد القيود بنجاح. لإعادة التعديل يمكنك إلغاء الاعتماد من قائمة السندات.
            </div>
          )}
        </div>
      </form>

      {/* Quick Add Driver Modal */}
      {isQuickAddDriverOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>إضافة سائق جديد فوراً لجدول السائقين</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickAddDriverOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddDriver} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">اسم السائق الكامل <span className="text-rose-500">*</span>:</label>
                <input
                  type="text"
                  required
                  dir="auto"
                  placeholder="مثال: صالح عبدالله اليافعي"
                  value={quickDriverName}
                  onChange={(e) => setQuickDriverName(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">رقم الجوال / الهاتف:</label>
                <input
                  type="text"
                  dir="auto"
                  placeholder="770000000"
                  value={quickDriverPhone}
                  onChange={(e) => setQuickDriverPhone(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">رقم رخصة القيادة:</label>
                <input
                  type="text"
                  dir="auto"
                  placeholder="LIC-12345"
                  value={quickDriverLicense}
                  onChange={(e) => setQuickDriverLicense(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickAddDriverOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md"
                >
                  حفظ السائق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
