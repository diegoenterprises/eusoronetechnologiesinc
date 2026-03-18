# CLAUDE CODE PROMPT SEQUENCE FOR EUSOTRIP — V2 (DEFINITIVE)

## Based on: 3 Rounds of 15-Agent Audits + Live MCP Verification

### Setup
1. Stop Windsurf (let current task finish or pause)
2. Open Terminal
3. Run: `cd ~/Desktop/eusoronetechnologiesinc && claude`
4. Paste each prompt ONE AT A TIME — wait for completion before pasting next
5. After each prompt, review the changes Claude Code shows you

---

## PROMPT 1: REMOVE MASTER PASSWORD [STOP-SHIP] (5 min)

```
CRITICAL SECURITY: The hardcoded master password "Esang2027!" exists in multiple files and must be completely removed.

Search the entire codebase for "Esang2027" first. Then:

1. frontend/api-server.js:
   - Line 10: Delete the MASTER_PASSWORD constant
   - Line 114: Delete the console.log that prints the password
   - The login handler around line 68 compares against MASTER_PASSWORD. Rewrite it to use bcrypt comparison against the database, or at minimum reject all logins with a TODO comment explaining proper auth needs to be wired

2. frontend/serve.py:
   - Line 17: Delete the MASTER_PASSWORD variable
   - Line 135: Delete the print statement with the password
   - Rewrite any login handler that references it

3. docs/CLAUDE_COWORK_TEAM_DELEGATION.md:
   - Delete line 11 that documents the master password
   - Rename this file to docs/TEAM_DELEGATION.md

4. Check ALL other files — there may be more instances

After all changes, search the ENTIRE repo for "Esang2027" and show me the results. Must be 0.
```

---

## PROMPT 2: FIX COMPLIANCE MATH.RANDOM() [STOP-SHIP] (10 min)

```
CRITICAL: All 5 compliance rule checkers in frontend/server/services/ComplianceRulesAutomation.ts use Math.random() to generate fake violations. This is a federal compliance system — random data is unacceptable.

Read the file first, then replace each function:

1. checkHOS() — uses Math.floor(Math.random() * 3) for violations
   REPLACE: Query hos_logs table or use getHOSSummaryWithELD() from hosEngine.ts if it exists. If no data available, return { score: 0, findings: [{ description: "No HOS data available — connect ELD device", severity: "info" }] }

2. checkDVIR() — uses Math.random() for missing/uncorrected counts
   REPLACE: Query the inspections table for actual DVIR records

3. checkCDLMedical() — uses Math.random() for expiring/expired counts
   REPLACE: Query certifications table for actual expiration dates

4. checkDrugAlcohol() — uses Math.random() for overdue counts
   REPLACE: Query actual compliance testing records if table exists

5. checkInsuranceAuthority() — uses Math.random() > 0.7
   REPLACE: Query insurance data from FMCSA tables or insurance tables

6. The overall score around line 281 uses Math.random() - 0.5
   REPLACE: Calculate from actual findings

If a required table doesn't exist or is empty, return honest results like { score: 0, findings: [{ description: "No data available — manual review required" }] }. NEVER Math.random().

After changes: grep -rn "Math.random" frontend/server/services/ComplianceRulesAutomation.ts
Must return 0 results.
```

---

## PROMPT 3: FIX AI DISPATCH AND AUTO-APPROVE CONFIDENCE [STOP-SHIP] (5 min)

