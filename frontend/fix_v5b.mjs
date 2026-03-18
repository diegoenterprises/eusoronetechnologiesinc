/**
 * Fix `) as never;` patterns that break when the result is used.
 * Replace with just `)` — the db.execute() return type is fine on its own.
 * For cases where it still needs a cast, use unsafeCast().
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

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Replace `) as never;` with `);`
  // This removes the type cast entirely - the function return type will be used.
  content = content.replace(/\) as never;/g, ');');

  // Also fix remaining `e.message` patterns in catch blocks that were missed
  {
    const lines = content.split('\n');
    let inCatch = false, catchVar = '', braceDepth = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const catchMatch = line.match(/catch \((\w+): unknown\)/);
      if (catchMatch) {
        inCatch = true; catchVar = catchMatch[1]; braceDepth = 0;
        for (const ch of line) { if (ch === '{') braceDepth++; if (ch === '}') braceDepth--; }
        continue;
      }
      if (inCatch) {
        for (const ch of line) { if (ch === '{') braceDepth++; if (ch === '}') braceDepth--; }
        if (braceDepth <= 0) { inCatch = false; continue; }
        const v = catchVar;
        if ((line.includes(`${v}.message`) || line.includes(`${v}?.message`)) && !line.includes(`(${v} as Error)`)) {
          lines[i] = line
            .replace(new RegExp(`\\b${v}\\?\\.message\\b`, 'g'), `(${v} as Error)?.message`)
            .replace(new RegExp(`(?<!Error\\.)\\b${v}\\.message\\b`, 'g'), `(${v} as Error).message`);
        }
      }
    }
    content = lines.join('\n');
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    totalFixed++;
  }
}

console.log(`Files modified: ${totalFixed}`);
