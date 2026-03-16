import { pool } from "../config/database";
import * as fs from "fs";
import * as path from "path";

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "../database/migration_chat.sql"), "utf8");
  await pool.query(sql);
  console.log("Chat migration complete.");
  await pool.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
