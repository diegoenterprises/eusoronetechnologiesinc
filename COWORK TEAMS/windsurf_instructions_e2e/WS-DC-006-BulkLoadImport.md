# WS-DC-006: Bulk Load Import (CSV)
## Priority: P1
## Target Roles: SHIPPER, DISPATCH, ADMIN, BROKER

## Objective
Implement a robust CSV bulk import system with multi-step validation and error recovery. Support auto-population from product profiles and allocation contract linking. Enable users to validate before importing, edit errors inline, and track import history.

## Database Schema
```sql
CREATE TABLE bulk_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companyId UUID NOT NULL REFERENCES companies(id),
  uploadedBy UUID NOT NULL REFERENCES users(id),
  fileName VARCHAR(255) NOT NULL,
  totalRows INT NOT NULL,
  successCount INT DEFAULT 0,
  failCount INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'uploaded',
  validationErrors JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP,
  CHECK(status IN ('uploaded', 'validating', 'validated', 'importing', 'completed', 'failed'))
);

CREATE TABLE bulk_import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jobId UUID NOT NULL REFERENCES bulk_import_jobs(id) ON DELETE CASCADE,
  rowNumber INT NOT NULL,
  rawData JSON NOT NULL,
  loadId UUID REFERENCES loads(id),
  status VARCHAR(50) DEFAULT 'pending',
  errors JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(jobId, rowNumber),
  CHECK(status IN ('pending', 'valid', 'invalid', 'created', 'failed'))
);

CREATE INDEX idx_import_jobs_company ON bulk_import_jobs(companyId);
CREATE INDEX idx_import_jobs_status ON bulk_import_jobs(status);
CREATE INDEX idx_import_rows_job ON bulk_import_rows(jobId);
CREATE INDEX idx_import_rows_load ON bulk_import_rows(loadId);
```

## Backend Router
**File Path:** `frontend/server/routers/bulkImport.ts`

**Procedures:**
- **uploadCSV(companyId, csvFile, uploadedBy)**
  - Input: companyId, CSV file (multipart), uploadedBy (userId)
  - Parses CSV and creates bulk_import_jobs record
  - Stores raw rows in bulk_import_rows (status='pending')
  - Output: { jobId, fileName, totalRows }
  
- **validateImport(companyId, jobId)**
  - Input: companyId, jobId
  - Validates each row against schema
  - Updates bulk_import_rows status to 'valid' or 'invalid' with error details
  - Updates bulk_import_jobs status to 'validated'
  - Output: { jobId, validRows, invalidRows, errors: { rowNumber: [errorMessages] } }
  
- **executeImport(companyId, jobId)**
  - Input: companyId, jobId
  - Only proceeds if status='validated'
  - Creates loads from valid rows
  - Handles errors gracefully (fails individual rows, not entire batch)
  - Updates bulk_import_rows status to 'created' or 'failed'
  - Updates bulk_import_jobs status to 'completed'
  - Output: { jobId, createdCount, failedCount }
  
- **getImportStatus(companyId, jobId)**
  - Input: companyId, jobId
  - Output: { jobId, fileName, status, totalRows, successCount, failCount, rows: [{ rowNumber, rawData, status, errors, loadId }] }
  
- **getImportHistory(companyId, limit?, offset?)**
  - Input: companyId, optional pagination
  - Output: [{ jobId, fileName, totalRows, successCount, failCount, status, uploadedBy, createdAt, completedAt }]
  
- **downloadTemplate(companyId)**
  - Input: companyId
  - Output: CSV file with header row and example row
  
- **downloadErrors(companyId, jobId)**
  - Input: companyId, jobId
  - Output: CSV file with error rows and error messages
  
- **validateRow(companyId, rawData)**
  - Input: rawData (single row object)
  - Internal helper for validation logic
  - Checks: required fields, data types, facility existence, valid dates, positive numbers, hazmat in known set
  - Auto-populates from productProfile if cargoType matches
  - Output: { isValid, errors: [], populatedData: {} }

