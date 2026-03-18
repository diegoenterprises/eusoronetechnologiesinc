# WS-E2E-013: Implement Factoring Payout Flow

**Priority:** P2  
**Estimated Hours:** 16  
**Status:** Not Started

## CONTEXT

The factoring router is a stub with incomplete logic. The factoring role is completely non-functional. This means:
- Factoring companies cannot verify invoices
- No invoice advance calculation
- No factoring fees deducted
- No payouts to factoring companies
- Revenue opportunity is lost

## REQUIREMENTS

1. Create factoring tables in `drizzle/schema.ts`:

   **factoring_transactions table:**
   - `id` (serial, primary key)
   - `loadId` (integer, FK to loads, required)
   - `invoiceId` (integer, FK to invoices, nullable)
   - `factoringCompanyId` (integer, FK to users with role FACTORING, required)
   - `advancePercentage` (decimal 3.2, e.g., 90.5%, required)
   - `invoiceAmount` (decimal 12.2, required)
   - `advanceAmount` (decimal 12.2, required, invoice * advancePercentage)
   - `factoringFee` (decimal 12.2, required, advance * feePercentage)
   - `netAdvance` (decimal 12.2, required, advance - fee)
   - `status` (text: 'PENDING', 'APPROVED', 'FUNDED', 'REPAID', 'DEFAULT', default 'PENDING')
   - `verifiedAt` (timestamp, nullable)
   - `fundedAt` (timestamp, nullable)
   - `repaidAt` (timestamp, nullable)
   - `createdAt` (timestamp with time zone, default now())

   **factoring_advances table:**
   - `id` (serial, primary key)
   - `transactionId` (integer, FK to factoring_transactions)
   - `carrierId` (integer, FK to users)
   - `amount` (decimal 12.2, required)
   - `fundedAt` (timestamp with time zone)
   - `status` (text: 'PENDING', 'SENT', 'RECEIVED', 'DEFAULT')
   - `trackingReference` (text, nullable, ACH/wire reference)
   - `createdAt` (timestamp with time zone, default now())

2. Implement invoice verification endpoint:
   ```typescript
   POST /api/factoring/verify-invoice
   Body: {
     invoiceId: number,
     loadId: number
   }
   ```
   - Check load is DELIVERED
   - Check invoice exists and matches load
   - Verify amount (sum of all load fees)
   - Check for disputes (if any, cannot factor)
   - Return: `{ verified: true, amount: X, recommendedAdvancePercentage: 90 }`

3. Implement advance calculation endpoint:
   ```typescript
   POST /api/factoring/calculate-advance
   Body: {
     invoiceId: number,
     advancePercentage?: number (default 90)
   }
   ```
   - Validate advancePercentage (typically 85-97%)
   - Calculate factoring fee (typically 1-3% of advance)
   - Return: `{ advance: X, fee: Y, netAdvance: Z, monthly_apr: W }`

4. Implement factoring payout request:
   ```typescript
   POST /api/factoring/request-advance
   Body: {
     invoiceId: number,
     advancePercentage: number,
     bankAccountId: number (optional, use default if not provided)
   }
   ```
   - Verify invoice not already factored
   - Create factoring_transactions record with PENDING status
   - Create factoring_advances record
   - Notify factoring company via email/notification
   - Return: `{ transactionId, status: 'PENDING' }`

5. Implement factoring company approval endpoint (internal use):
   ```typescript
   POST /api/factoring/approve/:transactionId
   Headers: Authorization: Bearer <factoringAdminToken>
   ```
   - Verify user is admin of factoring company
   - Check transaction status is PENDING
   - Verify invoice amount matches
   - Update status to APPROVED
   - Create bank transfer (ACH/wire)
   - Update status to FUNDED
   - Send notification to carrier

6. Implement repayment tracking:
   ```typescript
   POST /api/factoring/record-repayment/:transactionId
   Body: {
     repaidAmount: number,
     repaymentMethod: 'ACH' | 'WIRE' | 'CASH' | 'CHECK'
   }
   ```
   - Mark transaction as REPAID
   - Calculate interest (if applicable)
   - Update factoring_advances.status to RECEIVED
   - Send confirmation to factoring company

7. Add collection tracking:
   - Query for factoring_transactions with status FUNDED and repaidAt null
   - If > 30 days, mark as DEFAULT and notify
   - If > 60 days, escalate to collection

8. Add reporting endpoint:
   ```typescript
   GET /api/factoring/company/report
   Query: { startDate?, endDate?, status? }
   ```
   - Return factoring metrics for company:
     - Total volume (invoices factored)
     - Total value (amount advanced)
     - Average advance percentage
     - Collection rate (repaid / total)
     - Current outstanding balance
     - Default rate

## FILES TO MODIFY

- `drizzle/schema.ts` (add factoring_transactions, factoring_advances tables)
- `routers/factoring.ts` (implement all endpoints)
- `services/bankingService.ts` (add ACH/wire creation)
- `services/email.ts` (add factoring notification templates)

## VERIFICATION

1. Create tables:
   ```bash
   npm run db:push
   psql $DATABASE_URL -c "\dt factoring"
   ```

2. Test invoice verification:
   - Complete a load
   - Create invoice for load
   ```bash
   curl -X POST http://localhost:3000/api/factoring/verify-invoice \
     -H "Content-Type: application/json" \
     -d '{"invoiceId": 1, "loadId": 1}'
   ```
   Should return: `{ verified: true, amount: 500, recommendedAdvancePercentage: 90 }`

3. Test advance calculation:
   ```bash
   curl -X POST http://localhost:3000/api/factoring/calculate-advance \
     -H "Content-Type: application/json" \
     -d '{"invoiceId": 1, "advancePercentage": 90}'
   ```
   Should return: `{ advance: 450, fee: 13.5, netAdvance: 436.5, monthly_apr: 18 }`

4. Test advance request:
   ```bash
   curl -X POST http://localhost:3000/api/factoring/request-advance \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"invoiceId": 1, "advancePercentage": 90}'
   ```
   Should return 201 with transactionId

5. Verify transaction created:
   ```bash
   psql $DATABASE_URL -c "SELECT id, status, advanceAmount FROM factoring_transactions LIMIT 1"
   ```

6. Test approval (as factoring admin):
   ```bash
   curl -X POST http://localhost:3000/api/factoring/approve/1 \
     -H "Authorization: Bearer <factoringAdminToken>"
   ```
   Should return: `{ status: 'FUNDED' }`

7. Test repayment recording:
   ```bash
   curl -X POST http://localhost:3000/api/factoring/record-repayment/1 \
     -H "Content-Type: application/json" \
     -d '{"repaidAmount": 450, "repaymentMethod": "ACH"}'
   ```
   Should return: `{ status: 'REPAID' }`

## DO NOT

- Allow factoring without verified invoice
- Allow advance > 97% or < 85% (enforce standard limits)
- Forget to check for disputes before factoring
- Process advance without bank account
- Allow double-factoring (invoice already factored)
- Use hardcoded factoring fees (make configurable)
- Process repayment > original advance amount
- Skip audit logging for all factoring transactions
- Allow factoring companies to approve their own transactions (need separate admin role)

