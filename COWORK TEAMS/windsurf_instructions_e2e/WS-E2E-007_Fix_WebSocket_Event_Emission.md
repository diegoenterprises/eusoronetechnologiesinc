# WS-E2E-007: Fix WebSocket Event Emission

**Priority:** P1  
**Estimated Hours:** 8  
**Status:** Not Started

## CONTEXT

State transitions in `dispatch.ts` and `loadBidding.ts` complete successfully but never emit WebSocket events. This means:
- Users don't get real-time notifications of load status changes
- Bid updates aren't visible to interested parties until page refresh
- Dispatch assignments don't notify drivers in real-time
- Delivery confirmations don't broadcast to shipper
- The real-time infrastructure exists but is never used

This severely impacts user experience and perceived responsiveness.

## REQUIREMENTS

1. Import WebSocket service in `routers/dispatch.ts`:
   ```typescript
   import { websocket } from '../services/websocket';
   ```

2. After each mutation in dispatch.ts that changes load state, emit event:

   **After load is assigned to driver:**
   ```typescript
   await websocket.emit({
     event: 'driver_assigned',
     loadId,
     data: {
       driverId,
       driverName,
       driverPhone,
       estimatedPickup,
       estimatedDelivery
     },
     targetUsers: [shipperId, driverId], // Notify both parties
   });
   ```

   **After load status changes in dispatch:**
   ```typescript
   await websocket.emit({
     event: 'load_status_changed',
     loadId,
     data: {
       newStatus,
       oldStatus,
       changedBy,
       timestamp
     },
     targetUsers: [shipperId, ...involvedDriverIds],
   });
   ```

3. Import WebSocket service in `routers/loadBidding.ts`:
   ```typescript
   import { websocket } from '../services/websocket';
   ```

4. After bid placed mutation in loadBidding.ts:
   ```typescript
   await websocket.emit({
     event: 'bid_placed',
     loadId,
     data: {
       bidId,
       carrierId,
       carrierName,
       bidAmount,
       bidderLocation,
       estimatedPickup
     },
     targetUsers: [shipperId, ...otherBiddersIds], // Shipper sees new bid, competitors see bid count
   });
   ```

5. After bid accepted mutation:
   ```typescript
   await websocket.emit({
     event: 'bid_accepted',
     loadId,
     data: {
       bidId,
       winnerId,
       winnerName,
       winningAmount,
       rejectedBidCount
     },
     targetUsers: [shipperId, winnerId, ...otherBidderIds], // All parties notified
   });
   ```

6. After bid rejected mutation:
   ```typescript
   await websocket.emit({
     event: 'bid_rejected',
     loadId,
     data: {
       bidId,
       carrierId,
       reason
     },
     targetUsers: [carrierId], // Notify rejected bidder
   });
   ```

7. In stateMachine.ts, after delivery confirmation:
   ```typescript
   await websocket.emit({
     event: 'delivery_confirmed',
     loadId,
     data: {
       deliveryTime,
       condition,
       signedBy,
       proofUrl
     },
     targetUsers: [shipperId, driverId, carrierId],
   });
   ```

8. In stateMachine.ts, after load cancelled:
   ```typescript
   await websocket.emit({
     event: 'load_cancelled',
     loadId,
     data: {
       cancelReason,
       cancelledBy,
       refundAmount
     },
     targetUsers: [shipperId, assignedDriverId, ...allBiddersIds],
   });
   ```

9. Error handling for WebSocket emission:
   - Wrap in try/catch to prevent state transitions from failing if WS emit fails
   - Log error but continue
   - Add retry logic for critical events (delivery_confirmed, bid_accepted)

10. Event payload validation:
    - All events should include: eventType, loadId, data, timestamp, targetUsers
    - Validate required fields before emission
    - Use TypeScript interfaces for type safety

## FILES TO MODIFY

- `routers/dispatch.ts` (add 2 events: driver_assigned, load_status_changed)
- `routers/loadBidding.ts` (add 4 events: bid_placed, bid_accepted, bid_rejected, potentially more)
- `services/loadLifecycle/stateMachine.ts` (add 2 events: delivery_confirmed, load_cancelled)
- `services/websocket.ts` (review and ensure emit() function handles targetUsers correctly)

## VERIFICATION

1. Test driver assignment event:
   - Create load
   - Assign driver via dispatch
   - Check WebSocket logs for `driver_assigned` event
   - Verify both shipper and driver are in targetUsers

2. Test bid placement event:
   - Create load
   - Place bid as carrier
   - Check WebSocket logs for `bid_placed` event
   - Verify event includes correct bid details

3. Test bid acceptance event:
   - Have shipper accept bid
   - Check WebSocket logs for `bid_accepted` event
   - Verify all parties notified

4. Test delivery confirmation event:
   - Complete load to DELIVERED state
   - Check WebSocket logs for `delivery_confirmed` event
   - Verify shipper and driver both notified

5. Monitor for WebSocket connection:
   ```bash
   npm run dev 2>&1 | grep -i "websocket\|emit\|event"
   ```

6. Verify no event emission blocks state transition:
   - Force WebSocket to fail
   - Verify state transition still completes

## DO NOT

- Fire WebSocket events before database state is committed
- Forget to wrap emit() in try/catch (should not block state change)
- Send events to unauthorized users (validate targetUsers list)
- Include sensitive data in event payloads (never send passwords, tokens)
- Use synchronous event emission in critical path (make async/non-blocking)
- Emit duplicate events for same state change
- Forget to include timestamp in event payload
- Send full user objects in events (include only necessary fields: id, name, role)
- Emit events without loadId (needed for client-side subscription)

