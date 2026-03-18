import fs from 'fs';
import path from 'path';

const ROUTER_DIR = 'server/routers';
const EXCLUDED = new Set([
  'futureVision.ts', 'dispatch.ts', 'advancedFinancials.ts', 'safety.ts',
  'agreements.ts', 'wallet.ts', 'messages.ts', 'gamification.ts',
  'dispatchPlanner.ts', 'pricebook.ts', 'dataMigration.ts', 'communicationHub.ts',
  'driverWellness.ts', 'quotes.ts', 'location.ts', 'emergencyProtocols.ts',
  'stripe.ts', 'fscEngine.ts', 'allocationTracker.ts', 'shippers.ts',
  'documentCenter.ts', 'superAdmin.ts',
]);

const files = fs.readdirSync(ROUTER_DIR)
  .filter(f => f.endsWith('.ts') && !EXCLUDED.has(f) && !f.startsWith('__'))
  .map(f => path.join(ROUTER_DIR, f));

let totalFixed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // FIX 1: SQL execute result casts need double assertion
  // `) as [Record<string, unknown>[], ...unknown[]];` → `) as unknown as [Record<string, unknown>[], ...unknown[]];`
  content = content.replace(
    /\) as \[Record<string, unknown>\[\], \.\.\.unknown\[\]\];/g,
    ') as unknown as [Record<string, unknown>[], ...unknown[]];'
  );

  // FIX 2: (variable as string).prop where variable is actually an object
  // TS2352: Conversion may be a mistake
  // Need to check what types are being cast to string incorrectly
  // General fix: change (X as string).prop to (X as Record<string, unknown>).prop
  // Already handled in previous pass, but let me catch remaining ones

  // FIX 3: (X as Record<string, unknown>).prop where prop result is used as object
  // Need to chain with another cast: ((X as Record<string, unknown>).prop as Record<string, unknown>).nestedProp

  // FIX 4: catch (e: unknown) blocks where e.message is accessed without cast
  // Find `e.message` that's NOT already wrapped in `(e as Error)`
  // This is tricky with regex, do it file by file for admin.ts

  // FIX 5: TS2352 remaining - "Conversion of type X to type 'string' may be a mistake"
  // These are from our pass2 replacing "variableName as any" with "variableName as string"
  // when the variable isn't a string. Let me identify and fix these.

  // Pattern: (pi as string)?.client_secret → (pi as Record<string, unknown>)?.client_secret
  content = content.replace(/\(pi as string\)\?\./g, '(pi as Record<string, unknown>)?.');
  content = content.replace(/\(inv as string\)\./g, '(inv as Record<string, unknown>).');
  content = content.replace(/\(inv as string\)\?\./g, '(inv as Record<string, unknown>)?.');
  content = content.replace(/\(\(inv as string\)\./g, '((inv as Record<string, unknown>).');
  content = content.replace(/\(company as string\)\./g, '(company as Record<string, unknown>).');
  content = content.replace(/\(carrier as string\)\./g, '(carrier as Record<string, unknown>).');
  content = content.replace(/\(user as string\)\./g, '(user as Record<string, unknown>).');

  // FIX 6: `as string` on non-string objects
  // (p as string).policyType → (p as Record<string, unknown>).policyType
  content = content.replace(/\(p as string\)\./g, '(p as Record<string, unknown>).');
  content = content.replace(/\(d as string\)\./g, '(d as Record<string, unknown>).');
  content = content.replace(/\(l as string\)\./g, '(l as Record<string, unknown>).');
  content = content.replace(/\(f as string\)\./g, '(f as Record<string, unknown>).');
  content = content.replace(/\(t as string\)\./g, '(t as Record<string, unknown>).');
  content = content.replace(/\(v as string\)\./g, '(v as Record<string, unknown>).');
  content = content.replace(/\(r as string\)\./g, '(r as Record<string, unknown>).');
  content = content.replace(/\(s as string\)\./g, '(s as Record<string, unknown>).');
  content = content.replace(/\(m as string\)\./g, '(m as Record<string, unknown>).');
  content = content.replace(/\(n as string\)\./g, '(n as Record<string, unknown>).');
  content = content.replace(/\(c as string\)\./g, '(c as Record<string, unknown>).');
  content = content.replace(/\(membership as string\)\?\./g, '(membership as Record<string, unknown>)?.');
  content = content.replace(/\(channel as string\)\?\./g, '(channel as Record<string, unknown>)?.');
  content = content.replace(/\(safetyRating as string\)\?\./g, '(safetyRating as Record<string, unknown>)?.');

  // FIX 7: `ergResult as string` → `ergResult as Record<string, unknown>`
  content = content.replace(/ergResult as string/g, 'ergResult as Record<string, unknown>');
  content = content.replace(/bolDoc as string/g, 'bolDoc as Record<string, unknown>');

  // FIX 8: result.payment_intent type
  content = content.replace(/\(result as string\)\.payment_intent/g, '(result as Record<string, unknown>).payment_intent');
  content = content.replace(/\(result as string\)\./g, '(result as Record<string, unknown>).');

  // FIX 9: (row as string)?. → (row as Record<string, unknown>)?.
  content = content.replace(/\(row as string\)\?\./g, '(row as Record<string, unknown>)?.');
  content = content.replace(/\(row as string\)\./g, '(row as Record<string, unknown>).');

  // FIX 10: `(newCompany as string)` → proper cast
  content = content.replace(/\(newCompany as string\)/g, '(newCompany as unknown as { insertId: number })');

  // FIX 11: resp.json() results
  content = content.replace(/await resp\.json\(\) as string/g, 'await resp.json() as Record<string, unknown>');

  // FIX 12: .json() as string[]
  content = content.replace(/\.json\(\) as string\[\]/g, '.json() as Record<string, unknown>[]');

  // FIX 13: `(msgResult as string)` patterns from channels
  content = content.replace(/\(msgResult as string\)/g, '(msgResult as unknown as { insertId: number })');
  content = content.replace(/\(attResult as string\)/g, '(attResult as unknown as { insertId: number })');

  // FIX 14: await db.execute(...) as string; → as [Record<string, unknown>[], ...unknown[]];
  content = content.replace(
    /await db\.execute\(([^)]+)\) as string;/g,
    'await db.execute($1) as unknown as [Record<string, unknown>[], ...unknown[]];'
  );

  // FIX 15: `fac as string` → `fac as Record<string, unknown>`
  content = content.replace(/fac as string/g, 'fac as Record<string, unknown>');

  // FIX 16: catch(e: unknown) where e.message is used
  // In various files, fix e.message and err.message patterns
  content = content.replace(/(?<!\(e as Error\))(?<!\(e as unknown\))\be\.message\b/g, '(e as Error).message');
  content = content.replace(/(?<!\(err as Error\))(?<!\(err as unknown\))\berr\.message\b/g, '(err as Error).message');
  // Also e?.message
  content = content.replace(/(?<!\(e as Error\)\?)e\?\.message/g, '(e as Error)?.message');
  content = content.replace(/(?<!\(err as Error\)\?)err\?\.message/g, '(err as Error)?.message');

  // FIX 17: (info.guide.emergencyResponse as string) → (info.guide.emergencyResponse as Record<string, unknown>)
  content = content.replace(/\.emergencyResponse as string/g, '.emergencyResponse as Record<string, unknown>');
  content = content.replace(/\.spectraMatchResult as string/g, '.spectraMatchResult as Record<string, unknown>');

  // FIX 18: !! (l as string).spectraMatchResult → !!(l as Record<string, unknown>).spectraMatchResult
  content = content.replace(/\(l as string\)/g, '(l as Record<string, unknown>)');

  // Cleanup: remove double "as unknown as unknown as"
  content = content.replace(/as unknown as unknown as/g, 'as unknown as');

  if (content !== original) {
    fs.writeFileSync(file, content);
    totalFixed++;
  }
}

console.log(`Total files modified: ${totalFixed}`);
