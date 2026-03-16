import { pool } from "../config/database";
import { logger } from "../utils/logger";
import fs from "fs";
import path from "path";

async function runMigration() {
  const sqlPath = path.join(__dirname, "../database/migration_phase2.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  try {
    await pool.query(sql);
    logger.info("Phase 2 migration completed successfully");
    console.log("✅ Phase 2 migration completed: invoices table created");
  } catch (error) {
    logger.error("Phase 2 migration failed:", error);
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
