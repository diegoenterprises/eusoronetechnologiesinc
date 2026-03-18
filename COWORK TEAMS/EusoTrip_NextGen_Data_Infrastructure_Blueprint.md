# EusoTrip Next-Generation Data Infrastructure Blueprint
## Project LIGHTSPEED — Sub-100ms Platform-Wide Data Fetching Overhaul

**Classification:** Internal Engineering — Executive Priority
**Prepared for:** Justice (Diego Usoro), CEO — Eusorone Technologies Inc.
**Date:** March 8, 2026
**Codename:** Project LIGHTSPEED
**Objective:** Transform every data-fetching operation across the entire EusoTrip platform to deliver Google Places API-level instant response times — sub-100ms for all user-facing interactions, sub-10ms for cached hits.

---

## THE PROBLEM — Diagnosed

Your platform has a **speed crisis hiding behind correct architecture**. The bones are right — 36M+ FMCSA records in MySQL with indexes, paginated ETL, SODA API integration — but the delivery mechanism between those indexed tables and the user's eyeballs is running through bottlenecks that make a 5-second carrier profile load feel like dial-up in 2026.

Here's exactly what's wrong:

### Current Architecture Bottlenecks

| Bottleneck | Where | Impact |
|-----------|-------|--------|
| **No Redis** — in-memory NodeCache only | `smartCache.ts`, `fmcsa.ts` | Every server restart = cold cache. Multi-instance = no shared cache. Cache miss = full MySQL round-trip. |
| **Sequential composite queries** | `getCarrierSafetyIntel()` in `fmcsaBulkLookup.ts` | 7 parallel MySQL queries per carrier lookup. Even at 5ms each = 35ms minimum. Under load, connection pool contention pushes this to 200-500ms. |
| **30-connection pool limit** | `db.ts` connectionLimit: 30 | 10 concurrent users each triggering a composite carrier lookup = 70 queries = pool exhaustion. Queue backs up. Users wait. |
| **No pre-computation** | Risk scores, eligibility, compliance status all calculated at request time | Every profile view recalculates the same risk score from raw data. 100 views of the same carrier = 100 identical computations. |
| **FMCSA API fallback blocking** | `carrierMonitor.ts` 10s timeout | If local data is incomplete, the system blocks the user for up to 10 seconds waiting for the FMCSA SAFER API. |
| **No frontend prefetching** | tRPC hooks without predictive loading | User clicks "View Profile" → starts fetching. Should have started fetching when user hovered. |
| **200-entry snapshot cache** | `carrierMonitor.ts` | Laughably small for a platform monitoring thousands of carriers. Cache eviction happens constantly. |
| **No data denormalization** | 7 normalized tables per carrier | Every carrier view = 7 JOINs across 7 tables. Correct for writes, catastrophic for reads at scale. |
| **Single-process architecture** | NodeCache bound to one process | Deploy 4 instances for scale → 4 independent cold caches. Zero cache sharing. |
| **No WebSocket push for live data** | Socket.io is a stub | Everything is pull-based. User must refresh to see changes. No real-time carrier status updates. |

**The diagnosis:** You have a **write-optimized architecture** serving **read-heavy workloads**. 99% of your traffic is reads. Your infrastructure should reflect that.

---

## THE VISION — What "Lightspeed" Feels Like

Think about what happens when you type in Google Places:

1. You type "123 Ma—" and before you finish, 5 addresses appear
2. No loading spinner. No skeleton screen. No "please wait"
3. Results change with every keystroke, in under 50ms
4. Behind the scenes: 200M+ places, indexed in a trie, cached at the edge, served from memory

**That's the standard we're building to.** Here's what EusoTrip users will experience:

| Action | Current | After LIGHTSPEED |
|--------|---------|-----------------|
| Search carrier by DOT/MC/name | 800ms-3s | **< 50ms** (trie + Redis) |
| Load full carrier intelligence profile | 3-5 seconds | **< 200ms** (pre-computed, cached) |
| Carrier risk score calculation | 500ms (real-time calc) | **< 5ms** (pre-computed, Redis) |
| Load board refresh (25 loads) | 1-2s | **< 100ms** (materialized + cache) |
| Dashboard KPI render | 2-4s | **< 150ms** (pre-aggregated) |
| Dispatch planner carrier verification | 1-3s | **< 50ms** (Redis hot cache) |
| FMCSA data freshness | ≤ 24 hours | **≤ 15 minutes** (delta + push) |
| Change alerts delivery | Every 5 min polling | **< 2 seconds** (WebSocket push) |
| Typeahead search (as-you-type) | Not available | **< 30ms per keystroke** |

---

## ARCHITECTURE — The LIGHTSPEED Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER'S BROWSER                                    │
│                                                                             │
│  ┌──────────────┐  ┌───────────────────┐  ┌─────────────────────────────┐  │
│  │ Predictive   │  │ React Query v5    │  │ WebSocket Client            │  │
│  │ Prefetch     │  │ + Optimistic UI   │  │ (Real-time Push)            │  │
│  │ Engine       │  │ + Stale-While-    │  │                             │  │
│  │ (hover/      │  │   Revalidate      │  │ carrier:status              │  │
│  │  scroll/     │  │ + Infinite Scroll │  │ load:update                 │  │
│  │  intent)     │  │ + Dedup           │  │ alert:change                │  │
│  └──────┬───────┘  └────────┬──────────┘  └──────────┬──────────────────┘  │
│         │                   │                         │                     │
└─────────┼───────────────────┼─────────────────────────┼─────────────────────┘
          │                   │                         │
          ▼                   ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EDGE / CDN LAYER (Azure Front Door)                  │
