import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../db/database';
import { Truck, ShieldCheck, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, ArrowLeft, KeyRound, Wifi } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, isDarkMode, onToggleTheme }) => {
  const users = db.getUsers();
  const [username, setUsername] = useState<string>(users[0]?.username || 'admin');
  const [password, setPassword] = useState<string>('123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const cleanUsername = username.trim().toLowerCase();
      const user = db.getUserByUsername(cleanUsername) || users.find((u) => u.username.toLowerCase() === cleanUsername);

      if (!user) {
        setErrorMessage('اسم المستخدم غير صحيح أو غير مسجل بالنظام');
        setIsLoading(false);
        return;
      }

      // Check password
      if (user.password_hash && user.password_hash !== password) {
        setErrorMessage('كلمة المرور غير صحيحة، يرجى إعادة المحاولة');
        setIsLoading(false);
        return;
      }

      // Save user session
      try {
        localStorage.setItem('nkliat_active_user_id', String(user.id));
      } catch (err) {
        console.error('Session storage error:', err);
      }

      setIsLoading(false);
      onLoginSuccess(user);
    }, 250);
  };

  const handleQuickSelect = (selectedUser: User) => {
    setUsername(selectedUser.username);
    setPassword(selectedUser.password_hash || '123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-900 text-slate-100 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6">
          {/* Header Brand */}
          <div className="text-center space-y-3">
            <div className="inline-flex p-3.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg text-slate-950 shadow-amber-500/20">
              <Truck className="w-9 h-9" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-serif">
                نقل أكسبرس
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                نظام إدارة النقل البري وأوامر الشحن والمحاسبة
              </p>
            </div>

            {/* Network Security Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[11px] font-bold text-amber-300">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>تسجيل الدخول إلزامي للأمان والربط الشبكي</span>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-500/60 rounded-xl text-rose-200 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                اسم المستخدم / الحساب:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  dir="auto"
                  autoComplete="username"
                  placeholder="أدخل اسم المستخدم (مثال: admin)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-3 pr-10 py-3 bg-slate-900 border-2 border-slate-700 focus:border-amber-500 focus:bg-slate-900 text-white rounded-xl text-sm font-bold placeholder:text-slate-500 transition-colors"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <UserIcon className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  كلمة المرور:
                </label>
                <span className="text-[11px] text-amber-400/80 font-mono">
                  (الافتراضية: 123)
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  dir="ltr"
                  autoComplete="current-password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-900 border-2 border-slate-700 focus:border-amber-500 focus:bg-slate-900 text-white rounded-xl text-sm font-mono font-bold placeholder:text-slate-500 transition-colors tracking-widest text-right"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <KeyRound className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>جاري التحقق...</span>
                </span>
              ) : (
                <>
                  <span>تسجيل الدخول للنظام</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Select Users for Ease of Use */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
              <span>حسابات النظام المسجلة (انقر للاختيار):</span>
              <span className="text-slate-500">كلمة السر: 123</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {users.map((u) => {
                const isSelected = username.toLowerCase() === u.username.toLowerCase();
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u)}
                    className={`p-2 rounded-xl text-right transition-all border text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 font-bold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-slate-600'}`} />
                      <span className="font-bold truncate">{u.username}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">{u.role}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Network Notice */}
          <div className="text-center pt-2">
            <div className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <Wifi className="w-3 h-3 text-sky-400" />
              <span>يعمل محلياً وعبر أجهزة الشبكة (LAN) في أمان كامل</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
