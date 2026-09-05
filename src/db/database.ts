import {
  ChartOfAccount,
  Currency,
  User,
  Vehicle,
  Driver,
  VoucherHeader,
  JournalEntry,
  ShipmentOrder,
  ShipmentExpenseItem,
  AccountType,
  VoucherTypeId,
} from '../types';

const STORAGE_KEY = 'nkliat_offline_db_v2';

export interface DatabaseSchema {
  chart_of_accounts: ChartOfAccount[];
  currencies: Currency[];
  users: User[];
  vehicles: Vehicle[];
  drivers: Driver[];
  voucher_header: VoucherHeader[];
  journal_entries: JournalEntry[];
  shipment_orders: ShipmentOrder[];
  shipment_expense_items: ShipmentExpenseItem[];
}

const DEFAULT_ACCOUNTS: ChartOfAccount[] = [
  // Level 1
  { id: 1, parent_id: null, account_code: '1', account_name: 'الأصول', account_type: 'أصول', account_level: 1 },
  { id: 2, parent_id: null, account_code: '2', account_name: 'الخصوم وحقوق الملكية', account_type: 'خصوم', account_level: 1 },
  { id: 3, parent_id: null, account_code: '3', account_name: 'المصروفات', account_type: 'مصروفات', account_level: 1 },
  { id: 4, parent_id: null, account_code: '4', account_name: 'الإيرادات', account_type: 'إيرادات', account_level: 1 },

  // Level 2
  { id: 11, parent_id: 1, account_code: '11', account_name: 'أصول غير متداولة', account_type: 'أصول', account_level: 2 },
  { id: 12, parent_id: 1, account_code: '12', account_name: 'أصول متداولة', account_type: 'أصول', account_level: 2 },
  { id: 21, parent_id: 2, account_code: '21', account_name: 'الخصوم المتداولة', account_type: 'خصوم', account_level: 2 },
  { id: 22, parent_id: 2, account_code: '22', account_name: 'حقوق الملكية', account_type: 'خصوم', account_level: 2 },
  { id: 31, parent_id: 3, account_code: '31', account_name: 'المصروفات التشغيلية', account_type: 'مصروفات', account_level: 2 },
  { id: 32, parent_id: 3, account_code: '32', account_name: 'المصروفات الإدارية العمومية', account_type: 'مصروفات', account_level: 2 },
  { id: 41, parent_id: 4, account_code: '41', account_name: 'إيرادات أنشطة النقل', account_type: 'إيرادات', account_level: 2 },

  // Level 3
  { id: 121, parent_id: 12, account_code: '121', account_name: 'العملاء والتجار', account_type: 'أصول', account_level: 3 },
  { id: 122, parent_id: 12, account_code: '122', account_name: 'الصناديق والبنوك', account_type: 'أصول', account_level: 3 },
  { id: 311, parent_id: 31, account_code: '311', account_name: 'مصروفات تشغيل الشاحنات', account_type: 'مصروفات', account_level: 3 },
  { id: 411, parent_id: 41, account_code: '411', account_name: 'إيرادات رحلات المركبات', account_type: 'إيرادات', account_level: 3 },

  // Level 4
  { id: 1220001, parent_id: 122, account_code: '1220001', account_name: 'الصندوق الرئيسي (ريال)', account_type: 'أصول', account_level: 4, phone_number: '' },
  { id: 1220002, parent_id: 122, account_code: '1220002', account_name: 'صندوق الدولار', account_type: 'أصول', account_level: 4, phone_number: '' },
  { id: 1210001, parent_id: 121, account_code: '1210001', account_name: 'شركة التجار المتحدين', account_type: 'أصول', account_level: 4, phone_number: '770000001' },
  { id: 1210002, parent_id: 121, account_code: '1210002', account_name: 'مؤسسة السعيد للتجارة', account_type: 'أصول', account_level: 4, phone_number: '770000002' },
  { id: 3110001, parent_id: 311, account_code: '3110001', account_name: 'مصروف وقود وديزل', account_type: 'مصروفات', account_level: 4 },
  { id: 3110002, parent_id: 311, account_code: '3110002', account_name: 'مصروف صيانة وقطع غيار', account_type: 'مصروفات', account_level: 4 },
  { id: 3110003, parent_id: 311, account_code: '3110003', account_name: 'رسوم طرق وموازين', account_type: 'مصروفات', account_level: 4 },
  { id: 3110004, parent_id: 311, account_code: '3110004', account_name: 'إعاشة وبدلات سائقين', account_type: 'مصروفات', account_level: 4 },
  { id: 4110001, parent_id: 411, account_code: '4110001', account_name: 'إيراد شاحنة مرسيدس 01', account_type: 'إيرادات', account_level: 4 },
  { id: 4110002, parent_id: 411, account_code: '4110002', account_name: 'إيراد شاحنة فولفو 02', account_type: 'إيرادات', account_level: 4 },
];

const DEFAULT_CURRENCIES: Currency[] = [
  { id: 1, currency_name: 'ريال يمني', currency_code: 'YER', currency_type: 'basic', currency_symbol: '﷼', exchange_rate: 1.0, details: 'العملة الأساسية للنظام' },
  { id: 2, currency_name: 'دولار أمريكي', currency_code: 'USD', currency_type: 'foreign', currency_symbol: '$', exchange_rate: 530.0, details: 'عملة أجنبية' },
  { id: 3, currency_name: 'ريال سعودي', currency_code: 'SAR', currency_type: 'foreign', currency_symbol: '﷼.س', exchange_rate: 140.0, details: 'عملة أجنبية' },
];

const DEFAULT_USERS: User[] = [
  { id: 1, username: 'admin', full_name: 'مدير النظام الرئيسي', password_hash: '123', role: 'مدير النظام', user_type: 'مدير', user_code: '101' },
  { id: 2, username: 'emp1', full_name: 'أحمد المحاسب', password_hash: '123', role: 'محاسب', user_type: 'موظف', user_code: '102' },
  { id: 3, username: 'op1', full_name: 'علي المشغل', password_hash: '123', role: 'مشغل حركة', user_type: 'موظف', user_code: '103' },
];

const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: 1,
    vehicle_name: 'مرسيدس أكتروس 3340',
    vehicle_number: '1234-أ',
    vehicle_code: 'V-01',
    account_code: '4110001',
    specifications: 'قاطرة ومقطورة حمولة 40 طن - موديل 2020',
    last_oil_change_date: '2026-08-15',
    change_log: '2026-08-15: تغيير زيت 15W40 وفلتر ديزل\n2026-06-01: تغيير زيت كامل',
    parent_revenue_account: '411',
  },
  {
    id: 2,
    vehicle_name: 'فولفو FH16',
    vehicle_number: '5678-ب',
    vehicle_code: 'V-02',
    account_code: '4110002',
    specifications: 'قاطرة ومقطورة حمولة 45 طن - موديل 2022',
    last_oil_change_date: '2026-08-20',
    change_log: '2026-08-20: تغيير زيت المحرك عند 120,000 كم',
    parent_revenue_account: '411',
  },
];

const DEFAULT_DRIVERS: Driver[] = [
  { id: 1, full_name: 'محمد علي القاسمي', phone_number: '771234567', license_number: 'LIC-88219', status: 'نشط', notes: 'سائق شاحنة مرسيدس أكتروس V-01' },
  { id: 2, full_name: 'سالم عبدالله باوزير', phone_number: '772345678', license_number: 'LIC-55102', status: 'في رحلة', notes: 'سائق شاحنة فولفو FH16 V-02' },
  { id: 3, full_name: 'صالح مرشد الحميري', phone_number: '773456789', license_number: 'LIC-99341', status: 'نشط', notes: 'سائق خطوط ومسافات طويلة' },
  { id: 4, full_name: 'عبدالرحمن طاهر الوابلي', phone_number: '774567890', license_number: 'LIC-33412', status: 'إجازة', notes: 'سائق احتياطي' },
];

