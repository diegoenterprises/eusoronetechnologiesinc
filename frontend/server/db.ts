import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql2 from "mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: ReturnType<typeof mysql2.createPool> | null = null;

/**
 * Connection pool configuration for multi-user scale.
 * - connectionLimit: max concurrent connections (Azure MySQL default max = 300)
 * - waitForConnections: queue requests when all connections are in use
 * - queueLimit: max queued requests before rejecting (0 = unlimited)
 * - idleTimeout: release idle connections after 60s
 * - enableKeepAlive: prevent connection drops on Azure
 * - maxIdle: keep at least 5 connections ready for instant use
 */
function createPool() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is required");

  return mysql2.createPool({
    uri: dbUrl,
    connectionLimit: 20,
    waitForConnections: true,
    queueLimit: 100,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 30000,
    maxIdle: 5,
    connectTimeout: 10000,
  });
}

// Lazily create the drizzle instance backed by a connection pool.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = createPool();
      _db = drizzle(_pool);
      console.log("[Database] Connection pool initialized (limit: 20)");
    } catch (error) {
      console.error("[Database] Failed to create connection pool:", error);
      _pool = null;
      _db = null;
    }
  }
  return _db;
}

// Get the raw pool (promise-wrapped) for transactions and raw queries
export function getPool() {
  return _pool?.promise() || null;
}

// Graceful shutdown — call on process exit
export async function closeDb(): Promise<void> {
  if (_pool) {
    await new Promise<void>((resolve, reject) => {
      _pool!.end((err) => { if (err) reject(err); else resolve(); });
    });
    _pool = null;
    _db = null;
    console.log("[Database] Connection pool closed");
  }
}

// Retry wrapper for transient DB failures (deadlocks, connection resets)
const RETRYABLE_CODES = ["ER_LOCK_DEADLOCK", "ECONNRESET", "PROTOCOL_CONNECTION_LOST", "ER_LOCK_WAIT_TIMEOUT"];
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isRetryable = RETRYABLE_CODES.includes(err?.code) || err?.message?.includes("Connection lost");
      if (!isRetryable || attempt === maxRetries) throw err;
      const delay = Math.min(100 * Math.pow(2, attempt), 2000);
      console.warn(`[Database] Retryable error (attempt ${attempt}/${maxRetries}): ${err.code || err.message}. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: Record<string, any> = {};
    const updateSet: Record<string, unknown> = {};

    // Include openId if provided
    if (user.openId) {
      values.openId = user.openId;
    }

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'ADMIN';
      updateSet.role = 'ADMIN';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // Try insert with openId; if column doesn't exist, retry without
    try {
      await db.insert(users).values(values as any).onDuplicateKeyUpdate({
        set: updateSet,
      });
    } catch (err: any) {
      if (err?.message?.includes('openId') || err?.message?.includes('open_id') || err?.code === 'ER_BAD_FIELD_ERROR') {
        console.warn("[Database] openId column issue, retrying upsert without openId");
        const { openId: _removed, ...valuesWithoutOpenId } = values;
        const { openId: _removed2, ...updateSetWithoutOpenId } = updateSet;
        if (!valuesWithoutOpenId.email) {
          valuesWithoutOpenId.email = `${user.openId || 'user'}@eusotrip.com`;
        }
        await db.insert(users).values(valuesWithoutOpenId as any).onDuplicateKeyUpdate({
          set: updateSetWithoutOpenId,
        });
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    // Don't throw — failing to upsert shouldn't crash the app
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  // Include openId in select so callers (sdk.ts) can reference it
  const safeSelect = {
    id: users.id, openId: users.openId, name: users.name, email: users.email,
    phone: users.phone, passwordHash: users.passwordHash, loginMethod: users.loginMethod,
    role: users.role, companyId: users.companyId,
    isActive: users.isActive, isVerified: users.isVerified,
    stripeCustomerId: users.stripeCustomerId, stripeConnectId: users.stripeConnectId,
    profilePicture: users.profilePicture, metadata: users.metadata,
    currentLocation: users.currentLocation, lastGPSUpdate: users.lastGPSUpdate,
    createdAt: users.createdAt, updatedAt: users.updatedAt,
    lastSignedIn: users.lastSignedIn, deletedAt: users.deletedAt,
  };

  // Try openId lookup — may fail if column doesn't exist in actual DB
  try {
    const result = await db.select(safeSelect).from(users).where(eq(users.openId, openId)).limit(1);
    if (result.length > 0) return result[0];
  } catch (err) {
    console.warn("[Database] openId lookup failed (column may not exist):", err);
  }

  // Fallback: try email if openId looks like an email
  if (openId.includes("@")) {
    try {
      const result = await db.select(safeSelect).from(users).where(eq(users.email, openId)).limit(1);
      if (result.length > 0) return result[0];
    } catch {}
  }

  return undefined;
}

// TODO: add feature queries here as your schema grows.
