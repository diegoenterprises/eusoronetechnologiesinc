# WS-E2E-008: Build Account Closure Flow

**Priority:** P1  
**Estimated Hours:** 16  
**Status:** Not Started

## CONTEXT

There is no account deactivation flow in the system. Users cannot close their accounts, presenting significant GDPR/CCPA compliance risks. This means:
- Users cannot request account deletion
- PII cannot be anonymized
- No audit trail for account closures
- No legal compliance mechanism exists

This is a critical legal and regulatory requirement for operating in EU/California.

## REQUIREMENTS

1. Add columns to `users` table in `drizzle/schema.ts`:
   - `deactivatedAt` (timestamp with time zone, nullable, when account was deactivated)
   - `deactivationReason` (text, nullable, reason for deactivation: 'user_requested', 'compliance', 'violation', 'other')
   - `anonymizedAt` (timestamp with time zone, nullable, when PII was anonymized)
   - `isAnonymized` (boolean, default false)

2. Create new `routers/account.ts` file with `/api/account/deactivate` endpoint:
   ```typescript
   POST /api/account/deactivate
   Headers: Authorization: Bearer <token>
   Body: {
     reason: string,
     feedback?: string,
     password: string (for security confirmation)
   }
   ```

3. Implement deactivation logic:
   - Validate user is authenticated
   - Verify password matches (security confirmation)
   - Check for active loads:
     ```typescript
     const activeLoads = await db.query.loads.findMany({
       where: and(eq(loads.driverId, userId), inArray(loads.status, ['PENDING', 'ASSIGNED', 'PICKED_UP']))
     });
     if (activeLoads.length > 0) {
       throw new Error('Cannot deactivate account with active loads. Complete or cancel all loads first.');
     }
     ```
   - Check wallet balance:
     ```typescript
     const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
     if (user.walletBalance > 0) {
       throw new Error('Wallet balance must be $0. Withdraw or request payout first.');
     }
     ```
   - Store deactivation record:
     ```typescript
     await db.update(users).set({
       deactivatedAt: new Date(),
       deactivationReason: reason,
       status: 'DEACTIVATED'
     }).where(eq(users.id, userId));
     ```
   - Anonymize PII (see requirement 4)
   - Send confirmation email

4. Implement PII anonymization:
   - Create utility function `anonymizeUserData(userId)`:
     ```typescript
     const anonymousId = `anon_${userId}`;
     await db.update(users).set({
       email: `${anonymousId}@anonymous.local`,
       phone: null,
       firstName: 'Anonymous',
       lastName: 'User',
       address: null,
       city: null,
       state: null,
       zipCode: null,
       ssn: null,
       licenseNumber: null,
       licenseExpiry: null,
       isAnonymized: true,
       anonymizedAt: new Date()
     }).where(eq(users.id, userId));
     ```
   - Delete sensitive documents from S3
   - Clear ratings and reviews comments
   - Update all references to anonymized name

5. Send confirmation email:
   - Use email service to send to provided email before anonymization
   - Include: deactivation details, data retention policy, reactivation instructions
   - Include: confirmation code valid for 30 days (allows undo)

6. Implement soft delete (not hard delete):
   - Keep record in DB for audit/compliance
   - Mark as deactivated with timestamp
   - Prevent login (check deactivatedAt on auth)

7. Create reactivation endpoint (optional):
   ```typescript
   POST /api/account/reactivate
   Body: {
     email: string,
     password: string,
     confirmationCode?: string (if within 30 days)
   }
   ```
   - Allow reactivation within 30 days of deactivation
   - After 30 days, data is permanently anonymized and cannot be recovered

8. Create frontend `pages/AccountSettings.tsx` component:
   - Add "Deactivate Account" section in account settings
   - Button opens confirmation dialog
   - Dialog explains consequences and requires password re-entry
   - Shows active loads warning if applicable
   - Shows wallet balance if > 0
   - Textarea for optional feedback

9. Add permission checks:
   - Only users with CUSTOMER/DRIVER/CARRIER/SHIPPER roles can deactivate (not ADMIN)
   - Cannot deactivate if suspended or already deactivated
   - Cannot deactivate another user's account

10. Add audit logging:
    - Create `account_deactivations` audit log table:
      - `id`, `userId`, `reason`, `feedback`, `initiatedAt`, `completedAt`, `anonymizedAt`, `initiatedByUserId`
    - Log every step: deactivation request, validation checks, anonymization, email sent

## FILES TO MODIFY

- `drizzle/schema.ts` (add columns to users, create account_deactivations table)
- `routers/account.ts` (new file, create deactivation + reactivation endpoints)
- `pages/AccountSettings.tsx` (new file, add deactivation UI)
- `routers/auth.ts` (update login to check deactivatedAt)
- `services/email.ts` (add deactivation confirmation email template)

## VERIFICATION

1. Create tables:
   ```bash
   npm run db:push
   psql $DATABASE_URL -c "\dt account_deactivations"
   ```

2. Test deactivation with active load:
   - Create load, assign driver
   - Call deactivate endpoint with that driver
   - Should receive 400 error about active loads

3. Test deactivation with wallet balance:
   - Create user with $100 wallet balance
   - Call deactivate endpoint
   - Should receive 400 error about non-zero balance

4. Test successful deactivation:
   - Create user with no active loads and $0 balance
   - Call deactivate endpoint with correct password
   - Verify status changes to DEACTIVATED
   - Verify deactivatedAt is set
   - Verify email sent

5. Verify PII anonymization:
   - Check user record before deactivation
   - After deactivation, query user:
     ```bash
     psql $DATABASE_URL -c "SELECT email, phone, firstName, lastName FROM users WHERE id = <userId>"
     ```
   - Verify all PII fields are anonymized

6. Test login blocked:
   - Try to login with deactivated account
   - Should receive 401 error: "Account deactivated"

7. Test reactivation:
   - Call reactivate endpoint within 30 days
   - Verify account reactivated
   - Verify user can login again

8. Verify audit log:
   ```bash
   psql $DATABASE_URL -c "SELECT userId, reason, completedAt FROM account_deactivations WHERE userId = <userId>"
   ```

## DO NOT

- Hard delete user records (use soft delete with deactivatedAt)
- Send deactivation email after anonymizing email address (send before)
- Allow deactivation without password confirmation
- Leave sensitive documents in S3 (delete all)
- Allow reactivation after 30 days (permanent anonymization)
- Deactivate ADMIN accounts via API (must be manual/support ticket)
- Forget to check for active loads before allowing deactivation
- Leave PII in audit logs (anonymize logging as well)
- Allow users to deactivate other users
- Skip email notification (GDPR requires confirmation)

