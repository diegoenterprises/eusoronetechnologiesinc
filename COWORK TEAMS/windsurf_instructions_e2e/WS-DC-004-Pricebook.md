# WS-DC-004: Pricebook (Rate Sheets)
## Priority: P1
## Target Roles: BROKER, SHIPPER, ADMIN, CATALYST

## Objective
Implement a flexible pricebook system supporting multiple rate types (per-mile, flat, per-barrel, per-gallon, per-ton) with cascading lookup priority. Enable rate auto-filling on load creation, support CSV import/export, and track rate history with trend analysis.

## Database Schema
```sql
CREATE TABLE pricebook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companyId UUID NOT NULL REFERENCES companies(id),
  entryName VARCHAR(255) NOT NULL,
  originCity VARCHAR(100),
  originState VARCHAR(2),
  originTerminalId UUID REFERENCES facilities(id),
  destinationCity VARCHAR(100),
  destinationState VARCHAR(2),
  destinationTerminalId UUID REFERENCES facilities(id),
  cargoType VARCHAR(100),
  hazmatClass VARCHAR(50),
  rateType VARCHAR(50) NOT NULL,
  rate NUMERIC(12,4) NOT NULL,
  fscIncluded BOOLEAN DEFAULT FALSE,
  fscMethod VARCHAR(50),
  fscValue NUMERIC(10,4),
  minimumCharge NUMERIC(12,2),
  customerCompanyId UUID REFERENCES companies(id),
  effectiveDate DATE NOT NULL,
  expirationDate DATE,
  isActive BOOLEAN DEFAULT TRUE,
  createdBy UUID NOT NULL REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK(rateType IN ('per_mile', 'flat', 'per_barrel', 'per_gallon', 'per_ton')),
  CHECK(expirationDate IS NULL OR expirationDate >= effectiveDate)
);

CREATE TABLE pricebook_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricebookEntryId UUID NOT NULL REFERENCES pricebook_entries(id),
  previousRate NUMERIC(12,4),
  newRate NUMERIC(12,4),
  changedBy UUID NOT NULL REFERENCES users(id),
  changedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricebook_company ON pricebook_entries(companyId);
CREATE INDEX idx_pricebook_origin_terminal ON pricebook_entries(originTerminalId);
CREATE INDEX idx_pricebook_destination_terminal ON pricebook_entries(destinationTerminalId);
CREATE INDEX idx_pricebook_customer ON pricebook_entries(customerCompanyId);
CREATE INDEX idx_pricebook_active ON pricebook_entries(isActive, effectiveDate);
CREATE INDEX idx_pricebook_lookup ON pricebook_entries(companyId, originTerminalId, destinationTerminalId, cargoType, isActive);
```

## Backend Router
**File Path:** `frontend/server/routers/pricebook.ts`

**Procedures:**
- **getEntries(companyId, filters?)**
  - Input: companyId, optional filters { cargoType, hazmatClass, originTerminal, destinationTerminal, customerCompanyId, isActive }
  - Output: [{ id, entryName, originCity, originState, originTerminal, destinationCity, destinationState, destinationTerminal, cargoType, hazmatClass, rateType, rate, fscIncluded, minimumCharge, customerName, effectiveDate, expirationDate, isActive }]
  
- **createEntry(companyId, entry)**
  - Input: entry object with required fields and cascading priority info
  - Output: { id, entryName, status }
  
- **updateEntry(companyId, entryId, updates)**
  - Input: companyId, entryId, updates object
  - Records old rate in history before updating
  - Output: { id, entryName, rate, updatedAt }
  
- **deactivateEntry(companyId, entryId)**
  - Input: companyId, entryId
  - Sets isActive = FALSE, does not delete
  - Output: { id, isActive }
  
- **lookupRate(companyId, originTerminalId?, originCity?, originState?, destinationTerminalId?, destinationCity?, destinationState?, cargoType, customerCompanyId?)**
  - Cascading priority lookup: terminal > city > state
  - Customer-specific > general (non-customer-specific)
  - Input: match criteria
  - Output: { entryId, rate, fscIncluded, fscValue, minimumCharge, rateType } or NULL
  
- **importRates(companyId, csvFile)**
  - Input: CSV file with headers: entryName, originCity, originState, originTerminalId, destinationCity, destinationState, destinationTerminalId, cargoType, hazmatClass, rateType, rate, fscIncluded, fscMethod, fscValue, minimumCharge, customerCompanyId, effectiveDate, expirationDate
  - Output: { importedCount, failedCount, errors: [] }
  
- **exportRates(companyId, filters?)**
  - Input: companyId, optional filters
  - Output: CSV file download
  
- **getRateHistory(companyId, entryId)**
  - Input: companyId, entryId
  - Output: [{ date, previousRate, newRate, changedBy }]

## Frontend Component
**File Path:** `frontend/client/src/pages/pricebook/Pricebook.tsx`

**Layout:**
- Table view with columns: Entry Name, Origin, Destination, Cargo Type, Hazmat Class, Rate Type, Rate, Min Charge, Effective Date, Expiration Date, Customer, Actions
- Inline editing: click cell to edit, save updates immediately
- Search/filter bar: by entry name, cargo type, hazmat class, terminal, customer, active status
- Row context menu: view history, deactivate, delete draft
- Bulk actions: export selected, import CSV
- History modal: shows rate change timeline for selected entry
- CSV import/export buttons at top
- Responsive table on mobile

## Validation Rules
- **Cascading lookup priority:**
  1. Terminal-specific match (exact origin terminal + destination terminal)
  2. City-level match (origin city/state + destination city/state)
  3. State-level match (origin state + destination state)
  4. Within each level, customer-specific rates override general rates
  
- **Auto-fill on load creation:** If load has origin/destination/cargo/customer, query lookupRate and auto-populate rate field
- **Rate must be positive**
- **Expiration date must be future or null**
- **Effective date must be today or past**

## Integration Points
- Existing tables: loads, rates, lane_rates, facilities
- Register procedures in `frontend/server/routers.ts`
- Call lookupRate from load creation form to auto-fill rate
- Store rate lookup source (pricebook entry ID) in loads table
- Fire event when rate is updated for notifications

## Testing Checklist
- [ ] Create pricebook entry with all required fields
- [ ] Update entry rate and verify history records old rate
- [ ] Deactivate entry and verify it's hidden by default
- [ ] Export pricebook to CSV
- [ ] Import rates from CSV and verify count
- [ ] Lookup rate with cascading priority (terminal > city > state)
- [ ] Customer-specific rate overrides general rate
- [ ] Auto-fill rate on load creation with matching origin/destination
- [ ] Filter pricebook entries by cargo type, hazmat, customer
- [ ] View rate history chart for specific entry
- [ ] Inline edit rate and save immediately
- [ ] CSV import shows error count for invalid rows
