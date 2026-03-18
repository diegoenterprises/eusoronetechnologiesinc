# Contributing to EusoTrip

## Quick Start
1. `git clone <repo> && cd frontend`
2. `pnpm install`
3. `cp .env.example .env` — fill in DATABASE_URL, JWT_SECRET, STRIPE keys
4. `pnpm dev` — starts at http://localhost:5173

## Architecture
- **Frontend:** React 19, Vite, Tailwind CSS, shadcn/ui, wouter routing
- **Backend:** Express, tRPC 11, Drizzle ORM (MySQL 8.0)
- **Auth:** JWT (7-day tokens), bcrypt passwords
- **Payments:** Stripe Connect with application fees
- **Real-time:** Socket.io with Redis adapter
- **Cache:** Redis (Azure) with in-memory fallback
- **Hosting:** Azure App Service

## Coding Standards

### Type Safety
Use helpers from `server/utils/typeHelpers.ts` instead of `as any`:
- `getUserId(ctx)` not `(ctx.user as any)?.id`
- `parseLocation(loc)` not `loc as any`
- `getInsertId(result)` not `(result as any).insertId`
- `toNumber(val)` not `Number(val as any)`

### Money Calculations
Use `server/utils/money.ts` — NEVER multiply/divide money as floats:
- `toCents(dollars)` before calculation
- `fromCents(cents)` for storage/display
- `calculateFeeInCents(amountCents, ratePercent)` for percentages

### tRPC Procedures
- Zod schemas for ALL inputs
- Return typed objects, not `any`
- Wrap DB calls in try/catch with TRPCError
- Register in `server/routers.ts`

### New Pages
- `React.lazy()` import in App.tsx
- Route with `guard(ROLES, <Page />)` pattern
- Support light/dark via `useTheme()`
- Include loading skeleton + empty state

### Commit Format
```
feat: add bulk driver import
fix: settlement double-creation race condition
refactor: replace float math with cent-based integers
```

## Testing
```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
```

## Key Files
- `App.tsx` — 636 routes, role-based guards
- `menuConfig.ts` — 24-role sidebar configuration
- `loadLifecycle.ts` — Load state machine (37 states)
- `schema.ts` — 302 database tables
- `websocket.ts` — Real-time event system