```
CRITICAL: AI auto-dispatch and auto-approve use Math.random() for confidence scores.

File: frontend/server/routers/esangAI.ts

1. Find the auto-dispatch section (around line 145). There's a line like:
   const confidence = Math.random() * 0.3 + 0.7

   Replace with a deterministic scoring function. Add this above the usage:

   function calculateDispatchConfidence(load: any, carrier: any): number {
     let score = 0;
     if (carrier?.hazmatCertified && load?.isHazmat) score += 0.25;
     if (carrier?.trailerTypes?.includes(load?.trailerType)) score += 0.20;
     if (carrier?.safetyRating === 'Satisfactory' || carrier?.safetyRating === 'Conditional') score += 0.15;
     if (carrier?.insuranceCurrent) score += 0.15;
     if ((carrier?.completedLoads ?? 0) > 50) score += 0.10;
     if ((carrier?.onTimeRate ?? 0) > 0.9) score += 0.10;
     if ((carrier?.oosRate ?? 1) < 0.05) score += 0.05;
     return Math.min(1.0, score);
   }

   Then use: const confidence = calculateDispatchConfidence(load, carrier);

2. Around lines 154-155, there are fake reasoning strings with Math.random() percentages.
   Replace with descriptions derived from the actual scoring factors.

3. Find the auto-approve section (around line 196) with the same Math.random() pattern.
   Replace with the same calculateDispatchConfidence() call.

After: grep -n "Math.random" frontend/server/routers/esangAI.ts
Must return 0 results.
```

---

## PROMPT 4: FIX PHOTO INSPECTION [STOP-SHIP] (5 min)

```
SAFETY CRITICAL: Vehicle photo inspections use a random dice roll to determine pass/fail.

File: frontend/server/services/PhotoInspectionAI.ts

Around line 94, there's a block that randomly assigns PASS (65%), MARGINAL (20%), FAIL (15%) — the photoUrl is completely ignored. Around line 130, confidence is 0.82 + Math.random() * 0.16.

Replace the entire random block. Two options:

OPTION A (if Gemini API is available): Actually call Gemini Vision:
- Send the photo to Gemini 2.5 Flash with a prompt to evaluate the inspection point
- Parse the response into condition and defects

OPTION B (safer fallback): Return honest "needs human review":
return {
  condition: 'MANUAL_REVIEW_REQUIRED' as any,
  confidence: 0,
  defects: [],
  safeToOperate: null,
  note: 'Automated photo analysis not yet available. Manual inspection required by certified inspector.',
};

Either way, fix the confidence line too — should come from AI response or be 0.

After: grep -n "Math.random" frontend/server/services/PhotoInspectionAI.ts
Must return 0.
```

---

## PROMPT 5: FIX ANOMALY DETECTION [STOP-SHIP] (5 min)

```
FIX: Anomaly detection uses 11 Math.random() gates to randomly suppress real anomalies.

File: frontend/server/services/AnomalyMonitor.ts

A real statistical anomaly engine exists at frontend/server/services/ai/forecastEngine.ts with z-scores, modified z-scores, trend analysis, and Holt-Winters forecasting. Check if that file exists.

If forecastEngine.ts exists:
- Import its functions
- Replace each Math.random() gate with actual statistical analysis from that engine

If it doesn't exist:
- Replace each Math.random() with a simple threshold check:
  Instead of: if (Math.random() > 0.4) { anomalies.push(...) }
  Use: Always push the anomaly, or query actual data to determine if it's anomalous

The key rule: anomaly monitoring must NEVER randomly hide real anomalies.

After: grep -n "Math.random" frontend/server/services/AnomalyMonitor.ts
Must return 0.
```

---

## PROMPT 6: FIX HOS DUAL-ENDPOINT PROBLEM (5 min)

```
There are TWO HOS endpoints in frontend/server/routers/drivers.ts:

1. getHOSStatus (around line 180) — OLD — returns hardcoded "6h 30m" fake data
2. getMyHOSStatus (around line 797) — NEW — uses real HOS engine

The old endpoint is still active and any frontend component calling it gets fake data that violates 49 CFR 395.

Fix: Make getHOSStatus use the real HOS engine. Read the file, find both endpoints, and make the old one call the same real engine the new one uses. Import getHOSSummaryWithELD from hosEngine if needed.

Do NOT delete getHOSStatus — frontend components may reference it. Just make it return real data.

After: search the file for any hardcoded time strings like "6h 30m" or "8h 00m" or "52h 30m" — should be 0.
```

---

## PROMPT 7: FIX MOBILE COMMAND CENTER (5 min)

