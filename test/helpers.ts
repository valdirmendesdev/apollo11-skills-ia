import type { Express } from "express";
import { SignJWT } from "jose";
import request from "supertest";
import { afterAll, beforeEach, expect } from "vitest";
import { createApp } from "../src/app.js";
import { createPool, TEST_DATABASE_URL } from "../src/db.js";

export const TEST_JWT_SECRET = "test-secret-at-least-32-bytes-long!!";

export function setupTestApp() {
  const pool = createPool(TEST_DATABASE_URL);
  let now = new Date("2026-11-23T12:00:00Z");
  const clock = {
    now: () => now,
    set: (d: Date) => {
      now = d;
    },
  };
  const app = createApp({ primary: pool, read: pool, clock, auth: { secret: TEST_JWT_SECRET } });

  beforeEach(() => resetData(pool));
  afterAll(() => pool.end());

  return { app, clock };
}

async function resetData(pool: ReturnType<typeof createPool>) {
  const { rows } = await pool.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'schema_migrations'",
  );
  if (rows.length === 0) return;
  await pool.query(`TRUNCATE ${rows.map((r) => `"${r.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`);
}

type TokenOptions = { sub?: string | null; secret?: string; expiresAt?: Date };

/** Signs a JWT like the external identity provider would. `sub: null` omits the subject. */
export async function tokenFor({
  sub = "user-neil",
  secret = TEST_JWT_SECRET,
  expiresAt = new Date(Date.now() + 3_600_000),
}: TokenOptions = {}) {
  const jwt = new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expiresAt);
  if (sub !== null) jwt.setSubject(sub);
  return jwt.sign(new TextEncoder().encode(secret));
}

/** Request builder pre-authenticated as `sub`. */
export async function as(app: Express, sub: string) {
  const auth = `Bearer ${await tokenFor({ sub })}`;
  return {
    get: (url: string) => request(app).get(url).set("Authorization", auth),
    put: (url: string) => request(app).put(url).set("Authorization", auth),
    post: (url: string) => request(app).post(url).set("Authorization", auth),
    patch: (url: string) => request(app).patch(url).set("Authorization", auth),
    delete: (url: string) => request(app).delete(url).set("Authorization", auth),
  };
}

export function expectProblem(res: request.Response, status: number, type: string) {
  expect(res.status).toBe(status);
  expect(res.headers["content-type"]).toMatch(/^application\/problem\+json/);
  expect(res.body).toMatchObject({ type: `/problems/${type}`, status });
  expect(res.body.title).toEqual(expect.any(String));
}
