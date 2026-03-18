# WS-E2E-003: Persist Settlement Documents

**Priority:** P0  
**Estimated Hours:** 4  
**Status:** Not Started

## CONTEXT

The file `services/settlement.ts` generates settlement documents (PDFs, calculations, deduction breakdowns) entirely in-memory and only during the HTTP response. Once the response is sent, all settlement data is lost. This means:
- No audit trail of settlement calculations
- Cannot retrieve past settlement details
- No document storage for legal/accounting purposes
- Cannot regenerate settlement documents for disputes

This is critical for financial compliance and dispute resolution.

## REQUIREMENTS

1. Create the `settlement_documents` table in `drizzle/schema.ts` with columns:
   - `id` (serial, primary key)
   - `settlementId` (integer, nullable, for linking to parent settlement if one exists)
   - `loadId` (integer, foreign key to loads, required)
   - `driverId` (integer, foreign key to users, required)
   - `carrierId` (integer, foreign key to users, nullable)
   - `documentType` (text: 'SETTLEMENT', 'INVOICE', 'DEDUCTION_REPORT', required)
   - `amount` (decimal 12.2, required, total payout amount)
   - `deductions` (jsonb, required, stores deduction breakdown as JSON object)
   - `netPay` (decimal 12.2, required, final payout after deductions)
   - `generatedAt` (timestamp with time zone, default now())
   - `s3Url` (text, nullable, S3 location of PDF file)
   - `status` (text: 'DRAFT', 'FINALIZED', 'PAID', default 'DRAFT')

2. Run migrations to create table with indexes:
   - `settlement_documents`: (loadId), (driverId, generatedAt), (status)

3. Modify `services/settlement.ts`:
   - After settlement calculation is complete, persist to DB:
     ```typescript
     const doc = await db.insert(settlementDocuments).values({
       loadId,
       driverId,
       carrierId,
       documentType: 'SETTLEMENT',
       amount: totalAmount,
       deductions: { ... },
       netPay: netAmount,
       status: 'DRAFT'
     }).returning();
     ```
   - Before generating PDF response, update status to 'FINALIZED'

4. Add S3 PDF upload:
   - Generate PDF from settlement data using a PDF library (e.g., pdfkit, puppeteer)
   - Upload to S3 bucket: `s3://freight-platform/settlements/{loadId}/{driverId}_{timestamp}.pdf`
   - Store S3 URL in `s3Url` column
   - Set TTL on S3 objects to 7 years for compliance

5. Add retrieval endpoints:
   - `GET /api/settlements/:settlementId` — fetch settlement by ID
   - `GET /api/loads/:loadId/settlement` — fetch settlement for a load
   - `GET /api/drivers/:driverId/settlements` — list all settlements for a driver with pagination
   - `GET /api/settlements/:settlementId/pdf` — download PDF (requires auth + permission check)

6. Add permission checks:
   - Only the driver, carrier, or admin can view settlement details
   - Only the driver can download their own settlement PDF

7. Implement status transitions:
   - DRAFT: initial state, can be recalculated
   - FINALIZED: locked, cannot change, ready for payout
   - PAID: settlement has been paid out to driver

## FILES TO MODIFY

- `drizzle/schema.ts` (add settlementDocuments table)
- `services/settlement.ts` (add persistence logic + PDF generation)
- `routers/settlement.ts` (add retrieval endpoints)
- `.env` (add S3_BUCKET and S3_REGION if not present)

## VERIFICATION

1. Verify table created:
   ```bash
   npm run db:push
   psql $DATABASE_URL -c "\dt settlement_documents"
   ```

2. Test settlement creation and persistence:
   - Complete a load delivery
   - Trigger settlement calculation
   - Verify record appears in settlement_documents table:
     ```bash
     psql $DATABASE_URL -c "SELECT id, loadId, amount, status FROM settlement_documents LIMIT 5"
     ```

3. Test PDF generation and S3 upload:
   - Check S3 bucket for generated PDF
   - Verify `s3Url` is populated in settlement_documents record

4. Test retrieval endpoints:
   ```bash
   curl http://localhost:3000/api/settlements/1
   curl http://localhost:3000/api/loads/5/settlement
   curl http://localhost:3000/api/drivers/3/settlements?page=1&limit=10
   ```

5. Test PDF download:
   ```bash
   curl http://localhost:3000/api/settlements/1/pdf -o settlement.pdf
   file settlement.pdf  # Should be PDF format
   ```

6. Verify permission checks:
   - Try to access settlement as unauthorized user — should get 403
   - Try to access settlement as correct user — should succeed

## DO NOT

- Generate PDF synchronously in the main request handler (use background job or queue)
- Store PDF content in database (only store S3 URL reference)
- Skip S3 upload validation — verify file exists after upload
- Leave settlement records in DRAFT state indefinitely (add cleanup job or explicit finalization)
- Expose sensitive deduction details to unauthorized users (sanitize response)
- Use in-memory PDF generation for large settlements (stream to S3 directly)
- Forget to set appropriate AWS IAM permissions for S3 bucket access

