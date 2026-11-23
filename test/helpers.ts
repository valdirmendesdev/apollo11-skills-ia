import { afterAll, beforeEach } from "vitest";
import { createApp } from "../src/app.js";
import { createPool, resetData, TEST_DATABASE_URL } from "../src/db.js";

export function setupTestApp() {
  const pool = createPool(TEST_DATABASE_URL);
  const app = createApp(pool);

  beforeEach(() => resetData(pool));
  afterAll(() => pool.end());

  return { app, pool };
}
