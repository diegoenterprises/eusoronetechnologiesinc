# WS-E2E-012: Complete Admin Registration

**Priority:** P2  
**Estimated Hours:** 4  
**Status:** Not Started

## CONTEXT

The file `pages/RegisterAdmin.tsx` has a form shell but the submit logic is incomplete. This means:
- Admin accounts cannot be created via UI
- No role assignment mechanism exists
- Email verification is not implemented
- Security checks for admin approval missing

## REQUIREMENTS

1. Review `pages/RegisterAdmin.tsx` form structure:
   - Verify form has fields: email, password, confirmPassword, firstName, lastName, phone
   - Verify validation messages display

2. Implement form submit handler:
   ```typescript
   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setError('');
     setLoading(true);

     // Client-side validation
     if (!email || !password || !confirmPassword) {
       setError('All fields required');
       setLoading(false);
       return;
     }
     
     if (password !== confirmPassword) {
       setError('Passwords do not match');
       setLoading(false);
       return;
     }
     
     if (password.length < 12) {
       setError('Admin password must be at least 12 characters');
       setLoading(false);
       return;
     }

     try {
       // Call backend registration endpoint
       const response = await fetch('/api/auth/register-admin', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           email,
           password,
           firstName,
           lastName,
           phone,
           verificationCode: adminVerificationCode
         })
       });

       if (!response.ok) {
         const error = await response.json();
         setError(error.message || 'Registration failed');
         return;
       }

       // Success
       setSuccess('Admin registration successful! Check email for verification link.');
       // Redirect to login after 3 seconds
       setTimeout(() => router.push('/login'), 3000);
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Registration failed');
     } finally {
       setLoading(false);
     }
   };
   ```

3. Add verification code input:
   - Require admin to enter a verification code sent to existing admin
   - This prevents unauthorized admin creation
   - Store verification codes in database with 1-hour expiry

4. Create backend endpoint in `routers/auth.ts`:
   ```typescript
   router.post('/register-admin', async (req, res) => {
     const { email, password, firstName, lastName, phone, verificationCode } = req.body;

     // Validate verification code
     const validCode = await db.query.adminVerificationCodes.findFirst({
       where: and(
         eq(adminVerificationCodes.code, verificationCode),
         gt(adminVerificationCodes.expiresAt, new Date())
       )
     });

     if (!validCode) {
       return res.status(403).json({ message: 'Invalid or expired verification code' });
     }

     // Check existing admin doesn't already exist
     const existingAdmin = await db.query.users.findFirst({
       where: eq(users.email, email)
     });

     if (existingAdmin) {
       return res.status(409).json({ message: 'Email already registered' });
     }

     // Hash password
     const hashedPassword = await bcrypt.hash(password, 12);

     // Create admin user
     const admin = await db.insert(users).values({
       email,
       password: hashedPassword,
       firstName,
       lastName,
       phone,
       role: 'ADMIN',
       emailVerified: false,
       emailVerificationToken: generateToken(),
       emailVerificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
     }).returning();

     // Send verification email
     await sendAdminVerificationEmail(admin[0]);

     // Mark verification code as used
     await db.update(adminVerificationCodes)
       .set({ usedAt: new Date() })
       .where(eq(adminVerificationCodes.code, verificationCode));

     res.status(201).json({ message: 'Admin registration successful. Check email for verification.' });
   });
   ```

5. Add admin verification code generation:
   - Existing admin can generate codes via `/api/admin/generate-verification-code`
   - Codes are 8-character alphanumeric
   - Single-use, 1-hour expiry

6. Add email verification for admin:
   - Send verification email with link: `/auth/verify-admin?token=XXX`
   - Endpoint checks token and marks email as verified
   - Until verified, admin cannot login

7. Create `adminVerificationCodes` table in schema:
   - `id` (serial)
   - `code` (text, unique)
   - `generatedBy` (int, FK to admin user)
   - `usedBy` (int, nullable, FK to new admin)
   - `usedAt` (timestamp, nullable)
   - `expiresAt` (timestamp)
   - `createdAt` (timestamp)

8. Implement security checks:
   - Verify requestor is already an ADMIN
   - Verify no more than 10 admin accounts exist (configurable limit)
   - Log all admin creation attempts
   - Require existing admin approval (verification code)

## FILES TO MODIFY

- `pages/RegisterAdmin.tsx` (complete form and submit handler)
- `routers/auth.ts` (add register-admin endpoint)
- `drizzle/schema.ts` (add adminVerificationCodes table)
- `services/email.ts` (add admin verification email template)

## VERIFICATION

1. Create table:
   ```bash
   npm run db:push
   ```

2. Generate admin verification code as existing admin:
   ```bash
   curl -X POST http://localhost:3000/api/admin/generate-verification-code \
     -H "Authorization: Bearer <adminToken>"
   ```
   Should return: `{ code: "ABC123XY" }`

3. Register new admin with verification code:
   ```bash
   curl -X POST http://localhost:3000/api/auth/register-admin \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin2@company.com",
       "password": "SecurePass123!",
       "firstName": "Admin",
       "lastName": "Two",
       "phone": "555-0000",
       "verificationCode": "ABC123XY"
     }'
   ```
   Should return 201

4. Try register without verification code:
   - Should fail with 403 Forbidden

5. Verify email sent:
   - Check email logs for verification link
   - Link should be valid for 24 hours

6. Verify email endpoint:
   ```bash
   curl http://localhost:3000/api/auth/verify-admin?token=<token>
   ```
   Should mark admin as verified

7. Try login before verification:
   - Should fail with 403 "Email not verified"

8. Login after verification:
   - Should succeed

## DO NOT

- Allow admin registration without verification code
- Skip email verification for admins
- Use weak passwords (enforce 12+ character minimum)
- Allow unlimited admin creation (set reasonable limit)
- Forget to hash passwords (use bcrypt)
- Expose verification codes in logs
- Allow expired verification codes to be reused
- Create admin accounts without logging

