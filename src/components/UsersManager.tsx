import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { db } from '../db/database';
import { Users, UserPlus, Shield, Key, Trash2, Edit2, AlertCircle, CheckCircle, X } from 'lucide-react';

interface UsersManagerProps {
  currentUser: User | null;
}

export const UsersManager: React.FC<UsersManagerProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>(db.getUsers());

  const [isAddOpen, setIsAddModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  // Form state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('محاسب');

  const [editFullName, setEditFullName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('محاسب');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const refreshUsers = () => {
    setUsers(db.getUsers());
  };

  const handleOpenAdd = () => {
    setUsername('');
    setFullName('');
    setPassword('');
    setRole('محاسب');
    setErrorMessage('');
    setSuccessMessage('');
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !fullName.trim() || !password.trim()) {
      setErrorMessage('يرجى تعبئة كافة الحقول (اسم المستخدم، الاسم الكامل، كلمة المرور)');
      return;
    }

    try {
      const added = db.addUser({
        username: username.trim(),
        full_name: fullName.trim(),
        password_hash: password.trim(),
        role,
        user_type: role === 'مدير النظام' ? 'مدير' : 'موظف',
      });

      refreshUsers();
      setIsAddModalOpen(false);
      setSuccessMessage(`تم إضافة المستخدم (${added.full_name}) بنجاح صلاحية: ${added.role}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل إضافة المستخدم');
    }
  };

  const handleOpenEdit = (u: User) => {
    setEditUser(u);
    setEditFullName(u.full_name);
    setEditPassword(u.password_hash);
    setEditRole(u.role);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    try {
      db.updateUser(editUser.id, {
        full_name: editFullName.trim(),
        password_hash: editPassword.trim(),
        role: editRole,
      });

      refreshUsers();
      setEditUser(null);
      setSuccessMessage('تم تحديث بيانات المستخدم والصلاحيات بنجاح');
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل التحديث');
    }
  };

  const handleDelete = (u: User) => {
    if (currentUser?.id === u.id) {
      alert('لا يمكنك حذف حسابك المستعمل حالياً أثناء الجلسة!');
      return;
    }

    if (window.confirm(`هل أنت متأكد من حذف المستخدم "${u.full_name || u.username}" (${u.username})؟`)) {
      try {
        db.deleteUser(u.id, currentUser?.id);
        refreshUsers();
        setSuccessMessage(`تم حذف المستخدم ${u.username} بنجاح`);
      } catch (err: any) {
        setErrorMessage(err.message || 'فشل الحذف');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-600" />
            <span>إدارة المستخدمين والصلاحيات (User Roles)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إضافة مدراء النظام والمحاسبين ومشغلي الحركة وتحديد الصلاحيات لتأمين النظام أوفلاين.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة مستخدم جديد</span>
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

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((u) => {
          const isMe = currentUser?.id === u.id;

          return (
            <div
              key={u.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 ${
                isMe ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-base">
                    {(u.full_name || u.username).charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{u.full_name || u.username}</h3>
                      {isMe && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                          أنت (الحالي)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono">@{u.username}</p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    u.role === 'مدير النظام'
                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                      : u.role === 'محاسب'
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  {u.role}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                  <Key className="w-3.5 h-3.5" />
                  <span>كلمة المرور: ••••••••</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors flex items-center gap-1 font-bold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>

                  {!isMe && (
                    <button
                      onClick={() => handleDelete(u)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                <span>إضافة مستخدم جديد للنظام</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المستخدم (للتسجيل):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ahmed"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم الكامل والوظيفي:</label>
                <input
                  type="text"
                  required
                  placeholder="أحمد علي سالم"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">كلمة المرور:</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">صلاحية المستخدم ودوره:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                >
                  <option value="مدير النظام">مدير النظام (Admin - كافة الصلاحيات)</option>
                  <option value="محاسب">محاسب (Accountant - سندات وتقارير مالية)</option>
                  <option value="مشغل حركة">مشغل حركة (Operations - إدخال أوامر الشحن وتوجيه المركبات)</option>
                </select>
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
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                <span>تعديل حساب ({editUser.username})</span>
              </h3>
              <button onClick={() => setEditUser(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم الكامل والوظيفي:</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">كلمة المرور الجديدة:</label>
                <input
                  type="password"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">صلاحية المستخدم ودوره:</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                >
                  <option value="مدير النظام">مدير النظام (Admin)</option>
                  <option value="محاسب">محاسب (Accountant)</option>
                  <option value="مشغل حركة">مشغل حركة (Operations)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm"
                >
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