│                                                                             │
│  API Response Cache (GET requests, 30s-5min TTL, stale-while-revalidate)   │
│  Static Asset Cache (immutable hashing, 1-year TTL)                        │
│  Geographic Routing (US East, US West, Canada, Mexico edge POPs)           │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (tRPC + Express)                         │
│                                                                             │
│  ┌─────────────────────┐  ┌────────────────┐  ┌─────────────────────────┐  │
│  │ Request Dedup       │  │ Rate Limiter   │  │ Response Compression    │  │
│  │ (identical queries  │  │ (per-user,     │  │ (Brotli for JSON,      │  │
│  │  coalesced into 1)  │  │  per-endpoint) │  │  gzip fallback)        │  │
│  └─────────────────────┘  └────────────────┘  └─────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     REDIS CLUSTER (Azure Cache for Redis P1)                │
│                     Sub-millisecond reads · Shared across all instances     │
│                                                                             │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────────────────┐ │
│  │ L1: HOT     │ │ L2: WARM     │ │ L3: SEARCH │ │ L4: PUB/SUB         │ │
│  │ CACHE       │ │ CACHE        │ │ TRIE       │ │ INVALIDATION        │ │
│  │             │ │              │ │            │ │                      │ │
│  │ Pre-computed│ │ Full carrier │ │ Carrier    │ │ cache:invalidate     │ │
│  │ risk scores │ │ profiles     │ │ name/DOT/  │ │ carrier:updated      │ │
│  │ (714K)      │ │ (JSON, 15min)│ │ MC prefix  │ │ load:status:changed  │ │
│  │             │ │              │ │ index      │ │ etl:complete         │ │
│  │ Eligibility │ │ Load board   │ │ (3.8M keys)│ │                      │ │
│  │ scores      │ │ snapshots    │ │            │ │ WebSocket fanout     │ │
│  │ (714K)      │ │              │ │ Sorted sets│ │ to all instances     │ │
│  │             │ │ Dashboard    │ │ for ranked │ │                      │ │
│  │ Compliance  │ │ aggregates   │ │ results    │ │                      │ │
│  │ status      │ │              │ │            │ │                      │ │
│  │ TTL: 1hr    │ │ TTL: 15min   │ │ TTL: 24hr  │ │ No TTL (event-based)│ │
│  └─────────────┘ └──────────────┘ └────────────┘ └──────────────────────┘ │
│                                                                             │
│  Memory: ~4GB for 36M record index + 714K pre-computed profiles            │
│  Eviction: allkeys-lfu (Least Frequently Used)                             │
│  Persistence: AOF (append-only) for crash recovery                         │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MYSQL 8.0 (Azure Flexible Server)                       │
│                     Source of Truth · Write-Optimized · 36M+ Records        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ MATERIALIZED VIEWS (MySQL Generated Columns + Summary Tables)        │   │
│  │                                                                      │   │
│  │ carrier_intelligence_mv     — Pre-joined 7-table composite view     │   │
│  │ carrier_risk_scores_mv      — Pre-computed 0-100 risk + tier        │   │
│  │ carrier_eligibility_mv      — Pre-computed eligibility + blocklist  │   │
│  │ load_board_mv               — Pre-filtered available loads          │   │
│  │ dashboard_kpi_mv            — Pre-aggregated platform metrics       │   │
│  │ inspection_summary_mv       — Pre-aggregated by carrier             │   │
│  │ violation_summary_mv        — Pre-aggregated by carrier + category  │   │
│  │ crash_summary_mv            — Pre-aggregated by carrier + state     │   │
│  │                                                                      │   │
│  │ Refresh: Triggered by ETL completion (not on a timer)               │   │
│  │ Strategy: SWAP — build new → rename → drop old (zero-downtime)      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Connection Pool: 30 → 100 (read replicas absorb read load)                │
│  Read Replica: 1 dedicated read replica for all read-heavy queries         │
│  Write Primary: ETL, load creation, user actions only                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## TEAM ASSIGNMENTS — Six Disciplines, One Mission

### TEAM ALPHA: Backend & Data — "The Engine Room"

**Mission:** Rebuild the server-side data layer from connection pool to cache to query optimizer. Every millisecond saved here multiplies across every user, every request, every day.

#### A1. Redis Integration (Priority: CRITICAL)

**Current State:** In-memory NodeCache — single-process, no persistence, no sharing, 200-entry carrier cache.

**Target State:** Azure Cache for Redis (Premium P1) — distributed, persistent, shared across all instances, 4GB+ capacity.

**Implementation:**

```
File: frontend/server/services/cache/redisClient.ts (NEW)

Architecture:
┌─────────────────────────────────────────────────┐
│           Redis Client Singleton                │
│                                                 │
│  Primary:   Azure Redis P1 (6GB, <1ms latency) │
│  Fallback:  In-memory NodeCache (graceful)      │
│  Protocol:  ioredis with cluster support        │
│  Serialization: msgpack (40% smaller than JSON) │
│  Connection: Lazy init, auto-reconnect          │
└─────────────────────────────────────────────────┘
```