```
File: frontend/server/services/MobileCommandCenter.ts

Three functions generate completely fake data with Math.random():
- generateActiveMission() — fake mission data
- generateHOS() — fake hours of service
- generateEarnings() — fake earnings

Replace each:
- generateActiveMission(): Query the missions table (it has 250 rows) for the driver's actual active missions
- generateHOS(): Use the real HOS engine (getHOSSummaryWithELD or similar)
- generateEarnings(): Query wallet_transactions or settlements for actual earnings data

If tables are empty, return { status: 'no_data', message: 'No data available yet' } — not random numbers.

After: grep -n "Math.random" frontend/server/services/MobileCommandCenter.ts should return 0.
```

---

## PROMPT 8: REMOVE DASHBOARD MOCK DATA FALLBACK (5 min)

```
File: frontend/server/routers/dashboard.ts

When database queries fail, the dashboard silently falls back to fake seed data via getSeedStats() and getSeedShipments() functions. Users see "healthy" dashboards even when the database is down.

1. Find getSeedStats and getSeedShipments functions (around lines 1670-1700) — DELETE them entirely
2. Find every catch block that calls these functions and replace with a proper error throw:

   throw new TRPCError({
     code: 'INTERNAL_SERVER_ERROR',
     message: 'Unable to load dashboard data. Please try again.',
   });

Users should see an error message when data is unavailable — not fake statistics.
```

---

## PROMPT 9: FIX ADMIN PANEL STUBS (15 min)

```
File: frontend/server/routers/admin.ts

11 of 12 infrastructure procedures return empty arrays or fake success. Fix each:

1. getWebhooks (around line 209): Returns []. Create a webhooks table if needed, or query an existing one. If no table exists, at minimum return a meaningful empty state, not just [].

2. getFeatureFlags (around line 249): Returns []. Query a feature_flags table or create one with common flags (maintenance_mode, new_registration, esang_enabled, etc.)

3. getAPIKeys (around line 266): Returns []. Query an api_keys table showing masked values.

4. getScheduledTasks (around line 292): Returns []. Query MySQL's EVENT scheduler: SELECT * FROM information_schema.EVENTS WHERE EVENT_SCHEMA = DATABASE()

5. getBackups (around line 376): Returns []. Query Azure MySQL backup info or return last known backup timestamp from a config table.

6. deleteWebhook, testWebhook, toggleFeatureFlag, revokeAPIKey: All return { success: true } without doing anything. Connect to real tables or at minimum validate input and log the action.

The one that works (getSlowQueries around line 449) queries performance_schema — use it as a model for the others.
```

---

## PROMPT 10: INSTALL CENTRALIZED LOGGER (15 min)

```
The codebase has ~2,000 console.log/error/warn statements and no logging framework. Windsurf claimed to replace them all — it didn't. Actually do it.

1. Install pino (lightweight, fast):
   cd frontend && npm install pino pino-pretty

2. Create frontend/server/services/logger.ts:

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

3. Replace console statements across the SERVER directory only (not client .tsx):
   - console.log( → logger.info(
   - console.error( → logger.error(
   - console.warn( → logger.warn(

   Add the import to each modified file:
   import { logger } from '../services/logger';  // adjust relative path

Focus on frontend/server/ directory. This is a large change — work through files systematically. Start with _core/, then routers/, then services/.

Don't touch frontend/client/ files — those run in the browser.
```

---

## PROMPT 11: WIRE WEBSOCKET EMITTERS (20 min)

