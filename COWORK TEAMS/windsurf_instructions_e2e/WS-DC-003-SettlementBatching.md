# WS-DC-003: 3-Level Settlement Batching
## Priority: P0
## Target Roles: CATALYST, SHIPPER, DRIVER, ADMIN, BROKER

## Objective
Implement a multi-level settlement batching system supporting shipper payables, carrier receivables, and driver payables. Batches group completed loads with auto-calculated financial summaries (base charges, FSC, accessorials, deductions). Support batch approval workflow, payment processing via Stripe, and dispute integration.

## Database Schema
```sql
CREATE TABLE settlement_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batchNumber VARCHAR(50) UNIQUE NOT NULL,
  companyId UUID NOT NULL REFERENCES companies(id),
  batchType VARCHAR(50) NOT NULL,
  periodStart DATE NOT NULL,
  periodEnd DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  totalLoads INT DEFAULT 0,
  subtotalAmount NUMERIC(12,2) DEFAULT 0,
  fscAmount NUMERIC(12,2) DEFAULT 0,
  accessorialAmount NUMERIC(12,2) DEFAULT 0,
  deductionAmount NUMERIC(12,2) DEFAULT 0,
  totalAmount NUMERIC(12,2) DEFAULT 0,
  approvedBy UUID REFERENCES users(id),
  approvedAt TIMESTAMP,
  paidAt TIMESTAMP,
  stripePaymentId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK(batchType IN ('shipper_payable', 'carrier_receivable', 'driver_payable')),
  CHECK(status IN ('draft', 'pending_approval', 'approved', 'processing', 'paid', 'failed', 'disputed'))
);

CREATE TABLE settlement_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batchId UUID NOT NULL REFERENCES settlement_batches(id) ON DELETE CASCADE,
  settlementId UUID NOT NULL REFERENCES settlements(id),
  loadId UUID NOT NULL REFERENCES loads(id),
  loadNumber VARCHAR(50),
  pickupDate DATE,
  deliveryDate DATE,
  lineAmount NUMERIC(12,2) NOT NULL,
  fscAmount NUMERIC(12,2) DEFAULT 0,
  accessorialAmount NUMERIC(12,2) DEFAULT 0,
  deductions NUMERIC(12,2) DEFAULT 0,
  netAmount NUMERIC(12,2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(batchId, settlementId),
  CHECK(netAmount = lineAmount + fscAmount + accessorialAmount - deductions)
);

CREATE INDEX idx_batches_company ON settlement_batches(companyId);
CREATE INDEX idx_batches_status ON settlement_batches(status);
CREATE INDEX idx_batches_period ON settlement_batches(periodStart, periodEnd);
CREATE INDEX idx_batch_items_batch ON settlement_batch_items(batchId);
CREATE INDEX idx_batch_items_settlement ON settlement_batch_items(settlementId);
```

## Backend Router
**File Path:** `frontend/server/routers/settlementBatching.ts`

**Procedures:**
- **createBatch(companyId, batchType, periodStart, periodEnd, loadIds[])**
  - Input: companyId, batchType, periodStart, periodEnd, array of loadIds to include
  - Validations: Prevent double-batching (settlement in only one batch)
  - Auto-calc: subtotalAmount, fscAmount, accessorialAmount, deductionAmount, totalAmount
  - Output: { batchNumber, batchId, totalLoads, totalAmount, status }
  
- **getBatches(companyId, filters?)**
  - Input: companyId, optional filters { status, batchType, dateRange }
  - Output: [{ batchNumber, batchId, batchType, periodStart, periodEnd, totalLoads, totalAmount, status, approvedBy, paidAt }]
  
- **getBatchDetail(companyId, batchId)**
  - Input: companyId, batchId
  - Output: { batch, items: [{ settlementId, loadId, loadNumber, pickupDate, deliveryDate, lineAmount, fscAmount, accessorialAmount, deductions, netAmount }], totals }
  
- **approveBatch(companyId, batchId, approvedBy)**
  - Input: companyId, batchId, approvedBy (userId)
  - Updates status to "approved", sets approvedBy, approvedAt
  - Output: { batchId, status, approvedAt }
  
- **processBatchPayment(companyId, batchId, paymentMethod)**
  - Input: companyId, batchId, paymentMethod (stripe_token or account_id)
  - Calls Stripe API to process totalAmount payment
  - Updates status to "paid", sets stripePaymentId, paidAt
  - Output: { batchId, status, paidAt, transactionId }
  
- **addToBatch(companyId, batchId, settlementId)**
  - Input: companyId, batchId, settlementId
  - Validation: Settlement not already in another batch
  - Recalculates batch totals
  - Output: { batchId, totalLoads, totalAmount }
  
- **removeFromBatch(companyId, batchId, settlementId)**
  - Input: companyId, batchId, settlementId
  - Recalculates batch totals
  - Output: { batchId, totalLoads, totalAmount }
  
- **getDriverBatchView(companyId, driverId)**
  - Input: companyId, driverId
  - Returns driver_payable batches for this driver (under Earnings page)
  - Output: [{ batchNumber, periodStart, periodEnd, totalAmount, status, paidAt }]
  
- **generateBatchPDF(companyId, batchId)**
  - Input: companyId, batchId
  - Output: PDF file URL or binary
  
- **autoBatch(companyId)**
  - Input: companyId (called by weekly cron)
  - Automatically creates batches for all completed settlements from past week
  - Output: { batchesCreated, totalLoads, totalAmount }

## Frontend Component
**File Path:** `frontend/client/src/pages/settlements/SettlementBatching.tsx`

**Layout:**
- Batch list table: columns = Batch #, Type, Period, Loads, Amount, Status, Actions
- Status badges with colors: draft (gray), pending_approval (yellow), approved (green), paid (blue)
- "Create Batch" button → modal with date range picker and load selector
- Row expandable to show batch items table with load details
- Approve workflow: "Approve" button → confirmation dialog → status updates to "approved"
- Payment flow: "Process Payment" button → payment method selector → submit → status updates

**Driver view variant** (in Earnings section):
- Shows driver_payable batches only
- Display: batch period, amount earned, payment status, paid date
- View detail link to see load breakdown

**Dispute integration:**
- Link to existing dispute system from batch/item
- Show disputed items with indicator

## Validation Rules
- **Double-batching prevention:** Query settlements table to ensure settlementId only in one batch
- **Total calculation:** totalAmount = SUM(lineAmount + fscAmount + accessorialAmount - deductions) for all items
- **Item validation:** netAmount = lineAmount + fscAmount + accessorialAmount - deductions
- **Status flow:** draft → pending_approval → approved → processing → paid (or failed)
- **Batch type determination:** Set based on company role (shipper → payable, carrier → receivable, driver → payable)

## Integration Points
- Existing tables: settlements, wallet_transactions, loads
- Register procedures in `frontend/server/routers.ts`
- Stripe integration for payment processing
- Dispute system integration for flagged items
- Fire gamification event on batch payment completion
- Link settlements to batches to prevent double-settlement

## Testing Checklist
- [ ] Create batch with date range and load list
- [ ] Verify total amounts auto-calculate correctly
- [ ] Prevent adding settlement already in another batch
- [ ] Get batch detail with expanded load items
- [ ] Approve batch and verify status change
- [ ] Process Stripe payment and verify transactionId
- [ ] Generate batch PDF successfully
- [ ] Remove item from batch and recalculate totals
- [ ] Driver view shows only driver_payable batches
- [ ] Auto-batch cron creates weekly batches for completed settlements
- [ ] Dispute flag displays on disputed items
- [ ] Multiple users see batch updates via WebSocket
