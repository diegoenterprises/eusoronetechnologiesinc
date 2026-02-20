import mysql2 from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const conn = await mysql2.createConnection(dbUrl);
  console.log("Connected to database");

  const sqlFile = path.join(__dirname, "../../drizzle/0010_supply_chain_terminal_partners.sql");
  const sql = fs.readFileSync(sqlFile, "utf-8");

  // Split by semicolons, filter empty/comment-only
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => {
      const clean = s.replace(/--[^\n]*/g, "").trim();
      return clean.length > 0;
    });

  for (const stmt of statements) {
    const clean = stmt.replace(/--[^\n]*/g, "").trim();
    if (!clean) continue;
    try {
      await conn.query(clean);
      // Extract what we did
      if (clean.startsWith("ALTER")) {
        const match = clean.match(/ALTER TABLE (\w+)/i);
        console.log(`  ✓ Altered: ${match?.[1] || "?"}`);
      } else if (clean.startsWith("CREATE")) {
        const match = clean.match(/CREATE TABLE.*?(\w+)\s*\(/i);
        console.log(`  ✓ Created: ${match?.[1] || "?"}`);
      } else {
        console.log(`  ✓ Executed statement`);
      }
    } catch (e: any) {
      if (e.code === "ER_TABLE_EXISTS_ERROR") {
        console.log(`  ⊘ Table already exists`);
      } else if (e.code === "ER_DUP_FIELDNAME") {
        console.log(`  ⊘ Column already exists: ${e.message?.slice(0, 100)}`);
      } else if (e.code === "ER_DUP_KEYNAME") {
        console.log(`  ⊘ Index already exists: ${e.message?.slice(0, 100)}`);
      } else {
        console.error(`  ✗ Error: ${e.message?.slice(0, 200)}`);
      }
    }
  }

  await conn.end();
  console.log("\nMigration 0010 (Supply Chain) complete");
}

run().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
