# WS-QP-004: Dual-Storage Pattern (MongoDB Integration)

## Origin
Reverse-engineered from QPilotOS v3.3 data persistence architecture (Section 3.3.1, 3.3.3). QPilotOS stores structured metadata (task IDs, timestamps, status) in MySQL and large unstructured data (quantum circuits, raw measurement results) in MongoDB. This hybrid approach keeps relational queries fast while allowing flexible storage for large payloads.

## Concept
EusoTrip currently stores EVERYTHING in MySQL via Drizzle ORM — including large JSON blobs, GPS trail histories, conversation logs, BOL images metadata, audit trails, and AI analysis results. This creates performance issues as tables grow. The Dual-Storage Pattern offloads large unstructured data to MongoDB while keeping MySQL as the source of truth for relational queries.

## What Exists Today
- All 242 tables in MySQL (Drizzle ORM)
- Large JSON columns in: `loads` (metadata), `audit_logs` (details), `esang_conversations`, `gamification_profiles`, `load_analysis_results` (fullReport)
- GPS tracking data grows unboundedly
- ESANG AI conversation histories stored as JSON in MySQL
- No MongoDB anywhere in the stack

## What to Build

### Step 1: MongoDB Setup
Add MongoDB to the deployment stack. In `docker-compose.yml` or Azure:

```yaml
mongodb:
  image: mongo:7.0
  ports:
    - "27017:27017"
  environment:
    MONGO_INITDB_ROOT_USERNAME: eusotrip
    MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
  volumes:
    - mongodb_data:/data/db
```

### Step 2: MongoDB Client Service
Create `frontend/server/services/mongoStore.ts`:

```typescript
/**
 * DUAL-STORAGE PATTERN — WS-QP-004
 * Adapted from QPilotOS QCloudServer persistence architecture
 *
 * MySQL (Drizzle): Relational data, foreign keys, transactional queries
 * MongoDB: Large documents, time-series data, unstructured payloads
 *
 * Rule: If a record is > 4KB or grows unboundedly, it goes to MongoDB.
 * MySQL keeps a reference ID (mongoDocId) for cross-referencing.
 */

import { MongoClient, Db, Collection } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) return db;
  const uri = process.env.MONGODB_URI || "mongodb://eusotrip:password@localhost:27017";
  client = new MongoClient(uri);
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

  return db;
}

export async function getMongoCollection(name: string): Promise<Collection> {
  const database = await connectMongo();
  return database.collection(name);
}

// GPS Trail Storage
export async function storeGpsPoint(data: {
  loadId: number; driverId: number; lat: number; lng: number;
  speed: number; heading: number; timestamp: Date;
}) {
  const col = await getMongoCollection("gps_trails");
  await col.insertOne({ ...data, timestamp: data.timestamp || new Date() });
}

export async function getGpsTrail(loadId: number, limit = 1000) {
  const col = await getMongoCollection("gps_trails");
  return col.find({ loadId }).sort({ timestamp: -1 }).limit(limit).toArray();
}

// ESANG Conversation Storage
export async function storeConversation(data: {
  userId: number; sessionId: string; messages: any[];
  metadata: any; createdAt: Date;
}) {
  const col = await getMongoCollection("esang_conversations");
  const result = await col.insertOne(data);
  return result.insertedId.toString();
}

// Audit Detail Storage
export async function storeAuditDetail(data: {
  auditLogId: number; entityType: string; entityId: number;
  changes: any; fullSnapshot: any; timestamp: Date;
}) {
  const col = await getMongoCollection("audit_details");
  const result = await col.insertOne(data);
  return result.insertedId.toString();
}

// Analysis Report Storage (from WS-QP-003)
export async function storeAnalysisReport(loadId: number, report: any) {
  const col = await getMongoCollection("analysis_reports");
  await col.updateOne(
    { loadId },
    { $set: { loadId, report, updatedAt: new Date() } },
    { upsert: true }
  );
}
```

### Step 3: Migration Strategy
Do NOT migrate existing data immediately. Instead:

1. **New writes go to both stores**: MySQL gets the reference/summary, MongoDB gets the full payload
2. **Reads check MongoDB first**: If mongoDocId exists, fetch from MongoDB; otherwise fall back to MySQL JSON column
3. **Background migration job**: Gradually move historical large payloads from MySQL to MongoDB

Add `mongoDocId VARCHAR(64) DEFAULT NULL` column to tables that will use dual storage:

```sql
ALTER TABLE audit_logs ADD COLUMN mongoDocId VARCHAR(64) DEFAULT NULL;
ALTER TABLE load_analysis_results ADD COLUMN mongoDocId VARCHAR(64) DEFAULT NULL;
```

### Step 4: Integration Points

**GPS Tracking** (`frontend/server/_core/locationEngine.ts`):
- Current: GPS points stored in MySQL `gps_tracking` table
- New: Write to MongoDB `gps_trails` collection, keep only latest position in MySQL for fast queries
- Benefit: Unbounded trail history without MySQL bloat

**ESANG Conversations** (`frontend/server/_core/esangAI.ts`):
- Current: Conversation context stored in-memory or MySQL JSON
- New: Full conversation history in MongoDB, MySQL keeps session metadata only
- Benefit: Fast conversation retrieval, no JSON column size limits

**Audit Logs** (`frontend/server/routers/auditLogs.ts`):
- Current: `details` JSON column stores full change snapshots
- New: Summary in MySQL, full snapshot in MongoDB
- Benefit: Audit queries stay fast, detailed drill-down from MongoDB

**Analysis Reports** (from WS-QP-003):
- Current: `fullReport` JSON in `load_analysis_results`
- New: Summary scores in MySQL, full report in MongoDB
- Benefit: Dashboard queries hit MySQL, detail views hit MongoDB

### Step 5: Router Procedures
Create `frontend/server/routers/dataStore.ts`:

```typescript
export const dataStoreRouter = router({
  getGpsTrail: protectedProcedure
    .input(z.object({ loadId: z.number(), limit: z.number().default(500) }))
    .query(/* fetches from MongoDB gps_trails */),

  getConversationHistory: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(/* fetches from MongoDB esang_conversations */),

  getAuditDetail: protectedProcedure
    .input(z.object({ auditLogId: z.number() }))
    .query(/* fetches from MongoDB audit_details */),

  getStorageStats: protectedProcedure
    .query(/* returns: MySQL row counts, MongoDB document counts, storage sizes */),
});
```

### Step 6: Environment Configuration
Add to `.env`:
```
MONGODB_URI=mongodb://eusotrip:password@localhost:27017/eusotrip
MONGO_ENABLED=true
```

Wrap all MongoDB calls with feature flag check:
```typescript
const MONGO_ENABLED = process.env.MONGO_ENABLED === "true";
```

## Registration
- Import `dataStoreRouter` in `frontend/server/routers.ts`
- Register on appRouter
- Initialize MongoDB connection in `_core/index.ts` startup
- Guard storage stats with ADMIN, SUPER_ADMIN roles

## Testing
1. Store 10,000 GPS points via MongoDB → verify retrieval in < 100ms
2. Store ESANG conversation with 200 messages → verify full retrieval
3. Verify MySQL fallback when MongoDB is unavailable
4. Verify TTL index expires GPS data after 90 days
5. Verify storage stats endpoint reports accurate counts from both stores
