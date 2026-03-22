/**
 * Run migration 0029 — Vessel/Maritime + Intermodal + DVIR tables
 * Usage: node drizzle/run0029.cjs
 */
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }
  const conn = await mysql.createConnection(url);
  const sql = fs.readFileSync(path.join(__dirname, "0029_vessel_intermodal_tables.sql"), "utf8");
  const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith("--"));
  console.log(`Running ${statements.length} statements...`);
  let ok = 0, skip = 0, fail = 0;
  for (const stmt of statements) {
    try {
      await conn.execute(stmt);
      ok++;
    } catch (e) {
      if (e.code === "ER_TABLE_EXISTS_ERROR" || e.message?.includes("already exists")) {
        skip++;
      } else {
        console.error(`FAIL: ${stmt.substring(0, 80)}...`, e.message);
        fail++;
      }
    }
  }
  console.log(`Done: ${ok} created, ${skip} skipped (exist), ${fail} failed`);
  await conn.end();
}
run().catch(e => { console.error(e); process.exit(1); });
