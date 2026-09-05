// Developer Master Salt (Must match public/license-generator.html)
export const DEV_SECRET_SALT = 'NKLIAT_FREIGHT_2026_SECURE_DEV_KEY_!#99X';
const LICENSE_STORAGE_KEY = 'nkliat_license_info_v1';
const MACHINE_ID_KEY = 'nkliat_machine_unique_id';
const FIRST_OP_STORAGE_KEY = 'nkliat_first_operation_ts';
export const TRIAL_DURATION_DAYS = 7; // أسبوع واحد من تاريخ أول عملية

export interface LicenseInfo {
  isLicensed: boolean;
  licenseType: 'trial' | 'annual' | 'lifetime' | 'unlicensed';
  clientName: string;
  licenseKey: string;
  activatedAt: string;
  expiresAt: number; // 0 for lifetime
  expiresDateFormatted: string;
  daysRemaining: number;
  isExpired: boolean;
  machineId: string;
  firstOperationAt?: string;
  isTrialFromFirstOp?: boolean;
}

export interface LicenseVerificationResult {
  isValid: boolean;
  isExpired: boolean;
  needsPrompt: boolean;
  message: string;
  license: LicenseInfo;
}

export interface KeyGenerationOptions {
  machineId: string;
  clientName?: string;
  licenseType: 'trial' | 'annual' | 'lifetime' | 'custom';
  customDays?: number;
  customExpiryDate?: string; // YYYY-MM-DD
}