**Cache Tier Strategy:**

| Tier | Purpose | Key Pattern | TTL | Size Estimate |
|------|---------|-------------|-----|---------------|
| L1: Hot | Pre-computed scores (risk, eligibility) | `carrier:risk:{dot}` | 1 hour | ~50MB (714K carriers × 70 bytes) |
| L2: Warm | Full carrier profiles (composite) | `carrier:profile:{dot}` | 15 min | ~2GB (active carriers × 3KB) |
| L3: Search | Typeahead index | `search:carrier:{prefix}` | 24 hours | ~800MB (3.8M names + DOTs + MCs) |
| L4: Session | User-specific views, recent searches | `user:recent:{uid}` | 30 min | ~100MB |
| L5: Aggregate | Dashboard KPIs, load board snapshots | `agg:dashboard:{scope}` | 5 min | ~50MB |

**Cache Invalidation Strategy:**

Redis Pub/Sub channels for cross-instance invalidation:

```
Channel: cache:invalidate
Message: { type: "carrier", dot: "1234567", fields: ["risk", "profile"] }

→ All server instances subscribe
→ On message: delete matching Redis keys + local NodeCache
→ Guarantees: eventual consistency within 50ms across all instances
```

**Invalidation Triggers:**
- ETL completion → invalidate all carrier profiles for updated DOTs
- User action (load assignment, bid) → invalidate specific carrier/load keys
- Monitoring alert detected → invalidate carrier profile + push WebSocket event
- Daily ETL → bulk invalidate + rebuild L1 hot cache

#### A2. Materialized View System (Priority: CRITICAL)

**The Core Problem:** Every carrier profile view runs 7 separate queries across 7 tables — census, authority, insurance, SMS scores, crashes, inspections, violations — then computes risk/eligibility in application code.

**The Solution:** Pre-join and pre-compute everything into single-read summary tables.

**Table: `carrier_intelligence_mv`**

```sql
CREATE TABLE carrier_intelligence_mv (
  dot_number       INT UNSIGNED PRIMARY KEY,
  -- Census fields (denormalized)
  legal_name       VARCHAR(200),
  dba_name         VARCHAR(200),
  phy_street       VARCHAR(200),
  phy_city         VARCHAR(100),
  phy_state        CHAR(2),
  phy_zip          VARCHAR(10),
  telephone        VARCHAR(20),
  email_address    VARCHAR(200),
  nbr_power_unit   INT,
  driver_total     INT,
  carrier_operation VARCHAR(5),
  hm_flag          CHAR(1),
  cargo_carried    JSON,
  mcs150_date      DATE,
  -- Authority (denormalized)
  authority_status VARCHAR(20),
  common_auth      CHAR(1),
  contract_auth    CHAR(1),
  broker_auth      CHAR(1),
  mc_number        VARCHAR(20),
  -- Insurance (pre-aggregated)
  has_active_insurance  BOOLEAN,
  bipd_coverage_amount  DECIMAL(15,2),
  cargo_coverage_amount DECIMAL(15,2),
  insurance_carrier     VARCHAR(200),
  policy_expiry         DATE,
  -- Safety (pre-computed)
  risk_score            TINYINT UNSIGNED,    -- 0-100
  risk_tier             ENUM('LOW','MODERATE','HIGH','CRITICAL'),
  eligibility_score     TINYINT UNSIGNED,    -- 0-100
  is_blocked            BOOLEAN,
  blocked_reasons       JSON,
  -- SMS BASICs (latest)
  unsafe_driving_score  TINYINT UNSIGNED,
  unsafe_driving_alert  BOOLEAN,
  hos_score             TINYINT UNSIGNED,
  hos_alert             BOOLEAN,
  driver_fitness_score  TINYINT UNSIGNED,
  driver_fitness_alert  BOOLEAN,
  controlled_sub_score  TINYINT UNSIGNED,
  controlled_sub_alert  BOOLEAN,
  vehicle_maint_score   TINYINT UNSIGNED,
  vehicle_maint_alert   BOOLEAN,
  hazmat_score          TINYINT UNSIGNED,
  hazmat_alert          BOOLEAN,
  crash_indicator_score TINYINT UNSIGNED,
  crash_indicator_alert BOOLEAN,
  -- Crash summary (pre-aggregated)
  total_crashes         INT,
  fatal_crashes         INT,
  injury_crashes        INT,
  total_fatalities      INT,
  hazmat_releases       INT,
  -- Inspection summary (pre-aggregated)
  total_inspections     INT,
  driver_oos_count      INT,
  driver_oos_rate       DECIMAL(5,2),
  vehicle_oos_count     INT,
  vehicle_oos_rate      DECIMAL(5,2),
  -- OOS status
  has_active_oos        BOOLEAN,
  oos_date              DATE,
  oos_reason            VARCHAR(500),
  -- BOC-3
  has_boc3              BOOLEAN,
  -- Metadata
  last_computed_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_version          INT UNSIGNED,

  -- Indexes for every access pattern
  INDEX idx_name (legal_name),
  INDEX idx_state (phy_state),
  INDEX idx_risk (risk_tier, risk_score),
  INDEX idx_eligible (is_blocked, eligibility_score),
  INDEX idx_hm (hm_flag),
  FULLTEXT ft_search (legal_name, dba_name, phy_city)
) ENGINE=InnoDB;
```

