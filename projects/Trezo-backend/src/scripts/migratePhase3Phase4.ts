import { pool } from "../config/database";
import * as fs from "fs";
import * as path from "path";

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "../database/migration_phase3_phase4.sql"), "utf8");
  await pool.query(sql);
  console.log("Phase 3/4 migration complete.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
