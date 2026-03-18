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

  // FIX TS2352: "Conversion of type X to type 'string' may be a mistake"
  // These are cases where we incorrectly cast non-string values to string.
  // Fix: use `as Record<string, unknown>` instead of `as string` for objects

  // Pattern: (variable as string).prop → (variable as Record<string, unknown>).prop
  // e.g., (company as string).metadata → (company as Record<string, unknown>).metadata
  content = content.replace(/\((\w+) as string\)\.(\w+)/g, (match, varName, prop) => {
    // If accessing properties like .metadata, .policyType etc, it's an object not string
    return `(${varName} as Record<string, unknown>).${prop}`;
  });

  // Pattern: (variable as string)?.prop → (variable as Record<string, unknown>)?.prop
  content = content.replace(/\((\w+) as string\)\?\./g, '($1 as Record<string, unknown>)?.');

  // FIX: (result as string).insertId → need { insertId: number }
  content = content.replace(
    /\((\w+) as string\)\.insertId/g,
    '($1 as unknown as { insertId: number }).insertId'
  );
  content = content.replace(
    /\((\w+) as Record<string, unknown>\)\.insertId/g,
    '($1 as unknown as { insertId: number }).insertId'
  );

  // FIX: (someResult as string)[0] → (someResult as unknown as unknown[])[0]
  content = content.replace(/\((\w+) as string\)\[0\]/g, '($1 as unknown as unknown[])[0]');

  // FIX TS2339: Property does not exist on Record<string, unknown>
  // When we cast objects to Record<string, unknown>, their property values are `unknown`
  // and you can't access nested properties on `unknown`.
  // The safest fix is to keep using Record<string, unknown> but the code already accesses
  // properties directly, so we should use a looser type.
  // Actually, Record<string, unknown> DOES allow property access - the issue is the
  // property value is `unknown`, and you can't access props on `unknown`.
  // For nested property access like (obj as Record<string, unknown>).foo.bar,
  // .foo returns unknown, and .bar fails.

  // For the ) as unknown[]; pattern (SQL execute results), we used unknown[] which
  // makes result[0] be `unknown`. Properties can't be accessed on `unknown`.
  // Let me change these to use a row type.

  // Pattern: ) as unknown[]; for SQL execute - these need to allow property access
  // Change to `as { [key: string]: unknown }[];` for arrays we index into
  // Actually the mysql2 execute returns [rows, fields] where rows can be accessed.
  // The drizzle pattern is: const [rows] = await db.execute(sql`...`) as unknown[];
  // Then rows[0] would be unknown.
  // We need: as [Record<string, unknown>[], unknown]

  // FIX: `) as unknown[];` where the result is destructured or indexed
  // This is complex. Let me just check for specific patterns.

  // FIX TS7053: Element implicitly has 'any' type because expression of type '0'
  // can't be used to index type '{}'.
  // This happens when we cast SQL results to {} via unknown[].
  // The pattern is: const [rows] = await db.execute(...) as unknown[];
  // Then rows[0] fails because rows is unknown.

  // Actually, let me look at this more carefully. The `) as unknown[];` from our
  // earlier fix turns `db.execute(sql`...`)` result into unknown[].
  // When destructured as `const [rows]`, rows becomes `unknown`.
  // Then rows[0]?.foo fails.
  // Better type: `as [Record<string, unknown>[], ...unknown[]]`

  // Let me find and fix these patterns:
  // const [something] = await db.execute(...) as unknown[];
  content = content.replace(
    /\) as unknown\[\];/g,
    ') as [Record<string, unknown>[], ...unknown[]];'
  );

  // FIX TS18046: 'e' is of type 'unknown' in catch blocks
  // We changed catch (e: any) to catch (e: unknown), but the code uses e.message
  // Need to cast e to Error where message is accessed
  // Pattern in admin.ts: logger.error("msg", e); → that's fine, logger accepts unknown
  // But e?.message fails on unknown
  content = content.replace(/\(e as unknown\)\.message/g, '(e as Error).message');
  content = content.replace(/\(err as unknown\)\.message/g, '(err as Error).message');
  // Pattern: e?.message → (e as Error)?.message
  // But this is harder to regex safely

  // FIX: (resp.json() as string) → should be Record<string, unknown>
  content = content.replace(/await resp\.json\(\) as string/g, 'await resp.json() as Record<string, unknown>');
  content = content.replace(/await batchResp\.json\(\) as string/g, 'await batchResp.json() as Record<string, unknown>');

  // FIX: `const result = [] as string;` → `const result = [] as unknown[];`
  content = content.replace(/\[\] as string;/g, '[] as unknown[];');
  content = content.replace(/\[\] as string,/g, '[] as unknown[],');

  // FIX: .forEach((r: string) → .forEach((r: Record<string, unknown>)
  // where the original was (r: any)
  content = content.replace(/\(r: string\)/g, '(r: Record<string, unknown>)');

  // FIX TS2495: Type 'unknown' is not an array type or a string type
  // for (const row of (rows as unknown as Record<string, unknown>[]))
  // This should be fine if the cast is right. Let me check specific patterns.

  // FIX TS2363/TS2362: comparison operators with unknown
  // e.g., `new Date(ld.createdAt as string)` - createdAt might be Date or string, so this is actually fine

  // FIX: `(newCompany as string).insertId` → (newCompany as unknown as { insertId: number }).insertId
  // Already handled above.

  // FIX: for arrays that were cast from SQL results
  // Pattern: (rows as unknown as Record<string, unknown>[])[0] - accessing [0] on this array
  // should work since it's typed as array.

  // FIX: catch blocks in admin.ts
  // Find patterns like: catch (e: unknown) { ... e.message ... }
  // and add (e as Error) casts

  if (content !== original) {
    fs.writeFileSync(file, content);
    totalFixed++;
  }
}

// Special fix for admin.ts catch blocks
const adminFile = path.join(ROUTER_DIR, 'admin.ts');
if (fs.existsSync(adminFile)) {
  let content = fs.readFileSync(adminFile, 'utf8');
  const original = content;
  // Fix catch (e: unknown) where e.message is accessed
  // Pattern: } catch (e: unknown) { ... e.message
  content = content.replace(/catch \(e: unknown\) \{([^}]*?)e\.message/gs, (match, body) => {
    return `catch (e: unknown) {${body}(e as Error).message`;
  });
  // Also handle e?.message
  content = content.replace(/(?<!\(e as Error\))(?<!as Error\?)e\?\.message/g, '(e as Error)?.message');
  if (content !== original) {
    fs.writeFileSync(adminFile, content);
    totalFixed++;
  }
}

console.log(`Total files modified: ${totalFixed}`);
