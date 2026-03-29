import "dotenv/config";
import { logger } from "../_core/logger";
import mysql2 from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    logger.error("DATABASE_URL is required");
    process.exit(1);
  }

  const conn = await mysql2.createConnection(dbUrl);
  logger.info("Connected to database");

  const sqlFile = path.join(__dirname, "../../drizzle/0033_tournaments_guild_challenges.sql");
  const sql = fs.readFileSync(sqlFile, "utf-8");

  // Split by CREATE TABLE statements and run each
  const statements = sql
    .split(/(?=CREATE TABLE)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    if (!stmt.startsWith("CREATE") && !stmt.startsWith("--")) continue;
    const clean = stmt.replace(/--[^\n]*/g, "").trim();
    if (!clean) continue;
    try {
      await conn.query(clean);
      const match = clean.match(/CREATE TABLE.*?`(\w+)`/i);
      logger.info(`  Created: ${match?.[1] || "?"}`);
    } catch (e: any) {
      if (e.code === "ER_TABLE_EXISTS_ERROR") {
        const match = clean.match(/CREATE TABLE.*?`(\w+)`/i);
        logger.info(`  Exists:  ${match?.[1] || "?"}`);
      } else {
        logger.error("  Error:", e.message?.slice(0, 200));
      }
    }
  }

  // Seed starter tournaments
  const seedSql = `
    INSERT IGNORE INTO tournaments (name, description, type, status, startDate, endDate, entryFee, prizePool, maxParticipants, metric)
    VALUES
      ('Weekly Load Leader', 'Complete the most loads this week to claim the crown. Top 10 finishers earn bonus XP.', 'weekly', 'active', DATE_SUB(NOW(), INTERVAL WEEKDAY(NOW()) DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL WEEKDAY(NOW()) DAY), INTERVAL 7 DAY), 50, 500, 100, 'loads_completed'),
      ('Monthly Mile Master', 'Drive the most miles this month. Long-haul legends rise to the top!', 'monthly', 'active', DATE_FORMAT(NOW(), '%Y-%m-01'), LAST_DAY(NOW()), 100, 2000, 200, 'miles_driven'),
      ('Safety Champion Q2', 'Maintain the highest safety score throughout Q2 2026. Zero incidents, maximum reward.', 'seasonal', 'upcoming', '2026-04-01 00:00:00', '2026-06-30 23:59:59', 0, 5000, 500, 'safety_score');
  `;

  try {
    await conn.query(seedSql);
    logger.info("  Seeded 3 starter tournaments");
  } catch (e: any) {
    if (e.code === "ER_DUP_ENTRY") {
      logger.info("  Seed tournaments already exist");
    } else {
      logger.error("  Seed error:", e.message?.slice(0, 200));
    }
  }

  await conn.end();
  logger.info("Migration 0033 complete — tournaments & guild challenges tables");
}

run().catch((e) => {
  logger.error("Migration failed:", e);
  process.exit(1);
});
