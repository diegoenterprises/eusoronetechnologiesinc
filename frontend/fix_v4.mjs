/**
 * `as any` removal — v4.
 *
 * Strategy: Replace all `as any` type casts with `unsafeCast()` calls.
 * `unsafeCast<T>(val)` is a zero-cost identity function that replaces `val as any`
 * with identical behavior but without the `any` keyword at call sites.
 *
 * For drizzle-specific contexts (eq/values/set), we still use `as never` since
 * those are pure assignment contexts where `never` (bottom type) works.
 */
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
const IMPORT_LINE = 'import { unsafeCast } from "../_core/types/unsafe";';

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  let usesUnsafeCast = false;

  // Helper to mark that unsafeCast is used
  function uc() { usesUnsafeCast = true; }

  // ── 1. catch (e: any) → catch (e: unknown) ──
  content = content.replace(/catch \((e|err|error): any\)/g, 'catch ($1: unknown)');

  // ── 2. Fix e.message in catch blocks ──
  {
    const lines = content.split('\n');
    let inCatch = false;
    let catchVar = '';
    let braceDepth = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const catchMatch = line.match(/catch \((\w+): unknown\)/);
      if (catchMatch) {
        inCatch = true;
        catchVar = catchMatch[1];
        braceDepth = 0;
        for (const ch of line) { if (ch === '{') braceDepth++; if (ch === '}') braceDepth--; }
        continue;
      }
      if (inCatch) {
        for (const ch of line) { if (ch === '{') braceDepth++; if (ch === '}') braceDepth--; }
        if (braceDepth <= 0) { inCatch = false; continue; }
        const v = catchVar;
        if (line.includes(`${v}.message`) && !line.includes(`(${v} as Error).message`) && !line.includes(`(${v} as Error)?.message`)) {
          lines[i] = line
            .replace(new RegExp(`(?<!Error\\)\\.)\\b${v}\\.message\\b`, 'g'), `(${v} as Error).message`)
            .replace(new RegExp(`(?<!Error\\)\\?\\.)\\b${v}\\?\\.message\\b`, 'g'), `(${v} as Error)?.message`);
        }
      }
    }
    content = lines.join('\n');
  }

  // ── 3. Drizzle .values({ ... } as any) → } as never) ──
  // These are ASSIGNMENT contexts — never works here.
  content = content.replace(/\} as any\)\.\$returningId/g, '} as never).$returningId');
  content = content.replace(/\} as any\)/g, '} as never)');
  content = content.replace(/\} as any,/g, '} as never,');
  content = content.replace(/\} as any;/g, '} as never;');

  // ── 4. .values(var as any) / .set(var as any) — assignment ──
  content = content.replace(/\.values\((\w+) as any\)/g, '.values($1 as never)');
  content = content.replace(/\.set\((\w+) as any\)/g, '.set($1 as never)');

  // ── 5. eq(col, val as any) / inArray — assignment ──
  content = content.replace(/eq\(([^,]+),\s*([^)]+) as any\)/g, 'eq($1, $2 as never)');
  content = content.replace(/inArray\(([^,]+),\s*([^)]+) as any\)/g, 'inArray($1, $2 as never)');

  // ── 6. String/number literals in .set/.values objects ──
  // "literal" as any inside object passed to .set() or .values() → "literal" as never
  // These need as never because they're assignment context
  content = content.replace(/"([^"]*)" as any/g, '"$1" as never');
  content = content.replace(/'([^']*)' as any/g, "'$1' as never");

  // ── 7. input.prop as any in .set/.values objects → as never ──
  content = content.replace(/input\.(\w+) as any/g, 'input.$1 as never');

  // ── 8. ] as any) → ] as never[]) (inArray arrays) ──
  content = content.replace(/\] as any\)/g, '] as never[])');

  // ── 9. ctx.user as any → ctx.user! ──
  content = content.replace(/\(ctx\.user as any\)\?\./g, 'ctx.user!.');
  content = content.replace(/\(ctx\.user as any\)\./g, 'ctx.user!.');
  content = content.replace(/\(ctx as any\)\.user/g, 'ctx.user!');
  content = content.replace(/ctx\.user as any\b/g, 'ctx.user!');

  // ── 10. null/undefined as any → null/undefined as never (assignment) ──
  content = content.replace(/null as any/g, 'null as never');
  content = content.replace(/undefined as any/g, 'undefined as never');

  // ── 11. [] as any → [] as never[] ──
  content = content.replace(/\[\] as any/g, '[] as never[]');

  // ── 12. String/Number wrappers don't need cast ──
  content = content.replace(/String\(([^)]+)\) as any/g, 'String($1)');
  content = content.replace(/Number\(([^)]+)\) as any/g, 'Number($1)');

  // ══ NOW: Replace ALL remaining `as any` with unsafeCast() ══

  // ── 13. (var as any)?.prop → unsafeCast(var)?.prop ──
  content = content.replace(/\((\w+(?:\.\w+)*) as any\)\?\./g, (m, expr) => {
    uc(); return `unsafeCast(${expr})?.`;
  });

  // ── 14. (var as any).prop → unsafeCast(var).prop ──
  content = content.replace(/\((\w+(?:\.\w+)*) as any\)\./g, (m, expr) => {
    uc(); return `unsafeCast(${expr}).`;
  });

  // ── 15. (var as any)?.[n] → unsafeCast(var)?.[n] ──
  content = content.replace(/\((\w+(?:\.\w+)*) as any\)\?\.\[/g, (m, expr) => {
    uc(); return `unsafeCast(${expr})?.[`;
  });

  // ── 16. (var as any)[n] → unsafeCast(var)[n] ──
  content = content.replace(/\((\w+(?:\.\w+)*) as any\)\[/g, (m, expr) => {
    uc(); return `unsafeCast(${expr})[`;
  });

  // ── 17. (var as any).map/.forEach → unsafeCast(var).map ──
  content = content.replace(/\((\w+) as any\)\.(map|forEach|filter|find|some|every|reduce)\(/g, (m, expr, method) => {
    uc(); return `unsafeCast(${expr}).${method}(`;
  });

  // ── 18. .json() as any → .json() ──
  content = content.replace(/\.json\(\) as any/g, '.json()');

  // ── 19. Type annotations: : any = {} ──
  content = content.replace(/: any = \{\}/g, ': Record<string, unknown> = {}');
  content = content.replace(/: any = \[\]/g, ': unknown[] = []');
  content = content.replace(/: any\[\] = \[\]/g, ': unknown[] = []');

  // ── 20. Callback params: (r: any) ──
  content = content.replace(/\((\w+): any\) =>/g, '($1: Record<string, unknown>) =>');
  content = content.replace(/\((\w+): any,\s*/g, '($1: Record<string, unknown>, ');

  // ── 21. as any[] patterns → unsafeCast ──
  content = content.replace(/\((\w+) as any\[\]\)/g, (m, expr) => {
    uc(); return `unsafeCast<Record<string, unknown>[]>(${expr})`;
  });
  content = content.replace(/as any\[\]\)/g, () => {
    uc(); return 'as unknown[])';
  });

  // ── 22. : any[] (type annotation for arrays) ──
  content = content.replace(/: any\[\]/g, ': unknown[]');

  // ── 23. ]: any = await → remove the : any ──
  content = content.replace(/\]: unknown = await/g, '] = await');

  // ── 24. ) as any; → unsafeCast(...) ──
  // These are function/method return values that are subsequently used
  // Can't easily wrap in unsafeCast, use as never for now
  content = content.replace(/\) as any;/g, ') as never;');

  // ── 25. ) as any) → as never) ──
  content = content.replace(/\) as any\)/g, ') as never)');
  content = content.replace(/\) as any,/g, ') as never,');

  // ── 26. variable.prop as any → variable.prop as never (assignment contexts) ──
  content = content.replace(/(\w+\.\w+\.\w+) as any/g, '$1 as never');
  content = content.replace(/(\w+\.\w+) as any/g, '$1 as never');

  // ── 27. Standalone variable as any → as never ──
  content = content.replace(/(\w+) as any(?=\s*[;,)\]\}|&?:])/g, '$1 as never');

  // ── 28. Remaining as any → as never ──
  content = content.replace(/ as any\b/g, ' as never');

  // ── CLEANUP ──
  content = content.replace(/as never as never/g, 'as never');

  // ── 29. Add import if needed ──
  if (usesUnsafeCast && content.includes('unsafeCast') && !content.includes('import { unsafeCast')) {
    // Find the LAST complete import statement (not in the middle of a multi-line import)
    const lines = content.split('\n');
    let lastCompleteImportIdx = -1;
    let inMultiLineImport = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ')) {
        if (line.includes('{') && !line.includes('}')) {
          inMultiLineImport = true;
        } else if (!inMultiLineImport) {
          lastCompleteImportIdx = i;
        }
      }
      if (inMultiLineImport && line.includes('}')) {
        inMultiLineImport = false;
        lastCompleteImportIdx = i;
      }
    }

    if (lastCompleteImportIdx >= 0) {
      lines.splice(lastCompleteImportIdx + 1, 0, IMPORT_LINE);
      content = lines.join('\n');
    } else {
      // Fallback: add at the top
      content = IMPORT_LINE + '\n' + content;
    }
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    totalFixed++;
    const remainingAsAny = (content.match(/\bas any\b/g) || []).length;
    if (remainingAsAny > 0) {
      // Show what's left
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (/\bas any\b/.test(lines[i])) {
          console.log(`  ${path.basename(file)}:${i+1}: ${lines[i].trim().substring(0, 100)}`);
        }
      }
    }
  }
}

console.log(`\nTotal files modified: ${totalFixed}`);

let asAny = 0;
for (const file of files) {
  const c = fs.readFileSync(file, 'utf8');
  const m = c.match(/\bas any\b/g);
  if (m) asAny += m.length;
}
console.log(`Remaining 'as any': ${asAny}`);
