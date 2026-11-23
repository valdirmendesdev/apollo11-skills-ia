import pg from "pg";

export const DEFAULT_DATABASE_URL = "postgres://apollo:apollo@localhost:5544/apollo";

export function createPool(connectionString = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL) {
  return new pg.Pool({ connectionString });
}
