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

  const conn = await mysql2.createConnection({ uri: dbUrl, multipleStatements: true });
  console.log("Connected to database");

  const sqlFile = path.join(__dirname, "hotzones_tables.sql");
  const sqlContent = fs.readFileSync(sqlFile, "utf-8");

  // Split on semicolons, filter empty/comment-only blocks
  const statements = sqlContent
    .split(";")
    .map((s) => s.replace(/--[^\n]*/g, "").trim())
    .filter((s) => s.length > 10);

  let created = 0;
  let existed = 0;
  let other = 0;

  for (const stmt of statements) {
    try {
      await conn.query(stmt);
      if (/CREATE TABLE/i.test(stmt)) {
        const match = stmt.match(/CREATE TABLE.*?(\w+)\s*\(/i);
        console.log(`  Created: ${match?.[1] || "?"}`);
        created++;
      } else if (/INSERT/i.test(stmt)) {
        console.log("  Inserted seed data");
        other++;
      } else if (/SELECT/i.test(stmt)) {
        other++;
      }
    } catch (e: any) {
      if (e.code === "ER_TABLE_EXISTS_ERROR") {
        const match = stmt.match(/CREATE TABLE.*?(\w+)\s*\(/i);
        console.log(`  Exists:  ${match?.[1] || "?"}`);
        existed++;
      } else {
        console.error("  Error:", e.message?.slice(0, 200));
      }
    }
  }

  await conn.end();
  console.log(`\nMigration complete: ${created} created, ${existed} already existed, ${other} other statements`);
}

run().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