**Refresh Strategy — Zero-Downtime SWAP:**

```
1. CREATE TABLE carrier_intelligence_mv_new (same schema)
2. INSERT INTO carrier_intelligence_mv_new SELECT ... FROM 7-table JOIN with computed columns
3. RENAME TABLE carrier_intelligence_mv TO carrier_intelligence_mv_old,
                carrier_intelligence_mv_new TO carrier_intelligence_mv
4. DROP TABLE carrier_intelligence_mv_old

Total time: ~3-5 minutes for 714K carriers
Triggers: After daily ETL completion + after monthly SMS refresh
During refresh: Existing table serves reads (zero downtime)
```

**Result: 7 queries → 1 query. 200-500ms → 2-5ms.**

#### A3. Connection Pool Overhaul

**Current:** 30 connections, single endpoint, read/write mixed.

**Target:**

```
Write Pool (Primary):
  connectionLimit: 30
  Purpose: ETL inserts, load creation, user mutations
  Endpoint: primary MySQL server

Read Pool (Replica):
  connectionLimit: 80
  Purpose: ALL read queries (profiles, search, dashboards, load board)
  Endpoint: Azure read replica

Combined: 110 connections, read/write separated
```

**Implementation Pattern:**

```typescript
// NEW: Dual-pool router
export const readDb = drizzle(readPool);   // Read replica
export const writeDb = drizzle(writePool); // Primary

// Automatic routing in tRPC procedures
// Mutations → writeDb
// Queries → readDb
```

#### A4. Query Coalescing & Deduplication

**Problem:** 10 users viewing the same carrier profile = 70 identical queries (7 per user).

**Solution:** Request coalescing — identical queries within a 50ms window are merged into a single database query, and the result is shared across all requesters.

```
User A requests carrier 1234567 → Query starts
User B requests carrier 1234567 (20ms later) → Joins existing query
User C requests carrier 1234567 (35ms later) → Joins existing query
Query returns → All 3 users get result simultaneously

Result: 70 queries → 7 queries for 10 concurrent users viewing same carrier
```

#### A5. Background Pre-Computation Pipeline

**Concept:** Don't wait for users to request data. Pre-compute the most common views and cache them.

```
ETL Completes (daily at noon CT)
  │
  ├─→ Step 1: Refresh carrier_intelligence_mv (3-5 min)
  │     └─→ SWAP table (zero downtime)
  │
  ├─→ Step 2: Pre-compute risk scores for ALL 714K carriers
  │     └─→ Write to Redis L1 Hot Cache (batch pipeline, ~30 seconds)
  │
  ├─→ Step 3: Pre-compute eligibility scores
  │     └─→ Write to Redis L1 Hot Cache
  │
  ├─→ Step 4: Rebuild search trie in Redis
  │     └─→ 3.8M carrier names + DOTs + MCs indexed (2-3 min)
  │
  ├─→ Step 5: Pre-aggregate dashboard KPIs
  │     └─→ Write to Redis L5 Aggregate Cache
  │
  ├─→ Step 6: Publish 'etl:complete' to Redis Pub/Sub
  │     └─→ All instances invalidate stale local caches
  │
  └─→ Step 7: Push WebSocket 'data:refreshed' to connected clients
        └─→ Frontend silently re-fetches stale queries (SWR pattern)

Total post-ETL pipeline: ~8-10 minutes
Result: By the time any user checks, data is already cached and pre-computed
```

---

### TEAM BETA: Frontend & UX — "The Glass"

**Mission:** Make the interface feel telepathic. Data should appear before the user consciously expects it. Jony Ive simplicity — no loading spinners, no skeleton screens, no "please wait." The UI should feel like an extension of thought.

#### B1. Predictive Prefetching Engine

**Concept:** Load data before the user asks for it, based on intent signals.

```
Intent Signals → Prefetch Actions:

Mouse hovers over carrier row (>150ms)
  → Prefetch carrier:profile:{dot} from Redis
  → By the time they click, data is already in React Query cache

User scrolls near bottom of load board
  → Prefetch next page of loads (infinite scroll)
  → No pagination clicks needed — content appears as they scroll

User navigates to Carrier Intelligence page
  → Prefetch top 50 most-searched carriers from Redis
  → Prefetch user's 10 most recently viewed carriers

User types in search box (after 2 characters)
  → Debounced 100ms typeahead query against Redis trie
  → Results appear as dropdown, Google Places style
  → Each result click prefetches full profile

Dashboard tab becomes visible
  → Prefetch all KPI aggregates from Redis L5
```

**React Query Configuration for LIGHTSPEED:**

```typescript
// Global QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 min — data stays "fresh"
      gcTime: 30 * 60 * 1000,           // 30 min — garbage collect unused
      refetchOnWindowFocus: false,       // Don't refetch on tab switch
      refetchOnReconnect: 'always',      // Always refetch after disconnect
      retry: 1,                          // Fast fail, don't retry 3x
      retryDelay: 500,                   // Quick retry
      networkMode: 'offlineFirst',       // Serve cache first, then fetch
    },
  },
});
```

#### B2. Typeahead Search — The Google Places Experience

**This is the signature interaction.** When a user types in the carrier search box, results must appear within 30ms per keystroke.

