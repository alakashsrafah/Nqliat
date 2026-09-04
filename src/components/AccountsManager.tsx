import React, { useState, useEffect } from 'react';
import { ChartOfAccount, AccountType, ViewTab } from '../types';
import { db } from '../db/database';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Search,
  ChevronDown,
  ChevronLeft,
  AlertCircle,
  Phone,
  CheckCircle,
  X,
  LogOut,
  ListFilter,
  Maximize2,
  Minimize2,
  Grid
} from 'lucide-react';

interface AccountsManagerProps {
  onNavigate?: (tab: ViewTab) => void;
}

export const AccountsManager: React.FC<AccountsManagerProps> = ({ onNavigate }) => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<AccountType>('أصول');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');

  const [editAccount, setEditAccount] = useState<ChartOfAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const refreshAccounts = () => {
    const list = db.getAccounts();
    setAccounts(list);
    return list;
  };

  useEffect(() => {
    const list = refreshAccounts();
    // Default expand level 1 and level 2 nodes
    const initialExpanded: Record<number, boolean> = {};
    list.forEach((acc) => {
      if (acc.account_level <= 2) {
        initialExpanded[acc.id] = true;
      }
    });
    setExpandedNodes(initialExpanded);
  }, []);

  const handleExpandAll = () => {
    const allExpanded: Record<number, boolean> = {};
    accounts.forEach((acc) => {
      allExpanded[acc.id] = true;
    });
    setExpandedNodes(allExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedNodes({});
  };

  const toggleNode = (id: number) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAdd = (parentId: number | null) => {
    setSelectedParentId(parentId);
    setNewAccountName('');
    setNewPhoneNumber('');
    setErrorMessage('');
    setSuccessMessage('');

    if (parentId) {
      const parent = accounts.find((a) => a.id === parentId);
      if (parent) setNewAccountType(parent.account_type);
    }
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newAccountName.trim()) {
      setErrorMessage('يرجى إدخال اسم الحساب');
      return;
    }

    try {
      const created = db.addAccount({
        parent_id: selectedParentId,
        account_name: newAccountName.trim(),
        custom_type: selectedParentId ? undefined : newAccountType,
        phone_number: newPhoneNumber.trim(),
      });

      refreshAccounts();
      if (selectedParentId) {
        setExpandedNodes((prev) => ({ ...prev, [selectedParentId]: true }));
      }
      setIsAddModalOpen(false);
      setSuccessMessage(`تم إضافة الحساب "${created.account_name}" بنجاح بالرمز التسلسلي ${created.account_code}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إضافة الحساب');
    }
  };

  const handleOpenEdit = (acc: ChartOfAccount) => {
    setEditAccount(acc);
    setEditName(acc.account_name);
    setEditPhone(acc.phone_number || '');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccount) return;
    if (!editName.trim()) {
      setErrorMessage('اسم الحساب لا يمكن أن يكون فارغاً');
      return;
    }

    try {
      db.updateAccount(editAccount.id, {
        account_name: editName.trim(),
        phone_number: editPhone.trim(),
      });
      refreshAccounts();
      setEditAccount(null);
      setSuccessMessage('تم تحديث بيانات الحساب بنجاح');
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل التحديث');
    }
  };

  const handleDelete = (acc: ChartOfAccount) => {
    setErrorMessage('');
    setSuccessMessage('');
    if (window.confirm(`هل أنت تأكد من حذف الحساب "${acc.account_name}" (${acc.account_code})؟`)) {
      try {
        db.deleteAccount(acc.id);
        refreshAccounts();
        setSuccessMessage(`تم حذف الحساب ${acc.account_code} بنجاح`);
      } catch (err: any) {
        setErrorMessage(err.message || 'فشل حذف الحساب');
      }
    }
  };

  // Build Hierarchy Tree
  const getChildren = (parentId: number | null) => {
    return accounts.filter((a) => a.parent_id === parentId);
  };

  // Filter accounts for search
  const filteredAccounts = searchQuery.trim()
    ? accounts.filter(
        (a) =>
          a.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.account_code.includes(searchQuery) ||
          (a.phone_number && a.phone_number.includes(searchQuery))
      )
    : null;

  const getParentAccountName = (parentId: number | null) => {
    if (!parentId) return '— (حساب رئيسي)';
    const parent = accounts.find((a) => a.id === parentId);
    return parent ? `${parent.account_code} - ${parent.account_name}` : '—';
  };

  const renderTreeNode = (acc: ChartOfAccount) => {
    const children = getChildren(acc.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes[acc.id] ?? false;

    // Styling based on account level
    const levelStyle =
      acc.account_level === 1
        ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white font-bold p-3.5 rounded-2xl shadow-md border border-slate-700/80 my-2'
        : acc.account_level === 2
        ? 'bg-amber-50 text-slate-900 font-bold p-3 my-1.5 rounded-xl border-r-4 border-amber-500 shadow-xs hover:bg-amber-100/60'
        : acc.account_level === 3
        ? 'bg-slate-100/90 text-slate-900 font-semibold p-2.5 my-1 rounded-xl border-r-2 border-slate-400 hover:bg-slate-200/80'
        : 'bg-white text-slate-800 p-2.5 my-1 rounded-xl border border-slate-200 hover:bg-amber-50/40 shadow-2xs';

    return (
      <div key={acc.id} className="select-none">
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${levelStyle}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(acc.id)}
                className="p-1 hover:bg-black/10 rounded-lg transition-colors text-inherit shrink-0"
                title={isExpanded ? 'طي الفروع' : 'توسيع الفروع'}
              >
                {isExpanded ? <ChevronDown className="w-5 h-5 text-amber-400" /> : <ChevronLeft className="w-5 h-5 text-amber-500" />}
              </button>
            ) : (
              <span className="w-7 shrink-0" />
            )}

            <span className="font-mono text-xs sm:text-sm px-2.5 py-1 rounded-lg bg-black/10 font-black tracking-wide shrink-0">
              {acc.account_code}
            </span>

            <span className="text-sm sm:text-base font-bold truncate">{acc.account_name}</span>

            <span className="text-[11px] opacity-80 px-2 py-0.5 rounded-md bg-black/10 font-bold whitespace-nowrap shrink-0">
              {acc.account_type} (مستوى {acc.account_level})
            </span>

            {acc.phone_number && (
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 shrink-0 font-mono">
                <Phone className="w-3 h-3" />
                {acc.phone_number}
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-black/10">
            {acc.account_level < 4 && (
              <button
                type="button"
                onClick={() => handleOpenAdd(acc.id)}
                title="إضافة حساب فرعي تحته"
                className="px-2.5 py-1 hover:bg-black/10 rounded-lg text-inherit transition-colors flex items-center gap-1 text-xs font-bold bg-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة فرعي</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenEdit(acc)}
              title="تعديل الحساب"
              className="p-1.5 hover:bg-black/10 rounded-lg text-inherit transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleDelete(acc)}
              title="حذف الحساب"
              className="p-1.5 hover:bg-rose-500 hover:text-white rounded-lg transition-colors text-rose-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mr-3 sm:mr-6 border-r-2 border-amber-300/60 pr-2 sm:pr-3 space-y-1">
            {children.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  const level1Root = accounts.filter((a) => a.account_level === 1);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20">
              <FolderTree className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                إدارة شجرة الحسابات (Chart of Accounts)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                دليل الحسابات المالي والشجرة الهيكلية المكونة من 4 مستويات مع إمكانية البحث والتوليد التلقائي للرموز.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl text-xs sm:text-sm border border-rose-200 transition-colors shadow-2xs"
              title="العودة للوحة التحكّم الرئيسية"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج للرئيسية</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenAdd(null)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs sm:text-sm transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حساب رئيسي (مستوى 1)</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm font-bold flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage('')} className="p-1 text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage('')} className="p-1 text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar & View Mode Control Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            placeholder="ابحث بالاسم، الكود، أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3.5 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Display Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-bold">
          {/* Tree View vs Table View Toggle */}
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                viewMode === 'tree' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              <span>الشجرة الهيكلية</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                viewMode === 'table' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>جدول تفصيلي</span>
            </button>
          </div>

          {/* Expand / Collapse All (Tree Mode only) */}
          {viewMode === 'tree' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleExpandAll}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors"
                title="توسيع كافة فروع الحسابات"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">توسيع الكل</span>
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors"
                title="طي كافة الفروع"
              >
                <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">طي الكل</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 min-h-[400px]">
        {/* Search Filtered Results Notice */}
        {filteredAccounts ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-600 bg-amber-50/80 p-3 rounded-2xl border border-amber-200">
              <span>نتائج البحث عن ({searchQuery}): {filteredAccounts.length} حساب مسجل</span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-amber-800 underline hover:text-amber-950"
              >
                إلغاء البحث والعودة للشجرة
              </button>
            </div>

            {filteredAccounts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold text-sm">
                لا توجد حسابات تطابق خيارات البحث الحالية.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead className="bg-slate-900 text-white font-bold">
                    <tr>
                      <th className="p-3 rounded-r-xl">الكود</th>
                      <th className="p-3">اسم الحساب</th>
                      <th className="p-3">المستوى</th>
                      <th className="p-3">نوع الحساب</th>
                      <th className="p-3">الحساب الأب</th>
                      <th className="p-3">رقم الجوال</th>
                      <th className="p-3 text-center rounded-l-xl">العمليات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="p-3 font-mono font-black text-amber-800">{acc.account_code}</td>
                        <td className="p-3 font-bold text-slate-900">{acc.account_name}</td>
                        <td className="p-3 font-bold">مستوى {acc.account_level}</td>
                        <td className="p-3 font-bold text-slate-700">{acc.account_type}</td>
                        <td className="p-3 text-slate-600">{getParentAccountName(acc.parent_id)}</td>
                        <td className="p-3 font-mono dir-ltr text-right text-slate-700">{acc.phone_number || '—'}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {acc.account_level < 4 && (
                              <button
                                type="button"
                                onClick={() => handleOpenAdd(acc.id)}
                                className="px-2 py-1 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-lg text-xs font-bold"
                              >
                                + فرعي
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(acc)}
                              className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(acc)}
                              className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* Table View Mode */
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="p-3 rounded-r-xl">رمز الحساب (Code)</th>
                  <th className="p-3">اسم الحساب</th>
                  <th className="p-3">المستوى</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">الحساب الأب</th>
                  <th className="p-3">رقم الهاتف</th>
                  <th className="p-3 text-center rounded-l-xl">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts
                  .slice()
                  .sort((a, b) => a.account_code.localeCompare(b.account_code))
                  .map((acc) => (
                    <tr key={acc.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="p-3 font-mono font-black text-amber-800 bg-amber-50/30">{acc.account_code}</td>
                      <td className="p-3 font-bold text-slate-900">{acc.account_name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          acc.account_level === 1 ? 'bg-slate-900 text-white' :
                          acc.account_level === 2 ? 'bg-amber-100 text-amber-900' :
                          acc.account_level === 3 ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          مستوى {acc.account_level}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-700">{acc.account_type}</td>
                      <td className="p-3 text-slate-600">{getParentAccountName(acc.parent_id)}</td>
                      <td className="p-3 font-mono dir-ltr text-right text-slate-700">{acc.phone_number || '—'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {acc.account_level < 4 && (
                            <button
                              type="button"
                              onClick={() => handleOpenAdd(acc.id)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shadow-2xs"
                              title="إضافة حساب فرعي"
                            >
                              + فرعي
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(acc)}
                            className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-lg"
                            title="تعديل الحساب"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(acc)}
                            className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg"
                            title="حذف الحساب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Tree View Mode */
          <div className="space-y-2">
            {level1Root.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold">لا توجد حسابات مسجلة في شجرة الحسابات.</div>
            ) : (
              level1Root.map((acc) => renderTreeNode(acc))
            )}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Modal Header with Exit Button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg sm:text-xl text-slate-900">
                    إضافة حساب جديد إلى شجرة الحسابات
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    إدخال حساب جديد مع توليد الرمز والربط المحاسبي تلقائياً
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 text-xs transition-colors"
                title="إغلاق وخروج"
              >
                <X className="w-4 h-4" />
                <span>خروج / إغلاق</span>
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-6">
              {selectedParentId ? (
                <div className="bg-amber-50/90 p-4 rounded-2xl border border-amber-300/80 text-amber-950 leading-relaxed shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                    <span>الحساب الأب المحدد:</span>
                    <span className="bg-amber-200/80 text-amber-950 px-2.5 py-0.5 rounded-lg font-mono text-xs border border-amber-300">
                      ID: {selectedParentId}
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-900">
                    {accounts.find((a) => a.id === selectedParentId)?.account_code} - {accounts.find((a) => a.id === selectedParentId)?.account_name}
                  </div>
                  <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-900 font-semibold">
                    <span>الرمز التلقائي المولّد:</span>
                    <span className="font-mono font-bold text-amber-900 text-sm bg-white px-2.5 py-0.5 rounded border border-amber-300">
                      {db.generateNextAccountCode(selectedParentId).account_code} (مستوى {db.generateNextAccountCode(selectedParentId).account_level})
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    نوع الحساب الرئيسي (مستوى 1):
                  </label>
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value as AccountType)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-base"
                  >
                    <option value="أصول">1 - الأصول (Assets)</option>
                    <option value="خصوم">2 - الخصوم وحقوق الملكية (Liabilities & Equity)</option>
                    <option value="مصروفات">3 - المصروفات (Expenses)</option>
                    <option value="إيرادات">4 - الإيرادات (Revenues)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  اسم الحساب الجديد <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حساب العميل، صندوق التجهيزات..."
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-base placeholder:font-normal placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  رقم الهاتف / الجوال (اختياري - للعملاء والسائقين والتجار):
                </label>
                <input
                  type="text"
                  placeholder="770000000"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-mono text-slate-900 text-base dir-ltr text-right"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-sm flex items-center gap-2 transition-colors border border-slate-300"
                >
                  <X className="w-4 h-4 text-slate-600" />
                  <span>إلغاء وخروج</span>
                </button>

                <button
                  type="submit"
                  className="px-7 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>حفظ الحساب الجديد</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editAccount && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20">
                  <Edit2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg sm:text-xl text-slate-900">
                    تعديل بيانات الحساب ({editAccount.account_code})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تعديل الاسم أو رقم الهاتف المسجل للحساب
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditAccount(null)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 text-xs transition-colors"
                title="إغلاق وخروج"
              >
                <X className="w-4 h-4" />
                <span>خروج / إغلاق</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  اسم الحساب <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  رقم الهاتف:
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-mono text-slate-900 text-base dir-ltr text-right"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditAccount(null)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-sm flex items-center gap-2 transition-colors border border-slate-300"
                >
                  <X className="w-4 h-4 text-slate-600" />
                  <span>إلغاء وخروج</span>
                </button>

                <button
                  type="submit"
                  className="px-7 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-sm shadow-md transition-all active:scale-95"
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