## Frontend Component
**File Path:** `frontend/client/src/pages/bulkImport/BulkImport.tsx`

**Layout - 4-Step Flow:**

**Step 1: Upload**
- Drag-and-drop zone or file picker button
- Accepted: .csv files only
- Shows file name, row count preview
- "Next" button disabled until file selected
- Download template link

**Step 2: Validate**
- Row-by-row validation display
- Green checkmark for valid rows, red X for invalid
- Expandable detail view per row showing:
  - Parsed data fields
  - Any errors/warnings (inline edit)
  - Auto-populated fields from product profile (highlighted)
  
- Inline editing:
  - Click invalid cell to edit
  - Dropdown for hazmat class, facility selection
  - Date picker for date fields
  - Recalculates validation on edit
  
- Summary bar: X valid, Y invalid (click to filter)
- "Proceed" button (disabled if errors exist, unless user opts to skip invalid rows)

**Step 3: Confirm & Import**
- Final summary:
  - Total loads to create
  - Estimated volume/weight
  - Cost estimate if rates available
  
- Checkbox: "Link to allocation contracts if match" (auto-links by origin + product)
- Progress bar placeholder for import
- "Import" button → executes import

**Step 4: Results**
- Success summary: X loads created
- Failed rows (if any) with error reasons
- "Download Error Report" button (CSV)
- Link to view created loads
- "Import Another" button → restart flow

## CSV Columns
**Required:**
- pickupLocation (city, state or terminal ID)
- deliveryLocation (city, state or terminal ID)
- pickupDate (YYYY-MM-DD)
- deliveryDate (YYYY-MM-DD)
- cargoType (product name)

**Optional:**
- hazmatClass (UN classification or empty)
- weight (numeric)
- weightUnit (lbs, kg)
- volume (numeric)
- volumeUnit (gal, bbl, m3)
- rate (numeric, auto-filled from pricebook if not provided)
- currency (USD default)
- specialInstructions (text)
- commodityName (product description)
- unNumber (hazmat UN number)
- originTerminalId (UUID, bypasses location lookup)
- destinationTerminalId (UUID, bypasses location lookup)
- driverId (UUID, optional pre-assignment)

## Validation Rules
- **Required fields:** pickupLocation, deliveryLocation, pickupDate, deliveryDate, cargoType
- **Date validation:** pickupDate and deliveryDate must be in future (>= today)
- **Facility validation:** Location must resolve to existing facility (terminal or city/state)
- **Hazmat validation:** hazmatClass must be in known set (if provided) OR unNumber valid in PHMSA database
- **Positive values:** weight, volume, rate must all be >= 0
- **Product profile auto-population:** If cargoType matches product_profiles.name, auto-fill hazmatClass, weight estimate, etc.
- **Allocation linking:** If originTerminalId + product + shipper match allocation_contracts, link load to contract and update allocation tracking
- **No duplicate pickups:** Warn if same location/date appears multiple times

## Integration Points
- Existing tables: loads, product_profiles, allocation_contracts, facilities
- Register procedures in `frontend/server/routers.ts`
- Call pricebook.lookupRate on import for auto-rate-fill
- Call allocation_tracker.updateTracking on load creation from import
- Fire bulk_import event for analytics
- Store created load IDs in bulk_import_rows for tracking

## Testing Checklist
- [ ] Upload valid CSV and verify row count
- [ ] Validate CSV with all valid rows and proceed
- [ ] Validate CSV with mixed valid/invalid rows and show errors
- [ ] Inline edit invalid cell and re-validate
- [ ] Auto-populate hazmat class from product profile
- [ ] Auto-fill rate from pricebook lookup
- [ ] Link load to allocation contract by origin + product
- [ ] Execute import and create loads successfully
- [ ] Download error report for failed rows
- [ ] View import history with status and results
- [ ] Download CSV template
- [ ] Handle edge cases: special characters in data, very large file (1000+ rows)
- [ ] Verify all created loads appear in load list
- [ ] Optional driverId pre-assignment works
