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

  // Pattern: (expression) as any → (expression) as string
  // e.g., (severityMap[input.severity] || 'minor') as any
  // e.g., (typeMap[input.type] || 'near_miss') as any
  // e.g., (statusMap[input.status] || 'reported') as any
  content = content.replace(/\((\w+Map\[[^\]]+\](?:\s*\|\|\s*(?:'[^']*'|"[^"]*"|input\.\w+))?)\) as any/g, '($1) as string');

  // Pattern: encryptJSON(...) as any → encryptJSON(...) as unknown
  content = content.replace(/encryptJSON\(([^)]+)\) as any/g, 'encryptJSON($1) as unknown');

  // Pattern: inArray(col, [...] as any) → remove the cast
  content = content.replace(/\] as any\)/g, '] as string[])');

  // Pattern: [] as any → [] as unknown[]
  content = content.replace(/\[\] as any/g, '[] as unknown[]');

  // Pattern: ) as any at end of expression (SQL execute results)
  content = content.replace(/\) as any$/gm, ') as unknown[]');

  // Pattern: statusMap[input.action] as any → statusMap[input.action] as string
  content = content.replace(/(\w+Map\[[^\]]+\]) as any/g, '$1 as string');

  // Pattern: (t.type || "DEMURRAGE") as any → (t.type || "DEMURRAGE") as string
  content = content.replace(/\(t\.type \|\| "DEMURRAGE"\) as any/g, '(t.type || "DEMURRAGE") as string');

  // Pattern: typeMap[input.type] as any → typeMap[input.type] as string
  content = content.replace(/typeMap\[input\.type\] as any/g, 'typeMap[input.type] as string');

  // Pattern: (roleMap[input.type] || 'SHIPPER') as any
  content = content.replace(/\(roleMap\[input\.type\] \|\| 'SHIPPER'\) as any/g, "(roleMap[input.type] || 'SHIPPER') as string");

  if (content !== original) {
    fs.writeFileSync(file, content);
    const remaining = (content.match(/as any/g) || []).length;
    if (remaining > 0) {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('as any')) {
          console.log(`${path.basename(file)}:${i + 1}: ${lines[i].trim().substring(0, 120)}`);
        }
      }
    } else {
      console.log(`${path.basename(file)}: fully fixed`);
    }
    totalFixed++;
  }
}

console.log(`\nTotal files modified: ${totalFixed}`);

let totalRemaining = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const count = (content.match(/as any/g) || []).length;
  totalRemaining += count;
}
console.log(`Total remaining 'as any' across all target files: ${totalRemaining}`);
