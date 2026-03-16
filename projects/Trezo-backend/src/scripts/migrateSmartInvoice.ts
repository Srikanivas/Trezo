import * as fs from "fs";
import * as path from "path";
import { pool } from "../config/database";

async function migrate() {
  const sqlPath = path.join(__dirname, "../database/migration_smart_invoice.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  console.log("Running Smart Invoice migration...");
  try {
    await pool.query(sql);
    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
