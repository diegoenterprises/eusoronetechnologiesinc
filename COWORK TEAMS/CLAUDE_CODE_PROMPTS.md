# CLAUDE CODE PROMPT SEQUENCE FOR EUSOTRIP

## How to Use
1. Stop Windsurf first (let it finish current task or pause it)
2. In Terminal: `cd ~/Desktop/eusoronetechnologiesinc && claude`
3. Paste each prompt ONE AT A TIME
4. Wait for Claude Code to finish before pasting the next one
5. Review each change before saying "yes" to commit

---

## PROMPT 1: Remove Master Password (5 min)

```
CRITICAL SECURITY FIX: Remove the hardcoded master password "Esang2027!" from these files:

1. frontend/api-server.js:
   - Line 10: Delete `const MASTER_PASSWORD = "Esang2027!";`
   - Line 114: Delete the console.log that prints the password
   - Line 68: The login handler compares against MASTER_PASSWORD — rewrite it to use bcrypt comparison against the database instead, or if that's too complex, just make it reject all logins with a comment "// TODO: implement proper auth"

2. frontend/serve.py:
   - Line 17: Delete `MASTER_PASSWORD = "Esang2027!"`
   - Line 135: Delete the print statement with the password
   - Rewrite the login handler to not use a hardcoded password

3. docs/CLAUDE_COWORK_TEAM_DELEGATION.md:
   - Line 11: Delete the line that says "Master Password for ALL accounts: Esang2027!"
   - Also rename this file to docs/TEAM_DELEGATION.md

After making changes, search the ENTIRE codebase for "Esang2027" to confirm zero results remain. Show me the search results.
```

---

## PROMPT 2: Fix Compliance Math.random() (10 min)

```
CRITICAL FIX: Replace all Math.random() in compliance checking with real database queries.

File: frontend/server/services/ComplianceRulesAutomation.ts

This file has 5 rule checker functions that all use Math.random() to generate fake violation counts. Replace each:

1. checkHOS() (around line 90): Instead of `Math.floor(Math.random() * 3)` for violations, query the hos_logs table or use the getHOSSummaryWithELD() function from hosEngine.ts to check actual driving hours against 49 CFR 395 limits.

2. checkDVIR() (around line 133): Instead of random missing/uncorrected counts, query the actual DVIR/inspection records from the database.

3. checkCDLMedical() (around line 168): Instead of random expiring/expired counts, query driver_documents or equivalent table for actual certificate expiration dates.

4. checkDrugAlcohol() (around line 203): Query actual compliance testing records.

5. checkInsuranceAuthority() (around line 239): Query actual insurance policy records.

6. The overall score calculation (around line 281) uses `Math.random() - 0.5` — calculate from actual data instead.

If the required database tables don't exist yet, return honest results like { score: 0, findings: [{ description: "No compliance data available — manual review required" }] } — NEVER random numbers.

After changes, run: grep -r "Math.random" frontend/server/services/ComplianceRulesAutomation.ts
Should return 0 results.
```

---

## PROMPT 3: Fix AI Dispatch Confidence (5 min)

```
CRITICAL FIX: Replace Math.random() in AI auto-dispatch and auto-approve with real scoring.

File: frontend/server/routers/esangAI.ts

1. Around line 145, find: `const confidence = Math.random() * 0.3 + 0.7`
   Replace with a rules-based scoring function:

   function calculateDispatchConfidence(load: any, carrier: any): number {
     let score = 0;
     if (carrier.hazmatCertified && load.isHazmat) score += 0.25;
     if (carrier.trailerTypes?.includes(load.trailerType)) score += 0.20;
     if (carrier.safetyRating === 'Satisfactory' || carrier.safetyRating === 'Conditional') score += 0.15;
     if (carrier.insuranceCurrent) score += 0.15;
     if (carrier.completedLoads > 50) score += 0.10;
     if (carrier.onTimeRate > 0.9) score += 0.10;
     if (carrier.oosRate < 0.05) score += 0.05;
     return Math.min(1.0, score);
   }

2. Around line 154-155, find fake reasoning strings with Math.random() — replace with actual data descriptions.

3. Around line 196, find auto-approve confidence with same Math.random() pattern — replace with the same scoring function.

After changes, run: grep -n "Math.random" frontend/server/routers/esangAI.ts
Should return 0 results.
```

---

## PROMPT 4: Fix Photo Inspection (5 min)

```
CRITICAL SAFETY FIX: Replace random dice-roll photo inspection with real analysis.

File: frontend/server/services/PhotoInspectionAI.ts

Around line 94, there's a block that uses Math.random() to randomly assign PASS/FAIL/MARGINAL to vehicle inspections. The photoUrl parameter is completely ignored — no image analysis happens.

Replace the entire random block with one of these approaches:

PREFERRED: If Gemini API key exists (process.env.GEMINI_API_KEY), call Gemini Vision to actually analyze the photo:
- Send the image to Gemini 2.5 Flash with a prompt asking it to evaluate the inspection point
- Parse the response into condition (PASS/MARGINAL/FAIL) and defects list

FALLBACK: If no API key or the call fails, return:
{
  condition: 'MANUAL_REVIEW_REQUIRED',
  confidence: 0,
  defects: [],
  safeToOperate: null,
  note: 'Automated photo analysis unavailable. Manual inspection required by certified inspector.'
}

NEVER return random results for safety-critical vehicle inspections.

Also fix line 130 where confidence is `0.82 + Math.random() * 0.16` — confidence should come from the AI response or be 0 if manual review.

After changes: grep -n "Math.random" frontend/server/services/PhotoInspectionAI.ts should return 0.
```

---

## PROMPT 5: Fix Anomaly Detection (5 min)

