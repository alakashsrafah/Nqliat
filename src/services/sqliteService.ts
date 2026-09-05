import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { db, DatabaseSchema } from '../db/database';
import { Filesystem, Directory } from '@capacitor/filesystem';

let sqlPromise: Promise<SqlJsStatic> | null = null;

export async function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: () => wasmUrl || '/sql-wasm.wasm',
    });
  }
  return sqlPromise;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return window.btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export interface SqlQueryResult {
  columns: string[];
  values: any[][];
}

class SQLiteService {
  private activeSqlDb: Database | null = null;

  public async getOrInitSqlDb(): Promise<Database> {
    const SQL = await getSqlJs();
    if (!this.activeSqlDb) {
      this.activeSqlDb = new SQL.Database();
      this.populateSqlDbFromApp(this.activeSqlDb, db.getRawData());
    }
    return this.activeSqlDb;
  }

  public generateSqlScript(schema: DatabaseSchema): string {
    const lines: string[] = [
      '-- =========================================================',
      '-- NKLIAT Transport Management System - SQLite Database Dump',
      `-- Generated on: ${new Date().toISOString()}`,
      '-- Target Path: /storage/emulated/0/Documents/nkliat',
      '-- =========================================================',
      'PRAGMA foreign_keys = OFF;',
      'BEGIN TRANSACTION;',
      '',
      '-- 1. Table: accounts (شجرة الحسابات)',
      'CREATE TABLE IF NOT EXISTS accounts (',
      '  id INTEGER PRIMARY KEY,',
      '  parent_id INTEGER,',
      '  account_code TEXT UNIQUE NOT NULL,',
      '  account_name TEXT NOT NULL,',
      '  account_type TEXT NOT NULL,',
      '  account_level INTEGER NOT NULL,',
      '  phone_number TEXT',
      ');',
      '',
      '-- 2. Table: currencies (العملات وأسعار الصرف)',
      'CREATE TABLE IF NOT EXISTS currencies (',
      '  id INTEGER PRIMARY KEY,',
      '  currency_name TEXT NOT NULL,',
      '  currency_code TEXT UNIQUE NOT NULL,',
      '  currency_type TEXT NOT NULL,',
      '  currency_symbol TEXT NOT NULL,',
      '  exchange_rate REAL NOT NULL,',
      '  details TEXT',
      ');',
      '',
      '-- 3. Table: users (المستخدمون والصلاحيات)',
      'CREATE TABLE IF NOT EXISTS users (',
      '  id INTEGER PRIMARY KEY,',
      '  username TEXT UNIQUE NOT NULL,',
      '  full_name TEXT NOT NULL,',
      '  password_hash TEXT,',
      '  role TEXT NOT NULL,',
      '  user_type TEXT NOT NULL,',
      '  user_code TEXT',
      ');',
      '',
      '-- 4. Table: vehicles (أسطول الشاحنات)',
      'CREATE TABLE IF NOT EXISTS vehicles (',
      '  id INTEGER PRIMARY KEY,',
      '  vehicle_name TEXT NOT NULL,',
      '  vehicle_number TEXT NOT NULL,',
      '  vehicle_code TEXT,',
      '  account_code TEXT,',
      '  specifications TEXT,',
      '  last_oil_change_date TEXT,',
      '  change_log TEXT,',
      '  parent_revenue_account TEXT',
      ');',
      '',
      '-- 5. Table: drivers (السائقون)',
      'CREATE TABLE IF NOT EXISTS drivers (',
      '  id INTEGER PRIMARY KEY,',
      '  full_name TEXT NOT NULL,',
      '  phone_number TEXT NOT NULL,',
      '  license_number TEXT NOT NULL,',
      '  status TEXT NOT NULL,',
      '  notes TEXT',
      ');',
      '',
      '-- 6. Table: voucher_headers (سندات القبض والصرف والقيد)',
      'CREATE TABLE IF NOT EXISTS voucher_headers (',
      '  id INTEGER PRIMARY KEY,',
      '  type_id INTEGER NOT NULL,',
      '  number INTEGER NOT NULL,',
      '  date TEXT NOT NULL,',
      '  amount REAL NOT NULL,',
      '  currency_code TEXT NOT NULL,',
      '  exchange_rate REAL NOT NULL,',
      '  description TEXT,',
      '  created_by INTEGER,',
      '  created_at TEXT',
      ');',
      '',
      '-- 7. Table: journal_entries (قيود اليومية والترحيل المحاسبي)',
      'CREATE TABLE IF NOT EXISTS journal_entries (',
      '  id INTEGER PRIMARY KEY,',
      '  voucher_id INTEGER,',
      '  entry_date TEXT NOT NULL,',
      '  account_code TEXT NOT NULL,',
      '  description TEXT,',
      '  debit REAL NOT NULL DEFAULT 0,',
      '  credit REAL NOT NULL DEFAULT 0,',
      '  currency_code TEXT NOT NULL,',
      '  exchange_rate REAL NOT NULL DEFAULT 1.0,',
      '  equivalent_debit REAL NOT NULL DEFAULT 0,',
      '  equivalent_credit REAL NOT NULL DEFAULT 0',
      ');',
      '',
      '-- 8. Table: shipment_orders (أوامر الشحن والرحلات)',
      'CREATE TABLE IF NOT EXISTS shipment_orders (',
      '  id INTEGER PRIMARY KEY,',
      '  reference_number TEXT UNIQUE NOT NULL,',
      '  vehicle_id INTEGER NOT NULL,',
      '  merchant_account_code TEXT NOT NULL,',
      '  trip_amount REAL NOT NULL DEFAULT 0,',
      '  trip_currency_code TEXT NOT NULL,',
      '  trip_exchange_rate REAL NOT NULL DEFAULT 1.0,',
      '  departure_point TEXT NOT NULL,',
      '  arrival_point TEXT NOT NULL,',
      '  route TEXT NOT NULL,',
      '  payload_weight REAL NOT NULL DEFAULT 0,',
      '  road_length REAL NOT NULL DEFAULT 0,',
      '  departure_date TEXT NOT NULL,',
      '  arrival_date TEXT NOT NULL,',
      '  driver_name TEXT NOT NULL,',
      '  goods_type TEXT NOT NULL,',
      '  notes TEXT,',
      '  is_financially_posted INTEGER NOT NULL DEFAULT 0,',
      '  voucher_id INTEGER,',
      '  created_by INTEGER NOT NULL,',
      '  created_at TEXT NOT NULL',
      ');',
      '',
      '-- 9. Table: shipment_expense_items (مصاريف رحلات الشحن)',
      'CREATE TABLE IF NOT EXISTS shipment_expense_items (',
      '  id INTEGER PRIMARY KEY,',
      '  shipment_order_id INTEGER NOT NULL,',
      '  account_code TEXT NOT NULL,',
      '  amount REAL NOT NULL,',
      '  currency_code TEXT NOT NULL,',
      '  exchange_rate REAL NOT NULL DEFAULT 1.0,',
      '  expense_date TEXT NOT NULL,',
      '  description TEXT NOT NULL',
      ');',
      '',
      '-- Indexes for high performance querying',
      'CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(account_code);',
      'CREATE INDEX IF NOT EXISTS idx_entries_acc ON journal_entries(account_code);',
      'CREATE INDEX IF NOT EXISTS idx_entries_date ON journal_entries(entry_date);',
      'CREATE INDEX IF NOT EXISTS idx_shipments_ref ON shipment_orders(reference_number);',
      '',
    ];

    // Helper for escaping SQL strings
    const esc = (val: any): string => {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return String(val);
      const str = String(val).replace(/'/g, "''");
      return `'${str}'`;
    };

    // Insert Accounts
    for (const a of schema.chart_of_accounts || []) {
      lines.push(
        `INSERT INTO accounts (id, parent_id, account_code, account_name, account_type, account_level, phone_number) VALUES (${esc(a.id)}, ${esc(a.parent_id)}, ${esc(a.account_code)}, ${esc(a.account_name)}, ${esc(a.account_type)}, ${esc(a.account_level)}, ${esc(a.phone_number || '')});`
      );
    }

    // Insert Currencies
    for (const c of schema.currencies || []) {
      lines.push(
        `INSERT INTO currencies (id, currency_name, currency_code, currency_type, currency_symbol, exchange_rate, details) VALUES (${esc(c.id)}, ${esc(c.currency_name)}, ${esc(c.currency_code)}, ${esc(c.currency_type)}, ${esc(c.currency_symbol)}, ${esc(c.exchange_rate)}, ${esc(c.details || '')});`
      );
    }

    // Insert Users
    for (const u of schema.users || []) {
      lines.push(
        `INSERT INTO users (id, username, full_name, password_hash, role, user_type, user_code) VALUES (${esc(u.id)}, ${esc(u.username)}, ${esc(u.full_name)}, ${esc(u.password_hash || '')}, ${esc(u.role)}, ${esc(u.user_type)}, ${esc(u.user_code || '')});`
      );
    }

    // Insert Vehicles
    for (const v of schema.vehicles || []) {
      lines.push(
        `INSERT INTO vehicles (id, vehicle_name, vehicle_number, vehicle_code, account_code, specifications, last_oil_change_date, change_log, parent_revenue_account) VALUES (${esc(v.id)}, ${esc(v.vehicle_name)}, ${esc(v.vehicle_number)}, ${esc(v.vehicle_code || '')}, ${esc(v.account_code || '')}, ${esc(v.specifications || '')}, ${esc(v.last_oil_change_date || '')}, ${esc(v.change_log || '')}, ${esc(v.parent_revenue_account || '')});`
      );
    }

    // Insert Drivers
    for (const d of schema.drivers || []) {
      lines.push(
        `INSERT INTO drivers (id, full_name, phone_number, license_number, status, notes) VALUES (${esc(d.id)}, ${esc(d.full_name)}, ${esc(d.phone_number)}, ${esc(d.license_number)}, ${esc(d.status)}, ${esc(d.notes || '')});`
      );
    }

    // Insert Voucher Headers
    for (const vh of schema.voucher_header || []) {
      lines.push(
        `INSERT INTO voucher_headers (id, type_id, number, date, amount, currency_code, exchange_rate, description, created_by, created_at) VALUES (${esc(vh.id)}, ${esc(vh.type_id)}, ${esc(vh.number)}, ${esc(vh.date)}, ${esc(vh.amount)}, ${esc(vh.currency_code)}, ${esc(vh.exchange_rate)}, ${esc(vh.description || '')}, ${esc(vh.created_by)}, ${esc(vh.created_at)});`
      );
    }

    // Insert Journal Entries
    for (const je of schema.journal_entries || []) {
      lines.push(
        `INSERT INTO journal_entries (id, voucher_id, entry_date, account_code, description, debit, credit, currency_code, exchange_rate, equivalent_debit, equivalent_credit) VALUES (${esc(je.id)}, ${esc(je.voucher_id)}, ${esc(je.entry_date)}, ${esc(je.account_code)}, ${esc(je.description || '')}, ${esc(je.debit)}, ${esc(je.credit)}, ${esc(je.currency_code)}, ${esc(je.exchange_rate)}, ${esc(je.equivalent_debit)}, ${esc(je.equivalent_credit)});`
      );
    }

    // Insert Shipment Orders
    for (const so of schema.shipment_orders || []) {
      lines.push(
        `INSERT INTO shipment_orders (id, reference_number, vehicle_id, merchant_account_code, trip_amount, trip_currency_code, trip_exchange_rate, departure_point, arrival_point, route, payload_weight, road_length, departure_date, arrival_date, driver_name, goods_type, notes, is_financially_posted, voucher_id, created_by, created_at) VALUES (${esc(so.id)}, ${esc(so.reference_number)}, ${esc(so.vehicle_id)}, ${esc(so.merchant_account_code)}, ${esc(so.trip_amount)}, ${esc(so.trip_currency_code)}, ${esc(so.trip_exchange_rate)}, ${esc(so.departure_point)}, ${esc(so.arrival_point)}, ${esc(so.route)}, ${esc(so.payload_weight)}, ${esc(so.road_length)}, ${esc(so.departure_date)}, ${esc(so.arrival_date)}, ${esc(so.driver_name)}, ${esc(so.goods_type)}, ${esc(so.notes || '')}, ${esc(so.is_financially_posted)}, ${esc(so.voucher_id)}, ${esc(so.created_by)}, ${esc(so.created_at)});`
      );
    }

    // Insert Shipment Expense Items
    for (const se of schema.shipment_expense_items || []) {
      lines.push(
        `INSERT INTO shipment_expense_items (id, shipment_order_id, account_code, amount, currency_code, exchange_rate, expense_date, description) VALUES (${esc(se.id)}, ${esc(se.shipment_order_id)}, ${esc(se.account_code)}, ${esc(se.amount)}, ${esc(se.currency_code)}, ${esc(se.exchange_rate)}, ${esc(se.expense_date)}, ${esc(se.description || '')});`
      );
    }

    lines.push('', 'COMMIT;', 'PRAGMA foreign_keys = ON;');
    return lines.join('\n');
  }

  public populateSqlDbFromApp(sqlDb: Database, schema: DatabaseSchema): void {
    const script = this.generateSqlScript(schema);
    sqlDb.exec(script);
  }

  public async exportSqliteBinary(schema?: DatabaseSchema): Promise<Uint8Array> {
    const SQL = await getSqlJs();
    const data = schema || db.getRawData();
    const sqlDb = new SQL.Database();
    this.populateSqlDbFromApp(sqlDb, data);
    const binary = sqlDb.export();
    sqlDb.close();
    return binary;
  }

  public async executeQuery(sqlQuery: string): Promise<SqlQueryResult[]> {
    const SQL = await getSqlJs();
    const sqlDb = new SQL.Database();
    this.populateSqlDbFromApp(sqlDb, db.getRawData());
    try {
      const results = sqlDb.exec(sqlQuery);
      return results.map((r) => ({
        columns: r.columns,
        values: r.values,
      }));
    } finally {
      sqlDb.close();
    }
  }

  public async importSqliteBinary(binaryData: Uint8Array): Promise<boolean> {
    const SQL = await getSqlJs();
    const sqlDb = new SQL.Database(binaryData);
    try {
      const newSchema: DatabaseSchema = {
        chart_of_accounts: [],
        currencies: [],
        users: [],
        vehicles: [],
        drivers: [],
        voucher_header: [],
        journal_entries: [],
        shipment_orders: [],
        shipment_expense_items: [],
      };

      // Read accounts
      try {
        const accRes = sqlDb.exec('SELECT id, parent_id, account_code, account_name, account_type, account_level, phone_number FROM accounts');
        if (accRes.length > 0) {
          const cols = accRes[0].columns;
          for (const row of accRes[0].values) {
            const item: any = {};
            cols.forEach((col, idx) => {
              item[col] = row[idx];
            });
            newSchema.chart_of_accounts.push(item);
          }
        }
      } catch (e) {
        console.warn('Error reading accounts from SQLite:', e);
      }

      // Read currencies
      try {
        const currRes = sqlDb.exec('SELECT id, currency_name, currency_code, currency_type, currency_symbol, exchange_rate, details FROM currencies');
        if (currRes.length > 0) {
          const cols = currRes[0].columns;
          for (const row of currRes[0].values) {
            const item: any = {};
            cols.forEach((col, idx) => {
              item[col] = row[idx];
            });
            newSchema.currencies.push(item);
          }
        }
      } catch (e) {
        console.warn('Error reading currencies from SQLite:', e);
      }

      // Read users
      try {
        const userRes = sqlDb.exec('SELECT id, username, full_name, password_hash, role, user_type, user_code FROM users');
        if (userRes.length > 0) {
          const cols = userRes[0].columns;
          for (const row of userRes[0].values) {
            const item: any = {};
            cols.forEach((col, idx) => {
              item[col] = row[idx];
            });
            newSchema.users.push(item);
          }
        }
      } catch (e) {
        console.warn('Error reading users from SQLite:', e);
      }

      // Read vehicles
      try {
        const vehRes = sqlDb.exec('SELECT id, vehicle_name, vehicle_number, vehicle_code, account_code, specifications, last_oil_change_date, change_log, parent_revenue_account FROM vehicles');
        if (vehRes.length > 0) {
          const cols = vehRes[0].columns;
          for (const row of vehRes[0].values) {
            const item: any = {};
            cols.forEach((col, idx) => {
              item[col] = row[idx];
            });
            newSchema.vehicles.push(item);
          }
        }
      } catch (e) {
        console.warn('Error reading vehicles from SQLite:', e);
      }

      // Read drivers
      try {
        const dvrRes = sqlDb.exec('SELECT id, full_name, phone_number, license_number, status, notes FROM drivers');
        if (dvrRes.length > 0) {
          const cols = dvrRes[0].columns;
          for (const row of dvrRes[0].values) {
            const item: any = {};
            cols.forEach((col, idx) => {
              item[col] = row[idx];
            });
            newSchema.drivers.push(item);
          }
        }
      } catch (e) {
        console.warn('Error reading drivers from SQLite:', e);
      }

      // Read voucher_headers
      try {
        const vhRes = sqlDb.exec('SELECT id, type_id, number, date, amount, currency_code, exchange_rate, description, created_by, created_at FROM voucher_headers');
        if (vhRes.length > 0) {
          const cols = vhRes[0].columns;
          for (const row of vhRes[0].values) {
            const item: any = {};
            cols.forEach((col, idx) => {
              item[col] = row[idx];
            });
            newSchema.voucher_header.push(item);
          }
        }
      } catch (e) {
        console.warn('Error reading voucher_headers from SQLite:', e);
      }

      // Read journal_entries
      try {
        const jeRes = sqlDb.exec('SELECT id, voucher_id, entry_date, account_code, description, debit, credit, currency_code, exchange_rate, equivalent_debit, equivalent_credit FROM journal_entries');
        if (jeRes.length > 0) {
          const cols = jeRes[0].columns;
          for (const row of jeRes[0].values) {
            const item: any = {};
            cols.forEach((col, idx) => {
              item[col] = row[idx];
            });
            newSchema.journal_entries.push(item);
          }
        }
      } catch (e) {
        console.warn('Error reading journal_entries from SQLite:', e);
      }

      // Read shipment_orders
      try {
        const soRes = sqlDb.exec('SELECT id, reference_number, vehicle_id, merchant_account_code, trip_amount, trip_currency_code, trip_exchange_rate, departure_point, arrival_point, route, payload_weight, road_length, departure_date, arrival_date, driver_name, goods_type, notes, is_financially_posted, voucher_id, created_by, created_at FROM shipment_orders');
        if (soRes.length > 0) {
          const cols = soRes[0].columns;
          for (const row of soRes[0].values) {
            const item: any = {};
            cols.forEach((col, idx) => {
              item[col] = row[idx];
            });
            newSchema.shipment_orders.push(item);
          }
        }
      } catch (e) {
        console.warn('Error reading shipment_orders from SQLite:', e);
      }

      // Read shipment_expense_items
      try {
        const seRes = sqlDb.exec('SELECT id, shipment_order_id, account_code, amount, currency_code, exchange_rate, expense_date, description FROM shipment_expense_items');
        if (seRes.length > 0) {
          const cols = seRes[0].columns;
          for (const row of seRes[0].values) {
            const item: any = {};
            cols.forEach((col, idx) => {
              item[col] = row[idx];
            });
            newSchema.shipment_expense_items.push(item);
          }
        }
      } catch (e) {
        console.warn('Error reading shipment_expense_items from SQLite:', e);
      }

      // Validate minimal requirement
      if (newSchema.chart_of_accounts.length > 0) {
        db.replaceEntireDatabase(newSchema);
        return true;
      }
      return false;
    } finally {
      sqlDb.close();
    }
  }

  public async importSqlScript(sqlScript: string): Promise<boolean> {
    const SQL = await getSqlJs();
    const sqlDb = new SQL.Database();
    try {
      sqlDb.exec(sqlScript);
      const binary = sqlDb.export();
      return await this.importSqliteBinary(binary);
    } catch (err) {
      console.error('Error executing SQL script:', err);
      return false;
    } finally {
      sqlDb.close();
    }
  }

  /**
   * Saves the SQLite database directly to the user's phone in `/storage/emulated/0/Documents/nkliat`
   * and provides a web download fallback.
   */
  public async saveSqliteToDeviceAndPath(
    filename: string = `nkliat_database_${new Date().toISOString().split('T')[0]}.sqlite`
  ): Promise<{ savedToPhone: boolean; fullPath: string; binary: Uint8Array }> {
    const TARGET_BASE_PATH = '/storage/emulated/0/Documents/nkliat';
    const fullPath = `${TARGET_BASE_PATH}/${filename}`;
    let savedToPhone = false;

    const binary = await this.exportSqliteBinary();
    const base64Data = uint8ArrayToBase64(binary);

    // Save on Android Capacitor Native Filesystem
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        try {
          await Filesystem.mkdir({
            path: 'nkliat',
            directory: Directory.Documents,
            recursive: true,
          });
        } catch {
          // Folder already exists
        }

        await Filesystem.writeFile({
          path: `nkliat/${filename}`,
          data: base64Data,
          directory: Directory.Documents,
        });

        savedToPhone = true;
      }
    } catch (err) {
      console.warn('Could not save SQLite binary natively to Documents/nkliat:', err);
    }

