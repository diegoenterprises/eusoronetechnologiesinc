const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("No DATABASE_URL"); process.exit(1); }
  console.log("Connecting to DB...");
  const conn = await mysql.createConnection({ uri: url, ssl: { rejectUnauthorized: false } });

  const sqlFile = fs.readFileSync(path.join(__dirname, "0025_developer_portal_tables.sql"), "utf8");

  // Strip comment lines, then split on semicolons
  const cleaned = sqlFile.split("\n").filter(l => !l.trimStart().startsWith("--")).join("\n");
  const statements = cleaned
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 10);

  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, " ").substring(0, 80);
    console.log("Executing:", preview + "...");
    await conn.execute(stmt);
    console.log("  -> OK");
  }

  // Verify
  const [tables] = await conn.execute("SHOW TABLES LIKE 'developer%'");
  console.log("\nDeveloper tables:", tables.map(t => Object.values(t)[0]));

  await conn.end();
  console.log("Migration 0025 complete!");
}

run().catch(e => { console.error("ERROR:", e.message); process.exit(1); });