// Helper to hash string via subtle crypto
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class LicenseService {
  private static instance: LicenseService;

  private constructor() {}

  public static getInstance(): LicenseService {
    if (!LicenseService.instance) {
      LicenseService.instance = new LicenseService();
    }
    return LicenseService.instance;
  }

  // Generate or retrieve persistent Hardware / Machine ID
  public getMachineId(): string {
    let id = localStorage.getItem(MACHINE_ID_KEY);
    if (!id) {
      // Build a distinct recognizable Machine ID
      const randGroup = () =>
        Math.floor(1000 + Math.random() * 9000)
          .toString(16)
          .toUpperCase()
          .padStart(4, '0');
      id = `TRK-${randGroup()}-${randGroup()}-${randGroup()}`;
      localStorage.setItem(MACHINE_ID_KEY, id);
    }
    return id;
  }

  // Record first operation timestamp if not recorded yet
  public recordFirstOperationIfNeeded(): void {
    if (!localStorage.getItem(FIRST_OP_STORAGE_KEY)) {
      const now = Date.now();
      localStorage.setItem(FIRST_OP_STORAGE_KEY, now.toString());
    }
  }

  // Get first operation timestamp
  public getFirstOperationTimestamp(): number | null {
    const raw = localStorage.getItem(FIRST_OP_STORAGE_KEY);
    if (!raw) return null;
    const ts = parseInt(raw, 10);
    return isNaN(ts) ? null : ts;
  }

  // Set or reset first operation timestamp (useful for developer testing)
  public setFirstOperationTimestamp(timestamp: number | null): void {
    if (timestamp === null) {
      localStorage.removeItem(FIRST_OP_STORAGE_KEY);
    } else {
      localStorage.setItem(FIRST_OP_STORAGE_KEY, timestamp.toString());
    }
  }

  // Get current active license state
  public getCurrentLicense(): LicenseInfo {
    const machineId = this.getMachineId();
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY);

    // If a manual / paid license key was activated
    if (raw) {
      try {
        const data = JSON.parse(raw);
        const now = Date.now();
        const isLifetime = data.licenseType === 'lifetime' || data.expiresAt === 0;
        const isExpired = !isLifetime && data.expiresAt < now;
        const daysRemaining = isLifetime
          ? 9999
          : Math.max(0, Math.ceil((data.expiresAt - now) / (1000 * 60 * 60 * 24)));

        return {
          isLicensed: !isExpired,
          licenseType: data.licenseType || 'unlicensed',
          clientName: data.clientName || 'المستخدم',
          licenseKey: data.licenseKey || '',
          activatedAt: data.activatedAt || '',
          expiresAt: data.expiresAt || 0,
          expiresDateFormatted: isLifetime
            ? 'دائم مدى الحياة'
            : new Date(data.expiresAt).toISOString().split('T')[0],
          daysRemaining,
          isExpired,
          machineId,
          isTrialFromFirstOp: false,
        };
      } catch {
        // Fall back to first-operation trial
      }
    }

    // Free Trial: 1 week (7 days) starting from the date of the first operation
    const firstOpTs = this.getFirstOperationTimestamp();
    const now = Date.now();

    // If no operation has been performed yet
    if (!firstOpTs) {
      return {
        isLicensed: true,
        licenseType: 'trial',
        clientName: 'فترة تجريبية مجانية',
        licenseKey: '',
        activatedAt: 'تبدأ عند تسجيل أول عملية',
        expiresAt: 0,
        expiresDateFormatted: 'أسبوع من تاريخ أول عملية',
        daysRemaining: TRIAL_DURATION_DAYS,
        isExpired: false,
        machineId,
        firstOperationAt: 'لم تُسجل أي عملية بعد',
        isTrialFromFirstOp: true,
      };
    }

    // First operation was recorded: 7 days window
    const trialDurationMs = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
    const expiresAt = firstOpTs + trialDurationMs;
    const isExpired = now > expiresAt;
    const daysRemaining = isExpired
      ? 0
      : Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));

    const firstOpDateFormatted = new Date(firstOpTs).toISOString().split('T')[0];
    const expiryDateFormatted = new Date(expiresAt).toISOString().split('T')[0];

    return {
      isLicensed: !isExpired,
      licenseType: 'trial',
      clientName: 'فترة تجريبية (أسبوع)',
      licenseKey: '',
      activatedAt: firstOpDateFormatted,
      expiresAt,
      expiresDateFormatted: isExpired ? `انتهت (${expiryDateFormatted})` : expiryDateFormatted,
      daysRemaining,
      isExpired,
      machineId,
      firstOperationAt: firstOpDateFormatted,
      isTrialFromFirstOp: true,
    };
  }

  // Verify license status upon application launch
  public verifyLicenseOnStartup(): LicenseVerificationResult {
    const lic = this.getCurrentLicense();

    if (!lic.isLicensed) {
      return {
        isValid: false,
        isExpired: true,
        needsPrompt: true,
        message: lic.isTrialFromFirstOp
          ? 'انتهت الفترة التجريبية (أسبوع من تاريخ أول عملية). يرجى إدخال مفتاح التفعيل للاستمرار.'
          : lic.licenseKey
          ? 'انتهت صلاحية ترخيص النظام، يرجى تجديد الاشتراك.'
          : 'النظام غير مرخص، يرجى إدخال مفتاح التفعيل.',
        license: lic,
      };
    }

    // If trial has 2 days or less remaining, prompt warning
    if (lic.licenseType === 'trial' && lic.daysRemaining <= 2) {
      return {
        isValid: true,
        isExpired: false,
        needsPrompt: true,
        message: `تنبيه: متبقي ${lic.daysRemaining} يوم على انتهاء الفترة التجريبية (أسبوع من تاريخ أول عملية).`,
        license: lic,
      };
    }

    return {
      isValid: true,
      isExpired: false,
      needsPrompt: false,
      message: 'الترخيص سارٍ ونشط.',
      license: lic,
    };
  }

  // Developer tool: Generate cryptographically signed license key
  public async generateLicenseKey(options: KeyGenerationOptions): Promise<{
    licenseKey: string;
    expiryDateFormatted: string;
    expiryTimestamp: number;
    whatsAppMessage: string;
  }> {
    const client = (options.clientName || 'عميل نقليات').trim();
    const cleanMachine = (options.machineId || this.getMachineId()).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    let expiryTimestamp = 0;
    let expiryDateFormatted = 'دائم مدى الحياة';

    if (options.licenseType === 'trial') {
      const days = options.customDays || TRIAL_DURATION_DAYS;
      const d = new Date();
      d.setDate(d.getDate() + days);
      expiryTimestamp = d.getTime();
      expiryDateFormatted = d.toISOString().split('T')[0];
    } else if (options.licenseType === 'annual') {
      const days = options.customDays || 365;
      const d = new Date();
      d.setDate(d.getDate() + days);
      expiryTimestamp = d.getTime();
      expiryDateFormatted = d.toISOString().split('T')[0];
    } else if (options.licenseType === 'custom' && options.customExpiryDate) {
      const d = new Date(options.customExpiryDate);
      // End of day
      d.setHours(23, 59, 59, 999);
      expiryTimestamp = d.getTime();
      expiryDateFormatted = options.customExpiryDate;
    } else if (options.licenseType === 'lifetime') {
      expiryTimestamp = 0;
      expiryDateFormatted = 'دائم مدى الحياة';
    }

    const typeCode = options.licenseType === 'lifetime' ? 'l' : options.licenseType === 'trial' ? 't' : 'a';

    const payloadString = `${cleanMachine}|${options.licenseType}|${expiryTimestamp}|${client}|${DEV_SECRET_SALT}`;
    const rawHash = await sha256(payloadString);

    const payloadObj = {
      m: cleanMachine.substring(0, 8),
      t: typeCode,
      e: expiryTimestamp,
      s: rawHash.substring(0, 12).toUpperCase(),
    };

    const packedStr = btoa(JSON.stringify(payloadObj))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const licenseKey = `NKL-${packedStr}`;

    const typeNameMap = {
      trial: 'ترخيص تجريبي (أسبوع - 7 أيام)',
      annual: 'ترخيص سنوي (1 سنة)',
      lifetime: 'ترخيص كامل دائم (مدى الحياة)',
      custom: 'ترخيص مخصص',
    };

    const whatsAppMessage = `مرحباً بك عزيزي (${client}) 🌸
تم إصدار مفتاح تفعيل برنامج [نظام إدارة النقليات البرية] بنجاح:

📌 بيانات الترخيص:
- نوع الترخيص: ${typeNameMap[options.licenseType] || 'معتمد'}
- رمز الجهاز المرخص: ${options.machineId}
- تاريخ الانتهاء: ${expiryDateFormatted}

🔑 مفتاح التفعيل المشفر:
${licenseKey}

📋 طريقة التفعيل:
1. افتح البرنامج، ثم اضغط زر "تفعيل الترخيص" في الشريط العلوي.
2. الصق مفتاح التفعيل أعلاه في الحقل المخصص.
3. اضغط "تفعيل الترخيص الآن".

شكراً لثقتكم ونسعد بخدمتكم دائماً! ✨`;

    return {
      licenseKey,
      expiryDateFormatted,
      expiryTimestamp,
      whatsAppMessage,
    };
  }

  // Activate license using key generated by Developer License Generator
  public async activateLicense(licenseKey: string, clientName: string = ''): Promise<{ success: boolean; message: string }> {
    const key = licenseKey.trim();
    if (!key.startsWith('NKL-')) {
      return { success: false, message: 'صيغة مفتاح الترخيص غير صحيحة (يجب أن يبدأ بـ NKL-).' };
    }

    try {
      const b64 = key.substring(4).replace(/-/g, '+').replace(/_/g, '/');
      // Add padding back if necessary
      const paddedB64 = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
      const jsonStr = atob(paddedB64);
      const payload = JSON.parse(jsonStr);

      const machineId = this.getMachineId();
      const normalizedDevice = machineId.replace(/[^A-Z0-9]/g, '');

      // Check if machine prefix matches
      if (!normalizedDevice.startsWith(payload.m)) {
        return {
          success: false,
          message: 'هذا المفتاح مخصص لجهاز آخر ولا يتطابق مع معرف هذا الجهاز الحالي.',
        };
      }

      // Check expiration timestamp
      const now = Date.now();
      const isLifetime = payload.t === 'l' || payload.e === 0;
      if (!isLifetime && payload.e < now) {
        return { success: false, message: 'مفتاح الترخيص هذا منتهي الصلاحية بالفعل.' };
      }

      const typeMap: Record<string, 'trial' | 'annual' | 'lifetime'> = {
        t: 'trial',
        a: 'annual',
        l: 'lifetime',
      };
      const licenseType = typeMap[payload.t] || 'annual';

      // Save valid license
      const licenseData = {
        licenseKey: key,
        clientName: clientName.trim() || 'المؤسسة المرخصة',
        licenseType,
        activatedAt: new Date().toISOString(),
        expiresAt: payload.e,
      };

      localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(licenseData));
      return { success: true, message: 'تم تفعيل ترخيص النظام بنجاح!' };
    } catch {
      return {
        success: false,
        message: 'فشل فك تشفير مفتاح الترخيص، تأكد من نسخه بشكل صحيح ودقيق.',
      };
    }
  }

  // Reset / Deactivate (for re-licensing or testing)
  public deactivate(): void {
    localStorage.removeItem(LICENSE_STORAGE_KEY);
  }
}

export const licenseService = LicenseService.getInstance();
