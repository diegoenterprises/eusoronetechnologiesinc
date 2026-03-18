# WS-DC-002: Allocation Tracker (Barrels/Day)
## Priority: P0
## Target Roles: SHIPPER, TERMINAL_MANAGER, ADMIN

## Objective
Create a daily allocation tracking system that monitors contract fulfillment on a barrel basis. System tracks nominated volumes, loaded volumes, and delivered volumes with automatic status calculations. Support terminal-specific views, trend analysis, and bulk load creation from allocations.

## Database Schema
```sql
CREATE TABLE allocation_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companyId UUID NOT NULL REFERENCES companies(id),
  shipperId UUID NOT NULL REFERENCES companies(id),
  contractName VARCHAR(255) NOT NULL,
  buyerName VARCHAR(255),
  originTerminalId UUID NOT NULL REFERENCES facilities(id),
  destinationTerminalId UUID NOT NULL REFERENCES facilities(id),
  product VARCHAR(100) NOT NULL,
  dailyNominationBbl NUMERIC(10,2) NOT NULL,
  effectiveDate DATE NOT NULL,
  expirationDate DATE NOT NULL,
  ratePerBbl NUMERIC(10,4),
  status VARCHAR(50) DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK(expirationDate >= effectiveDate)
);

CREATE TABLE allocation_daily_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocationContractId UUID NOT NULL REFERENCES allocation_contracts(id),
  trackingDate DATE NOT NULL,
  nominatedBbl NUMERIC(10,2) NOT NULL,
  loadedBbl NUMERIC(10,2) DEFAULT 0,
  deliveredBbl NUMERIC(10,2) DEFAULT 0,
  loadsCreated INT DEFAULT 0,
  loadsCompleted INT DEFAULT 0,
  remainingBbl NUMERIC(10,2) GENERATED ALWAYS AS (nominatedBbl - deliveredBbl) STORED,
  loadsNeeded INT GENERATED ALWAYS AS (CEIL((nominatedBbl - loadedBbl) / 26.0)) STORED,
  status VARCHAR(50) DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(allocationContractId, trackingDate)
);

CREATE INDEX idx_allocation_company ON allocation_contracts(companyId);
CREATE INDEX idx_allocation_shipper ON allocation_contracts(shipperId);
CREATE INDEX idx_allocation_terminal ON allocation_contracts(originTerminalId, destinationTerminalId);
CREATE INDEX idx_tracking_contract_date ON allocation_daily_tracking(allocationContractId, trackingDate);
CREATE INDEX idx_tracking_date ON allocation_daily_tracking(trackingDate);
```

## Backend Router
**File Path:** `frontend/server/routers/allocationTracker.ts`

**Procedures:**
- **getContracts(companyId, filters?)**
  - Input: companyId, optional filters { shipperId, status, terminalsIds }
  - Output: [{ id, contractName, buyerName, dailyNominationBbl, originTerminal, destinationTerminal, product, effectiveDate, expirationDate, ratePerBbl, status }]
  
- **createContract(companyId, contract)**
  - Input: contract object with required fields
  - Output: { id, contractName, status }
  
- **getDailyDashboard(companyId, date?)**
  - Input: companyId, date (defaults to today)
  - Output: { summaryBar: { totalNominated, totalLoaded, totalDelivered, fulfillmentPercent }, contracts: [{ contractId, contractName, nominatedBbl, loadedBbl, deliveredBbl, status, loadsNeeded }] }
  
- **updateTracking(companyId, allocationContractId, trackingDate, loadedBbl?, deliveredBbl?)**
  - Input: companyId, allocationContractId, trackingDate, optional volume updates
  - Auto-called on load create/complete events
  - Updates status: <80% by noon = "behind", >100% = "ahead", else "on_track"
  - Output: { id, nominatedBbl, loadedBbl, deliveredBbl, remainingBbl, status }
  
- **getTerminalView(companyId, terminalId, dateRange?)**
  - Input: companyId, terminalId, optional { startDate, endDate }
  - Output: { terminal, contracts: [], 7dayTrend: [{ date, nominated, loaded, delivered }] }
  
- **getFulfillmentReport(companyId, dateRange)**
  - Input: companyId, { startDate, endDate }
  - Output: { totalNominated, totalDelivered, fulfillmentPercent, contractsByStatus: {} }
  
- **createLoadsFromAllocation(companyId, allocationContractId, trackingDate, count)**
  - Input: companyId, allocationContractId, trackingDate, load count
  - Creates count pre-filled loads with: originTerminalId, destinationTerminalId, product, shipper
  - Output: { createdLoadIds: [], failedCount, errors: [] }

## Frontend Component
**File Path:** `frontend/client/src/pages/allocations/AllocationDashboard.tsx`

**Layout:**
- Summary bar at top: Total Nominated (Bbl), Total Loaded (Bbl), Total Delivered (Bbl), Overall % Fulfillment
- Contract cards grid (2-3 columns on desktop):
  - Contract name, buyer name, daily nomination
  - Progress bar: nominated (blue) vs loaded (green) vs delivered (orange)
  - Status badge: "On Track" / "Behind" / "Ahead"
  - Quick action button: "Create Loads" (opens modal)
  - Click card to expand detail view
  
- Terminal view variant (separate page/tab):
  - Filter by origin/destination terminal
  - 7-day trend chart: bar chart showing nominated vs loaded vs delivered per day
  - Table of contracts for selected terminal
  
- Real-time updates via WebSocket channel `allocations:{companyId}`
- Mobile responsive: single column layout

## Validation Rules
- Link loads to allocations by: origin terminal + product + shipper match
- Update loadedBbl on load pickup confirmation
- Update deliveredBbl on load delivery completion
- Status determination: Fulfillment % = (deliveredBbl / nominatedBbl) * 100
  - < 80% by 12:00 noon = "behind"
  - >= 100% = "ahead"
  - 80-100% = "on_track"
- remainingBbl and loadsNeeded are auto-calculated (26 bbl std per load)

## Integration Points
- Existing tables: loads, facilities, product_profiles, settlements
- Register procedures in `frontend/server/routers.ts`
- Subscribe to load creation events to auto-update allocation tracking
- Subscribe to load completion events to update deliveredBbl
- Fire gamification event on 100% fulfillment achievement
- Link loads to allocation_daily_tracking via origin/product/shipper matching

## Testing Checklist
- [ ] Create allocation contract with valid date range
- [ ] Get daily dashboard with correct aggregations
- [ ] Update tracking volumes and verify status calculation
- [ ] Create loads from allocation and verify pre-fill
- [ ] Get terminal-specific view with 7-day trend
- [ ] Verify remaining Bbl and loads needed calculations
- [ ] WebSocket updates propagate to other users
- [ ] Fulfillment report includes all contracts in date range
- [ ] Status changes from "behind" to "on_track" after update
- [ ] Gamification event fires on 100% fulfillment
