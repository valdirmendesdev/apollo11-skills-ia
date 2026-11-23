import pg from "pg";

export const DEFAULT_DATABASE_URL = "postgres://apollo:apollo@localhost:5544/apollo";

export const TEST_DATABASE_NAME = "apollo_test";

export const TEST_DATABASE_URL = `postgres://apollo:apollo@localhost:5544/${TEST_DATABASE_NAME}`;

export function createPool(connectionString = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL) {
  return new pg.Pool({ connectionString });
}
