/**
 * DUAL-STORAGE PATTERN — WS-QP-004
 * Adapted from QPilotOS QCloudServer persistence architecture
 *
 * MySQL (Drizzle): Relational data, foreign keys, transactional queries
 * MongoDB: Large documents, time-series data, unstructured payloads
 *
 * Rule: If a record is > 4KB or grows unboundedly, it goes to MongoDB.
 * MySQL keeps a reference ID (mongoDocId) for cross-referencing.
 *
 * Feature-flagged: MONGO_ENABLED=true to activate
 */

import { logger } from "../_core/logger";

const MONGO_ENABLED = process.env.MONGO_ENABLED === "true";
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/eusotrip";

let client: any = null;
let db: any = null;

export async function connectMongo(): Promise<any> {
  if (!MONGO_ENABLED) return null;
  if (db) return db;

  try {
    const { MongoClient } = await import("mongodb");
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db("eusotrip");

    // Create indexes
    await db.collection("gps_trails").createIndex({ loadId: 1, timestamp: -1 });
    await db.collection("gps_trails").createIndex({ driverId: 1, timestamp: -1 });
    await db.collection("gps_trails").createIndex({ timestamp: 1 }, { expireAfterSeconds: 90 * 86400 }); // 90 day TTL
    await db.collection("esang_conversations").createIndex({ userId: 1, createdAt: -1 });
    await db.collection("audit_details").createIndex({ entityType: 1, entityId: 1, timestamp: -1 });
    await db.collection("analysis_reports").createIndex({ loadId: 1 });
    await db.collection("bol_documents").createIndex({ loadId: 1 });
    await db.collection("gamification_history").createIndex({ userId: 1, eventType: 1, timestamp: -1 });

    logger.info("[QPilotOS/WS-QP-004] MongoDB connected, indexes created");
    return db;
  } catch (err: any) {
    logger.warn("[QPilotOS/WS-QP-004] MongoDB unavailable:", err.message);
    return null;
  }
}

export function isMongoEnabled(): boolean {
  return MONGO_ENABLED;
}

async function getCollection(name: string): Promise<any | null> {
  const database = await connectMongo();
  if (!database) return null;
  return database.collection(name);
}

// GPS Trail Storage
export async function storeGpsPoint(data: {
  loadId: number; driverId: number; lat: number; lng: number;
  speed: number; heading: number; timestamp?: Date;
}): Promise<void> {
  const col = await getCollection("gps_trails");
  if (!col) return;
  await col.insertOne({ ...data, timestamp: data.timestamp || new Date() });
}

export async function storeGpsBatch(points: Array<{
  loadId: number; driverId: number; lat: number; lng: number;
  speed: number; heading: number; timestamp?: Date;
}>): Promise<void> {
  const col = await getCollection("gps_trails");
  if (!col || points.length === 0) return;
  await col.insertMany(points.map(p => ({ ...p, timestamp: p.timestamp || new Date() })));
}

export async function getGpsTrail(loadId: number, limit = 1000): Promise<any[]> {
  const col = await getCollection("gps_trails");
  if (!col) return [];
  return col.find({ loadId }).sort({ timestamp: -1 }).limit(limit).toArray();
}

export async function getDriverGpsTrail(driverId: number, limit = 500): Promise<any[]> {
  const col = await getCollection("gps_trails");
  if (!col) return [];
  return col.find({ driverId }).sort({ timestamp: -1 }).limit(limit).toArray();
}

// ESANG Conversation Storage
export async function storeConversation(data: {
  userId: number; sessionId: string; messages: any[];
  metadata: any; createdAt?: Date;
}): Promise<string | null> {
  const col = await getCollection("esang_conversations");
  if (!col) return null;
  const result = await col.insertOne({ ...data, createdAt: data.createdAt || new Date() });
  return result.insertedId.toString();
}

export async function getConversationHistory(sessionId: string): Promise<any | null> {
  const col = await getCollection("esang_conversations");
  if (!col) return null;
  return col.findOne({ sessionId });
}

export async function getUserConversations(userId: number, limit = 50): Promise<any[]> {
  const col = await getCollection("esang_conversations");
  if (!col) return [];
  return col.find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray();
}

// Audit Detail Storage
export async function storeAuditDetail(data: {
  auditLogId: number; entityType: string; entityId: number;
  changes: any; fullSnapshot: any; timestamp?: Date;
}): Promise<string | null> {
  const col = await getCollection("audit_details");
  if (!col) return null;
  const result = await col.insertOne({ ...data, timestamp: data.timestamp || new Date() });
  return result.insertedId.toString();
}

export async function getAuditDetail(auditLogId: number): Promise<any | null> {
  const col = await getCollection("audit_details");
  if (!col) return null;
  return col.findOne({ auditLogId });
}

// Analysis Report Storage (from WS-QP-003)
export async function storeAnalysisReport(loadId: number, report: any): Promise<void> {
  const col = await getCollection("analysis_reports");
  if (!col) return;
  await col.updateOne(
    { loadId },
    { $set: { loadId, report, updatedAt: new Date() } },
    { upsert: true }
  );
}

export async function getAnalysisReport(loadId: number): Promise<any | null> {
  const col = await getCollection("analysis_reports");
  if (!col) return null;
  return col.findOne({ loadId });
}

// Storage Stats
export async function getStorageStats(): Promise<any> {
  const database = await connectMongo();
  if (!database) return { mongoEnabled: false };
  const collections = ["gps_trails", "esang_conversations", "audit_details", "analysis_reports", "bol_documents"];
  const stats: Record<string, any> = { mongoEnabled: true };
  for (const name of collections) {
    try {
      const count = await database.collection(name).countDocuments();
      stats[name] = { count };
    } catch {
      stats[name] = { count: 0, error: "failed" };
    }
  }
  return stats;
}

// Graceful shutdown
export async function disconnectMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
