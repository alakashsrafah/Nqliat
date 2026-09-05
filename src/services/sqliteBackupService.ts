import initSqlJs, { Database } from 'sql.js';
import { DatabaseSchema } from '../db/database';

let sqlPromise: Promise<any> | null = null;

async function getSQL() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: (file: string) => `/${file}`,
    });
  }
  return sqlPromise;
}

export class SqliteBackupService {
  private static instance: SqliteBackupService;

  private constructor() {}

  public static getInstance(): SqliteBackupService {
    if (!SqliteBackupService.instance) {
      SqliteBackupService.instance = new SqliteBackupService();
    }
    return SqliteBackupService.instance;
  }

  /**
   * Exports the entire DatabaseSchema into a real, standard SQLite binary file (.sqlite / .db)
   */
  public async exportToSqliteBinary(schema: DatabaseSchema): Promise<Uint8Array> {
    const SQL = await getSQL();
    const db: Database = new SQL.Database();

    db.run('BEGIN TRANSACTION;');

    // 1. Chart of accounts
    db.run(`
      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id INTEGER PRIMARY KEY,
        parent_id INTEGER,
        account_code TEXT UNIQUE,
        account_name TEXT,
        account_type TEXT,
        account_level INTEGER,
        phone_number TEXT
      );
    `);
    const stmtAccount = db.prepare(
      'INSERT INTO chart_of_accounts (id, parent_id, account_code, account_name, account_type, account_level, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?);'
    );
    for (const item of schema.chart_of_accounts) {
      stmtAccount.run([
        item.id,
        item.parent_id ?? null,
        item.account_code,
        item.account_name,
        item.account_type,
        item.account_level,
        item.phone_number ?? '',
      ]);
    }
    stmtAccount.free();

    // 2. Currencies
    db.run(`
      CREATE TABLE IF NOT EXISTS currencies (
        id INTEGER PRIMARY KEY,
        currency_name TEXT,
        currency_code TEXT UNIQUE,
        currency_type TEXT,
        currency_symbol TEXT,
        exchange_rate REAL,
        details TEXT
      );
    `);
    const stmtCurr = db.prepare(
      'INSERT INTO currencies (id, currency_name, currency_code, currency_type, currency_symbol, exchange_rate, details) VALUES (?, ?, ?, ?, ?, ?, ?);'
    );
    for (const item of schema.currencies) {
      stmtCurr.run([
        item.id,
        item.currency_name,
        item.currency_code,
        item.currency_type,
        item.currency_symbol,
        item.exchange_rate,
        item.details ?? '',
      ]);
    }
    stmtCurr.free();

    // 3. Users
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        full_name TEXT,
        password_hash TEXT,
        role TEXT,
        user_type TEXT,
        user_code TEXT
      );
    `);
    const stmtUser = db.prepare(
      'INSERT INTO users (id, username, full_name, password_hash, role, user_type, user_code) VALUES (?, ?, ?, ?, ?, ?, ?);'
    );
    for (const item of schema.users) {
      stmtUser.run([
        item.id,
        item.username,
        item.full_name,
        item.password_hash,
        item.role,
        item.user_type ?? 'موظف',
        item.user_code ?? '',
      ]);
    }
    stmtUser.free();

    // 4. Vehicles
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY,
        vehicle_name TEXT,
        vehicle_number TEXT,
        vehicle_code TEXT,
        account_code TEXT,
        specifications TEXT,
        last_oil_change_date TEXT,
        change_log TEXT,
        parent_revenue_account TEXT
      );
    `);
    const stmtVeh = db.prepare(
      'INSERT INTO vehicles (id, vehicle_name, vehicle_number, vehicle_code, account_code, specifications, last_oil_change_date, change_log, parent_revenue_account) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);'
    );
    for (const item of schema.vehicles) {
      stmtVeh.run([
        item.id,
        item.vehicle_name,
        item.vehicle_number,
        item.vehicle_code,
        item.account_code,
        item.specifications,
        item.last_oil_change_date,
        item.change_log,
        item.parent_revenue_account ?? '',
      ]);
    }
    stmtVeh.free();

    // 5. Drivers
    db.run(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INTEGER PRIMARY KEY,
        full_name TEXT,
        phone_number TEXT,
        license_number TEXT,
        status TEXT,
        notes TEXT,
        created_at TEXT
      );
    `);
    const stmtDriver = db.prepare(
      'INSERT INTO drivers (id, full_name, phone_number, license_number, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);'
    );
    for (const item of schema.drivers || []) {
      stmtDriver.run([
        item.id,
        item.full_name,
        item.phone_number,
        item.license_number,
        item.status,
        item.notes ?? '',
        item.created_at ?? '',
      ]);
    }
    stmtDriver.free();

    // 6. Voucher Headers
    db.run(`
      CREATE TABLE IF NOT EXISTS voucher_header (
        id INTEGER PRIMARY KEY,
        type_id INTEGER,
        number INTEGER,
        date TEXT,
        amount REAL,
        currency_code TEXT,
        exchange_rate REAL,
        description TEXT,
        created_by INTEGER,
        created_at TEXT
      );
    `);
    const stmtVoucher = db.prepare(
      'INSERT INTO voucher_header (id, type_id, number, date, amount, currency_code, exchange_rate, description, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
    );
    for (const item of schema.voucher_header) {
      stmtVoucher.run([
        item.id,
        item.type_id,
        item.number,
        item.date,
        item.amount,
        item.currency_code,
        item.exchange_rate,
        item.description,
        item.created_by ?? 1,
        item.created_at ?? '',
      ]);
    }
    stmtVoucher.free();

    // 7. Journal entries
    db.run(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY,
        voucher_id INTEGER,
        entry_date TEXT,
        account_code TEXT,
        debit REAL,
        credit REAL,
        currency_code TEXT,
        exchange_rate REAL,
        equivalent_debit REAL,
        equivalent_credit REAL,
        description TEXT
      );
    `);
    const stmtEntry = db.prepare(
      'INSERT INTO journal_entries (id, voucher_id, entry_date, account_code, debit, credit, currency_code, exchange_rate, equivalent_debit, equivalent_credit, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
    );
    for (const item of schema.journal_entries) {
      stmtEntry.run([
        item.id,
        item.voucher_id,
        item.entry_date,
        item.account_code,
        item.debit,
        item.credit,
        item.currency_code,
        item.exchange_rate,
        item.equivalent_debit,
        item.equivalent_credit,
        item.description,
      ]);
    }
    stmtEntry.free();

    // 8. Shipment orders
    db.run(`
      CREATE TABLE IF NOT EXISTS shipment_orders (
        id INTEGER PRIMARY KEY,
        reference_number TEXT,
        vehicle_id INTEGER,
        merchant_account_code TEXT,
        trip_amount REAL,
        trip_currency_code TEXT,
        trip_exchange_rate REAL,
        departure_point TEXT,
        arrival_point TEXT,
        route TEXT,
        payload_weight REAL,
        road_length REAL,
        departure_date TEXT,
        arrival_date TEXT,
        driver_name TEXT,
        goods_type TEXT,
        notes TEXT,
        is_financially_posted INTEGER,
        voucher_id INTEGER,
        created_by INTEGER,
        created_at TEXT
      );
    `);
    const stmtShip = db.prepare(
      `INSERT INTO shipment_orders (
        id, reference_number, vehicle_id, merchant_account_code, trip_amount,
        trip_currency_code, trip_exchange_rate, departure_point, arrival_point,
        route, payload_weight, road_length, departure_date, arrival_date,
        driver_name, goods_type, notes, is_financially_posted, voucher_id,
        created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
    );
    for (const item of schema.shipment_orders) {
      stmtShip.run([
        item.id,
        item.reference_number,
        item.vehicle_id,
        item.merchant_account_code,
        item.trip_amount,
        item.trip_currency_code,
        item.trip_exchange_rate,
        item.departure_point,
        item.arrival_point,
        item.route,
        item.payload_weight,
        item.road_length,
        item.departure_date,
        item.arrival_date,
        item.driver_name,
        item.goods_type,
        item.notes,
        item.is_financially_posted,
        item.voucher_id ?? null,
        item.created_by,
        item.created_at,
      ]);
    }
    stmtShip.free();

    // 9. Shipment expense items
    db.run(`
      CREATE TABLE IF NOT EXISTS shipment_expense_items (
        id INTEGER PRIMARY KEY,
        shipment_order_id INTEGER,
        account_code TEXT,
        amount REAL,
        currency_code TEXT,
        exchange_rate REAL,
        expense_date TEXT,
        description TEXT
      );
    `);
    const stmtExp = db.prepare(
      'INSERT INTO shipment_expense_items (id, shipment_order_id, account_code, amount, currency_code, exchange_rate, expense_date, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?);'
    );
    for (const item of schema.shipment_expense_items) {
      stmtExp.run([
        item.id,
        item.shipment_order_id,
        item.account_code,
        item.amount,
        item.currency_code,
        item.exchange_rate,
        item.expense_date,
        item.description,
      ]);
    }
    stmtExp.free();

    // 10. System metadata
    db.run(`
      CREATE TABLE IF NOT EXISTS system_metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
    db.run(`
      INSERT INTO system_metadata (key, value) VALUES
      ('app_name', 'نظام إدارة النقليات البرية'),
      ('backup_version', '2.0-sqlite'),
      ('exported_at', '${new Date().toISOString()}'),
      ('format', 'SQLite 3.x Native Database');
    `);

    db.run('COMMIT;');

    // Export true SQLite binary array
    const binary = db.export();
    db.close();

    return binary;
  }

  /**
   * Imports a SQLite database from a binary Uint8Array or ArrayBuffer and returns DatabaseSchema
   */
  public async importFromSqliteBinary(data: Uint8Array): Promise<DatabaseSchema> {
    const SQL = await getSQL();
    const db: Database = new SQL.Database(data);

    // Helper to extract rows as object array
    const queryTable = (tableName: string): any[] => {
      try {
        const res = db.exec(`SELECT * FROM ${tableName}`);
        if (!res || res.length === 0) return [];
        const columns = res[0].columns;
        return res[0].values.map((row) => {
          const obj: any = {};
          columns.forEach((col, idx) => {
            obj[col] = row[idx];
          });
          return obj;
        });
      } catch (err) {
        console.warn(`Could not read table ${tableName} from sqlite:`, err);
        return [];
      }
    };

    const chart_of_accounts = queryTable('chart_of_accounts');
    const currencies = queryTable('currencies');
    const users = queryTable('users');
    const vehicles = queryTable('vehicles');
    const drivers = queryTable('drivers');
    const voucher_header = queryTable('voucher_header');
    const journal_entries = queryTable('journal_entries');
    const shipment_orders = queryTable('shipment_orders');
    const shipment_expense_items = queryTable('shipment_expense_items');

    db.close();

    if (!chart_of_accounts.length && !currencies.length) {
      throw new Error('ملف SQLite لا يحتوي على جداول صالحة لنظام النقليات');
    }

    return {
      chart_of_accounts,
      currencies,
      users,
      vehicles,
      drivers,
      voucher_header,
      journal_entries,
      shipment_orders,
      shipment_expense_items,
    };
  }
}

export const sqliteBackupService = SqliteBackupService.getInstance();
