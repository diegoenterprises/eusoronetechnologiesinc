# WS-E2E-016: Role-Specific Onboarding Flows

**Priority:** P2  
**Estimated Hours:** 16  
**Status:** Not Started

## CONTEXT

All users see generic welcome screens. There is no role-specific guidance. This means:
- Shippers don't know how to create their first load
- Drivers unsure what documents to upload
- Carriers confused about fleet setup
- Brokers don't understand their workflow
- Terminals uncertain about facility configuration

Users are lost and have high drop-off rates.

## REQUIREMENTS

1. Create onboarding component structure:
   ```
   components/Onboarding/
   ├── OnboardingWizard.tsx (main component)
   ├── ShipperOnboarding.tsx
   ├── DriverOnboarding.tsx
   ├── CarrierOnboarding.tsx
   ├── BrokerOnboarding.tsx
   ├── TerminalOnboarding.tsx
   ├── OnboardingStep.tsx (reusable step component)
   └── OnboardingProgress.tsx (progress indicator)
   ```

2. Implement ShipperOnboarding (5 steps):
   - **Step 1: Welcome** — Explain platform, key benefits
   - **Step 2: Company Info** — Collect company name, address, phone
   - **Step 3: Create First Load** — Form to create sample load
   - **Step 4: Payment Setup** — Add payment method, billing address
   - **Step 5: Review** — Summary of profile, option to post load
   - **Completion**: User can post loads, view analytics, manage shipments

3. Implement DriverOnboarding (6 steps):
   - **Step 1: Welcome** — Explain how drivers earn, safety focus
   - **Step 2: Personal Info** — Verify name, phone, email
   - **Step 3: Document Upload** — CDL, medical certificate, insurance
   - **Step 4: Vehicle Info** — Truck make/model/year, VIN, registration
   - **Step 5: Banking** — Direct deposit setup
   - **Step 6: Safety Agreement** — Acknowledge safety policies
   - **Completion**: Driver can bid on loads, view earnings

4. Implement CarrierOnboarding (6 steps):
   - **Step 1: Welcome** — Overview of carrier operations
   - **Step 2: Company Details** — MC number, DOT number, authority type
   - **Step 3: Fleet Setup** — Add 1-3 trucks (or skip for solo operator)
   - **Step 4: Insurance** — Upload liability, cargo, workers comp certificates
   - **Step 5: Payment Details** — Settlement preferences (instant/weekly)
   - **Step 6: Compliance** — Safety record review, insurance verification
   - **Completion**: Carrier can bid on loads, manage fleet, receive payouts

5. Implement BrokerOnboarding (5 steps):
   - **Step 1: Welcome** — Explain broker margin model
   - **Step 2: Commission Setup** — Set commission percentage (3-15%)
   - **Step 3: Post First Load** — Template for typical broker load
   - **Step 4: Carrier Network** — Browse available carriers
   - **Step 5: Payment Setup** — Wire/ACH details for carrier payouts
   - **Completion**: Broker can post loads, access carrier network

6. Implement TerminalOnboarding (5 steps):
   - **Step 1: Welcome** — Explain terminal operations
   - **Step 2: Facility Details** — Address, operating hours, contact
   - **Step 3: Equipment Setup** — Define available equipment types
   - **Step 4: Staff Setup** — Add terminal operators
   - **Step 5: Integration** — API documentation (optional)
   - **Completion**: Terminal can receive/send shipments

7. Add OnboardingStep component:
   ```typescript
   interface OnboardingStepProps {
     number: number;
     title: string;
     description?: string;
     children: React.ReactNode;
     onNext: () => void;
     onBack: () => void;
     isComplete?: boolean;
   }
   ```

8. Add OnboardingProgress component:
   ```typescript
   // Shows: Step 1 of 5 with visual progress bar
   // Shows completed steps with checkmarks
   // Allows skipping optional steps
   ```

9. Add database tracking:
   - Add `onboardingCompleted` (boolean) to users table
   - Add `onboardingStepCompleted` (text[]) array to track which steps done
   - Add `onboardingCompletedAt` (timestamp) to record completion time

10. Implement skip logic:
    - Allow users to skip non-critical steps
    - Remind about pending documents/setup
    - Enable "complete profile" after onboarding

11. Add milestone tracking:
    - Fire gamification event `onboarding_completed` with role
    - Award points for completing each step
    - Bonus points for completing all steps without skipping

12. Create onboarding styles:
    ```css
    /* Onboarding has distinct visual treatment */
    .onboarding-container {
      max-width: 600px;
      background: gradient or specific theme
      border-radius, padding, spacing
    }
    ```

## FILES TO MODIFY

- `components/Onboarding/` (create directory with 6+ files)
- `drizzle/schema.ts` (add onboarding columns to users)
- `pages/onboarding.tsx` (new main onboarding page)
- `routers/auth.ts` (redirect to onboarding after signup)
- `services/gamificationDispatcher.ts` (add onboarding event)

## VERIFICATION

1. Create tables:
   ```bash
   npm run db:push
   ```

2. Test Shipper onboarding:
   - Create shipper account
   - Redirect to onboarding
   - Complete all 5 steps
   - Verify can create load

3. Test Driver onboarding:
   - Create driver account
   - See 6-step wizard
   - Upload CDL image
   - Verify bank details saved
   - Verify can bid on loads

4. Test Carrier onboarding:
   - Create carrier account
   - Fill MC/DOT numbers
   - Add vehicles
   - Verify instant pay option visible

5. Test skip functionality:
   - Start onboarding
   - Skip optional step
   - Verify can still complete
   - Check prompt to finish setup

6. Verify database tracking:
   ```bash
   psql $DATABASE_URL -c "SELECT onboardingCompleted, onboardingStepCompleted FROM users WHERE id = <userId>"
   ```

7. Check gamification event:
   - Complete onboarding
   - Verify `onboarding_completed` event fired
   - Check user points increased

8. Test redirect:
   - Signup
   - Automatically redirect to onboarding
   - Complete and redirect to dashboard

## DO NOT

- Make all steps required (allow skip for non-critical)
- Forget to save progress (save on each step)
- Use generic text (make role-specific and actionable)
- Skip document validation (CDL must be real image format)
- Allow completion without critical info (payment method, identity)
- Forget to show previous steps (user needs context)
- Use long-form text walls (break into steps)
- Skip email verification (required for all roles)
- Forget to reset onboarding for test accounts
- Leave onboarding incomplete (track every step)

