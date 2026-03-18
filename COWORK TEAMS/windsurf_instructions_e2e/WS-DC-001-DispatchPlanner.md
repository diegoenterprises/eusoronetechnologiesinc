# WS-DC-001: Dispatch Planner (Drag-and-Drop)
## Priority: P0
## Target Roles: DISPATCH, CATALYST, ADMIN

## Objective
Build a real-time dispatch planning interface with drag-and-drop load assignment to driver timelines. The system must validate Health & Safety (HOS), hazmat endorsements, equipment compatibility, and proximity constraints before assignment. Support WebSocket-based real-time updates and gamification events on successful assignments.

## Database Schema
```sql
CREATE TABLE dispatch_planner_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companyId UUID NOT NULL REFERENCES companies(id),
  date DATE NOT NULL,
  driverId UUID NOT NULL REFERENCES drivers(id),
  slotIndex INT NOT NULL,
  loadId UUID REFERENCES loads(id),
  status VARCHAR(50) DEFAULT 'available',
  assignedAt TIMESTAMP,
  assignedBy UUID REFERENCES users(id),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(companyId, date, driverId, slotIndex),
  CHECK(status IN ('available', 'assigned', 'completed', 'cancelled'))
);

CREATE INDEX idx_dispatch_planner_company_date ON dispatch_planner_slots(companyId, date);
CREATE INDEX idx_dispatch_planner_driver ON dispatch_planner_slots(driverId, date);
CREATE INDEX idx_dispatch_planner_load ON dispatch_planner_slots(loadId);
```

## Backend Router
**File Path:** `frontend/server/routers/dispatchPlanner.ts`

**Procedures:**
- **getBoard(companyId, date)** 
  - Input: companyId (UUID), date (YYYY-MM-DD)
  - Output: { drivers: [{ driverId, driverName, hosRemaining, slots: [{ slotIndex, loadId, assignedAt }] }], unassignedLoads: [{ loadId, pickupLocation, deliveryLocation, hazmat, equipment, estimatedHours }] }
  
- **assignLoad(companyId, driverId, date, slotIndex, loadId)**
  - Input: companyId, driverId, date, slotIndex, loadId
  - Validations: HOS >= estimated trip duration, hazmat endorsement match, equipment match, no conflicting loads
  - Output: { success, slot, error }
  - Fire gamification event: "load_assigned"
  
- **unassignLoad(companyId, slotId)**
  - Input: companyId, slotId
  - Output: { success, load, error }
  
- **swapDrivers(companyId, slotId1, slotId2)**
  - Input: companyId, slotId1, slotId2
  - Validations: Both loads fit both drivers
  - Output: { success, slots, error }
  
- **bulkAssign(companyId, date, assignments[])**
  - Input: assignments = [{ driverId, slotIndex, loadId }]
  - Output: { successful: [], failed: [{ loadId, error }] }
  
- **getDriverAvailability(companyId, date, driverId)**
  - Input: companyId, date, driverId
  - Output: { hosRemaining, equipmentAvailable: [], hazmatEndorsements: [], conflictingLoads: [] }
  
- **autoSuggest(companyId, loadId)**
  - Input: companyId, loadId (uses ESANG AI)
  - Output: { suggestedDrivers: [{ driverId, driverName, score, matchReasons: [] }] }

## Frontend Component
**File Path:** `frontend/client/src/pages/dispatch/DispatchPlanner.tsx`

**Layout:**
- Full-screen board layout
- LEFT PANEL (40% width): 
  - "Unassigned Loads" section with filterable list
  - Filters: hazmat, equipment type, weight range, pickup location
  - Drag-enabled load cards showing pickup/delivery, cargo type, special requirements
  
- RIGHT PANEL (60% width):
  - Driver timeline rows (one driver per row)
  - Each row shows HOS bar (green = available, yellow = caution, red = unavailable)
  - Slot containers within each driver row for drop target
  - Load cards appear in slots with time indicators
  - Driver info: name, vehicle ID, current HOS hours
  
- Interactions:
  - Drag load card from left panel onto driver slot in right panel
  - Visual feedback during drag (highlight compatible drivers)
  - Right-click context menu: unassign, swap, auto-suggest
  - Real-time updates via WebSocket channel `dispatch:{companyId}`
  
- Mobile Responsive: Stack panels vertically on mobile, reduce slot visibility

## Validation Rules
- **HOS Validation:** Available hours >= estimated trip duration
- **Hazmat Endorsement:** Driver must have required endorsement class
- **Equipment Match:** Required equipment in driver vehicle inventory
- **Proximity Check:** Pickup location within acceptable distance from driver current location
- **Conflict Detection:** No overlapping load times for same driver

## Integration Points
- Existing tables: dispatch_queue, dispatch_templates, drivers, loads, gps_tracking, hos
- Register procedures in `frontend/server/routers.ts`
- Fire gamification event via dispatch event emitter on successful assignment
- Subscribe to WebSocket channel for real-time board updates
- Pull driver GPS from gps_tracking for proximity calculations

## Testing Checklist
- [ ] Drag and drop load to compatible driver
- [ ] Prevent drag to incompatible driver (HOS, hazmat, equipment)
- [ ] Swap drivers with matching constraints
- [ ] Bulk assign multiple loads
- [ ] WebSocket updates appear on board for other users
- [ ] Auto-suggest provides ranked suggestions
- [ ] Unassign removes load from driver slot
- [ ] Mobile responsive layout functions
- [ ] Real-time HOS bar updates
- [ ] Gamification event fires on successful assignment
