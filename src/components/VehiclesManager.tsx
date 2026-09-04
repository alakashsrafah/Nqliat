import React, { useState } from 'react';
import { Vehicle } from '../types';
import { db } from '../db/database';
import { Truck, Plus, Edit2, Trash2, Droplet, AlertCircle, CheckCircle, Wrench, X } from 'lucide-react';

export const VehiclesManager: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(db.getVehicles());
  const level3RevenueAccounts = db.getAccounts().filter((a) => a.account_level === 3 && (a.account_code.startsWith('4') || a.account_type === 'إيرادات'));

  const [isAddOpen, setIsAddModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [oilModalVehicle, setOilModalVehicle] = useState<Vehicle | null>(null);

  // Add Form
  const [vName, setVName] = useState('');
  const [vNumber, setVNumber] = useState('');
  const [vCode, setVCode] = useState('');
  const [vSpecs, setVSpecs] = useState('');
  const [vOilDate, setVOilDate] = useState(new Date().toISOString().split('T')[0]);
  const [parentAccountId, setParentAccountId] = useState<number>(level3RevenueAccounts[0]?.id || 13);

  // Edit Form
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editSpecs, setEditSpecs] = useState('');

  // Oil Log Form
  const [newOilDate, setNewOilDate] = useState(new Date().toISOString().split('T')[0]);
  const [oilNote, setOilNote] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const refreshVehicles = () => {
    setVehicles(db.getVehicles());
  };

  const handleOpenAdd = () => {
    setVName('');
    setVNumber('');
    setVCode(`V-${String(vehicles.length + 1).padStart(2, '0')}`);
    setVSpecs('');
    setVOilDate(new Date().toISOString().split('T')[0]);
    if (level3RevenueAccounts.length > 0) {
      setParentAccountId(level3RevenueAccounts[0].id);
    }
    setErrorMessage('');
    setSuccessMessage('');
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!vName.trim() || !vNumber.trim() || !vCode.trim()) {
      setErrorMessage('يرجى تعبئة الحقول المطلوبة (اسم المركبة، رقم اللوحة، كود الداخلي)');
      return;
    }

    try {
      const added = db.addVehicle({
        vehicle_name: vName.trim(),
        vehicle_number: vNumber.trim(),
        vehicle_code: vCode.trim(),
        parent_revenue_account_id: parentAccountId,
        specifications: vSpecs.trim(),
        last_oil_change_date: vOilDate,
      });

      refreshVehicles();
      setIsAddModalOpen(false);
      setSuccessMessage(`تم إضافة المركبة "${added.vehicle_name}" وإنشاء حساب إيرادات تفصيلي رقم (${added.account_code}) بنجاح`);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل إضافة المركبة');
    }
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditVehicle(v);
    setEditName(v.vehicle_name);
    setEditNumber(v.vehicle_number);
    setEditCode(v.vehicle_code);
    setEditSpecs(v.specifications);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVehicle) return;
    setErrorMessage('');
    setSuccessMessage('');

    try {
      db.updateVehicle(editVehicle.id, {
        vehicle_name: editName.trim(),
        vehicle_number: editNumber.trim(),
        vehicle_code: editCode.trim(),
        specifications: editSpecs.trim(),
        last_oil_change_date: editVehicle.last_oil_change_date,
        change_log: editVehicle.change_log,
      });

      refreshVehicles();
      setEditVehicle(null);
      setSuccessMessage('تم تحديث بيانات المركبة بنجاح');
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل التحديث');
    }
  };

  const handleOpenOilLog = (v: Vehicle) => {
    setOilModalVehicle(v);
    setNewOilDate(new Date().toISOString().split('T')[0]);
    setOilNote('تغيير زيت دوري وفلتر');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSaveOilLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oilModalVehicle) return;

    try {
      db.logOilChange(oilModalVehicle.id, newOilDate, oilNote.trim());
      refreshVehicles();
      setOilModalVehicle(null);
      setSuccessMessage('تم تسجيل تاريخ تغيير الزيت الجديد بنجاح');
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل التحديث');
    }
  };

  const handleDelete = (v: Vehicle) => {
    setErrorMessage('');
    setSuccessMessage('');

    if (window.confirm(`هل أنت متأكد من حذف المركبة "${v.vehicle_name}" (${v.vehicle_code})؟`)) {
      try {
        db.deleteVehicle(v.id);
        refreshVehicles();
        setSuccessMessage(`تم حذف المركبة ${v.vehicle_code} بنجاح`);
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
            <Truck className="w-6 h-6 text-amber-600" />
            <span>إدارة المركبات والأسطول (Vehicles Management)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إضافة شاحنات الأسطول مع الربط التلقائي بحساب إيرادات تفصيلي بالمستوى الرابع وسجل تغيير الزيت والصيانة.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مركبة جديدة</span>
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

      {/* Vehicles Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.map((vehicle) => {
          const acc = db.getAccountByCode(vehicle.account_code);

          return (
            <div
              key={vehicle.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        {vehicle.vehicle_code}
                      </span>
                      <h3 className="font-bold text-base text-slate-900">{vehicle.vehicle_name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">رقم اللوحة: {vehicle.vehicle_number}</p>
                  </div>

                  <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                    <Truck className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">حساب الإيرادات الخاص (مستوى 4):</span>
                    <span className="font-mono font-bold text-amber-700">{vehicle.account_code}</span>
                  </div>
                  <div className="text-slate-700 font-semibold truncate">
                    اسم الحساب: {acc?.account_name || 'غير محدد'}
                  </div>
                  <div className="text-slate-600 pt-1 border-t border-slate-200/60">
                    المواصفات: {vehicle.specifications || 'لا توجد مواصفات مدخلة'}
                  </div>
                </div>

                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-950 font-medium">
                    <Droplet className="w-4 h-4 text-amber-600" />
                    <span>آخر تغيير زيت:</span>
                    <span className="font-bold font-mono text-slate-900">{vehicle.last_oil_change_date || 'غير مسجل'}</span>
                  </div>

                  <button
                    onClick={() => handleOpenOilLog(vehicle)}
                    className="text-amber-800 hover:text-amber-950 font-bold underline text-xs"
                  >
                    تحديث التاريخ
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <details className="text-[11px] text-slate-500 cursor-pointer">
                  <summary className="font-bold text-slate-700 hover:text-amber-700">عرض سجل تغييرات الزيت</summary>
                  <pre className="mt-2 p-2 bg-slate-100 rounded text-[10px] font-mono text-slate-800 whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {vehicle.change_log || 'لا توجد سجلات بعد'}
                  </pre>
                </details>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(vehicle)}
                    className="p-2 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors flex items-center gap-1 font-bold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle)}
                    className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Vehicle Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                <span>إضافة مركبة جديدة للأسطول</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المركبة:</label>
                  <input
                    type="text"
                    required
                    placeholder="مرسيدس أكتروس..."
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم اللوحة:</label>
                  <input
                    type="text"
                    required
                    placeholder="1234-أ"
                    value={vNumber}
                    onChange={(e) => setVNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود المركبة الداخلي:</label>
                  <input
                    type="text"
                    required
                    value={vCode}
                    onChange={(e) => setVCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ آخر تغيير زيت:</label>
                  <input
                    type="date"
                    required
                    value={vOilDate}
                    onChange={(e) => setVOilDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">حساب الإيرادات الأب (مستوى 3):</label>
                <select
                  value={parentAccountId}
                  onChange={(e) => setParentAccountId(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                >
                  {level3RevenueAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_code} - {acc.account_name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  سيقوم النظام تلقائياً بإنشاء حساب إيرادات تفصيلي مستوى 4 للمركبة تحت هذا الحساب.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المواصفات والنوع:</label>
                <textarea
                  rows={2}
                  placeholder="نوع المحرك، الحمولة القسوى، الموديل..."
                  value={vSpecs}
                  onChange={(e) => setVSpecs(e.target.value)}
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
                  إضافة وحفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {editVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                <span>تعديل بيانات المركبة ({editVehicle.vehicle_code})</span>
              </h3>
              <button onClick={() => setEditVehicle(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs sm:text-sm">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 flex items-center justify-between">
                <span>حساب الإيرادات المرتبط:</span>
                <span className="font-mono font-bold text-amber-700">{editVehicle.account_code}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المركبة:</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم اللوحة:</label>
                  <input
                    type="text"
                    required
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الكود الداخلي:</label>
                <input
                  type="text"
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المواصفات:</label>
                <textarea
                  rows={3}
                  value={editSpecs}
                  onChange={(e) => setEditSpecs(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditVehicle(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Oil Log Modal */}
      {oilModalVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-amber-600" />
                <span>تحديث موعد تغيير الزيت ({oilModalVehicle.vehicle_name})</span>
              </h3>
              <button onClick={() => setOilModalVehicle(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOilLog} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ تغيير الزيت الجديد:</label>
                <input
                  type="date"
                  required
                  value={newOilDate}
                  onChange={(e) => setNewOilDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظة عن نوع الزيت الصيانة:</label>
                <input
                  type="text"
                  placeholder="نوع الزيت، الفلتر، عداد الكيلومترات..."
                  value={oilNote}
                  onChange={(e) => setOilNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOilModalVehicle(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm"
                >
                  تحديث وتسجيل في السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
