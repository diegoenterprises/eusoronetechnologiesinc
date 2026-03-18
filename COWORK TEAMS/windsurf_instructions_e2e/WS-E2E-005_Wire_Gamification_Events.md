# WS-E2E-005: Wire All 19 Missing Gamification Events

**Priority:** P1  
**Estimated Hours:** 8  
**Status:** Not Started

## CONTEXT

The gamification system has 19+ events defined but `fireGamificationEvent()` is only called 4 times in the codebase. This means users complete deliveries, comply with safety rules, and achieve milestones but receive no rewards, points, badges, or recognition. The gamification system is completely non-functional despite being architecturally ready.

## REQUIREMENTS

1. Identify all 19 gamification events in `services/gamificationDispatcher.ts`:
   - load_completed
   - delivery_on_time
   - bid_accepted
   - bid_placed
   - compliance_check_passed
   - rating_received
   - safety_inspection_passed
   - first_load_completed
   - perfect_week
   - referral_success
   - document_verified
   - route_completed
   - hazmat_certified
   - escort_completed
   - terminal_throughput
   - invoice_paid
   - dispute_resolved
   - milestone_reached
   - community_contribution

2. Wire `load_completed` event in `services/loadLifecycle/stateMachine.ts`:
   - In DELIVERED effect, after wallet credit succeeds:
     ```typescript
     await fireGamificationEvent({
       userId: driverId,
       eventType: 'load_completed',
       metadata: { loadId, revenue: settlementResult.netPay, distance: load.distance }
     });
     ```

3. Wire `delivery_on_time` event in `services/loadLifecycle/stateMachine.ts`:
   - In DELIVERED effect, compare actual delivery time vs ETA:
     ```typescript
     const isOnTime = load.actualDeliveryTime <= load.eta;
     if (isOnTime) {
       await fireGamificationEvent({
         userId: driverId,
         eventType: 'delivery_on_time',
         metadata: { loadId, minutesEarly: calculateMinutes(load.eta, load.actualDeliveryTime) }
       });
     }
     ```

4. Wire `bid_accepted` event in `routers/loadBidding.ts`:
   - In acceptBid mutation, after state transition to ASSIGNED:
     ```typescript
     await fireGamificationEvent({
       userId: carrierId,
       eventType: 'bid_accepted',
       metadata: { loadId, bidAmount: bid.bidAmount }
     });
     ```

5. Wire `bid_placed` event in `routers/loadBidding.ts`:
   - In placeBid mutation, after creating bid:
     ```typescript
     await fireGamificationEvent({
       userId: carrierId,
       eventType: 'bid_placed',
       metadata: { loadId, bidAmount, isWinningBid: false }
     });
     ```

6. Wire `compliance_check_passed` event in `routers/compliance.ts`:
   - After compliance verification succeeds:
     ```typescript
     await fireGamificationEvent({
       userId: driverId,
       eventType: 'compliance_check_passed',
       metadata: { checkType, complianceScore }
     });
     ```

7. Wire `rating_received` event in `routers/ratings.ts`:
   - After rating is submitted and persisted:
     ```typescript
     await fireGamificationEvent({
       userId: ratingData.toUserId,
       eventType: 'rating_received',
       metadata: { score: ratingData.score, fromUserId: ratingData.fromUserId, category: ratingData.category }
     });
     ```

8. Wire `safety_inspection_passed` event in `routers/safety.ts`:
   - After safety inspection is marked as passed:
     ```typescript
     await fireGamificationEvent({
       userId: driverId,
       eventType: 'safety_inspection_passed',
       metadata: { inspectionType, score }
     });
     ```

9. Wire `first_load_completed` event in `services/loadLifecycle/stateMachine.ts`:
   - In DELIVERED effect, count completed loads for driver:
     ```typescript
     const completedLoads = await countCompletedLoads(driverId);
     if (completedLoads === 1) {
       await fireGamificationEvent({
         userId: driverId,
         eventType: 'first_load_completed',
         metadata: { loadId }
       });
     }
     ```

10. Wire `perfect_week` event in a scheduled job (e.g., cron job):
    - Create scheduled task that runs weekly (e.g., Monday 00:00 UTC)
    - Query drivers with 5+ loads completed AND all ratings 4.5+ AND 0 safety alerts in past 7 days
    - For each qualifying driver:
      ```typescript
      await fireGamificationEvent({
        userId: driverId,
        eventType: 'perfect_week',
        metadata: { loadsCompleted, averageRating, weekEnding: new Date() }
      });
      ```

11. Wire `referral_success` event in `routers/auth.ts`:
    - In registration endpoint, if user was referred:
      ```typescript
      if (referralCode) {
        const referrer = await findUserByReferralCode(referralCode);
        await fireGamificationEvent({
          userId: referrer.id,
          eventType: 'referral_success',
          metadata: { referredUserId: newUser.id, referralCode }
        });
      }
      ```

12. Wire `document_verified` event in compliance/verification flow:
    - After document verification completes successfully:
      ```typescript
      await fireGamificationEvent({
        userId: driverId,
        eventType: 'document_verified',
        metadata: { documentType, expiryDate }
      });
      ```