```
Architecture:

User types "K-E-N" in search box
  │
  ├─→ Keystroke 1 ("K"): Too short, show recent searches
  ├─→ Keystroke 2 ("KE"): Debounce 100ms, then query
  └─→ Keystroke 3 ("KEN"):
        │
        ├─→ Frontend sends tRPC query: search.typeahead("KEN")
        │
        ├─→ Server checks Redis trie: ZRANGEBYLEX carrier:names [KEN [KEN\xff LIMIT 0 10
        │     └─→ Returns in < 1ms: ["KENAN ADVANTAGE GROUP", "KENSINGTON TRANSPORT", ...]
        │
        ├─→ Server enriches with pre-computed data from Redis L1:
        │     └─→ MGET carrier:risk:1234567 carrier:risk:2345678 ...
        │     └─→ Returns risk tier, DOT, MC, state for each result
        │
        └─→ Total server time: < 5ms
            Total round-trip: < 30ms (with edge caching)

Dropdown renders instantly:
┌──────────────────────────────────────────────────┐
│ 🔍 KEN                                           │
├──────────────────────────────────────────────────┤
│ KENAN ADVANTAGE GROUP      DOT: 295461   ● LOW  │
│ KENSINGTON TRANSPORT LLC   DOT: 1876432  ● MOD  │
│ KENTUCKY FUEL TRANSPORT    DOT: 987654   ● HIGH │
│ KENWORTH LOGISTICS INC     DOT: 2345678  ● LOW  │
│ KEN'S HAZMAT HAULING       DOT: 3456789  ● LOW  │
└──────────────────────────────────────────────────┘
```

**Redis Trie Implementation:**

```
Build Phase (after ETL):
  For each of 3.8M carriers:
    ZADD carrier:names 0 "KENAN ADVANTAGE GROUP|295461|MC123456|TX|LOW"
    ZADD carrier:dots 0 "295461|KENAN ADVANTAGE GROUP|TX"
    ZADD carrier:mcs 0 "MC123456|KENAN ADVANTAGE GROUP|295461"

Query Phase:
  ZRANGEBYLEX carrier:names "[KEN" "[KEN\xff" LIMIT 0 10
  → Returns up to 10 matches starting with "KEN"
  → O(log N + M) where N = 3.8M, M = 10 results
  → Sub-millisecond
```

#### B3. Optimistic UI & Instant Feedback

**Principle:** Never show a loading spinner for actions the user initiated. Show the expected result immediately, reconcile with server in background.

```
Examples:

Carrier Eligibility Check:
  User clicks "Check Eligibility"
  → Immediately show cached eligibility score (from React Query cache)
  → Background: verify against latest Redis L1 data
  → If different: silently update (no flash, smooth transition)

Load Board Filter Change:
  User selects "Hazmat Class 3 only"
  → Immediately filter client-side cached load data
  → Background: fetch server-filtered results
  → Merge: replace client-filtered with server-filtered (no visible change if same)

Bid Submission:
  User submits bid on load
  → Immediately show "Bid Submitted" with bid amount in UI
  → Background: server processes, confirms
  → On confirmation: update bid status silently
  → On failure: show error, revert UI with animation
```

#### B4. Skeleton-Free Loading Strategy

**The Jony Ive Principle:** If we're fast enough, we don't need skeletons. If something takes > 200ms, use a blur-to-sharp animation rather than skeleton placeholders.

```
Loading Priority Waterfall:

Priority 1 (0ms):     Show cached data if available (React Query cache)
Priority 2 (0-50ms):  Show Redis-cached data (near-instant)
Priority 3 (50-200ms): Show materialized view data (single query)
Priority 4 (200ms+):  Blur-to-sharp animation of stale data while fresh loads

Never show:
  ✗ Loading spinners (except on initial page load)
  ✗ Skeleton screens on data that was recently viewed
  ✗ "Please wait" messages
  ✗ Empty states while loading (show last known state)
```

#### B5. Infinite Scroll & Virtual Lists

**Current:** LIMIT 25 with page numbers. User clicks "Next" and waits.

**Target:** Infinite scroll with virtual rendering for all list views.

```
Load Board:
  → Render only visible rows (react-window or @tanstack/virtual)
  → Prefetch next 25 when user scrolls past 80% threshold
  → 10,000 loads = same memory as 25 loads (virtual rendering)

Carrier Search Results:
  → Virtual list of results
  → Each row height: fixed 72px for consistent scroll
  → Prefetch carrier profiles for visible + next 10 rows

Inspection/Violation History:
  → Infinite scroll through 20K+ violations per carrier
  → Virtual rendering: only DOM nodes for visible rows
```

---

### TEAM ZETA: Real-Time & Communications — "The Nervous System"

**Mission:** Transform EusoTrip from a pull-based "refresh to see changes" platform into a push-based "changes appear the instant they happen" platform.

#### Z1. WebSocket Infrastructure (Full Activation)

**Current State:** Socket.io stub exists but is non-functional.

**Target State:** Full production WebSocket with Redis-backed Pub/Sub for multi-instance fanout.

