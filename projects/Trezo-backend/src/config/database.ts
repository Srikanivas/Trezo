import dotenv from "dotenv";
import { Pool } from "pg";
import { logger } from "../utils/logger";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  min: 1,
  idleTimeoutMillis: 30000, // release idle clients after 30s (before Neon kills them at ~5min)
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: false,
});

// Swallow unexpected termination errors — pool will auto-reconnect on next query
pool.on("error", (err) => {
  logger.warn("pg pool client error (will reconnect):", err.message);
});

pool
  .connect()
  .then((client) => {
    logger.info("Connected to Neon PostgreSQL database");
    client.release();
  })
  .catch((err) => {
    logger.error("PostgreSQL connection error:", err.message);
  });
