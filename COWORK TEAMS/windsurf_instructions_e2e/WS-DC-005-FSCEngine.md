# WS-DC-005: FSC Engine (Per-Contract Fuel Surcharge)
## Priority: P1
## Target Roles: CATALYST, SHIPPER, BROKER, ADMIN

## Objective
Build a fuel surcharge calculation engine supporting multiple methodologies (CPM, percentage, table-based) with PADD regional pricing integration. Auto-update surcharges weekly from EIA API, enable schedule preview calculations, and integrate surcharge application to settlements and pricebook contracts.

## Database Schema
```sql
CREATE TABLE fsc_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companyId UUID NOT NULL REFERENCES companies(id),
  scheduleName VARCHAR(255) NOT NULL,
  basePrice NUMERIC(10,4),
  method VARCHAR(50) NOT NULL,
  cpmRate NUMERIC(10,4),
  percentageRate NUMERIC(5,2),
  paddRegion VARCHAR(10) NOT NULL,
  fuelType VARCHAR(50) DEFAULT 'diesel',
  updateFrequency VARCHAR(50) DEFAULT 'weekly',
  lastPaddPrice NUMERIC(10,4),
  lastUpdateAt TIMESTAMP,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK(method IN ('cpm', 'percentage', 'table')),
  CHECK(paddRegion IN ('1A', '1B', '1C', '2', '3', '4', '5'))
);

CREATE TABLE fsc_lookup_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduleId UUID NOT NULL REFERENCES fsc_schedules(id) ON DELETE CASCADE,
  fuelPriceMin NUMERIC(10,4) NOT NULL,
  fuelPriceMax NUMERIC(10,4) NOT NULL,
  surchargeAmount NUMERIC(10,4) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(scheduleId, fuelPriceMin, fuelPriceMax)
);

CREATE TABLE fsc_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduleId UUID NOT NULL REFERENCES fsc_schedules(id),
  paddPrice NUMERIC(10,4) NOT NULL,
  calculatedFsc NUMERIC(10,4) NOT NULL,
  appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fsc_schedules_company ON fsc_schedules(companyId);
CREATE INDEX idx_fsc_schedules_active ON fsc_schedules(isActive);
CREATE INDEX idx_fsc_lookup_schedule ON fsc_lookup_table(scheduleId);
CREATE INDEX idx_fsc_history_schedule ON fsc_history(scheduleId, appliedAt);
```

## Backend Router
**File Path:** `frontend/server/routers/fscEngine.ts`

**Procedures:**
- **getSchedules(companyId)**
  - Input: companyId
  - Output: [{ id, scheduleName, method, paddRegion, basePrice, cpmRate, percentageRate, lastPaddPrice, lastUpdateAt, isActive }]
  
- **createSchedule(companyId, schedule)**
  - Input: companyId, schedule object { scheduleName, method, paddRegion, fuelType, updateFrequency, cpmRate?, percentageRate?, tableEntries? }
  - Output: { id, scheduleName, status }
  
- **calculateFSC(companyId, scheduleId, distance?, estimatedCost?)**
  - Input: companyId, scheduleId, optional distance (miles), optional estimatedCost (for percentage method)
  - Fetches current PADD price from hz_fuel_prices table
  - Applies formula based on method:
    - CPM: (distance * cpmRate / 100)
    - Percentage: (estimatedCost * percentageRate / 100)
    - Table: looks up in fsc_lookup_table by PADD price range
  - Never returns negative FSC
  - Output: { fsc, method, paddPrice, basePrice }
  
- **updatePaddPrices(companyId?)**
  - Input: optional companyId (if null, updates all)
  - Called by weekly cron (see Integration Points)
  - Fetches latest PADD prices from EIA API or hz_fuel_prices table
  - Updates lastPaddPrice in fsc_schedules
  - Records in fsc_history
  - Output: { updatedCount, latestPaddPrices: { '1A': price, '2': price, etc. } }
  
- **getSchedulePreview(companyId, scheduleId, parameters)**
  - Input: companyId, scheduleId, parameters { distance?, estimatedCost?, paddPrice? }
  - Calculates FSC with given parameters for preview
  - Returns calculation breakdown
  - Output: { fsc, method, calculations: {}, paddPrice }
  
- **attachToContract(companyId, pricebookEntryId, fscScheduleId)**
  - Input: companyId, pricebookEntryId, fscScheduleId
  - Links FSC schedule to pricebook entry for auto-application
  - Output: { entryId, fscScheduleId }
  
- **getFSCHistory(companyId, scheduleId, dateRange?)**
  - Input: companyId, scheduleId, optional { startDate, endDate }
  - Output: [{ date, paddPrice, calculatedFsc }]

## Frontend Component
**File Path:** `frontend/client/src/pages/fsc/FSCEngine.tsx`

**Layout:**
- Schedule list table: Schedule Name, Method, PADD Region, Base Price, CPM/Percentage Rate, Last PADD Price, Last Update, Actions
- "Create Schedule" button → multi-step wizard:
  - Step 1: Basic info (name, PADD region, fuel type)
  - Step 2: Method selection (CPM / Percentage / Table)
  - Step 3: Rate configuration (input rates or table rows)
  - Step 4: Review and create
  
- Schedule detail modal:
  - Current rates and PADD price
  - Preview calculator: enter distance or cost → shows calculated FSC
  - Historical trend chart (PADD price line + calculated FSC line)
  - Link to pricebook contracts
  
- Integration tab:
  - Show list of pricebook entries using this FSC schedule
  - "Attach to pricebook entry" button with dropdown selector

## Validation Rules
- **PADD region validation:** Must be valid PADD region (1A, 1B, 1C, 2, 3, 4, 5)
- **PADD region to load origin mapping:**
  - Gulf Coast (TX, LA, MS) = PADD 3
  - Midwest (IL, IN, OH, KS, OK, NE, MN) = PADD 2
  - East Coast = PADD 1A/1B/1C
  
- **FSC constraints:**
  - Never negative (min 0)
  - Table lookup: fuel price ranges must not overlap
  - CPM rate and percentage rate must be >= 0
  
- **Auto-apply FSC:** When settlement created from load with pricebook entry, automatically apply linked FSC schedule's calculated amount

## Integration Points
- Existing tables: hz_fuel_prices, pricebook_entries, settlements, loads
- Register procedures in `frontend/server/routers.ts`
- EIA API integration: fetch PADD prices weekly (cron job calls updatePaddPrices)
- Fallback to hz_fuel_prices table if EIA API unavailable
- Auto-apply FSC on settlement creation if pricebook entry has FSC schedule
- Subscribe to pricebook updates to recalculate affected settlements

## Testing Checklist
- [ ] Create FSC schedule with CPM method
- [ ] Create FSC schedule with percentage method
- [ ] Create FSC schedule with table method (3+ rows)
- [ ] Calculate FSC with CPM: distance 500 miles, rate 0.04 = $20 FSC
- [ ] Calculate FSC with percentage: $1000 cost, 2% rate = $20 FSC
- [ ] Calculate FSC with table lookup: PADD price $3.50 in range $3.45-$3.55 = correct surcharge
- [ ] Preview FSC calculator shows breakdown
- [ ] PADD prices update from EIA API weekly
- [ ] Attach FSC schedule to pricebook entry
- [ ] Load using attached pricebook entry auto-gets FSC on settlement
- [ ] FSC history shows price and calculated FSC over time
- [ ] Verify PADD region validation (Gulf = 3, Midwest = 2)
- [ ] FSC never goes negative even if price drops
