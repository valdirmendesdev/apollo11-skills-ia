import pg from "pg";
import { afterAll, beforeEach } from "vitest";
import { createApp } from "../src/app.js";

export function setupTestApp() {
  const pool = new pg.Pool({ connectionString: "postgres://apollo:apollo@localhost:5544/apollo_test" });
  const app = createApp(pool);

  beforeEach(async () => {
    await pool.query(
      "TRUNCATE customers, charges, idempotency_keys, products, orders, order_items RESTART IDENTITY CASCADE",
    );
  });
  afterAll(() => pool.end());

  return { app, pool };
}
