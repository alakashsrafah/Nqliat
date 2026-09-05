export type AccountType = 'أصول' | 'خصوم' | 'مصروفات' | 'إيرادات';

export interface ChartOfAccount {
  id: number;
  parent_id: number | null;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  account_level: number; // 1 to 4
  phone_number?: string;
}

export type CurrencyType = 'basic' | 'foreign';

export interface Currency {
  id: number;
  currency_name: string;
  currency_code: string; // e.g. YER, USD, SAR
  currency_type: CurrencyType; // Only one 'basic' allowed
  currency_symbol: string;
  exchange_rate: number; // exchange rate relative to basic currency (basic = 1.0)
  details?: string;
}

export type UserType = 'مدير' | 'موظف';
export type UserRole = 'مدير النظام' | 'محاسب' | 'مشغل حركة';

export interface User {
  id: number;
  username: string;
  full_name: string;
  password_hash: string; // Hashed or stored string
  role: UserRole;
  user_type?: UserType;
  user_code?: string;
}

export interface Vehicle {
  id: number;
  vehicle_name: string;
  vehicle_number: string;
  vehicle_code: string;
  account_code: string; // FK to chart_of_accounts level 4
  specifications: string;
  last_oil_change_date: string;
  change_log: string; // Text log of oil changes
  parent_revenue_account?: string;
}

export type VoucherTypeId = 1 | 2 | 3 | 4; // 1=قبض, 2=صرف, 3=قيد, 4=أمر شحن

export interface VoucherHeader {
  id: number;
  type_id: VoucherTypeId;
  number: number;
  date: string;
  amount: number;
  currency_code: string;
  exchange_rate: number;
  description: string;
  created_by: number;
  created_at: string;
}

export interface JournalEntry {
  id: number;
  voucher_id: number;
  account_code: string;
  entry_date: string;
  debit: number;
  credit: number;
  currency_code: string;
  exchange_rate: number;
  description: string;
  equivalent_debit: number; // debit * exchange_rate
  equivalent_credit: number; // credit * exchange_rate
}

export interface ShipmentOrder {
  id: number;
  reference_number: string;
  vehicle_id: number;
  merchant_account_code: string;
  trip_amount: number;
  trip_currency_code: string;
  trip_exchange_rate: number;
  departure_point: string;
  arrival_point: string;
  route: string;
  payload_weight: number; // in tons
  road_length: number; // in km
  departure_date: string;
  arrival_date: string;
  driver_name: string;
  goods_type: string;
  notes: string;
  is_financially_posted: number; // 0 = Draft, 1 = Financially Posted
  voucher_id: number | null;
  created_by: number;
  created_at: string;
}

export interface ShipmentExpenseItem {
  id: number;
  shipment_order_id: number;
  account_code: string; // Credit account for the expense
  amount: number;
  currency_code: string;
  exchange_rate: number;
  expense_date: string;
  description: string;
}

export type DriverStatus = 'نشط' | 'في رحلة' | 'إجازة' | 'متوقف';

export interface Driver {
  id: number;
  full_name: string;
  phone_number: string;
  license_number: string;
  status: DriverStatus;
  notes?: string;
  created_at?: string;
}

export type ViewTab =
  | 'dashboard'
  | 'accounts'
  | 'drivers'
  | 'currencies'
  | 'vehicles'
  | 'vouchers'
  | 'shipments'
  | 'voucher_receipt'
  | 'voucher_payment'
  | 'voucher_journal'
  | 'shipment_order_form'
  | 'vouchers_list'
  | 'reports'
  | 'users'
  | 'backup_restore'
  | 'server_settings';

export type ReportType =
  | 'account_statement'
  | 'trial_balance'
  | 'income_statement'
  | 'balance_sheet'
  | 'vehicle_shipment_report'
  | 'vehicle_account_statement';
