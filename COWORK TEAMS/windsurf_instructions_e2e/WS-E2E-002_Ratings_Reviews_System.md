# WS-E2E-002: Build Ratings and Reviews System

**Priority:** P0  
**Estimated Hours:** 8  
**Status:** Not Started

## CONTEXT

The file `ratings.ts` (175 lines) currently returns hardcoded mock data. There are no `ratings` or `reviews` tables in the database schema. This means:
- Users cannot actually leave ratings for each other
- No reputation/rating data persists
- Ratings cannot influence carrier/driver matching or recommendations
- No feedback mechanism exists for service quality

The ratings system is critical for trust and quality assurance in the freight platform.

## REQUIREMENTS

1. Create the `ratings` table in `drizzle/schema.ts` with columns:
   - `id` (serial, primary key)
   - `fromUserId` (integer, foreign key to users, required)
   - `toUserId` (integer, foreign key to users, required)
   - `loadId` (integer, foreign key to loads, nullable)
   - `score` (integer, 1-5, required)
   - `category` (text: 'on_time', 'communication', 'condition', 'professionalism', required)
   - `comment` (text, nullable, max 500 chars)
   - `createdAt` (timestamp with time zone, default now())
   - `updatedAt` (timestamp with time zone, default now())

2. Create the `reviews` table with columns:
   - `id` (serial, primary key)
   - `ratingId` (integer, foreign key to ratings, required)
   - `response` (text, nullable, max 500 chars)
   - `respondentId` (integer, foreign key to users, required)
   - `createdAt` (timestamp with time zone, default now())
   - `updatedAt` (timestamp with time zone, default now())

3. Add indexes:
   - `ratings`: (toUserId, createdAt), (fromUserId, createdAt), (loadId)
   - `reviews`: (ratingId), (respondentId)

4. Run migrations to create tables

5. Replace mock CRUD in `routers/ratings.ts`:
   - `POST /api/ratings` endpoint: validate score (1-5), category, load completion; insert into DB
   - `GET /api/users/:userId/ratings` endpoint: aggregate ratings by category; calculate average score
   - `GET /api/ratings/:ratingId/reputation` endpoint: return reputation metrics (avg score, category breakdown)

6. Add post-delivery rating prompt:
   - In `loadLifecycle/stateMachine.ts` DELIVERED effect, emit WebSocket event `prompt_rating` with load details
   - Frontend should show modal asking for rating 5-10 seconds after delivery confirmation

7. Calculate reputation scores:
   - Create utility function `calculateReputation(userId)` that:
     - Averages all ratings for the user
     - Weights by recency (last 30 days = 2x weight)
     - Calculates category scores separately
     - Returns: overall score, breakdown by category, count of ratings
   - Cache in `users.reputationScore` column (decimal 3.2)

8. Add reputation display to carrier/driver profiles:
   - In profile query response, include: `{ reputationScore, ratingCount, categoryBreakdown }`

9. Ensure ratings can only be created by users involved in the load (shipper or driver)

## FILES TO MODIFY

- `drizzle/schema.ts` (add ratings and reviews tables, add reputationScore column to users)
- `routers/ratings.ts` (replace mock data with DB queries)
- `services/loadLifecycle/stateMachine.ts` (add rating prompt event on DELIVERED)
- `services/reputation.ts` (new file, create reputation calculation utilities)

## VERIFICATION

1. Run migrations and verify tables exist:
   ```bash
   npm run db:push
   psql $DATABASE_URL -c "\dt" | grep -E 'ratings|reviews'
   ```

2. Test POST /api/ratings endpoint with valid load:
   ```bash
   curl -X POST http://localhost:3000/api/ratings \
     -H "Content-Type: application/json" \
     -d '{"toUserId": 2, "loadId": 1, "score": 5, "category": "on_time", "comment": "Great job"}'
   ```
   Should return 201 with created rating

3. Test GET /api/users/:userId/ratings:
   ```bash
   curl http://localhost:3000/api/users/2/ratings
   ```
   Should return aggregated ratings for user 2

4. Verify reputation score updates on new rating:
   - Create 5 ratings for a user
   - Fetch user profile
   - Verify `reputationScore` field is populated and between 1-5

5. Verify rating prompt fires on delivery:
   - Complete a load to DELIVERED state
   - Check WebSocket logs for `prompt_rating` event

## DO NOT

- Allow users to rate themselves
- Allow users to rate the same entity multiple times (use unique constraint on fromUserId + toUserId + loadId)
- Use hardcoded mock data — all responses must query the database
- Forget to validate score is 1-5 on input
- Leave comments unvalidated for length (enforce max 500 chars)
- Calculate reputation synchronously in every request (cache and update async or on-demand)
- Expose toUserId in response without checking user permissions (only return rating if user is involved)

