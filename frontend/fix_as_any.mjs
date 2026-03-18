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

  // ── ctx.user as any ──
  content = content.replace(/\(ctx\.user as any\)\?\.id/g, 'ctx.user!.id');
  content = content.replace(/\(ctx\.user as any\)\.id/g, 'ctx.user!.id');
  content = content.replace(/\(ctx\.user as any\)\?\.companyId/g, 'ctx.user!.companyId');
  content = content.replace(/\(ctx\.user as any\)\.companyId/g, 'ctx.user!.companyId');
  content = content.replace(/\(ctx\.user as any\)\?\.role/g, 'ctx.user!.role');
  content = content.replace(/\(ctx\.user as any\)\.role/g, 'ctx.user!.role');
  content = content.replace(/\(ctx\.user as any\)\?\.name/g, 'ctx.user!.name');
  content = content.replace(/\(ctx\.user as any\)\.name/g, 'ctx.user!.name');
  content = content.replace(/\(ctx\.user as any\)\?\.email/g, 'ctx.user!.email');
  content = content.replace(/\(ctx\.user as any\)\.email/g, 'ctx.user!.email');

  // ── ctx as any ──
  content = content.replace(/\(ctx as any\)\.user/g, 'ctx.user');
  content = content.replace(/\(ctx as any\)\.req/g, 'ctx.req');

  // ── pickupLocation/deliveryLocation/currentLocation as any ──
  content = content.replace(/\.pickupLocation as any/g, '.pickupLocation as Record<string, unknown>');
  content = content.replace(/\.deliveryLocation as any/g, '.deliveryLocation as Record<string, unknown>');
  content = content.replace(/\.currentLocation as any/g, '.currentLocation as Record<string, unknown>');

  // ── [] as any[] -> [] as unknown[] ──
  content = content.replace(/\[\] as any\[\]/g, '[] as unknown[]');

  // ── (rows as any[]) -> (rows as unknown[]) ──
  content = content.replace(/\(rows as any\[\]\)/g, '(rows as unknown[])');
  content = content.replace(/\(truckRows as any\[\]\)/g, '(truckRows as unknown[])');
  content = content.replace(/\(available as any\[\]\)/g, '(available as unknown[])');

  // ── (result as any).insertId || (result as any)[0]?.insertId || 0 ──
  content = content.replace(
    /\(result as any\)\.insertId \|\| \(result as any\)\[0\]\?\.insertId \|\| 0/g,
    '(result as unknown as { insertId: number }).insertId || 0'
  );
  content = content.replace(
    /\(result as any\)\.insertId \|\| \(result as any\)\[0\]\?\.insertId/g,
    '(result as unknown as { insertId: number }).insertId'
  );
  content = content.replace(/\(result as any\)\.insertId/g, '(result as unknown as { insertId: number }).insertId');
  content = content.replace(/\(result as any\)\?\.insertId/g, '(result as unknown as { insertId?: number })?.insertId');
  content = content.replace(/\(result as any\)\[0\]\?\.insertId/g, '(result as unknown as [{ insertId?: number }])[0]?.insertId');

  // ── (inserted as any).insertId ──
  content = content.replace(/\(inserted as any\)\.insertId/g, '(inserted as unknown as { insertId: number }).insertId');

  // ── (result as any)[0]?.affectedRows ──
  content = content.replace(
    /\(result as any\)\[0\]\?\.affectedRows/g,
    '(result as unknown as [{ affectedRows?: number }])[0]?.affectedRows'
  );

  // ── ) as any; for SQL execute results -> ) as unknown[]; ──
  content = content.replace(/\) as any;/g, ') as unknown[];');

  // ── (result as unknown as any[][]) -> (result as unknown as Record<string, unknown>[][]) ──
  content = content.replace(/as unknown as any\[\]\[\]/g, 'as unknown as Record<string, unknown>[][]');

  // ── (... as any[]) for rows ──
  // (modeRows as unknown as any[]) -> (modeRows as unknown as Record<string, unknown>[])
  content = content.replace(/as unknown as any\[\]/g, 'as unknown as Record<string, unknown>[]');

  // ── metadata as any -> metadata as Record<string, unknown> ──
  content = content.replace(/metadata as any/g, 'metadata as Record<string, unknown>');
  content = content.replace(/\.metadata as any/g, '.metadata as Record<string, unknown>');

  // ── error catches: (err as any)?.message -> (err as Error)?.message ──
  content = content.replace(/\(err as any\)\?\.message/g, '(err as Error)?.message');
  content = content.replace(/\(e as any\)\?\.message/g, '(e as Error)?.message');
  content = content.replace(/\(wsErr as any\)\?\.message/g, '(wsErr as Error)?.message');
  content = content.replace(/\(bulkErr as any\)\?\.message/g, '(bulkErr as Error)?.message');
  content = content.replace(/\(triggerErr as any\)\?\.message/g, '(triggerErr as Error)?.message');

  // ── } as any).$returningId() -> } as typeof TABLE.$inferInsert).$returningId()
  // This is tricky as we need to know the table. Use a generic approach:
  // } as any) -> remove the cast (let TS infer), or use specific types
  // For now, replace with a safe pattern
  content = content.replace(/\} as any\)\.\$returningId\(\)/g, '} as Record<string, unknown>).$returningId()');

  // ── } as any) for insert/update values without $returningId ──
  content = content.replace(/\} as any\)/g, '} as Record<string, unknown>)');

  // ── "string_literal" as any for enum column filters ──
  // eq(table.status, "value" as any) patterns
  // Replace with cast to the column's type using a safe cast
  content = content.replace(/"([^"]+)" as any/g, (match, val) => {
    // For common status/type enum values, just remove 'as any' and let TS infer
    // Use 'as string' which is safe for enum comparison
    return `"${val}" as string`;
  });

  // ── 'string_literal' as any ──
  content = content.replace(/'([^']+)' as any/g, (match, val) => {
    return `'${val}' as string`;
  });

  // ── (user as any)?.companyId -> user?.companyId ──
  content = content.replace(/\(user as any\)\?\.companyId/g, '(user as { companyId?: number })?.companyId');
  content = content.replace(/\(user as any\)\?\.role/g, '(user as { role?: string })?.role');
  content = content.replace(/\(user as any\)\?\.name/g, '(user as { name?: string | null })?.name');
  content = content.replace(/\(user as any\)\?\.email/g, '(user as { email?: string | null })?.email');

  // ── (bidderUser as any)?.companyId ──
  content = content.replace(/\(bidderUser as any\)\?\.companyId/g, 'bidderUser?.companyId');

  // ── (load as any)?.prop ──
  content = content.replace(/\(load as any\)\?\.(\w+)/g, '(load as Record<string, unknown>)?.$1');
  content = content.replace(/\(load as any\)\.(\w+)/g, '(load as Record<string, unknown>).$1');

  // ── (safety as any)?.safetyRating ──
  content = content.replace(/\(safety as any\)\?\.(\w+)/g, '(safety as Record<string, unknown>)?.$1');

  // ── (m as any).packingGroup ──
  content = content.replace(/\(m as any\)\.(\w+)/g, '(m as Record<string, unknown>).$1');

  // ── (row as any) and (r as any) ──
  content = content.replace(/\(row as any\)\.(\w+)/g, '(row as Record<string, unknown>).$1');
  content = content.replace(/\(r as any\)\.(\w+)/g, '(r as Record<string, unknown>).$1');
  content = content.replace(/\(s as any\)\.(\w+)/g, '(s as Record<string, unknown>).$1');

  // ── (hit.metadata || {}) as any ──
  content = content.replace(/\(hit\.metadata \|\| \{\}\) as any/g, '(hit.metadata || {}) as Record<string, unknown>');

  // ── sodaRecords = await resp.json() as any[] ──
  content = content.replace(/as any\[\]/g, 'as unknown[]');

  // ── (input as any)[key] ──
  content = content.replace(/\(input as any\)\[/g, '(input as Record<string, unknown>)[');
  content = content.replace(/\(input as any\)\.(\w+)/g, '(input as Record<string, unknown>).$1');

  // ── (p.stats as any) ──
  content = content.replace(/\(p\.stats as any\)/g, '(p.stats as Record<string, unknown>)');

  // ── (extCache as any)[key] ──
  content = content.replace(/\(extCache as any\)\[/g, '(extCache as Record<string, unknown>)[');

  // ── const user = ctx.user as any ──
  content = content.replace(/const user = ctx\.user as any/g, 'const user = ctx.user!');

  // ── (db as any).execute ──
  content = content.replace(/\(db as any\)\.execute/g, 'db.execute');

  // ── f: any in external API map callbacks ──
  // (f: any) => ... for external API responses - leave these as they're typing callback params

  // ── role as any for insert values ──
  content = content.replace(/role as any/g, 'role as string');

  // ── CDL_ENDORSEMENTS.includes(e as any) ──
  content = content.replace(/\.includes\(e as any\)/g, '.includes(e as string)');

  // ── catch (err: any) -> catch (err: unknown) ──
  content = content.replace(/catch \(err: any\)/g, 'catch (err: unknown)');
  content = content.replace(/catch \(e: any\)/g, 'catch (e: unknown)');

  // ── (p: any) in map/forEach type annotations — be careful, only fix specific known patterns
  // Leave callback param types alone since they need context

  // ── Clean up double-casted patterns: as Record<string, unknown> as string ──
  // These shouldn't happen normally

  if (content !== original) {
    fs.writeFileSync(file, content);
    const remaining = (content.match(/as any/g) || []).length;
    if (remaining > 0) {
      // Count remaining
      const lines = content.split('\n');
      const matches = lines.filter(l => l.includes('as any')).map((l, i) => `  ${lines.indexOf(l) + 1}: ${l.trim().substring(0, 100)}`);
      console.log(`${path.basename(file)}: fixed, ${remaining} remaining:`);
      matches.forEach(m => console.log(m));
    } else {
      console.log(`${path.basename(file)}: fully fixed`);
    }
    totalFixed++;
  }
}

console.log(`\nTotal files modified: ${totalFixed}`);