    // Web fallback download
    try {
      const blob = new Blob([binary as unknown as BlobPart], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (webErr) {
      console.warn('Web download fallback notice:', webErr);
    }

    return { savedToPhone, fullPath, binary };
  }

  /**
   * Saves the SQLite SQL script text directly to `/storage/emulated/0/Documents/nkliat/nkliat_dump_YYYY-MM-DD.sql`
   */
  public async saveSqlScriptToDeviceAndPath(
    filename: string = `nkliat_dump_${new Date().toISOString().split('T')[0]}.sql`
  ): Promise<{ savedToPhone: boolean; fullPath: string; script: string }> {
    const TARGET_BASE_PATH = '/storage/emulated/0/Documents/nkliat';
    const fullPath = `${TARGET_BASE_PATH}/${filename}`;
    let savedToPhone = false;

    const script = this.generateSqlScript(db.getRawData());

    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        try {
          await Filesystem.mkdir({
            path: 'nkliat',
            directory: Directory.Documents,
            recursive: true,
          });
        } catch {
          // Folder already exists
        }

        await Filesystem.writeFile({
          path: `nkliat/${filename}`,
          data: script,
          directory: Directory.Documents,
        });

        savedToPhone = true;
      }
    } catch (err) {
      console.warn('Could not save SQL script natively to Documents/nkliat:', err);
    }

