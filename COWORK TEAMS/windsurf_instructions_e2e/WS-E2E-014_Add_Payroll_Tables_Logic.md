# WS-E2E-014: Add Payroll Tables and Logic

**Priority:** P2  
**Estimated Hours:** 20  
**Status:** Not Started

## CONTEXT

There are no `time_off` or `tax_documents` tables. Payroll logic is incomplete. This means:
- Employees cannot request time off
- No approvals or tracking for PTO/sick leave
- Tax documents (W2/1099) cannot be generated
- No payroll system exists

## REQUIREMENTS

1. Create payroll tables in `drizzle/schema.ts`:

   **time_off table:**
   - `id` (serial, primary key)
   - `userId` (integer, FK to users, required)
   - `type` (text: 'VACATION', 'SICK', 'PERSONAL', 'UNPAID', required)
   - `startDate` (date, required)
   - `endDate` (date, required)
   - `status` (text: 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', default 'PENDING')
   - `approvedBy` (integer, FK to users, nullable)
   - `approvedAt` (timestamp, nullable)
   - `rejectionReason` (text, nullable)
   - `hoursRequested` (decimal 6.2, calculated from dates)
   - `notes` (text, nullable)
   - `createdAt` (timestamp with time zone, default now())
   - `updatedAt` (timestamp with time zone, default now())

   **tax_documents table:**
   - `id` (serial, primary key)
   - `userId` (integer, FK to users, required)
   - `type` (text: 'W2', '1099_NEC', '1099_MISC', required)
   - `year` (integer, required)
   - `s3Url` (text, required, S3 location of PDF)
   - `grossIncome` (decimal 12.2, required)
   - `federalTaxWithheld` (decimal 12.2, nullable, for W2)
   - `socialSecurityWithheld` (decimal 12.2, nullable, for W2)
   - `medicareWithheld` (decimal 12.2, nullable, for W2)
   - `generatedAt` (timestamp with time zone, default now())
   - `createdAt` (timestamp with time zone, default now())

   **payroll_runs table:**
   - `id` (serial, primary key)
   - `period` (text: 'WEEKLY', 'BI_WEEKLY', 'MONTHLY', required)
   - `periodStartDate` (date, required)
   - `periodEndDate` (date, required)
   - `status` (text: 'DRAFT', 'FINALIZED', 'PROCESSED', 'PAID', default 'DRAFT')
   - `totalAmount` (decimal 14.2, required)
   - `processedAt` (timestamp, nullable)
   - `createdAt` (timestamp with time zone, default now())
   - `updatedAt` (timestamp with time zone, default now())

   **pay_stubs table:**
   - `id` (serial, primary key)
   - `payrollRunId` (integer, FK to payroll_runs, required)
   - `userId` (integer, FK to users, required)
   - `grossPay` (decimal 12.2, required)
   - `federalTaxDeduction` (decimal 12.2, required)
   - `socialSecurityDeduction` (decimal 12.2, required)
   - `medicareDeduction` (decimal 12.2, required)
   - `otherDeductions` (jsonb, nullable, other deductions)
   - `netPay` (decimal 12.2, required)
   - `s3Url` (text, nullable, S3 location of PDF stub)
   - `createdAt` (timestamp with time zone, default now())
   - `updatedAt` (timestamp with time zone, default now())

2. Implement time-off request endpoint:
   ```typescript
   POST /api/payroll/time-off/request
   Body: {
     type: 'VACATION' | 'SICK' | 'PERSONAL' | 'UNPAID',
     startDate: string,
     endDate: string,
     notes?: string
   }
   ```
   - Calculate hours from date range (assuming 8-hour days, 5-day weeks)
   - Create time_off record with PENDING status
   - Notify manager
   - Return: `{ id, status: 'PENDING', hoursRequested: 40 }`

3. Implement time-off approval endpoint (manager):
   ```typescript
   POST /api/payroll/time-off/:timeOffId/approve
   Body: {
     approve: boolean,
     rejectionReason?: string
   }
   ```
   - Verify user is manager of requestor
   - Check available balance (VACATION/SICK limits)
   - Update status
   - Send notification to employee

4. Implement payroll run creation:
   ```typescript
   POST /api/payroll/runs
   Body: {
     period: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY',
     periodStartDate: string,
     periodEndDate: string
   }
   ```
   - Query all active employees
   - Calculate gross pay based on:
     - Hours worked (from tracking/timesheet)
     - Hourly rate (from employment agreement)
     - Overtime (1.5x after 40 hours/week)
     - Bonuses/incentives
   - Deduct taxes:
     - Federal (based on W4)
     - Social Security (6.2%)
     - Medicare (1.45%)
   - Create pay_stubs for each employee
   - Return: `{ id, status: 'DRAFT', totalAmount: 50000 }`

5. Implement payroll finalization:
   ```typescript
   POST /api/payroll/runs/:runId/finalize
   ```
   - Lock payroll run (no changes allowed)
   - Generate PDF stubs for each employee
   - Upload to S3
   - Update status to FINALIZED

6. Implement payroll processing:
   ```typescript
   POST /api/payroll/runs/:runId/process
   ```
   - Verify run is FINALIZED
   - Create ACH/wire transfers for each employee
   - Track payments
   - Update status to PROCESSED

7. Implement tax document generation:
   ```typescript
   POST /api/payroll/tax-documents/generate
   Body: {
     year: number,
     userIds?: number[] (optional, if empty, generate for all)
   }
   ```
   - Calculate annual totals from all pay_stubs
   - Generate W2/1099 documents
   - Include:
     - Gross income
     - Tax withholdings (federal, FICA)
     - Employer contributions
   - Create PDF and upload to S3
   - Email to employees
   - Create tax_documents records

8. Implement tax document retrieval:
   ```typescript
   GET /api/payroll/tax-documents
   Query: { year?, type? }
   GET /api/payroll/tax-documents/:documentId/download
   ```
   - Return list of documents for user
   - Allow download of PDF

9. Add time-off balance tracking:
   ```typescript
   GET /api/payroll/time-off/balance
   ```
   - Return for current user:
     - VACATION available / used / remaining
     - SICK available / used / remaining
     - PERSONAL available / used / remaining
   - Assume: 20 days vacation, 10 days sick per year

10. Add indexes:
    - time_off: (userId, status, createdAt)
    - tax_documents: (userId, year)
    - payroll_runs: (status, periodEndDate)
    - pay_stubs: (payrollRunId, userId)

## FILES TO MODIFY

- `drizzle/schema.ts` (add 4 new tables)
- `routers/payroll.ts` (add all endpoints)
- `services/payrollEngine.ts` (new file, payroll calculation logic)
- `services/taxEngine.ts` (new file, tax deduction calculations)

## VERIFICATION

1. Create tables:
   ```bash
   npm run db:push
   ```

2. Test time-off request:
   ```bash
   curl -X POST http://localhost:3000/api/payroll/time-off/request \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "VACATION",
       "startDate": "2026-03-15",
       "endDate": "2026-03-22"
     }'
   ```
   Should return: `{ id: 1, status: 'PENDING', hoursRequested: 40 }`

3. Test approval (as manager):
   ```bash
   curl -X POST http://localhost:3000/api/payroll/time-off/1/approve \
     -H "Authorization: Bearer <managerToken>" \
     -H "Content-Type: application/json" \
     -d '{"approve": true}'
   ```
   Should return: `{ status: 'APPROVED' }`

4. Test payroll run creation:
   ```bash
   curl -X POST http://localhost:3000/api/payroll/runs \
     -H "Authorization: Bearer <adminToken>" \
     -H "Content-Type: application/json" \
     -d '{
       "period": "BI_WEEKLY",
       "periodStartDate": "2026-03-01",
       "periodEndDate": "2026-03-14"
     }'
   ```
   Should return: `{ id: 1, status: 'DRAFT', totalAmount: X }`

5. Verify pay stubs created:
   ```bash
   psql $DATABASE_URL -c "SELECT userId, grossPay, netPay FROM pay_stubs WHERE payrollRunId = 1"
   ```

6. Test payroll finalization:
   ```bash
   curl -X POST http://localhost:3000/api/payroll/runs/1/finalize \
     -H "Authorization: Bearer <adminToken>"
   ```

7. Test tax document generation:
   ```bash
   curl -X POST http://localhost:3000/api/payroll/tax-documents/generate \
     -H "Authorization: Bearer <adminToken>" \
     -H "Content-Type: application/json" \
     -d '{"year": 2025}'
   ```

8. Verify documents created:
   ```bash
   psql $DATABASE_URL -c "SELECT userId, type, year FROM tax_documents WHERE year = 2025"
   ```

## DO NOT

- Forget to calculate overtime (1.5x after 40 hours/week)
- Use hardcoded tax rates (make configurable)
- Process payroll without finalizing first
- Allow payroll modifications after processing
- Generate W2 documents with incomplete data
- Skip email notifications for payroll events
- Leave tax documents unencrypted in S3
- Expose full SSN in documents (mask to last 4 digits)
- Create duplicate payroll runs for same period
- Allow tax documents to be generated before payroll run is completed

