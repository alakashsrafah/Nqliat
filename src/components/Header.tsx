import React from 'react';
import { User, ViewTab } from '../types';
import {
  Truck,
  ShieldCheck,
  UserCheck,
  LogOut,
  LayoutDashboard,
  GitFork,
  Users,
  Coins,
  FileText,
  PieChart,
  UserCog,
  HardDrive,
  Sun,
  Moon,
  Key
} from 'lucide-react';
import { licenseService } from '../services/licenseService';

interface HeaderProps {
  activeTab: ViewTab;
  onNavigate: (tab: ViewTab) => void;
  currentUser: User | null;
  onSwitchUser?: (u: User | null) => void;
  onOpenLogin?: () => void;
  onOpenBackup?: () => void;
  onOpenLicense?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  currentUser,
  onOpenLogin,
  onOpenLicense,
  isDarkMode = false,
  onToggleTheme,
}) => {
  const navItems: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'accounts', label: 'شجرة الحسابات', icon: <GitFork className="w-4 h-4" /> },
    { id: 'drivers', label: 'جدول السائقين', icon: <Users className="w-4 h-4" /> },
    { id: 'vehicles', label: 'أسطول المركبات', icon: <Truck className="w-4 h-4" /> },
    { id: 'shipments', label: 'أوامر الشحن', icon: <FileText className="w-4 h-4" /> },
    { id: 'vouchers', label: 'السندات المالية', icon: <Coins className="w-4 h-4" /> },
    { id: 'currencies', label: 'العملات والصرف', icon: <Coins className="w-4 h-4" /> },
    { id: 'reports', label: 'التقارير المالية', icon: <PieChart className="w-4 h-4" /> },
    { id: 'users', label: 'المستخدمين', icon: <UserCog className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 dark:from-slate-950 dark:via-black dark:to-slate-950 text-white shadow-xl sticky top-0 z-30 border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-16 border-b border-slate-800/80">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-md text-slate-950 font-bold flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg sm:text-xl tracking-tight text-white font-serif">
                  نقل أكسبرس
                </h1>
                <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  Offline - Android
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                نظام إدارة شركة النقل البري والمحاسبة الذاتية
              </p>
            </div>
          </div>

          {/* User Status & Action Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={isDarkMode ? 'تغيير للوضع النهاري' : 'تغيير للوضع الليلي'}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
              </button>
            )}

            {onOpenLicense && (
              <button
                onClick={onOpenLicense}
                title="حالة ترخيص النظام وتفعيله"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-colors border cursor-pointer ${
                  licenseService.getCurrentLicense().isLicensed
                    ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/80 font-bold'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50 font-bold animate-pulse'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">
                  {licenseService.getCurrentLicense().isLicensed ? 'النظام مرخص' : 'تفعيل الترخيص'}
                </span>
              </button>
            )}

            <button
              onClick={() => onNavigate('backup_restore')}
              title="النسخ الاحتياطي والإستعادة"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-colors border cursor-pointer ${
                activeTab === 'backup_restore'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline font-bold">النسخ الاحتياطي</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 pl-2 pr-3 py-1.5 rounded-xl">
                <div className={`p-1 rounded-lg ${currentUser.user_type === 'مدير' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {currentUser.user_type === 'مدير' ? <ShieldCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </div>
                <div className="text-right leading-tight">
                  <div className="text-xs font-bold text-white">{currentUser.username}</div>
                  <div className="text-[10px] text-slate-400">{currentUser.user_type}</div>
                </div>
                {onOpenLogin && (
                  <button
                    onClick={onOpenLogin}
                    title="تغيير المستخدم"
                    className="mr-1 p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              onOpenLogin && (
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                >
                  تسجيل الدخول
                </button>
              )
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none text-xs font-bold">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