```
CRITICAL ARCHITECTURE: The platform has TWO competing WebSocket systems and neither is properly wired.

System 1: frontend/server/services/socketService.ts — 42 emit functions, Socket.io-based, 0 called from routers
System 2: frontend/server/_core/websocket.ts — Different emit functions, raw ws-based, SOME called from routers

First, read both files to understand the architecture. Then:

STEP 1: Pick socketService.ts as the canonical system (it's Socket.io, more mature).

STEP 2: In every router that changes state, add the corresponding emit call AFTER the database write succeeds. Priority order:

a) frontend/server/routers/loads.ts — after status changes:
   import { emitLoadStateChange } from '../services/socketService';
   // After: await db.update(loads).set({ status })...
   emitLoadStateChange(loadId, { status, updatedBy: ctx.user.id });

b) frontend/server/routers/payments.ts — after payment processing:
   import { emitPaymentReceived } from '../services/socketService';

c) frontend/server/routers/wallet.ts — after transfers:
   import { emitWalletUpdate } from '../services/socketService';

d) frontend/server/routers/dispatch.ts — after assignments:
   import { emitDispatchAssignment } from '../services/socketService';

e) frontend/server/routers/compliance related files — after alerts:
   import { emitComplianceAlert } from '../services/socketService';

Wire at least the top 10 most critical emitters. Each one follows the same pattern: import the emit function, call it after the DB operation succeeds.

STEP 3: In frontend/client/src/pages/MessagingCenter.tsx, replace polling with WebSocket:
   Remove: refetchInterval: 6000 (line ~44)
   Remove: refetchInterval: 3000 (line ~48)
   Add socket subscription for real-time message delivery.
```

---

## PROMPT 12: FIX MCP SERVER ATTRIBUTION + ADD MISSING TOOLS (10 min)

```
File: frontend/server/services/mcpServer.ts

1. Line 2: Change "MCP SERVER — Model Context Protocol for Claude Cowork" to "EusoTrip Service Protocol — Eusorone Technologies, Inc."

2. Line 3-7: Remove any remaining Claude references in the comment block.

3. The MCP server has 35 tools but claims 45. Add these 10 missing tools that were promised but never built. Each follows the existing mcp.tool() pattern in the file:

   a) hos_status — Query hosEngine or hos_logs for driver HOS compliance
   b) carrier_scorecard — Aggregate carrier performance from loads + ratings + FMCSA
   c) safety_incidents — Query safety_alerts table (11 rows exist)
   d) escort_overview — Query escort_assignments table (1 row exists)
   e) allocation_tracker — Query allocation_daily_tracking + allocation_contracts
   f) compliance_overview — Composite query across compliance tables
   g) eld_fleet_status — Query ELD connection status per vehicle
   h) inspection_records — Query inspections table
   i) certifications_status — Query certifications table for CDL/hazmat/TWIC/medical
   j) zeun_maintenance — Query zeun_maintenance_logs + zeun_diagnostic_results

Use the existing tools as patterns — each one selects from a table, formats results, returns via content array. Import any needed schema tables at the top of the file.
```

---

## PROMPT 13: REMOVE ALL REMAINING CLAUDE/AI ATTRIBUTION (3 min)

```
Search the entire codebase for these terms and clean up:

1. grep -ri "claude" across all files (excluding node_modules). Remove any references that attribute coding to Claude. KEEP references to Claude as a product feature or integration (like MCP client config).

2. grep -ri "windsurf" across all files. Remove any tool attribution.

3. grep -ri "ai-generated\|ai-coded\|ai-built" across all files. Remove.

4. Make sure these attribution lines are correct everywhere:
   - "EusoTrip — Eusorone Technologies, Inc."
   - "Developed by Mike 'Diego' Usoro"

Show me the search results after cleanup.
```

---

## PROMPT 14: DATABASE INTEGRITY (10 min)

```
Two database issues need attention:

1. frontend/drizzle/relations.ts is completely empty (just an import statement). Populate it with relationship definitions for the core tables:

import { relations } from 'drizzle-orm';
import { users, loads, bids, payments, wallets, companies, settlements, ... } from './schema';

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  loads: many(loads),
  payments: many(payments),
}));

// Add for: loads, bids, payments, wallets, companies, settlements, messages, conversations
// Look at the schema.ts to identify which columns reference other tables

2. The database connection pool is set to 30 but Azure MySQL allows 300. Find the pool configuration in frontend/server/db.ts or similar and increase to 150:
   connectionLimit: 150

3. While you're in db.ts, check if read/write pool splitting exists. If not, that's fine — just increase the main pool.
```

---

## PROMPT 15: COMMIT AND VERIFY (5 min)

