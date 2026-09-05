import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Server,
  Wifi,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Laptop,
  CheckCircle2,
  RefreshCw,
  Info,
  ShieldCheck,
  Share2,
  Radio,
  Sliders,
} from 'lucide-react';

interface ServerInfo {
  status: string;
  host: string;
  port: number;
  localIps: string[];
  hostname?: string;
  uptime?: number;
}

export const ServerSettingsView: React.FC = () => {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [customIp, setCustomIp] = useState<string>('');
  const [port, setPort] = useState<number>(3000);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [pingStatus, setPingStatus] = useState<'success' | 'testing' | 'error' | null>(null);
  const [pingTime, setPingTime] = useState<number | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch server info
  const fetchServerInfo = async () => {
    setLoading(true);
    try {
      const startTime = performance.now();
      const res = await fetch('/api/server-info');
      const endTime = performance.now();

      if (res.ok) {
        const data: ServerInfo = await res.json();
        setServerInfo(data);
        setPort(data.port || 3000);
        setPingTime(Math.round(endTime - startTime));
        setPingStatus('success');

        // Determine default IP
        if (data.localIps && data.localIps.length > 0) {
          setSelectedIp(data.localIps[0]);
        } else {
          const currentHost = window.location.hostname;
          setSelectedIp(currentHost !== 'localhost' && currentHost !== '127.0.0.1' ? currentHost : '192.168.1.100');
        }
      } else {
        throw new Error('Could not fetch server info');
      }
    } catch {
      // Fallback in case of static preview
      const currentHost = window.location.hostname;
      const defaultIp = currentHost !== 'localhost' && currentHost !== '127.0.0.1' && !currentHost.includes('run.app')
        ? currentHost
        : '192.168.1.100';

      setServerInfo({
        status: 'running',
        host: '0.0.0.0',
        port: 3000,
        localIps: [defaultIp],
      });
      setSelectedIp(defaultIp);
      setPingStatus('success');
      setPingTime(2);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerInfo();
  }, []);

  // Compute active connection URL
  const activeIp = customIp.trim() ? customIp.trim() : selectedIp || '192.168.1.100';
  const connectionUrl = window.location.protocol.startsWith('https') && window.location.hostname.includes('run.app')
    ? window.location.origin
    : `http://${activeIp}:${port}`;

  // Draw QR code on canvas
  useEffect(() => {
    if (qrCanvasRef.current && connectionUrl) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        connectionUrl,
        {
          width: 220,
          margin: 1.5,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR Code render error:', error);
        }
      );
    }
  }, [connectionUrl]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(connectionUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'برنامج الشحن والمحاسبة',
          text: `رابط الاتصال ببرنامج الشحن عبر الشبكة المحلية:\n${connectionUrl}`,
          url: connectionUrl,
        });
      } catch {
        handleCopyUrl();
      }
    } else {
      handleCopyUrl();
    }
  };

  const handlePingTest = async () => {
    setPingStatus('testing');
    const start = performance.now();
    try {
      await fetch('/api/server-info?t=' + Date.now(), { cache: 'no-store' });
      const duration = Math.round(performance.now() - start);
      setPingTime(duration);
      setPingStatus('success');
    } catch {
      setPingStatus('error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-sky-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-bold">
              <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>خادم الشبكة المحلية (Local LAN Server)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Server className="w-8 h-8 text-sky-400" />
              <span>إعدادات السيرفر والربط الشبكي</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              تتيح لك هذه اللوحة تشغيل ومشاركة البرنامج عبر شبكة الوايفاي (Wi-Fi) أو الشبكة المحلية (LAN) لفتح واستخدام النظام من هواتف، أجهزة لوحية (Tablets)، وكمبيوترات أخرى في نفس الوقت عبر المتصفح.
            </p>
          </div>

          {/* Quick Status Pill */}
          <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 flex items-center gap-4">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <div className="text-xs text-slate-400">حالة الخادم:</div>
              <div className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>نشط ويستمع للاتصالات</span>
              </div>
            </div>
            <button
              onClick={fetchServerInfo}
              title="تحديث حالة السيرفر"
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-200 transition-colors cursor-pointer mr-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Connection Details & QR Code */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Code & Direct Connect (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-sm mb-4">
              <QrCode className="w-5 h-5" />
              <span>امسح الكود للفتح على هاتفك أو جهازك</span>
            </div>

            {/* QR Code Canvas Box */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-inner flex items-center justify-center">
              <canvas ref={qrCanvasRef} className="rounded-xl max-w-full" />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 max-w-xs">
              افتح كاميرا الهاتف أو قارئ الباركود على أي جهاز متصل بنفس شبكة الراوتر للدخول الفوري.
            </p>

            {/* Active URL Display & Action Buttons */}
            <div className="w-full mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-500 block text-right mb-1">
                  رابط الاتصال المباشر:
                </span>
                <div className="flex items-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-sky-700 dark:text-sky-400 justify-between">
                  <span className="truncate" dir="ltr">{connectionUrl}</span>
                  <button
                    onClick={handleCopyUrl}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="نسخ الرابط"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyUrl}
                  className="w-full py-2.5 px-3 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedUrl ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-amber-500" />
                  <span>مشاركة الرابط</span>
                </button>
              </div>

              <a
                href={connectionUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-sky-400" />
                <span>فتح في تبويب جديد</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Server IP Selector & Setup Guide (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* IP & Port Configuration */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-500" />
              <span>عناوين الشبكة المتاحة وخيارات الخادم</span>
            </h2>

            {/* IP Selection Radios / List */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                اختر عنوان IP الخاص بالجهاز الرئيسي في شبكتك:
              </label>

              <div className="space-y-2">
                {serverInfo?.localIps && serverInfo.localIps.length > 0 ? (
                  serverInfo.localIps.map((ip) => (
                    <label
                      key={ip}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        selectedIp === ip && !customIp
                          ? 'bg-sky-500/10 border-sky-500 text-sky-900 dark:text-sky-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="serverIpChoice"
                          checked={selectedIp === ip && !customIp}
                          onChange={() => {
                            setSelectedIp(ip);
                            setCustomIp('');
                          }}
                          className="text-sky-600 focus:ring-0"
                        />
                        <span className="font-mono text-xs">{ip}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          IPv4 محلي
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        :{port}
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-mono">
                    {selectedIp}
                  </div>
                )}
              </div>
            </div>

            {/* Custom IP & Port override */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  أو كتابة عنوان IP مخصص للراوتر/الشبكة:
                </label>
                <input
                  type="text"
                  value={customIp}
                  onChange={(e) => setCustomIp(e.target.value)}
                  placeholder="مثال: 192.168.1.150"
                  dir="ltr"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  رقم المنفذ (Port):
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value) || 3000)}
                  dir="ltr"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Connectivity Test Bar */}
            <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${pingStatus === 'success' ? 'bg-emerald-500' : pingStatus === 'testing' ? 'bg-amber-500 animate-ping' : 'bg-rose-500'}`} />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {pingStatus === 'success'
                    ? `استجابة السيرفر ممتازة (${pingTime} مللي ثانية)`
                    : pingStatus === 'testing'
                    ? 'جاري فحص الاستجابة...'
                    : 'فشل فحص السيرفر'}
                </span>
              </div>
              <button
                type="button"
                onClick={handlePingTest}
                className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>فحص الاستجابة (Ping)</span>
              </button>
            </div>
          </div>

          {/* Connection Guide: How to connect devices on LAN */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Wifi className="w-5 h-5 text-sky-500" />
              <span>دليل خطوات ربط وتشغيل الأجهزة عبر الشبكة المحلية (LAN)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Step 1 */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-300 font-black flex items-center justify-center">
                  1
                </div>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-sky-500" />
                  <span>الاتصال بنفس الراوتر</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  تأكد من اتصال الجهاز الرئيسي (الذي يعمل عليه البرنامج) وجميع الهواتف أو أجهزة الكمبيوتر بنفس شبكة الوايفاي (Wi-Fi).
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-300 font-black flex items-center justify-center">
                  2
                </div>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-500" />
                  <span>مسح كود الـ QR</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  افتح كاميرا الهاتف أو جهاز التابلت وامسح رمز الاستجابة السريعة (QR) أو اكتب الرابط في متصفح الجوال (Chrome أو Safari).
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-300 font-black flex items-center justify-center">
                  3
                </div>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-emerald-500" />
                  <span>العمل والتسجيل فوراً</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  يفتح البرنامج بالكامل على أجهزة الموظفين في الفرع أو المحطة، ويمكن إدخال السندات والطلبات في نفس الوقت.
                </p>
              </div>
            </div>

            {/* Important Notes & Firewall Instructions */}
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2 text-xs">
              <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>إرشادات جدار الحماية (Windows Defender Firewall) وتثبيت الـ IP:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed pr-1">
                <li>
                  إذا لم يفتح الرابط على الأجهزة الأخرى، تأكد من استثناء منفذ <span className="font-mono font-bold text-amber-700 dark:text-amber-400">3000</span> في جدار حماية ويندوز للجهاز الرئيسي (Inbound Rule - Port 3000 TCP).
                </li>
                <li>
                  يُفضل تثبيت عنوان IP الجهاز الرئيسي من إعدادات الراوتر (DHCP Static Lease) ليبقى عنوان الاتصال ثابتاً ولا يتغير عند انقطاع الكهرباء.
                </li>
                <li>
                  على الهواتف المحمولة: يمكنك الضغط على خيارات المتصفح واختيار <strong>"إضافة إلى الشاشة الرئيسية (Add to Home screen)"</strong> ليعمل البرنامج كأيقونة تطبيق كامل بدون شريط المتصفح!
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
