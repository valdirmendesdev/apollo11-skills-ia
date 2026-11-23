import type { RequestHandler } from "express";
import type pg from "pg";

/**
 * Makes a route safe to retry: when a client repeats a request with the same
 * `Idempotency-Key` header, the stored response is replayed instead of running
 * the handler again.
 */
export function idempotent(pool: pg.Pool): RequestHandler {
  return async (req, res, next) => {
    const key = req.header("Idempotency-Key");
    if (!key) {
      res.status(400).json({ error: "Idempotency-Key header is required" });
      return;
    }

    const stored = await pool.query<{ status_code: number; body: unknown }>(
      "SELECT status_code, body FROM idempotency_keys WHERE key = $1",
      [key],
    );
    const hit = stored.rows[0];
    if (hit) {
      res.status(hit.status_code).json(hit.body);
      return;
    }

    const json = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode < 500) {
        pool
          .query(
            `INSERT INTO idempotency_keys (key, status_code, body)
             VALUES ($1, $2, $3)
             ON CONFLICT (key) DO NOTHING`,
            [key, res.statusCode, JSON.stringify(body)],
          )
          .then(() => json(body), next);
        return res;
      }
      return json(body);
    };

    next();
  };
}