```
FIX: Replace Math.random() in anomaly detection with real statistical analysis.

File: frontend/server/services/AnomalyMonitor.ts

This file has 11 instances of Math.random() that gate whether anomalies get reported. A real anomaly detection engine already exists at frontend/server/services/ai/forecastEngine.ts with z-scores, trend analysis, and Holt-Winters forecasting.

1. Import the forecast engine functions at the top of AnomalyMonitor.ts
2. Replace each Math.random() gate with actual database queries and statistical analysis
3. Use the z-score function from forecastEngine to determine if a metric is anomalous

If forecastEngine.ts doesn't exist or isn't importable, replace each Math.random() with a simple threshold check against actual database data. If database queries fail, the anomaly should report "unable to assess" — NOT randomly suppress.

After changes: grep -n "Math.random" frontend/server/services/AnomalyMonitor.ts should return 0.
```

---

## PROMPT 6: Fix HOS Stub (5 min)

```
FIX: The old HOS endpoint still returns fake data.

File: frontend/server/routers/drivers.ts

There are TWO HOS endpoints:
- getHOSStatus (around line 180) — OLD, returns hardcoded "6h 30m" (FAKE)
- getMyHOSStatus (around line 797) — NEW, uses real HOS engine (REAL)

Make getHOSStatus call the same real engine that getMyHOSStatus uses. Import getHOSSummaryWithELD from the hosEngine and use it in the old endpoint. This way any frontend component calling either endpoint gets real data.

Do NOT delete getHOSStatus — just make it use the real engine instead of hardcoded values.
```

---

## PROMPT 7: Fix MobileCommandCenter (5 min)

```
FIX: Replace synthetic data in MobileCommandCenter.

File: frontend/server/services/MobileCommandCenter.ts

Functions generateActiveMission(), generateHOS(), and generateEarnings() all use Math.random() to create fake data. Replace:

- generateActiveMission(): Query the gamification/missions table for the driver's actual active missions
- generateHOS(): Use getHOSSummaryWithELD() from hosEngine.ts for real HOS data
- generateEarnings(): Query wallet_transactions or settlements for actual earnings

If tables/data don't exist, return { status: 'unavailable', message: 'Connect your account to view real data' } — not random numbers.
```

---

## PROMPT 8: Install Logger (10 min)

```
The codebase has ~1,966 console.log/error/warn statements and no centralized logging.

1. Install pino: npm install pino pino-pretty

2. Create frontend/server/services/logger.ts:
   import pino from 'pino';
   export const logger = pino({
     level: process.env.LOG_LEVEL || 'info',
     transport: process.env.NODE_ENV !== 'production'
       ? { target: 'pino-pretty', options: { colorize: true } }
       : undefined,
   });

3. Do a find-and-replace across the server directory:
   - console.log( → logger.info(
   - console.error( → logger.error(
   - console.warn( → logger.warn(

   Add `import { logger } from '../services/logger';` (adjust path) to each modified file.

4. For frontend .tsx files, leave console statements alone (those run in browser, not server).

Focus on the server/ directory first. This is a big change so do it methodically.
```

---

## PROMPT 9: Remove Claude Attribution (3 min)

```
Remove remaining AI tool attribution from the codebase:

1. If docs/CLAUDE_COWORK_TEAM_DELEGATION.md still exists (should have been renamed in Prompt 1), rename to docs/TEAM_DELEGATION.md and remove any "Generated by Claude" text.

2. frontend/server/_core/index.ts around line 1026: Remove any "Claude Cowork" reference. Replace with "EusoTrip Internal Service".

3. frontend/server/services/mcpServer.ts lines 2-3: Change "MCP SERVER — Model Context Protocol for Claude Cowork" to "EusoTrip Service Protocol — Eusorone Technologies, Inc."

4. Search entire codebase for "claude" (case insensitive) and "windsurf" — remove any references that attribute code authorship to AI tools. KEEP references to Claude/AI as product features (ESANG AI is fine).

Show me search results after cleanup.
```

---

## PROMPT 10: Commit Everything (2 min)

```
Show me a git status and git diff summary of all changes. Then commit with this message:

"security: remove hardcoded credentials, replace all Math.random() in business logic, add centralized logger, fix HOS/compliance/inspection/anomaly detection, remove AI attribution

- Removed Esang2027! master password from api-server.js, serve.py, docs
- Replaced Math.random() in ComplianceRulesAutomation (5 functions)
- Replaced Math.random() in AI dispatch confidence (esangAI.ts)
- Replaced Math.random() in PhotoInspectionAI (safety-critical)
- Replaced Math.random() in AnomalyMonitor (11 instances)
- Replaced Math.random() in MobileCommandCenter (3 functions)
- Fixed getHOSStatus to use real HOS engine instead of hardcoded data
- Installed pino logger, replaced console.* across server
- Removed Claude/Windsurf attribution references

EusoTrip — Eusorone Technologies, Inc."
```

---

## AFTER ALL PROMPTS: Verification

```
Run these verification searches and show me the results:

1. grep -r "Esang2027" . --include="*.js" --include="*.py" --include="*.md" --include="*.ts"
2. grep -r "Math.random" frontend/server/services/ComplianceRulesAutomation.ts
3. grep -r "Math.random" frontend/server/routers/esangAI.ts
4. grep -r "Math.random" frontend/server/services/PhotoInspectionAI.ts
5. grep -r "Math.random" frontend/server/services/AnomalyMonitor.ts
6. grep -r "Math.random" frontend/server/services/MobileCommandCenter.ts
7. grep -ri "claude" frontend/server/ --include="*.ts" | grep -v node_modules
8. grep -c "console.log\|console.error\|console.warn" frontend/server/**/*.ts

All should return 0 or near-0 results.
```