// Initial Seed Vouchers for demo readiness
const DEFAULT_VOUCHER_HEADERS: VoucherHeader[] = [
  {
    id: 1,
    type_id: 1,
    number: 1,
    date: '2026-08-01',
    amount: 1000000,
    currency_code: 'YER',
    exchange_rate: 1.0,
    description: 'سند قبض افتتاح الصندوق الرئيسي',
    created_by: 1,
    created_at: '2026-08-01 10:00:00',
  },
  {
    id: 2,
    type_id: 1,
    number: 2,
    date: '2026-08-10',
    amount: 500,
    currency_code: 'USD',
    exchange_rate: 530.0,
    description: 'دفعة حساب من شركة التجار المتحدين (500 دولار)',
    created_by: 1,
    created_at: '2026-08-10 11:30:00',
  },
];

const DEFAULT_JOURNAL_ENTRIES: JournalEntry[] = [
  // Voucher 1: Initial Cash Balance (Debit Box, Credit Capital/Equity)
  {
    id: 1,
    voucher_id: 1,
    account_code: '1220001',
    entry_date: '2026-08-01',
    debit: 1000000,
    credit: 0,
    currency_code: 'YER',
    exchange_rate: 1.0,
    description: 'إيداع نقدي بالصندوق الرئيسي',
    equivalent_debit: 1000000,
    equivalent_credit: 0,
  },
  {
    id: 2,
    voucher_id: 1,
    account_code: '1210001',
    entry_date: '2026-08-01',
    debit: 0,
    credit: 1000000,
    currency_code: 'YER',
    exchange_rate: 1.0,
    description: 'رصيد افتتاحي - شركة التجار المتحدين',
    equivalent_debit: 0,
    equivalent_credit: 1000000,
  },

  // Voucher 2: Receipt Voucher in USD
  {
    id: 3,
    voucher_id: 2,
    account_code: '1220002',
    entry_date: '2026-08-10',
    debit: 500,
    credit: 0,
    currency_code: 'USD',
    exchange_rate: 530.0,
    description: 'استلام 500$ صندوق الدولار',
    equivalent_debit: 265000,
    equivalent_credit: 0,
  },
  {
    id: 4,
    voucher_id: 2,
    account_code: '1210001',
    entry_date: '2026-08-10',
    debit: 0,
    credit: 500,
    currency_code: 'USD',
    exchange_rate: 530.0,
    description: 'سداد من حساب شركة التجار المتحدين',
    equivalent_debit: 0,
    equivalent_credit: 265000,
  },
];

const DEFAULT_SHIPMENT_ORDERS: ShipmentOrder[] = [
  {
    id: 1,
    reference_number: 'SH-2026-001',
    vehicle_id: 1,
    merchant_account_code: '1210001',
    trip_amount: 1500000,
    trip_currency_code: 'YER',
    trip_exchange_rate: 1.0,
    departure_point: 'عدن',
    arrival_point: 'صنعاء',
    route: 'عدن - الضالع - إب - صنعاء',
    payload_weight: 35,
    road_length: 380,
    departure_date: '2026-08-12',
    arrival_date: '2026-08-14',
    driver_name: 'محمد عبدالله',
    goods_type: 'مواد غذائية ومشروبات',
    notes: 'تم تسليم البضاعة بحالة سريمة مع التوقيع',
    is_financially_posted: 0, // Draft
    voucher_id: null,
    created_by: 1,
    created_at: '2026-08-12 09:00:00',
  },
];

const DEFAULT_SHIPMENT_EXPENSES: ShipmentExpenseItem[] = [
  {
    id: 1,
    shipment_order_id: 1,
    account_code: '3110001',
    amount: 350000,
    currency_code: 'YER',
    exchange_rate: 1.0,
    expense_date: '2026-08-12',
    description: 'ديزل وقود للرحلة',
  },
  {
    id: 2,
    shipment_order_id: 1,
    account_code: '3110003',
    amount: 50000,
    currency_code: 'YER',
    exchange_rate: 1.0,
    expense_date: '2026-08-13',
    description: 'رسوم كشافة وموازين الطريق',
  },
  {
    id: 3,
    shipment_order_id: 1,
    account_code: '3110004',
    amount: 100000,
    currency_code: 'YER',
    exchange_rate: 1.0,
    expense_date: '2026-08-12',
    description: 'إعاشة السائق ومساعده',
  },
];

class OfflineDatabase {
  private schema: DatabaseSchema;