```
Architecture:

┌──────────────────────────────────────────────────────────┐
│                    WebSocket Gateway                      │
│                    (Socket.io + Redis Adapter)            │
│                                                           │
│  Channels:                                                │
│  ├── carrier:{dot}        → Safety/authority changes      │
│  ├── load:{id}            → Status, bids, assignment      │
│  ├── user:{id}            → Notifications, alerts         │
│  ├── fleet:{companyId}    → Fleet-wide updates            │
│  ├── loadboard:global     → New loads, removed loads      │
│  ├── dashboard:{scope}    → KPI updates                   │
│  └── etl:status           → Data freshness indicator      │
│                                                           │
│  Redis Adapter:                                           │
│  └── All instances share socket state via Redis Pub/Sub   │
│      → User connects to Instance A, event published from  │
│        Instance B → Redis relays → Instance A delivers    │
└──────────────────────────────────────────────────────────┘
```

**Real-Time Events:**

| Event | Trigger | Payload | Latency Target |
|-------|---------|---------|----------------|
| `carrier:safety:changed` | Monitoring detects change | `{ dot, field, old, new, severity }` | < 2s |
| `carrier:authority:revoked` | ETL/monitoring | `{ dot, reason, date }` | < 2s |
| `load:status:updated` | Load lifecycle change | `{ loadId, status, timestamp }` | < 500ms |
| `load:bid:received` | New bid submitted | `{ loadId, bidId, amount, carrier }` | < 500ms |
| `load:assigned` | Driver assigned | `{ loadId, driverId, carrier }` | < 500ms |
| `alert:change` | Carrier monitoring alert | `{ dot, alertType, severity }` | < 2s |
| `dashboard:kpi:updated` | Aggregate recalculated | `{ metric, value, delta }` | < 5s |
| `etl:progress` | ETL running | `{ dataset, progress, eta }` | Real-time |

#### Z2. Server-Sent Events for Lightweight Streams

**For scenarios where WebSocket is overkill** (dashboard metrics, ETL progress):

```
GET /api/sse/dashboard-metrics
Content-Type: text/event-stream

data: {"totalLoads": 1247, "activeCarriers": 342, "revenue": 2847000}
data: {"totalLoads": 1248, "activeCarriers": 342, "revenue": 2849500}

→ Client receives updates every 5 seconds
→ No connection overhead of WebSocket
→ Auto-reconnect built into browser EventSource API
```

#### Z3. Push Notification Pipeline

```
Alert Priority Routing:

CRITICAL (OOS, authority revoked, insurance expired):
  → WebSocket push (instant)
  → Email notification (within 60s)
  → SMS notification (within 120s)
  → In-app notification (persistent)

WARNING (expiring, insufficient, BASIC alert):
  → WebSocket push (instant)
  → Email notification (within 5 min)
  → In-app notification (persistent)

INFO (routine changes):
  → WebSocket push (instant)
  → In-app notification (dismissible)
  → Email digest (daily)
```

---

### TEAM GAMMA: AI Systems — "The Brain"

**Mission:** Make ESANG AI faster, smarter, and predictive. The AI should anticipate what data users need before they ask.

#### G1. AI-Powered Search Ranking

**Current:** FULLTEXT search returns alphabetical/relevance results.

**Target:** ML-ranked results based on user behavior, platform context, and carrier quality.

```
Search for "hazmat carrier Texas":

Current ranking: Alphabetical by relevance score
LIGHTSPEED ranking:
  1. Carrier user has worked with before (behavioral signal)
  2. Carrier with best risk score in Texas (quality signal)
  3. Carrier with most platform activity (engagement signal)
  4. Carrier matching exact cargo type (context signal)
  5. Carrier with available capacity (operational signal)

Ranking Model Input Features:
  - User's search history (last 30 days)
  - User's load history (which carriers they've used)
  - Carrier risk/eligibility score (pre-computed)
  - Geographic proximity to user's typical lanes
  - Carrier capacity and availability
  - Time of day / season (demand patterns)
```

#### G2. Predictive Data Loading

**ESANG AI predicts what the user will need next:**

```
User is on Dispatch Planner, looking at a load from Houston to Chicago:

ESANG predicts they'll need:
  → Top 5 carriers for this lane (pre-cached)
  → Weather along route (pre-fetched)
  → Fuel prices along route (pre-fetched)
  → Compliance requirements for cargo type (pre-cached)
  → Recent accidents on I-10/I-55 corridor (pre-aggregated)

All pre-fetched in background while user reads load details.
When they click "Find Carriers" → instant results.
```

#### G3. Smart Cache Warming with ML

```
Pattern Recognition:
  - Users typically check carrier profiles between 8-10 AM CT
  - Dashboard is viewed most at 7 AM and 5 PM CT
  - Load board peaks at 6 AM CT (morning dispatch)

ML-Driven Cache Warming:
  - 7:45 AM: Pre-warm top 500 carrier profiles into Redis
  - 5:55 AM: Pre-warm load board first page into Redis
  - 6:50 AM: Pre-aggregate dashboard KPIs into Redis
  - Before predicted user sessions: Pre-load user's watchlist carriers
```

---

### TEAM DELTA: Compliance & Regulatory — "The Shield"

**Mission:** Ensure the LIGHTSPEED infrastructure maintains compliance data accuracy while dramatically increasing speed.

#### D1. Compliance Data Freshness Guarantees