```
Show me git status and a summary of all changes made. Then commit with this message:

"fix: complete security hardening, replace all Math.random() in business logic, wire WebSocket emitters, fix admin panel, add centralized logger, update MCP server

SECURITY:
- Removed hardcoded master password from api-server.js, serve.py, docs
- Fixed all Math.random() in compliance, AI dispatch, photo inspection, anomaly detection
- Fixed HOS hardcoded data to use real engine

INFRASTRUCTURE:
- Installed pino logger, replaced ~2000 console statements
- Wired WebSocket emitters to routers
- Replaced MessagingCenter polling with WebSocket
- Implemented admin panel procedures
- Removed dashboard mock data fallback

MCP SERVER:
- Added 10 missing tools (hos_status, carrier_scorecard, etc.)
- Fixed attribution to Eusorone Technologies

DATABASE:
- Populated relations.ts
- Increased connection pool to 150

EusoTrip — Eusorone Technologies, Inc.
Developed by Mike 'Diego' Usoro"

Then run these verification searches:

1. grep -r "Esang2027" . --include="*.js" --include="*.py" --include="*.md" --include="*.ts" | grep -v node_modules
2. grep -rn "Math.random" frontend/server/services/ComplianceRulesAutomation.ts frontend/server/routers/esangAI.ts frontend/server/services/PhotoInspectionAI.ts frontend/server/services/AnomalyMonitor.ts frontend/server/services/MobileCommandCenter.ts
3. grep -ri "claude cowork" frontend/server/ --include="*.ts" | grep -v node_modules
4. grep -c "console.log" frontend/server/**/*.ts 2>/dev/null | grep -v ":0$" | head -20

Show me all results. Items 1-3 should return 0. Item 4 should be dramatically reduced.
```

---

## AFTER ALL PROMPTS: FINAL VERIFICATION

```
Run a comprehensive verification:

1. Does the build pass? Run: npm run build (or whatever the build command is)
2. Search for remaining Math.random() in business logic: grep -rn "Math.random" frontend/server/ --include="*.ts" | grep -v node_modules | grep -v ".test." | grep -v "__tests__"
3. Count remaining console statements: grep -rc "console\.\(log\|error\|warn\)" frontend/server/ --include="*.ts" | grep -v node_modules | grep -v ":0$"
4. Verify MCP tool count: grep -c "mcp.tool(" frontend/server/services/mcpServer.ts
5. Verify no master password: grep -r "Esang2027" . | grep -v node_modules
6. Verify WebSocket wiring: grep -rn "socketService" frontend/server/routers/ --include="*.ts" | head -20

Show me all results with a pass/fail assessment for each.
```

---

## TIMING ESTIMATE

| Prompt | Task | Time |
|--------|------|------|
| 1 | Remove master password | 5 min |
| 2 | Fix compliance Math.random() | 10 min |
| 3 | Fix AI dispatch confidence | 5 min |
| 4 | Fix photo inspection | 5 min |
| 5 | Fix anomaly detection | 5 min |
| 6 | Fix HOS dual-endpoint | 5 min |
| 7 | Fix MobileCommandCenter | 5 min |
| 8 | Remove dashboard mock fallback | 5 min |
| 9 | Fix admin panel stubs | 15 min |
| 10 | Install centralized logger | 15 min |
| 11 | Wire WebSocket emitters | 20 min |
| 12 | Fix MCP server + add tools | 10 min |
| 13 | Remove attribution | 3 min |
| 14 | Database integrity | 10 min |
| 15 | Commit and verify | 5 min |
| **TOTAL** | | **~2 hours** |

---

## PRIORITY ORDER IF SHORT ON TIME

If you can't do all 15, do these FIRST (the stop-ship items):
- Prompts 1-5: Security + Math.random() removal (~30 min)
- Prompt 6: HOS fix (~5 min)
- Prompt 15: Commit (~5 min)

That gives you the most critical fixes in under 45 minutes.

---

*EusoTrip — Eusorone Technologies, Inc. | Austin, Texas*
*Developed by Mike "Diego" Usoro*