  constructor() {
    this.schema = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          chart_of_accounts: parsed.chart_of_accounts || DEFAULT_ACCOUNTS,
          currencies: parsed.currencies || DEFAULT_CURRENCIES,
          users: parsed.users || DEFAULT_USERS,
          vehicles: parsed.vehicles || DEFAULT_VEHICLES,
          drivers: parsed.drivers || DEFAULT_DRIVERS,
          voucher_header: parsed.voucher_header || DEFAULT_VOUCHER_HEADERS,
          journal_entries: parsed.journal_entries || DEFAULT_JOURNAL_ENTRIES,
          shipment_orders: parsed.shipment_orders || DEFAULT_SHIPMENT_ORDERS,
          shipment_expense_items: parsed.shipment_expense_items || DEFAULT_SHIPMENT_EXPENSES,
        };
      }
    } catch (e) {
      console.error('Failed to load database from localStorage', e);
    }

    const initial = {
      chart_of_accounts: DEFAULT_ACCOUNTS,
      currencies: DEFAULT_CURRENCIES,
      users: DEFAULT_USERS,
      vehicles: DEFAULT_VEHICLES,
      drivers: DEFAULT_DRIVERS,
      voucher_header: DEFAULT_VOUCHER_HEADERS,
      journal_entries: DEFAULT_JOURNAL_ENTRIES,
      shipment_orders: DEFAULT_SHIPMENT_ORDERS,
      shipment_expense_items: DEFAULT_SHIPMENT_EXPENSES,
    };
    this.saveDatabase(initial);
    return initial;
  }

  private saveDatabase(data?: DatabaseSchema) {
    if (data) {
      this.schema = data;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.schema));
  }

  public getRawData(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.schema));
  }

  public replaceEntireDatabase(newSchema: DatabaseSchema): void {
    this.saveDatabase(newSchema);
  }

  public exportJSON(): string {
    return JSON.stringify(this.schema, null, 2);
  }

  public importJSON(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (
        Array.isArray(parsed.chart_of_accounts) &&
        Array.isArray(parsed.currencies) &&
        Array.isArray(parsed.users)
      ) {
        this.saveDatabase(parsed);
        return true;
      }
    } catch (e) {
      console.error('Import failed', e);
    }
    return false;
  }

  public resetToDefault() {
    const initial = {
      chart_of_accounts: DEFAULT_ACCOUNTS,
      currencies: DEFAULT_CURRENCIES,
      users: DEFAULT_USERS,
      vehicles: DEFAULT_VEHICLES,
      drivers: DEFAULT_DRIVERS,
      voucher_header: DEFAULT_VOUCHER_HEADERS,
      journal_entries: DEFAULT_JOURNAL_ENTRIES,
      shipment_orders: DEFAULT_SHIPMENT_ORDERS,
      shipment_expense_items: DEFAULT_SHIPMENT_EXPENSES,
    };
    this.saveDatabase(initial);
  }

  // --- CHART OF ACCOUNTS ---
  public getAccounts(): ChartOfAccount[] {
    return [...this.schema.chart_of_accounts].sort((a, b) => a.account_code.localeCompare(b.account_code));
  }

  public getAccountByCode(code: string): ChartOfAccount | undefined {
    return this.schema.chart_of_accounts.find((a) => a.account_code === code);
  }

  public generateNextAccountCode(parentId: number | null, customType?: AccountType): { account_code: string; account_level: number; account_type: AccountType } {
    if (!parentId) {
      // Level 1 account
      const level1Accounts = this.schema.chart_of_accounts.filter((a) => a.account_level === 1);
      const nextNum = level1Accounts.length + 1;
      return {
        account_code: String(nextNum),
        account_level: 1,
        account_type: customType || 'أصول',
      };
    }

    const parent = this.schema.chart_of_accounts.find((a) => a.id === parentId);
    if (!parent) {
      throw new Error('الحساب الأب غير موجود');
    }

    const targetLevel = parent.account_level + 1;
    if (targetLevel > 4) {
      throw new Error('وصلت إلى الحد الأقصى لمستويات الشجرة (مستوى 4)');
    }

    const siblings = this.schema.chart_of_accounts.filter((a) => a.parent_id === parentId);

    if (targetLevel === 2 || targetLevel === 3) {
      // e.g. parent '1' -> '11', '12', '13'
      // parent '12' -> '121', '122'
      const lastSibling = siblings[siblings.length - 1];
      let nextSuffix = 1;
      if (lastSibling) {
        const lastDigitStr = lastSibling.account_code.slice(parent.account_code.length);
        nextSuffix = (parseInt(lastDigitStr, 10) || 0) + 1;
      }
      return {
        account_code: `${parent.account_code}${nextSuffix}`,
        account_level: targetLevel,
        account_type: parent.account_type,
      };
    } else {
      // Level 4: 4 digits sequential under parent e.g. 1110001
      const lastSibling = siblings[siblings.length - 1];
      let nextSeq = 1;
      if (lastSibling) {
        const seqStr = lastSibling.account_code.slice(parent.account_code.length);
        nextSeq = (parseInt(seqStr, 10) || 0) + 1;
      }
      const formattedSeq = String(nextSeq).padStart(4, '0');
      return {
        account_code: `${parent.account_code}${formattedSeq}`,
        account_level: 4,
        account_type: parent.account_type,
      };
    }
  }

  public addAccount(data: { parent_id: number | null; account_name: string; custom_type?: AccountType; phone_number?: string }): ChartOfAccount {
    const { account_code, account_level, account_type } = this.generateNextAccountCode(data.parent_id, data.custom_type);
    
    // Ensure code unique
    if (this.schema.chart_of_accounts.some((a) => a.account_code === account_code)) {
      throw new Error(`رمز الحساب ${account_code} مستخدم بالفعل`);
    }

    const newId = this.schema.chart_of_accounts.reduce((max, a) => Math.max(max, a.id), 0) + 1;
    const newAccount: ChartOfAccount = {
      id: newId,
      parent_id: data.parent_id,
      account_code,
      account_name: data.account_name,
      account_type,
      account_level,
      phone_number: data.phone_number || '',
    };

    this.schema.chart_of_accounts.push(newAccount);
    this.saveDatabase();
    return newAccount;
  }

  public updateAccount(id: number, data: { account_name: string; phone_number?: string }): ChartOfAccount {
    const acc = this.schema.chart_of_accounts.find((a) => a.id === id);
    if (!acc) throw new Error('الحساب غير موجود');
    acc.account_name = data.account_name;
    if (data.phone_number !== undefined) {
      acc.phone_number = data.phone_number;
    }
    this.saveDatabase();
    return acc;
  }

  public deleteAccount(id: number): void {
    const acc = this.schema.chart_of_accounts.find((a) => a.id === id);
    if (!acc) throw new Error('الحساب غير موجود');

    // Check if children exist
    const hasChildren = this.schema.chart_of_accounts.some((a) => a.parent_id === id);
    if (hasChildren) {
      throw new Error('لا يمكن حذف الحساب لأنه يحتوي على حسابات فرعية أطفال');
    }

    // Check if used in journal entries
    const usedInEntries = this.schema.journal_entries.some((e) => e.account_code === acc.account_code);
    if (usedInEntries) {
      throw new Error('لا يمكن حذف الحساب لأنه مرتبط بقيود محاسبية مسجلة');
    }

    // Check if used in vehicles
    const usedInVehicles = this.schema.vehicles.some((v) => v.account_code === acc.account_code);
    if (usedInVehicles) {
      throw new Error('لا يمكن حذف الحساب لأنه مرتبط بمركبة مسجلة');
    }

    // Check if used in shipment orders
    const usedInShipments = this.schema.shipment_orders.some((s) => s.merchant_account_code === acc.account_code);
    if (usedInShipments) {
      throw new Error('لا يمكن حذف الحساب لأنه مرتبط بأوامر شحن');
    }

    this.schema.chart_of_accounts = this.schema.chart_of_accounts.filter((a) => a.id !== id);
    this.saveDatabase();
  }

  // --- CURRENCIES ---
  public getCurrencies(): Currency[] {
    return [...this.schema.currencies];
  }

  public addCurrency(data: Omit<Currency, 'id'>): Currency {
    if (data.currency_type === 'basic') {
      const existingBasic = this.schema.currencies.find((c) => c.currency_type === 'basic');
      if (existingBasic) {
        throw new Error('توجد عملة أساسية مسبقاً في النظام. لا يمكن إضافة أكثر من عملة أساسية واحدة');
      }
    }

    if (this.schema.currencies.some((c) => c.currency_code.toUpperCase() === data.currency_code.toUpperCase())) {
      throw new Error(`رمز العملة ${data.currency_code} مستخدم بالفعل`);
    }

    const newId = this.schema.currencies.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const newCurr: Currency = {
      ...data,
      id: newId,
      currency_code: data.currency_code.toUpperCase(),
      exchange_rate: data.currency_type === 'basic' ? 1.0 : data.exchange_rate,
    };
    this.schema.currencies.push(newCurr);
    this.saveDatabase();
    return newCurr;
  }

  public updateCurrencyRate(id: number, exchange_rate: number, details?: string): Currency {
    const curr = this.schema.currencies.find((c) => c.id === id);
    if (!curr) throw new Error('العملة غير موجودة');
    if (curr.currency_type === 'basic') {
      throw new Error('لا يمكن تغيير سعر صرف العملة الأساسية (تساوي دائمًا 1)');
    }
    if (exchange_rate <= 0) {
      throw new Error('سعر الصرف يجب أن يكون أكبر من صفر');
    }
    curr.exchange_rate = exchange_rate;
    if (details) curr.details = details;
    this.saveDatabase();
    return curr;
  }

  public deleteCurrency(id: number): void {
    const curr = this.schema.currencies.find((c) => c.id === id);
    if (!curr) throw new Error('العملة غير موجودة');
    if (curr.currency_type === 'basic') {
      throw new Error('لا يمكن حذف العملة الأساسية للنظام');
    }

    const usedInEntries = this.schema.journal_entries.some((e) => e.currency_code === curr.currency_code);
    const usedInHeaders = this.schema.voucher_header.some((v) => v.currency_code === curr.currency_code);
    const usedInShipments = this.schema.shipment_orders.some((s) => s.trip_currency_code === curr.currency_code);

    if (usedInEntries || usedInHeaders || usedInShipments) {
      throw new Error('لا يمكن حذف العملة لأنها مستخدمة في عمليات أو قيود أو أوامر شحن');
    }

    this.schema.currencies = this.schema.currencies.filter((c) => c.id !== id);
    this.saveDatabase();
  }

  // --- USERS ---
  public getUsers(): User[] {
    return [...this.schema.users];
  }

  public addUser(data: Omit<User, 'id'>): User {
    if (this.schema.users.some((u) => u.username.toLowerCase() === data.username.toLowerCase())) {
      throw new Error('اسم المستخدم موجود بالفعل');
    }
    const newId = this.schema.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const newUser: User = { ...data, id: newId };
    this.schema.users.push(newUser);
    this.saveDatabase();
    return newUser;
  }

  public updateUser(id: number, data: Partial<User>): User {
    const user = this.schema.users.find((u) => u.id === id);
    if (!user) throw new Error('المستخدم غير موجود');
    if (data.username && data.username.toLowerCase() !== user.username.toLowerCase()) {
      if (this.schema.users.some((u) => u.username.toLowerCase() === data.username!.toLowerCase())) {
        throw new Error('اسم المستخدم التابع مأخوذ بالفعل');
      }
      user.username = data.username;
    }
    if (data.full_name) user.full_name = data.full_name;
    if (data.password_hash) user.password_hash = data.password_hash;
    if (data.role) user.role = data.role;
    if (data.user_type) user.user_type = data.user_type;
    if (data.user_code !== undefined) user.user_code = data.user_code;
    this.saveDatabase();
    return user;
  }

  public deleteUser(id: number, currentUserId?: number): void {
    if (currentUserId && id === currentUserId) {
      throw new Error('لا يمكنك حذف حساب المستخدم الحالي المسجل به الدخول');
    }
    this.schema.users = this.schema.users.filter((u) => u.id !== id);
    this.saveDatabase();
  }

  // --- VEHICLES ---
  public getVehicles(): Vehicle[] {
    return [...this.schema.vehicles];
  }

  public addVehicle(data: {
    vehicle_name: string;
    vehicle_number: string;
    vehicle_code: string;
    parent_revenue_account_id: number;
    specifications: string;
    last_oil_change_date: string;
  }): Vehicle {
    if (this.schema.vehicles.some((v) => v.vehicle_code.toLowerCase() === data.vehicle_code.toLowerCase())) {
      throw new Error(`كود المركبة ${data.vehicle_code} مستخدم بالفعل`);
    }

    const parentAccount = this.schema.chart_of_accounts.find((a) => a.id === data.parent_revenue_account_id);
    if (!parentAccount) throw new Error('حساب الإيرادات الأب المحدد غير موجود');

    // Auto generate a Level 4 revenue account for the vehicle under this parent
    const createdAccount = this.addAccount({
      parent_id: parentAccount.id,
      account_name: `إيراد مركبة - ${data.vehicle_name} (${data.vehicle_number})`,
    });

    const newId = this.schema.vehicles.reduce((max, v) => Math.max(max, v.id), 0) + 1;
    const newVehicle: Vehicle = {
      id: newId,
      vehicle_name: data.vehicle_name,
      vehicle_number: data.vehicle_number,
      vehicle_code: data.vehicle_code,
      account_code: createdAccount.account_code,
      specifications: data.specifications,
      last_oil_change_date: data.last_oil_change_date || new Date().toISOString().split('T')[0],
      change_log: `${data.last_oil_change_date || new Date().toISOString().split('T')[0]}: إضافة المركبة للأسطول`,
      parent_revenue_account: parentAccount.account_code,
    };

    this.schema.vehicles.push(newVehicle);
    this.saveDatabase();
    return newVehicle;
  }

  public updateVehicle(id: number, data: Omit<Vehicle, 'id' | 'account_code'>): Vehicle {
    const vehicle = this.schema.vehicles.find((v) => v.id === id);
    if (!vehicle) throw new Error('المركبة غير موجودة');

    vehicle.vehicle_name = data.vehicle_name;
    vehicle.vehicle_number = data.vehicle_number;
    vehicle.vehicle_code = data.vehicle_code;
    vehicle.specifications = data.specifications;
    vehicle.last_oil_change_date = data.last_oil_change_date;
    vehicle.change_log = data.change_log;

    this.saveDatabase();
    return vehicle;
  }

  public logOilChange(id: number, date: string, note: string): Vehicle {
    const vehicle = this.schema.vehicles.find((v) => v.id === id);
    if (!vehicle) throw new Error('المركبة غير موجودة');

    vehicle.last_oil_change_date = date;
    const logEntry = `${date}: ${note || 'تغيير زيت دوري'}`;
    vehicle.change_log = vehicle.change_log ? `${logEntry}\n${vehicle.change_log}` : logEntry;

    this.saveDatabase();
    return vehicle;
  }

  // --- DRIVERS ---
  public getDrivers(): Driver[] {
    return [...(this.schema.drivers || [])];
  }

  public getDriverById(id: number): Driver | undefined {
    return (this.schema.drivers || []).find((d) => d.id === id);
  }

  public addDriver(data: {
    full_name: string;
    phone_number?: string;
    license_number?: string;
    status?: any;
    notes?: string;
  }): Driver {
    if (!data.full_name || !data.full_name.trim()) {
      throw new Error('اسم السائق مطلوب ولا يمكن أن يكون فارغاً');
    }
    if (!this.schema.drivers) {
      this.schema.drivers = [];
    }
    const newId = this.schema.drivers.reduce((max, d) => Math.max(max, d.id), 0) + 1;
    const newDriver: Driver = {
      id: newId,
      full_name: data.full_name.trim(),
      phone_number: data.phone_number?.trim() || '',
      license_number: data.license_number?.trim() || '',
      status: data.status || 'نشط',
      notes: data.notes?.trim() || '',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.schema.drivers.push(newDriver);
    this.saveDatabase();
    return newDriver;
  }

  public updateDriver(id: number, data: Partial<Omit<Driver, 'id'>>): Driver {
    if (!this.schema.drivers) this.schema.drivers = [];
    const index = this.schema.drivers.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('السائق غير موجود');

    this.schema.drivers[index] = {
      ...this.schema.drivers[index],
      ...data,
      full_name: data.full_name !== undefined ? data.full_name.trim() : this.schema.drivers[index].full_name,
    };
    this.saveDatabase();
    return this.schema.drivers[index];
  }

  public deleteDriver(id: number): void {
    if (!this.schema.drivers) return;
    this.schema.drivers = this.schema.drivers.filter((d) => d.id !== id);
    this.saveDatabase();
  }

  public deleteVehicle(id: number): void {
    const vehicle = this.schema.vehicles.find((v) => v.id === id);
    if (!vehicle) throw new Error('المركبة غير موجودة');

    // Prevent if linked to any shipment orders
    const hasShipments = this.schema.shipment_orders.some((s) => s.vehicle_id === id);
    if (hasShipments) {
      throw new Error('لا يمكن حذف المركبة لأنها مرتبطة بأوامر شحن مسجلة للنظام');
    }

    this.schema.vehicles = this.schema.vehicles.filter((v) => v.id !== id);
    this.saveDatabase();
  }

  // --- VOUCHERS & JOURNAL ENTRIES ---
  public getNextVoucherNumber(type_id: 1 | 2 | 3 | 4): number {
    const vouchersOfType = this.schema.voucher_header.filter((v) => v.type_id === type_id);
    return vouchersOfType.reduce((max, v) => Math.max(max, v.number), 0) + 1;
  }

  // Receipt Voucher Creation
  public createReceiptVoucher(data: {
    cash_account_code: string;
    date: string;
    description: string;
    user_id: number;
    items: {
      account_code: string;
      amount: number;
      currency_code: string;
      exchange_rate: number;
      description: string;
    }[];
  }): { header: VoucherHeader; entries: JournalEntry[] } {
    if (!data.items || data.items.length === 0) {
      throw new Error('يجب إضافة بند واحد على الأقل للسند');
    }

    const number = this.getNextVoucherNumber(1);
    const totalEqAmount = data.items.reduce((sum, item) => sum + item.amount * item.exchange_rate, 0);

    const headerId = this.schema.voucher_header.reduce((max, v) => Math.max(max, v.id), 0) + 1;
    const header: VoucherHeader = {
      id: headerId,
      type_id: 1,
      number,
      date: data.date,
      amount: totalEqAmount,
      currency_code: data.items[0].currency_code,
      exchange_rate: data.items[0].exchange_rate,
      description: data.description,
      created_by: data.user_id,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    let nextEntryId = this.schema.journal_entries.reduce((max, e) => Math.max(max, e.id), 0) + 1;
    const entries: JournalEntry[] = [];

    // Group items by currency to create single debit entry per currency for cash account
    const currencyTotals: Record<string, { total_credit: number; avg_rate: number; count: number }> = {};

    // Credit entries
    for (const item of data.items) {
      if (item.amount <= 0) throw new Error('مبلغ البند يجب أن يكون أكبر من صفر');
      const eq = item.amount * item.exchange_rate;

      entries.push({
        id: nextEntryId++,
        voucher_id: headerId,
        account_code: item.account_code,
        entry_date: data.date,
        debit: 0,
        credit: item.amount,
        currency_code: item.currency_code,
        exchange_rate: item.exchange_rate,
        description: item.description || data.description,
        equivalent_debit: 0,
        equivalent_credit: eq,
      });

      if (!currencyTotals[item.currency_code]) {
        currencyTotals[item.currency_code] = { total_credit: 0, avg_rate: item.exchange_rate, count: 0 };
      }
      currencyTotals[item.currency_code].total_credit += item.amount;
    }

    // Debit entries for Cash Box account per currency
    for (const [currCode, info] of Object.entries(currencyTotals)) {
      const eq = info.total_credit * info.avg_rate;
      entries.push({
        id: nextEntryId++,
        voucher_id: headerId,
        account_code: data.cash_account_code,
        entry_date: data.date,
        debit: info.total_credit,
        credit: 0,
        currency_code: currCode,
        exchange_rate: info.avg_rate,
        description: `قبض نقدي - ${data.description}`,
        equivalent_debit: eq,
        equivalent_credit: 0,
      });
    }

    this.schema.voucher_header.push(header);
    this.schema.journal_entries.push(...entries);
    this.saveDatabase();
    return { header, entries };
  }

  // Payment Voucher Creation
  public createPaymentVoucher(data: {
    cash_account_code: string;
    date: string;
    description: string;
    user_id: number;
    items: {
      account_code: string;
      amount: number;
      currency_code: string;
      exchange_rate: number;
      description: string;
    }[];
  }): { header: VoucherHeader; entries: JournalEntry[] } {
    if (!data.items || data.items.length === 0) {
      throw new Error('يجب إضافة بند واحد على الأقل للسند');
    }

    const number = this.getNextVoucherNumber(2);
    const totalEqAmount = data.items.reduce((sum, item) => sum + item.amount * item.exchange_rate, 0);

    const headerId = this.schema.voucher_header.reduce((max, v) => Math.max(max, v.id), 0) + 1;
    const header: VoucherHeader = {
      id: headerId,
      type_id: 2,
      number,
      date: data.date,
      amount: totalEqAmount,
      currency_code: data.items[0].currency_code,
      exchange_rate: data.items[0].exchange_rate,
      description: data.description,
      created_by: data.user_id,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    let nextEntryId = this.schema.journal_entries.reduce((max, e) => Math.max(max, e.id), 0) + 1;
    const entries: JournalEntry[] = [];

    const currencyTotals: Record<string, { total_debit: number; avg_rate: number }> = {};

    // Debit entries for paid accounts
    for (const item of data.items) {
      if (item.amount <= 0) throw new Error('مبلغ البند يجب أن يكون أكبر من صفر');
      const eq = item.amount * item.exchange_rate;

      entries.push({
        id: nextEntryId++,
        voucher_id: headerId,
        account_code: item.account_code,
        entry_date: data.date,
        debit: item.amount,
        credit: 0,
        currency_code: item.currency_code,
        exchange_rate: item.exchange_rate,
        description: item.description || data.description,
        equivalent_debit: eq,
        equivalent_credit: 0,
      });

      if (!currencyTotals[item.currency_code]) {
        currencyTotals[item.currency_code] = { total_debit: 0, avg_rate: item.exchange_rate };
      }
      currencyTotals[item.currency_code].total_debit += item.amount;
    }

    // Credit entries for Cash Box account per currency
    for (const [currCode, info] of Object.entries(currencyTotals)) {
      const eq = info.total_debit * info.avg_rate;
      entries.push({
        id: nextEntryId++,
        voucher_id: headerId,
        account_code: data.cash_account_code,
        entry_date: data.date,
        debit: 0,
        credit: info.total_debit,
        currency_code: currCode,
        exchange_rate: info.avg_rate,
        description: `صرف نقدي - ${data.description}`,
        equivalent_debit: 0,
        equivalent_credit: eq,
      });
    }

    this.schema.voucher_header.push(header);
    this.schema.journal_entries.push(...entries);
    this.saveDatabase();
    return { header, entries };
  }

  // Simple Journal Voucher Creation
  public createJournalVoucher(data: {
    date: string;
    description: string;
    user_id: number;
    items: {
      account_code: string;
      debit: number;
      credit: number;
      currency_code: string;
      exchange_rate: number;
      description: string;
    }[];
  }): { header: VoucherHeader; entries: JournalEntry[] } {
    if (!data.items || data.items.length < 2) {
      throw new Error('قيد اليومية يقتضي وجود بندين على الأقل (مدين ودائن)');
    }

    let totalEqDebit = 0;
    let totalEqCredit = 0;

    for (const item of data.items) {
      totalEqDebit += item.debit * item.exchange_rate;
      totalEqCredit += item.credit * item.exchange_rate;
    }

    // Check balance with tolerance for floating point rounding
    if (Math.abs(totalEqDebit - totalEqCredit) > 0.01) {
      throw new Error(
        `القيد غير متوازن! مجموع المدين المكافئ (${totalEqDebit.toLocaleString()}) لا يساوي مجموع الدائن المكافئ (${totalEqCredit.toLocaleString()})`
      );
    }

    const number = this.getNextVoucherNumber(3);
    const headerId = this.schema.voucher_header.reduce((max, v) => Math.max(max, v.id), 0) + 1;

    const header: VoucherHeader = {
      id: headerId,
      type_id: 3,
      number,
      date: data.date,
      amount: totalEqDebit,
      currency_code: data.items[0].currency_code,
      exchange_rate: data.items[0].exchange_rate,
      description: data.description,
      created_by: data.user_id,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    let nextEntryId = this.schema.journal_entries.reduce((max, e) => Math.max(max, e.id), 0) + 1;
    const entries: JournalEntry[] = data.items.map((item) => ({
      id: nextEntryId++,
      voucher_id: headerId,
      account_code: item.account_code,
      entry_date: data.date,
      debit: item.debit,
      credit: item.credit,
      currency_code: item.currency_code,
      exchange_rate: item.exchange_rate,
      description: item.description || data.description,
      equivalent_debit: item.debit * item.exchange_rate,
      equivalent_credit: item.credit * item.exchange_rate,
    }));

    this.schema.voucher_header.push(header);
    this.schema.journal_entries.push(...entries);
    this.saveDatabase();
    return { header, entries };
  }

  // Delete standard voucher (Receipt, Payment, Journal)
  public deleteStandardVoucher(voucherId: number): void {
    const voucher = this.schema.voucher_header.find((v) => v.id === voucherId);
    if (!voucher) throw new Error('السند غير موجود');

    if (voucher.type_id === 4) {
      throw new Error('أمر الشحن المعتمد لا يمكن حذفه مباشرة، يلزم إلغاء الاعتماد أولاً من شاشة أمر الشحن');
    }

    this.schema.voucher_header = this.schema.voucher_header.filter((v) => v.id !== voucherId);
    this.schema.journal_entries = this.schema.journal_entries.filter((e) => e.voucher_id !== voucherId);
    this.saveDatabase();
  }

  // --- SHIPMENT ORDERS ---
  public getShipmentOrders(): ShipmentOrder[] {
    return [...this.schema.shipment_orders].sort((a, b) => b.id - a.id);
  }

  public getShipmentOrderById(id: number): ShipmentOrder | undefined {
    return this.schema.shipment_orders.find((s) => s.id === id);
  }

  public getShipmentExpenseItems(shipment_order_id: number): ShipmentExpenseItem[] {
    return this.schema.shipment_expense_items.filter((e) => e.shipment_order_id === shipment_order_id);
  }

  // Stage 1: Save Draft Shipment Order
  public saveShipmentOrderDraft(
    orderData: Omit<ShipmentOrder, 'id' | 'is_financially_posted' | 'voucher_id' | 'created_at'>,
    expenseItems: Omit<ShipmentExpenseItem, 'id' | 'shipment_order_id'>[],
    existingId?: number
  ): ShipmentOrder {
    // Validate unique ref number
    if (
      this.schema.shipment_orders.some(
        (s) => s.reference_number.toLowerCase() === orderData.reference_number.toLowerCase() && s.id !== existingId
      )
    ) {
      throw new Error(`الرقم المرجعي للشحنة "${orderData.reference_number}" مستخدم مسبقاً`);
    }

    let shipmentId: number;

    if (existingId) {
      const existing = this.schema.shipment_orders.find((s) => s.id === existingId);
      if (!existing) throw new Error('أمر الشحن غير موجود');
      if (existing.is_financially_posted === 1) {
        throw new Error('لا يمكن تعديل أمر شحن تم اعتماده مالياً. يجب إلغاء الاعتماد أولاً');
      }

      shipmentId = existingId;
      Object.assign(existing, {
        ...orderData,
      });

      // replace expense items
      this.schema.shipment_expense_items = this.schema.shipment_expense_items.filter((e) => e.shipment_order_id !== shipmentId);
    } else {
      shipmentId = this.schema.shipment_orders.reduce((max, s) => Math.max(max, s.id), 0) + 1;
      const newOrder: ShipmentOrder = {
        ...orderData,
        id: shipmentId,
        is_financially_posted: 0,
        voucher_id: null,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      this.schema.shipment_orders.push(newOrder);
    }

    let nextExpId = this.schema.shipment_expense_items.reduce((max, e) => Math.max(max, e.id), 0) + 1;
    for (const exp of expenseItems) {
      this.schema.shipment_expense_items.push({
        ...exp,
        id: nextExpId++,
        shipment_order_id: shipmentId,
      });
    }

    this.saveDatabase();
    return this.schema.shipment_orders.find((s) => s.id === shipmentId)!;
  }

  // Stage 2: Financial Approval / Posting (الاعتماد المالي)
  public postShipmentOrderFinancially(shipmentId: number, currentUserId: number): { shipment: ShipmentOrder; voucher: VoucherHeader } {
    const shipment = this.schema.shipment_orders.find((s) => s.id === shipmentId);
    if (!shipment) throw new Error('أمر الشحن غير موجود');
    if (shipment.is_financially_posted === 1) {
      throw new Error('أمر الشحن معتمد مالياً بالفعل');
    }

    const expenses = this.getShipmentExpenseItems(shipmentId);
    if (expenses.length === 0) {
      throw new Error('لا يمكن اعتماد أمر شحن بدون إدخال بنود مصروفات الرحلة');
    }

    const vehicle = this.schema.vehicles.find((v) => v.id === shipment.vehicle_id);
    if (!vehicle) throw new Error('المركبة المحددة في أمر الشحن غير موجودة');

    const basicCurrency = this.schema.currencies.find((c) => c.currency_type === 'basic') || DEFAULT_CURRENCIES[0];

    // Atomically inside transaction simulation
    try {
      const voucherNumber = this.getNextVoucherNumber(4);
      const voucherId = this.schema.voucher_header.reduce((max, v) => Math.max(max, v.id), 0) + 1;

      // Calculate totals in basic currency equivalent
      const tripEqRevenue = shipment.trip_amount * shipment.trip_exchange_rate;
      const totalEqExpenses = expenses.reduce((sum, item) => sum + item.amount * item.exchange_rate, 0);
      const netProfitEq = tripEqRevenue - totalEqExpenses;

      const voucher: VoucherHeader = {
        id: voucherId,
        type_id: 4,
        number: voucherNumber,
        date: shipment.departure_date || new Date().toISOString().split('T')[0],
        amount: tripEqRevenue,
        currency_code: shipment.trip_currency_code,
        exchange_rate: shipment.trip_exchange_rate,
        description: `ترحيل مالي لأمر شحن مرجعي ${shipment.reference_number} - المركبة ${vehicle.vehicle_name}`,
        created_by: currentUserId,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      let nextEntryId = this.schema.journal_entries.reduce((max, e) => Math.max(max, e.id), 0) + 1;
      const entries: JournalEntry[] = [];

      // Entry 1: Debit Merchant Account (ذمم التاجر) for Trip Rent
      entries.push({
        id: nextEntryId++,
        voucher_id: voucherId,
        account_code: shipment.merchant_account_code,
        entry_date: voucher.date,
        debit: shipment.trip_amount,
        credit: 0,
        currency_code: shipment.trip_currency_code,
        exchange_rate: shipment.trip_exchange_rate,
        description: `إيجار نقل شحنة ${shipment.reference_number} - خط ${shipment.departure_point} إلى ${shipment.arrival_point}`,
        equivalent_debit: tripEqRevenue,
        equivalent_credit: 0,
      });

      // Entry 2: Credit Vehicle Account for Gross Trip Revenue (إيراد الشحنة لصالح المركبة)
      entries.push({
        id: nextEntryId++,
        voucher_id: voucherId,
        account_code: vehicle.account_code,
        entry_date: voucher.date,
        debit: 0,
        credit: shipment.trip_amount,
        currency_code: shipment.trip_currency_code,
        exchange_rate: shipment.trip_exchange_rate,
        description: `إيراد شحن - أمر شحن ${shipment.reference_number} (المركبة ${vehicle.vehicle_name})`,
        equivalent_debit: 0,
        equivalent_credit: tripEqRevenue,
      });

      // Entry 3: Debit Vehicle Account for Total Expenses Sum (المركبة مدين بإجمالي المصروفات المقابلة)
      if (totalEqExpenses > 0) {
        entries.push({
          id: nextEntryId++,
          voucher_id: voucherId,
          account_code: vehicle.account_code,
          entry_date: voucher.date,
          debit: totalEqExpenses,
          credit: 0,
          currency_code: basicCurrency.currency_code,
          exchange_rate: 1.0,
          description: `إجمالي مصروفات رحلة - أمر شحن ${shipment.reference_number}`,
          equivalent_debit: totalEqExpenses,
          equivalent_credit: 0,
        });

        // Entry 4: Credit Each Expense/Vendor/Station Account (دائن لكل بند حسب حسابه المختار وتاريخه)
        for (const exp of expenses) {
          const expEq = exp.amount * exp.exchange_rate;
          entries.push({
            id: nextEntryId++,
            voucher_id: voucherId,
            account_code: exp.account_code,
            entry_date: exp.expense_date || voucher.date,
            debit: 0,
            credit: exp.amount,
            currency_code: exp.currency_code,
            exchange_rate: exp.exchange_rate,
            description: `${exp.description || 'مصروف رحلة'} - أمر شحن ${shipment.reference_number}`,
            equivalent_debit: 0,
            equivalent_credit: expEq,
          });
        }
      }

      // Perform updates
      shipment.is_financially_posted = 1;
      shipment.voucher_id = voucherId;

      this.schema.voucher_header.push(voucher);
      this.schema.journal_entries.push(...entries);

      this.saveDatabase();
      return { shipment, voucher };
    } catch (e) {
      console.error('Error during financial posting', e);
      throw e;
    }
  }

  // Stage 3: Un-post Shipment Order
  public unpostShipmentOrder(shipmentId: number): ShipmentOrder {
    const shipment = this.schema.shipment_orders.find((s) => s.id === shipmentId);
    if (!shipment) throw new Error('أمر الشحن غير موجود');
    if (shipment.is_financially_posted === 0) {
      throw new Error('أمر الشحن مسودة وغير معتمد مسبقاً');
    }

    if (shipment.voucher_id) {
      const vId = shipment.voucher_id;
      this.schema.voucher_header = this.schema.voucher_header.filter((v) => v.id !== vId);
      this.schema.journal_entries = this.schema.journal_entries.filter((e) => e.voucher_id !== vId);
    }

    shipment.is_financially_posted = 0;
    shipment.voucher_id = null;

    this.saveDatabase();
    return shipment;
  }

  public deleteShipmentOrder(shipmentId: number): void {
    const shipment = this.schema.shipment_orders.find((s) => s.id === shipmentId);
    if (!shipment) throw new Error('أمر الشحن غير موجود');
    if (shipment.is_financially_posted === 1) {
      throw new Error('لا يمكن حذف أمر الشحن بعد اعتماده، يرجى إلغاء الاعتماد المالي أولاً');
    }

    this.schema.shipment_orders = this.schema.shipment_orders.filter((s) => s.id !== shipmentId);
    this.schema.shipment_expense_items = this.schema.shipment_expense_items.filter((e) => e.shipment_order_id !== shipmentId);
    this.saveDatabase();
  }

  // --- REPORT QUERY HELPERS ---
  public getJournalEntries(): JournalEntry[] {
    return [...this.schema.journal_entries];
  }

  public getVoucherHeaders(): VoucherHeader[] {
    return [...this.schema.voucher_header];
  }

  // Detailed Account Statement Query
  public getAccountStatement(
    accountCode: string,
    dateFrom?: string,
    dateTo?: string
  ): {
    account: ChartOfAccount;
    openingBalance: { currency_code: string; debit: number; credit: number; balance: number; eqBalance: number }[];
    openingEqBalance: number;
    rows: (JournalEntry & { voucher_number: number; voucher_type_id: VoucherTypeId; running_eq_balance: number })[];
    totalDebit: number;
    totalCredit: number;
    totalEqDebit: number;
    totalEqCredit: number;
    closingEqBalance: number;
  } {
    const account = this.getAccountByCode(accountCode);
    if (!account) throw new Error('الحساب غير موجود');

    const allEntries = this.schema.journal_entries.filter((e) => e.account_code === accountCode);

    // Calculate opening balances before dateFrom
    let openingEqBalance = 0;
    const openingByCurr: Record<string, { debit: number; credit: number; balance: number; eqBalance: number }> = {};

    const filteredRows: (JournalEntry & { voucher_number: number; voucher_type_id: VoucherTypeId; running_eq_balance: number })[] = [];

    let totalDebit = 0;
    let totalCredit = 0;
    let totalEqDebit = 0;
    let totalEqCredit = 0;

    // Sort entries chronologically
    const sorted = [...allEntries].sort((a, b) => {
      if (a.entry_date !== b.entry_date) return a.entry_date.localeCompare(b.entry_date);
      return a.id - b.id;
    });

    let runningEq = 0;

    for (const entry of sorted) {
      const vHeader = this.schema.voucher_header.find((v) => v.id === entry.voucher_id);
      const vNum = vHeader ? vHeader.number : 0;
      const vType = vHeader ? vHeader.type_id : 3;

      const isBeforeStart = dateFrom && entry.entry_date < dateFrom;

      if (isBeforeStart) {
        if (!openingByCurr[entry.currency_code]) {
          openingByCurr[entry.currency_code] = { debit: 0, credit: 0, balance: 0, eqBalance: 0 };
        }
        openingByCurr[entry.currency_code].debit += entry.debit;
        openingByCurr[entry.currency_code].credit += entry.credit;
        openingByCurr[entry.currency_code].balance += entry.debit - entry.credit;

        const eqChange = entry.equivalent_debit - entry.equivalent_credit;
        openingByCurr[entry.currency_code].eqBalance += eqChange;
        openingEqBalance += eqChange;
        runningEq += eqChange;
      } else {
        if (dateTo && entry.entry_date > dateTo) {
          continue;
        }

        runningEq += entry.equivalent_debit - entry.equivalent_credit;

        totalDebit += entry.debit;
        totalCredit += entry.credit;
        totalEqDebit += entry.equivalent_debit;
        totalEqCredit += entry.equivalent_credit;

        filteredRows.push({
          ...entry,
          voucher_number: vNum,
          voucher_type_id: vType,
          running_eq_balance: runningEq,
        });
      }
    }

    const openingList = Object.entries(openingByCurr).map(([curr, val]) => ({
      currency_code: curr,
      ...val,
    }));

    return {
      account,
      openingBalance: openingList,
      openingEqBalance,
      rows: filteredRows,
      totalDebit,
      totalCredit,
      totalEqDebit,
      totalEqCredit,
      closingEqBalance: runningEq,
    };
  }

  // Trial Balance Query
  public getTrialBalance(): {
    account_code: string;
    account_name: string;
    account_type: AccountType;
    account_level: number;
    debit_eq: number;
    credit_eq: number;
    balance_eq: number;
  }[] {
    const accounts = this.getAccounts();
    const result = [];

    for (const acc of accounts) {
      const entries = this.schema.journal_entries.filter((e) => e.account_code === acc.account_code);
      const debit_eq = entries.reduce((sum, e) => sum + e.equivalent_debit, 0);
      const credit_eq = entries.reduce((sum, e) => sum + e.equivalent_credit, 0);
      const balance_eq = debit_eq - credit_eq;

      if (debit_eq !== 0 || credit_eq !== 0 || acc.account_level === 4) {
        result.push({
          account_code: acc.account_code,
          account_name: acc.account_name,
          account_type: acc.account_type,
          account_level: acc.account_level,
          debit_eq,
          credit_eq,
          balance_eq,
        });
      }
    }

    return result;
  }

  // Income Statement Query (Revenues starting with 4, Expenses starting with 3)
  public getIncomeStatement(dateFrom?: string, dateTo?: string): {
    revenues: { account_code: string; account_name: string; amount_eq: number }[];
    expenses: { account_code: string; account_name: string; amount_eq: number }[];
    totalRevenuesEq: number;
    totalExpensesEq: number;
    netIncomeEq: number;
  } {
    const level4Accounts = this.schema.chart_of_accounts.filter((a) => a.account_level === 4);

    const revenues: { account_code: string; account_name: string; amount_eq: number }[] = [];
    const expenses: { account_code: string; account_name: string; amount_eq: number }[] = [];

    let totalRevenuesEq = 0;
    let totalExpensesEq = 0;

    for (const acc of level4Accounts) {
      if (acc.account_code.startsWith('4') || acc.account_type === 'إيرادات') {
        const entries = this.schema.journal_entries.filter((e) => {
          if (e.account_code !== acc.account_code) return false;
          if (dateFrom && e.entry_date < dateFrom) return false;
          if (dateTo && e.entry_date > dateTo) return false;
          return true;
        });
        const revEq = entries.reduce((sum, e) => sum + (e.equivalent_credit - e.equivalent_debit), 0);
        if (revEq !== 0) {
          revenues.push({ account_code: acc.account_code, account_name: acc.account_name, amount_eq: revEq });
          totalRevenuesEq += revEq;
        }
      } else if (acc.account_code.startsWith('3') || acc.account_type === 'مصروفات') {
        const entries = this.schema.journal_entries.filter((e) => {
          if (e.account_code !== acc.account_code) return false;
          if (dateFrom && e.entry_date < dateFrom) return false;
          if (dateTo && e.entry_date > dateTo) return false;
          return true;
        });
        const expEq = entries.reduce((sum, e) => sum + (e.equivalent_debit - e.equivalent_credit), 0);
        if (expEq !== 0) {
          expenses.push({ account_code: acc.account_code, account_name: acc.account_name, amount_eq: expEq });
          totalExpensesEq += expEq;
        }
      }
    }

    return {
      revenues,
      expenses,
      totalRevenuesEq,
      totalExpensesEq,
      netIncomeEq: totalRevenuesEq - totalExpensesEq,
    };
  }

  // Balance Sheet Query (Assets starting with 1, Liabilities/Equity starting with 2)
  public getBalanceSheet(asOfDate?: string): {
    assets: { account_code: string; account_name: string; amount_eq: number }[];
    liabilitiesAndEquity: { account_code: string; account_name: string; amount_eq: number }[];
    totalAssetsEq: number;
    totalLiabilitiesAndEquityEq: number;
    netIncomeEq: number;
  } {
    const level4Accounts = this.schema.chart_of_accounts.filter((a) => a.account_level === 4);

    const assets: { account_code: string; account_name: string; amount_eq: number }[] = [];
    const liabilitiesAndEquity: { account_code: string; account_name: string; amount_eq: number }[] = [];

    let totalAssetsEq = 0;
    let totalLiabilitiesAndEquityEq = 0;

    for (const acc of level4Accounts) {
      const entries = this.schema.journal_entries.filter((e) => {
        if (e.account_code !== acc.account_code) return false;
        if (asOfDate && e.entry_date > asOfDate) return false;
        return true;
      });

      if (acc.account_code.startsWith('1') || acc.account_type === 'أصول') {
        const assetBalance = entries.reduce((sum, e) => sum + (e.equivalent_debit - e.equivalent_credit), 0);
        if (assetBalance !== 0) {
          assets.push({ account_code: acc.account_code, account_name: acc.account_name, amount_eq: assetBalance });
          totalAssetsEq += assetBalance;
        }
      } else if (acc.account_code.startsWith('2') || acc.account_type === 'خصوم') {
        const liabBalance = entries.reduce((sum, e) => sum + (e.equivalent_credit - e.equivalent_debit), 0);
        if (liabBalance !== 0) {
          liabilitiesAndEquity.push({ account_code: acc.account_code, account_name: acc.account_name, amount_eq: liabBalance });
          totalLiabilitiesAndEquityEq += liabBalance;
        }
      }
    }

    // Net income up to date
    const incomeData = this.getIncomeStatement(undefined, asOfDate);
    const netIncomeEq = incomeData.netIncomeEq;

    totalLiabilitiesAndEquityEq += netIncomeEq;

    return {
      assets,
      liabilitiesAndEquity,
      totalAssetsEq,
      totalLiabilitiesAndEquityEq,
      netIncomeEq,
    };
  }

  public getVouchers(): VoucherHeader[] {
    return this.getVoucherHeaders();
  }

  public getJournalEntriesByVoucher(voucherId: number): JournalEntry[] {
    return this.schema.journal_entries.filter((e) => e.voucher_id === voucherId);
  }

  public exportDatabaseBackup(): string {
    return this.exportJSON();
  }

  public importDatabaseBackup(jsonStr: string): boolean {
    return this.importJSON(jsonStr);
  }

  public resetToDefaultData(): void {
    this.resetToDefault();
  }

  public getVehicleProfitStats(): {
    vehicle: Vehicle;
    totalRevenueEq: number;
    totalExpenseEq: number;
    netProfitEq: number;
    shipmentCount: number;
  }[] {
    const vehicles = this.getVehicles();
    return vehicles.map((v) => {
      const shipments = this.schema.shipment_orders.filter((s) => s.vehicle_id === v.id);
      let totalRevenueEq = 0;
      let totalExpenseEq = 0;

      for (const s of shipments) {
        totalRevenueEq += s.trip_amount * s.trip_exchange_rate;
        const expenses = this.getShipmentExpenseItems(s.id);
        for (const e of expenses) {
          totalExpenseEq += e.amount * e.exchange_rate;
        }
      }

      return {
        vehicle: v,
        totalRevenueEq,
        totalExpenseEq,
        netProfitEq: totalRevenueEq - totalExpenseEq,
        shipmentCount: shipments.length,
      };
    });
  }

  public getVehicleAccountMovements(
    vehicleId: number,
    dateFrom?: string,
    dateTo?: string
  ) {
    const vehicle = this.schema.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return null;

    const vehicleShipments = this.schema.shipment_orders.filter((s) => s.vehicle_id === vehicleId && s.is_financially_posted === 1);
    const shipmentVoucherIds = new Set(vehicleShipments.map((s) => s.voucher_id).filter((id): id is number => id !== null));

    const entries = this.schema.journal_entries.filter((e) => {
      const isVehicleAccount = e.account_code === vehicle.account_code;
      const isShipmentVoucher = e.voucher_id ? shipmentVoucherIds.has(e.voucher_id) : false;
      if (!isVehicleAccount && !isShipmentVoucher) return false;

      if (dateFrom && e.entry_date < dateFrom) return false;
      if (dateTo && e.entry_date > dateTo) return false;
      return true;
    });

    entries.sort((a, b) => a.entry_date.localeCompare(b.entry_date) || a.voucher_id - b.voucher_id || a.id - b.id);

    let runningEq = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    let totalEqDebit = 0;
    let totalEqCredit = 0;

    const rows = entries.map((entry) => {
      const voucher = this.schema.voucher_header.find((v) => v.id === entry.voucher_id);
      const acc = this.getAccountByCode(entry.account_code);

      totalDebit += entry.debit;
      totalCredit += entry.credit;
      totalEqDebit += entry.equivalent_debit;
      totalEqCredit += entry.equivalent_credit;

      runningEq += entry.equivalent_credit - entry.equivalent_debit;

      return {
        ...entry,
        account_name: acc?.account_name || entry.account_code,
        voucher_number: voucher?.number || 0,
        voucher_type_id: voucher?.type_id || 3,
        running_eq_balance: runningEq,
      };
    });

    return {
      vehicle,
      rows,
      totalDebit,
      totalCredit,
      totalEqDebit,
      totalEqCredit,
      netEqBalance: totalEqCredit - totalEqDebit,
    };
  }

  public getVehicleShipmentOrdersDetailed(
    vehicleId: number,
    dateFrom?: string,
    dateTo?: string
  ) {
    const vehicle = this.schema.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return { vehicle: null, orders: [] };

    let orders = this.schema.shipment_orders.filter((s) => s.vehicle_id === vehicleId);

    if (dateFrom) {
      orders = orders.filter((s) => s.departure_date >= dateFrom);
    }
    if (dateTo) {
      orders = orders.filter((s) => s.departure_date <= dateTo);
    }

    orders.sort((a, b) => b.id - a.id);

    const detailedOrders = orders.map((order) => {
      const expenses = this.getShipmentExpenseItems(order.id);
      const merchantAcc = this.getAccountByCode(order.merchant_account_code);
      const voucher = order.voucher_id ? this.schema.voucher_header.find((v) => v.id === order.voucher_id) : null;

      const tripEqRevenue = order.trip_amount * order.trip_exchange_rate;
      const totalEqExpenses = expenses.reduce((sum, e) => sum + e.amount * e.exchange_rate, 0);
      const netTripProfitEq = tripEqRevenue - totalEqExpenses;

      const detailedExpenses = expenses.map((exp) => {
        const acc = this.getAccountByCode(exp.account_code);
        return {
          ...exp,
          account_name: acc?.account_name || exp.account_code,
          equivalent_amount: exp.amount * exp.exchange_rate,
        };
      });

      return {
        order,
        merchant_account_name: merchantAcc?.account_name || order.merchant_account_code,
        voucher,
        expenses: detailedExpenses,
        tripEqRevenue,
        totalEqExpenses,
        netTripProfitEq,
      };
    });

    return {
      vehicle,
      orders: detailedOrders,
    };
  }
}

export const db = new OfflineDatabase();
