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

  const sqlFile = path.join(__dirname, "document_center.sql");
  const sql = fs.readFileSync(sqlFile, "utf-8");

  // Split by CREATE TABLE statements and run each
  const statements = sql
    .split(/(?=CREATE TABLE)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    if (!stmt.startsWith("CREATE") && !stmt.startsWith("--")) continue;
    // Remove trailing comments-only blocks
    const clean = stmt.replace(/--[^\n]*/g, "").trim();
    if (!clean) continue;
    try {
      await conn.query(clean);
      // Extract table name
      const match = clean.match(/CREATE TABLE.*?`(\w+)`/i);
      console.log(`  Created: ${match?.[1] || "?"}`);
    } catch (e: any) {
      if (e.code === "ER_TABLE_EXISTS_ERROR") {
        const match = clean.match(/CREATE TABLE.*?`(\w+)`/i);
        console.log(`  Exists:  ${match?.[1] || "?"}`);
      } else {
        console.error("  Error:", e.message?.slice(0, 200));
      }
    }
  }

  await conn.end();
  console.log("Migration complete");
}

run().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
