# WS-E2E-006: Start Gamification Schedulers at Boot

**Priority:** P1  
**Estimated Hours:** 2  
**Status:** Not Started

## CONTEXT

The functions `startGamificationSync()` and `startMissionScheduler()` exist in the codebase but are NEVER called when the server starts. This means:
- Gamification data is never synchronized from external sources
- Missions are never evaluated or awarded
- Daily/weekly challenges never trigger
- User progression never updates
- The entire scheduler infrastructure is dead code

## REQUIREMENTS

1. Locate where the server starts in `_core/index.ts`:
   - Find the `server.listen()` or equivalent startup code
   - Identify where other initialization happens (DB connection, caching, etc.)

2. After `server.listen()` successfully completes (or in callback), add:
   ```typescript
   // Initialize gamification schedulers
   try {
     console.log('[GAMIFICATION] Starting gamification sync...');
     startGamificationSync();
     console.log('[GAMIFICATION] Gamification sync started');
   } catch (err) {
     console.error('[GAMIFICATION] Failed to start gamification sync:', err);
   }

   try {
     console.log('[GAMIFICATION] Starting mission scheduler...');
     startMissionScheduler();
     console.log('[GAMIFICATION] Mission scheduler started');
   } catch (err) {
     console.error('[GAMIFICATION] Failed to start mission scheduler:', err);
   }
   ```

3. Add `ensureGamificationProfile()` to auth middleware:
   - In `middleware/auth.ts` or `routers/auth.ts` (wherever auth middleware is defined)
   - After user is authenticated but before next handler:
     ```typescript
     // Ensure user has a gamification profile
     if (user && !user.gamificationProfileInitialized) {
       try {
         await ensureGamificationProfile(user.id);
       } catch (err) {
         console.warn('[GAMIFICATION] Failed to initialize profile for user:', user.id, err);
       }
     }
     ```

4. Create `ensureGamificationProfile()` function if not present:
   - Should check if user has gamification_users record
   - Create if missing with default values:
     - `userId` (FK to users)
     - `points` (default 0)
     - `level` (default 1)
     - `currentMission` (nullable)
     - `createdAt` (default now())
     - `updatedAt` (default now())
   - Return without error if already exists

5. Verify imports in `_core/index.ts`:
   - Import `startGamificationSync` from appropriate service
   - Import `startMissionScheduler` from appropriate service

6. Add environment variable for scheduler control (optional but recommended):
   - `ENABLE_GAMIFICATION_SCHEDULERS=true` (default true in prod)
   - Check before starting:
     ```typescript
     if (process.env.ENABLE_GAMIFICATION_SCHEDULERS !== 'false') {
       startGamificationSync();
       startMissionScheduler();
     }
     ```

7. Ensure schedulers are singleton (only start once):
   - Add guard variable to prevent double-start
   - In each scheduler function:
     ```typescript
     if (gamificationSyncStarted) return;
     gamificationSyncStarted = true;
     ```

## FILES TO MODIFY

- `_core/index.ts` (add scheduler startup code)
- `middleware/auth.ts` or `routers/auth.ts` (add ensureGamificationProfile call)
- `services/gamificationDispatcher.ts` (ensure ensureGamificationProfile is exported)

## VERIFICATION

1. Start the server:
   ```bash
   npm run dev 2>&1 | grep -i GAMIFICATION
   ```
   Should see output:
   ```
   [GAMIFICATION] Starting gamification sync...
   [GAMIFICATION] Gamification sync started
   [GAMIFICATION] Starting mission scheduler...
   [GAMIFICATION] Mission scheduler started
   ```

2. Verify schedulers are running:
   - Check server logs show no errors
   - Monitor process for 30 seconds to ensure no crashes

3. Test gamification profile initialization:
   - Create new user account via registration
   - Check database for gamification_users record:
     ```bash
     psql $DATABASE_URL -c "SELECT userId, points, level FROM gamification_users WHERE userId = <newUserId>"
     ```
   - Should return a row with points=0, level=1

4. Test auth middleware integration:
   - Authenticate as existing user (no gamification profile)
   - Verify profile is created automatically

5. Verify scheduler functions are called:
   - Add console.log at start of startGamificationSync() and startMissionScheduler()
   - Restart server
   - Verify logs appear within 10 seconds

## DO NOT

- Start schedulers before database connection is ready
- Start schedulers before authentication middleware is loaded
- Forget to add error handling (schedulers should not crash server)
- Start schedulers synchronously in critical path (make async)
- Forget to add guard to prevent double-initialization
- Leave console.logs in place after verification (replace with logger calls)
- Start schedulers if ENABLE_GAMIFICATION_SCHEDULERS is explicitly false
- Call ensureGamificationProfile on every request (cache or use onetime flag)

