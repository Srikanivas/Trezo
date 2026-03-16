import { readFileSync } from "fs";
import { join } from "path";
import { pool } from "../config/database";
import { logger } from "../utils/logger";

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    logger.info("Initializing PostgreSQL database schema...");

    const schemaPath = join(__dirname, "../database/schema.sql");
    const schema = readFileSync(schemaPath, "utf8");

    await client.query(schema);
    logger.info("Database schema initialized successfully");

    // Verify tables exist
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('companies', 'company_wallet_keys', 'wallet_audit_log')
    `);
    logger.info(`Tables ready: ${result.rows.map((r) => r.table_name).join(", ")}`);
  } catch (error) {
    logger.error("Error initializing database:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  initializeDatabase()
    .then(() => {
      logger.info("Database initialization completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Database initialization failed:", error);
      process.exit(1);
    });
}

export { initializeDatabase };
