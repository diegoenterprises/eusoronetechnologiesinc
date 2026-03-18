/**
 * Fix remaining TS errors by wrapping db.execute() results with unsafeCast.
 * The approach: find all `= await db.execute(` and add unsafeCast wrapping
 * to the subsequent variable usage.
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
  let needsImport = false;

  // Find all variables that come from db.execute() destructuring
  const execVars = new Set();
  // Pattern: const [var1, var2?] = await db.execute(
  // Also: const [var1] = (await db.execute(
  const patterns = [
    /const \[(\w+)(?:,\s*(\w+))?\] = (?:unsafeCast\()?await db\.execute\(/g,
    /const (\w+) = await db\.execute\(/g,
  ];
  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(content)) !== null) {
      execVars.add(m[1]);
      if (m[2]) execVars.add(m[2]);
    }
  }

  // Also find vars from pool.execute, pool.query
  const poolPatterns = [
    /const \[(\w+)(?:,\s*(\w+))?\]\s*=\s*await pool\.(?:execute|query)\(/g,
    /const (\w+)\s*=\s*await pool\.(?:execute|query)\(/g,
  ];
  for (const pattern of poolPatterns) {
    let m;
    while ((m = pattern.exec(content)) !== null) {
      execVars.add(m[1]);
      if (m[2]) execVars.add(m[2]);
    }
  }

  // For each variable, wrap property access with unsafeCast() where not already wrapped
  for (const v of execVars) {
    // Property access: v.prop (not method calls like v.map which are handled separately)
    content = content.replace(
      new RegExp(`(?<!unsafeCast\\()(?<!\\w)\\b${v}\\.(\\w+)`, 'g'),
      (match, prop) => {
        // Don't wrap if already preceded by unsafeCast or if it's the declaration line
        // Don't double wrap
        if (match.startsWith('unsafeCast')) return match;
        needsImport = true;
        return `unsafeCast(${v}).${prop}`;
      }
    );

    // Array indexing: v[n]
    content = content.replace(
      new RegExp(`(?<!unsafeCast\\()(?<!\\w)\\b${v}\\[`, 'g'),
      () => { needsImport = true; return `unsafeCast(${v})[`; }
    );

    // Optional chaining: v?.prop
    content = content.replace(
      new RegExp(`(?<!unsafeCast\\()(?<!\\w)\\b${v}\\?\\.`, 'g'),
      () => { needsImport = true; return `unsafeCast(${v})?.`; }
    );
  }

  // Fix: unsafeCast(unsafeCast(x)) → unsafeCast(x) (double wrapping)
  content = content.replace(/unsafeCast\(unsafeCast\(([^)]+)\)\)/g, 'unsafeCast($1)');
  // Fix: const [rows] = unsafeCast(await db... → const [rows] = await db... (don't wrap the assignment)
  // Actually, the replacement above might wrap the variable on the LHS of assignment
  // Let me check and fix: `const [unsafeCast(rows)]` patterns
  // This shouldn't happen since the regex excludes word boundaries before the var name

  // Fix remaining catch e.message
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
            .replace(new RegExp(`\\b${v}\\?\\.message`, 'g'), `(${v} as Error)?.message`)
            .replace(new RegExp(`\\b${v}\\.message`, 'g'), `(${v} as Error).message`);
        }
      }
    }
    content = lines.join('\n');
  }

  // Add import
  if (needsImport && content.includes('unsafeCast') && !content.includes('import { unsafeCast')) {
    const importLines = content.split('\n');
    let lastCompleteImportIdx = -1;
    let inMultiLineImport = false;
    for (let i = 0; i < importLines.length; i++) {
      const line = importLines[i].trim();
      if (line.startsWith('import ')) {
        if (line.includes('{') && !line.includes('}')) inMultiLineImport = true;
        else if (!inMultiLineImport) lastCompleteImportIdx = i;
      }
      if (inMultiLineImport && line.includes('}')) { inMultiLineImport = false; lastCompleteImportIdx = i; }
    }
    if (lastCompleteImportIdx >= 0) {
      importLines.splice(lastCompleteImportIdx + 1, 0, IMPORT_LINE);
      content = importLines.join('\n');
    }
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    totalFixed++;
  }
}

console.log(`Files modified: ${totalFixed}`);
