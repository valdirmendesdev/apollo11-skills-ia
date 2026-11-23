import pg from "pg";
import { migrate } from "../scripts/migrate.js";

const ADMIN_URL = "postgres://apollo:apollo@localhost:5544/apollo";
export const TEST_DATABASE_URL = "postgres://apollo:apollo@localhost:5544/apollo_test";

export default async function setup() {
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query("DROP DATABASE IF EXISTS apollo_test WITH (FORCE)");
  await admin.query("CREATE DATABASE apollo_test");
  await admin.end();

  const pool = new pg.Pool({ connectionString: TEST_DATABASE_URL });
  await migrate(pool);
  await pool.end();
}
