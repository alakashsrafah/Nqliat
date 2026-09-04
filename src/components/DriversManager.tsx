import React, { useState } from 'react';
import { Driver, DriverStatus } from '../types';
import { db } from '../db/database';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Truck,
  UserCheck,
  Calendar
} from 'lucide-react';

export const DriversManager: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>(db.getDrivers());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Add/Edit Form states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [status, setStatus] = useState<DriverStatus>('نشط');
  const [notes, setNotes] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const refreshDrivers = () => {
    setDrivers(db.getDrivers());
  };

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFullName('');
    setPhoneNumber('');
    setLicenseNumber('');
    setStatus('نشط');
    setNotes('');
    setErrorMessage('');
    setSuccessMessage('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFullName(driver.full_name);
    setPhoneNumber(driver.phone_number || '');
    setLicenseNumber(driver.license_number || '');
    setStatus(driver.status);
    setNotes(driver.notes || '');
    setErrorMessage('');
    setSuccessMessage('');
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setErrorMessage('يرجى إدخال اسم السائق الكامل');
      return;
    }

    try {
      if (editingDriver) {
        db.updateDriver(editingDriver.id, {
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          license_number: licenseNumber.trim(),
          status,
          notes: notes.trim(),
        });
        setSuccessMessage(`تم تحديث بيانات السائق "${fullName.trim()}" بنجاح`);
      } else {
        const newDriver = db.addDriver({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          license_number: licenseNumber.trim(),
          status,
          notes: notes.trim(),
        });
        setSuccessMessage(`تم إضافة السائق "${newDriver.full_name}" بنجاح إلى النظام`);
      }
      refreshDrivers();
      setIsAddModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ السائق');
    }
  };

  const handleDelete = (driver: Driver) => {
    setErrorMessage('');
    setSuccessMessage('');
    if (window.confirm(`هل أنت متأكد من حذف السائق "${driver.full_name}" من الدفاتر؟`)) {
      try {
        db.deleteDriver(driver.id);
        refreshDrivers();
        setSuccessMessage(`تم حذف السائق "${driver.full_name}" بنجاح`);
      } catch (err: any) {
        setErrorMessage(err.message || 'فشل حذف السائق');
      }
    }
  };

  // Filter logic
  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.phone_number && d.phone_number.includes(searchQuery)) ||
      (d.license_number && d.license_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI stats
  const totalCount = drivers.length;
  const activeCount = drivers.filter((d) => d.status === 'نشط').length;
  const inTripCount = drivers.filter((d) => d.status === 'في رحلة').length;
  const vacationCount = drivers.filter((d) => d.status === 'إجازة').length;

  const getStatusBadge = (s: DriverStatus) => {
    switch (s) {
      case 'نشط':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'في رحلة':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'إجازة':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'متوقف':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-600" />
            <span>جدول السائقين (Drivers Directory)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة بيانات أطقم القيادة، أرقام الرخص، أرقام الهواتف، ومتابعة حالة السائقين في الرحلات.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة سائق جديد</span>
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
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-bold mb-1">إجمالي السائقين</div>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-emerald-700 text-xs font-bold mb-1">سائقون جاهزون / نشطون</div>
          <div className="text-2xl font-black text-emerald-700">{activeCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-amber-800 text-xs font-bold mb-1">في رحلة حالياً</div>
          <div className="text-2xl font-black text-amber-700">{inTripCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-blue-700 text-xs font-bold mb-1">في إجازة</div>
          <div className="text-2xl font-black text-blue-700">{vacationCount}</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث باسم السائق، رقم الهاتف، أو رقم الرخصة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-medium"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs font-bold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
              statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            الكل ({drivers.length})
          </button>
          <button
            onClick={() => setStatusFilter('نشط')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
              statusFilter === 'نشط' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            نشط ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('في رحلة')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
              statusFilter === 'في رحلة' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            في رحلة ({inTripCount})
          </button>
          <button
            onClick={() => setStatusFilter('إجازة')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
              statusFilter === 'إجازة' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            إجازة ({vacationCount})
          </button>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-900 text-amber-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">#</th>
                <th className="p-3.5">اسم السائق الكامل</th>
                <th className="p-3.5">رقم الجوال</th>
                <th className="p-3.5">رقم الرخصة</th>
                <th className="p-3.5">الحالة الحالية</th>
                <th className="p-3.5">ملاحظات والتفاصيل</th>
                <th className="p-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    لا يوجد سائقون مطبق عليهم معيار البحث.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((d, index) => (
                  <tr key={d.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400 font-bold">{index + 1}</td>
                    <td className="p-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {d.full_name.charAt(0)}
                        </div>
                        <span>{d.full_name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 dir-ltr text-right">
                      {d.phone_number ? (
                        <a
                          href={`tel:${d.phone_number}`}
                          className="inline-flex items-center gap-1.5 text-slate-800 hover:text-amber-600 font-bold"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{d.phone_number}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-800">
                      {d.license_number ? (
                        <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          <span>{d.license_number}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold">
                      <span className={`px-2.5 py-1 rounded-lg text-xs border ${getStatusBadge(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">{d.notes || '-'}</td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(d)}
                          title="تعديل بيانات السائق"
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          title="حذف السائق"
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Driver Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg sm:text-xl text-slate-900">
                    {editingDriver ? `تعديل بيانات السائق "${editingDriver.full_name}"` : 'إضافة سائق جديد إلى النظام'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تسجيل معلومات السائق ليتم اختياره في أصناف أمر الشحن
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 text-xs transition-colors"
              >
                <X className="w-4 h-4" />
                <span>إغلاق / خروج</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  اسم السائق الكامل <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد علي أحمد القاسمي"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    رقم الهاتف / الجوال:
                  </label>
                  <input
                    type="text"
                    placeholder="770000000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    رقم رخصة القيادة:
                  </label>
                  <input
                    type="text"
                    placeholder="LIC-00000"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  حالة السائق الحالية:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DriverStatus)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-bold text-sm text-slate-900"
                >
                  <option value="نشط">نشط (جاهز للرحلات)</option>
                  <option value="في رحلة">في رحلة حالياً</option>
                  <option value="إجازة">في إجازة رسمية</option>
                  <option value="متوقف">متوقف / غير متاح</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  ملاحظات وتفاصيل إضافية:
                </label>
                <textarea
                  rows={3}
                  placeholder="ملاحظات عن نوع الشاحنة المعتاد، خيارات السفر، الخ..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600" />
                  <span>إلغاء وخروج</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{editingDriver ? 'حفظ التعديلات' : 'إضافة السائق'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