    // Web fallback download
    try {
      const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (webErr) {
      console.warn('Web download fallback notice:', webErr);
    }

    return { savedToPhone, fullPath, script };
  }

  public async getTableCounts(): Promise<{ table: string; nameAr: string; count: number }[]> {
    const tables = [
      { table: 'accounts', nameAr: 'شجرة الحسابات' },
      { table: 'currencies', nameAr: 'العملات والصرف' },
      { table: 'users', nameAr: 'المستخدمين' },
      { table: 'vehicles', nameAr: 'الشاحنات' },
      { table: 'drivers', nameAr: 'السائقين' },
      { table: 'voucher_headers', nameAr: 'سندات القبض والصرف' },
      { table: 'journal_entries', nameAr: 'قيود اليومية' },
      { table: 'shipment_orders', nameAr: 'أوامر الشحن' },
      { table: 'shipment_expense_items', nameAr: 'مصاريف الشحنات' },
    ];

    const results: { table: string; nameAr: string; count: number }[] = [];
    const SQL = await getSqlJs();
    const sqlDb = new SQL.Database();
    try {
      this.populateSqlDbFromApp(sqlDb, db.getRawData());
      for (const t of tables) {
        try {
          const res = sqlDb.exec(`SELECT COUNT(*) as cnt FROM ${t.table}`);
          const count = (res[0]?.values[0]?.[0] as number) || 0;
          results.push({ ...t, count });
        } catch {
          results.push({ ...t, count: 0 });
        }
      }
    } finally {
      sqlDb.close();
    }
    return results;
  }
}

export const sqliteService = new SQLiteService();