```
Current: Data could be up to 24 hours stale.
LIGHTSPEED: Tiered freshness with clear UI indicators.

┌─────────────────────────────────────────────────────────────┐
│ CARRIER INTELLIGENCE: KENAN ADVANTAGE GROUP                 │
│ DOT: 295461 · MC: MC-123456 · Risk: LOW (12/100)          │
│                                                             │
│ Data freshness: ● Updated 2 hours ago (next: 10 hours)    │
│ ──────────────────────────────────────────────────────────── │
│                                                             │
│ Safety scores:  ● Real-time (last SMS refresh: Mar 1)      │
│ Insurance:      ● Updated today at 12:00 PM CT             │
│ Authority:      ● Updated today at 12:00 PM CT             │
│ Crash history:  ● Updated today at 12:00 PM CT             │
│ Monitoring:     ● Active (checked 4 minutes ago)           │
└─────────────────────────────────────────────────────────────┘
```

#### D2. Compliance-Critical Cache Bypassing

**Some data MUST NEVER be served stale in safety-critical contexts:**

```
Context: Driver about to be assigned to a hazmat load

Pre-Assignment Verification (ALWAYS bypasses cache):
  1. Query FMCSA SAFER API directly (real-time, 3s timeout)
  2. Verify: Operating authority ACTIVE
  3. Verify: Insurance coverage meets minimum ($750K+ BIPD)
  4. Verify: No active OOS orders
  5. Verify: Hazmat endorsement valid
  6. Verify: No CRITICAL BASICs alerts

If SAFER API is down:
  → Use cached data BUT display warning:
    "⚠ Real-time verification unavailable. Last verified: [timestamp]"
  → Log compliance bypass event for audit trail
  → Require manual dispatcher acknowledgment to proceed
```

#### D3. Audit Trail for Cache Decisions

```
Every compliance-relevant data access is logged:

{
  "timestamp": "2026-03-08T14:23:01.000Z",
  "action": "carrier_verification",
  "dot_number": 295461,
  "data_source": "redis_cache",       // or "mysql", "safer_api"
  "cache_age_seconds": 3421,
  "data_version": 14523,
  "compliance_context": "load_assignment",
  "result": "ELIGIBLE",
  "user_id": "dispatcher_123"
}

→ Stored in append-only compliance_audit_log table
→ Retained for 7 years (49 CFR §379.9 record retention)
→ Queryable for DOT audits and incident investigation
```

---

### TEAM EPSILON: Financial Systems — "The Vault"

**Mission:** Financial data flows must be fast but never wrong. Speed for display, absolute accuracy for transactions.

#### E1. Financial Data Caching Rules

```
CACHEABLE (display-only, eventual consistency OK):
  ✓ Wallet balance display (30s TTL)
  ✓ Transaction history list (60s TTL)
  ✓ Load pricing estimates (5min TTL)
  ✓ Platform fee display (5min TTL)
  ✓ Revenue dashboards (5min TTL)

NEVER CACHED (transactional accuracy required):
  ✗ Actual payment processing → Always hit Stripe API
  ✗ Escrow account balances at settlement → Always hit database
  ✗ Bid acceptance (double-spend prevention) → Database lock
  ✗ QuickPay disbursement → Real-time balance check
  ✗ Multi-currency conversion at transaction time → Live rate
```

#### E2. Optimistic Balance Display

```
User views wallet:

Step 1 (0ms): Show cached balance from React Query
Step 2 (50ms): Background fetch actual balance from server
Step 3: If different → animate balance change smoothly
         If same → no visible change

Result: Wallet page loads instantly, balance is always current within 30s
```

#### E3. Financial Dashboard Pre-Aggregation

```
Pre-computed financial aggregates in Redis:

finance:daily:revenue        → Today's gross revenue (updated every 5 min)
finance:daily:settlements    → Today's settlement count + total
finance:monthly:revenue      → Month-to-date revenue
finance:monthly:fees         → Month-to-date platform fees
finance:carrier:{dot}:30d    → 30-day carrier financial summary
finance:shipper:{id}:30d     → 30-day shipper financial summary

Aggregation: Background job runs every 5 minutes
Source: Read replica (never touches write primary)
```

---

## IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-4) — "Get Redis, Get Fast"

| Week | Deliverable | Team | Impact |
|------|------------|------|--------|
| 1 | Deploy Azure Cache for Redis P1 | Alpha | Infrastructure ready |
| 1 | Install ioredis, configure connection | Alpha | Redis client operational |
| 2 | Build `carrier_intelligence_mv` table | Alpha | 7 queries → 1 query |
| 2 | Implement Redis L1 (risk/eligibility scores) | Alpha | Score lookups: 500ms → 1ms |
| 3 | Add read replica, split read/write pools | Alpha | 2x connection capacity |
| 3 | Configure React Query defaults (SWR, stale times) | Beta | Frontend caching active |
| 4 | Build typeahead search with Redis sorted sets | Alpha + Beta | Google Places-style search |
| 4 | Hover-to-prefetch on carrier rows | Beta | Profile load: instant on click |

**Phase 1 Result:** Carrier search goes from 800ms-3s → < 50ms. Carrier profile goes from 3-5s → < 200ms.

### Phase 2: Real-Time (Weeks 5-8) — "Everything Pushes"

