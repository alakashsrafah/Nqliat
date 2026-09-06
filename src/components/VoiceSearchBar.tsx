import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Search, X, Volume2, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface VoiceSearchBarProps {
  id?: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  className?: string;
  helperHints?: string[];
}

// Window declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceSearchBar: React.FC<VoiceSearchBarProps> = ({
  id = 'voice-search-bar',
  value,
  onChange,
  placeholder = 'ابحث بالاسم، الرقم، أو اضغط الميكروفون وتحدث...',
  className = '',
  helperHints = ['تحدث برقم السند', 'اسم السائق', 'وجهة الرحلة', 'نوع البضاعة'],
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showOfflineNotice, setShowOfflineNotice] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatusMessage('ميزة التعرف الصوتي غير مدعومة في هذا المتصفح مباشرة، يمكنك الكتابة يدوياً');
      setTimeout(() => setStatusMessage(''), 4000);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA'; // اللغة العربية الفصحى والمتوافقة مع كافة اللهجات العربية
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
        setStatusMessage('🎙️ جاري الاستماع باللغة العربية... تحدث الآن');
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setInterimTranscript(currentText);
        if (event.results[0].isFinal) {
          // Clean punctuation and trim
          const cleanText = currentText.trim();
          onChange(cleanText);
          setStatusMessage(`✓ تم التعرف على: "${cleanText}"`);
          setTimeout(() => setStatusMessage(''), 3000);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        setIsListening(false);
        setInterimTranscript('');

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setStatusMessage('⚠️ يرجى السماح للتطبيق بالوصول للميكروفون من إعدادات الهاتف');
        } else if (event.error === 'no-speech') {
          setStatusMessage('لم يتم سماع أي صوت، حاول مجدداً واقترب من الميكروفون');
        } else if (event.error === 'network') {
          setStatusMessage('ℹ️ محرك الصوت يحتاج تفعيل "التعرف الصوتي دون اتصال" في إعدادات هاتف أندرويد للعمل بدون نت');
        } else {
          setStatusMessage(`تم إنهاء الاستماع: ${event.error || 'حاول ثانية'}`);
        }
        setTimeout(() => setStatusMessage(''), 4500);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setStatusMessage('تعذر تشغيل الميكروفون، يرجى المحاولة ثانية');
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute right-3.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
          <Search className="w-5 h-5" />
        </div>

        {/* Text Input */}
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isListening ? 'جاري الاستماع لصوتك...' : placeholder}
          className={`w-full py-2.5 pr-11 pl-24 bg-white dark:bg-slate-900 border rounded-2xl text-xs sm:text-sm font-medium transition-all shadow-sm ${
            isListening
              ? 'border-red-500 ring-2 ring-red-400/40 bg-red-50/30 dark:bg-red-950/20 text-slate-900 dark:text-white'
              : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/30'
          }`}
        />

        {/* Action Controls on the Left (RTL Layout) */}
        <div className="absolute left-2 flex items-center gap-1">
          {/* Clear Button */}
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Voice Search Button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse ring-4 ring-red-400/40'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-95'
            }`}
            title={
              isSpeechSupported
                ? 'البحث الصوتي (يدعم الأوفلاين عند تفعيل حزمة اللغة العربية في أندرويد)'
                : 'التعرف الصوتي'
            }
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 animate-bounce" />
                <span className="hidden sm:inline">إيقاف</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">صوتي</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Voice Status or Interim Text */}
      {isListening && (
        <div className="flex items-center justify-between p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-800 dark:text-red-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="font-bold">تحدث الآن:</span>
            <span className="font-mono text-red-950 dark:text-white font-semibold">
              {interimTranscript || '...جاري التقاط الصوت'}
            </span>
          </div>

          <button
            type="button"
            onClick={stopListening}
            className="text-[11px] underline font-bold hover:text-red-950 dark:hover:text-white"
          >
            تم
          </button>
        </div>
      )}

      {/* Status Notice or Offline Hints */}
      {statusMessage && !isListening && (
        <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage('')}
            className="text-amber-700 dark:text-amber-300 hover:text-amber-950"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Helpful Voice Hints & Offline Support Explanation */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 dark:text-slate-500">أمثلة للبحث الصوتي:</span>
          {helperHints.slice(0, 3).map((hint, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(hint)}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-950 dark:hover:text-amber-300 rounded-md transition-colors cursor-pointer"
            >
              "{hint}"
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowOfflineNotice(!showOfflineNotice)}
          className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 shrink-0"
        >
          <Info className="w-3 h-3" />
          <span className="hidden sm:inline">هل يعمل بدون نت؟</span>
          <span className="sm:hidden">أوفلاين؟</span>
        </button>
      </div>

      {/* Offline Speech Guide Drawer / Alert */}
      {showOfflineNotice && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>نعم، يدعم البحث الصوتي العمل بدون إنترنت (Offline) على أندرويد:</span>
            </span>
            <button
              onClick={() => setShowOfflineNotice(false)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
            يستخدم التطبيق محرك التعرف الصوتي المدمج بهاتفك مباشرة (Android Speech Engine / Gboard).
            للعمل بدون اتصال بالإنترنت في أي مكان بالصحراء أو الطرق السريعة:
            افتح في هاتفك: <strong>الإعدادات ⚙️ ← النظام واللغات ← الكتابة بالصوت ← تنزيل حزمة التعرف على الصوت دون اتصال (العربية)</strong>.
          </p>
        </div>
      )}
    </div>
  );
};
