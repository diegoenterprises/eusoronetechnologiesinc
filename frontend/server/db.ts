import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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

  // Try openId lookup — may fail if column doesn't exist in actual DB
  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    if (result.length > 0) return result[0];
  } catch (err) {
    console.warn("[Database] openId lookup failed (column may not exist):", err);
  }

  return undefined;
}

// TODO: add feature queries here as your schema grows.
