/**
 * Fix remaining TS errors from `as any` removal.
 *
 * 1. db.execute() results used with .map/.forEach → wrap with unsafeCast()
 * 2. Remaining `as never` on variables that are later used → replace with unsafeCast()
 * 3. Remaining e.message in catch blocks
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

  // FIX 1: Find db.execute() results that are destructured and then used with .map/.forEach etc.
  // Pattern: const [varName] = await db.execute(...);\n...\nvarName.map
  // Fix: add unsafeCast() around the destructured variable usage
  // Actually, it's easier to wrap the execute result:
  // const [rows] = await db.execute(sql`...`);
  // → const [rows] = unsafeCast(await db.execute(sql`...`));
  content = content.replace(
    /const \[(\w+)\] = (await db\.execute\()/g,
    (match, varName, execCall) => {
      needsImport = true;
      return `const [${varName}] = unsafeCast(${execCall}`;
    }
  );
  // Close the unsafeCast paren: need to find the matching `)` after db.execute(sql`...`)
  // This is hard with regex. Instead, let me just add `)` before `;` on lines that have
  // `unsafeCast(await db.execute(`
  // Actually the regex above already changes `const [rows] = await db.execute(`
  // to `const [rows] = unsafeCast(await db.execute(`
  // But we need to close the unsafeCast. The execute call ends with `);`
  // so the line will have `...unsafeCast(await db.execute(sql\`...\`));`
  // We need it to be `...unsafeCast(await db.execute(sql\`...\`)));`
  // i.e., add one more `)` before `;`
  //
  // Hmm, but the SQL template might span multiple lines.
  // Let me take a different approach: instead of wrapping the execute call,
  // wrap the USAGE of the result variable.

  // Revert the execute wrapping (too complex)
  content = content.replace(
    /const \[(\w+)\] = unsafeCast\((await db\.execute\()/g,
    'const [$1] = $2'
  );

  // Instead: find patterns where the result of destructured db.execute is used
  // and wrap just the variable usage with unsafeCast()
  // e.g., rows.map(...) → unsafeCast(rows).map(...)
  // e.g., rows.forEach(...) → unsafeCast(rows).forEach(...)
  // e.g., rows[0] → unsafeCast(rows)[0]

  // Collect all variables from `const [varName] = await db.execute(`
  const execVars = new Set();
  const execPattern = /const \[(\w+)\] = await db\.execute\(/g;
  let m;
  while ((m = execPattern.exec(content)) !== null) {
    execVars.add(m[1]);
  }

  // Also from: const [varName] = await db.execute(\nsql`...`\n);
  // (multi-line - already captured by the above since we only look for the first line)

  // For each exec variable, wrap usages with unsafeCast() ONLY where needed
  for (const v of execVars) {
    // Pattern: varName.map( → unsafeCast(varName).map(
    content = content.replace(
      new RegExp(`(?<!unsafeCast\\()\\b${v}\\.(map|forEach|filter|find|some|every|reduce|length|slice|flat|flatMap)\\(`, 'g'),
      (match, method) => { needsImport = true; return `unsafeCast(${v}).${method}(`; }
    );
    // Pattern: varName[0] → unsafeCast(varName)[0]
    content = content.replace(
      new RegExp(`(?<!unsafeCast\\()\\b${v}\\[`, 'g'),
      (match) => { needsImport = true; return `unsafeCast(${v})[`; }
    );
    // Pattern: varName?.map → unsafeCast(varName)?.map
    content = content.replace(
      new RegExp(`(?<!unsafeCast\\()\\b${v}\\?\\.`, 'g'),
      (match) => { needsImport = true; return `unsafeCast(${v})?.`; }
    );
    // Pattern: if (!varName) / if (varName) — these are OK with the union type
    // Pattern: varName.id or varName.prop — property access on row object
    // Only wrap if the property isn't from RowDataPacket or ResultSetHeader
    content = content.replace(
      new RegExp(`(?<!unsafeCast\\()(?<!\\.)\\b${v}\\.(\\w+)(?!\\()`, 'g'),
      (match, prop) => {
        // Common RowDataPacket/ResultSetHeader properties that exist
        const builtinProps = ['length', 'map', 'filter', 'forEach', 'find', 'some', 'every', 'reduce', 'insertId', 'affectedRows', 'changedRows', 'fieldCount', 'info', 'serverStatus', 'warningStatus'];
        if (builtinProps.includes(prop)) return match;
        needsImport = true;
        return `unsafeCast(${v}).${prop}`;
      }
    );
  }

  // FIX 2: Replace remaining `as never` on variables that cause type errors
  // Pattern: const varName = someExpr as never;
  // If varName is later USED (property access, method calls), `never` breaks.
  // Replace: const varName = unsafeCast(someExpr);
  content = content.replace(
    /= ([\w.]+(?:\([^)]*\))?) as never;/g,
    (match, expr) => {
      // Don't replace drizzle patterns (these are fine as never)
      if (match.includes('.values(') || match.includes('.set(') || match.includes('.$returningId()')) return match;
      needsImport = true;
      return `= unsafeCast(${expr});`;
    }
  );

  // FIX 3: (err as Error).message fix for catch blocks that the main script missed
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

  // FIX 4: Handle TS2352 — (X as Record<string, unknown>) where X doesn't overlap
  // These need double assertion
  content = content.replace(
    /\((\w+) as Record<string, unknown>\)/g,
    '($1 as unknown as Record<string, unknown>)'
  );
  content = content.replace(/as unknown as unknown as/g, 'as unknown as');

  // Add import if needed
  if (needsImport && content.includes('unsafeCast') && !content.includes('import { unsafeCast')) {
    const importLines = content.split('\n');
    let lastCompleteImportIdx = -1;
    let inMultiLineImport = false;
    for (let i = 0; i < importLines.length; i++) {
      const line = importLines[i].trim();
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