13. Wire `route_completed` event in tracking service:
    - When a load's delivery route is fully completed (DELIVERED state):
      ```typescript
      await fireGamificationEvent({
        userId: driverId,
        eventType: 'route_completed',
        metadata: { loadId, routeDistance, routeDuration }
      });
      ```

14. Wire `hazmat_certified` event in compliance/certification flow:
    - When driver completes HAZMAT certification:
      ```typescript
      await fireGamificationEvent({
        userId: driverId,
        eventType: 'hazmat_certified',
        metadata: { certificationDate, expiryDate }
      });
      ```

15. Wire `escort_completed` event in load state machine:
    - For loads with escort requirement, when DELIVERED:
      ```typescript
      if (load.requiresEscort && escortDriver) {
        await fireGamificationEvent({
          userId: escortDriver.id,
          eventType: 'escort_completed',
          metadata: { loadId, escortDuration }
        });
      }
      ```

16. Wire `terminal_throughput` event in terminal operations:
    - When terminal processes N loads in a day (e.g., 20+ loads):
      ```typescript
      const todayLoads = await countLoadsProcessedToday(terminalId);
      if (todayLoads >= 20) {
        await fireGamificationEvent({
          userId: terminalOperator.id,
          eventType: 'terminal_throughput',
          metadata: { loadsProcessed: todayLoads, terminalId }
        });
      }
      ```

17. Wire `invoice_paid` event in payment processing:
    - When invoice is marked as paid:
      ```typescript
      await fireGamificationEvent({
        userId: carrierId,
        eventType: 'invoice_paid',
        metadata: { invoiceId, amount }
      });
      ```

18. Wire `dispute_resolved` event in dispute resolution:
    - When dispute is closed (resolved):
      ```typescript
      await fireGamificationEvent({
        userId: initiatingUserId,
        eventType: 'dispute_resolved',
        metadata: { disputeId, resolution, amount }
      });
      ```

19. Wire `milestone_reached` event in profile/stats endpoint:
    - When user reaches career milestone (e.g., 100 loads, 500 miles, 5 years tenure):
      ```typescript
      const stats = await getUserStats(userId);
      if (stats.totalLoads === 100 || stats.totalMiles === 500) {
        await fireGamificationEvent({
          userId,
          eventType: 'milestone_reached',
          metadata: { milestone: 'loads_100', totalLoads: stats.totalLoads }
        });
      }
      ```

20. Wire `community_contribution` event:
    - When user contributes knowledge (e.g., posts safety tip, reviews hazmat guide):
      ```typescript
      await fireGamificationEvent({
        userId,
        eventType: 'community_contribution',
        metadata: { contributionType, contentId }
      });
      ```

## FILES TO MODIFY

- `services/gamificationDispatcher.ts` (review event definitions)
- `services/loadLifecycle/stateMachine.ts` (add 3 events: load_completed, delivery_on_time, first_load_completed, route_completed, escort_completed)
- `routers/loadBidding.ts` (add 2 events: bid_placed, bid_accepted)
- `routers/compliance.ts` (add 2 events: compliance_check_passed, hazmat_certified, document_verified)
- `routers/ratings.ts` (add 1 event: rating_received)
- `routers/safety.ts` (add 1 event: safety_inspection_passed)
- `routers/auth.ts` (add 1 event: referral_success)
- `routers/payments.ts` or settlement router (add 2 events: invoice_paid, dispute_resolved)
- `services/schedulers.ts` or new cron service (add 1 event: perfect_week)
- `services/tracking.ts` (add 1 event: terminal_throughput)
- `routers/terminal.ts` (add 1 event: terminal_throughput)
- `routers/users.ts` or profile router (add 1 event: milestone_reached, community_contribution)

## VERIFICATION

1. Search codebase for `fireGamificationEvent` calls:
   ```bash
   grep -r "fireGamificationEvent" --include="*.ts" | wc -l
   ```
   Should increase from 4 to 24+ calls

2. For each event type, manually trigger scenario:
   - Load delivery: complete a load
   - Bid placement: place a bid on a load
   - Compliance check: submit compliance documents
   - Rating: rate another user
   - Safety inspection: complete safety inspection

3. Verify events are persisted:
   ```bash
   psql $DATABASE_URL -c "SELECT userId, eventType, createdAt FROM gamification_events ORDER BY createdAt DESC LIMIT 20"
   ```

4. Verify user points increase:
   - Get user before event
   - Trigger event
   - Get user after event
   - Verify points increased

5. Check logs for event firing:
   ```bash
   npm run dev 2>&1 | grep -i "gamification event fired"
   ```

## DO NOT

- Fire gamification events in try/catch blocks without emitting (events should not block business logic)
- Use hardcoded point values in event firing code (lookup from event definition)
- Fire duplicate events (check event log before firing)
- Fire events before state transition is confirmed in DB
- Forget to include metadata (needed for user feedback)
- Fire events for bot/test accounts (check user.isTest before firing)
- Use synchronous event firing that blocks response (make async)

