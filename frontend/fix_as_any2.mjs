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

  // ── Remaining "string" as any patterns → "string" as string ──
  // Catch ALL remaining double-quoted strings cast as any
  content = content.replace(/"([^"]+)" as any/g, '"$1" as string');

  // ── Remaining 'string' as any patterns → 'string' as string ──
  content = content.replace(/'([^']+)' as any/g, "'$1' as string");

  // ── input.PROP as any → input.PROP as string ──
  content = content.replace(/input\.(\w+) as any/g, 'input.$1 as string');

  // ── variable as any for simple identifiers ──
  // e.g., testType as any, status as any, role as any, fromRole as any, etc.
  // Match word as any (but not ]) as any which is array/result)
  content = content.replace(/(\b\w+) as any(?!\[)/g, (match, varName) => {
    // Skip if it's a complex expression like "} as any" or ") as any"
    if (varName === 'unknown' || varName === 'string' || varName === 'number' || varName === 'boolean') return match;
    return `${varName} as string`;
  });

  // ── Fix: } as any that slipped through → } as Record<string, unknown> ──
  content = content.replace(/\} as any\)/g, '} as Record<string, unknown>)');
  content = content.replace(/\} as any,/g, '} as Record<string, unknown>,');

  // ── Fix: ) as any; → ) as unknown[]; ──
  content = content.replace(/\) as any;/g, ') as unknown[];');
  content = content.replace(/\) as any\]/g, ') as unknown[]]');

  // ── Fix: (something as any)?.prop or (something as any).prop ──
  // E.g., (load as any)?.[0]?.hazmatClass
  content = content.replace(/\((\w+) as any\)\?\.\[/g, '($1 as unknown as Record<string, unknown>[])?.[');
  content = content.replace(/\((\w+) as any\)\?\./g, '($1 as Record<string, unknown>)?.');
  content = content.replace(/\((\w+) as any\)\./g, '($1 as Record<string, unknown>).');

  // ── Fix: (something.prop as any)?.field or (something.prop as any).field ──
  content = content.replace(/\((\w+\.\w+) as any\)\?\./g, '($1 as Record<string, unknown>)?.');
  content = content.replace(/\((\w+\.\w+) as any\)\./g, '($1 as Record<string, unknown>).');
  content = content.replace(/\((\w+\.\w+) as any\)/g, '($1 as Record<string, unknown>)');

  // ── Fix: (result as any) patterns for insertId/db results ──
  content = content.replace(/\((\w+Result) as any\)\?\.\[0\]/g, '($1 as unknown as unknown[][])?.[0]');
  content = content.replace(/\(\((\w+Result) as any\)\?\.\[0\]/g, '(($1 as unknown as unknown[][])?.[0]');
  content = content.replace(/\((\w+) as any\)\[0\]/g, '($1 as unknown as unknown[])[0]');

  // ── null as any → null as unknown ──
  content = content.replace(/null as any/g, 'null as unknown');

  // ── String(something) as any → just the String() ──
  // "String(leg.originLat) as any" → "String(leg.originLat)"
  content = content.replace(/String\(([^)]+)\) as any/g, 'String($1) as unknown');

  // ── values(... as any) → remove cast ──
  content = content.replace(/\.values\((\w+) as any\)/g, '.values($1 as Record<string, unknown>)');

  // ── (rows as any).map ──
  content = content.replace(/\((\w+) as any\)\.map/g, '($1 as unknown[]).map');

  // ── x as any; at end of line (standalone cast) → x as unknown; ──
  content = content.replace(/(\w+) as any;/g, '$1 as unknown;');

  // ── Fix double "as string as string" from multiple passes ──
  content = content.replace(/as string as string/g, 'as string');

  // ── Fix "as Record<string, unknown> as string" ──
  content = content.replace(/as Record<string, unknown> as string/g, 'as Record<string, unknown>');

  // ── Fix: CDL_ENDORSEMENTS.includes(e as string) — keep this ──

  // ── Fix any remaining `(result as any)` patterns ──
  content = content.replace(/\(result as any\)\.(\w+)/g, '(result as Record<string, unknown>).$1');
  content = content.replace(/\(result as any\)\?\.(\w+)/g, '(result as Record<string, unknown>)?.$1');

  // ── Fix: (pi as any)?.client_secret ──
  content = content.replace(/\(pi as any\)\?\./g, '(pi as Record<string, unknown>)?.');
  content = content.replace(/\(inv as any\)\./g, '(inv as Record<string, unknown>).');
  content = content.replace(/\(inv as any\)\?\./g, '(inv as Record<string, unknown>)?.');

  // ── Fix: (row as any)?.publicKey ──
  content = content.replace(/\(row as any\)\?\./g, '(row as Record<string, unknown>)?.');
  content = content.replace(/\(row as any\)\./g, '(row as Record<string, unknown>).');

  // ── Fix: (newCompany as any).insertId ──
  content = content.replace(/\((\w+) as any\)\.insertId/g, '($1 as unknown as { insertId: number }).insertId');

  // ── Fix: (membership as any)?.encryptedGroupKey ──
  content = content.replace(/\(membership as any\)\?\./g, '(membership as Record<string, unknown>)?.');
  content = content.replace(/\(channel as any\)\?\./g, '(channel as Record<string, unknown>)?.');

  // ── Fix any leftover ": any" that were "(load as any)" patterns we already handled ──
  // (load as Record<string, unknown>).spectraMatchResult as any → as Record<string, unknown>
  content = content.replace(/\.spectraMatchResult as any/g, '.spectraMatchResult as Record<string, unknown>');

  // ── Fix (carrier as any).allowedToOperate ──
  content = content.replace(/\(carrier as any\)\./g, '(carrier as Record<string, unknown>).');
  content = content.replace(/\(safetyRating as any\)\?\./g, '(safetyRating as Record<string, unknown>)?.');

  // ── Fix: `(company as any).metadata` ──
  content = content.replace(/\(company as any\)\./g, '(company as Record<string, unknown>).');

  // ── Fix: `(user as any).profileImageUrl` ──
  content = content.replace(/\(user as any\)\./g, '(user as Record<string, unknown>).');

  // ── Fix: `(d as any).name` patterns ──
  content = content.replace(/\(d as any\)\./g, '(d as Record<string, unknown>).');

  // ── Fix: `(l as any).spectraMatchResult` ──
  content = content.replace(/\(l as any\)\./g, '(l as Record<string, unknown>).');

  // ── Fix: fac as any ──
  content = content.replace(/fac as any/g, 'fac as Record<string, unknown>');

  // ── Fix: scored.recommendation as any ──
  content = content.replace(/scored\.recommendation as any/g, 'scored.recommendation as string');
  content = content.replace(/result\.recommendation as any/g, 'result.recommendation as string');

  // ── Fix: ergResult as any ──
  content = content.replace(/ergResult as any/g, 'ergResult as Record<string, unknown>');

  // ── Fix: bolDoc as any → bolDoc as Record<string, unknown> ──
  content = content.replace(/bolDoc as any/g, 'bolDoc as Record<string, unknown>');

  // ── Fix: status as any (in set calls) ──
  // Already handled by the generic word as any → word as string

  // ── Fix: loadStops values as any ──
  content = content.replace(/values as any/g, 'values as typeof loadStops.$inferInsert[]');

  // ── Fix: undefined as any ──
  content = content.replace(/undefined as any/g, 'undefined as unknown');

  // ── Final cleanup: catch (e: any) → catch (e: unknown) ──
  content = content.replace(/catch \(err: any\)/g, 'catch (err: unknown)');
  content = content.replace(/catch \(e: any\)/g, 'catch (e: unknown)');

  // ── Double-check: fix any "as string as string" double casts ──
  content = content.replace(/as string as string/g, 'as string');
  content = content.replace(/as unknown as unknown/g, 'as unknown');

  if (content !== original) {
    fs.writeFileSync(file, content);
    const remaining = (content.match(/as any/g) || []).length;
    if (remaining > 0) {
      const lines = content.split('\n');
      const matches = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('as any')) {
          matches.push(`  ${i + 1}: ${lines[i].trim().substring(0, 120)}`);
        }
      }
      console.log(`${path.basename(file)}: ${remaining} remaining:`);
      matches.forEach(m => console.log(m));
    } else {
      console.log(`${path.basename(file)}: fully fixed`);
    }
    totalFixed++;
  }
}

console.log(`\nTotal files modified: ${totalFixed}`);

// Count total remaining
let totalRemaining = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const count = (content.match(/as any/g) || []).length;
  totalRemaining += count;
}
console.log(`Total remaining 'as any' across all target files: ${totalRemaining}`);
