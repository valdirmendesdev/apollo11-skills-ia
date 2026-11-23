import pg from "pg";

export const DEFAULT_DATABASE_URL = "postgres://apollo:apollo@localhost:5544/apollo";

export const TEST_DATABASE_URL = "postgres://apollo:apollo@localhost:5544/apollo_test";

export function createPool(connectionString = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL) {
  return new pg.Pool({ connectionString });
}

export async function resetData(pool: pg.Pool) {
  await pool.query(
    "TRUNCATE customers, charges, idempotency_keys, products, orders, order_items RESTART IDENTITY CASCADE",
  );
}
