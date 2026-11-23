import { readFile } from "node:fs/promises";
import type pg from "pg";
import { createPool } from "../src/db.js";

export async function migrate(pool: pg.Pool) {
  const sql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  await pool.query(sql);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pool = createPool();
  await migrate(pool);
  await pool.end();
  console.log("schema applied");
}