| Week | Deliverable | Team | Impact |
|------|------------|------|--------|
| 5 | Activate Socket.io with Redis adapter | Zeta | WebSocket infrastructure live |
| 5 | Implement carrier:safety:changed events | Zeta | Real-time safety alerts |
| 6 | Implement load:status and load:bid events | Zeta | Real-time load updates |
| 6 | Build push notification pipeline | Zeta | CRITICAL alerts in < 2s |
| 7 | Add Redis Pub/Sub for cache invalidation | Alpha | Cross-instance consistency |
| 7 | Implement infinite scroll on load board | Beta | No more pagination clicks |
| 8 | Build compliance audit trail system | Delta | Regulatory-grade logging |
| 8 | Financial cache rules + optimistic balance | Epsilon | Instant wallet display |

**Phase 2 Result:** Platform goes from pull-based to push-based. Changes appear instantly without refresh.

### Phase 3: Intelligence (Weeks 9-12) — "The Brain Wakes Up"

| Week | Deliverable | Team | Impact |
|------|------------|------|--------|
| 9 | AI-powered search ranking | Gamma | Better results, faster |
| 9 | Predictive data loading (context-aware prefetch) | Gamma + Beta | Anticipatory UX |
| 10 | ML cache warming (time-of-day patterns) | Gamma + Alpha | Pre-warmed caches at peak |
| 10 | Compliance-critical cache bypass system | Delta | Safety-first data accuracy |
| 11 | Background pre-computation pipeline (post-ETL) | Alpha | Data ready before users arrive |
| 11 | Financial dashboard pre-aggregation | Epsilon | KPIs in < 150ms |
| 12 | Full integration testing + load testing | All Teams | Verify sub-100ms targets |
| 12 | Edge caching (Azure Front Door) for API responses | Alpha | Geographic latency reduction |

**Phase 3 Result:** The platform anticipates what users need. ESANG AI drives cache warming. Compliance is bulletproof.

---

## PERFORMANCE TARGETS — The LIGHTSPEED Scorecard

| Metric | Current | Phase 1 | Phase 2 | Phase 3 (Final) |
|--------|---------|---------|---------|-----------------|
| Carrier search (typeahead) | 800ms-3s | < 50ms | < 50ms | **< 30ms** |
| Carrier profile (full) | 3-5s | < 200ms | < 200ms | **< 100ms** |
| Risk score lookup | 500ms | < 5ms | < 5ms | **< 2ms** |
| Load board (25 loads) | 1-2s | < 200ms | < 100ms | **< 100ms** |
| Dashboard KPIs | 2-4s | < 500ms | < 200ms | **< 150ms** |
| Real-time alert delivery | 5min (polling) | 5min | < 2s | **< 1s** |
| Search results ranking | Alphabetical | Alphabetical | Contextual | **AI-ranked** |
| Data freshness (display) | ≤ 24hr | ≤ 24hr | ≤ 15min | **≤ 15min** |
| Cache hit rate | ~30% | ~70% | ~85% | **> 90%** |
| Concurrent users supported | ~50 | ~200 | ~500 | **1,000+** |

---

## INFRASTRUCTURE COST

| Component | Monthly Cost | Purpose |
|-----------|-------------|---------|
| Azure Cache for Redis P1 (6GB) | ~$230/mo | Distributed cache + pub/sub |
| Azure MySQL Read Replica | ~$180/mo | Read traffic offloading |
| Azure Front Door (CDN) | ~$35/mo + traffic | Edge caching + geo-routing |
| Additional compute (if needed) | ~$100/mo | Background pre-computation |
| **Total Additional** | **~$545/mo** | |

**ROI:** $545/month to eliminate 5-second page loads for every user, every session, every day. One lost enterprise customer due to slow UX costs more than 10 years of this infrastructure.

---

## THE JONY IVE PRINCIPLE — Design Philosophy

Throughout this overhaul, every decision should pass the Ive test:

1. **Invisible complexity.** The most sophisticated caching, pre-computation, and real-time infrastructure in the world — and the user sees none of it. They just see fast.

2. **No unnecessary UI.** Remove loading spinners, skeleton screens, and "please wait" messages. If the data isn't instant, the architecture is wrong.

3. **Purposeful motion.** The only animations are blur-to-sharp transitions and smooth number changes. No gratuitous spinners, no bouncing dots.

4. **Trust through speed.** When a carrier profile loads in 100ms with 36M records behind it, users trust the platform. Speed *is* the brand.

5. **Honesty in data.** Always show data freshness indicators. Never hide staleness. Users trust transparent systems.

---

## CONCLUSION

Project LIGHTSPEED transforms EusoTrip from a platform that "works correctly but loads slowly" into one that "feels like it reads your mind." The architecture changes are surgical — Redis for caching, materialized views for pre-computation, WebSocket for real-time, and AI for prediction — but the user experience transformation is total.

The user types three characters and sees carriers. They hover on a row and click — the profile is already there. They assign a driver and see the bid confirmed before they blink. They check their dashboard and every number is current.

That's the gold standard. That's what we're building.

**Six teams. Twelve weeks. One mission: Lightspeed.**

---

*Prepared by: Team Alpha + Team Beta + Team Gamma + Team Delta + Team Epsilon + Team Zeta*
*Architecture research informed by: Redis.io, TanStack Query, Socket.io, Azure Cache documentation, Google Places API patterns*
*For: Justice (Diego Usoro), CEO — Eusorone Technologies Inc.*
