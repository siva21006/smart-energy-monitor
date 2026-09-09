import pkg from 'pg';
const { Pool } = pkg;
import { UserProfile, BillRecord } from '../types.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

export async function initDB() {
  if (!process.env.DATABASE_URL) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        state VARCHAR(255),
        board VARCHAR(255),
        "billingCycle" VARCHAR(255),
        budgetLimit INTEGER
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id VARCHAR(255) PRIMARY KEY,
        "userId" VARCHAR(255) REFERENCES users(id),
        "scanDate" VARCHAR(255),
        "billingDate" VARCHAR(255),
        "billingPeriod" VARCHAR(255),
        "billingPeriodStart" VARCHAR(255),
        "billingPeriodEnd" VARCHAR(255),
        "billingCycle" VARCHAR(255),
        units INTEGER,
        amount NUMERIC,
        "isManual" BOOLEAN,
        "hasCustomAmount" BOOLEAN,
        "originalAmount" NUMERIC,
        status VARCHAR(255),
        "tariffSlab" VARCHAR(255),
        "meterNumber" VARCHAR(255),
        breakdown JSONB,
        "rawNotes" TEXT
      );
    `);
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
}

export async function getUserByEmail(email: string) {
  if (!process.env.DATABASE_URL) return null;
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
}

export async function getUserById(id: string): Promise<UserProfile | null> {
  if (!process.env.DATABASE_URL) return null;
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  if (!res.rows[0]) return null;
  const u = res.rows[0];
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    state: u.state,
    board: u.board,
    billingCycle: u.billingCycle,
    budgetLimit: u.budgetLimit
  };
}

export async function createUser(user: UserProfile & { passwordHash: string }) {
  if (!process.env.DATABASE_URL) return;
  await pool.query(`
    INSERT INTO users (id, email, password, name, state, board, "billingCycle", budgetLimit)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [user.id, user.email, user.passwordHash, user.name, user.state, user.board, user.billingCycle, user.budgetLimit]);
}

export async function updateUser(id: string, user: Partial<UserProfile>) {
  if (!process.env.DATABASE_URL) return;
  // Dynamic update
  const updates: string[] = [];
  const values: any[] = [];
  let i = 1;
  for (const [key, value] of Object.entries(user)) {
    if (key !== 'id') {
      const col = key === 'billingCycle' ? '"billingCycle"' : key;
      updates.push(`${col} = $${i}`);
      values.push(value);
      i++;
    }
  }
  if (updates.length === 0) return;
  values.push(id);
  await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${i}`, values);
}

export async function getUserBills(userId: string): Promise<BillRecord[]> {
  if (!process.env.DATABASE_URL) return [];
  const res = await pool.query('SELECT * FROM bills WHERE "userId" = $1 ORDER BY "billingDate" DESC, "scanDate" DESC', [userId]);
  return res.rows.map(b => ({
    ...b,
    amount: Number(b.amount),
    originalAmount: Number(b.originalAmount)
  }));
}

export async function saveBill(bill: BillRecord) {
  if (!process.env.DATABASE_URL) return;
  await pool.query(`
    INSERT INTO bills (
      id, "userId", "scanDate", "billingDate", "billingPeriod", "billingPeriodStart", "billingPeriodEnd", "billingCycle", 
      units, amount, "isManual", "hasCustomAmount", "originalAmount", status, "tariffSlab", "meterNumber", breakdown, "rawNotes"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
  `, [
    bill.id, bill.userId, bill.scanDate, bill.billingDate, bill.billingPeriod, bill.billingPeriodStart, bill.billingPeriodEnd, bill.billingCycle,
    bill.units, bill.amount, bill.isManual, bill.hasCustomAmount, bill.originalAmount, bill.status, bill.tariffSlab, bill.meterNumber, bill.breakdown, bill.rawNotes
  ]);
}

export async function deleteBills(userId: string) {
  if (!process.env.DATABASE_URL) return;
  await pool.query('DELETE FROM bills WHERE "userId" = $1', [userId]);
}

export async function deleteBillById(userId: string, billId: string) {
  if (!process.env.DATABASE_URL) return;
  await pool.query('DELETE FROM bills WHERE "userId" = $1 AND id = $2', [userId, billId]);
}
