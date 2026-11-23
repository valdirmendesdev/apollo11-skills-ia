import pg from "pg";
import { migrate } from "../scripts/migrate.js";
import { createPool, DEFAULT_DATABASE_URL, TEST_DATABASE_URL } from "../src/db.js";

export default async function setup() {
  const admin = new pg.Client({ connectionString: DEFAULT_DATABASE_URL });
  await admin.connect();
  await admin.query("DROP DATABASE IF EXISTS apollo_test WITH (FORCE)");
  await admin.query("CREATE DATABASE apollo_test");
  await admin.end();

  const pool = createPool(TEST_DATABASE_URL);
  await migrate(pool);
  await pool.end();
}
